"""Compact git diff summarizer for staged changes.

Parses a single `git diff --staged -U0` call to extract per-file stats,
status, and hunk context names. Outputs a compact summary for commit
message generation. Uses only stdlib.
"""

import subprocess
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

DIFF_RE = re.compile(r"^diff --git a/.+ b/(.+)$")
NEW_RE = re.compile(r"^new file mode")
DEL_RE = re.compile(r"^deleted file mode")
RENAME_RE = re.compile(r"^rename from (.+)")
MODE_RE = re.compile(r"^old mode (\d+)")
NEW_MODE_RE = re.compile(r"^new mode (\d+)")
BIN_RE = re.compile(r"^Binary files")
HUNK_RE = re.compile(r"^@@ .+? @@\s*(.*)")


def main():
    cmd = ["git"]
    if len(sys.argv) > 1:
        cmd += ["-C", sys.argv[1]]
    cmd += ["diff", "--staged", "-U0"]
    r = subprocess.run(
        cmd,
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    if r.returncode != 0:
        sys.stderr.write(r.stderr)
        print(f"git diff failed (exit {r.returncode}): {r.stderr.strip()}")
        sys.exit(1)
    if not r.stdout.strip():
        print("No staged changes.")
        return

    files = {}  # path -> {added, deleted, status, binary, rename_from, old_mode, new_mode, hunks}
    cur = None

    for line in r.stdout.splitlines():
        m = DIFF_RE.match(line)
        if m:
            cur = m.group(1)
            files[cur] = {"added": 0, "deleted": 0, "status": "M",
                          "binary": False, "rename_from": None,
                          "old_mode": None, "new_mode": None, "hunks": []}
            continue
        if cur is None:
            continue
        f = files[cur]
        if NEW_RE.match(line):
            f["status"] = "A"
        elif DEL_RE.match(line):
            f["status"] = "D"
        elif (m := RENAME_RE.match(line)):
            f["status"] = "R"
            f["rename_from"] = m.group(1)
        elif (m := MODE_RE.match(line)):
            f["old_mode"] = m.group(1)
        elif (m := NEW_MODE_RE.match(line)):
            f["new_mode"] = m.group(1)
        elif BIN_RE.match(line):
            f["binary"] = True
        elif (m := HUNK_RE.match(line)):
            ctx = m.group(1).strip()
            if ctx and ctx not in f["hunks"]:
                f["hunks"].append(ctx)
        elif line.startswith("+") and not line.startswith("+++"):
            f["added"] += 1
        elif line.startswith("-") and not line.startswith("---"):
            f["deleted"] += 1

    # dynamic column width
    max_path = max((len(p) for p in files), default=30)
    col_w = min(max(max_path, 20), 60)

    total_add = total_del = 0
    for path in sorted(files):
        f = files[path]
        total_add += f["added"]
        total_del += f["deleted"]

        if f["binary"]:
            ctx = "[binary]"
        elif f["status"] == "A":
            ctx = "[new file]"
        elif f["status"] == "D":
            ctx = "[deleted]"
        elif f["old_mode"] and f["new_mode"] and f["added"] == 0 and f["deleted"] == 0:
            ctx = f"[mode {f['old_mode']} -> {f['new_mode']}]"
        else:
            ctx = "[" + ", ".join(f["hunks"][:8]) + "]" if f["hunks"] else ""

        rename = f" <- {f['rename_from']}" if f["rename_from"] else ""
        print(f"{f['status']} {path:<{col_w}s} {'+' + str(f['added']):>5s} {'-' + str(f['deleted']):>5s}{rename}  {ctx}")

    n = len(files)
    print("---")
    print(f"{n} file{'s' if n != 1 else ''} changed, {total_add} insertion{'s' if total_add != 1 else ''}, {total_del} deletion{'s' if total_del != 1 else ''}")


if __name__ == "__main__":
    main()
