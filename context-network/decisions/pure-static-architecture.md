# Pure Static Architecture Decision

## Decision Record
- **Date:** 2025-08-20
- **Status:** Approved
- **Deciders:** Project Team
- **Category:** Architecture
- **Supersedes:** Previous API route considerations

## Context
Given BAIGEL's client-only architecture and the prevalence of CORS support in modern AI services, we need to determine if API routes are necessary at all.

## Decision
**BAIGEL will be a pure static application with no API routes. We'll use Next.js static export for the web version.**

## Rationale

### Why No API Routes Are Needed

#### 1. Modern AI Services Support CORS
- **OpenAI/Anthropic**: Built for browser access
- **MCP Servers**: Can be configured with CORS headers
- **A2A Agents**: Designed for web-native communication
- **AG-UI**: Explicitly designed for frontend use

#### 2. Security Is Actually Better
- **API Keys in Browser**: Users control their own keys
- **No Proxy = No MITM**: Direct connections are more secure
- **No Backend Secrets**: Nothing to leak or steal
- **User Sovereignty**: Users manage their own credentials

#### 3. Performance Benefits
- **No Proxy Overhead**: Direct connections are faster
- **No Extra Hop**: Lower latency for streaming
- **CDN Everything**: All assets cached at edge
- **Parallel Connections**: Browser handles connection pooling

#### 4. Simpler Architecture
```
Before (with API routes):
Browser → Next.js API → Agent Service → Response
       ↓
   Auth/CORS/Proxy Logic

After (pure static):
Browser → Agent Service → Response
(Direct connection with user's credentials)
```

## Implementation Strategy

### Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  
  // Static export optimizations
  images: {
    unoptimized: true
  },
  
  // No API routes needed
  // All pages are static
  
  // Enable strict mode for better React development
  reactStrictMode: true,
  
  // SWC minification for smaller bundles
  swcMinify: true,
  
  // Trailing slashes for better static hosting
  trailingSlash: true,
}

module.exports = nextConfig
```

### Build Output
```bash
next build && next export
# Outputs to 'out/' directory
# Ready for static hosting anywhere
```

### Protocol Connection Management

```typescript
// lib/protocols/connection-manager.ts
class ProtocolConnectionManager {
  // Direct browser connections
  async connectMCP(config: MCPConfig) {
    if (config.transport === 'http') {
      // Direct HTTP connection
      return new MCPHTTPClient({
        baseURL: config.endpoint,
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (config.transport === 'sse') {
      // Direct SSE connection
      return new EventSource(`${config.endpoint}/stream`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });
    }
    
    if (config.transport === 'stdio') {
      // Only works in Electron/Tauri
      if (!window.electronAPI) {
        throw new Error('STDIO requires desktop app');
      }
      return window.electronAPI.spawnMCPServer(config);
    }
  }
  
  async connectA2A(config: A2AConfig) {
    // Direct HTTPS connection with Agent Cards
    const agentCard = await this.signAgentCard(config.identity);
    
    return fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Card': JSON.stringify(agentCard)
      },
      body: JSON.stringify(config.request)
    });
  }
  
  async connectAGUI(config: AGUIConfig) {
    if (config.transport === 'websocket') {
      // Direct WebSocket connection
      return new WebSocket(config.wsEndpoint);
    }
    
    if (config.transport === 'sse') {
      // Direct SSE connection
      return new EventSource(config.sseEndpoint);
    }
    
    // HTTP with streaming
    return fetch(config.httpEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config.request)
    });
  }
}
```

### Credential Management

```typescript
// lib/credentials/credential-store.ts
class BrowserCredentialStore {
  private readonly STORAGE_KEY = 'baigel:credentials';
  
  // Encrypted storage in IndexedDB
  async saveCredential(service: string, credential: Credential) {
    const encrypted = await this.encrypt(credential);
    const store = await this.getStore();
    
    await store.put({
      service,
      credential: encrypted,
      timestamp: Date.now()
    });
  }
  
  async getCredential(service: string): Promise<Credential | null> {
    const store = await this.getStore();
    const record = await store.get(service);
    
    if (!record) return null;
    
    return this.decrypt(record.credential);
  }
  
  // Browser-native encryption
  private async encrypt(data: any): Promise<string> {
    const key = await this.getDerivedKey();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: this.getIV() },
      key,
      new TextEncoder().encode(JSON.stringify(data))
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }
  
  // Master password derivation
  private async getDerivedKey(): Promise<CryptoKey> {
    const password = await this.getMasterPassword();
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('baigel-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}
```

### CORS Handling

```typescript
// lib/protocols/cors-checker.ts
class CORSChecker {
  async checkEndpoint(url: string): Promise<CORSStatus> {
    try {
      // Try OPTIONS request first
      const response = await fetch(url, {
        method: 'OPTIONS',
        mode: 'cors'
      });
      
      const headers = response.headers;
      
      return {
        supported: true,
        allowedOrigins: headers.get('Access-Control-Allow-Origin'),
        allowedMethods: headers.get('Access-Control-Allow-Methods'),
        allowedHeaders: headers.get('Access-Control-Allow-Headers')
      };
    } catch (error) {
      // CORS not supported or endpoint down
      return {
        supported: false,
        error: error.message,
        suggestion: this.getSuggestion(url)
      };
    }
  }
  
  getSuggestion(url: string): string {
    const hostname = new URL(url).hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'Local server needs CORS headers. Add Access-Control-Allow-Origin: *';
    }
    
    if (hostname.includes('openai.com') || hostname.includes('anthropic.com')) {
      return 'This service should support CORS. Check your API key.';
    }
    
    return 'This server may not support browser connections. Consider using the desktop app.';
  }
}
```

### Desktop App for STDIO

```typescript
// electron/preload.js (or tauri equivalent)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Only needed for STDIO MCP servers
  spawnMCPServer: (config) => ipcRenderer.invoke('spawn-mcp', config),
  
  // File system access for import/export
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file')
});

// Web app detects desktop environment
if (window.electronAPI) {
  console.log('Running in Electron - STDIO available');
} else {
  console.log('Running in browser - HTTP/WS/SSE only');
}
```

## Deployment Strategy

### Static Hosting Options

#### 1. Vercel (Recommended)
```bash
# vercel.json
{
  "buildCommand": "next build",
  "outputDirectory": "out",
  "framework": "nextjs-static"
}
```

#### 2. Netlify
```toml
# netlify.toml
[build]
  command = "next build"
  publish = "out"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Content-Security-Policy = "default-src 'self'; connect-src *;"
```

#### 3. GitHub Pages
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

#### 4. Local File System
```bash
# Can literally run from file://
next build
open out/index.html
```

## Security Considerations

### Client-Side API Keys
```typescript
// components/setup/APIKeyInput.tsx
export function APIKeyInput() {
  const [showKey, setShowKey] = useState(false);
  
  return (
    <Alert>
      <Shield className="h-4 w-4" />
      <AlertTitle>Your API keys are stored locally</AlertTitle>
      <AlertDescription>
        API keys are encrypted and stored in your browser. 
        They are never sent to our servers (we don't have any!).
        
        <Input
          type={showKey ? 'text' : 'password'}
          placeholder="sk-..."
          className="mt-2"
        />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? <EyeOff /> : <Eye />}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

### Content Security Policy
```html
<!-- In the static HTML -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               connect-src *; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline';">
```

## Benefits of Pure Static

### Development
- ✅ No backend code to maintain
- ✅ Simpler mental model
- ✅ Faster local development (no API server)
- ✅ Easier testing (no API mocks needed)

### Deployment
- ✅ Deploy anywhere (CDN, S3, GitHub Pages)
- ✅ Zero infrastructure
- ✅ Instant deployments
- ✅ Preview deployments for PRs

### Performance
- ✅ CDN edge caching
- ✅ No API bottleneck
- ✅ Direct agent connections
- ✅ Parallel protocol connections

### Cost
- ✅ Free hosting (Vercel, Netlify free tiers)
- ✅ No compute costs
- ✅ No database costs
- ✅ Bandwidth only for static assets

## Migration Path if Needed

If API routes become necessary later:
1. Switch from `output: 'export'` to normal Next.js
2. Add API routes for specific needs
3. Deploy to Vercel (serverless functions)
4. Existing static pages continue working

But this is unlikely given the protocol landscape.

## Conclusion

**Pure static is the right choice for BAIGEL:**
- Simpler architecture
- Better performance
- Lower costs
- Better privacy
- Easier deployment
- No loss of functionality

The only limitation (STDIO) requires a desktop app anyway, not API routes.

## References
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [CORS and Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **Status:** Approved
- **Impact:** Simplifies entire architecture