---
name: step3
description: "ONLY when user explicitly types /step3. Never auto-trigger on execute, run, or implement."
---

# /step3

Execute `_step2_plan.md` by dispatching phases to subagents via Task tool. Main thread orchestrates only — never executes tasks directly.

Fresh session, zero prior context. `_step2_plan.md` contains everything.

## Gates

Violation = skill failure.

1. NO EnterPlanMode/ExitPlanMode — this skill IS the execution framework.
2. Git checkpoint commit BEFORE dispatching any subagent. Store hash — without it, failure recovery impossible.
3. On success: delete `_step2_plan.md` + final commit BEFORE reporting completion.
4. NEVER execute tasks directly — delegate via Task tool (general-purpose).

## Flow

All-or-nothing execution. Checkpoint before any phase runs. On failure, user resets to checkpoint — no partial recovery.

Main thread is a lightweight dispatcher: read `_step2_plan.md` once, store only phase numbers/deps/groups/titles, dispatch subagents, report 1-line progress per phase. Never read files beyond `_step2_plan.md`, never accumulate subagent details.

### 1. CHECKPOINT

- `git add -A && git commit -m "checkpoint before run"`
- Remote check: `git remote | head -1` — if exists, `git push`; else skip
- Store hash: `git rev-parse HEAD`
- This commits everything including `_step2_plan.md` (safety net)

### 2. LOAD

- Read `_step2_plan.md`, verify `<!-- @plan: /step2 ... -->` marker
- Parse overview table (deps, groups, titles)

### 3. EXECUTE LOOP

While phases remain:
1. Find ready phases (deps satisfied, not done)
2. Batch by parallel group: all ready in same group → ONE message, MULTIPLE Task calls. NEVER mix groups.
3. Dispatch — one Task call per phase using template below
4. On ANY failure: STOP → jump to ON FAILURE
5. Log: `"Phase N: [title]"`

**Dispatch template** — each subagent receives ONLY:

```markdown
# Context
Goal: [1-2 sentences from _step2_plan.md Goal field]
Rationale: [from _step2_plan.md Rationale section]
Working directory: [absolute path]

# Dependencies
[Verbatim from Phases Overview, e.g.: "Depends: 2 (creates lib/core.py)"]
[Omit section if no dependencies]

# Your Assignment: Phase N
[EXACT phase section from _step2_plan.md]

# Instructions
1. Read Reference files FIRST — understand patterns before writing code
2. Execute all tasks in order
3. RESPECT Guardrails — hard constraints, not suggestions
4. Stay within Modifies scope — no files outside it
5. On failure: stop immediately, return error details
6. Return 1-2 sentence summary of what was done
```

### 4. ON SUCCESS

- Delete `_step2_plan.md`
- `git add -A && git commit -m "run complete: [Goal from _step2_plan.md]"`
- Remote check: push if exists
- Report: `"Run complete. N/N phases succeeded. Committed: <short-hash>"`

### 5. ON FAILURE

Failed = Task tool errors (crash, timeout) or subagent reports could not complete.

```
+-------------------------------------------------------+
| PLAN FAILED — RESET TO CHECKPOINT RECOMMENDED         |
| Checkpoint: <hash>                                    |
| Recovery: git reset --hard <hash> && git push --force |
| (Discards ALL changes, restores _step2_plan.md)       |
+-------------------------------------------------------+
| Failed: Phase N — [error summary]                     |
| Completed: Phases X, Y, Z                             |
| Not started: Phases A, B, C                           |
+-------------------------------------------------------+
```

Do NOT suggest partial recovery or fixing in place. Propose reset. User decides to keep partial changes.

## Format

```
Checkpoint created: abc1234
Loading _step2_plan.md... N phases, M parallel groups

Group A:
  Phase 1: [title]

Group B (parallel):
  Phase 2: [title]
  Phase 3: [title]
Group C:
  Phase 4: [title]

Run complete. N/N phases succeeded. Committed: abc1235
```

## Rules

- All-or-nothing — never resume or partially recover, checkpoint reset only.
- Minimal orchestrator context — 1 line per completed phase, nothing more.
- Same parallel group only — never mix groups in parallel.
- Fail-fast — stop on first failure, present reset box.
- Never modify `_step2_plan.md` during execution — source of truth.
