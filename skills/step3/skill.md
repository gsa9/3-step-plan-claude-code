---
name: step3
description: "ONLY when user explicitly types /step3. Never auto-trigger on execute, run, or implement."
---

# /step3

Execute `_step2_plan.md` by dispatching phases to subagents via Agent tool. The main thread orchestrates only.

## Gates

1. Never use EnterPlanMode/ExitPlanMode. This skill is the execution framework.
2. Checkpoint before dispatching any subagent.
3. All implementation happens via Agent tool (general-purpose).
4. Ask in plain text output. Never use AskUserQuestion.

## Flow

All-or-nothing execution. On failure, the user decides recovery.

The main thread is a lightweight dispatcher: read `_step2_plan.md` once, store only phase numbers, dependencies, groups, and titles. Dispatch subagents and report one-line progress per phase.

### 1. CHECKPOINT

Detect the environment and create a checkpoint:

If git repo: run `git add -A && git commit -m "checkpoint before run"` and store the hash via `git rev-parse HEAD`. Do not push.

If existing files but no git: copy all files listed in the plan's Inputs/Outputs to `_step3_backup/`, preserving relative paths.

If greenfield with no git: skip. Nothing to recover.

### 2. LOAD

Read `_step2_plan.md` and verify the `<!-- @plan: /step2 -->` marker is present. Parse the overview table.

### 3. EXECUTE LOOP

While phases remain:
1. Find ready phases whose dependencies are satisfied.
2. Batch by parallel group. Same group dispatches in one message with multiple Agent calls. Never mix groups.
3. Dispatch each phase using the template below.
4. If any phase fails, go to ON FAILURE.
5. Log each completion: "Phase N: [title]"

Dispatch template:

    # Context
    Goal: [from plan Goal field]
    Rationale: [from plan Rationale section]
    Working directory: [absolute path]

    # Dependencies
    [From Phases Overview. Omit section if none.]

    # Your Assignment: Phase N
    [EXACT phase section from plan]

    # Instructions
    1. Read Inputs first. Understand context before producing anything.
    2. Guardrails are hard constraints, not suggestions. Violating a Guardrail is a failure.
    3. Produce only the listed Outputs. Do not create or modify anything outside them.
    4. On failure: stop immediately and return error details.

Code-task override: if the plan contains `code-task: true`, replace instructions 1 and 3 with:
1. Read Reference files first. Understand patterns before writing code.
3. Modify only the listed files. Do not touch files outside them.

### 4. ON SUCCESS

Delete the plan file and backup via Recycle Bin (never permanent delete), then commit and push.

On Windows, delete `_step2_plan.md`:

    powershell -NoProfile -Command 'Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile((Join-Path "WORKING_DIR" "_step2_plan.md"),"OnlyErrorDialogs","SendToRecycleBin")'

If `_step3_backup/` exists, delete it:

    powershell -NoProfile -Command 'Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory((Join-Path "WORKING_DIR" "_step3_backup"),"OnlyErrorDialogs","SendToRecycleBin")'

If git repo: commit with `git add -A && git commit -m "run complete: [Goal]"`. If a remote exists (`git remote | head -1`), push.

Output:

    ▰▰▰▰▰▰▰   ▰▰▰▰▰▰▰   ▰▰▰▰▰▰▰


### 5. ON FAILURE

A phase has failed when the Agent tool errors or the subagent reports it could not complete.

Display this to the user:

    PLAN FAILED — RECOVERY OPTIONS
    Checkpoint: [hash or _step3_backup/]
    If git: Recovery: git reset --hard [hash]
    If backup: Recovery: restore from _step3_backup/
    - Failed: Phase N — [error]
    - Completed: Phases X, Y, Z
    - Not started: Phases A, B, C

Propose recovery only. The user decides.
