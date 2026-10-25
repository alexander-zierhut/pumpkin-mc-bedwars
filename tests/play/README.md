# AI players for BedWars (bots + recorder)

Agents play a real BedWars round on a throwaway copy of the LAN server by controlling 1.8.9 Minecraft bots over HTTP.
A camera bot ("Kamera") records the round into `replay.json` (format: `REPLAY_FORMAT.md`).

## Start a session

```
cd tests
node play/round.js --players "Alice,Bob,Carl,Dora"            # manual: agents play, Ctrl-C ends the session
node play/round.js --players "Alice,Bob,Carl,Dora" --scripted # built-in demo strategies play all bots
```

Options: `--pause 20` (lobby countdown, s), `--memory 1G`, `--api-base 9101`, `--max-minutes 30`, `--out-dir play/replays`, `--no-recorder`.

round.js prints the Minecraft port, the RCON port and one HTTP API port per player. The round starts 20 s after the
second player joined. The session ends on Ctrl-C, after the win message, or after `--max-minutes`.
The replay is written to `play/replays/<timestamp>/replay.json` (plus `session.json`, `server.log`, and one log per bot).
Only the throwaway server of `tests/harness/server.js` is used (never the real server in `./data`).

The recorder joins as spectator once the game runs (it uses `/autojoin` to stay out of the lobby), `t=0` is the game start.
yaw/pitch in the replay are Minecraft degrees (yaw 0 = looking +z, 90 = looking -x; pitch positive = down),
`held` uses mineflayer's 1.8 item names (`wooden_sword`, `iron_sword`, `bow`, ...), team beds are `red_bed`/`blue_bed`.

## Play (one decision every 15-40 s is fine)

```
node play/play.js <port> state                     # compact state, prints chat lines since the last call
node play/play.js <port> do '{"action":"goto","target":"middle"}'
node play/play.js <port> collect resource=bronze seconds=20      # shortcut: <action> key=value ...
```
(`play.sh` is the same.) Raw HTTP: `GET http://127.0.0.1:<port>/state`, `POST /do` with JSON, `GET /help`.
A new action cancels the running one (except `chat`). `state.action` shows progress/result of the current/last action.

### State fields
`team`, `phase` (lobby/running/ended), `alive`/`spectator`, `time`, `pos` [x,y,z], `on` (own_base | enemy_base | middle |
own_silver | enemy_silver | between_islands | void), `hp`, `food`, `held`, `inv` {bronze, silver, gold, items[]}, `armor`,
`own_bed`/`enemy_bed` (alive/destroyed), `near` (players within 32 blocks: name, team, pos, hp, distance), `chat` (new lines),
`action` {id,name,status running|done|failed|cancelled,msg}, `winner`.

### Actions
| action | arguments |
|---|---|
| `goto` | `target`: middle, own_base, enemy_base, own_bed, enemy_bed, shop, bronze, silver, gold, enemy_bronze, enemy_silver, or a player name; or `x,y,z`. `bridge:true` builds a bridge when no walkable path exists. Never walks into the void: "no walkable path" means you must bridge. |
| `collect` | `resource` bronze/silver/gold, `seconds` (stands on the spawner and picks up). `bridge:true` as for goto (silver may be on another island). |
| `buy` | `item` as named in the shop (Sandstone, End Stone, Glass, Knockback Stick, Sword I-IV, Pickaxe I-III, Leather Helmet/Leggings/Boots, Chestplate I-IV, Bow I-III, Arrow, Apple, Steak, Golden Apple, Healing I/II, Teleporter, Parachute, Mobile Shop, Rescue Platform, TNT, Ender Pearl, ...), `count` = number of purchases (Sandstone gives 2 blocks each). Walks to your shop first; armor is worn automatically. |
| `bridge` | `target` middle/enemy_base/own_base/shop/silver/gold/... or `x,z`. Builds a 1-wide line of blocks at floor level towards the target and walks over it. Needs blocks. |
| `attack` | `player?`, `seconds` (default 30). Melee with the best sword, chases via the pathfinder, heals with golden apples at low hp. |
| `shoot` | `player?`, `seconds`. Needs bow + arrow; leads the target. |
| `break_bed` | `seconds`. Goes to the enemy bed and digs it (digs through blocks placed around it). |
| `defend_bed` | `blocks` (default 10). Surrounds your bed with blocks you carry. |
| `place` | `item?`, `at` ({x,y,z} block or named target). e.g. TNT. |
| `equip` | `item`. `eat_gapple`. `look` `target`. `chat` `text`. `wait` `seconds`. `stop`. |
| `use` | `item`: Teleporter, Parachute, Rescue Platform, Mobile Shop. Combo: `{"action":"use","item":"Teleporter","toward":"enemy_bed"}` launches, opens the parachute at the top and steers to the target (needs both items). `{"action":"use","item":"Parachute","toward":...}` works in the air only. |

The bot defends itself automatically (hits back, eats, wears better armor, uses a Rescue Platform when falling into the void),
but it will not leave its current action to chase.

### Tips
- Bronze comes fast (about 6/s on your base spawners), silver slowly (1 per 10 s), gold only in the middle.
- Opening: collect bronze 20-30 s, buy Sandstone (~40 purchases = 80 blocks reaches the enemy island), bridge, fight.
- A bridge is shared: the enemy can walk over yours. Knockback over the edge is the main way to die; fight in the middle of bridges' ends.
- Break the bed first (the player then cannot respawn), then kill the rest. `defend_bed` before you leave your base.
- Shops sell: Sword I 1 silver, Chestplate I 1 silver, Golden Apple 2 gold, Pickaxe I 7 bronze.
- Check `enemy_bed`/`own_bed` and `near` every turn; use `attack` for 10-15 s at a time so you can react.

## Files
`round.js` orchestrator, `botd.js` bot daemon + API, `play.js`/`play.sh` CLI, `recorder.js` camera, `scripted.js` demo strategies,
`map.js` reads the arena from `config/arena-rewi.yml` and `config/paper-world-bedwars.yml` (no hardcoded coordinates),
`lib.js` helpers, `dev/` scratch helpers for development (dev server, rcon, killing bots).
