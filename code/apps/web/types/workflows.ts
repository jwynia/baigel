/**
 * Workflow Protocol Type Definitions
 * 
 * This module defines the core types for BAIGEL's workflow execution system.
 * It provides a standardized interface that all workflow framework adapters
 * must implement, ensuring consistent UI and behavior regardless of the
 * underlying workflow framework (Mastra, n8n, SpiffWorkflow, etc.).
 */

// Re-export from discovery types for workflow-specific extensions
import type { ProtocolAdapter, AuthenticationType } from './discovery';

/**
 * Standard JSON Schema representation used internally by BAIGEL
 * Normalizes different schema formats into a consistent structure
 * with optional UI generation hints
 */
export interface StandardJSONSchema {
  // JSON Schema specification fields
  $schema?: string;
  $id?: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  
  // Object type properties
  properties?: Record<string, StandardJSONSchema>;
  required?: string[];
  additionalProperties?: boolean | StandardJSONSchema;
  patternProperties?: Record<string, StandardJSONSchema>;
  
  // Array type properties  
  items?: StandardJSONSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  
  // String type properties
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: 'date' | 'time' | 'date-time' | 'email' | 'uri' | 'uuid' | 'password';
  
  // Numeric type properties
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  
  // Common validation properties
  enum?: any[];
  const?: any;
  
  // Metadata properties
  title?: string;
  description?: string;
  default?: any;
  examples?: any[];
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  
  // Conditional properties
  if?: StandardJSONSchema;
  then?: StandardJSONSchema;
  else?: StandardJSONSchema;
  allOf?: StandardJSONSchema[];
  anyOf?: StandardJSONSchema[];
  oneOf?: StandardJSONSchema[];
  not?: StandardJSONSchema;
  
  // BAIGEL-specific UI generation hints
  uiHints?: {
    // Widget type for form rendering
    widget?: 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 
             'datetime-local' | 'file' | 'password' | 'url' | 'email' | 'color' |
             'range' | 'number' | 'tel' | 'search' | 'hidden';
    
    // Layout and presentation
    layout?: 'horizontal' | 'vertical' | 'grid' | 'accordion' | 'tabs' | 'inline';
    order?: number;
    hidden?: boolean;
    disabled?: boolean;
    placeholder?: string;
    help?: string;
    
    // Advanced UI features
    autocomplete?: 'on' | 'off' | string;
    validation?: {
      debounceMs?: number;
      validateOnChange?: boolean;
      customValidator?: string;
      async?: boolean;
    };
    
    // Conditional display
    dependsOn?: string[];  // Field names this field depends on
    showWhen?: string;     // Condition expression for visibility
    
    // Styling hints
    className?: string;
    style?: Record<string, string>;
  };
}

/**
 * Represents a discoverable workflow definition
 */
export interface StandardWorkflowDefinition {
  // Core identification
  id: string;
  name: string;
  description: string;
  version: string;
  
  // Schema definitions (normalized to standard format)
  inputSchema: StandardJSONSchema;
  outputSchema?: StandardJSONSchema;  // Optional for fire-and-forget workflows
  
  // Framework context
  framework: {
    name: string;           // 'Mastra', 'SpiffWorkflow', 'n8n', 'Generic', etc.
    version: string;
    endpoint: string;       // Base URL for this workflow's framework
    adapter: string;        // Adapter class name that handles this framework
  };
  
  // Execution metadata
  metadata: {
    category: string[];                    // Tags for organization
    complexity: 'simple' | 'intermediate' | 'advanced';
    estimatedDuration?: number;            // Seconds (if available)
    requiresAuth: boolean;
    supportsBatch?: boolean;               // Can handle multiple inputs
    supportsStreaming?: boolean;           // Can stream results
    supportsCancel?: boolean;              // Can cancel mid-execution
    idempotent?: boolean;                  // Safe to retry
    
    // Usage hints
    rateLimits?: {
      requestsPerMinute?: number;
      requestsPerHour?: number;
      maxConcurrent?: number;
    };
    
    // Cost information (if available)
    cost?: {
      currency: string;
      estimatedCost?: number;              // Per execution
      costFactors?: string[];              // What affects cost
    };
  };
  
  // Optional documentation
  documentation?: {
    url?: string;
    examples?: WorkflowExample[];
    changelog?: string;
  };
}

/**
 * Example execution for documentation
 */
export interface WorkflowExample {
  name: string;
  description: string;
  inputs: Record<string, any>;
  expectedOutputs?: Record<string, any>;
}

/**
 * Request to execute a workflow
 */
export interface WorkflowExecutionRequest {
  workflowId: string;
  inputs: Record<string, any>;
  
  // Execution options
  options?: {
    timeout?: number;           // Milliseconds
    async?: boolean;            // Don't wait for completion
    streaming?: boolean;        // Stream results if supported
    retryOnFailure?: boolean;   // Auto-retry failed executions
    priority?: 'low' | 'normal' | 'high';
  };
  
  // Execution context
  context?: {
    userId?: string;
    sessionId?: string;
    traceId?: string;           // For distributed tracing
    metadata?: Record<string, any>;
  };
}

/**
 * Result of workflow execution
 */
export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  success: boolean;
  
  // Execution outputs
  outputs: Record<string, any>;
  
  // Execution metadata
  metadata: {
    startTime: string;          // ISO timestamp
    endTime?: string;           // ISO timestamp (null if still running)
    duration?: number;          // Milliseconds
    status: ExecutionStatus;
    
    // Cost tracking
    cost?: {
      amount: number;
      currency: string;
      breakdown?: Record<string, number>;  // Cost by operation/resource
    };
    
    // Execution logs and metrics
    logs?: ExecutionLog[];
    metrics?: Record<string, number>;
    
    // Framework-specific metadata
    frameworkMetadata?: Record<string, any>;
  };
  
  // Error information (if failed)
  error?: WorkflowExecutionError;
}

/**
 * Execution status enumeration
 */
export type ExecutionStatus = 
  | 'pending'      // Queued but not started
  | 'running'      // Currently executing
  | 'completed'    // Successfully finished
  | 'failed'       // Failed with error
  | 'cancelled'    // Cancelled by user or system
  | 'timeout'      // Exceeded timeout
  | 'retrying';    // Failed but attempting retry

/**
 * Execution log entry
 */
export interface ExecutionLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source?: string;            // Component or step that generated log
  metadata?: Record<string, any>;
}

/**
 * Workflow execution error
 */
export interface WorkflowExecutionError {
  code: string;
  message: string;
  details?: any;
  
  // Error classification
  type: 'validation' | 'execution' | 'timeout' | 'network' | 'auth' | 'quota' | 'internal';
  recoverable: boolean;       // Whether retry might succeed
  retryAfter?: number;        // Seconds to wait before retry (if applicable)
  
  // Stack trace and debugging
  stackTrace?: string;
  context?: Record<string, any>;
}

/**
 * Validation result for workflow inputs
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

/**
 * Individual validation error
 */
export interface ValidationError {
  field: string;              // JSON path to the field
  message: string;
  code: string;
  value?: any;                // The invalid value
}

/**
 * Individual validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Workflow framework capabilities
 */
export type WorkflowFeature = 
  | 'async_execution'         // Supports asynchronous execution
  | 'streaming_results'       // Can stream results in real-time
  | 'batch_processing'        // Can handle multiple inputs at once
  | 'conditional_logic'       // Supports if/then/else logic
  | 'parallel_execution'      // Can execute steps in parallel
  | 'human_tasks'            // Supports human intervention steps
  | 'scheduling'             // Supports scheduled execution
  | 'webhooks'               // Supports webhook triggers
  | 'file_handling'          // Can process file uploads/downloads
  | 'database_operations'    // Can interact with databases
  | 'api_integrations'       // Can call external APIs
  | 'custom_code'            // Supports custom code execution
  | 'monitoring'             // Provides execution monitoring
  | 'audit_logging';         // Maintains audit trails

/**
 * Authentication requirements for framework
 */
export interface AuthRequirement {
  type: AuthenticationType;
  required: boolean;
  description?: string;
  scopes?: string[];          // OAuth scopes if applicable
  exampleValue?: string;      // Help text for users
}

/**
 * Framework-specific metadata
 */
export interface FrameworkMetadata {
  name: string;
  version: string;
  description: string;
  website?: string;
  documentation?: string;
  
  // Capabilities
  supportedFeatures: WorkflowFeature[];
  limitations?: string[];
  
  // Technical details
  apiVersion?: string;
  requiredHeaders?: Record<string, string>;
  baseUrl?: string;
}

/**
 * Universal workflow adapter interface
 * All framework-specific adapters must implement this interface
 */
export interface WorkflowAdapter extends ProtocolAdapter {
  // Adapter identification
  readonly name: string;
  readonly version: string;
  readonly supportedFrameworks: string[];
  
  // Discovery capabilities
  canHandle(endpoint: string, response?: any): Promise<boolean>;
  discoverWorkflows(baseUrl: string): Promise<StandardWorkflowDefinition[]>;
  
  // Schema management
  getWorkflowSchema(workflowId: string): Promise<StandardJSONSchema>;
  validateInputs(workflowId: string, inputs: any): Promise<ValidationResult>;
  
  // Optional input/output transformation
  transformInputs?(workflowId: string, standardInputs: any): Promise<any>;
  transformOutputs?(workflowId: string, nativeOutputs: any): Promise<any>;
  
  // Execution management
  executeWorkflow(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResult>;
  getExecutionStatus(executionId: string): Promise<ExecutionStatus>;
  getExecutionResult(executionId: string): Promise<WorkflowExecutionResult>;
  cancelExecution?(executionId: string): Promise<boolean>;
  
  // Capabilities and metadata
  getSupportedFeatures(): WorkflowFeature[];
  getAuthenticationRequirements(): AuthRequirement[];
  getFrameworkMetadata(): FrameworkMetadata;
  
  // Framework-specific extensions
  handleFrameworkSpecificOperation?(operation: string, params: any): Promise<any>;
}

/**
 * Registry for managing workflow adapters
 */
export interface AdapterRegistry {
  registerAdapter(adapter: WorkflowAdapter): void;
  unregisterAdapter(name: string): void;
  getAdapter(frameworkName: string): WorkflowAdapter | null;
  getAllAdapters(): WorkflowAdapter[];
  detectFramework(endpoint: string, response?: any): Promise<WorkflowAdapter | null>;
  listSupportedFrameworks(): string[];
}

/**
 * Workflow discovery result (extends existing discovery types)
 */
export interface DiscoveredWorkflowService {
  id: string;
  name: string;
  description?: string;
  protocol: 'Workflow';
  subProtocol: 'Mastra' | 'OpenAPI' | 'SpiffWorkflow' | 'n8n' | 'Generic' | 'Custom';
  baseUrl: string;
  
  // Workflow-specific discovery data
  workflowCount: number;
  frameworks: string[];
  capabilities: WorkflowFeature[];
  
  // Schema support information
  schemaSupport: {
    input: boolean;
    output: boolean;
    validation: boolean;
    uiHints: boolean;
  };
  
  // Discovery metadata
  endpoints: Array<{
    url: string;
    method: string;
    type: string;  // 'discovery', 'execution', 'status', etc.
  }>;
  
  authentication?: {
    type: AuthenticationType;
    required: boolean;
    description?: string;
  };
}

/**
 * UI state for workflow execution
 */
export interface WorkflowExecutionState {
  workflowId?: string;
  definition?: StandardWorkflowDefinition;
  formData: Record<string, any>;
  validation?: ValidationResult;
  isExecuting: boolean;
  executionId?: string;
  result?: WorkflowExecutionResult;
  error?: WorkflowExecutionError;
}

/**
 * Workflow system configuration
 */
export interface WorkflowSystemConfig {
  // Default execution options
  defaultTimeout: number;
  defaultRetryAttempts: number;
  enableExecutionHistory: boolean;
  maxHistoryEntries: number;
  
  // UI preferences
  formTheme: 'baigel' | 'material' | 'bootstrap' | 'custom';
  enableAdvancedValidation: boolean;
  showExecutionLogs: boolean;
  
  // Adapter configuration
  enabledAdapters: string[];
  adapterConfigurations: Record<string, any>;
}

/**
 * Export types for external use
 */
export type {
  // Core workflow types
  StandardWorkflowDefinition,
  WorkflowExecutionRequest,
  WorkflowExecutionResult,
  
  // Schema types
  StandardJSONSchema,
  
  // Adapter types
  WorkflowAdapter,
  AdapterRegistry,
  
  // Discovery types
  DiscoveredWorkflowService,
  
  // Utility types
  ValidationResult,
  WorkflowFeature,
  ExecutionStatus,
};