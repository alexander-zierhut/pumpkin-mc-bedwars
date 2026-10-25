# BedWars on Pumpkin

**1.8 PvP BedWars on a Minecraft server written in Rust.** Modern clients, one `docker run`, about 240 MB of RAM.

[![Build server](https://github.com/alexander-zierhut/pumpkin-mc-bedwars/actions/workflows/build.yml/badge.svg)](https://github.com/alexander-zierhut/pumpkin-mc-bedwars/actions/workflows/build.yml)
![Minecraft 26.3](https://img.shields.io/badge/Minecraft-26.3-3c8527)
![Combat 1.8](https://img.shields.io/badge/combat-1.8-b02e26)
![Plugin TypeScript to Wasm](https://img.shields.io/badge/plugin-TypeScript%20%E2%86%92%20Wasm-3178c6)

[Pumpkin](https://pumpkinmc.org) is a Minecraft server written from scratch in Rust. It is fast and small, but until
now it could not run a PvP minigame: arrows, snowballs and tridents flew straight through players, there was no 1.8
combat, and the plugin API was missing what a minigame needs. This repository is a complete, play tested BedWars
server on Pumpkin, and the [fork behind it](https://github.com/alexander-zierhut/pumpkin-mc-pvp) fixes the server
itself, with every fix as its own ready pull request.

## Why it is interesting

- **Real 1.8 PvP for 26.3 clients.** No attack cooldown, sword blocking, 1.8 damage, crits and knockback, done by the
  server. Nobody needs an old client, ViaVersion or a mod.
- **The 1.8 bow, measured.** 128 identical shots on a real 1.8.9 server and on this one: same launch speed (2.9965
  vs 2.9972 blocks per tick), the same spread, and every arrow follows the 1.8 flight path to within 0.05 blocks.
  Before the fork, a level shot on Pumpkin landed 13 % short. [The report](reports/bow-1.8.9-vs-pumpkin.md).
- **Tiny footprint.** A lobby with 8 players takes about 2 % of one CPU core and about 240 MB of RAM, a running 1v1
  round about 4 %. The fork cut Pumpkin's idle CPU on a many-core host from about 7 % to about 1 %.
- **The whole game is TypeScript compiled to WebAssembly.** About 3,700 lines for lobby, teams, shop,
  resource spawners, special items, rejoin and statistics, running in Pumpkin's Wasm plugin host.
- **42 fixes for Pumpkin, each as a pull request.** Projectiles that hit players, the vanilla arrow flight order, item
  hashes that stop inventory flicker, teleport races, late joiners who saw nobody, a server freeze in the plugin host,
  and more. Every bug is written up with cause, repro and the vanilla code it follows in
  [PUMPKIN-FINDINGS.md](PUMPKIN-FINDINGS.md).
- **Tested by bots.** 18 end-to-end specs with about 500 checks: mineflayer bots join, buy, bridge, fight, shoot and
  break beds on throwaway servers.

## Start a server

You need [Docker](https://docs.docker.com/get-docker/). One command downloads and starts the server:

```bash
docker run -dit --name bedwars --restart unless-stopped -p 25565:25565 -v bedwars:/srv ghcr.io/alexander-zierhut/pumpkin-mc-bedwars:latest
```

Join with Minecraft Java 26.3 on the address of that machine. To become admin, open the console and op yourself:

```bash
docker attach bedwars        # type: op <your Minecraft name>, leave with Ctrl+P Ctrl+Q
```

Update with `docker pull ghcr.io/alexander-zierhut/pumpkin-mc-bedwars:latest`, then remove and start the container
again with the same command. Worlds, settings and statistics stay in the volume `bedwars`.

Without Docker (Linux x86_64): download `bedwars-server-linux-x86_64.tar.gz` from the
[latest release](https://github.com/alexander-zierhut/pumpkin-mc-bedwars/releases/tag/latest), unpack it and run
`./start.sh`.

## Playing

Rewinside style BedWars, two teams (Rot and Blau), texts in German. Everyone who joins lands in the lobby of the active
map and picks a team with the item in the hotbar. An admin starts the round with the diamond in the lobby or with
`/start`. Break the enemy bed, then the last team standing wins.

- Spawners drop Bronze, Silber and Gold. The villagers are the shop: blocks, weapons, armour, bows, potions, specials.
- Specials: Teleporter, Fallschirm (a parachute you can shoot from), Mobiler Shop, Rettungsplattform, TNT,
  Enderperle, Teamkiste.
- Rush is the map that comes with the server. More maps can be added, see below.

| Command | Who | What |
|---|---|---|
| diamond item in the lobby, `/start` | admin | start the round |
| `/map [name]` | admin | show or change the active map |
| `/setteam <player> <team>` | admin | put a player into a team before the start |
| `/bwconfig countdown/min-players/game-time/grace-seconds <value>` | admin | change settings while the server runs |
| `/bw join`, `/bw leave`, `/bw list`, `/bw stats [player]`, `/bw help` | everyone | |
| `/autojoin` | everyone | stop or start joining rounds automatically (to build or watch) |

## Settings

The server folder is the volume (`/srv` in the container, `docker volume inspect bedwars` shows where it is):

| File | What |
|---|---|
| `pumpkin.toml` | ports, MOTD, view distance, `online_mode`, `[pvp.legacy_combat]` (1.8 combat on or off), RCON |
| `plugins/data/lan-bedwars/` | arenas you added, statistics (`stats.yml`), the active map |

`online_mode = true` checks every player against the Mojang login servers, so the server needs internet. For a LAN
without internet set it to `false` (in the `[networking.java]` section). The RCON password is generated on the first
start and written into `pumpkin.toml`; RCON is only reachable from the machine itself unless you publish port 25575.

## More maps

Only Rush is included. To add a map:

1. Copy the world folder to `bedwars/<world name>/` in the server folder.
2. Write an arena file in the ScreamingBedWars format (see [config/arena-rush.yml](config/arena-rush.yml) and
   [config/arena-mushroom.yml](config/arena-mushroom.yml)) with `world: <world name>` and put it into
   `plugins/data/lan-bedwars/arenas/`.
3. Restart the server and switch with `/map <name>`.

## What it took

Porting a BedWars server touches almost every part of a Minecraft server. These are the areas the fork had to fix
or add, all as [pull requests in the fork](https://github.com/alexander-zierhut/pumpkin-mc-pvp/pulls) against
Pumpkin's `master`:

| Area | Examples |
|---|---|
| Combat | optional 1.8 combat (`[pvp.legacy_combat]`), knockback that no longer stacks over hits, motion syncs like vanilla |
| Projectiles | arrows, snowballs, tridents and hooks hit players, vanilla flight order, shooter movement, owner and vehicle rules |
| Inventory | component hashes like vanilla (no more flicker), stacks that compare equal, styled item names, screens that keep the cursor |
| Network | moves that raced a teleport, teleport id races, chunk view after a teleport, late joiners, a zero `LpVec3` that kicked clients |
| Plugin API | item drops, filtered explosions, shared GUIs, forced chunks, explode events with source, a store deadlock |
| Performance | small worlds tick without waking Rayon, Fx hashing for chunk maps, non-blocking plugin events, memory after startup |

The Pumpkin maintainers know about the fork and can pick what they want upstream.

## Development

Clone with the fork as a submodule and start everything with one command. Only Docker and git are needed, the Rust
and Node builds run in containers:

```bash
git clone --recurse-submodules https://github.com/alexander-zierhut/pumpkin-mc-bedwars.git
cd pumpkin-mc-bedwars
./bedwars.sh
```

The first build compiles Pumpkin (about 10 to 20 minutes), later builds reuse the cache. The server runs on port
25565 with its folder in `./data`.

| Command | What |
|---|---|
| `./bedwars.sh` | build the fork and the plugin, start the server |
| `./bedwars.sh plugin` | rebuild only the TypeScript plugin and restart (seconds) |
| `./bedwars.sh logs` / `console` / `stop` | log, console, stop |
| `./bedwars.sh reset-maps` | put the pristine maps back |
| `./bedwars.sh test [spec]` | the bot test suite, needs Node 22 or newer (about 35 minutes, or one spec by name) |

`BEDWARS_PORT=25566 ./bedwars.sh` runs a second server next to one on 25565. [DEVELOPMENT.md](DEVELOPMENT.md) has the
state of the project, the rules it follows and how the fork branches are maintained.

| Part | Where |
|---|---|
| Pumpkin fork (submodule, branch `bedwars-pvp-fixes`) | `vendor/Pumpkin` |
| The game (TypeScript, platform independent) and its Pumpkin adapter | `plugin/src`, `plugin/src/pumpkin-platform.ts` |
| Plugin build: esbuild and componentize-qjs (QuickJS) to a WebAssembly component | `plugin/build.mjs` |
| Game settings, shop and arenas (built into the plugin) | `config/` |
| Server image and start scripts | `Dockerfile`, `docker/`, `bedwars.sh` |
| Bot tests (mineflayer through ViaProxy) and the 1.8.9 comparison | `tests/` |
| Fork branch and PR tooling | `tools/fork/` |

### Tests

| Spec | Checks |
|---|---|
| 00 smoke, 01 to 03 maps | server starts, every map loads and plays (02 and 03 are skipped without the extra maps) |
| 10 lobby | auto-join, team selector, countdown, /map, /autojoin, late joiners, void |
| 20 economy | spawner rates and stacks, names, holograms, pickup, despawn |
| 30 shop | every item of shop.yml, prices, shift-click, number keys, team colours |
| 40 / 41 bow | 1.8 bow launch and flight; control run without legacy combat |
| 50 melee | 1.8 damage table, crits, hit delay, knockback, blocking, armour, regeneration |
| 60 special items | Teleporter, Fallschirm, Mobiler Shop, Rettungsplattform, TNT, Enderperle, Teamkiste |
| 70 full game | a whole round with three players |
| 80 lobby load | 8 players at once, leave and rejoin churn, German commands |
| 90 rejoin | reconnect into the team, grace period |
| 95 to 98 | play test fixes, void protection, admin start, network sync |

Each spec starts its own throwaway server in Docker with ViaProxy in front (mineflayer speaks 26.1). The plugin's unit
tests run with `cd plugin && npm test`.

## How this was made

Built in about a week with an AI coding agent (Claude Code), which wrote most of the code here and in the fork. It
was held to evidence instead of trust: the decompiled vanilla 26.3 server as the reference for every fix, a real
1.8.9 server for the combat, the bot test suite, and play tests with real clients.

## Work together

Want to run it, add maps, help get the fixes into Pumpkin or build something similar? Write me on Discord:
**`alzlper`**.
