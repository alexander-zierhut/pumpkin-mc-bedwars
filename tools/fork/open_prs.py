"""Push the PR branches to the fork and open one PR per branch inside the fork (base master).

Usage: open_prs.py <descriptions.json> [--dry-run]
descriptions.json: [{"branch", "title", "body"}], bodies may contain {{PR:<branch>}} placeholders.
Already opened PRs (pr-numbers.json) are skipped, so the script can be re-run.
"""
import json, os, re, subprocess, sys

SP = os.environ.get("FORK_WORK", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "work", "fork"))
REPO = "alexander-zierhut/pumpkin-mc-pvp"
GIT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "vendor", "Pumpkin")
dry = "--dry-run" in sys.argv
descs = {d["branch"]: d for d in json.load(open(sys.argv[1]))}
order = [u["branch"] for u in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "units.json")))]
assert set(order) == set(descs), set(order) ^ set(descs)
try:
    numbers = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "pr-numbers.json")))
except FileNotFoundError:
    numbers = {}

def run(*a, **kw):
    print("+", " ".join(a[:6]), "..." if len(a) > 6 else "")
    if dry:
        return ""
    return subprocess.run(a, check=True, capture_output=True, text=True, **kw).stdout

def body_for(branch, final):
    def sub(m):
        ref = m.group(1)
        assert ref in descs, (branch, ref)
        if ref in numbers:
            return f"#{numbers[ref]}"
        if final and not dry:
            raise SystemExit(f"{branch}: {ref} has no PR")
        return f"`{ref}`"
    return re.sub(r"\{\{PR:([^}]+)\}\}", sub, descs[branch]["body"])

later = []
for branch in order:
    if branch in numbers:
        continue
    d = descs[branch]
    body = body_for(branch, False)
    if "{{PR:" in d["body"] and any(r not in numbers for r in re.findall(r"\{\{PR:([^}]+)\}\}", d["body"])):
        later.append(branch)
    assert "—" not in body + d["title"] and "–" not in body + d["title"], branch
    run("git", "-C", GIT, "push", "-q", "--force-with-lease", "mine", f"{branch}:refs/heads/{branch}")
    path = f"{SP}/pr/body-{branch.replace('/', '_')}.md"
    open(path, "w").write(body)
    url = run("gh", "pr", "create", "-R", REPO, "--base", "master", "--head", branch,
              "--title", d["title"], "--body-file", path).strip()
    if not dry:
        numbers[branch] = int(url.rsplit("/", 1)[1])
        json.dump(numbers, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "pr-numbers.json"), "w"), indent=1)
        print(branch, url)

# second pass: references to PRs that were opened after the referring one
for branch in later:
    path = f"{SP}/pr/body-{branch.replace('/', '_')}.md"
    open(path, "w").write(body_for(branch, True))
    run("gh", "pr", "edit", str(numbers.get(branch, 0)), "-R", REPO, "--body-file", path)
