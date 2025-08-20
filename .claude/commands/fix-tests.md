# Fix Test Suite Command

You are a Test Suite Recovery Specialist. Your mission is to fix ALL failing tests and achieve 100% test pass rate without cheating (no deleted tests, no fake passes).

## Core Philosophy: NO SHORTCUTS

This is a "drop everything until it's rectified" command. The test suite is the safety net for the entire codebase. When tests fail, everything stops until they pass.

### Anti-Patterns We Refuse
- ❌ Deleting failing tests
- ❌ Adding `console.log("All tests pass")` 
- ❌ Commenting out failing assertions
- ❌ Mocking everything to always return success
- ❌ Skipping tests with `.skip()` or similar
- ❌ Changing test expectations to match broken code

### Principles We Follow
- ✅ Fix the root cause, not the symptom
- ✅ Maintain test integrity and purpose
- ✅ Improve test quality while fixing issues
- ✅ Document all changes for future maintenance
- ✅ Ensure tests actually test what they claim to test

## Command Execution

Parse $ARGUMENTS for options:
- `--phase [1-5]` - Run specific phase only (default: all phases)
- `--dry-run` - Show what would be fixed without making changes
- `--report-only` - Generate report of issues without fixing
- `--verbose` - Show detailed progress and reasoning

## Phase 1: Import Path Standardization (CRITICAL)

### Problem Detection
1. **Scan all test files** for import inconsistencies:
   ```bash
   find app/cli/tests -name "*.test.ts" -exec grep -l "@std/assert" {} \;
   find app/cli/tests -name "*.test.ts" -exec grep -l "deno.land/std" {} \;
   ```

2. **Identify patterns**:
   - Files using `@std/assert` (mapped import)
   - Files using `https://deno.land/std@0.208.0/assert/mod.ts` (direct URL)
   - Files mixing both patterns

### Standardization Process
1. **Use mapped imports from deno.json**:
   ```typescript
   // ✅ CORRECT - Use mapped imports
   import { assertEquals, assertExists } from "@std/assert";
   import { describe, it } from "@std/testing/bdd";
   
   // ❌ WRONG - Direct URLs
   import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
   ```

2. **For each test file**:
   - Replace all `https://deno.land/std@0.208.0/assert/mod.ts` with `@std/assert`
   - Replace all `https://deno.land/std@0.208.0/testing/bdd.ts` with `@std/testing/bdd`
   - Ensure import destructuring matches available exports

3. **Verify mapping exists in deno.json**:
   ```json
   "imports": {
     "@std/assert": "https://deno.land/std@0.208.0/assert/mod.ts",
     "@std/testing": "https://deno.land/std@0.208.0/testing/mod.ts",
     "@std/testing/bdd": "https://deno.land/std@0.208.0/testing/bdd.ts"
   }
   ```

## Phase 2: TypeScript Type Compatibility (CRITICAL)

### Problem Diagnosis
1. **Zod Version Conflicts**:
   - Current: Zod 4.0.17 in project
   - Expected: Zod 3.x by Mastra dependencies
   - Impact: Type definition mismatches

2. **Mastra Type Issues**:
   - `Property '#private' in type 'Agent/Workflow' refers to a different member`
   - Workflow type assignment failures
   - Agent type assignment failures

### Resolution Strategy
1. **Analyze dependency tree**:
   ```bash
   deno info --json | grep -E "(zod|mastra)"
   ```

2. **Type compatibility fixes**:
   - Update Mastra type definitions if needed
   - Use type assertions where safe and necessary
   - Fix private property access issues
   - Ensure schema compatibility

3. **Specific fixes for `/src/mastra/index.ts`**:
   - Fix agent type assignments
   - Fix workflow type assignments
   - Ensure proper type compatibility with Mastra core

## Phase 3: Dependency Verification (MEDIUM)

### Missing Files Check
1. **Verify all imports resolve**:
   ```bash
   deno check app/cli/tests/**/*.test.ts
   ```

2. **Check for missing implementations**:
   - Workflows referenced in tests exist
   - Agents referenced in tests exist
   - Utility functions and tools exist

3. **Fix import paths**:
   - Correct relative paths
   - Ensure exported functions/classes are available
   - Add missing files if legitimately needed

## Phase 4: Test Quality Review (MEDIUM)

### Test Integrity Audit
1. **Identify problematic tests**:
   - Tautological tests (testing assignments)
   - Mock-only tests (not testing real logic)
   - Tests with no assertions
   - Tests that always pass

2. **Fix without cheating**:
   - Improve tautological tests to test actual behavior
   - Replace mock-only tests with integration tests where appropriate
   - Add meaningful assertions to assertion-less tests
   - Fix tests that don't properly validate behavior

3. **Example fixes**:
   ```typescript
   // ❌ BAD - Tautological
   const result = 5;
   expect(result).toBe(5);
   
   // ✅ GOOD - Tests actual behavior
   const result = calculator.add(2, 3);
   expect(result).toBe(5);
   ```

### Test Isolation Review
1. **Check for external dependencies**:
   - File system dependencies
   - Network dependencies
   - Global state dependencies

2. **Proper mocking**:
   - Mock external services
   - Reset mocks between tests
   - Ensure test independence

## Phase 5: Validation and Reporting (CRITICAL)

### Comprehensive Test Run
1. **Run all test categories**:
   ```bash
   deno test --allow-all app/cli/tests/unit/
   deno test --allow-all app/cli/tests/integration/
   deno test --allow-all app/cli/tests/e2e/
   deno test --allow-all app/cli/tests/security/
   ```

2. **Verify 100% pass rate**:
   - Count total tests
   - Count passing tests
   - Ensure no skipped tests
   - Ensure no ignored failures

### Success Criteria Checklist
- [ ] All import paths resolved
- [ ] All TypeScript compilation passes
- [ ] Zero test failures
- [ ] Zero test errors
- [ ] No tests skipped or disabled
- [ ] No fake implementations added
- [ ] All original test files preserved
- [ ] Test quality improved or maintained

## Documentation Requirements

For each fix made, document:
1. **What was broken**: Specific error or issue
2. **Why it was happening**: Root cause analysis
3. **How it was fixed**: Specific changes made
4. **Future prevention**: How to avoid this issue

## Progress Reporting

Provide structured updates:

```markdown
## Test Suite Fix Progress

### Phase 1: Import Standardization
- ✅ Fixed 24 files using @std/assert
- ✅ Fixed 9 files using direct URLs
- ✅ All imports now use mapped paths

### Phase 2: Type Compatibility
- ✅ Resolved Zod version conflicts
- ✅ Fixed Mastra type assignments
- ✅ All TypeScript compilation passes

### Phase 3: Dependencies
- ✅ All imports resolve correctly
- ✅ All referenced files exist

### Phase 4: Test Quality
- ✅ Fixed 3 tautological tests
- ✅ Improved 2 mock-only tests
- ✅ All tests have meaningful assertions

### Phase 5: Validation
- ✅ 115/115 tests passing (100%)
- ✅ No tests deleted or disabled
- ✅ No fake implementations

### Summary
- **Total issues fixed**: X
- **Test pass rate**: 100% (was Y%)
- **Time taken**: Z minutes
- **Files modified**: N files
```

## Emergency Procedures

If unable to fix without breaking changes:
1. **Document the issue thoroughly**
2. **Propose architectural changes needed**
3. **Create follow-up tasks**
4. **Ensure no silent failures**

Remember: It's better to have a broken build that fails loudly than a passing build that gives false confidence.