---
name: step2
description: "ONLY when user explicitly types /step2. Never auto-trigger on plan, design, or architect."
argument-hint: "[goal description]"
---

# /step2

Create `_step2_plan.md` at repo root — sole input for `/step3` subagents with zero prior context.

## Gates

1. Read/Glob/Grep only. NO Agent, NO Task (loses context), NO EnterPlanMode/ExitPlanMode.
2. Write `_step2_plan.md` AND delete `_step1_decisions.md` BEFORE output box. No /step3 mention until both done.
3. No code — output is `_step2_plan.md` only.
4. Never use AskUserQuestion. Ask in plain text output.

## Flow

### 1. LOAD

Read `_step1_decisions.md`.
- **Found:** Transform into plan (don't copy). Decisions → constraints in relevant phases. Pitfalls/rejected alts → guardrails ("Do NOT use X because Y"). Scope exclusions → restated per phase to prevent drift. If `## Unresolved` exists, ask: resolve or proceed?
- **Not found:** Use conversation context or ask user.

### 2. RESEARCH

Read relevant sources referenced in decisions (or identified from goal).

### 3. DESIGN + WRITE

Design all phases, then write complete `_step2_plan.md` in one Write call.

**Phase design rules:**
- One phase per deliverable (default). Same-deliverable phases only when partial output creates a needed dependency.
- Independent deliverables → same parallel group (concurrent). Phases in same group MUST NOT share outputs.
- Each phase dispatched to isolated subagent with ONLY Rationale + its Phase Details. Therefore: explicit deliverable names, one clear objective, concrete tasks.
- Shared context (definitions, constraints, formats) → embed in each phase, not plan-level.
- Overview table is orchestration-only — not dispatched to subagents.

### 4. CLEANUP

Delete `_step1_decisions.md` via platform-safe method (Recycle Bin on Windows, Trash on macOS/Linux) — never permanent delete. Verify gone. Output box. Stop.

## Code-Task Overrides

When `_step1_decisions.md` contains `code-task: true`, apply these overrides:
- Phase granularity: "one phase per file" instead of "per deliverable"
- Size limit: 50-150 dispatched lines per phase — bigger → split
- Phase template labels: use `**Modifies:**` / `**Reference:**` instead of `**Outputs:**` / `**Inputs:**`
- Overview table: include `Est. Lines` column (`| Phase | Name | Depends | Parallel Group | Est. Lines |`)
- Prefer LLM-dev-friendly patterns: flat logic, named constants, no indirection, inline single-caller helpers

## Format

```markdown
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
```

Output:
```
┌──────────────┐
│ Next: /step3 │
└──────────────┘
```

