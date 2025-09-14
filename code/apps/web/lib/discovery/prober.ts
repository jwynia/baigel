/**
 * Discovery Prober Service
 * Probes endpoints to discover available agents and tools
 */

import { useDiscoveryPreferencesStore } from '@/lib/stores/discovery-preferences'
import type {
  ProbeConfig,
  ProbeResult,
  DiscoveredAgent,
  DiscoveredEndpoint,
  ProtocolType 
} from '@/types/discovery';
import { DISCOVERY_ENDPOINTS } from '@/types/discovery';
import { 
  parseA2AAgentCard, 
  parseMCPResponse, 
  parseOpenAIResponse,
  parseWorkflowResponse,
  detectProtocolFromResponse,
  mergeDiscoveredAgents
} from './protocols';

/**
 * Default probe configuration
 */
const DEFAULT_PROBE_CONFIG = {
  timeout: 5000,
  parallel: true,
  // Prioritize standards-compliant aggregation before individual protocols
  protocols: ['Workflow', 'A2A', 'MCP', 'OpenAI'] as ProtocolType[],
};

/**
 * Check if an error is expected during discovery exploration
 */
function isExpectedDiscoveryFailure(error: string): boolean {
  const expectedFailures = [
    '404',           // Endpoint doesn't exist
    '405',           // Method not allowed  
    '403',           // Forbidden (common for API endpoints without auth)
    '401',           // Unauthorized (expected when probing auth-required endpoints)
    'ENOTFOUND',     // Domain doesn't exist
    'ECONNREFUSED',  // Connection refused (service not running)
    'ETIMEDOUT',     // Timeout (service slow/unreachable)
    'fetch failed',  // Generic fetch failure
    'Response is not JSON', // HTML pages, etc.
    'AbortError',    // Request aborted due to timeout
  ];
  
  return expectedFailures.some(pattern => 
    error.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Enrich MCP servers with their tools by fetching from individual tool endpoints
 */
async function enrichMCPServersWithTools(
  agents: DiscoveredAgent[], 
  baseUrl: string, 
  timeout: number,
  headers?: Record<string, string>
): Promise<DiscoveredAgent[]> {
  const enrichedAgents = [...agents];
  
  // Find MCP servers that might need tool enrichment
  const mcpServersToEnrich = agents.filter(agent => 
    agent.protocol === 'MCP' && 
    (!agent.tools || agent.tools.length === 0) &&
    agent.metadata?.serverId // This indicates it came from a Mastra server list
  );
  
  if (mcpServersToEnrich.length === 0) {
    return enrichedAgents;
  }
  
  // Fetch tools for each MCP server
  const toolsPromises = mcpServersToEnrich.map(async (server) => {
    const serverId = server.metadata?.serverId;
    if (!serverId) return null;
    
    const toolsEndpoint = `${baseUrl}/api/mcp/${serverId}/tools`;
    
    try {
      const endpoint = await probeEndpoint(baseUrl, `/api/mcp/${serverId}/tools`, 'MCP', timeout, headers);
      if (endpoint.success && endpoint.data) {
        // Parse the tools response
        const toolsAgent = parseMCPResponse(endpoint.data, baseUrl, toolsEndpoint);
        return { serverId, toolsAgent };
      }
    } catch (error) {
      // Silently handle tool fetching errors - not all servers may have tools
    }
    
    return null;
  });
  
  const toolsResults = await Promise.all(toolsPromises);
  
  // Update the original agents with their tools
  for (const result of toolsResults) {
    if (result && result.toolsAgent) {
      const originalIndex = enrichedAgents.findIndex(agent => 
        agent.metadata?.serverId === result.serverId
      );
      
      if (originalIndex >= 0) {
        const original = enrichedAgents[originalIndex];
        if (!original) continue;
        
        // Merge the tools into the original agent - ensure all required fields are present
        const updatedAgent: DiscoveredAgent = {
          id: original.id,
          name: original.name,
          description: original.description,
          protocol: original.protocol,
          baseUrl: original.baseUrl,
          endpoints: original.endpoints,
          capabilities: [
            ...(original.capabilities || []),
            ...(result.toolsAgent?.capabilities || [])
          ],
          tools: result.toolsAgent?.tools || original.tools || [],
          authentication: original.authentication,
          transport: original.transport,
          metadata: original.metadata
        };
        
        enrichedAgents[originalIndex] = updatedAgent;
      }
    }
  }
  
  return enrichedAgents;
}

/**
 * Enrich Mastra agents with their A2A agent cards
 * Fetches detailed capabilities and skills from /.well-known/{agentId}/agent-card.json
 */
async function enrichAgentsWithA2ACards(
  agents: DiscoveredAgent[], 
  baseUrl: string, 
  timeout: number,
  headers?: Record<string, string>
): Promise<DiscoveredAgent[]> {
  const enrichedAgents = [...agents];
  
  // Find agents that might need A2A enrichment
  const agentsToEnrich = agents.filter(agent => 
    agent.protocol === 'A2A' && 
    agent.metadata?.agentId && // This indicates it came from a Mastra agent list
    agent.metadata?.wellKnownCard // Has the agent card URL
  );
  
  if (agentsToEnrich.length === 0) {
    return enrichedAgents;
  }
  
  // Fetch A2A agent cards for each agent
  const cardPromises = agentsToEnrich.map(async (agent) => {
    const agentId = agent.metadata?.agentId;
    const cardUrl = agent.metadata?.wellKnownCard;
    if (!agentId || !cardUrl) return null;
    
    try {
      const response = await fetch(cardUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...headers,
        },
        signal: AbortSignal.timeout(timeout),
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch A2A agent card for ${agentId}: ${response.status}`);
        return null;
      }
      
      const cardData = await response.json();
      
      // Parse the agent card using existing A2A parser
      const enrichedAgent = parseA2AAgentCard(cardData, baseUrl);
      if (!enrichedAgent) return null;
      
      return {
        agentId,
        cardData,
        enrichedAgent
      };
    } catch (error) {
      console.warn(`Error fetching A2A agent card for ${agentId}:`, error);
      return null;
    }
  });
  
  const cardResults = await Promise.all(cardPromises);
  
  // Apply enrichment to agents
  for (const result of cardResults) {
    if (!result) continue;
    
    const { agentId, cardData, enrichedAgent } = result;
    const agentIndex = enrichedAgents.findIndex(agent => agent.metadata?.agentId === agentId);
    
    if (agentIndex !== -1) {
      const originalAgent = enrichedAgents[agentIndex];
      if (!originalAgent) continue;
      
      // Create updated agent with explicit types to avoid optional field issues
      const updatedAgent: DiscoveredAgent = {
        id: originalAgent.id,
        name: originalAgent.name,
        description: originalAgent.description,
        protocol: originalAgent.protocol,
        baseUrl: originalAgent.baseUrl,
        endpoints: originalAgent.endpoints,
        capabilities: enrichedAgent.capabilities || originalAgent.capabilities,
        tools: enrichedAgent.tools || originalAgent.tools,
        authentication: enrichedAgent.authentication || originalAgent.authentication,
        transport: originalAgent.transport,
        // Preserve original metadata but add card data
        metadata: {
          ...originalAgent.metadata,
          a2aCard: cardData,
          capabilities: cardData.capabilities,
          inputModes: cardData.defaultInputModes,
          outputModes: cardData.defaultOutputModes,
        }
      };
      
      enrichedAgents[agentIndex] = updatedAgent;
    }
  }
  
  return enrichedAgents;
}

/**
 * Probe a single endpoint
 */
async function probeEndpoint(
  baseUrl: string, 
  endpoint: string, 
  protocol: ProtocolType,
  timeout: number,
  headers?: Record<string, string>
): Promise<DiscoveredEndpoint> {
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...headers
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        url,
        protocol,
        success: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return {
        url,
        protocol,
        success: false,
        responseTime,
        error: 'Response is not JSON'
      };
    }

    const data = await response.json();
    const detectedProtocol = detectProtocolFromResponse(data, response.headers);

    return {
      url,
      protocol: detectedProtocol !== 'Unknown' ? detectedProtocol : protocol,
      success: true,
      responseTime,
      data
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      url,
      protocol,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Parse endpoint response into DiscoveredAgent(s)
 * Returns an array to handle cases where one endpoint yields multiple agents
 */
function parseEndpointResponse(
  endpoint: DiscoveredEndpoint, 
  baseUrl: string
): DiscoveredAgent[] {
  if (!endpoint.success || !endpoint.data) return [];

  switch (endpoint.protocol) {
    case 'A2A': {
      const agent = parseA2AAgentCard(endpoint.data, baseUrl);
      return agent ? [agent] : [];
    }
    case 'MCP': {
      const agent = parseMCPResponse(endpoint.data, baseUrl, endpoint.url);
      return agent ? [agent] : [];
    }
    case 'OpenAI': {
      const agent = parseOpenAIResponse(endpoint.data, baseUrl);
      return agent ? [agent] : [];
    }
    case 'Workflow':
      return parseWorkflowResponse(endpoint.data, baseUrl, endpoint.url);
    default:
      return [];
  }
}

/**
 * Main discovery prober function
 */
export async function probeForAgents(config: ProbeConfig): Promise<ProbeResult> {
  const startTime = Date.now();
  const {
    baseUrl,
    timeout = DEFAULT_PROBE_CONFIG.timeout,
    parallel = DEFAULT_PROBE_CONFIG.parallel,
    protocols = DEFAULT_PROBE_CONFIG.protocols,
    headers
  } = config;

  // Normalize base URL
  const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  // Build list of endpoints to probe
  const endpointsToProbe: Array<{ endpoint: string; protocol: ProtocolType }> = [];
  
  if (protocols.includes('A2A')) {
    DISCOVERY_ENDPOINTS.A2A.forEach(ep => {
      endpointsToProbe.push({ endpoint: ep, protocol: 'A2A' });
    });
  }
  
  if (protocols.includes('MCP')) {
    DISCOVERY_ENDPOINTS.MCP.forEach(ep => {
      endpointsToProbe.push({ endpoint: ep, protocol: 'MCP' });
    });
  }
  
  if (protocols.includes('OpenAI')) {
    DISCOVERY_ENDPOINTS.OpenAI.forEach(ep => {
      endpointsToProbe.push({ endpoint: ep, protocol: 'OpenAI' });
    });
  }
  
  if (protocols.includes('Workflow')) {
    DISCOVERY_ENDPOINTS.Workflow.forEach(ep => {
      endpointsToProbe.push({ endpoint: ep, protocol: 'Workflow' });
    });
  }

  // Also check registry endpoints
  DISCOVERY_ENDPOINTS.Registry.forEach(ep => {
    endpointsToProbe.push({ endpoint: ep, protocol: 'Unknown' });
  });

  // Probe endpoints
  let discoveredEndpoints: DiscoveredEndpoint[];
  
  if (parallel) {
    // Probe all endpoints in parallel
    const promises = endpointsToProbe.map(({ endpoint, protocol }) =>
      probeEndpoint(normalizedUrl, endpoint, protocol, timeout, headers)
    );
    discoveredEndpoints = await Promise.all(promises);
  } else {
    // Probe endpoints sequentially
    discoveredEndpoints = [];
    for (const { endpoint, protocol } of endpointsToProbe) {
      const result = await probeEndpoint(normalizedUrl, endpoint, protocol, timeout, headers);
      discoveredEndpoints.push(result);
    }
  }

  // Parse successful responses into agents
  const agents: DiscoveredAgent[] = [];
  const errors: ProbeResult['errors'] = [];
  const explored = discoveredEndpoints.length;
  const successful = discoveredEndpoints.filter(e => e.success).length;

  for (const endpoint of discoveredEndpoints) {
    if (endpoint.success) {
      const endpointAgents = parseEndpointResponse(endpoint, normalizedUrl);
      if (endpointAgents.length > 0) {
        agents.push(...endpointAgents);
      }
    } else if (endpoint.error && !isExpectedDiscoveryFailure(endpoint.error)) {
      // Only report unexpected errors, not normal exploration failures
      errors.push({
        endpoint: endpoint.url,
        protocol: endpoint.protocol,
        error: endpoint.error
      });
    }
  }

  // Phase 2: Fetch tools for MCP servers discovered from Mastra server lists
  const mcpEnrichedAgents = await enrichMCPServersWithTools(agents, normalizedUrl, timeout, headers);
  
  // Phase 3: Fetch A2A agent cards for agents discovered from Mastra agent lists
  const fullyEnrichedAgents = await enrichAgentsWithA2ACards(mcpEnrichedAgents, normalizedUrl, timeout, headers);
  
  // Merge agents discovered from multiple endpoints (including enriched ones)
  const mergedAgents = mergeDiscoveredAgents(fullyEnrichedAgents);

  const duration = Date.now() - startTime;
  
  // Determine overall status
  let status: ProbeResult['status'];
  if (mergedAgents.length > 0) {
    status = 'success';
  } else if (errors.length > 0) {
    status = errors.length === endpointsToProbe.length ? 'error' : 'partial';
  } else {
    status = 'success'; // No agents found, but no errors either
  }

  return {
    status,
    agents: mergedAgents,
    errors,
    duration,
    exploration: {
      endpointsChecked: explored,
      endpointsResponded: successful,
      protocolsExplored: protocols,
      baseUrl: normalizedUrl
    }
  };
}

/**
 * Validate a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get example URLs for discovery
 * Combines default discovery URLs with user-saved endpoints based on preferences
 */
export function getExampleUrls(): Array<{ url: string; description: string; source?: 'default' | 'user' }> {
  // For server-side rendering or initial load, return empty array
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    // Get discovery URLs from preferences store
    const store = useDiscoveryPreferencesStore.getState();
    return store.getDiscoveryUrls();
  } catch (error) {
    // Fallback to static examples if store is not available
    console.warn('Could not load discovery preferences, using fallback URLs:', error);
    return [
      { url: 'http://localhost:3001', description: 'Local MCP Server', source: 'default' },
      { url: 'http://localhost:11434', description: 'Local Ollama Server', source: 'default' },
      { url: 'https://api.openai.com', description: 'OpenAI API', source: 'default' },
    ];
  }
}

/**
 * Get static fallback URLs (used when preferences store is unavailable)
 */
export function getFallbackUrls(): Array<{ url: string; description: string }> {
  return [
    { url: 'http://localhost:3001', description: 'Local MCP Server' },
    { url: 'http://localhost:11434', description: 'Local Ollama Server' },
    { url: 'https://api.openai.com', description: 'OpenAI API' },
  ];
}