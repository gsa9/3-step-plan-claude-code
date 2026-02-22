---
name: step2
description: "ONLY when user explicitly types /step2. Never auto-trigger on plan, design, or architect."
argument-hint: "[goal description]"
---

# /step2

Create `_step2_plan.md` at repository root — the sole input for `/step3` subagents that have zero prior context.

## Gates

These fire before and during every step. Violating any gate is a skill failure.

1. **Read/Glob/Grep directly.** NEVER use Task or EnterPlanMode — subagents lose your context.
2. **Write `_step2_plan.md` AND delete `_step1_decisions.md` BEFORE any closing remarks.** Never mention /step3 until both are done — the plan file is proof the skill finished.
3. **No valid early exit.** Once you've read `_step1_decisions.md` and at least one codebase file, you MUST produce `_step2_plan.md` — stopping after research is a skill failure.

## Flow

1. **Load context** — FIRST ACTION: read `_step1_decisions.md` at repository root.
   - **Found:** Use it as the goal. If it contains `## Unresolved`, warn the user and ask whether to resolve now or proceed. Transform scan content into the plan — don't copy:
     - Decisions → stated in the phase they constrain
     - Pitfalls / rejected alternatives → per-phase guardrails ("Do NOT use X because Y")
     - Scope exclusions → restated in relevant phases to prevent drift
     - Rationale section → rewritten for execution (approach, what NOT to do, patterns to follow)
   - **Not found:** Fall back to conversation context or ask the user what's being built.
2. **Research** — Read codebase files listed in _step1_decisions.md (or identified from goal). After the last read, output exactly: `Research complete — N files read. Designing phases.`
3. **Design + Write** — Design all phases mentally, then write the complete `_step2_plan.md` in one Write call. See Format below. Use `date` for the timestamp. *(Gate 3: you MUST produce this file — there is no valid exit without it.)*
   - **One phase per file** (default). Each phase modifies exactly one file. Phases touching different files run in parallel. Split a phase only when part of a file creates a dependency other phases need before the rest can be done.
   - Each phase is dispatched to an isolated subagent that receives only the Rationale section + its own Phase Details section. The Overview table is not dispatched. So:
     - Explicit file paths — never "the file from Phase 2"
     - One clear objective, concrete tasks
     - 50-150 lines when dispatched (phase text + reference overhead). If bigger, split.
     - If multiple phases need shared technical context (a schema, an interface signature), embed it in each phase's Reference, Guardrails, or Tasks — not in a plan-level section.
4. **Validate** — Run through every item before confirming:
   1. **Parallel maximization** — could any dependency be broken by splitting? Could phases be more independent?
   2. **No file collisions** — no two phases in the same parallel group touch the same file.
   3. **Subagent autonomy** — could a subagent execute each phase with ONLY the phase text + Reference files? If not, add what's missing. Dispatch stays within ~150 lines.
   4. **Guardrail placement** — every _step1_decisions.md pitfall appears as a guardrail in the specific phase where it applies.
   5. **Completeness** — all decisions from _step1_decisions.md are reflected in at least one phase.
   Fix any failures via Edit.
5. **Delete `_step1_decisions.md`** — `rm` it and verify deletion. *(Gate 2: do this BEFORE any farewell or /step3 mention.)*
6. **Confirm** — Output the summary block. End with `Next: /step3 to execute. Tip: /clear first so /step3 gets a full context window.`

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
| 2 | ... | 1 | B | ~80 |

## Phase Details

### Phase N: [title]
**Modifies:** [exact file paths this phase changes]
**Reference:**
- `path/to/file` — [what to look at: pattern to follow, interface to conform to, line range]
**Guardrails:** <!-- only include if this phase has real drift risk -->
- [constraint from decisions/pitfalls]
**Tasks:**
- [ ] Concrete task 1
- [ ] Concrete task 2
```

**Overview table columns** (not dispatched — orchestration only):
- `Depends`: explicit numeric, no transitive repetition. <!-- explicit numeric, state what it provides -->
  State what it provides: "1 (creates lib/types.ts)"
- `Parallel Group`: same letter = runs concurrently. MUST NOT share modified files.
- `Est. Lines`: line count of this phase's Phase Details section. <!-- line count of Phase Details section when dispatched -->

### Output

```
Plan created: _step2_plan.md
- Phases: N (M can run in parallel)
- Parallel groups: N
- Est. dispatch sizes: all within budget / Phase X may be tight
Next: /step3 to execute. Tip: /clear first so /step3 gets a full context window.
```

## Rules

- Keep each phase self-contained — subagents see nothing outside their own section plus Rationale.
- Prefer parallel groups over sequential chains — fewer blocking dependencies means faster execution.
- Guardrails belong in the phase they protect, not in a plan-level preamble subagents never see.
