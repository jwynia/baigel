/**
 * Types for Agent/Tool Discovery System
 */

export type ProtocolType = 'MCP' | 'A2A' | 'AG-UI' | 'OpenAI' | 'Unknown';

export type DiscoveryStatus = 'idle' | 'probing' | 'success' | 'error' | 'partial';

export type AuthenticationType = 'none' | 'api-key' | 'oauth2' | 'bearer' | 'custom';

export type TransportType = 'http' | 'sse' | 'websocket' | 'stdio';

/**
 * Represents a discovered endpoint during probing
 */
export interface DiscoveredEndpoint {
  url: string;
  protocol: ProtocolType;
  success: boolean;
  responseTime?: number;
  error?: string;
  data?: any;
}

/**
 * Represents a tool/capability within an agent
 */
export interface DiscoveredTool {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  required?: string[];
}

/**
 * Represents a discovered agent or tool service
 */
export interface DiscoveredAgent {
  id: string;
  name: string;
  description?: string;
  protocol: ProtocolType;
  baseUrl: string;
  endpoints: DiscoveredEndpoint[];
  tools?: DiscoveredTool[];
  capabilities?: string[];
  authentication?: {
    type: AuthenticationType;
    required: boolean;
    description?: string;
  };
  transport?: TransportType[];
  metadata?: {
    version?: string;
    author?: string;
    license?: string;
    documentation?: string;
    [key: string]: any;
  };
}

/**
 * Configuration for adding a discovered agent to the app
 */
export interface AgentConfiguration {
  id: string;
  name: string;
  enabled: boolean;
  baseUrl: string;
  protocol: ProtocolType;
  authentication?: {
    type: AuthenticationType;
    credentials?: {
      apiKey?: string;
      clientId?: string;
      clientSecret?: string;
      token?: string;
      [key: string]: any;
    };
  };
  transport?: TransportType;
  selectedTools?: string[];
  customHeaders?: Record<string, string>;
}

/**
 * Probing configuration
 */
export interface ProbeConfig {
  baseUrl: string;
  timeout?: number;
  parallel?: boolean;
  protocols?: ProtocolType[];
  headers?: Record<string, string>;
}

/**
 * Probing result
 */
export interface ProbeResult {
  status: DiscoveryStatus;
  agents: DiscoveredAgent[];
  errors: Array<{
    endpoint: string;
    protocol: ProtocolType;
    error: string;
  }>;
  duration: number;
}

/**
 * Well-known endpoints to probe for each protocol
 */
export const DISCOVERY_ENDPOINTS = {
  A2A: [
    '/.well-known/agent-card.json',
  ],
  MCP: [
    '/v1/models',
    '/tools/list',
    '/resources/list',
  ],
  OpenAI: [
    '/v1/models',
    '/v1/chat/completions',
  ],
  Registry: [
    '/agents/public',
    '/agents/entitled',
    '/registry/list',
  ],
} as const;

/**
 * Protocol detection patterns
 */
export const PROTOCOL_PATTERNS = {
  MCP: {
    headers: ['x-mcp-version'],
    jsonKeys: ['tools', 'resources', 'mcp_version'],
  },
  A2A: {
    headers: ['x-a2a-version'],
    jsonKeys: ['agentId', 'skills', 'serviceEndpointUrl'],
  },
  OpenAI: {
    headers: ['openai-version'],
    jsonKeys: ['object', 'data', 'model'],
  },
} as const;

/**
 * Discovery UI state
 */
export interface DiscoveryState {
  status: DiscoveryStatus;
  currentProbe?: ProbeConfig;
  results?: ProbeResult;
  selectedAgents: string[];
  configurations: Record<string, AgentConfiguration>;
}