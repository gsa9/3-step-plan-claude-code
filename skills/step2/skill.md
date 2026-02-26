---
name: step2
description: "ONLY when user explicitly types /step2. Never auto-trigger on plan, design, or architect."
argument-hint: "[goal description]"
---

# /step2

Create `_step2_plan.md` at repo root — sole input for `/step3` subagents with zero prior context.

## Gates

Violation = skill failure.

1. Read/Glob/Grep only. NO Task (loses context), NO EnterPlanMode/ExitPlanMode.
2. Write `_step2_plan.md` AND delete `_step1_decisions.md` BEFORE closing remarks. Plan file = completion proof. No /step3 mention until both done.
3. No early exit. After reading `_step1_decisions.md` + codebase, MUST produce `_step2_plan.md`.
4. No code — output is `_step2_plan.md` only, never source file edits.

## Flow

### 1. LOAD

FIRST ACTION: read `_step1_decisions.md`.
- **Found:** Use as goal. If `## Unresolved` exists, ask user: resolve or proceed? Transform content into plan (don't copy):
  - Decisions → stated in phase they constrain
  - Pitfalls/rejected alts → per-phase guardrails ("Do NOT use X because Y")
  - Scope exclusions → restated in relevant phases to prevent drift
  - Rationale → rewritten for execution (approach, what NOT to do, patterns)
- **Not found:** Use conversation context or ask user.

### 2. RESEARCH

Read codebase files from _step1_decisions.md (or identified from goal).
After last read: `"Research complete — N files read. Designing phases."`

### 3. DESIGN + WRITE

Design all phases mentally, then write complete `_step2_plan.md` in one Write call. Use `date` for timestamp.

**Phase design rules:**
- One phase per file (default). Same-file phases only when partial output creates a dependency others need first.
- Phases on different files → same parallel group (concurrent).
- Each phase dispatched to isolated subagent receiving ONLY Rationale + its Phase Details (NOT overview table). Therefore:
  - Explicit file paths (never "the file from Phase 2")
  - One clear objective, concrete tasks
  - 50-150 dispatched lines (phase text + reference overhead). Bigger → split.
- Shared technical context (schema, interface) → embed in each phase's Reference/Guardrails/Tasks, not plan-level.

### 4. VALIDATE

Before confirming, check every item:
1. **Parallel maximization** — any dependency breakable by splitting?
2. **No file collisions** — no two phases in same parallel group modify same file.
3. **Subagent autonomy** — each phase executable with ONLY its section + Rationale + Reference files? If not, add missing context. ≤~150 dispatched lines.
4. **Guardrail placement** — every _step1_decisions.md pitfall → guardrail in specific phase.
5. **Completeness** — all _step1_decisions.md decisions reflected in at least one phase.
Fix failures via Edit.

### 5. CLEANUP

Delete `_step1_decisions.md` (`rm`, verify). Output summary block. End:
`Next: /step3 to execute.` Stop — no further action.

## Format

### _step2_plan.md

```markdown
<!-- @plan: /step2 YYMMDD_HHMM -->
# [Goal Title]

**Goal:** [1-2 sentence description]
**Created:** YYYY-MM-DD

## Rationale

**Approach:** [chosen approach]
**Why:** [key reasons from codebase evidence]
**Patterns:** [codebase conventions subagents must follow]
**Non-goals:** [explicitly out of scope]

## Phases Overview

| Phase | Name | Depends | Parallel Group | Est. Lines |
|-------|------|---------|----------------|------------|
| 1 | ... | - | A | ~60 |
| 2 | ... | 1 (creates lib/types.ts) | B | ~80 |
<!-- Depends: numeric + what it provides, no transitive. Parallel Group: same letter = concurrent, MUST NOT share modified files. Est. Lines: dispatched line count. Table is orchestration-only, not dispatched. -->

## Phase Details

### Phase N: [title]
**Modifies:** [exact file paths]
**Reference:**
- `path/to/file` — [what to look at and why]
**Guardrails:** <!-- only if real drift risk -->
- [constraint from decisions/pitfalls]
**Tasks:**
- [ ] Concrete task 1
- [ ] Concrete task 2
```

### Output

```
Plan created: _step2_plan.md
- Phases: N (M can run in parallel)
- Parallel groups: N
- Est. dispatch sizes: all within budget / Phase X may be tight
Next: /step3 to execute.
```
