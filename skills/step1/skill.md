---
name: step1
description: "ONLY when user explicitly types /step1. Never auto-trigger on think, scan, consider, or examine."
---

# /step1

Structured Q&A that converges on decisions. Produces `_step1_decisions.md` at repo root; `/step2` consumes it.

## Gates

1. **Read/Glob/Grep directly.** NEVER use Task or EnterPlanMode — subagents lose your context, plan mode hijacks your flow.
2. **Write `_step1_decisions.md` with the Write tool BEFORE any closing remarks.** Never mention /step2 until the file exists — the file is proof the skill finished.
3. **One question at a time via AskUserQuestion.** Never batch — each answer reshapes the next question.

## Flow

**Arguments:**
- `/step1` — asks "What needs solving?"
- `/step1 <topic>` — skips opening question
- `/step1 resume` — finds last decision tracker in conversation, continues

### 1. EXPLORE

1. Read relevant codebase files (5-10). For greenfield projects, ask about constraints instead.
2. Identify decision points. Form an opinion on each from codebase evidence.
3. Output: `"~N decisions to work through (some will be auto-decided)"`

### 2. INTERROGATE

**Auto-decide** when:
- Codebase evidence makes one option overwhelmingly correct
- LLM-readability clearly favors one option (naming, structure, indirection) — still ask, but put the best option first with `(Recommended)` and include the rationale so the user can confirm quickly

Present initial auto-decisions as a batch before the first human question:

```
### Auto-decided (review before we continue)
1. ✅ (auto) [topic]: [answer] — [rationale]
```

Ask: "Want to revisit any of these, or move on?" If flagged, convert to regular question.

**Questions:**
- Order options by recommendation strength (best first)
- All option slots are for real answers — user can type "go back" or "park" via Other

**After each answer:**
- Reassess: does this reveal new decisions (mark `🆕`), kill existing ones (mark `➖`)?
- Flag conflicts with previous decisions
- Push back on risky choices even if user seems confident
- If decisions exceed 8, suggest splitting the task before continuing
- Output tracker:

```
### Decisions (N decided, ~M remaining)
1. ✅ [topic]: [answer] — [why]
2. ✅ (auto) [topic]: [answer] — [rationale]
3. ⬜ [next]...
```

**Go back** (user types via Other): Re-ask previous question, mark it ⬜, re-evaluate downstream.

**Park** (user types via Other): Stop. Output tracker as-is. Write `_step1_decisions.md` with `## Unresolved` section. Do NOT suggest `/step2`.

### 3. BRIDGE

**Early resolution** — ONLY when outcome is a single localized fix (one file, no conventions, no docs):
- Skip `_step1_decisions.md`, summarize inline. Simple enough to implement directly — no pipeline needed.
- After the summary, ask: "Ready to implement? I can do this directly." Do NOT suggest `/step2` — early resolution bypasses the pipeline entirely.
- Question count is irrelevant. 1 human question + multi-file scope = full bridge.

**Full bridge** — default path (multi-file, conventions, or docs):

1. Present decision block(s):
```
## Decision: [topic]
**Approach:** [what and how]
**Why:** [codebase-grounded reasons]
**Rejected:** [alternative] — [why it fails]; ...
**Risks:** [trade-offs and pitfalls carried by chosen approach]
**Scope:** [in/out]
**Key decisions:**
- [decision — specific enough to implement without interpretation]
```
`Rejected` and `Risks` exist so /step2 can convert them into guardrails. One line each. Omit if genuinely empty.
Each key decision must be implementable as-is — if /step2 would need to choose between two valid interpretations, the decision is too vague.
2. Ask "Anything you'd change?" — apply changes if requested.
3. **Gate: file before farewell.** Write `_step1_decisions.md` at repo root using the Write tool now — do not proceed to closing remarks without it. This file is the primary deliverable; without it, /step1 failed.
4. Only AFTER the file is confirmed written, end with: `Next: /step2 to plan the implementation. Tip: /clear first so /step2 gets a full context window.`

## Rules

- **Take sides.** When one option is obviously better for LLM development (explicit names, less indirection, flatter structure), lead with it as `(Recommended)` with rationale — make the right choice effortless to confirm.
- **Specify mechanisms, not intent.** Key decisions must name the exact pattern, API, or control — not the goal they serve. Bad: "rename dialog", "editable field", "state store". Good: "owned modal dialog class", "inline text input control", "context provider with reducer". Ambiguous mechanism names cause /step2 to diverge across runs.
- Push back on risky choices even if the user seems confident — warn, challenge, recommend.
- Never auto-chain to `/step2` — always let the user invoke it.
- No implementation. Only output is `_step1_decisions.md`. Exception: early resolution.
