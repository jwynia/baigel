## Task Completion Checklist

Verify that a specific task is fully complete and ready to be marked as done.

### Usage
When called with a task name, verify all completion criteria are met.

### Task Completion Verification
- [ ] **Success Criteria**: All checkboxes in CURRENT-TASKS.md marked complete for this task
- [ ] **Code Changes**: All files listed in "Files to Modify" have been created/updated
- [ ] **Tests Passing**: Unit tests for new/modified code are passing
- [ ] **Integration**: New components registered in appropriate index files
- [ ] **Documentation**: Task moved from CURRENT-TASKS.md to COMPLETED-WORK.md
- [ ] **Context Network**: Implementation details recorded in context network

### Code Quality Checks
- [ ] **No broken imports**: All new files properly imported where needed
- [ ] **Consistent patterns**: Follows established patterns from similar workflows
- [ ] **Security**: Path sanitization and input validation included where needed
- [ ] **Error handling**: Proper error messages and fallbacks implemented

### Workflow-Specific Checks (if applicable)
- [ ] **Workflow registered**: Added to mastra/index.ts workflows object
- [ ] **Registry entry**: Added to workflowRegistry with result extractor
- [ ] **Schema validation**: Input/output schemas properly defined
- [ ] **Help text**: Workflow appears in help command output

### Build & Test Verification
```bash
# Run these commands to verify:
deno test --allow-all --no-check  # All tests should pass
deno task lint                     # No lint errors
deno task typecheck               # No type errors
```

### Final Steps
- [ ] **Next task clear**: CURRENT-TASKS.md shows clear next priority
- [ ] **Lessons learned**: Any insights added to COMPLETED-WORK.md entry
- [ ] **Time tracking**: Actual time vs estimate recorded

### Example Usage
```
/checklist-task build-workflow

✅ Success Criteria: 6/6 complete
✅ Code Changes: All 3 files modified
✅ Tests: 36/36 passing
✅ Integration: Registered in mastra/index.ts
⚠️ Documentation: Not yet moved to COMPLETED-WORK.md
✅ Context Network: Implementation recorded

Task Score: 5/6 - Almost done!
Next: Move task documentation to COMPLETED-WORK.md
```

$ARGUMENTS