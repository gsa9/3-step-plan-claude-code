---
name: gc
description: "ONLY trigger on explicit /gc. Never auto-trigger on 'commit', 'push', or similar words."
argument-hint: "[--repo <path>] [message]"
---

# Git Commit and Push

**Repo targeting:** If `--repo <path>` is provided, use `git -C <path>` for ALL git commands (add, commit, push). Otherwise use current directory. Strip `--repo <path>` from args before treating remainder as message.

1. `git -C <repo> add -A` (omit `-C` if no --repo)
2. If user provided a message, skip to step 4
3. `python ~/.claude/skills/gc/gc_diff.py <repo>` (omit arg if no --repo)
   - Exit code 1 → git error. Show the error and stop.
   - "No staged changes" → tell user and stop.
   - Otherwise draft from its output + conversation memory. Imperative, lowercase, no period, ~50 chars. Bullets OK for bigger changes.
4. Commit using HEREDOC format (preserves special chars and multi-line):
   ```bash
   git commit -m "$(cat <<'EOF'
   message here
   EOF
   )"
   ```
   Then push: `git push` (or `git push -u origin <branch>` if no upstream). All with `-C <repo>` if specified.
5. **Push failures:**
   - Rejected (non-fast-forward) → `git pull --rebase` then `git push`. If rebase conflicts, stop and tell user.
   - No remote / auth error → stop and show the error.

NEVER run `git diff`, `git log`, `git show`, `git status`, or read any file to inform the message. Only inputs: script output + conversation memory. No Co-Authored-By or trailers. No selective staging.
