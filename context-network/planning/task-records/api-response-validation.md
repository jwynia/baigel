# API Response Validation Implementation

## Task Overview
**Priority**: High  
**Effort**: Medium (30-60 minutes)  
**Type**: Bug Prevention / Security  
**Created**: 2025-08-27

## Problem Statement
Provider adapters process API responses from external services without validation, which could lead to runtime errors or security issues with malformed data.

**Current Risk Areas:**
- Model list responses (`listModels()` methods)
- Chat completion responses 
- Streaming response chunks
- Error responses

## Recommended Solution

### 1. Create Response Schema Definitions
```typescript
// lib/providers/validation/schemas.ts
export const ModelListResponseSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    object: z.string(),
    created: z.number().optional(),
    owned_by: z.string().optional(),
  }))
});

export const ChatCompletionResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: z.object({
      role: z.string(),
      content: z.string(),
    }).optional(),
    finish_reason: z.string().optional(),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }).optional()
});
```

### 2. Add Validation Utility
```typescript
// lib/providers/validation/validator.ts
export class ResponseValidator {
  static validateModelList(response: unknown): ModelListResponse {
    const result = ModelListResponseSchema.safeParse(response);
    if (!result.success) {
      throw new ProviderError('Invalid model list response format', 'VALIDATION_ERROR');
    }
    return result.data;
  }
  
  static validateChatCompletion(response: unknown): ChatCompletionResponse {
    // Similar validation logic
  }
}
```

### 3. Update Provider Adapters
Add validation calls in each adapter's API response handling.

## Acceptance Criteria
- [ ] Create validation schemas for all API response types
- [ ] Implement validation utility with clear error messages
- [ ] Update all provider adapters to validate responses
- [ ] Add graceful degradation for optional fields
- [ ] Add comprehensive test coverage for validation
- [ ] Maintain performance (validation should be fast)
- [ ] Document validation requirements for new providers

## Files to Modify
- `lib/providers/validation/` (new directory)
- `lib/providers/base.ts`
- `lib/providers/openai.ts`
- `lib/providers/openai-compatible.ts`
- `lib/providers/openrouter.ts`

## Dependencies
- Consider adding `zod` for schema validation
- Alternative: Create lightweight custom validation

## Risks
- Medium: Changes error handling patterns
- Need to ensure validation doesn't break existing functionality
- Performance impact should be minimal

## Implementation Notes
- Start with model list validation (most critical)
- Add optional/strict validation modes
- Consider caching validation results for repeated calls