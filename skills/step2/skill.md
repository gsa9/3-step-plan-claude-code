---
name: step2
description: "ONLY when user explicitly types /step2. Never auto-trigger on plan, design, or architect."
argument-hint: "[goal description]"
---

# /step2

Create `_step2_plan.md` at repo root. This file is the sole input for /step3 subagents, which have zero prior context.

## Gates

1. Tools: Read, Glob, Grep only. Never use Agent, Task, or EnterPlanMode/ExitPlanMode.
2. No code. The only output is `_step2_plan.md`.
3. Write `_step2_plan.md` and delete `_step1_decisions.md` before showing the output box. Do not mention /step3 until both are done.
4. Ask in plain text output. Never use AskUserQuestion.

## Flow

### 1. LOAD

Read `_step1_decisions.md`.

If found: transform it, do not copy it. Convert decisions into constraints placed in relevant phases. Convert pitfalls and rejected alternatives into guardrails phrased as "Do NOT use X because Y". Restate scope exclusions in each phase to prevent drift. If an `## Unresolved` section exists, ask the user whether to resolve or proceed.

If not found: use conversation context or ask the user.

### 2. RESEARCH

Read relevant source files referenced in the decisions document or identified from the goal.

### 3. DESIGN + WRITE

Design all phases, then write the complete `_step2_plan.md` in one Write call.

Phase design rules:
1. Default to one phase per deliverable. Only split a deliverable across phases when partial output creates a dependency needed by a later phase.
2. Independent deliverables go in the same parallel group for concurrent execution. Phases in the same group must not share outputs.
3. Each phase is dispatched to an isolated subagent that sees only the Rationale section plus its own Phase Details. Therefore: use explicit deliverable names, one clear objective, and concrete tasks. The overview table is for orchestration only and is not dispatched.
4. Any shared context (definitions, constraints, formats) must be embedded in each phase that needs it, not placed at plan level.

### 4. CLEANUP

Delete `_step1_decisions.md` via platform-safe method (Recycle Bin on Windows, Trash on macOS/Linux). Never permanently delete. Verify the file is gone. Show the output box. Stop.

## Code-Task Overrides

When `_step1_decisions.md` contains `code-task: true`, apply these overrides:
1. Phase granularity: one phase per file instead of per deliverable. Target 50-150 dispatched lines per phase. If larger, split.
2. Phase template labels: use `**Modifies:**` and `**Reference:**` instead of `**Outputs:**` and `**Inputs:**`.
3. Overview table: add an `Est. Lines` column.
4. Prefer LLM-dev-friendly patterns: flat logic, named constants, no indirection, inline single-caller helpers.

## Format

Use this structure for `_step2_plan.md`:

    <!-- @plan: /step2 -->
    # [Goal Title]

    **Goal:** [1-2 sentences]

    ## Rationale

    **Approach:** [chosen approach]
    **Why:** [key reasons from evidence]
    **Patterns:** [conventions subagents must follow]
    **Non-goals:** [explicitly out of scope]

    ## Phases Overview

    | Phase | Name | Depends | Parallel Group |
    |-------|------|---------|----------------|
    | 1 | ... | - | A |
    | 2 | ... | 1 (produces X) | B |

    ## Phase Details

    ### Phase N: [title]
    **Outputs:** [exact deliverable names/paths]
    **Inputs:**
    - `source/or/reference` — [what to look at and why]
    **Guardrails:** <!-- only if real drift risk -->
    - [constraint from decisions/pitfalls]
    **Tasks:**
    - [ ] Concrete task 1
    - [ ] Concrete task 2

Output:

    ┌──────────────┐
    │ Next: /step3 │
    └──────────────┘
