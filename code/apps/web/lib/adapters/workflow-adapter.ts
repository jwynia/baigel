/**
 * Base Workflow Adapter Implementation
 * 
 * Provides common functionality for all workflow framework adapters
 * and defines the abstract interface that specific adapters must implement.
 */

import type { 
  WorkflowAdapter,
  StandardWorkflowDefinition,
  StandardJSONSchema,
  WorkflowExecutionRequest,
  WorkflowExecutionResult,
  ValidationResult,
  ExecutionStatus,
  WorkflowFeature,
  AuthRequirement,
  FrameworkMetadata,
  WorkflowExecutionError,
  ExecutionLog
} from '@/types/workflows';

/**
 * Abstract base class providing common functionality for workflow adapters
 */
export abstract class BaseWorkflowAdapter implements WorkflowAdapter {
  // ProtocolAdapter interface implementation
  abstract readonly protocol: string;
  abstract readonly version: string;
  
  // WorkflowAdapter interface implementation
  abstract readonly name: string;
  abstract readonly supportedFrameworks: string[];
  
  // Connection management (inherited from ProtocolAdapter)
  abstract connect(config?: any): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isConnected(): boolean;
  
  // Message handling (inherited from ProtocolAdapter)
  abstract sendMessage(message: any): Promise<any>;
  abstract receiveMessage(): Promise<any>;
  
  /**
   * Framework detection - must be implemented by specific adapters
   */
  abstract canHandle(endpoint: string, response?: any): Promise<boolean>;
  
  /**
   * Workflow discovery - must be implemented by specific adapters
   */
  abstract discoverWorkflows(baseUrl: string): Promise<StandardWorkflowDefinition[]>;
  
  /**
   * Schema retrieval - must be implemented by specific adapters
   */
  abstract getWorkflowSchema(workflowId: string): Promise<StandardJSONSchema>;
  
  /**
   * Workflow execution - must be implemented by specific adapters
   */
  abstract executeWorkflow(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResult>;
  
  /**
   * Get execution status - must be implemented by specific adapters
   */
  abstract getExecutionStatus(executionId: string): Promise<ExecutionStatus>;
  
  /**
   * Get framework metadata - must be implemented by specific adapters
   */
  abstract getFrameworkMetadata(): FrameworkMetadata;
  
  /**
   * Validate workflow inputs using schema
   * Default implementation using JSON Schema validation
   */
  async validateInputs(workflowId: string, inputs: any): Promise<ValidationResult> {
    try {
      const schema = await this.getWorkflowSchema(workflowId);
      return this.validateAgainstSchema(inputs, schema);
    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'root',
          message: `Failed to retrieve schema for validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'SCHEMA_RETRIEVAL_ERROR'
        }]
      };
    }
  }
  
  /**
   * Get execution result - default implementation calls getExecutionStatus
   */
  async getExecutionResult(executionId: string): Promise<WorkflowExecutionResult> {
    const status = await this.getExecutionStatus(executionId);
    
    // If specific adapters need different behavior, they can override this
    if (status === 'completed' || status === 'failed') {
      // Adapter should implement getFullExecutionResult if different from status
      return this.getFullExecutionResult(executionId);
    }
    
    // Return partial result for ongoing executions
    return {
      executionId,
      workflowId: '', // Will be filled by specific adapter
      success: (status as any) === 'completed',
      outputs: {},
      metadata: {
        startTime: new Date().toISOString(), // Will be filled by specific adapter
        status,
      }
    };
  }
  
  /**
   * Get supported features - default empty, override in specific adapters
   */
  getSupportedFeatures(): WorkflowFeature[] {
    return [];
  }
  
  /**
   * Get authentication requirements - default none, override in specific adapters
   */
  getAuthenticationRequirements(): AuthRequirement[] {
    return [];
  }
  
  /**
   * Cancel execution - optional feature, default not supported
   */
  async cancelExecution?(executionId: string): Promise<boolean> {
    throw new Error(`Execution cancellation not supported by ${this.name} adapter`);
  }
  
  /**
   * Transform inputs - optional, default passthrough
   */
  async transformInputs?(workflowId: string, standardInputs: any): Promise<any> {
    return standardInputs;
  }
  
  /**
   * Transform outputs - optional, default passthrough
   */
  async transformOutputs?(workflowId: string, nativeOutputs: any): Promise<any> {
    return nativeOutputs;
  }
  
  /**
   * Handle framework-specific operations - optional
   */
  async handleFrameworkSpecificOperation?(operation: string, params: any): Promise<any> {
    throw new Error(`Framework-specific operation '${operation}' not supported by ${this.name} adapter`);
  }
  
  // Protected utility methods for use by specific adapters
  
  /**
   * Validate data against a StandardJSONSchema
   */
  protected validateAgainstSchema(data: any, schema: StandardJSONSchema): ValidationResult {
    const errors: any[] = [];
    
    try {
      this.validateValue(data, schema, 'root', errors);
    } catch (error) {
      errors.push({
        field: 'root',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'VALIDATION_ERROR',
        value: data
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Recursive schema validation helper
   */
  private validateValue(value: any, schema: StandardJSONSchema, path: string, errors: any[]): void {
    // Type validation
    if (schema.type && !this.isValidType(value, schema.type)) {
      errors.push({
        field: path,
        message: `Expected ${schema.type}, got ${typeof value}`,
        code: 'TYPE_MISMATCH',
        value
      });
      return;
    }
    
    // Required field validation (for object properties)
    if (schema.type === 'object' && schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in value)) {
          errors.push({
            field: `${path}.${requiredField}`,
            message: `Required field '${requiredField}' is missing`,
            code: 'REQUIRED_FIELD_MISSING'
          });
        }
      }
    }
    
    // Property validation for objects
    if (schema.type === 'object' && schema.properties && typeof value === 'object' && value !== null) {
      for (const [propName, propValue] of Object.entries(value)) {
        const propSchema = schema.properties[propName];
        if (propSchema) {
          this.validateValue(propValue, propSchema, `${path}.${propName}`, errors);
        }
      }
    }
    
    // Array validation
    if (schema.type === 'array' && Array.isArray(value)) {
      if (schema.minItems && value.length < schema.minItems) {
        errors.push({
          field: path,
          message: `Array must have at least ${schema.minItems} items`,
          code: 'MIN_ITEMS_VIOLATION',
          value
        });
      }
      
      if (schema.maxItems && value.length > schema.maxItems) {
        errors.push({
          field: path,
          message: `Array must have at most ${schema.maxItems} items`,
          code: 'MAX_ITEMS_VIOLATION',
          value
        });
      }
      
      if (schema.items) {
        value.forEach((item, index) => {
          this.validateValue(item, schema.items!, `${path}[${index}]`, errors);
        });
      }
    }
    
    // String validation
    if (schema.type === 'string' && typeof value === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push({
          field: path,
          message: `String must be at least ${schema.minLength} characters`,
          code: 'MIN_LENGTH_VIOLATION',
          value
        });
      }
      
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push({
          field: path,
          message: `String must be at most ${schema.maxLength} characters`,
          code: 'MAX_LENGTH_VIOLATION',
          value
        });
      }
      
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push({
          field: path,
          message: `String does not match required pattern`,
          code: 'PATTERN_VIOLATION',
          value
        });
      }
    }
    
    // Number validation
    if ((schema.type === 'number' || (schema as any).type === 'integer') && typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({
          field: path,
          message: `Value must be at least ${schema.minimum}`,
          code: 'MINIMUM_VIOLATION',
          value
        });
      }
      
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({
          field: path,
          message: `Value must be at most ${schema.maximum}`,
          code: 'MAXIMUM_VIOLATION',
          value
        });
      }
    }
    
    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        field: path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        code: 'ENUM_VIOLATION',
        value
      });
    }
  }
  
  /**
   * Type checking helper
   */
  private isValidType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'null':
        return value === null;
      default:
        return true; // Unknown type, assume valid
    }
  }
  
  /**
   * Create a standardized error object
   */
  protected createWorkflowError(
    code: string,
    message: string,
    type: WorkflowExecutionError['type'] = 'execution',
    recoverable: boolean = true,
    details?: any
  ): WorkflowExecutionError {
    return {
      code,
      message,
      type,
      recoverable,
      details,
      context: {
        adapter: this.name,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Create execution log entry
   */
  protected createLogEntry(
    level: ExecutionLog['level'],
    message: string,
    source?: string,
    metadata?: Record<string, any>
  ): ExecutionLog {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      source: source || this.name,
      metadata
    };
  }
  
  /**
   * Generate unique execution ID
   */
  protected generateExecutionId(workflowId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.name.toLowerCase()}-${workflowId}-${timestamp}-${random}`;
  }
  
  /**
   * Parse URL to extract base URL and validate
   */
  protected parseBaseUrl(url: string): { baseUrl: string; isValid: boolean } {
    try {
      const parsedUrl = new URL(url);
      return {
        baseUrl: `${parsedUrl.protocol}//${parsedUrl.host}`,
        isValid: true
      };
    } catch {
      return {
        baseUrl: url,
        isValid: false
      };
    }
  }
  
  /**
   * Make HTTP request with error handling
   */
  protected async makeRequest(
    url: string, 
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: any; error?: string; status?: number }> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }
  
  /**
   * Get full execution result - to be implemented by specific adapters
   */
  protected abstract getFullExecutionResult(executionId: string): Promise<WorkflowExecutionResult>;
}

/**
 * Adapter registry implementation
 */
export class WorkflowAdapterRegistry {
  private adapters = new Map<string, WorkflowAdapter>();
  
  registerAdapter(adapter: WorkflowAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }
  
  unregisterAdapter(name: string): void {
    this.adapters.delete(name);
  }
  
  getAdapter(frameworkName: string): WorkflowAdapter | null {
    return this.adapters.get(frameworkName) || null;
  }
  
  getAllAdapters(): WorkflowAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  async detectFramework(endpoint: string, response?: any): Promise<WorkflowAdapter | null> {
    for (const adapter of this.adapters.values()) {
      if (await adapter.canHandle(endpoint, response)) {
        return adapter;
      }
    }
    return null;
  }
  
  listSupportedFrameworks(): string[] {
    const frameworks = new Set<string>();
    for (const adapter of this.adapters.values()) {
      adapter.supportedFrameworks.forEach(framework => frameworks.add(framework));
    }
    return Array.from(frameworks);
  }
}

// Global registry instance
export const workflowAdapterRegistry = new WorkflowAdapterRegistry();