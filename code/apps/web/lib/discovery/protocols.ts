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
import type { DiscoveredWorkflowService } from '@/types/workflows';

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
    // Determine the MCP server base URL from the endpoint
    let mcpBaseUrl = baseUrl;
    let serverId = 'unknown';
    
    // If this is a Mastra MCP tools endpoint, extract the server ID and adjust baseUrl
    const mcpMatch = endpoint.match(/\/api\/mcp\/([^/]+)\/tools/);
    if (mcpMatch) {
      serverId = mcpMatch[1];
      mcpBaseUrl = `${baseUrl}/api/mcp/${serverId}`;
    }
    
    const agent: DiscoveredAgent = {
      id: `mcp-${serverId}`,
      name: data.name || `${serverId} Tools` || 'MCP Server',
      description: data.description || `MCP Server: ${serverId}`,
      protocol: 'MCP',
      baseUrl: mcpBaseUrl,
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
      if (!agent.capabilities) agent.capabilities = [];
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
 * Parse Workflow service response (Mastra, OpenAPI, etc.)
 * Returns an array of agents for MCP server lists, single agent for other workflows
 */
export function parseWorkflowResponse(data: any, baseUrl: string, endpoint: string): DiscoveredAgent[] {
  try {
    // Detect Mastra MCP server list specifically
    if (endpoint.includes('mcp/v0/servers') && data.servers && Array.isArray(data.servers)) {
      return parseMastraServerList(data, baseUrl, endpoint);
    }
    
    let workflowService: DiscoveredWorkflowService;
    
    // Skip generic API descriptions that don't provide actionable services
    if (endpoint.includes('openapi.json')) {
      // Check if this is a generic API spec without actionable workflow endpoints
      const paths = data.paths || {};
      const workflowPaths = Object.keys(paths).filter(path => 
        path.includes('workflow') || path.includes('execute') || path.includes('trigger') || 
        path.includes('tool') || path.includes('action')
      );
      
      // Skip generic API specs like "Mastra API" that don't have actionable endpoints
      if (workflowPaths.length === 0 || (data.info?.title === 'Mastra API' && workflowPaths.length < 3)) {
        // This is likely a generic API description - skip it since we'll get 
        // specific actionable services from more targeted endpoints
        return [];
      }
    }
    
    // Detect other workflow framework types
    if (data.info?.title?.toLowerCase().includes('mastra') || data.servers) {
      // Mastra framework detection (single service)
      workflowService = parseMastraWorkflowService(data, baseUrl, endpoint);
    } else if (data.openapi || data.swagger) {
      // Generic OpenAPI workflow service - only if it has actionable workflows
      const paths = data.paths || {};
      const workflowPaths = Object.keys(paths).filter(path => 
        path.includes('workflow') || path.includes('execute') || path.includes('trigger')
      );
      
      // Skip if no actionable workflow endpoints
      if (workflowPaths.length === 0) {
        return [];
      }
      
      workflowService = parseOpenAPIWorkflowService(data, baseUrl, endpoint);
    } else if (data.workflows || Array.isArray(data)) {
      // Generic workflow list
      workflowService = parseGenericWorkflowService(data, baseUrl, endpoint);
    } else {
      return [];
    }
    
    // Convert to DiscoveredAgent format for compatibility
    const agent: DiscoveredAgent = {
      id: workflowService.id,
      name: workflowService.name,
      description: workflowService.description,
      protocol: 'Workflow',
      baseUrl: workflowService.baseUrl,
      endpoints: [{
        url: endpoint,
        protocol: 'Workflow',
        success: true,
        data
      }],
      capabilities: workflowService.capabilities.map(cap => `workflow:${cap}`),
      tools: [], // Will be populated by workflow adapter
      authentication: workflowService.authentication,
      transport: ['http'],
      metadata: {
        version: '1.0',
        subProtocol: workflowService.subProtocol,
        workflowCount: workflowService.workflowCount,
        frameworks: workflowService.frameworks,
        schemaSupport: workflowService.schemaSupport,
        workflowEndpoints: workflowService.endpoints
      }
    };
    
    return [agent];
  } catch (error) {
    console.error('Failed to parse workflow response:', error);
    return [];
  }
}

/**
 * Parse Mastra MCP server list into individual discovered agents
 */
function parseMastraServerList(data: any, baseUrl: string, endpoint: string): DiscoveredAgent[] {
  const servers = data.servers || [];
  const agents: DiscoveredAgent[] = [];
  
  for (const server of servers) {
    const agent: DiscoveredAgent = {
      id: `mcp-${server.id}`,
      name: server.name || server.id,
      description: server.description || `MCP Server: ${server.name || server.id}`,
      protocol: 'MCP',
      baseUrl: `${baseUrl}/api/mcp/${server.id}`,
      endpoints: [{
        url: endpoint,
        protocol: 'MCP',
        success: true,
        data: server
      }],
      capabilities: [], // Will be populated when tools are loaded
      tools: [], // Will be loaded from individual server tool endpoints
      authentication: {
        type: 'none',
        required: false,
        description: 'No authentication required for Mastra MCP servers'
      },
      transport: ['http'],
      metadata: {
        version: server.version_detail?.version || '1.0',
        serverId: server.id,
        releaseDate: server.version_detail?.release_date,
        isLatest: server.version_detail?.is_latest,
        mastraEndpoint: `${baseUrl}/api/mcp/${server.id}/tools`,
        mcpHttpEndpoint: `${baseUrl}/api/mcp/${server.id}/mcp`,
        mcpSseEndpoint: `${baseUrl}/api/mcp/${server.id}/sse`
      }
    };
    
    agents.push(agent);
  }
  
  return agents;
}

/**
 * Parse Mastra-specific workflow service
 */
function parseMastraWorkflowService(data: any, baseUrl: string, endpoint: string): DiscoveredWorkflowService {
  const servers = data.servers || [];
  const serverCount = Array.isArray(servers) ? servers.length : 0;
  
  return {
    id: `mastra-${baseUrl.replace(/[^a-zA-Z0-9]/g, '-')}`,
    name: data.info?.title || 'Mastra Workflow Engine',
    description: data.info?.description || `Mastra workflow service with ${serverCount} MCP servers`,
    protocol: 'Workflow',
    subProtocol: 'Mastra',
    baseUrl,
    workflowCount: serverCount * 5, // Estimate 5 tools per server
    frameworks: ['Mastra', 'MCP'],
    capabilities: [
      'api_integrations',
      'custom_code',
      'monitoring',
      'audit_logging'
    ],
    schemaSupport: {
      input: true,
      output: true,
      validation: true,
      uiHints: false
    },
    endpoints: [
      { url: `${baseUrl}/api/mcp/v0/servers`, method: 'GET', type: 'discovery' },
      { url: `${baseUrl}/api/mcp/{serverId}/tools`, method: 'GET', type: 'discovery' },
      { url: `${baseUrl}/api/mcp/{serverId}/tools/{toolId}/execute`, method: 'POST', type: 'execution' }
    ],
    authentication: {
      type: 'none',
      required: false,
      description: 'No authentication required for this instance'
    }
  };
}

/**
 * Parse generic OpenAPI workflow service
 */
function parseOpenAPIWorkflowService(data: any, baseUrl: string, endpoint: string): DiscoveredWorkflowService {
  const paths = data.paths || {};
  const workflowPaths = Object.keys(paths).filter(path => 
    path.includes('workflow') || path.includes('execute') || path.includes('trigger')
  );
  
  return {
    id: `openapi-${baseUrl.replace(/[^a-zA-Z0-9]/g, '-')}`,
    name: data.info?.title || 'OpenAPI Workflow Service',
    description: data.info?.description || `OpenAPI workflow service with ${workflowPaths.length} workflow endpoints`,
    protocol: 'Workflow',
    subProtocol: 'OpenAPI',
    baseUrl,
    workflowCount: workflowPaths.length,
    frameworks: ['OpenAPI'],
    capabilities: [
      'api_integrations',
      'monitoring'
    ],
    schemaSupport: {
      input: true,
      output: true,
      validation: true,
      uiHints: false
    },
    endpoints: workflowPaths.map(path => ({
      url: `${baseUrl}${path}`,
      method: 'POST',
      type: 'execution'
    })),
    authentication: {
      type: 'api-key',
      required: true,
      description: 'API key authentication typically required'
    }
  };
}

/**
 * Parse generic workflow service
 */
function parseGenericWorkflowService(data: any, baseUrl: string, endpoint: string): DiscoveredWorkflowService {
  const workflows = Array.isArray(data) ? data : (data.workflows || []);
  
  return {
    id: `workflow-${baseUrl.replace(/[^a-zA-Z0-9]/g, '-')}`,
    name: 'Generic Workflow Service',
    description: `Workflow service with ${workflows.length} available workflows`,
    protocol: 'Workflow',
    subProtocol: 'Generic',
    baseUrl,
    workflowCount: workflows.length,
    frameworks: ['Generic'],
    capabilities: [
      'api_integrations'
    ],
    schemaSupport: {
      input: true,
      output: false,
      validation: false,
      uiHints: false
    },
    endpoints: [
      { url: endpoint, method: 'GET', type: 'discovery' }
    ],
    authentication: {
      type: 'none',
      required: false
    }
  };
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
    if (headers.get('x-mastra-version') || headers.get('x-workflow-engine')) return 'Workflow';
  }

  // Check response structure
  if (data) {
    // A2A detection
    if (data.agentId && data.serviceEndpointUrl) return 'A2A';
    
    // Workflow detection
    if (data.info?.title?.toLowerCase().includes('mastra')) return 'Workflow';
    if (data.servers && Array.isArray(data.servers) && data.servers[0]?.id) return 'Workflow';
    if (data.openapi && data.paths) {
      const paths = Object.keys(data.paths);
      if (paths.some(path => path.includes('workflow') || path.includes('execute') || path.includes('trigger'))) {
        return 'Workflow';
      }
    }
    if (data.workflows || (Array.isArray(data) && data[0]?.workflow)) return 'Workflow';
    
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
      
      // Smart tool merging: prefer the agent with actual tools over empty arrays
      const existingToolCount = existing.tools?.length || 0;
      const newToolCount = agent.tools?.length || 0;
      
      if (existingToolCount === 0 && newToolCount > 0) {
        // Existing has no tools, new has tools - use new tools
        existing.tools = agent.tools;
      } else if (existingToolCount > 0 && newToolCount > 0) {
        // Both have tools - merge and deduplicate
        const toolNames = new Set(existing.tools?.map(t => t.name) || []);
        const newTools = agent.tools?.filter(t => !toolNames.has(t.name)) || [];
        existing.tools = [...(existing.tools || []), ...newTools];
      }
      // If existing has tools and new doesn't, keep existing (no action needed)
      
      // Merge capabilities (deduplicate)
      const capSet = new Set([...(existing.capabilities || []), ...(agent.capabilities || [])]);
      existing.capabilities = Array.from(capSet);
      
      // Merge transport options
      if (agent.transport) {
        const transportSet = new Set([...(existing.transport || []), ...agent.transport]);
        existing.transport = Array.from(transportSet) as any;
      }
      
      // Update name and description if the new agent has more specific information
      if (newToolCount > existingToolCount) {
        if (agent.name !== 'MCP Server') existing.name = agent.name;
        if (agent.description && agent.description !== 'Model Context Protocol Server') {
          existing.description = agent.description;
        }
      }
    } else {
      merged.set(key, agent);
    }
  }
  
  const mergedAgents = Array.from(merged.values());
  
  // Filter out generic API entries when we have specific services
  return filterGenericEntries(mergedAgents);
}

/**
 * Filter out generic API entries when specific services are available
 */
function filterGenericEntries(agents: DiscoveredAgent[]): DiscoveredAgent[] {
  // Check if we have specific MCP servers from the same base URL
  const baseUrls = new Set(agents.map(a => a.baseUrl.replace(/\/api\/mcp\/[^/]+$/, '')));
  
  const filtered = agents.filter(agent => {
    // Skip generic "Workflow" agents that are just API wrappers when we have specific MCP servers
    if (agent.protocol === 'Workflow' && 
        (agent.name === 'Mastra Workflow Engine' || 
         agent.name === 'Mastra API' ||
         agent.name.includes('API'))) {
      
      // Check if we have specific MCP servers from the same base URL
      const agentBaseUrl = agent.baseUrl;
      const hasSpecificMCPServers = agents.some(other => 
        other.protocol === 'MCP' && 
        other.baseUrl.startsWith(agentBaseUrl) &&
        other !== agent
      );
      
      if (hasSpecificMCPServers) {
        console.log(`Filtering out generic API entry: ${agent.name} because we have specific MCP servers`);
        return false;
      }
    }
    
    return true;
  });
  
  return filtered;
}