---
name: step1
description: "ONLY when user explicitly types /step1. Never auto-trigger on think, scan, consider, or examine."
---

# /step1

Produce `_step1_decisions.md` at repo root. /step2 consumes only that file.

## Gates

1. Tools: Read, Glob, Grep, Agent (enrichment only). Never use Task or EnterPlanMode/ExitPlanMode.
2. No implementation. If the task is trivially simple, use early resolution instead.
3. Never use AskUserQuestion. Ask in plain text with numbered options, one question per message. Each answer reshapes the next question.
4. Specify exact deliverables, formats, criteria. Not "improve the process". Instead "add checklist with 5 gate criteria to review template".
5. Do not mention /step2 until `_step1_decisions.md` is written and enrichment is complete.

## Chat Output Style

Emphasis hierarchy (terminal renders bold identically to regular text):
1. Sentence rhythm — place the key point at the end of a short declarative sentence for primary emphasis.
2. `monospace` — reserved for specific terms, names, file paths, and concepts that need visual pop. Use sparingly.
3. Blockquotes — for isolated callouts that interrupt the flow to flag a constraint or warning.
4. *Italic* — softer inline stress for conditional or secondary emphasis.
Never use `**bold**` markup anywhere in chat output.

Format all chat output as title-paragraph blocks: a backtick-wrapped title with optional parenthetical status on the same line, followed by bulleted prose sentences (one idea per bullet, full sentences). Use `·` (middle dot) as the bullet character instead of `-`. Separate blocks with blank lines. Example:

`Caching strategy` (decided)
· The app will use a write-through cache backed by `Redis`.
· TTL is 300 seconds, chosen to balance freshness against DB load.

> This rules out lazy invalidation — the write-through guarantee is a hard constraint.

· *If latency becomes an issue*, we revisit with a read-aside layer.

General prose style: write full sentences in `·`-bulleted paragraphs. Explain reasoning first, then land the point in a short declarative sentence. Frame questions as flowing prose, not bare numbered lists. Use transition sentences between dimensions to show how they connect.

## Flow

If prior context exists, use it as the topic. Otherwise ask "What needs solving?"

### 1. EXPLORE

Read files, conversation history, references. Identify decision points. If in a git repo with source files, read relevant files to ground decisions.

Show the estimate as a title-paragraph block:

`Discovery` (starting)
· There are roughly N decisions to work through once discovery is complete.

If the task is trivially simple, skip to early resolution: summarize inline and ask "Ready to proceed?" Do not write `_step1_decisions.md`. One question with multi-faceted scope requires the full flow.

### 2. DISCOVER

Exhaust questions before making any decisions. Use these dimensions as a checklist — skip any with no decision points for this task:
1. Constraints: what must hold true, what must not be changed or violated, and why — includes performance, compatibility, environment, timeline
2. Outcome: what success looks like, how to verify
3. Information: what exists, what is missing, what needs research
4. Failure: what breaks, fallback plan
5. Prior art: tried before, why it worked or failed
6. Dependencies: what else touches this, who else cares

When presenting options during discovery, if you can reason about which is stronger, mark it `(Recommended)` with a rationale sentence — the same convention used in INTERROGATE. This saves the user from choosing blind when the evidence already points somewhere.

Ask one question per message. After each answer, show a title-paragraph dashboard block for the dimension just covered:

`[Dimension name]` (covered)
· [Prose sentence summarizing what was learned.]

Use a transition sentence before moving to the next dimension to show how it connects to what was just discussed.

After each answer, branch into any new dimension before continuing. When all relevant dimensions are covered and no unanswered branches remain, say "Discovery complete — moving to decisions." and proceed immediately to INTERROGATE.

### 3. INTERROGATE

When evidence makes one option overwhelming, auto-decide it and present using the title-paragraph format:

`[topic]` ✓ auto
· [Prose sentence explaining the decision and its rationale.]

Group all auto-decisions together, then ask "Revisit any, or move on?" If user flags one, demote to regular question.

For each remaining question, present options as prose paragraphs with full sentences explaining trade-offs. Mark the strongest option `(Recommended)` inline with its rationale. After each answer, check: new decisions spawned? any killed? conflicts? Push back on risky choices. If decisions exceed 9, suggest splitting.

Maintain a tracker after each answer using the title-paragraph format:

`Decisions` (N decided, ~M remaining)

`[topic]` ✓
· [Prose sentence explaining the decision.]

`[topic]` ✓ auto
· [Prose sentence explaining the auto-decision and rationale.]

`[next topic]` (next)
· [To be decided.]

### 4. BRIDGE

Step 1. Write `_step1_decisions.md`. If the task involves code, add `code-task: true` to frontmatter and include code specifics (lines, functions), snippets for non-trivial logic, before/after for signatures and schemas. Format:

    ---
    code-task: true  # only if code task
    title: [descriptive title]
    ---
    ## Constraints
    - [invariant or exclusion] — [why it matters]

    ## Decision: [topic]
    **Approach:** [what and how]
    **Why:** [grounded reasons]
    **Rejected:** [alternative — why it fails]; ...
    **Risks:** [trade-offs]
    **Key decisions:**
    - [specific enough to act on without interpretation]

Omit Rejected and Risks if empty.

Step 2. Show the title-paragraph decision tracker in chat. If all decisions were already confirmed during INTERROGATE, proceed directly to enrichment — no confirmation needed. If new decisions emerged during BRIDGE (e.g. from writing the file or filling gaps), present them as full INTERROGATE-style questions with options and trade-offs before continuing.

Step 3. If user requests changes, edit `_step1_decisions.md` in-place.

Step 4. Run enrichment. Spawn Agent (general-purpose) with this prompt:

    Review `_step1_decisions.md` for /step2 handoff. /step2 reads ONLY this file with zero conversation history.
    Working directory: [absolute path]
    1. Read `_step1_decisions.md` and each source file referenced in Decision sections.
    2. Check: objective stated? before-state described? specific details present? examples for non-obvious logic? cross-refs between interacting decisions? edge cases covered? If code-task: lines, functions, snippets included? constraints specific enough to become phase-level guardrails? each constraint has a WHY?
    3. Output "NO_GAPS" or a numbered gap list with criterion, location, and specific text to add.

If NO_GAPS, go to step 5. If gaps found, edit the file to fill them, then go to step 5.

Step 5. Output this and stop:

    [title]

    ▰▰▰▰▰▰▰   ▱▱▱2▱▱▱   ▱▱▱▱▱▱▱
