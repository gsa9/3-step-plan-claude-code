---
name: step3
description: "ONLY when user explicitly types /step3. Never auto-trigger on execute, run, or implement."
---

# /step3

Execute `_step2_plan.md` by dispatching phases to subagents via Agent tool. Main thread orchestrates only.

## Gates

1. NO EnterPlanMode/ExitPlanMode — this skill IS the execution framework.
2. Checkpoint BEFORE dispatching any subagent. Store recovery info — failure recovery depends on it.
3. On success: delete `_step2_plan.md` (+ `_step3_backup/` if it exists) via platform-safe method + final commit (if git repo) BEFORE reporting completion.
4. All implementation via Agent tool (general-purpose).
5. Never use AskUserQuestion. Ask in plain text output.

## Flow

All-or-nothing execution. On failure, user decides recovery — no automatic partial recovery.

Main thread is a lightweight dispatcher: read `_step2_plan.md` once, store only phase numbers/deps/groups/titles, dispatch subagents, report 1-line progress per phase.

### 1. CHECKPOINT

Detect environment, then checkpoint accordingly:

**If git repo:**
```
git add -A && git commit -m "checkpoint before run"
```
Store hash: `git rev-parse HEAD`
Do NOT push yet — push only on success (step 4).

**If modifying existing files (no git):**
Copy all files referenced in the plan's Inputs/Outputs to `_step3_backup/`, preserving relative paths.

**If greenfield with no git:**
Skip checkpoint — nothing to recover.

### 2. LOAD

Read `_step2_plan.md`, verify `<!-- @plan: /step2 -->` marker. Parse overview table.

### 3. EXECUTE LOOP

While phases remain:
1. Find ready phases (deps satisfied)
2. Batch by parallel group — same group → ONE message, MULTIPLE Agent calls. Never mix groups.
3. Dispatch per template below
4. Any failure → ON FAILURE
5. Log: `"Phase N: [title]"`

**Dispatch template:**
```markdown
# Context
Goal: [from plan Goal field]
Rationale: [from plan Rationale section]
Working directory: [absolute path]

# Dependencies
[From Phases Overview. Omit if none.]

# Your Assignment: Phase N
[EXACT phase section from plan]

# Instructions
1. Read Inputs FIRST — understand context before producing anything
2. Guardrails are hard constraints, not suggestions
3. Stay within Outputs scope — nothing outside it
4. On failure: stop immediately, return error details
```

### 4. ON SUCCESS

```
# 1. delete plan + backup via platform-safe method (Recycle Bin — never permanent delete)
# On Windows:
powershell -NoProfile -Command 'Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile((Join-Path "WORKING_DIR" "_step2_plan.md"),"OnlyErrorDialogs","SendToRecycleBin")'
# If _step3_backup/ exists:
powershell -NoProfile -Command 'Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory((Join-Path "WORKING_DIR" "_step3_backup"),"OnlyErrorDialogs","SendToRecycleBin")'

# 2. if git repo: commit
git add -A && git commit -m "run complete: [Goal]"

# 3. push — only if git repo with remote
git remote | head -1  # if exists: git push
```
Output:
```
Done.
```

### 5. ON FAILURE

Failed = Agent tool errors (crash, timeout) or subagent reports could not complete.

```
PLAN FAILED — RECOVERY OPTIONS
Checkpoint: <hash or _step3_backup/>
If git: Recovery: git reset --hard <hash>
If backup: Recovery: restore from _step3_backup/
- Failed: Phase N — [error]
- Completed: Phases X, Y, Z
- Not started: Phases A, B, C
```
Propose recovery only. User decides whether to keep partial changes.

### 6. CODE-TASK OVERRIDE

When the plan contains `code-task: true` in its context, override dispatch Instructions 1 and 3 with:
1. Read Reference files FIRST — understand patterns before writing code
3. Stay within Modifies scope — no files outside it
