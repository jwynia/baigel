# Model Capability Inference Refactoring

## Task Overview
**Priority**: High  
**Effort**: Medium (30-60 minutes)  
**Type**: Technical Debt / Refactoring  
**Created**: 2025-08-27

## Problem Statement
The `inferModelCapabilities()` methods in each provider adapter contain duplicated logic and hardcoded model information. This creates maintenance burden and inconsistency across providers.

**Current State:**
- OpenAI adapter: 50+ lines of hardcoded model capabilities (`openai.ts:240-300`)
- OpenRouter adapter: Similar capability inference logic
- OpenAI-compatible adapter: Duplicated patterns
- Each adapter reinvents the wheel for capability detection

## Recommended Solution

### 1. Create Shared Capability Registry
```typescript
// lib/providers/capabilities/registry.ts
export interface ModelCapabilityDefinition {
  patterns: string[];
  capabilities: ModelCapabilities;
  contextLength?: number;
  costMultiplier?: number;
}

export const MODEL_CAPABILITY_REGISTRY: Record<string, ModelCapabilityDefinition[]> = {
  openai: [
    {
      patterns: ['gpt-4-turbo', 'gpt-4-0125'],
      capabilities: { streaming: true, functionCalling: true, vision: true },
      contextLength: 128000
    },
    // ... more definitions
  ],
  // ... other providers
};
```

### 2. Extract Shared Inference Logic
```typescript
// lib/providers/capabilities/inference.ts
export class CapabilityInferenceEngine {
  static inferCapabilities(
    modelId: string, 
    providerType: ModelProviderType,
    fallback?: ModelCapabilities
  ): ModelCapabilities {
    // Centralized inference logic
  }
}
```

### 3. Update All Adapters
Replace individual `inferModelCapabilities()` methods with calls to shared engine.

## Acceptance Criteria
- [ ] Create capability registry with existing model definitions
- [ ] Implement shared inference engine
- [ ] Update all provider adapters to use shared logic
- [ ] Maintain 100% backward compatibility
- [ ] Add mechanism for provider-specific overrides
- [ ] Add tests for capability inference
- [ ] Reduce code duplication by 80%+

## Files to Modify
- `lib/providers/capabilities/` (new directory)
- `lib/providers/openai.ts`
- `lib/providers/openai-compatible.ts` 
- `lib/providers/openrouter.ts`
- Future: `lib/providers/ollama.ts`, `lib/providers/lmstudio.ts`

## Dependencies
- None (self-contained refactoring)

## Risks
- Low: Changes are internal to provider system
- Extensive testing needed to ensure no regressions

## Follow-up Tasks
- Add capability override UI in provider management
- Create capability testing utilities
- Document capability definitions for new providers