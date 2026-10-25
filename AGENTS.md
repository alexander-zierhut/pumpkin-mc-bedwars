# Notes for coding agents

BedWars with 1.8 PvP on Pumpkin (Rust Minecraft server). The game is a TypeScript plugin compiled to a WebAssembly
component; the server is a fork of Pumpkin in the submodule `vendor/Pumpkin`. Read these before changing anything:

1. `DEVELOPMENT.md`: current state, the owner's rules, where things are, open items.
2. `tools/fork/README.md` before touching `vendor/Pumpkin` or its branches and PRs.
3. `PUMPKIN-FINDINGS.md` and `TOOLCHAIN-FINDINGS.md` before debugging the server, the plugin host or the bot tests.
   Most surprises are already written down there.

Keep those files current when the state changes, so the next session does not start from zero.

## Rules

- Commits are authored by the owner as git is configured, never with another identity. No AI mention, no
  `Co-authored-by` and no tool trailers in commit messages.
  - This repository: emoji, `(scope)`, short lowercase description, e.g. `🐛 (shop) keep the cursor item`.
  - The fork: conventional commits with a scope, e.g. `fix(arrow): ...`.
- Pull requests are only opened inside the fork (`-R alexander-zierhut/pumpkin-mc-pvp --base master`). Never open
  PRs, issues or comments upstream (Pumpkin-MC/Pumpkin): the owner does that. A fork PR is short, in Pumpkin's
  template (`## Description`, `## Testing`), and starts with the disclosure line used in
  `tools/fork/pr-descriptions.json` ("> The code and this description were written by an AI agent (<tool>, <model>)
  ..."). The disclosure format in `vendor/Pumpkin/AGENTS.md` (robot emoji title) is for upstream PRs and does not
  apply in the fork; its rules for the code itself do.
- Do not enable the fork's GitHub Actions (its reviewer workflow mentions Pumpkin maintainers).
- Before fixing a Pumpkin bug, search the open upstream PRs and issues for the same fix.
- `./bedwars.sh` runs the dev server as container `pumpkin-mc-bedwars` on port 25565 (folder `./data`); use
  `BEDWARS_PORT=25566` if that port is taken. The bot suite starts throwaway `pktest-*` containers on free ports.
- The machine is shared: server builds (`build/build-pumpkin.sh`, `./bedwars.sh`) with at most 6 cores, cargo
  checks (`build/cargo.sh`, `tools/fork/check.sh`) with 12, one Rust job at a time (`build/.build.lock`), bot specs
  at most 3 in parallel.
- Only the Rush map is ours to publish. `maps/rewi_*`, `reference/` (decompiled vanilla), `work/` and
  `config/ops.json` stay local and are gitignored. Never commit Mojang code or jars.
- A push to `main` builds the Docker image and the release (a few minutes when the fork is unchanged, about 17 with
  a Rust rebuild); pushes that only touch Markdown, `docs/`, `reports/`, `tests/` or `tools/fork/` are skipped. A
  new push cancels a running build (`cancel-in-progress`), so batch changes into one push.
- Licenses: this repository Apache-2.0, `vendor/Pumpkin` GPL-3.0. Code copied from Pumpkin into the plugin would
  have to stay GPL, so keep the two apart.
- Local branches in `vendor/Pumpkin` that are not in `tools/fork/units.json` (`backup/before-restructure`, `clean`,
  `clean1`, `lan-bedwars`) are old local snapshots. Do not push them.
- Texts (docs, README, PR descriptions): no em dashes, little bold. Public texts are balanced and appreciative of
  Pumpkin, no hype or claims of significance.

## Plugin

- `plugin/src/game.ts`, `bedwars.ts`, `shop.ts`, `specials.ts` and friends are the game and know nothing about
  Pumpkin. They talk to the server through `platform.ts`; `pumpkin-platform.ts` implements that on the Pumpkin
  plugin API and `plugin/test/fake-platform.ts` in memory, so whole rounds run in Node unit tests.
- Player-visible texts are English, in `plugin/src/text.ts`, `config/shop.yml` and `config/arena-*.yml`. The bot
  specs and `tests/play` find items and messages by these names, so update them together.
- Shop items are entries in `config/shop.yml` (`price: 3 of iron`, `stack: "fishing_rod;1;§fFishing Rod"`). The
  shop shows at most 8 categories; items that must not stack are listed in `UNSTACKABLE` in `plugin/src/inventory.ts`.
  Bot spec 30 buys every item of shop.yml, so it covers new items without changes.
- `config/*.yml` is bundled into the plugin at build time (`plugin/src/main.ts` imports it). New arenas go into
  `ARENA_FILES` there, or into the server's `plugins/data/lan-bedwars/arenas/` at runtime.
- Player ids are UUID strings, never the WIT `u64` pair: QuickJS turns `u64` into a JS number and loses precision.
- The plugin runs in QuickJS (componentize-qjs): no `TextEncoder`, no `BigInt` into the scheduler. See
  `TOOLCHAIN-FINDINGS.md` Q1 to Q3 and T1.
- A new host import in the fork that can fire a plugin event must be `async | store` in `bindings.rs`, or the
  server freezes silently (`PUMPKIN-FINDINGS.md` 2.3).

## Commands

```bash
cd plugin && npm test && npm run check    # unit tests and type check, seconds
tools/apply.sh --maps                     # build the plugin and install it with configs and maps
./bedwars.sh plugin                       # rebuild the plugin and restart the local dev server (./data)
cd tests && node run.js --parallel 2 10 20  # bot specs by number or name, each on its own throwaway server
./bedwars.sh                              # full build of the fork and the plugin in Docker, then start
```

Which bot spec covers what is listed in the README under "Test specs". After a plugin change run the unit tests and
the specs that touch it; after a fork change also run `tools/fork/check.sh` on the affected PR branch.
