# CLAUDE.md

Meta-instructions for maintaining this repository.

## Tracked Files (keep updated)

```
.gitignore
README.md
LICENSE
CLAUDE.md
skills/step1/skill.md
skills/step2/skill.md
skills/step3/skill.md
skills/trim/skill.md
skills/gc/skill.md
skills/gc/gc_diff.py
hooks/statusline.js
hotkeys/3step-hotkeys.ahk
```

**On every conversation:** Run `git ls-files` and update this list if it differs.

## README Maintenance

README.md documents tracked files. When Claude modifies any tracked file:

1. Read README.md
2. Check if change affects documented content
3. Update README.md in same commit if needed

### Golden Rule

**README documents ONLY tracked files listed above. Never add untracked content.**

Untracked files (not in list above) must NOT appear in README.

## Public Repository Policy

Tracked files must be free of:
- API keys, tokens, secrets, passwords, credentials
- Email addresses, usernames, real names in paths (use `~/.claude/`)
- Project-specific names, PII

Use generic placeholders in examples (`src/`, `project/`).

**Cross-platform:** Skills must use only POSIX-compatible commands (e.g., `date` not `powershell Get-Date`). Claude Code runs in bash on all platforms.

## Commit Authorship

All commits must use single author:
```
git commit --author="gsa9 <gsa9@users.noreply.github.com>"
```

This ensures consistent ownership across the repository.

## Resource Files

`gc_diff.py` is a Python helper script bundled with the `/gc` skill. It parses `git diff --staged -U0` output into a compact summary for token-efficient commit message generation. Uses only stdlib — no dependencies.

## Skill Description Pattern

All skills must use this description format to prevent auto-triggering:
```
"ONLY when user explicitly types /<skill-name>. Never auto-trigger on <related-words>."
```

For skills with aliases, use:
```
"Trigger: /alias1, /alias2, or /full-name. Never auto-trigger on <related-words>."
```
