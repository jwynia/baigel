/**
 * Protocol-specific detection and parsing logic
 */

import type { 
  ProtocolType, 
  DiscoveredAgent, 
  DiscoveredTool,
  DiscoveredEndpoint,
  AuthenticationType 
} from '@/types/discovery';

/**
 * Parse A2A Agent Card response
 */
export function parseA2AAgentCard(data: any, baseUrl: string): DiscoveredAgent | null {
  try {
    if (!data.agentId) return null;

    const agent: DiscoveredAgent = {
      id: data.agentId,
      name: data.name || data.agentId,
      description: data.description,
      protocol: 'A2A',
      baseUrl,
      endpoints: [{
        url: `${baseUrl}/.well-known/agent-card.json`,
        protocol: 'A2A',
        success: true,
        data
      }],
      capabilities: data.skills?.map((s: any) => s.name || s) || [],
      tools: data.skills?.map((skill: any) => ({
        name: skill.name || skill,
        description: skill.description,
        parameters: skill.parameters
      })),
      authentication: {
        type: detectAuthType(data.authenticationSchemes),
        required: data.authenticationRequired !== false,
        description: data.authenticationDescription
      },
      metadata: {
        version: data.version,
        author: data.author,
        documentation: data.documentationUrl
      }
    };

    return agent;
  } catch (error) {
    console.error('Failed to parse A2A agent card:', error);
    return null;
  }
}

/**
 * Parse MCP tools/resources response
 */
export function parseMCPResponse(data: any, baseUrl: string, endpoint: string): DiscoveredAgent | null {
  try {
    const agent: DiscoveredAgent = {
      id: `mcp-${baseUrl.replace(/[^a-zA-Z0-9]/g, '-')}`,
      name: data.name || 'MCP Server',
      description: data.description || 'Model Context Protocol Server',
      protocol: 'MCP',
      baseUrl,
      endpoints: [{
        url: endpoint,
        protocol: 'MCP',
        success: true,
        data
      }],
      capabilities: [],
      tools: [],
      authentication: {
        type: 'api-key',
        required: false
      },
      transport: ['http', 'sse'],
      metadata: {
        version: data.mcp_version || '1.0'
      }
    };

    // Parse tools if present
    if (data.tools && Array.isArray(data.tools)) {
      agent.tools = data.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema || tool.parameters
      }));
      agent.capabilities = data.tools.map((t: any) => t.name);
    }

    // Parse resources if present
    if (data.resources && Array.isArray(data.resources)) {
      agent.capabilities.push(...data.resources.map((r: any) => `resource:${r.name}`));
    }

    // Parse models if present (OpenAI-compatible)
    if (data.data && Array.isArray(data.data)) {
      agent.tools = data.data.map((model: any) => ({
        name: model.id,
        description: `Model: ${model.id}`,
        parameters: { model: model.id }
      }));
      agent.capabilities = data.data.map((m: any) => `model:${m.id}`);
    }

    return agent;
  } catch (error) {
    console.error('Failed to parse MCP response:', error);
    return null;
  }
}

/**
 * Parse OpenAI-compatible API response
 */
export function parseOpenAIResponse(data: any, baseUrl: string): DiscoveredAgent | null {
  try {
    if (!data.data || !Array.isArray(data.data)) return null;

    const models = data.data;
    const agent: DiscoveredAgent = {
      id: `openai-${baseUrl.replace(/[^a-zA-Z0-9]/g, '-')}`,
      name: 'OpenAI-Compatible API',
      description: `${models.length} models available`,
      protocol: 'OpenAI',
      baseUrl,
      endpoints: [{
        url: `${baseUrl}/v1/models`,
        protocol: 'OpenAI',
        success: true,
        data
      }],
      capabilities: models.map((m: any) => m.id),
      tools: models.map((model: any) => ({
        name: model.id,
        description: `Model: ${model.id} (${model.owned_by || 'unknown'})`,
        parameters: {
          model: model.id,
          max_tokens: model.max_tokens,
          supports_functions: model.supports_functions
        }
      })),
      authentication: {
        type: 'bearer',
        required: true,
        description: 'API key required'
      },
      transport: ['http'],
      metadata: {
        version: data.version || '1.0',
        models_count: models.length
      }
    };

    return agent;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error);
    return null;
  }
}

/**
 * Detect protocol type from response
 */
export function detectProtocolFromResponse(data: any, headers?: Headers): ProtocolType {
  // Check headers first
  if (headers) {
    if (headers.get('x-mcp-version')) return 'MCP';
    if (headers.get('x-a2a-version')) return 'A2A';
    if (headers.get('openai-version')) return 'OpenAI';
  }

  // Check response structure
  if (data) {
    // A2A detection
    if (data.agentId && data.serviceEndpointUrl) return 'A2A';
    
    // MCP detection
    if (data.tools || data.resources || data.mcp_version) return 'MCP';
    
    // OpenAI detection
    if (data.object === 'list' && data.data && Array.isArray(data.data)) {
      if (data.data[0]?.object === 'model') return 'OpenAI';
    }
  }

  return 'Unknown';
}

/**
 * Detect authentication type from auth schemes
 */
function detectAuthType(schemes?: any[]): AuthenticationType {
  if (!schemes || schemes.length === 0) return 'none';
  
  const firstScheme = schemes[0];
  if (typeof firstScheme === 'string') {
    const lower = firstScheme.toLowerCase();
    if (lower.includes('oauth')) return 'oauth2';
    if (lower.includes('bearer')) return 'bearer';
    if (lower.includes('api')) return 'api-key';
  } else if (firstScheme?.type) {
    const lower = firstScheme.type.toLowerCase();
    if (lower.includes('oauth')) return 'oauth2';
    if (lower.includes('bearer')) return 'bearer';
    if (lower.includes('api')) return 'api-key';
  }
  
  return 'custom';
}

/**
 * Merge discovered agents from multiple endpoints
 */
export function mergeDiscoveredAgents(agents: DiscoveredAgent[]): DiscoveredAgent[] {
  const merged = new Map<string, DiscoveredAgent>();
  
  for (const agent of agents) {
    const key = `${agent.protocol}-${agent.baseUrl}`;
    const existing = merged.get(key);
    
    if (existing) {
      // Merge endpoints
      existing.endpoints.push(...agent.endpoints);
      
      // Merge tools (deduplicate by name)
      const toolNames = new Set(existing.tools?.map(t => t.name) || []);
      const newTools = agent.tools?.filter(t => !toolNames.has(t.name)) || [];
      existing.tools = [...(existing.tools || []), ...newTools];
      
      // Merge capabilities (deduplicate)
      const capSet = new Set([...(existing.capabilities || []), ...(agent.capabilities || [])]);
      existing.capabilities = Array.from(capSet);
      
      // Merge transport options
      if (agent.transport) {
        const transportSet = new Set([...(existing.transport || []), ...agent.transport]);
        existing.transport = Array.from(transportSet) as any;
      }
    } else {
      merged.set(key, agent);
    }
  }
  
  return Array.from(merged.values());
}