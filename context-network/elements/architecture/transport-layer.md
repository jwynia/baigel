# Transport Layer Architecture

## Overview
The transport layer provides protocol-agnostic communication mechanisms supporting all required transports: HTTP, WebSocket, Server-Sent Events (SSE), and STDIO. This layer abstracts transport complexity from protocol adapters.

## Classification
- **Domain:** Technical Architecture
- **Stability:** Stable
- **Abstraction:** Implementation
- **Confidence:** High

## Transport Requirements by Protocol

### Protocol Transport Matrix
| Protocol | HTTP | WebSocket | SSE | STDIO | gRPC |
|----------|------|-----------|-----|-------|------|
| **MCP** | ✅ Required | ❌ | ✅ Required | ✅ Required | ❌ |
| **A2A** | ✅ Required | ❌ | ✅ Required | ❌ | ❌ |
| **AG-UI** | ✅ Required | ✅ Optional | ✅ Optional | ❌ | ❌ |
| **OpenAI** | ✅ Required | ❌ | ✅ Streaming | ❌ | ❌ |
| **LangChain** | ✅ Required | ✅ Optional | ✅ Optional | ❌ | ❌ |

## Unified Transport Interface

### Base Transport Class
```typescript
abstract class Transport<T = any> {
  protected config: TransportConfig;
  protected status: TransportStatus = 'disconnected';
  protected retryPolicy: RetryPolicy;
  
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(data: T): Promise<void>;
  abstract receive(): AsyncIterator<T> | Observable<T>;
  abstract isAlive(): boolean;
  
  // Shared functionality
  protected handleError(error: Error): void {
    this.emit('error', error);
    this.retryPolicy.handleError(error);
  }
  
  protected handleReconnect(): void {
    this.emit('reconnecting');
    this.retryPolicy.scheduleRetry(() => this.connect());
  }
}
```

## HTTP Transport Implementation

### Features
- Request/Response pattern
- Streaming response support
- Automatic retry with exponential backoff
- Request interceptors for auth
- Response transformers

### Implementation
```typescript
class HTTPTransport extends Transport<HTTPMessage> {
  private client: typeof fetch;
  private interceptors: Interceptor[] = [];
  
  constructor(config: HTTPConfig) {
    super(config);
    this.setupInterceptors();
  }
  
  async send(request: HTTPRequest): Promise<HTTPResponse> {
    const finalRequest = await this.applyRequestInterceptors(request);
    
    try {
      const response = await fetch(finalRequest.url, {
        method: finalRequest.method,
        headers: this.buildHeaders(finalRequest),
        body: this.serializeBody(finalRequest.body),
        signal: AbortSignal.timeout(this.config.timeout)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  // Streaming support for SSE fallback
  async *stream(request: HTTPRequest): AsyncIterator<HTTPStreamChunk> {
    const response = await fetch(request.url, {
      ...this.buildRequestOptions(request),
      // @ts-ignore - Using streams API
      responseType: 'stream'
    });
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      yield {
        data: decoder.decode(value),
        timestamp: Date.now()
      };
    }
  }
}
```

### Configuration
```typescript
interface HTTPConfig extends TransportConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };
}
```

## WebSocket Transport Implementation

### Features
- Bidirectional communication
- Automatic reconnection
- Heartbeat/ping-pong
- Message queueing during reconnection
- Binary and text message support

### Implementation
```typescript
class WebSocketTransport extends Transport<WebSocketMessage> {
  private ws: WebSocket | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols);
        
        this.ws.onopen = () => {
          this.status = 'connected';
          this.flushMessageQueue();
          this.startHeartbeat();
          resolve();
        };
        
        this.ws.onerror = (error) => {
          this.handleError(new Error('WebSocket error'));
          reject(error);
        };
        
        this.ws.onclose = () => {
          this.status = 'disconnected';
          this.stopHeartbeat();
          this.scheduleReconnect();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  async send(message: WebSocketMessage): Promise<void> {
    if (this.status !== 'connected' || !this.ws) {
      this.messageQueue.push(message);
      return;
    }
    
    const data = this.config.binary 
      ? this.serializeBinary(message)
      : JSON.stringify(message);
    
    this.ws.send(data);
  }
  
  async *receive(): AsyncIterator<WebSocketMessage> {
    while (this.status === 'connected') {
      yield* this.messageStream();
    }
  }
  
  private startHeartbeat(): void {
    if (this.config.heartbeat) {
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, this.config.heartbeatInterval || 30000);
    }
  }
}
```

### Reconnection Strategy
```typescript
class ReconnectingWebSocket {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private reconnectDecay = 1.5;
  
  scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max_reconnect_exceeded');
      return;
    }
    
    const timeout = Math.min(
      10000,
      this.reconnectInterval * Math.pow(this.reconnectDecay, this.reconnectAttempts)
    );
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, timeout);
  }
}
```

## SSE Transport Implementation

### Features
- Server-to-client streaming
- Automatic reconnection
- Event type filtering
- Last-Event-ID support
- Polyfill for older browsers

### Implementation
```typescript
class SSETransport extends Transport<SSEMessage> {
  private eventSource: EventSource | null = null;
  private lastEventId: string | null = null;
  
  async connect(): Promise<void> {
    const url = new URL(this.config.url);
    
    if (this.lastEventId) {
      url.searchParams.set('lastEventId', this.lastEventId);
    }
    
    this.eventSource = new EventSource(url.toString(), {
      withCredentials: this.config.withCredentials
    });
    
    this.eventSource.onopen = () => {
      this.status = 'connected';
      this.emit('connected');
    };
    
    this.eventSource.onerror = (error) => {
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.handleReconnect();
      } else {
        this.handleError(new Error('SSE connection error'));
      }
    };
    
    // Register event type handlers
    if (this.config.eventTypes) {
      this.config.eventTypes.forEach(eventType => {
        this.eventSource!.addEventListener(eventType, (event) => {
          this.handleTypedEvent(eventType, event);
        });
      });
    }
    
    // Default message handler
    this.eventSource.onmessage = (event) => {
      this.handleMessage(event);
    };
  }
  
  async *receive(): AsyncIterator<SSEMessage> {
    const buffer: SSEMessage[] = [];
    
    const handler = (event: MessageEvent) => {
      buffer.push({
        id: event.lastEventId,
        event: event.type,
        data: this.parseData(event.data),
        timestamp: Date.now()
      });
    };
    
    this.eventSource?.addEventListener('message', handler);
    
    while (this.status === 'connected') {
      if (buffer.length > 0) {
        yield buffer.shift()!;
      }
      await this.sleep(10);
    }
  }
  
  private parseData(data: string): any {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
}
```

### SSE Polyfill Support
```typescript
// Use eventsource polyfill for environments without native support
import { EventSourcePolyfill } from 'eventsource';

const EventSourceImpl = typeof EventSource !== 'undefined' 
  ? EventSource 
  : EventSourcePolyfill;
```

## STDIO Transport Implementation

### Features
- Local process communication
- Supports MCP local servers
- Process lifecycle management
- Stream parsing for JSON-RPC

### Implementation
```typescript
class STDIOTransport extends Transport<STDIOMessage> {
  private process: ChildProcess | null = null;
  private parser: JSONStreamParser;
  
  async connect(): Promise<void> {
    const { command, args, env } = this.config;
    
    this.process = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.parser = new JSONStreamParser();
    
    this.process.stdout?.on('data', (data) => {
      this.parser.write(data);
    });
    
    this.process.stderr?.on('data', (data) => {
      this.emit('stderr', data.toString());
    });
    
    this.process.on('exit', (code) => {
      this.status = 'disconnected';
      this.emit('exit', code);
    });
    
    this.process.on('error', (error) => {
      this.handleError(error);
    });
    
    this.status = 'connected';
  }
  
  async send(message: STDIOMessage): Promise<void> {
    if (!this.process?.stdin) {
      throw new Error('Process not connected');
    }
    
    const data = JSON.stringify(message) + '\n';
    this.process.stdin.write(data);
  }
  
  async *receive(): AsyncIterator<STDIOMessage> {
    for await (const message of this.parser) {
      yield message;
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      await new Promise(resolve => {
        this.process!.on('exit', resolve);
        setTimeout(resolve, 5000); // Force kill after 5s
      });
      this.process = null;
    }
  }
}
```

### JSON Stream Parser
```typescript
class JSONStreamParser {
  private buffer = '';
  private messages: any[] = [];
  
  write(chunk: Buffer | string): void {
    this.buffer += chunk.toString();
    
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          this.messages.push(message);
        } catch (error) {
          this.emit('parse_error', { line, error });
        }
      }
    }
  }
  
  async *[Symbol.asyncIterator](): AsyncIterator<any> {
    while (true) {
      if (this.messages.length > 0) {
        yield this.messages.shift();
      }
      await this.sleep(10);
    }
  }
}
```

## Transport Manager

### Unified Transport Management
```typescript
class TransportManager {
  private transports = new Map<string, Transport>();
  private factories = new Map<TransportType, TransportFactory>();
  
  constructor() {
    this.registerFactory('http', () => new HTTPTransport());
    this.registerFactory('websocket', () => new WebSocketTransport());
    this.registerFactory('sse', () => new SSETransport());
    this.registerFactory('stdio', () => new STDIOTransport());
  }
  
  async createTransport(
    id: string,
    type: TransportType,
    config: TransportConfig
  ): Promise<Transport> {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Unknown transport type: ${type}`);
    }
    
    const transport = factory(config);
    await transport.connect();
    
    this.transports.set(id, transport);
    return transport;
  }
  
  getTransport(id: string): Transport | undefined {
    return this.transports.get(id);
  }
  
  async destroyTransport(id: string): Promise<void> {
    const transport = this.transports.get(id);
    if (transport) {
      await transport.disconnect();
      this.transports.delete(id);
    }
  }
  
  async destroyAll(): Promise<void> {
    await Promise.all(
      Array.from(this.transports.values()).map(t => t.disconnect())
    );
    this.transports.clear();
  }
}
```

## Error Handling

### Unified Error Types
```typescript
enum TransportErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  TIMEOUT = 'TIMEOUT',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  AUTH_FAILED = 'AUTH_FAILED',
  RATE_LIMITED = 'RATE_LIMITED'
}

class TransportError extends Error {
  constructor(
    public code: TransportErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TransportError';
  }
}
```

### Retry Policies
```typescript
interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  shouldRetry: (error: Error) => boolean;
}

const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  shouldRetry: (error) => {
    return error.code !== 'AUTH_FAILED';
  }
};
```

## Performance Optimizations

### Connection Pooling
```typescript
class ConnectionPool<T extends Transport> {
  private available: T[] = [];
  private inUse = new Set<T>();
  private factory: () => T;
  
  constructor(
    factory: () => T,
    private minSize = 2,
    private maxSize = 10
  ) {
    this.factory = factory;
    this.initialize();
  }
  
  async acquire(): Promise<T> {
    let transport = this.available.pop();
    
    if (!transport && this.inUse.size < this.maxSize) {
      transport = await this.createTransport();
    }
    
    if (!transport) {
      await this.waitForAvailable();
      transport = this.available.pop()!;
    }
    
    this.inUse.add(transport);
    return transport;
  }
  
  release(transport: T): void {
    this.inUse.delete(transport);
    if (transport.isAlive()) {
      this.available.push(transport);
    } else {
      this.replaceTransport(transport);
    }
  }
}
```

### Message Batching
```typescript
class BatchingTransport extends Transport {
  private batch: Message[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  
  async send(message: Message): Promise<void> {
    this.batch.push(message);
    
    if (this.batch.length >= this.config.batchSize) {
      await this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(
        () => this.flush(),
        this.config.batchDelay
      );
    }
  }
  
  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;
    
    const messages = this.batch.slice();
    this.batch = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    await this.sendBatch(messages);
  }
}
```

## Testing Support

### Mock Transports
```typescript
class MockTransport extends Transport {
  private responses: any[] = [];
  private requests: any[] = [];
  
  async send(data: any): Promise<void> {
    this.requests.push(data);
    
    if (this.config.autoRespond) {
      const response = this.responses.shift();
      if (response) {
        this.emit('message', response);
      }
    }
  }
  
  mockResponse(response: any): void {
    this.responses.push(response);
  }
  
  getRequests(): any[] {
    return this.requests;
  }
}
```

## Browser Compatibility

### Feature Detection
```typescript
const TransportSupport = {
  websocket: typeof WebSocket !== 'undefined',
  sse: typeof EventSource !== 'undefined',
  fetch: typeof fetch !== 'undefined',
  stdio: typeof process !== 'undefined' && process.versions?.node
};

function selectTransport(preferred: TransportType[]): TransportType {
  for (const type of preferred) {
    if (TransportSupport[type]) {
      return type;
    }
  }
  return 'http'; // Fallback
}
```

## Usage Example

### Creating Protocol-Specific Transports
```typescript
// MCP with STDIO
const mcpLocal = await transportManager.createTransport(
  'mcp-local',
  'stdio',
  {
    command: 'mcp-server',
    args: ['--mode', 'stdio'],
    env: { MCP_MODE: 'local' }
  }
);

// MCP with HTTP+SSE
const mcpRemote = await transportManager.createTransport(
  'mcp-remote',
  'http',
  {
    baseURL: 'https://mcp-server.example.com',
    headers: { Authorization: 'Bearer token' }
  }
);

// A2A with HTTPS+SSE
const a2aTransport = await transportManager.createTransport(
  'a2a',
  'sse',
  {
    url: 'https://a2a-agent.example.com/stream',
    withCredentials: true,
    eventTypes: ['agent_message', 'task_update']
  }
);

// AG-UI with WebSocket
const aguiTransport = await transportManager.createTransport(
  'ag-ui',
  'websocket',
  {
    url: 'wss://agent-ui.example.com/ws',
    protocols: ['ag-ui-v1'],
    heartbeat: true,
    binary: false
  }
);
```

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **Version:** 1.0
- **Status:** Architecture Specification