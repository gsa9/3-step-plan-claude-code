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
4. WHY supplements WHAT. Keep the explicit action; add WHY for compliance weight. "Skip test files — they add tokens without informing edits" beats "do not read test files" repeated three ways, but the action "skip test files" must remain explicit. LLMs do not reliably infer specific actions from rationale alone.
5. Generic over specific, but preserve edge cases. One rule covering many cases beats per-case breakdown, unless the source lists specific cases that the generic rule doesn't demonstrably cover. "Handle errors" doesn't produce the same behavior as "retry on 429, fail on 5xx, log and continue on 404."
6. Evidence over authority, but preserve emphasis. "X because Y" beats "CRITICAL: X" when the emphasis is arbitrary. If the source uses CRITICAL, IMPORTANT, or MUST, the author likely observed non-compliance without it — keep the emphasis.
7. Format by example. A 3-line example beats a 10-line description.
8. Numbered lists over dense inline formats. LLMs track numbered items reliably. Inline separators (`·`, `/`, semicolons packing multiple items on one line) parse poorly.
9. Indented blocks for templates and formats. Fenced code blocks cause LLMs to reproduce content literally. Use 4-space indented blocks for templates the LLM should fill in, and reserve fenced code blocks for actual shell commands or code the LLM should run verbatim.
10. Remove rules self-evident to the target LLM in context. "Write valid Python" is noise. "Use f-strings not .format()" is signal. If a rule exists, assume the author needed it — only remove if the target LLM would follow it without instruction.
11. Pair negatives with positives. "Do Y instead of X" beats "Don't X."
12. Separate instructions from user-facing output. Behavioral instructions for the LLM should be optimized for parsing. User-facing output (box art, decision trackers, status formats) should be preserved as-is because the user needs to see them.

## Flow

### 1. TARGET

Get the file path from the argument or ask for it. Read the file. The file content must be in context for both distillation and recovery reference.

### 2. BACKUP

1. Create `~/.claude/distill-backups/` if it doesn't exist.
2. Get system timestamp via `powershell -NoProfile -Command 'Get-Date -Format "yyyyMMdd_HHmmss"'`.
3. Save copy as `{filename}_{yyyyMMdd_HHmmss}.{ext}` in that folder.
4. Briefly inform user: "Backup saved to ~/.claude/distill-backups/{backup-filename}"
5. If backup fails, warn and ask whether to proceed without backup.

### 3. ANALYZE

Check the file against each principle. Cross-check for redundancy across distant sections (intros restating gates, flow steps echoing other flow steps). Identify which content is LLM instruction versus user-facing output.

### 4. DISTILL

Apply all changes. Write the distilled version. Report using this template:

    | Metric | Before | After |
    |--------|--------|-------|
    | Lines  | N      | N     |
    | Sections | N    | N     |
    | Rules/Principles | N | N |

    **Changed:** [one-line summary of what was merged, removed, or restructured]

### 5. VERIFY

For each removed or shortened rule, confirm the remaining text would produce identical behavior in the same scenarios. If a rule was removed because it seemed self-evident or covered by a generic rule, mentally test: "Would an LLM reading only the distilled version do X in scenario Y?" If uncertain, restore the rule.

Constraints:
1. One file per invocation. If the argument contains multiple paths, globs, or the user asks to distill more than one file, refuse immediately and explain: one file at a time.
2. Never remove a behavioral rule that has no equivalent remaining.
3. Compress expression, not meaning. Preserve output format templates and frontmatter.
4. Embedded agent prompts are instructions — distill them like any other prose.
5. Never compress by adding forward references ("see section X"). Inline or cut, do not point.
6. WHY clauses are high-value. Keep them even when shortening the WHAT around them.
7. If uncertain whether removal is safe, keep the rule.
