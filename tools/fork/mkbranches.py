"""Builds the PR branches of the fork from bedwars-pvp-fixes (see tools/fork/README.md).

Usage: mkbranches.py [--force] [branch...]   (default: all branches that were not adapted by hand)
"""
import json, os, subprocess, sys
SP = os.environ.get("FORK_WORK", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "work", "fork")); WT = SP + "/trial"; force = "--force" in sys.argv; only = [a for a in sys.argv[1:] if a != "--force"]
HERE = os.path.dirname(os.path.abspath(__file__))
def git(*a, check=True):
    r = subprocess.run(["git", *a], cwd=WT, capture_output=True, text=True)
    if check and r.returncode: raise RuntimeError(" ".join(a) + r.stderr)
    return r
commits = git("rev-list", "--reverse", "mine/master..bedwars-pvp-fixes").stdout.split()
by_subject = {git("log", "-1", "--format=%s", c).stdout.strip(): c for c in commits}
entries = json.load(open(os.path.join(HERE, "units.json")))
units = {u["branch"]: (u["commits"], u["builds_on"]) for u in entries}
manual = {u["branch"]: u["manual"] for u in entries if "manual" in u}
def seq(name):
    own, bases = units[name]
    s = set(by_subject[t] for t in own)
    for b in bases: s |= seq(b)
    return s
plan = []
for name in units:
    if only and name not in only: continue
    if name in manual and not force:
        print(f"skipped (adapted by hand, --force to rebuild and redo: {manual[name]}) {name}"); continue
    s = sorted(seq(name), key=commits.index)
    git("switch", "-q", "--detach", "mine/master"); git("reset", "-q", "--hard")
    status = "ok"
    for c in s:
        if git("cherry-pick", c, check=False).returncode:
            status = "CONFLICT at " + c[:9] + " " + ",".join(git("diff", "--name-only", "--diff-filter=U").stdout.split())
            git("cherry-pick", "--abort", check=False); break
    if status == "ok": git("branch", "-f", name, "HEAD")
    print(f"{status:60.60} {name}  bases={units[name][1]}")
