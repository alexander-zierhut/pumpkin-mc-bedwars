# Working on this project

Notes for whoever continues the work (a person or a coding agent), so the state and the decisions do not have to
be rediscovered. The README covers playing and the everyday commands; `AGENTS.md` is the short version for coding
agents.

## State (25.10.2026)

- Repositories: this one is [pumpkin-mc-bedwars](https://github.com/alexander-zierhut/pumpkin-mc-bedwars); the
  Pumpkin fork is [pumpkin-mc-pvp](https://github.com/alexander-zierhut/pumpkin-mc-pvp), submodule `vendor/Pumpkin`,
  branch `bedwars-pvp-fixes` (made the fork's default branch by the owner).
- The fork's `master` is upstream `master` at `cd9e98c` (25.10.2026). `bedwars-pvp-fixes` is that plus 61 commits.
  42 PR branches, one per fix, each with a pull request inside the fork (see `tools/fork/README.md`). Six upstream
  PRs are only in `bedwars-pvp-fixes` (#3995, #4149, #3351, #4118, #3307, part of #3432), without own PRs.
- Upstreaming: the Pumpkin maintainers know about the fork and pick from its PRs. Real upstream PRs are opened by
  the owner, never by an agent (Pumpkin's AGENTS.md), with a real-client capture and the AI disclosure line.
- Tests: the full bot suite passed on the combined branch before the rebase (18 of 18 run alone; with 3 specs in
  parallel the bow check "sprint p0 #1" sometimes fails, a known flake). Unit tests of all crates pass on
  `bedwars-pvp-fixes`.

## Rules the owner set

- Commits are authored by the owner (`zierhut.alex <alex@zierhut-it.de>`) and never mention AI or carry tool
  trailers. This repository uses emoji, `(scope)` and a short description, the fork conventional commits (see
  `AGENTS.md`). PR descriptions in the fork start with the AI disclosure line.
- Documents: no em dashes, little bold.
- Before fixing a Pumpkin bug, search the open upstream PRs and issues for the same fix (`gh pr list -R
  Pumpkin-MC/Pumpkin --search ...`) and reuse or compare instead of starting over.
- The machine is shared: Rust builds run in Docker with at most 6 cores (`build/build-pumpkin.sh`), branch checks
  with 12, one build at a time (`build/.build.lock`). Bot specs at most 3 in parallel (`tests/run.js --parallel`).
- Vanilla parity is checked against the decompiled 26.3 server (Vineflower), kept locally in
  `reference/vanilla-26.3/src` and never committed. 1.8 behaviour is checked against a real 1.8.9 server
  (`tests/compare/`, the Mojang jar is downloaded, not committed).

- Licenses: this repository is Apache-2.0 (`LICENSE`), the fork GPL-3.0 like Pumpkin. The image and the release
  archive ship both (`/opt/bedwars/LICENSE`, `LICENSE-pumpkin`).
- CI builds on pushes to `main` except when only Markdown, `docs/`, `reports/`, `tests/` or `tools/fork/` changed
  (`paths-ignore` in `.github/workflows/build.yml`). Run it by hand with `gh workflow run build.yml` if needed.

## Where things are

| What | Where |
|---|---|
| Pumpkin bugs found, with cause, repro, fix and upstream PR status | `PUMPKIN-FINDINGS.md` |
| mineflayer, componentize-qjs and SDK problems | `TOOLCHAIN-FINDINGS.md` |
| First play test and what was done about each point | `PLAYTEST-1.md` |
| Bow comparison with 1.8.9 | `reports/bow-1.8.9-vs-pumpkin.md` |
| Fork branches, PR descriptions and the scripts that build, check and open them | `tools/fork/` |
| Player-visible texts (English): messages, item and shop names, team names | `plugin/src/text.ts`, `config/shop.yml`, `config/arena-*.yml` |
| Local only (gitignored): the extra maps `maps/rewi_*`, `work/`, `reference/`, `config/ops.json` | |

The extra maps Mushroom and Mansion are not ours to publish. With them in `maps/`, `tools/apply.sh` installs their
arenas from `config/arena-*.yml` automatically; without them the map specs 02 and 03 are skipped.

## Workflows

- Plugin change: edit `plugin/src`, `cd plugin && npm test && npm run check`, `./bedwars.sh plugin` to try it, the bot
  specs that cover it (`./bedwars.sh test <name>`), commit, push. The GitHub workflow builds the image and the
  release archive on every push to `main`.
- Fork change: see `tools/fork/README.md` (commit on `bedwars-pvp-fixes`, rebuild and check the PR branch, push both),
  then move the submodule pointer here and push.
- New upstream master: sync the fork's `master` (`gh repo sync alexander-zierhut/pumpkin-mc-pvp -b master`), rebase
  `bedwars-pvp-fixes` onto it, drop commits that landed upstream, rebuild and check the PR branches, force push.

## Open

- The bow flake "sprint p0 #1" under parallel load (`PUMPKIN-FINDINGS.md`, harness notes).
- Real-client captures for the upstream PRs the maintainers pick.
- Idea, not started: a differential proxy that mirrors a real client to vanilla and Pumpkin and diffs the packets.
