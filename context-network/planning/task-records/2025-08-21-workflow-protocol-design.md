# Task Record: Workflow Protocol Support Design

## Task Overview
**Started**: 2025-08-21  
**Status**: 🚧 In Progress  
**Phase**: Design & Planning  

**One-liner**: Add workflow execution protocol support to BAIGEL with homogenization adapter layer

## Context & Motivation

### Discovery Context
During completion of agent/tool discovery system, user identified opportunity for "fourth protocol" support. Research into Mastra workflow endpoints revealed pattern where workflow frameworks expose JSON schemas via OpenAPI that can generate dynamic UI forms for workflow execution.

### Research Foundation
- **Mastra Research**: Workflows expose structure through OpenAPI specifications and JSON schemas
- **Framework Analysis**: Multiple workflow frameworks (n8n, SpiffWorkflow, etc.) use similar schema → form patterns
- **Gap Identification**: No universal workflow execution interface exists (unlike conversational protocols)

### Strategic Insight
User emphasized need for "homogenization adapter layer" - ensure BAIGEL UI works against standardized internal interface, with adapters translating various external formats (Mastra's OpenAPI, n8n schemas, etc.) into that standard. This future-proofs against schema format evolution.

## Technical Design Strategy

### Architecture Philosophy: Adapter-First Design
1. **Standard Internal Interface**: BAIGEL UI works against canonical workflow representation
2. **Adapter Translation Layer**: Each framework adapter normalizes to standard format
3. **Future-Proof Abstraction**: UI unchanged regardless of which schema formats become dominant
4. **Extensibility**: New frameworks supported by adding adapters, not changing UI

### Protocol Classification
Workflow protocols differ from conversational protocols (A2A, MCP, OpenAI):
- **Conversational**: Natural language interaction, streaming responses, context management
- **Workflow**: Form-driven execution, structured I/O, deterministic results

## Design Documentation Created

### 1. Protocol Definition (`/elements/protocols/workflow.md`)
**Comprehensive protocol specification including**:
- Standard internal workflow representation
- Universal adapter interface contract
- Schema standardization format
- Framework support strategy
- Integration with existing BAIGEL architecture

### 2. Implementation Roadmap
**Four-phase development plan**:
- **Phase 1**: Foundation with Mastra adapter
- **Phase 2**: Universal UI and form generation
- **Phase 3**: Multi-framework support
- **Phase 4**: Advanced features and optimization

## Key Design Decisions

### 1. Schema Standardization Strategy
**Decision**: Create `StandardJSONSchema` interface with UI hints extension
**Rationale**: 
- Normalizes various schema formats (OpenAPI, pure JSON Schema, BPMN forms)
- Adds BAIGEL-specific UI generation hints without breaking standards
- Enables consistent form generation regardless of source framework

### 2. Adapter Interface Design
**Decision**: Extend existing `ProtocolAdapter` interface for consistency
**Rationale**:
- Maintains architectural consistency with A2A/MCP/OpenAI adapters
- Leverages existing authentication and transport systems
- Enables uniform configuration and management

### 3. Framework Support Prioritization
**Decision**: Start with Mastra, then Generic OpenAPI, then specialized frameworks
**Rationale**:
- Mastra provides clear research foundation and test case
- Generic OpenAPI covers broad range of potential frameworks
- Specialized adapters (SpiffWorkflow, n8n) add unique capabilities

### 4. UI Architecture Strategy
**Decision**: Use React JSON Schema Form (RJSF) with custom theme
**Rationale**:
- Mature library with extensive customization options
- Handles complex schema types and validation
- Enables consistent theming with BAIGEL design system

## Integration Design

### With Existing Discovery System
- Extend current discovery prober to detect workflow endpoints
- Add workflow service cards to discovery results
- Integrate workflow execution into discovery flow

### With Protocol Adapter System
- Follow established adapter patterns
- Use same authentication and transport layers
- Prepare for message bus integration

### With Settings Management
- Add workflow configurations to export/import system
- Store execution history and favorites
- Manage framework-specific authentication

## Implementation Architecture

### Component Structure
```
WorkflowSystem/
├── Discovery/           # Workflow service discovery
├── Execution/           # Form generation and execution
├── Management/          # History, favorites, catalog
└── Common/             # Shared utilities
```

### Adapter Architecture
```
AdapterLayer/
├── workflow-adapter.ts     # Base interface
├── mastra-adapter.ts       # First implementation
├── generic-openapi-adapter.ts
├── spiffworkflow-adapter.ts
└── adapter-registry.ts     # Dynamic loading
```

### Type System
```
TypeDefinitions/
├── workflows.ts            # Core workflow types
├── standard-schema.ts      # Normalized schema format
├── execution.ts           # Execution request/response
└── adapters.ts            # Adapter interfaces
```

## Research Findings Incorporated

### JSON Schema to Form Libraries
- **React JSON Schema Form (RJSF)**: Primary choice for maturity and flexibility
- **JSON Forms**: Alternative with good Angular/Vue support
- **Autoform**: Modern TypeScript solution for future consideration

### Workflow Framework Patterns
- **OpenAPI 3.1+**: Standard approach for schema exposure
- **Custom Schema Extensions**: Framework-specific enhancements
- **Execution Patterns**: HTTP POST vs specialized APIs

### Form Generation Strategies
- **Data Schema**: Workflow input/output requirements
- **UI Schema**: Layout and presentation rules
- **Custom Renderers**: Framework-specific components

## Risk Mitigation Strategy

### Standards Evolution Risk
**Risk**: Schema formats might converge on different standard than anticipated
**Mitigation**: Adapter layer abstracts format differences, UI remains unchanged

### Framework Fragmentation Risk  
**Risk**: Too many incompatible workflow frameworks to support
**Mitigation**: Generic OpenAPI adapter covers broad range, specialized adapters for unique value

### Performance Risk
**Risk**: Dynamic form generation might be slow for complex schemas
**Mitigation**: Schema caching, lazy loading, progressive enhancement

### Complexity Risk
**Risk**: Adapter interface becomes too complex to maintain
**Mitigation**: Start simple with Mastra, evolve interface based on real needs

## Success Criteria Definition

### Technical Success
- [ ] Standard workflow interface defined and stable
- [ ] Mastra adapter working end-to-end
- [ ] Generic OpenAPI adapter supporting multiple frameworks
- [ ] UI generates forms matching original framework UX quality

### User Experience Success
- [ ] Discovery → execution flow under 2 minutes
- [ ] Generated forms intuitive and accessible
- [ ] Error handling clear and actionable
- [ ] Integration feels native to BAIGEL

### Architectural Success
- [ ] Adapter pattern consistent with existing protocols
- [ ] UI unchanged when adding new framework support
- [ ] Export/import includes workflow configurations
- [ ] Performance acceptable for complex workflows

## Next Steps (Implementation Phase)

### Immediate Tasks (Phase 1 Week 1)
1. **Create Core Types** (`/types/workflows.ts`)
2. **Build Standard Schema Interface** (`StandardJSONSchema`)  
3. **Implement Base Adapter** (`WorkflowAdapter` abstract class)
4. **Create Mastra Adapter** (first concrete implementation)
5. **Extend Discovery System** (workflow detection)
6. **Build Basic UI Components** (executor shell, form renderer foundation)

### Success Validation
- Local Mastra server workflow discoverable via BAIGEL discovery
- Generated form matches Mastra playground UX
- Workflow execution completes successfully
- Results displayed appropriately

## Dependencies & Prerequisites

### Technical Dependencies
- React JSON Schema Form (RJSF) library integration
- OpenAPI specification parsing capability
- JSON Schema validation library
- Form rendering and validation framework

### Knowledge Dependencies
- Mastra local server setup and configuration
- OpenAPI 3.1 specification understanding  
- JSON Schema format expertise
- React form handling patterns

### Integration Dependencies
- Existing discovery system extension points
- Protocol adapter interface compliance
- Settings system configuration management
- Navigation and routing integration

## Documentation Artifacts Created

1. **Protocol Specification**: `/elements/protocols/workflow.md` (462 lines)
2. **Task Record**: This document
3. **Implementation Plan**: Embedded in protocol specification
4. **Integration Strategy**: Documented in protocol specification

## Context Network Integration

### Related Elements
- [[elements/protocols/mcp]] - Pattern reference for protocol design
- [[elements/protocols/a2a]] - Adapter architecture consistency  
- [[research/claude-code-sdk-protocol/]] - Protocol integration patterns

### Discovery Integration
- Builds on existing discovery system architecture
- Extends current protocol detection capabilities
- Maintains discovery UI consistency patterns

### Future Context Updates
- [ ] Update component location index when implementation complete
- [ ] Document workflow adapter relationships
- [ ] Create workflow system navigation hub

---

**Status**: Design phase complete, ready for implementation. All major architectural decisions documented, risks identified, and success criteria defined. Implementation can proceed with confidence in the design foundation.