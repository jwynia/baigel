/**
 * Discovery Prober Service
 * Probes endpoints to discover available agents and tools
 */

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
  protocols: ['A2A', 'MCP', 'OpenAI', 'Workflow'] as ProtocolType[],
};

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
 * Parse endpoint response into DiscoveredAgent
 */
function parseEndpointResponse(
  endpoint: DiscoveredEndpoint, 
  baseUrl: string
): DiscoveredAgent | null {
  if (!endpoint.success || !endpoint.data) return null;

  switch (endpoint.protocol) {
    case 'A2A':
      return parseA2AAgentCard(endpoint.data, baseUrl);
    case 'MCP':
      return parseMCPResponse(endpoint.data, baseUrl, endpoint.url);
    case 'OpenAI':
      return parseOpenAIResponse(endpoint.data, baseUrl);
    case 'Workflow':
      return parseWorkflowResponse(endpoint.data, baseUrl, endpoint.url);
    default:
      return null;
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

  for (const endpoint of discoveredEndpoints) {
    if (endpoint.success) {
      const agent = parseEndpointResponse(endpoint, normalizedUrl);
      if (agent) {
        agents.push(agent);
      }
    } else if (endpoint.error && !endpoint.error.includes('404')) {
      // Don't report 404s as errors (expected for many endpoints)
      errors.push({
        endpoint: endpoint.url,
        protocol: endpoint.protocol,
        error: endpoint.error
      });
    }
  }

  // Merge agents discovered from multiple endpoints
  const mergedAgents = mergeDiscoveredAgents(agents);

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
    duration
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
 */
export function getExampleUrls(): Array<{ url: string; description: string }> {
  return [
    { url: 'http://localhost:3001', description: 'Local MCP Server' },
    { url: 'http://localhost:11434', description: 'Local Ollama Server' },
    { url: 'https://api.openai.com', description: 'OpenAI API' },
    { url: 'https://agent.example.com', description: 'A2A Agent Server' },
    { url: 'http://100.80.122.46:4111', description: 'Live Mastra Workflow Engine' },
  ];
}