# Checklist Commands Guide

## Two Complementary Checklists

### 1. `/checklist` - Session Closure
**When to use**: Before ending a work session
**Purpose**: Ensure all discoveries and insights are captured in context network
**Focus**: Knowledge preservation, discovery documentation, relationship mapping

Key checks:
- Context network updates
- Discovery records created
- Location indexes updated
- Architectural decisions documented
- Follow-up items noted

### 2. `/checklist-task` - Task Completion
**When to use**: When you think a task is done
**Purpose**: Verify task is fully complete before marking as done
**Focus**: Code quality, tests passing, integration complete

Key checks:
- All success criteria met
- Required files modified
- Tests passing
- Component registered/integrated
- Documentation updated

## Typical Workflow

```bash
# During work session
/checklist-task build-workflow    # Check if task is complete

# If task complete, at session end
/checklist                        # Ensure knowledge captured

# Or use both together for thorough review
/checklist-task research-workflow && /checklist
```

## Quick Decision Tree

```
Am I finishing a specific task?
  YES → Use /checklist-task first
  NO  → Skip to next question

Am I ending my work session?
  YES → Use /checklist
  NO  → Continue working

Did I learn something important?
  YES → Use /checklist to ensure it's documented
  NO  → Continue working
```

## Integration with Task Tracking

The checklists integrate with the new task tracking system:

1. **CURRENT-TASKS.md** - Defines success criteria
2. **/checklist-task** - Verifies those criteria are met
3. **COMPLETED-WORK.md** - Records completion
4. **/checklist** - Ensures insights are captured

This creates a complete loop from task definition → verification → completion → knowledge capture.