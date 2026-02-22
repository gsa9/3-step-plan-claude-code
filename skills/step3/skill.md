---
name: step3
description: "ONLY when user explicitly types /step3. Never auto-trigger on execute, run, or implement."
---

# /step3 - Execute Plan via Subagents

Execute `_step2_plan.md` by dispatching phases to subagents via Task tool. Main thread orchestrates only — it never executes tasks directly.

Designed for a fresh session with zero prior context. `_step2_plan.md` contains everything.

## Gates

Violations of any gate = skill failed. Dual-framed for clarity.

1. **NEVER use EnterPlanMode.** This skill IS the execution framework — plan mode hijacks the dispatch loop.
2. **Create a git checkpoint commit BEFORE dispatching any subagent.** Store the commit hash — without it, failure recovery is impossible.
3. **On success, delete `_step2_plan.md` and create final commit BEFORE reporting completion.** Missing either = skill failed.
4. **NEVER execute tasks directly — always delegate via Task tool (general-purpose).** Main thread orchestrates only.

## Flow

Execution model: all-or-nothing. A git checkpoint is created before any phase runs. If anything fails, the user resets to the checkpoint — no partial recovery, no resume.

Main thread is a lightweight dispatcher: reads `_step2_plan.md` once, stores only phase numbers / dependencies / parallel groups / titles, dispatches subagents, and reports 1-line progress per phase. It never reads files beyond `_step2_plan.md` and never accumulates subagent details in its own context.

### 1. CHECKPOINT

**[Gate 2 enforced here]** — do not proceed past this step without a stored commit hash.

- Run: `git add -A && git commit -m "checkpoint before run"`
- Check for remote: `git remote | head -1` — if a remote exists, run `git push`; otherwise skip push
- Store the commit hash: `git rev-parse HEAD`
- This commits everything including `_step2_plan.md` — the safety net

### 2. LOAD

- Read `_step2_plan.md`, verify marker `<!-- @plan: /step2 ... -->`
- Parse phases overview table (deps, groups, titles)

### 3. EXECUTE LOOP

While phases remain:

1. Find ready phases (deps satisfied, not done)
2. Batch by parallel group:
   - All ready in same group -> ONE message with MULTIPLE Task calls (parallel)
   - NEVER mix different groups in parallel
3. Dispatch subagent(s) — one Task call per phase, using the template below
4. On ANY failure: STOP, jump to step 5 (ON FAILURE)
5. Log: `"Phase N: [title]"`

**Subagent dispatch template** — each subagent receives ONLY this text:

```markdown
# Context
Goal: [1-2 sentences from _step2_plan.md Goal field]
Rationale: [from _step2_plan.md Rationale section]
Working directory: [absolute path]

# Dependencies
[Verbatim dependency notes from Phases Overview, e.g.: "Depends: 2 (creates lib/core.py)"]
[Omit section if phase has no dependencies]

# Your Assignment: Phase N
[EXACT phase section copied from _step2_plan.md]

# Instructions
1. Read the Reference files FIRST — understand patterns before writing code
2. Execute all tasks in order
3. RESPECT Guardrails — these are hard constraints, not suggestions
4. Stay within Modifies scope — do not touch files outside it
5. On failure: stop immediately, return error details
6. Return 1-2 sentence summary of what was done
```

### 4. ON SUCCESS

**[Gate 3 enforced here]** — do not report completion until both steps below are confirmed.

- Delete `_step2_plan.md`
- Run: `git add -A && git commit -m "run complete: [Goal field from _step2_plan.md]"`
- Check for remote: `git remote | head -1` — if a remote exists, run `git push`; otherwise skip push
- Store the final commit hash
- Report: `"Run complete. N/N phases succeeded. Committed: <short-hash>"`

### 5. ON FAILURE

A phase has failed when the Task tool errors (agent crash, timeout) or the subagent explicitly reports it could not complete a task.

On any failure, present:

```
+------------------------------------------------------------------+
|  PLAN FAILED -- RESET TO CHECKPOINT RECOMMENDED                  |
|                                                                   |
|  Checkpoint: <hash> (committed at start of this session)          |
|                                                                   |
|  To recover:                                                      |
|    git reset --hard <hash>                                        |
|    git push --force                                               |
|                                                                   |
|  This discards ALL changes from this run and restores             |
|  the codebase with _step2_plan.md intact for a clean re-run.     |
+-------------------------------------------------------------------+
|  Failed: Phase N -- [error summary]                               |
|  Completed before failure: Phases X, Y, Z                         |
|  Not started: Phases A, B, C                                      |
+-------------------------------------------------------------------+
```

Do NOT suggest partial recovery, resuming, or fixing in place. Propose the reset. If the user wants to keep partial changes, that is their call.

## Format

```
/step3

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

- Never resume or partially recover — all-or-nothing with checkpoint reset
- Minimal orchestrator context — store 1 line per completed phase, nothing more
- Same parallel group only — never dispatch phases from different groups in parallel
- Fail-fast — stop on first failure, present reset box immediately
- Never modify `_step2_plan.md` during execution — it is the source of truth
