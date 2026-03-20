---
name: distill
description: "ONLY when user explicitly types /distill. Never auto-trigger on optimize, shorten, reduce, or trim."
argument-hint: "[file-path]"
---

# /distill

Optimize LLM instruction files (skill.md, CLAUDE.md, agent prompts) for behavioral compliance. Cut, restructure, rewrite — not just condense. The target audience is an LLM, not a human reader.

## Principles

1. One statement per concept. Two forms at the same level: keep the shorter. A gate restating a flow step is a pre-flight check, not duplication — keep both.
2. Imperative voice. "Do X" beats "X is done" or "X should be considered." Strip hedge words. At equal clarity, shorter wins.
3. Explicit conditionals over notation. Write "If X, do Y" instead of "X → Y" or "X: Y". Arrow-notation is ambiguous to LLMs — it could mean causation, sequence, or conditionality.
4. WHY over WHAT. The model infers WHAT from WHY. "Skip test files — they add tokens without informing edits" beats repeating "do not read test files" three ways.
5. Generic over specific. Over-specifying causes fragility. One rule covering many cases beats per-case breakdown.
6. Evidence over authority. "X because Y" beats "CRITICAL: X". Reserve meta-directives for genuine safety only.
7. Format by example. A 3-line example beats a 10-line description.
8. Numbered lists over dense inline formats. LLMs track numbered items reliably. Inline separators (`·`, `/`, semicolons packing multiple items on one line) parse poorly.
9. Indented blocks for templates and formats. Fenced code blocks cause LLMs to reproduce content literally. Use 4-space indented blocks for templates the LLM should fill in, and reserve fenced code blocks for actual shell commands or code the LLM should run verbatim.
10. Remove self-evident rules. "Write valid Python" is noise. "Use f-strings not .format()" is signal.
11. Pair negatives with positives. "Do Y instead of X" beats "Don't X."
12. Separate instructions from user-facing output. Behavioral instructions for the LLM should be optimized for parsing. User-facing output (box art, decision trackers, status formats) should be preserved as-is because the user needs to see them.

## Flow

### 1. TARGET

Get the file path from the argument or ask for it. Read the file.

### 2. ANALYZE

Check the file against each principle. Cross-check for redundancy across distant sections (intros restating gates, flow steps echoing other flow steps). Identify which content is LLM instruction versus user-facing output.

### 3. DISTILL

Apply all changes. Write the distilled version. Report before/after line counts and what was merged, removed, or restructured.

Constraints:
1. Never remove a behavioral rule that has no equivalent remaining.
2. Compress expression, not meaning. Preserve output format templates and frontmatter.
3. Embedded agent prompts are instructions — distill them like any other prose.
4. Never compress by adding forward references ("see section X"). Inline or cut, do not point.
5. WHY clauses are high-value. Keep them even when shortening the WHAT around them.
6. If uncertain whether removal is safe, keep the rule.
