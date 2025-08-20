# Frontend Architecture

## Overview
The BAIGEL frontend is built with Next.js 14, React, and Shadcn UI, providing a modern, responsive interface for interacting with AI agents across multiple protocols. The architecture emphasizes modularity, type safety, and real-time communication capabilities.

## Classification
- **Domain:** Frontend Architecture
- **Stability:** Stable
- **Abstraction:** Implementation
- **Confidence:** High

## Core Architecture Principles

### Design Principles
1. **Protocol Agnosticism**: UI components don't know about specific protocols
2. **Real-time First**: Built for streaming and real-time updates
3. **Type Safety**: Full TypeScript coverage with strict mode
4. **Accessibility**: WCAG 2.1 AA compliance via Radix UI
5. **Performance**: Code splitting, lazy loading, optimistic updates

## Component Architecture

### Layer Structure
```
┌─────────────────────────────────────────┐
│         Pages (App Router)              │
├─────────────────────────────────────────┤
│         Feature Components              │
├─────────────────────────────────────────┤
│         UI Components (Shadcn)          │
├─────────────────────────────────────────┤
│         Hooks & Utilities               │
├─────────────────────────────────────────┤
│         State Management (Zustand)      │
├─────────────────────────────────────────┤
│         Protocol Abstraction            │
└─────────────────────────────────────────┘
```

### Component Categories

#### Page Components
```typescript
// app/chat/page.tsx
export default async function ChatPage() {
  return (
    <ChatLayout>
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    </ChatLayout>
  );
}
```

#### Feature Components
```typescript
// components/chat/ChatInterface.tsx
export function ChatInterface() {
  const { messages, sendMessage, isStreaming } = useChat();
  
  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <MessageList messages={messages} />
      <MessageInput 
        onSend={sendMessage}
        disabled={isStreaming}
      />
    </div>
  );
}
```

#### UI Components (Shadcn)
```typescript
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## State Management

### Zustand Store Architecture
```typescript
// stores/chat.store.ts
interface ChatState {
  // State
  messages: Message[];
  activeProtocol: ProtocolType;
  isConnected: boolean;
  isStreaming: boolean;
  
  // Actions
  addMessage: (message: Message) => void;
  updateMessage: (id: string, update: Partial<Message>) => void;
  setProtocol: (protocol: ProtocolType) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  activeProtocol: 'ag-ui',
  isConnected: false,
  isStreaming: false,
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  updateMessage: (id, update) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === id ? { ...msg, ...update } : msg
    )
  })),
  
  sendMessage: async (content) => {
    const { activeProtocol, addMessage } = get();
    
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    addMessage(userMessage);
    
    // Send via protocol adapter
    const adapter = getProtocolAdapter(activeProtocol);
    await adapter.sendMessage(content);
  }
}));
```

### TanStack Query Integration
```typescript
// hooks/useAgents.ts
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const adapter = getProtocolAdapter('a2a');
      return adapter.discoverAgents();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
}

// hooks/useTools.ts
export function useTools() {
  return useQuery({
    queryKey: ['tools', 'mcp'],
    queryFn: async () => {
      const adapter = getProtocolAdapter('mcp');
      return adapter.getAvailableTools();
    }
  });
}
```

## Real-time Communication

### Protocol Event Handling
```typescript
// hooks/useProtocolEvents.ts
export function useProtocolEvents(protocol: ProtocolType) {
  const { addMessage, updateMessage } = useChatStore();
  
  useEffect(() => {
    const adapter = getProtocolAdapter(protocol);
    
    const unsubscribe = adapter.subscribe({
      onMessage: (event) => {
        switch (event.type) {
          case 'TEXT_MESSAGE_START':
            addMessage({
              id: event.messageId,
              role: 'assistant',
              content: '',
              isStreaming: true
            });
            break;
            
          case 'TEXT_MESSAGE_CONTENT':
            updateMessage(event.messageId, {
              content: (prev) => prev + event.content
            });
            break;
            
          case 'TEXT_MESSAGE_END':
            updateMessage(event.messageId, {
              isStreaming: false,
              content: event.finalContent
            });
            break;
            
          case 'TOOL_CALL_START':
            addMessage({
              id: event.toolCallId,
              type: 'tool',
              tool: event.toolName,
              arguments: event.arguments,
              status: 'running'
            });
            break;
        }
      },
      
      onError: (error) => {
        console.error('Protocol error:', error);
        toast.error('Connection error');
      }
    });
    
    return unsubscribe;
  }, [protocol]);
}
```

### Streaming Message Display
```typescript
// components/chat/StreamingMessage.tsx
export function StreamingMessage({ message }: { message: Message }) {
  const [displayContent, setDisplayContent] = useState('');
  
  useEffect(() => {
    if (!message.isStreaming) {
      setDisplayContent(message.content);
      return;
    }
    
    // Simulate typing effect for streaming
    let index = 0;
    const interval = setInterval(() => {
      if (index < message.content.length) {
        setDisplayContent(message.content.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 10);
    
    return () => clearInterval(interval);
  }, [message.content, message.isStreaming]);
  
  return (
    <div className="flex items-start gap-3">
      <Avatar>
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{displayContent}</ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
```

## UI Component Library

### Chat Components
```typescript
// components/chat/MessageList.tsx
export function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
```

### Tool Execution UI
```typescript
// components/tools/ToolExecution.tsx
export function ToolExecution({ tool, args, result, status }: ToolExecutionProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="h-4 w-4" />
        <span className="font-mono text-sm">{tool}</span>
        <Badge variant={status === 'success' ? 'default' : 'destructive'}>
          {status}
        </Badge>
      </div>
      
      <Tabs defaultValue="args">
        <TabsList>
          <TabsTrigger value="args">Arguments</TabsTrigger>
          <TabsTrigger value="result">Result</TabsTrigger>
        </TabsList>
        
        <TabsContent value="args">
          <pre className="text-xs bg-muted p-2 rounded">
            {JSON.stringify(args, null, 2)}
          </pre>
        </TabsContent>
        
        <TabsContent value="result">
          <pre className="text-xs bg-muted p-2 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
```

### Protocol Selector
```typescript
// components/protocols/ProtocolSelector.tsx
export function ProtocolSelector() {
  const { activeProtocol, setProtocol, isConnected } = useChatStore();
  const availableProtocols = useAvailableProtocols();
  
  return (
    <Select
      value={activeProtocol}
      onValueChange={setProtocol}
      disabled={isConnected}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select protocol" />
      </SelectTrigger>
      
      <SelectContent>
        {availableProtocols.map((protocol) => (
          <SelectItem key={protocol.id} value={protocol.id}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {protocol.type}
              </Badge>
              {protocol.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

## Forms and Validation

### Message Input with Validation
```typescript
// components/chat/MessageInput.tsx
const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(4000),
  attachments: z.array(z.instanceof(File)).optional()
});

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
      attachments: []
    }
  });
  
  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    await onSend(data);
    form.reset();
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 border-t">
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Type a message..."
                    className="min-h-[60px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={disabled}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

## Theme System

### Theme Configuration
```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### CSS Variables (Shadcn)
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark theme variables ... */
  }
}
```

## Code Display

### Syntax Highlighting with Shiki
```typescript
// components/code/CodeBlock.tsx
import { codeToHtml } from 'shiki';

export async function CodeBlock({ 
  code, 
  language = 'typescript' 
}: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang: language,
    theme: 'github-dark-dimmed'
  });
  
  return (
    <div className="relative group">
      <div
        className="overflow-x-auto rounded-lg"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <CopyButton text={code} className="absolute top-2 right-2" />
    </div>
  );
}
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load heavy components
const MarkdownEditor = dynamic(
  () => import('@/components/editors/MarkdownEditor'),
  { 
    loading: () => <Skeleton className="h-[400px]" />,
    ssr: false 
  }
);

const ProtocolDebugger = dynamic(
  () => import('@/components/debug/ProtocolDebugger'),
  { ssr: false }
);
```

### Optimistic Updates
```typescript
// stores/chat.store.ts
sendMessage: async (content) => {
  // Optimistic update
  const tempId = generateId();
  const optimisticMessage = {
    id: tempId,
    role: 'user',
    content,
    status: 'sending'
  };
  
  set((state) => ({
    messages: [...state.messages, optimisticMessage]
  }));
  
  try {
    const response = await adapter.sendMessage(content);
    // Update with real ID
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === tempId ? { ...msg, id: response.id, status: 'sent' } : msg
      )
    }));
  } catch (error) {
    // Revert on error
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === tempId ? { ...msg, status: 'error' } : msg
      )
    }));
  }
};
```

### Virtual Scrolling
```typescript
// components/chat/VirtualMessageList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualMessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <Message message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Accessibility

### ARIA Labels and Roles
```typescript
// components/chat/ChatInterface.tsx
export function ChatInterface() {
  return (
    <div 
      className="flex flex-col h-full"
      role="application"
      aria-label="AI Chat Interface"
    >
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex-1 overflow-auto"
      >
        <MessageList />
      </div>
      
      <div
        role="form"
        aria-label="Message input"
        className="border-t p-4"
      >
        <MessageInput />
      </div>
    </div>
  );
}
```

### Keyboard Navigation
```typescript
// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        focusSearch();
      }
      
      // Cmd/Ctrl + /: Toggle command palette
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggleCommandPalette();
      }
      
      // Escape: Clear selection
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

## Error Handling

### Error Boundaries
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    // Send to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {this.state.error?.message || 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Strategy

### Component Testing
```typescript
// __tests__/components/MessageInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from '@/components/chat/MessageInput';

describe('MessageInput', () => {
  it('should send message on submit', async () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    const button = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(button);
    
    expect(onSend).toHaveBeenCalledWith({
      content: 'Test message',
      attachments: []
    });
  });
});
```

## Metadata
- **Created:** 2025-08-20
- **Last Updated:** 2025-08-20
- **Version:** 1.0
- **Status:** Architecture Specification