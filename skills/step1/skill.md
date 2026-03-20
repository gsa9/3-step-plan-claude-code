---
name: step1
description: "ONLY when user explicitly types /step1. Never auto-trigger on think, scan, consider, or examine."
---

# /step1

Discovery + Q&A → `_step1_decisions.md` at repo root → `/step2` consumes it.

## Gates

1. Read/Glob/Grep + Agent (enrichment only). No Task, no EnterPlanMode/ExitPlanMode.
2. Decisions only — no implementation. Exception: trivially simple task → early resolution.
3. Never use AskUserQuestion. Ask in plain text output, options as numbered list. One question at a time — each answer reshapes the next.
4. Recommend the clearest, most actionable option → `(Recommended)` + rationale.
5. Specifics, not intent — name exact deliverables/formats/criteria. ✗ "improve the process". ✓ "add checklist with 5 gate criteria to review template".
6. Never mention /step2 until `_step1_decisions.md` is written and enrichment pass is complete.

## Flow

Prior context exists → use it as the topic. No context → ask "What needs solving?"

### EXPLORE

Gather context from available sources (files, conversation history, user-provided references). Identify decision points.
Output: `"~N decisions to work through after discovery."`

### DISCOVER

Exhaust questions before any decisions.

**Categories** (cover each):
- **Scope** — in vs explicitly out
- **Outcome** — what success looks like, how you'd verify it
- **Information** — what exists, what's missing, what needs research
- **Failure** — what breaks, fallback
- **Constraints** — perf, compat, environment, timeline
- **Prior art** — attempted before, why it did/didn't work
- **Dependencies** — what else touches this, who else cares

**Rules:**
- One question per message — compound questions get shallow answers.
- After each answer, branch into any new dimension before continuing.
- Target: enough answers to decide in INTERROGATE, not a question count.
- At saturation: "Discovery complete — moving to decisions." User confirms.

### INTERROGATE

Discovery answers feed batch decision-making.

**Auto-decide** when evidence + discovery answers make one option overwhelming:
```
### Auto-decided (review before we continue)
1. ✅ (auto) [topic]: [answer] — [rationale]
```
"Revisit any, or move on?" If user flags one → demote to regular question.

**Each question:** Options best-first, clearest/most actionable marked `(Recommended)` + rationale.

**After each answer:**
- New decisions (🆕)? Killed (➖)? Conflicts?
- Push back on risky choices; >8 decisions → suggest splitting
- Tracker:
```
### Decisions (N decided, ~M remaining)
1. ✅ [topic]: [answer] — [why]
2. ✅ (auto) [topic]: [answer] — [rationale]
3. ⬜ [next]...
```

### BRIDGE

**Early resolution** — trivially simple task, detected during EXPLORE:
Skip DISCOVER/INTERROGATE. No `_step1_decisions.md`. Summarize inline. "Ready to proceed?"
1 question + multi-faceted scope = full bridge, not early resolution.

**Full bridge** (default):
1. Decision block per topic:
```
## Decision: [topic]
**Approach:** [what and how]
**Why:** [grounded reasons]
**Rejected:** [alt — why fails]; ...
**Risks:** [trade-offs]
**Scope:** [in/out]
**Key decisions:**
- [specific enough to act on without interpretation]
```
`Rejected`/`Risks` omit if empty. Key decisions must be actionable as-is — if /step2 must choose between interpretations, too vague.
2. "Anything you'd change?" Incorporate feedback if any.
3. **Write `_step1_decisions.md`** — /step2 contract.
4. **Enrichment pass.** Spawn Agent (general-purpose):
```
Review `_step1_decisions.md` for /step2 handoff. /step2 reads ONLY this file, zero history. Every gap = guesswork.
1. Read `_step1_decisions.md`
2. Read each source referenced in Scope sections
3. Check: objective? before-state? specific details? examples for non-obvious logic? cross-refs between interacting decisions? consumer completeness? edge cases?
4. "NO_GAPS" or numbered gap list with criterion, location, specific text to add.
```
   - `NO_GAPS` → step 5
   - Gaps → edit file, then step 5

### If code task

If working in a git repo with source files or user describes code changes, add `code-task: true` to `_step1_decisions.md`. When code-task is true: EXPLORE reads 5-10 relevant source files — codebase evidence grounds decisions. Enrichment checks additionally verify: code specifics (lines, functions), snippets for non-trivial logic, before→after for signatures/schemas.

5. Output:
```
┌──────────────┐
│ Next: /step2 │
└──────────────┘
```
   Stop.
