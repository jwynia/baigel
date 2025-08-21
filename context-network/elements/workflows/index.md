# Workflow System Elements

## Overview
The workflow system provides BAIGEL with the ability to discover and execute structured workflows from various frameworks through a unified interface.

## Core Components

### Type System
- **Location**: `/types/workflows.ts`
- **Purpose**: Complete type definitions for workflow protocol support
- **Key Types**: StandardWorkflowDefinition, WorkflowExecutionRequest/Result, StandardJSONSchema

### Adapter Framework
- **Base Adapter**: `/lib/adapters/workflow-adapter.ts`
- **Mastra Adapter**: `/lib/adapters/mastra-adapter.ts`
- **Purpose**: Framework-agnostic workflow execution through adapter pattern

### UI Components
- **Location**: `/components/workflows/`
- **Components**:
  - WorkflowExecutor - Main execution interface
  - UniversalFormRenderer - Dynamic form generation from JSON Schema
  - ExecutionProgress - Real-time status tracking
  - ResultsDisplay - Comprehensive output viewer

### Discovery Integration
- **Modified Files**:
  - `/types/discovery.ts` - Added Workflow protocol type
  - `/lib/discovery/protocols.ts` - Workflow parsing functions
  - `/lib/discovery/prober.ts` - Workflow detection logic

## Architecture Patterns

### Homogenization Adapter Layer
All workflow frameworks are normalized to a standard internal representation, ensuring:
- UI remains unchanged when adding new frameworks
- Framework peculiarities are abstracted away
- Future-proof against schema format evolution

### Schema-Driven UI Generation
Dynamic forms are generated from JSON schemas with UI hints:
- Automatic widget selection based on schema type
- Validation in real-time
- Support for complex nested structures

## Supported Frameworks

### Currently Implemented
- **Mastra**: Full support via MastraAdapter
  - Live instance: `http://100.80.122.46:4111/`
  - Exposes MCP tools as workflows
  - JSON Schema for inputs/outputs

### Planned Support
- n8n workflow automation
- SpiffWorkflow (BPMN)
- Generic OpenAPI workflows
- Apache Airflow
- Custom internal workflows

## Key Files Reference

### Type Definitions
- `/types/workflows.ts:18-103` - StandardJSONSchema with UI hints
- `/types/workflows.ts:108-159` - StandardWorkflowDefinition
- `/types/workflows.ts:174-194` - WorkflowExecutionRequest
- `/types/workflows.ts:199-231` - WorkflowExecutionResult

### Adapter Implementation
- `/lib/adapters/workflow-adapter.ts:26-124` - BaseWorkflowAdapter interface
- `/lib/adapters/workflow-adapter.ts:166-333` - Schema validation logic
- `/lib/adapters/mastra-adapter.ts:60-223` - Mastra-specific implementation

### UI Components
- `/components/workflows/WorkflowExecutor.tsx` - Complete execution UI
- `/components/workflows/UniversalFormRenderer.tsx` - Form generation engine

## Related Documentation
- [[protocols/workflow]] - Protocol specification
- [[../planning/task-records/2025-08-21-workflow-protocol-design]] - Implementation record
- [[../discoveries/records/2025-08-21-001-mastra-workflow-patterns]] - Mastra patterns
- [[../discoveries/records/2025-08-21-002-adapter-architecture-pattern]] - Adapter architecture