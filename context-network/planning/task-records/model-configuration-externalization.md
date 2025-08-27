# Externalize Hardcoded Model Information

## Task Overview
**Priority**: Medium  
**Effort**: Medium (30-60 minutes)  
**Type**: Technical Debt / Maintainability  
**Created**: 2025-08-27

## Problem Statement
Model capabilities, context lengths, and other model-specific information are hardcoded in provider adapters, making them difficult to maintain and update.

**Current Issues:**
- Context lengths hardcoded in `openai.ts:301-332`
- Model capabilities scattered across inference methods
- No way to update model info without code changes
- Difficult to add new models or update existing ones

## Recommended Solution

### 1. Create Model Configuration Files
```typescript
// lib/providers/config/models/openai.json
{
  "models": {
    "gpt-4-turbo": {
      "contextLength": 128000,
      "capabilities": {
        "streaming": true,
        "functionCalling": true,
        "vision": true,
        "tools": true
      },
      "costPer1kTokens": {
        "input": 0.01,
        "output": 0.03
      },
      "deprecated": false
    },
    // ... more models
  },
  "patterns": {
    "gpt-4*": "gpt-4-family",
    "gpt-3.5*": "gpt-3.5-family"
  }
}
```

### 2. Configuration Loader
```typescript
// lib/providers/config/loader.ts
export class ModelConfigLoader {
  static async loadProviderConfig(providerType: ModelProviderType): Promise<ProviderModelConfig> {
    // Load and parse configuration files
  }
  
  static getModelInfo(providerId: string, modelId: string): ModelInfo | null {
    // Get model info from cached configuration
  }
}
```

### 3. Update Adapters
Replace hardcoded values with configuration lookups.

## Acceptance Criteria
- [ ] Create JSON configuration files for all providers
- [ ] Implement configuration loader with caching
- [ ] Update all adapters to use configuration
- [ ] Add configuration validation
- [ ] Support model pattern matching
- [ ] Add hot-reload capability for configuration changes
- [ ] Maintain backward compatibility
- [ ] Document configuration schema

## Files to Create/Modify
- `lib/providers/config/models/` (new directory)
- `lib/providers/config/loader.ts` (new)
- `lib/providers/openai.ts` (update)
- `lib/providers/openrouter.ts` (update)
- Configuration JSON files for each provider

## Benefits
- Easy model updates without code changes
- Centralized model information
- Better maintainability
- Support for user-defined model overrides

## Dependencies
- Consider using JSON Schema for config validation
- May need file system access patterns

## Risks
- Low: Changes are internal to provider system
- Need to handle configuration loading errors gracefully

## Future Enhancements
- Admin UI for model configuration management
- Automatic model discovery and config generation
- Version-controlled configuration updates