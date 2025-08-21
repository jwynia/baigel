/**
 * Mastra Workflow Framework Adapter
 * 
 * Integrates Mastra's MCP tools as workflows in BAIGEL's workflow system.
 * Mastra exposes MCP tools via OpenAPI with JSON schemas for inputs/outputs.
 */

import { BaseWorkflowAdapter } from './workflow-adapter';
import type {
  StandardWorkflowDefinition,
  StandardJSONSchema,
  WorkflowExecutionRequest,
  WorkflowExecutionResult,
  ValidationResult,
  ExecutionStatus,
  WorkflowFeature,
  AuthRequirement,
  FrameworkMetadata,
  WorkflowExecutionError
} from '@/types/workflows';

/**
 * Mastra-specific types
 */
interface MastraServer {
  id: string;
  name: string;
  description: string;
  version_detail: {
    version: string;
    release_date: string;
    is_latest: boolean;
  };
}

interface MastraTool {
  id: string;
  name: string;
  description: string;
  inputSchema: any;  // Raw JSON Schema from Mastra
  outputSchema?: any; // Raw JSON Schema from Mastra
}

interface MastraToolsResponse {
  tools: MastraTool[];
}

interface MastraServersResponse {
  servers: MastraServer[];
  next: string | null;
  total_count: number;
}

interface MastraExecutionResponse {
  result: any;
}

/**
 * Mastra workflow adapter implementation
 */
export class MastraAdapter extends BaseWorkflowAdapter {
  // ProtocolAdapter interface
  readonly protocol = 'Workflow';
  readonly version = '1.0.0';
  
  // WorkflowAdapter interface
  readonly name = 'Mastra';
  readonly supportedFrameworks = ['Mastra', 'MCP'];
  
  private baseUrl = '';
  private connected = false;
  private discoveredServers: MastraServer[] = [];
  
  // Connection management
  async connect(config?: { baseUrl?: string }): Promise<void> {
    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    
    try {
      // Test connection by fetching server list
      const response = await this.makeRequest(`${this.baseUrl}/api/mcp/v0/servers`);
      if (response.success) {
        this.connected = true;
        const serversData = response.data as MastraServersResponse;
        this.discoveredServers = serversData.servers;
      } else {
        throw new Error(`Failed to connect to Mastra: ${response.error}`);
      }
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    this.connected = false;
    this.baseUrl = '';
    this.discoveredServers = [];
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  // Message handling (inherited from ProtocolAdapter)
  async sendMessage(message: any): Promise<any> {
    // For Mastra, this could be used for direct MCP communication
    throw new Error('Direct message sending not implemented for Mastra adapter');
  }
  
  async receiveMessage(): Promise<any> {
    // For Mastra, this could be used for receiving MCP events
    throw new Error('Direct message receiving not implemented for Mastra adapter');
  }
  
  // Framework detection
  async canHandle(endpoint: string, response?: any): Promise<boolean> {
    try {
      // Check if this looks like a Mastra endpoint
      if (endpoint.includes('mastra') || 
          (response && typeof response === 'object' && response.info?.title?.toLowerCase().includes('mastra'))) {
        return true;
      }
      
      // Try to detect by checking for Mastra-specific API patterns
      const { baseUrl } = this.parseBaseUrl(endpoint);
      const testResponse = await this.makeRequest(`${baseUrl}/api/mcp/v0/servers`);
      
      if (testResponse.success && testResponse.data && 
          typeof testResponse.data === 'object' && 
          'servers' in testResponse.data) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }
  
  // Workflow discovery
  async discoverWorkflows(baseUrl: string): Promise<StandardWorkflowDefinition[]> {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    
    try {
      // Get list of MCP servers
      const serversResponse = await this.makeRequest(`${this.baseUrl}/api/mcp/v0/servers`);
      if (!serversResponse.success) {
        throw new Error(`Failed to fetch servers: ${serversResponse.error}`);
      }
      
      const serversData = serversResponse.data as MastraServersResponse;
      const workflows: StandardWorkflowDefinition[] = [];
      
      // For each server, get its tools and convert them to workflows
      for (const server of serversData.servers) {
        try {
          const toolsResponse = await this.makeRequest(`${this.baseUrl}/api/mcp/${server.id}/tools`);
          if (toolsResponse.success) {
            const toolsData = toolsResponse.data as MastraToolsResponse;
            
            for (const tool of toolsData.tools) {
              const workflow = this.convertToolToWorkflow(tool, server);
              workflows.push(workflow);
            }
          }
        } catch (error) {
          // Log but continue with other servers
          console.warn(`Failed to fetch tools for server ${server.id}:`, error);
        }
      }
      
      return workflows;
    } catch (error) {
      throw new Error(`Failed to discover workflows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Schema retrieval
  async getWorkflowSchema(workflowId: string): Promise<StandardJSONSchema> {
    const { serverId, toolId } = this.parseWorkflowId(workflowId);
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/api/mcp/${serverId}/tools/${toolId}`);
      if (!response.success) {
        throw new Error(`Failed to get tool schema: ${response.error}`);
      }
      
      const tool = response.data as MastraTool;
      return this.normalizeSchema(tool.inputSchema);
    } catch (error) {
      throw new Error(`Failed to get workflow schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Workflow execution
  async executeWorkflow(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResult> {
    const { serverId, toolId } = this.parseWorkflowId(request.workflowId);
    const executionId = this.generateExecutionId(request.workflowId);
    const startTime = new Date().toISOString();
    
    try {
      // Validate inputs first
      const validation = await this.validateInputs(request.workflowId, request.inputs);
      if (!validation.valid) {
        throw this.createWorkflowError(
          'VALIDATION_ERROR',
          `Input validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          'validation',
          true,
          validation.errors
        );
      }
      
      // Execute the tool
      const response = await this.makeRequest(
        `${this.baseUrl}/api/mcp/${serverId}/tools/${toolId}/execute`,
        {
          method: 'POST',
          body: JSON.stringify({
            data: request.inputs,
            runtimeContext: request.context || {}
          })
        }
      );
      
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
      
      if (!response.success) {
        throw this.createWorkflowError(
          'EXECUTION_ERROR',
          `Tool execution failed: ${response.error}`,
          'execution',
          true,
          { statusCode: response.status }
        );
      }
      
      const executionResponse = response.data as MastraExecutionResponse;
      
      return {
        executionId,
        workflowId: request.workflowId,
        success: true,
        outputs: executionResponse.result || {},
        metadata: {
          startTime,
          endTime,
          duration,
          status: 'completed' as ExecutionStatus,
          logs: [
            this.createLogEntry('info', 'Workflow execution started', 'mastra-adapter'),
            this.createLogEntry('info', 'Workflow execution completed successfully', 'mastra-adapter')
          ],
          frameworkMetadata: {
            serverId,
            toolId,
            mastraVersion: this.discoveredServers.find(s => s.id === serverId)?.version_detail?.version
          }
        }
      };
    } catch (error) {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
      
      const workflowError = error instanceof Error && 'type' in error 
        ? error as WorkflowExecutionError
        : this.createWorkflowError(
          'UNKNOWN_ERROR',
          error instanceof Error ? error.message : 'Unknown execution error',
          'execution',
          true
        );
      
      return {
        executionId,
        workflowId: request.workflowId,
        success: false,
        outputs: {},
        metadata: {
          startTime,
          endTime,
          duration,
          status: 'failed' as ExecutionStatus,
          logs: [
            this.createLogEntry('info', 'Workflow execution started', 'mastra-adapter'),
            this.createLogEntry('error', `Workflow execution failed: ${workflowError.message}`, 'mastra-adapter')
          ]
        },
        error: workflowError
      };
    }
  }
  
  // Execution status
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    // Mastra tools are synchronous, so execution is either completed or failed
    // This would need to be enhanced for async tools in the future
    return 'completed';
  }
  
  // Framework metadata
  getFrameworkMetadata(): FrameworkMetadata {
    return {
      name: 'Mastra',
      version: '1.0.0',
      description: 'Mastra workflow framework with MCP tool integration',
      website: 'https://mastra.ai',
      documentation: 'https://docs.mastra.ai',
      supportedFeatures: this.getSupportedFeatures(),
      limitations: [
        'Synchronous execution only',
        'No built-in state management',
        'Requires MCP server configuration'
      ],
      apiVersion: '1.0',
      requiredHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      baseUrl: this.baseUrl
    };
  }
  
  // Supported features
  getSupportedFeatures(): WorkflowFeature[] {
    return [
      'api_integrations',
      'custom_code',
      'monitoring',
      'audit_logging'
    ];
  }
  
  // Authentication requirements
  getAuthenticationRequirements(): AuthRequirement[] {
    return []; // Mastra tools in this instance are unauthenticated
  }
  
  // Get full execution result (required by base class)
  protected async getFullExecutionResult(executionId: string): Promise<WorkflowExecutionResult> {
    // For Mastra, executions are synchronous, so this should not be called
    throw new Error('Mastra adapter does not support async execution result retrieval');
  }
  
  // Private helper methods
  
  /**
   * Convert a Mastra MCP tool to a StandardWorkflowDefinition
   */
  private convertToolToWorkflow(tool: MastraTool, server: MastraServer): StandardWorkflowDefinition {
    return {
      id: `${server.id}:${tool.id}`,
      name: tool.name,
      description: tool.description,
      version: server.version_detail.version,
      inputSchema: this.normalizeSchema(tool.inputSchema),
      outputSchema: tool.outputSchema ? this.normalizeSchema(tool.outputSchema) : undefined,
      framework: {
        name: 'Mastra',
        version: server.version_detail.version,
        endpoint: this.baseUrl,
        adapter: 'MastraAdapter'
      },
      metadata: {
        category: [server.name.toLowerCase().replace(/\s+/g, '-'), 'mcp-tool'],
        complexity: this.determineComplexity(tool),
        requiresAuth: false, // Current instance is unauthenticated
        supportsBatch: false,
        supportsStreaming: false,
        supportsCancel: false,
        idempotent: true
      },
      documentation: {
        examples: [
          {
            name: `Example ${tool.name} usage`,
            description: `Basic usage of the ${tool.name} tool`,
            inputs: this.generateExampleInputs(tool.inputSchema)
          }
        ]
      }
    };
  }
  
  /**
   * Normalize a raw JSON schema to StandardJSONSchema format
   */
  private normalizeSchema(rawSchema: any): StandardJSONSchema {
    if (!rawSchema || typeof rawSchema !== 'object') {
      return {
        type: 'object',
        properties: {},
        required: []
      };
    }
    
    // Mastra schemas are already mostly JSON Schema compliant
    const normalized: StandardJSONSchema = {
      type: rawSchema.type || 'object',
      properties: rawSchema.properties || {},
      required: rawSchema.required || [],
      ...rawSchema
    };
    
    // Add UI hints based on field types and names
    if (normalized.properties) {
      for (const [key, prop] of Object.entries(normalized.properties)) {
        if (typeof prop === 'object' && prop.type) {
          const property = prop as StandardJSONSchema;
          property.uiHints = this.generateUIHints(key, property);
        }
      }
    }
    
    return normalized;
  }
  
  /**
   * Generate UI hints for a schema property
   */
  private generateUIHints(fieldName: string, property: StandardJSONSchema): StandardJSONSchema['uiHints'] {
    const hints: StandardJSONSchema['uiHints'] = {};
    
    // Widget selection based on type and name
    if (property.type === 'string') {
      if (fieldName.toLowerCase().includes('text') || fieldName.toLowerCase().includes('content')) {
        hints.widget = 'textarea';
      } else if (property.enum) {
        hints.widget = 'select';
      } else if (fieldName.toLowerCase().includes('url')) {
        hints.widget = 'url';
      } else if (fieldName.toLowerCase().includes('email')) {
        hints.widget = 'email';
      }
    } else if (property.type === 'boolean') {
      hints.widget = 'checkbox';
    } else if (property.type === 'number') {
      hints.widget = 'number';
    }
    
    // Help text from description
    if (property.description) {
      hints.help = property.description;
    }
    
    // Placeholder from examples or default
    if (property.examples && property.examples.length > 0) {
      hints.placeholder = String(property.examples[0]);
    } else if (property.default !== undefined) {
      hints.placeholder = String(property.default);
    }
    
    return hints;
  }
  
  /**
   * Determine workflow complexity based on tool schema
   */
  private determineComplexity(tool: MastraTool): 'simple' | 'intermediate' | 'advanced' {
    const requiredFields = tool.inputSchema?.required?.length || 0;
    const totalFields = Object.keys(tool.inputSchema?.properties || {}).length;
    
    if (totalFields <= 2 && requiredFields <= 1) return 'simple';
    if (totalFields <= 5 && requiredFields <= 3) return 'intermediate';
    return 'advanced';
  }
  
  /**
   * Generate example inputs for a schema
   */
  private generateExampleInputs(schema: any): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    if (schema?.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        if (typeof prop === 'object' && prop !== null) {
          const property = prop as any;
          if (property.default !== undefined) {
            inputs[key] = property.default;
          } else if (property.examples && property.examples.length > 0) {
            inputs[key] = property.examples[0];
          } else {
            // Generate basic example based on type
            switch (property.type) {
              case 'string':
                inputs[key] = property.enum ? property.enum[0] : 'example value';
                break;
              case 'number':
                inputs[key] = 1;
                break;
              case 'boolean':
                inputs[key] = true;
                break;
              case 'array':
                inputs[key] = [];
                break;
              case 'object':
                inputs[key] = {};
                break;
            }
          }
        }
      }
    }
    
    return inputs;
  }
  
  /**
   * Parse workflow ID to extract server and tool IDs
   */
  private parseWorkflowId(workflowId: string): { serverId: string; toolId: string } {
    const parts = workflowId.split(':');
    if (parts.length !== 2) {
      throw new Error(`Invalid workflow ID format: ${workflowId}. Expected format: serverId:toolId`);
    }
    return { serverId: parts[0], toolId: parts[1] };
  }
}

// Register the adapter
import { workflowAdapterRegistry } from './workflow-adapter';
workflowAdapterRegistry.registerAdapter(new MastraAdapter());