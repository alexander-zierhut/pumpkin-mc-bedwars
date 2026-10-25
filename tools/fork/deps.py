import json, os, subprocess, sys
SP = os.environ.get("FORK_WORK", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "work", "fork"))
WT = SP + "/trial"
def git(*a, check=True):
    r = subprocess.run(["git", *a], cwd=WT, capture_output=True, text=True)
    if check and r.returncode: raise RuntimeError(r.stderr)
    return r
commits = git("rev-list", "--reverse", "mine/master..bedwars-pvp-fixes").stdout.split()
subj = {c: git("log", "-1", "--format=%s", c).stdout.strip() for c in commits}
files = {c: set(git("show", "--name-only", "--format=", c).stdout.split()) for c in commits}
style = {c for c in commits if subj[c].startswith("style")}
def applies(seq):
    git("reset", "-q", "--hard", "mine/master")
    for c in seq:
        if git("cherry-pick", "--no-commit", c, check=False).returncode:
            git("cherry-pick", "--abort", check=False); git("reset", "-q", "--hard", "mine/master"); return False
    git("reset", "-q", "--hard", "mine/master"); return True
deps = {}
for i, c in enumerate(commits):
    if c in style: continue
    if applies([c]): deps[c] = []; continue
    # candidates: earlier non-style commits sharing files, transitively
    cand = set(); frontier = {c}
    while frontier:
        n = frontier.pop()
        for p in commits[:commits.index(n)]:
            if p in style or p in cand: continue
            if files[p] & files[n]: cand.add(p); frontier.add(p)
    order = lambda s: sorted(s, key=commits.index)
    if not applies(order(cand | {c})):
        deps[c] = ["UNRESOLVED"] + order(cand); continue
    # greedy minimize: drop latest first
    for p in sorted(cand, key=commits.index, reverse=True):
        trial = cand - {p}
        # closure: keep deps of remaining
        if applies(order(trial | {c})): cand = trial
    deps[c] = order(cand)
out = {c[:9]: {"s": subj[c], "deps": [d[:9] if d!="UNRESOLVED" else d for d in deps[c]]} for c in commits if c in deps}
json.dump(out, open(SP + "/deps.json", "w"), indent=1)
for c in commits:
    if c in deps and deps[c]: print(c[:9], subj[c][:60], "<-", " ".join(d[:9] for d in deps[c]))
