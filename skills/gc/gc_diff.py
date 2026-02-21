"""Compact git diff summarizer for staged changes.

Parses a single `git diff --staged -U0` call to extract per-file stats,
status, and hunk context names. Outputs a compact summary for commit
message generation. Uses only stdlib.
"""

import subprocess
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")


def main():
    cmd = ["git"]
    if len(sys.argv) > 1:
        cmd += ["-C", sys.argv[1]]
    cmd += ["diff", "--staged", "-U0"]
    r = subprocess.run(
        cmd,
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    if r.returncode != 0 or not r.stdout.strip():
        print("No staged changes.")
        return

    diff_re = re.compile(r"^diff --git a/.+ b/(.+)$")
    new_re = re.compile(r"^new file mode")
    del_re = re.compile(r"^deleted file mode")
    rename_re = re.compile(r"^rename from (.+)")
    bin_re = re.compile(r"^Binary files")
    hunk_re = re.compile(r"^@@ .+? @@\s*(.*)")

    files = {}  # path -> {added, deleted, status, binary, rename_from, hunks}
    cur = None

    for line in r.stdout.splitlines():
        m = diff_re.match(line)
        if m:
            cur = m.group(1)
            files[cur] = {"added": 0, "deleted": 0, "status": "M",
                          "binary": False, "rename_from": None, "hunks": []}
            continue
        if cur is None:
            continue
        if new_re.match(line):
            files[cur]["status"] = "A"
        elif del_re.match(line):
            files[cur]["status"] = "D"
        elif rename_re.match(line):
            files[cur]["status"] = "R"
            files[cur]["rename_from"] = rename_re.match(line).group(1)
        elif bin_re.match(line):
            files[cur]["binary"] = True
        elif hunk_re.match(line):
            ctx = hunk_re.match(line).group(1).strip()
            if ctx and ctx not in files[cur]["hunks"]:
                files[cur]["hunks"].append(ctx)
        elif line.startswith("+") and not line.startswith("+++"):
            files[cur]["added"] += 1
        elif line.startswith("-") and not line.startswith("---"):
            files[cur]["deleted"] += 1

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
        else:
            ctx = "[" + ", ".join(f["hunks"][:8]) + "]" if f["hunks"] else ""

        rename = f" <- {f['rename_from']}" if f["rename_from"] else ""
        print(f"{f['status']} {path:<30s} {'+' + str(f['added']):>5s} {'-' + str(f['deleted']):>5s}{rename}  {ctx}")

    n = len(files)
    print("---")
    print(f"{n} file{'s' if n != 1 else ''} changed, {total_add} insertion{'s' if total_add != 1 else ''}, {total_del} deletion{'s' if total_del != 1 else ''}")


if __name__ == "__main__":
    main()
