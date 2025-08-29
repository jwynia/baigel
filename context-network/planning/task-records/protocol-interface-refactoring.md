# Task Record: Protocol Configuration Interface Refactoring

## Task Overview
**Status**: Planned  
**Priority**: Medium  
**Effort**: Medium (30-45 minutes)  

**One-liner**: Extract protocol configuration interfaces from implementation files to improve code organization and reusability

## Context
During code review of TypeScript improvements, identified that protocol configuration interfaces are currently defined within the implementation file (`lib/protocol-adapters/index.ts`), which reduces reusability and creates coupling between interface definitions and implementation logic.

## Problem Statement
Configuration interfaces are mixed with implementation code:

```typescript
// Currently in lib/protocol-adapters/index.ts
interface OpenAIConfig {
  apiKey: string
  baseUrl?: string
  model?: string
}

interface MCPConfig {
  serverUrl: string
  transport: 'http' | 'stdio'
  command?: string
  args?: string[]
}
// ... more interfaces mixed with adapter implementations
```

**Issues:**
- Interfaces cannot be easily imported by other modules
- Creates unnecessary coupling between types and implementation
- Reduces discoverability of available configuration options
- Makes it harder to maintain consistent typing across modules

## Proposed Solution

### 1. Create Dedicated Types File
Create new file: `lib/types/protocol-configs.ts`

### 2. Move Configuration Interfaces
Extract all protocol configuration interfaces:
- `OpenAIConfig`
- `MCPConfig` 
- `A2AConfig`
- `AnthropicConfig`
- `OllamaConfig`

### 3. Update Import Statements
Update all files importing these interfaces to use the new location.

## Acceptance Criteria
- [ ] New file `lib/types/protocol-configs.ts` created with all configuration interfaces
- [ ] All interfaces have proper JSDoc documentation
- [ ] `lib/protocol-adapters/index.ts` imports interfaces from new location
- [ ] All other files using these interfaces updated with correct imports
- [ ] No breaking changes to existing functionality
- [ ] TypeScript compilation passes without errors
- [ ] All existing tests continue to pass

## Files to Modify
- **New**: `lib/types/protocol-configs.ts`
- **Modified**: `lib/protocol-adapters/index.ts` 
- **Check for imports**: Search codebase for any other files importing these interfaces

## Implementation Notes

### Recommended Interface Structure
```typescript
/**
 * Configuration for OpenAI API protocol adapter
 */
export interface OpenAIConfig {
  /** OpenAI API key for authentication */
  apiKey: string
  /** Optional base URL override (default: https://api.openai.com/v1) */
  baseUrl?: string
  /** Model to use for completions */
  model?: string
}
```

### Migration Strategy
1. Create new types file with proper exports
2. Update protocol-adapters/index.ts to import from new location
3. Search codebase for any other imports that need updating
4. Run full test suite to ensure no regressions
5. Update any documentation referencing the old locations

## Dependencies
- No external dependencies
- Should coordinate with any other type refactoring efforts

## Risks and Mitigations
- **Risk**: Breaking imports in other files
- **Mitigation**: Comprehensive search for existing imports before refactoring
- **Risk**: Circular dependencies if not carefully structured
- **Mitigation**: Keep types file pure (no implementation imports)

## Success Metrics
- All TypeScript compilation passes
- No increase in bundle size
- Improved IDE auto-completion for configuration objects
- Other modules can easily import and use configuration interfaces

## Follow-up Items
After completion, consider:
- Creating similar extraction for other mixed interface/implementation files
- Establishing coding standards for interface organization
- Adding type validation utilities for configuration objects

---

**Created**: 2025-08-28  
**Last Updated**: 2025-08-28  
**Category**: Technical Debt / Code Organization  
**Related**: Code review improvements, TypeScript type safety project