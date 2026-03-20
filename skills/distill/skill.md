---
name: distill
description: "ONLY when user explicitly types /distill. Never auto-trigger on optimize, shorten, reduce, or trim."
argument-hint: "[file-path]"
---

# /distill

Optimize LLM instruction files (skill.md, CLAUDE.md, agent prompts) for behavioral compliance. Cut, restructure, rewrite — not just condense.

## Principles

1. **One statement per concept.** Two forms at same level → keep the shorter. Gate restating a flow step = pre-flight, not duplication — keep both.
2. **Direct, front-loaded.** "Do X" beats "You should consider doing X." Strip hedge words. At equal clarity, shorter wins.
3. **WHY > WHAT.** The model infers WHAT from WHY. "Skip test files — they add tokens without informing edits" beats repeating "do not read test files" three ways.
4. **Generic > specific.** Over-specifying causes fragility. One rule covering many cases beats per-case breakdown.
5. **Evidence > authority.** "X because Y" beats "CRITICAL: X". Reserve meta-directives for genuine safety only.
6. **Format by example.** A 3-line example beats a 10-line description.
7. **Flat over nested.** Bullets beat deep hierarchies.
8. **Remove self-evident rules.** "Write valid Python" is noise. "Use f-strings not .format()" is signal.
9. **Pair negatives with positives.** "Do Y instead of X" beats "Don't X."
10. **Compress structure, not just prose.** Code blocks beat bullets for literal commands. Flowing sentence beats numbered list when items aren't individually referenced.

## Flow

### 1. TARGET

Get file path from argument or ask. Read it.

### 2. ANALYZE

Check file against each principle. Cross-check for redundancy across distant sections (intros restating gates, flow steps echoing other flow steps).

### 3. DISTILL

Apply all changes. Write distilled version. Report before/after line counts and what was merged/removed.

**Constraints:**
- Never remove a behavioral rule with no equivalent remaining.
- Compress expression, not meaning. Preserve output format templates and frontmatter. Embedded agent prompts = instructions — compress like any other prose.
- Never compress by adding forward references ("see section X"). Inline or cut — don't point.
- WHY clauses are high-value — keep them even when shortening the WHAT around them.
- Uncertain whether removal is safe → keep the rule.
