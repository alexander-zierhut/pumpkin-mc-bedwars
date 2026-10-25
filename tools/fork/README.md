# Fork maintenance tools

The Pumpkin fork in `vendor/Pumpkin` (remote `mine` = github.com/alexander-zierhut/pumpkin-mc-pvp, `origin` =
upstream Pumpkin-MC/Pumpkin) has one combined branch and one branch per fix:

- `bedwars-pvp-fixes`: the fork's `master` plus every fix, the branch the server is built from (submodule here).
- `feat/...`, `fix/...`, `perf/...`: `master` plus one fix (plus the commits of the fixes it builds on), each with a
  pull request inside the fork against `master`, so the Pumpkin maintainers can pick fixes in the GitHub UI.
  Upstream PRs are opened by a person, never by an agent (Pumpkin's AGENTS.md).

| File | What |
|---|---|
| `units.json` | per PR branch: the commit subjects on `bedwars-pvp-fixes`, the branches it builds on, and `manual` when the branch was adapted by hand after the cherry-pick (do not rebuild those blindly) |
| `pr-descriptions.json` | title and body of every PR; `{{PR:<branch>}}` is replaced by the PR number |
| `pr-numbers.json` | branch to PR number in the fork |
| `deps.py` | finds for every commit which earlier commits it needs to apply (trial cherry-picks onto `mine/master`) |
| `mkbranches.py [--force] [branch...]` | rebuilds PR branches from `bedwars-pvp-fixes` per `units.json` |
| `check.sh <branch>...` | cargo fmt, clippy (all targets and features) and tests on the crates Pumpkin's CI would pick, in the Rust container, 12 cores, one at a time (`build/.build.lock`); summary in `work/fork/checks/summary.txt` |
| `open_prs.py pr-descriptions.json [--dry-run]` | pushes the branches to `mine` and opens the missing PRs (`gh pr create -R alexander-zierhut/pumpkin-mc-pvp --base master`, never upstream) |

Setup once per checkout (the work folder `work/fork` is local and gitignored, override with `FORK_WORK`):

```bash
git -C vendor/Pumpkin fetch mine
git -C vendor/Pumpkin worktree add --detach "$PWD/work/fork/trial" mine/master
git -C vendor/Pumpkin worktree add --detach "$PWD/work/fork/check" mine/master
docker build -t pumpkin-build -f build/Dockerfile.rust build/
```

Changing a fix: commit on `bedwars-pvp-fixes` as a `fixup!` of the fix's commit and autosquash
(`GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash mine/master`), rebuild that branch with `mkbranches.py <branch>`
(or redo its `manual` adaptation), run `check.sh <branch>`, then
`git -C vendor/Pumpkin push --force-with-lease mine <branch> bedwars-pvp-fixes`. The PR updates itself.

A new fix: a new commit on `bedwars-pvp-fixes`, a new entry in `units.json` and `pr-descriptions.json`, then
`mkbranches.py <branch>`, `check.sh <branch>` and `open_prs.py pr-descriptions.json`.

The fork's GitHub Actions are not enabled. Do not enable them without disabling "Request reviewers" first: that
workflow comments on every PR and mentions Pumpkin maintainers.
