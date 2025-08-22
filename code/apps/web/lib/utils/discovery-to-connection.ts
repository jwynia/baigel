/**
 * Utilities to convert discovery results to connection configurations
 */

import type { DiscoveredAgent } from '@/types/discovery';
import type { Connection, ProtocolType } from '@/lib/types/connections';

/**
 * Convert a discovered agent to a connection configuration
 */
export function discoveredAgentToConnection(agent: DiscoveredAgent): Omit<Connection, 'id' | 'createdAt' | 'status'> {
  const baseConnection = {
    name: agent.name,
    protocol: mapProtocolType(agent.protocol),
    tags: ['discovered', ...(extractTags(agent))],
    isDefault: false,
  };

  switch (agent.protocol) {
    case 'MCP':
      return {
        ...baseConnection,
        protocol: 'mcp' as const,
        config: {
          transport: 'http' as const,
          url: agent.baseUrl,
          headers: agent.authentication?.type === 'api-key' 
            ? { 'Authorization': `Bearer ${agent.authentication.apiKey || ''}` }
            : undefined,
        },
        capabilities: {
          tools: agent.tools && agent.tools.length > 0,
          resources: agent.capabilities?.includes('resources') || false,
          prompts: agent.capabilities?.includes('prompts') || false,
        }
      } as any;

    case 'A2A':
      return {
        ...baseConnection,
        protocol: 'a2a' as const,
        config: {
          agentId: agent.id,
          endpoint: agent.baseUrl,
          identityCard: {
            name: agent.name,
            description: agent.description || '',
            capabilities: agent.capabilities || [],
            trustScore: 8, // Default trust score for discovered agents
          },
          authentication: agent.authentication ? {
            type: agent.authentication.type === 'none' ? 'none' : 
                  agent.authentication.type === 'api-key' ? 'api-key' : 'oauth',
            apiKey: agent.authentication.apiKey,
          } : { type: 'none' },
        }
      } as any;

    case 'OpenAI':
      return {
        ...baseConnection,
        protocol: 'openai' as const,
        config: {
          apiKey: agent.authentication?.apiKey || '',
          baseUrl: agent.baseUrl !== 'https://api.openai.com' ? agent.baseUrl : undefined,
          model: 'gpt-4-turbo-preview', // Default model
          maxTokens: 4096,
          temperature: 0.7,
        }
      } as any;

    case 'Workflow':
      // Workflow agents are typically MCP-based in our system
      return {
        ...baseConnection,
        protocol: 'mcp' as const,
        config: {
          transport: 'http' as const,
          url: agent.baseUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
        capabilities: {
          tools: true, // Workflows are tool-based
          resources: false,
          prompts: false,
        }
      } as any;

    default:
      // Generic fallback
      return {
        ...baseConnection,
        protocol: 'mcp' as const,
        config: {
          transport: 'http' as const,
          url: agent.baseUrl,
        }
      } as any;
  }
}

/**
 * Map discovery protocol types to connection protocol types
 */
function mapProtocolType(discoveryProtocol: string): ProtocolType {
  switch (discoveryProtocol) {
    case 'MCP':
      return 'mcp';
    case 'A2A':
      return 'a2a';
    case 'AG-UI':
      return 'ag-ui';
    case 'OpenAI':
      return 'openai';
    case 'Workflow':
      return 'mcp'; // Workflows are typically MCP-based
    default:
      return 'mcp'; // Default fallback
  }
}

/**
 * Check if a discovered agent already exists as a connection
 */
export function isAgentAlreadyConnected(agent: DiscoveredAgent, connections: Connection[]): boolean {
  return connections.some(conn => 
    conn.name === agent.name || 
    (conn as any).config?.url === agent.baseUrl ||
    (conn as any).config?.endpoint === agent.baseUrl
  );
}

/**
 * Generate a suggested connection name from a discovered agent
 */
export function generateConnectionName(agent: DiscoveredAgent): string {
  // Clean up the name for connection use
  let name = agent.name;
  
  // Remove common prefixes/suffixes
  name = name.replace(/^(Agent|Server|Service)\s+/i, '');
  name = name.replace(/\s+(Agent|Server|Service)$/i, '');
  
  // Add protocol info if helpful
  if (agent.protocol !== 'OpenAI' && agent.protocol !== 'MCP') {
    name += ` (${agent.protocol})`;
  }
  
  return name;
}

/**
 * Extract relevant tags from a discovered agent
 */
export function extractTags(agent: DiscoveredAgent): string[] {
  const tags: string[] = [];
  
  // Add protocol tag
  tags.push(agent.protocol.toLowerCase());
  
  // Add capability-based tags
  if (agent.tools && agent.tools.length > 0) {
    tags.push('tools');
  }
  
  if (agent.capabilities?.includes('streaming')) {
    tags.push('streaming');
  }
  
  if (agent.authentication?.required) {
    tags.push('authenticated');
  } else {
    tags.push('open');
  }
  
  // Add domain-specific tags based on tool names or capabilities
  const domainTags = extractDomainTags(agent);
  tags.push(...domainTags);
  
  return tags.slice(0, 5); // Limit to 5 tags
}

/**
 * Extract domain-specific tags from agent tools/capabilities
 */
function extractDomainTags(agent: DiscoveredAgent): string[] {
  const tags: string[] = [];
  const toolNames = agent.tools?.map(t => t.name.toLowerCase()) || [];
  const capabilities = agent.capabilities?.map(c => c.toLowerCase()) || [];
  
  // Common domain patterns
  const domains = [
    { keywords: ['search', 'web', 'google', 'bing'], tag: 'search' },
    { keywords: ['file', 'filesystem', 'read', 'write'], tag: 'files' },
    { keywords: ['weather', 'forecast'], tag: 'weather' },
    { keywords: ['email', 'mail', 'smtp'], tag: 'email' },
    { keywords: ['database', 'sql', 'query'], tag: 'database' },
    { keywords: ['calendar', 'schedule', 'event'], tag: 'calendar' },
    { keywords: ['image', 'vision', 'ocr'], tag: 'vision' },
    { keywords: ['audio', 'speech', 'tts'], tag: 'audio' },
  ];
  
  for (const domain of domains) {
    const hasKeyword = domain.keywords.some(keyword =>
      toolNames.some(name => name.includes(keyword)) ||
      capabilities.some(cap => cap.includes(keyword))
    );
    
    if (hasKeyword) {
      tags.push(domain.tag);
    }
  }
  
  return tags;
}