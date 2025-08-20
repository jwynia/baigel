export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold tracking-tight">
            BAIGEL
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Protocol-agnostic front-end for AI agents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold text-lg mb-2">MCP Support</h3>
            <p className="text-sm text-muted-foreground">
              Connect to Model Context Protocol servers via HTTP, SSE, and STDIO
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold text-lg mb-2">A2A Protocol</h3>
            <p className="text-sm text-muted-foreground">
              Agent-to-Agent communication with secure identity cards
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold text-lg mb-2">AG-UI Native</h3>
            <p className="text-sm text-muted-foreground">
              First-class support for Agent-GUI protocol with streaming
            </p>
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-sm text-muted-foreground">
            Named after the "everything bagel" from "Everything Everywhere All at Once"
          </p>
        </div>
      </div>
    </main>
  );
}