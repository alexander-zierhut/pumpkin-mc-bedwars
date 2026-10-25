# BedWars on Pumpkin

BedWars in the Rewinside style with Minecraft 1.8 PvP, running on [Pumpkin](https://pumpkinmc.org), a Minecraft
server written in Rust. Players join with a normal Minecraft Java 26.3 client. The 1.8 combat (no attack cooldown,
sword blocking, the 1.8 knockback and the 1.8 bow) is done by the server, so nobody needs an old client or a mod.

The server is small: a lobby with 8 players needs about 2 % of one CPU core and about 240 MB of RAM, a running 1v1
round about 4 %. It was built for LAN parties, but works just as well on a small VPS.

The game texts are in German (Rot gegen Blau, Bronze, Silber, Gold).

## Start a server

You need [Docker](https://docs.docker.com/get-docker/). One command downloads and starts the server:

```bash
docker run -dit --name bedwars --restart unless-stopped -p 25565:25565 -v bedwars:/srv ghcr.io/alexander-zierhut/pumpkin-mc-bedwars:latest
```

Then join with Minecraft 26.3 on the address of that machine (port 25565). To become admin, open the console and op
yourself:

```bash
docker attach bedwars        # type: op <your Minecraft name>, leave with Ctrl+P Ctrl+Q
```

Update to a new build with `docker pull ghcr.io/alexander-zierhut/pumpkin-mc-bedwars:latest`, then remove and start
the container again with the same command. Worlds, settings and statistics live in the volume `bedwars` and are kept.

Without Docker (Linux x86_64): download `bedwars-server-linux-x86_64.tar.gz` from the
[latest release](https://github.com/alexander-zierhut/pumpkin-mc-bedwars/releases/tag/latest), unpack it and run
`./start.sh` in the folder.

## Playing

Everyone who joins lands in the lobby of the active map and picks a team with the item in the hotbar. An admin starts
the round with the diamond in the lobby or with `/start`. Break the enemy bed, then the last team standing wins.

- Spawners drop Bronze, Silber and Gold. The villagers are the shop (blocks, weapons, armour, bows, potions, specials).
- Specials: Teleporter, Fallschirm (parachute), Mobiler Shop, Rettungsplattform, TNT, Enderperle, Teamkiste.
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

## Development

Clone with the Pumpkin fork as a submodule and start everything with one command. Only Docker and git are needed, the
Rust and Node builds run in containers:

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

`BEDWARS_PORT=25566 ./bedwars.sh` runs a second server next to one on 25565.

### How it is built

| Part | Where |
|---|---|
| Pumpkin fork with the 1.8 combat, plugin API additions and vanilla parity fixes | `vendor/Pumpkin` |
| The game: lobby, teams, shop, spawners, specials, rejoin, statistics (TypeScript) | `plugin/src` |
| Pumpkin adapter of the game | `plugin/src/pumpkin-platform.ts` |
| Plugin build: esbuild and componentize-qjs (QuickJS) to a WebAssembly component | `plugin/build.mjs` |
| Game settings, shop and arenas (built into the plugin) | `config/` |
| Server image and start scripts | `Dockerfile`, `docker/`, `bedwars.sh` |
| Bot tests (mineflayer through ViaProxy) | `tests/` |

The YAML files in `config/` are built into the plugin; after a change run `./bedwars.sh plugin`.

### The Pumpkin fork

The server is a fork of Pumpkin:
[alexander-zierhut/pumpkin-mc-pvp](https://github.com/alexander-zierhut/pumpkin-mc-pvp), branch
`bedwars-pvp-fixes`, which is the submodule here. Every fix and feature of it is also a branch of its own against
Pumpkin's master, with a
[pull request inside the fork](https://github.com/alexander-zierhut/pumpkin-mc-pvp/pulls) that explains it, so the
Pumpkin maintainers can pick what they want upstream. The branch additionally contains a few open upstream PRs that
matter for BedWars (#3995, #4149, #3351, #4118, #3307 and part of #3432).

[PUMPKIN-FINDINGS.md](PUMPKIN-FINDINGS.md) lists every Pumpkin bug found on the way with cause, repro and fix,
[TOOLCHAIN-FINDINGS.md](TOOLCHAIN-FINDINGS.md) those in mineflayer, componentize-qjs and the TypeScript SDK.
[reports/bow-1.8.9-vs-pumpkin.md](reports/bow-1.8.9-vs-pumpkin.md) compares bow shots on a real 1.8.9 server with
Pumpkin (the landing points match within 0.05 to 0.06 blocks), and [PLAYTEST-1.md](PLAYTEST-1.md) is the first
play test with what was fixed afterwards.

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

### How this was made

Most of the code here and in the fork was written with an AI coding agent (Claude Code). It was checked with the
bot test suite, against the decompiled vanilla 26.3 server and against a real 1.8.9 server for the combat, and play
tested with real clients.
