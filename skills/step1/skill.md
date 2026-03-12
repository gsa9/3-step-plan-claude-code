---
name: step1
description: "ONLY when user explicitly types /step1. Never auto-trigger on think, scan, consider, or examine."
---

# /step1

Structured Q&A → `_step1_decisions.md` at repo root → `/step2` consumes it.

## Gates

1. Read/Glob/Grep + Agent (enrichment only). NO Task (loses context), NO EnterPlanMode/ExitPlanMode (hijacks flow).
2. Write `_step1_decisions.md` (Write tool) BEFORE closing remarks. File = skill completion proof. No /step2 mention until file exists.
3. One AskUserQuestion at a time. Each answer reshapes the next.
4. No implementation — decisions only. Early resolution (single-file fix) is the sole exception.
5. Take sides — LLM-dev-friendly (explicit names, less indirection, flatter) → mark best option (Recommended) with rationale.
6. Mechanisms, not intent — name exact pattern/API/control. ✗ "rename dialog", "editable field". ✓ "owned modal dialog class", "inline text input control". Ambiguity → /step2 divergence.
7. Never auto-chain to /step2 — user invokes it.

## Flow

**Arguments:**
- `/step1` → ask "What needs solving?"
- `/step1 <topic>` → skip opening question
- `/step1 resume` → find last tracker in conversation, continue

### EXPLORE

Read 5-10 relevant files (greenfield: ask constraints). Identify decision points with opinion from codebase evidence.
Output: `"~N decisions to work through (some will be auto-decided)"`

### INTERROGATE

**Auto-decide** when codebase evidence makes one option overwhelmingly correct.
When LLM-readability favors one (naming, structure, indirection) — still ask, but lead with `(Recommended)` + rationale for quick confirm.

Present auto-decisions as batch before first human question:
```
### Auto-decided (review before we continue)
1. ✅ (auto) [topic]: [answer] — [rationale]
```
"Revisit any, or move on?" Flagged → regular question.

**Each question:** Options best-first. Best marked `(Recommended)` + rationale. All slots real answers — "go back"/"park" via Other.

**After each answer:**
- New decisions (🆕)? Killed (➖)? Conflicts with prior?
- Push back on risky choices even if user seems confident
- >8 decisions → suggest splitting
- Tracker:
```
### Decisions (N decided, ~M remaining)
1. ✅ [topic]: [answer] — [why]
2. ✅ (auto) [topic]: [answer] — [rationale]
3. ⬜ [next]...
```

**Go back** (via Other): Re-ask previous (⬜), re-evaluate downstream.
**Park** (via Other): Tracker as-is → write `_step1_decisions.md` with `## Unresolved`. No /step2.

### BRIDGE

**Early resolution** — single localized fix (one file, no conventions, no docs):
Skip file. Summarize inline. Ask: "Ready to implement?" No /step2 — pipeline bypassed.
Note: 1 question + multi-file scope = full bridge, not early resolution.

**Full bridge** (default — multi-file, conventions, or docs):
1. Decision block per topic:
```
## Decision: [topic]
**Approach:** [what and how]
**Why:** [codebase-grounded reasons]
**Rejected:** [alt — why fails]; ...
**Risks:** [trade-offs of chosen approach]
**Scope:** [in/out]
**Key decisions:**
- [specific enough to implement without interpretation]
```
`Rejected`/`Risks`: /step2 converts to guardrails. One line each. Omit if empty.
Key decisions implementable as-is — if /step2 must choose between interpretations, too vague.
2. "Anything you'd change?" — apply if yes.
3. **Gate: write `_step1_decisions.md` NOW.** Primary deliverable — no closing without it. Never mention /step2 or suggest proceeding until file is written. Never offer to "just go ahead and apply" or skip the file — even for small scope. The file is the contract /step2 reads.
4. **Enrichment pass.** Spawn Agent (general-purpose) with the prompt below. Read response.
   - `NO_GAPS` → proceed to step 5
   - Gap list → Edit `_step1_decisions.md` to address each gap, then proceed to step 5
5. After file written: `Next: /step2 to plan implementation.` Stop — no further action.

### Enrichment agent prompt

```
You are reviewing `_step1_decisions.md` for completeness before handoff to /step2.

/step2 will read ONLY this file in a fresh context with zero conversation history.
Every gap in this file = guesswork or re-derivation by /step2, both unreliable.

## Steps
1. Read `_step1_decisions.md`
2. For each file mentioned in Scope sections, Read that source file
3. Check every criterion below
4. Return results

## Checklist
- [ ] **Objective**: File has a top-level section explaining the broader WHY — not just per-decision Why, but the overarching goal and motivation
- [ ] **Before-state**: Each decision documents what currently exists — current behavior, current code, what happens today
- [ ] **Code specificity**: Each change point has line numbers, function names, or variable names from the source files
- [ ] **Code snippets**: Non-trivial logic changes include pseudo-code or actual code showing the change (not just prose description)
- [ ] **Cross-references**: Decisions that interact with each other say so explicitly (e.g., "this column is consumed by the agent prompt in Decision 3")
- [ ] **Consumer completeness**: For each file in Scope — what changes, which code paths are affected and which are NOT, before→after for any signatures, schemas, or column additions
- [ ] **Edge cases**: Empty inputs, missing data, error conditions mentioned where the logic branches

## Output format
If everything passes: return exactly "NO_GAPS"
Otherwise: return a numbered list of gaps, each with:
- Which checklist criterion failed
- Where in the file (decision number or section)
- Specific suggested addition (not vague — write the actual text to add)
```
