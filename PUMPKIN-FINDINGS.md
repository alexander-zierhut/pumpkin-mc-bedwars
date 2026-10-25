# Pumpkin findings from porting a full BedWars server

Running log written while porting a Paper 26.2 BedWars LAN server (ScreamingBedWars, OldCombatMechanics,
ViaVersion and a custom plugin) to Pumpkin with a TypeScript (Wasm) plugin. BedWars touches almost every
part of a server: combat, projectiles, explosions, inventories and GUIs, scoreboards, teams, worlds,
entities and many events. That makes it a good stress test.

- Pumpkin base: `master` at `96424b8` (2026-10-24, 0.2.1+26.3-26.51). Fork with fixes in `vendor/Pumpkin`, branch `lan-bedwars`.
- The fork is published as [alexander-zierhut/pumpkin-mc-pvp](https://github.com/alexander-zierhut/pumpkin-mc-pvp), branch `bedwars-pvp-fixes` (rebased onto `master` at `cd9e98c`, 2026-10-25), with one branch and pull request per fix. Commit hashes in this log are from `lan-bedwars` before that rebase; the commits keep their subjects.
- Plugin: TypeScript, bindings from `crates/pumpkin-plugin-wit/v0.1`, built with `componentize-qjs` 0.4.5 (QuickJS) and esbuild.
- Tests: mineflayer 4.39 bots (protocol 26.1) via ViaProxy 3.4.14 to the 26.3 server.

Every entry has a status: **fixed in the fork** (commit on `lan-bedwars`), **worked around** (in the plugin or the tests) or **open**.
Entries marked "upstream candidate" are general Pumpkin bugs, not BedWars specifics.

The ones that affect every server, most important first:

| Entry | Effect for players |
|---|---|
| 1.41 | players who join later do not see the players already online |
| 1.42 | after a teleport, other players keep seeing the player at its old position |
| 2.15 | a plugin that closes a screen can freeze the whole server |
| 1.44 | inventory clicks snap back, equal items do not stack |
| 1.54 | an idle small server burns 5 to 8 % of a core on a many-core host |
| 1.22 | arrows, snowballs, tridents, fishing hooks never hit players |
| 1.24 | arrows fly one tick behind the client (land 13 % short, measured against 1.8.9 / vanilla order) |
| 1.28, 1.32 | custom item names and lore lose all colours (and are lost on save) |
| 1.26, 1.35 | the client is not told about its own death (health 0), no health after a respawn |
| 1.34 | entities riding a player stay behind |
| 1.25 | projectiles ignore the shooter's movement |
| 1.27 | RCON answers one packet per line (clients get the wrong answers) |
| 1.30, 1.38, 1.39 | `execute if entity/block ...` without `run`, quoted `name=` and block tags in selectors/conditions |

---

## 1. Bugs in Pumpkin (server)

### 1.1 Protocol: a zero `LpVec3` from the client kills the connection (upstream candidate)
`LpVector3d::read` reads two bytes before it checks for the zero vector. Vanilla (and Pumpkin's own
`write`) encode the zero vector as one `0x00` byte, so `read` consumes the next field too. The 26.x
`interact` packet ends with an `LpVec3` hit position plus `sneaking`; with a zero position (mineflayer
always sends one) the read fails with `failed to fill whole buffer` and the client is kicked.
- Repro: right-click any entity with a mineflayer 26.1 bot, client gets "Error while handling incoming packet incomplete".
- **Fixed in the fork** (`fix(protocol): read a zero LpVec3 as the single byte vanilla writes`), with a regression test that fails on master.

### 1.2 Hurt cooldown compares post-armour damage with the raw last damage (upstream candidate)
`LivingEntity::damage_with_context` applies armour and magic absorption first and then checks the hurt
cooldown with `effective_amount <= last_damage_taken`, but stores the *raw* amount in `last_damage_taken`.
Vanilla `LivingEntity.hurt` compares raw with raw and applies armour only to what gets through
(`actuallyHurt(amount - lastHurt)`). With armour on, a stronger second hit inside the 10-tick window is
dropped although vanilla deals the difference.
- **Fixed in the fork** (part of the combat commit): raw comparison first, armour on the difference.

### 1.3 Explosion knockback overwrites the player's motion (upstream candidate)
`Explosion::damage_entities` calls `entity.add_velocity(knockback)` for players too. A player's
server-side velocity is not maintained (movement is client authoritative, see 1.4), so this sends an
absolute velocity packet of "stale value + push". Vanilla adds player knockback to the explosion packet
(`ClientboundExplodePacket.playerKnockback`) and the client adds it to its real motion.
- **Fixed in the fork**: players get their push via the explosion packet.

### 1.4 Player server velocity is stale, knockback formulas use it (open, design question)
Players are not physics-ticked on the server, so `entity.velocity` keeps the last value something set
(often an old knockback). `Entity::knockback` / `apply_knockback` halve that value and add the new push,
so a second knockback inherits half of an arbitrarily old one. Vanilla's server player motion decays.
- **Worked around** for 1.8 combat: the motion is reconstructed from the last movement packets
  (`Player::legacy_motion`). For vanilla combat this is still open.

### 1.5 Arrow knockback (Punch) is applied even when the damage was cancelled (upstream candidate)
`ArrowEntity::on_hit` pushes the target (Punch) whether `damage_with_context` succeeded or not.
Vanilla only pushes after a successful hurt. Also the push does not mark `velocity_dirty`, so players
get it late or not at all.
- **Fixed in the fork for 1.8 mode only** (the BedWars server); vanilla mode left unchanged so far.

### 1.6 Arrow damage passes the shooter as `source` and no `cause` (open, note)
`target.damage_with_context(target, damage, ARROW, Some(hit_pos), owner_entity, None)`. In vanilla
terms the arrow is the direct entity and the shooter the causing entity. Plugins see the shooter as
`damager-id` (convenient), but knockback direction is computed from the shooter's position. 1.8 did that
too; 26.x uses the projectile. Worth a look for vanilla parity.

### 1.7 Melee attack speed ignores the attribute (open)
`Player::attack` uses `base_attack_speed = 4.0` plus the held item's modifier instead of the player's
`ATTACK_SPEED` attribute, so plugins cannot change the cooldown via the attribute (the classic way to
disable it, as OldCombatMechanics does).
- **Worked around** in the fork's 1.8 mode (no cooldown at all, attribute set to 40 for the client UI).

### 1.8 Climbing is never detected server side (open)
`LivingEntity::check_climbing` is a commented-out TODO that always sets `climbing = false`. Anything that
depends on it (critical hit rules, fall-damage reset, death messages "fell off a ladder") is wrong for players.
- **Worked around** in 1.8 mode with a direct `minecraft:climbable` tag check at the feet.

### 1.9 No server-side melee reach check (open, note)
`handle_interact` accepts attacks on any entity id in the world, at any distance. Fine for a LAN, but
vanilla rejects hits beyond the interaction range.

### 1.10 RCON was removed (open, feature request)
RCON was replaced by the server management protocol (`34a85ae94`, 2026-10-05). MSMP cannot run arbitrary
commands, so admin tools, `rcon-cli`-style scripts and automated tests lost their command channel.
- **Restored in the fork** next to MSMP (`feat(net): restore rcon next to the management protocol`).

### 1.11 Older clients cannot join any more although the multiversion plugin advertises it (open)
PR #3249 (2026-09-27) removed admitting clients below `LOWEST_SUPPORTED_MC_VERSION` (26.3) when a packet
plugin is present. `pumpkin-java-multiversion` (README: "1.7.2 - 26.2") therefore cannot work on master;
the rework is in open PR #3819. Its chunk translation is also `#[cfg(not(target_family = "wasm"))]`,
so it is not part of the Wasm build at all.
- **Worked around**: players join with 26.3; 1.8 PvP is emulated server side; bots use ViaProxy.

### 1.12 Block reads in unloaded chunks return air, writes are lost (upstream candidate)
`World::get_block_state_id` is `get_block_state_id_if_loaded(..).unwrap_or(AIR)`. Vanilla loads the
chunk on a block read. A plugin that inspects or edits an area without players nearby (BedWars: finding
the beds at game start, removing placed blocks at the reset) silently sees air and its writes vanish.
- Repro: Mansion arena whose lobby is 380 blocks from the beds: "no bed found" at start, no shops, no drops.
- **Worked around** with the new plugin API `world.set-chunks-forced` / `world.is-chunk-loaded`; the
  plugin forces the arena chunks at load and waits for them before a round starts. The console
  `forceload` command cannot help for plugin-created worlds: they all use the dimension name
  `minecraft:overworld`, so commands cannot target them.

### 1.13 `default_difficulty` in `pumpkin.toml` is never applied (upstream candidate)
The value is only read by the management protocol status. The difficulty comes from the world's
`level.dat`; the Rush map was saved as *peaceful*, which turns on the peaceful regeneration (1 HP/s)
and reads like a broken regen rate.
- **Worked around**: the plugin runs `difficulty normal` on load.

### 1.14 `execute if block` does not accept block tags (open)
`execute if block -79 82 -84 #minecraft:beds run ...` fails with `Unknown block type 'minecraft:'`.
Vanilla accepts tags in block predicates.

### 1.15 `/forceload` does not load chunks (upstream candidate)
The command only inserts into `World::forced_chunks` and calls `update_active_chunks`, which marks
chunks as simulated. No load ticket is added (`chunk_loading.add_force_ticket`, as the gametest manager
does), so a forced chunk without players nearby is never loaded and stays unreadable (see 1.12).
- Found through the new plugin API, which **in the fork** adds the force tickets. The command itself is unchanged.

### 1.16 After a server teleport the chunk view moves only with the next client position packet (upstream candidate)
`Player::request_teleport` sets the position but leaves `chunker::update_position` to
`handle_position`. A client that stands still after the teleport (respawn at a team spawn, `/tp`)
gets no chunks until its next position packet (a real client sends one at the latest every 20 ticks,
a bot possibly never) and can fall into the void meanwhile. Vanilla `ServerPlayer.teleportTo` moves the
chunk map immediately.
- **Fixed in the fork** (`fix(player): move the chunk view when the server teleports a player`).

### 1.17 A confirm for a superseded teleport kicks the client (upstream candidate)
Two teleports in quick succession (e.g. world change plus a plugin teleport) and the client confirms
the first id: Pumpkin kicks with "Wrong teleport id". Vanilla `handleAcceptTeleportPacket` ignores ids
other than the current one.
- **Fixed in the fork** (`fix(net): ignore confirms of superseded teleports like vanilla`). This was
  also the cause of 2.8 (teleporting in the join handler); the 10-tick join delay stays as a precaution.

### 1.18 Console commands always act in the first world (note)
Console/RCON commands run in the first world, and plugin-created worlds share the dimension name
`minecraft:overworld`, so `execute in` cannot select them. Console `tp <player> x y z` moves a player
in a map world into the main world (a `respawn` packet). `execute as <player> at @s run ...` works.

### 1.30 `execute if|unless entity/block/loaded/dimension/biome/blocks/data` need a `run` (fixed in fork, 47b2d225f)
Only the `score` conditions were complete commands. Vanilla `ExecuteCommand.addConditional` makes every condition
terminal; `execute if entity <selector>` then answers "Test passed, count: N" and returns N, which datapacks and
admin scripts use to count entities. In Pumpkin it failed with "Unknown or incomplete command". Fixed with a parse
test for every condition.

### 1.29 Text components with style flags read from NBT become empty (fixed in fork, 0abc16378)
`TextComponent::from_nbt` converts NBT to JSON and deserializes with serde; NBT stores booleans as bytes
(`bold: 1b`), serde rejects them and `from_nbt` falls back to `TextComponent::empty()`. So every styled name
coming from the client (anvil renames, creative inventory, lore) arrived empty. Bytes of the boolean style fields
are now read as booleans.

### 1.28 Custom item names are sent without any style (fixed in fork, 0abc16378)
`DataComponentCodec for CustomNameImpl` wrote `name.get_text()` as a plain NBT string, so colours, bold and
`italic: false` were dropped: every plugin or command item name showed up white and italic on the client.
`LoreImpl` right next to it encodes the full component; CustomName now does the same (round-trip test).

### 1.27 RCON sends one packet per output line (fixed in fork)
The (restored) RCON handler wrote every output line as its own response packet. Vanilla `RconClient` sends the
whole output as one response (lines joined with `\n`, split only into 4096-byte fragments). Clients that read one
response per command (most RCON libraries) then get the remaining lines as the answer to their next commands:
in our tests `data get entity X` returned the second line of an earlier `/bw list`. Fixed, with unit tests for
the fragmenting.

### 1.26 The client never gets the 0 health update when a player dies (fixed in fork, e8523d51d)
`Player::handle_killed` marked the Java client as not loaded *before* calling `send_health()`, and `send_health`
(and the per-tick `tick_health`) skip clients that have not loaded. Every death therefore reached the client only
as `CombatDeath` (death screen), the health packet with 0 never came (it showed up only with the respawn). Clients
and bots that react to health (mineflayer's `death` event, health bar, mods) missed deaths; our void kill looked
like it did nothing. Now health is sent first.

### 1.25 Projectiles do not inherit the shooter's movement (fixed in fork)
Vanilla `Projectile.shootFromRotation` (bow, snowball, egg, ender pearl, XP bottle, potions, wind charge, trident)
adds `shooter.getKnownMovement()` (horizontal always, vertical only when airborne). Pumpkin added nothing, so
arrows shot while sprinting flew like standing shots. Fixed for all of these; the crossbow correctly stays without
it (`CrossbowItem.shootProjectile` uses `shoot`). With `[pvp.legacy_combat]` nothing is inherited, as in 1.8.
Proven by `tests/specs/41-bow-control.test.js` (legacy combat off: sprint shots inherit about 1.0x the movement).

### 1.24 Arrow flight runs one tick behind the client (fixed in fork, e9b727589)
`ArrowEntity::tick` applied gravity and inertia before moving. Vanilla (1.8 `EntityArrow.onUpdate` and modern
`AbstractArrow.tick`) ray traces and moves with the current motion first, then `*0.99`, then `-0.05`. With
Pumpkin's order the arrow drops 0.05 blocks on its first tick, lags about one tick (3 blocks at full draw) behind
the trajectory the client simulates, and sits as low as a vanilla arrow 3 blocks further on. Players see a hit on
their screen that the server misses. Damage was also taken from the already slowed motion.
- Measured by `tests/specs/40-bow.test.js` ("the server arrow flies the 1.8 path"): old binary -0.05 blocks on
  every shot, fixed binary 0.000. Unit test `flight_matches_1_8_order`.
- Cross-checked against a real vanilla 1.8.9 server with 128 identical shots (`reports/bow-1.8.9-vs-pumpkin.md`,
  scripts in `tests/compare/`): level full-draw shots landed 24.20 blocks away on 1.8.9 and 21.04 (-13 %) on
  Pumpkin, one tick earlier; with the fix 24.03. Launch speed, spread, spawn offset were already identical.

### 1.41 Players who join later cannot see the players already online (fixed in fork) — important
`Server::add_player` puts the player into `world.players` before `World::spawn_java_player` sends it the tab
list of the players already online. The entity tracker (tick thread) sees the new viewer as soon as its spawn
chunk is sent and spawns the existing players' entities to it in between. A vanilla client drops a player
entity whose `PlayerInfo` it does not know ("Server attempted to add player prior to sending player info"), so
the new player does not see the earlier players until they leave and re-enter tracking range. Measured packet
order for the second joiner: `spawn_entity(player A)`, then `player_info(A)`. Now a Java player only becomes a
tracker viewer after its tab list was enqueued (`Player::tab_list_sent`), like vanilla
`PlayerList.placeNewPlayer`. Found by the full-game test (a bot could not attack an enemy next to it).

### 1.39 `execute if block <pos> #tag` is rejected (fixed in fork)
`execute if|unless block` parsed a plain block (`BlockArgumentType`), so tags failed with "Unknown block type
'minecraft:'" (`#minecraft:beds`). Vanilla takes a `block_predicate`; Pumpkin already had one (used by
`fill ... replace`). States in the predicate are still ignored by `BlockPredicate::test` (open).

### 1.40 Explosion events had entity id 0 and no world (fixed in fork, 0be45bfe0)
`World::run_explosion` fired `EntityExplodeEvent` with entity id 0 for every explosion, and the event has no
world, so a plugin could not tell whose explosion it is or where (Bukkit's `EntityExplodeEvent` has both). TNT,
creepers, end crystals, TNT minecarts, fireballs and the wither now pass their id (`World::explode_from`), and
the WIT record got `world-name`.

### 1.38 Selector `name="two words"` is rejected (fixed in fork)
The `name` option was read with `read_unquoted_string`, so `@e[name="Mobiler Shop"]` failed with "Expected end
of options" and names with spaces could not be selected at all. Vanilla uses `readString()` (quoted or not).

### 1.36 `/item` only knows `replace ... with` (open)
`item replace <target> <slot> from <source> <slot> [<modifier>]` and `item modify` are missing ("Incorrect
argument for command"). Not needed by BedWars; tests use the plugin's `/bw cheat give`.

### 1.37 A test bot timed out right after joining once (not reproduced)
One of five bots in 60-special-items got `disconnect.timeout` 30 s after joining (no chat received, keepalives
apparently not answered), in the run right after the health change of 1.35. Not reproduced in the next runs;
watched in the full regression run.

### 1.35 No health update until the client reports `player_loaded` (fixed in fork for Java)
`send_health` and the per-tick `tick_health` return early while `!has_client_loaded()`. After a respawn the
Java client gets no health packet until it sends `player_loaded` or the 60 tick timeout runs out. Clients that
report `player_loaded` once they see their health (mineflayer, and so every test bot) could not use items or
blocks for 3 s after respawning. Vanilla `ServerPlayer.doTick` syncs health independently of that state.
Java now always gets it; Bedrock keeps the gate.

### 1.34 Passengers of a player do not move with it; no generic rideTick (partly fixed in fork)
Pumpkin has no vanilla `Entity.rideTick` / `positionRider`: only minecarts place their passengers. A mob riding a
player (`add-passenger`, BedWars parachute chicken) keeps its own physics and is left behind in the air, while
the client draws it on the player's head; server-side checks (arrow hits, distance) see it somewhere else.
Fixed for riders of a player (sit at the top of the hitbox, no own motion). Other vehicles without their own
positioning code (horses, pigs, striders, ...) still need a generic `positionRider` (open).

### 1.33 Potion contents are saved with a numeric potion id (fixed in fork, 7c48b12e0)
`PotionContentsImpl::write_data` wrote `potion: 24` instead of vanilla's `potion: "minecraft:healing"`, so saved
player data / chests and `data get` differ from vanilla (and break when the registry order changes). Now the
registry name; reading accepts both.

### 1.32 Styled item names and lore are lost in commands and in saved data (fixed in fork, 26af7811f)
`CustomNameImpl` / `LoreImpl::read_data` only accepted plain NBT strings, `write_data` wrote `get_text()`. So
`give @p brick[custom_name={text:"Bronze",color:"dark_red"}]` failed with "Malformed 'minecraft:custom_name'
component", and every styled name or lore line lost its colours when a player or chest was saved. Both now read
and write full text components (compact string when unstyled). `consumable` also rejected vanilla shorthands
(`consume_seconds` as int, missing fields with defaults). The earlier note 1.20 ("give ignores components") was
this: components are parsed, but these `read_data` were too strict.

### 1.31 Stuck arrows sit 0.05 too high and can be picked up at once (fixed in fork)
On a block hit the arrow is pulled back by 0.05 on every axis (`signum`), so a flat shot hovers 0.05 above the
floor. 1.8 pulls it back 0.05 along its normalized motion (stuck height 0.007 on 1.8.9). Correction (25.10.): 26.3
`AbstractArrow.onHitBlock` uses `signum` per axis too, so this is 1.8 behaviour, not a vanilla bug; the fork now
does it only with legacy combat (`feat(combat): 1.8 arrows stop along their motion when they stick`). And
`on_player_collision` ignored `shake_time`, so an arrow landing next to a player was picked up immediately
instead of after the 7 shake ticks (vanilla `playerTouch`, also 1.8), a real vanilla bug. Both found by the 1.8.9
comparison.
- The trident has its own copy of the same order (open, not used by BedWars). Thrown items (`projectile/mod.rs`)
  apply gravity first, which matches modern `ThrowableProjectile` (1.21.2+), so they are left alone.

### 1.23 Arrows send a velocity packet every tick and spawn trail particles server-side (fixed in fork)
On top of the entity tracker (which already syncs arrows every `updateInterval` = 20 ticks, like vanilla
`ServerEntity`), `ArrowEntity::tick` broadcast `CEntityVelocity` every tick and spawned crit, bubble and flame
particles. In vanilla the client draws those trails itself (`ServerLevel.addParticle` is a no-op), so Pumpkin
players see a second crit trail lagging behind the arrow at the server position, plus about 5 extra packets per
arrow per tick. `projectile/mod.rs` (snowball, egg, pearl) still broadcasts velocity every tick (open).

### 1.22 Projectiles never hit players (fixed in fork, fb561ddfc)
Arrows, thrown items, tridents, fishing hooks and evoker fangs search for targets with
`World::get_entities_at_box`, which by its own doc comment returns only non-player entities. So no projectile could
hit a player (splash potions, fireworks and shulker bullets add the players by hand and work). Switched to
`get_all_at_box`. Vanilla `canHitEntity` also excludes spectators, which Pumpkin did not check; added.

### 1.21 1.8 attack distance not enforced in legacy combat (fixed in fork)
1.8 `NetHandlerPlayServer.processUseEntity` ignores attacks from 6 blocks (feet to feet) or more; the legacy
combat path now does the same.

### 1.20 `give` does not parse item components (see 1.32)
`give <player> minecraft:wooden_sword[consumable={...}]` gives nothing (no error either). Vanilla
accepts component syntax in item arguments. Worked around with the plugin command `/bw give`.

### 1.19 `gamerule` does not accept namespaced rule names (open)
`gamerule minecraft:show_advancement_messages` is rejected; `gamerule show_advancement_messages` works.

Entries 1.42 to 1.56 and 2.15 to 2.17 come from playtest 1 (25.10.2026, `PLAYTEST-1.md`) and the fix round after it.

### 1.42 A client move that races a server teleport undoes it for everyone else (fixed in fork, ffdf03479) (important)
After the round-start teleport, each player still saw the other in the lobby until both had respawned. The client
keeps sending moves until it has applied the teleport; Pumpkin applied those stale moves after the teleport and
broadcast the old position, so viewers were stuck on it (the player itself was fine). The fix sets the awaited
teleport under the same lock the move handler checks, drops moves until the confirm, and the move handlers share
one `apply_client_move` / `broadcast_move` path. Spec 98-net-sync.

### 1.43 Opening a screen over another one sends a close packet first (fixed in fork, c04dcbe33)
Every page switch in a chest GUI re-centred the mouse, because the client got a close and then an open. Paper
just sends the new open. Correction (25.10.): vanilla 26.3 `ServerPlayer.openMenu` does call `closeContainer()`,
which sends the close packet first, so the fork follows Paper here, not vanilla.

### 1.44 Item component hashes differ from vanilla `HashOps` (fixed in fork, c52ccc6a1, 8ad1d6a92) (important)
26.x clients send a hash of each clicked slot; when it does not match the server's own hash the server resends
the slot. Pumpkin's hashes differed for most components, so every click caused a resend and items "snapped"
back for a few frames. Also, stacks compared unequal when one carried explicit default entries in its patch, so
dropped items sometimes did not stack. Both now follow vanilla. Upstream candidate.

### 1.45 Consumable `has_consume_particles` defaults to false when read from NBT (fixed in fork, 5a79bc374)
Vanilla's default is true. Found while checking the hashes in 1.44.

### 1.46 Projectiles hit what rides with their owner (fixed in fork, 609731185)
Shooting from the parachute (a chicken the player rides) hit the chicken. Vanilla `canHitEntity` skips the
owner's whole vehicle tree until the projectile has left it.

### 1.47 No hit sound for the shooter when an arrow hits a player (fixed in fork, 4afe091f2)
Vanilla sends game event 6 (arrow hit player) to the shooter. Pumpkin sent nothing, and played the hit sound for
hits that did not hurt either.

### 1.48 Arrows that cost no ammo can be picked up (fixed in fork, c10939956)
Infinity, creative and extra Multishot arrows must be `CREATIVE_ONLY`. A stuck arrow that falls again also has to
restart its despawn timer. Upstream candidate.

### 1.49 Entity push sends a velocity packet to players (fixed in fork, 5e85b03c1)
Walking into a player or a villager felt like a punch. Vanilla moves the pushed entity but marks only non-player
entities for a velocity sync; the player client computes its own push. Upstream candidate.

### 1.50 Legacy knockback stacked over hits (fixed in fork, b5caa45ae)
The 1.8 knockback used the motion the client reported, which still contained the last knockback, so a few
hits in a row sent the victim flying. 1.8 starts from the server's own copy of the motion. Fork-only code (legacy
combat), not upstream.

### 1.51 Arrow start position (decision, 10d8d7edc)
1.8 starts arrows 0.16 to the right of the eye; on a 26.x client this looks wrong because the crosshair is in the
centre. The arrow now starts on the look ray (0.1 below the eye) and keeps the 1.8 flight.

### 1.52 A cancelled move is undone to the cancelled target, not to where the player was (fixed in fork, f72b179bf)
When a plugin cancels a move, the player is teleported back. Pumpkin sent the right position but, once the
client confirmed, set the player to the target of the cancelled move. Found by the regression run after 1.42. Upstream candidate.
`handle_position_rotation` called `force_tp(player, position)` with the target the event
cancelled. `force_tp` stored it as the awaited teleport but sent the client the old position, and
`handle_confirm_teleport` then set the server position to the awaited one. The client stayed back while pickup,
hits, the chunk view and the viewers used the refused position. The position-only packet already did it right.
No unit test: the move handlers need a `JavaClient` the crate has no test support for, and the plugin never
cancels moves, so the specs do not reach it either.

### 1.53 A jump is detected from steps up instead of leaving the ground (fixed in fork, 695a67bfa)
Moves with rotation counted any step up as a jump, which gave arrows and 1.8 knockback the jump motion while
walking up stairs or slabs. Vanilla counts a jump when the player leaves the ground moving up.

### 1.54 Rayon wakes all idle workers for tiny per-tick loops (fixed in fork, 2687c468c, 423261c98, 9958b6d6a) (important for hosting)
`par_iter` over three worlds, two players, natural spawning in batches of 8 chunks and the entity islands woke
the 16 idle Rayon workers every tick; each woken worker spun in `sched_yield` and the crossbeam steal code for
longer than the work took (about 0.5 ms per tick). With the plugin and 2 idle players the server used 7.6 % of
a core, with `RAYON_NUM_THREADS=1` 2.0 %. Small worlds and short loops now run on the calling thread, and
entity islands and spawning only go parallel after a tick in which they took 1 ms or more.
Measured (one core = 100 %): lobby with 2 players 7.95 % to 1.47 %, 1v1 round with walking players 14.8 % to
4.4 %, without the plugin and with mob spawning 4.9 % to 0.9 %. Upstream candidate (the same applies to any
small server on a many-core host).

### 1.55 Chunk maps hash with SipHash (fixed in fork, 09ae9a071)
The default hasher on `loaded_chunks` and the other chunk-position maps was the biggest item of the idle tick
thread (about 20 %). Fx hashing is enough for chunk coordinates. Upstream candidate.

### 1.56 Freed Wasm compile memory stays in the heap (fixed in fork, 6e06cc478)
Compiling the plugin with a cold `plugins/cache` (the first start after a plugin update) leaves about 110 MiB of
freed Cranelift buffers in glibc's arenas: 361 MiB RSS after a cold start, about 240 MiB with a warm cache. The
server now calls `malloc_trim(0)` once the plugins are loaded (cold start 361 to 243 MiB). It was held back at
first because binaries with it froze at round start now and then; that was the race in 2.15 with shifted timing.
With 2.15 fixed, 40 of 40 round starts went through.

---

## 2. Bugs in the Wasm plugin host / API

### 2.15 A blocking host call can deadlock the plugin store and the tick (fixed in fork, 3ba2704bf) (important)
`StoreHandle::pump_blocking` spawned the blocking operation first and registered the reentry scope after it. If
the operation fired an event right away (here `closeMenu` at round start: `close_handled_screen` fires
`InventoryCloseEvent`), the callback found no scope, queued behind the guest call that was waiting for this very
operation and kept the root admission. The next `PlayerMoveEvent` on the tick thread then waited for the
admission too, and the whole server stopped. It happened in about 1 of 15 round starts once timing shifted (with
`malloc_trim`, see 1.56). The scope is now registered before the operation starts; the reentry test has a
slow-spawner variant that hangs without the fix. Upstream candidate.

### 2.16 The v0.1 event dispatch re-types the export on every event (fixed in fork, 2127db5d7)
`handle-event` was type-checked against the whole event variant for every call, about 12 % of the samples in a
round. It is typed once per handler now.

### 2.17 Non-blocking event handlers block their caller anyway (changed in fork)
`fire_dyn` awaits non-blocking handlers like blocking ones, so a "non-blocking" Wasm handler for
`PlayerMoveEvent` still held the tick thread for one guest call per move packet (60 to 115 µs each). A
non-blocking v0.1 handler cannot change the event, so its guest call now runs as its own task. The plugin
registers `player-move-event` non-blocking (it only reacts to moves). Commit e75892e8c.

### 2.14 No way to keep item entities from merging (added in fork, 02ba7feb4)
BedWars spawners need one entity per drop (ScreamingBedWars `spawner-disable-merge`). The `item-merge-event`
exists, but cancelling it per pair costs one Wasm call per merge candidate pair and grows quadratically with the
pile. `drop-item` now takes `can-merge: bool`, backed by an `ItemEntity` flag checked in `is_mergeable`.

### 2.1 Every sound call traps and kills the plugin (upstream candidate)
`player.play-sound`, `player.play-sound-at` and `world.play-sound` (v0.1 and v0.2 hosts) resolve the
WIT enum with `format!("{sound:?}").to_lowercase().replace('_', ".")`. `Debug` gives `UiButtonClick`,
so the lookup is `uibuttonclick` and never matches; the host returns an error, i.e. a trap.
- **Fixed in the fork** (`fix(plugin): resolve WIT sounds by name ...`, shared helper with a test).

### 2.2 A host trap disables the whole plugin instance (open, design)
Any `wasmtime::Error` from an import (unknown sound, invalid enum, ...) stops the store driver
("Wasm plugin store driver stopped"). Every later event/task of that plugin fails. For a game plugin
this means one bad sound name ends the round for everybody. Recoverable failures should be `result<>`s
or at least not poison the store.

### 2.3 Calling a non-`store` import that fires an event freezes the server (upstream candidate)
Host functions that may fire plugin events must run through `pump_blocking` (`async | store` in
`bindings.rs`) so the event can reenter the plugin. A plain sync import that fires an event the plugin
listens to (here: closing a screen fires `InventoryCloseEvent`) blocks forever: the tick thread waits for
the plugin store, which is busy with the call that triggered the event. The server stops ticking,
clients time out, no error is logged.
- Found with the new `player.close-screen`. Worth auditing the existing sync imports for event side
  effects, and a debug assertion/timeout with a log line would turn the silent freeze into a bug report.
- **Fixed in the fork** for `close-screen`.

### 2.4 `u64` arrives in QuickJS as a JS number: UUIDs lose precision (open)
componentize-qjs maps WIT `u64` to `number` (53-bit). The `uuid` record (two `u64`) cannot round trip,
so `server.get-player-by-uuid(player.get-id())` returns nothing.
- **Worked around**: player names are the ids (`get-player-by-name`). Suggestion: a `string` UUID in the WIT, or BigInt in the runtime.

### 2.5 TypeScript typings say `bigint`, the runtime wants `number` (open, pumpkin-api-ts)
`jco guest-types` declares `u64` as `bigint`; `pumpkin-api-ts`' `scheduleDelayedTask` passes
`BigInt(...)`, which componentize-qjs rejects with a trap
(`expected number: FromJs { from: "big_int", to: "f64" }`). The official example's scheduler calls
therefore crash the plugin.
- **Worked around** in the vendored helper (`u64()` cast).

### 2.6 `pumpkin-api-ts` build script passes `worldName` (open, small)
`src/build.js` calls `componentize({ worldName: 'plugin', ... })`; the option is `world`. Harmless today
(single world) but silently ignored.

### 2.7 Resource ownership is easy to get wrong and badly documented (open, docs + API)
- Resources in event records (e.g. `player-join-event-data.player`) go back to the host when the handler
  returns; keeping them leads to "resource ownership has already been transferred" later.
- Many functions take resources by ownership where a borrow would do: `player.teleport(..., world)`,
  `player.teleport-world(world, ...)`, `boss-bar.add-player(player)`, `player.hide-player(other)`,
  `entity.add-passenger(entity)`, `gui.set-item(item)`, `player.open-gui(gui)`. Passing a cached handle
  consumes it.
- During `player-join-event`, `get-player-by-uuid` / `get-player-by-name` do not find the joining player yet.
- **Worked around** with an adapter that keeps its own handles and looks up fresh ones for arguments.
  Suggestion: `borrow<>` for these parameters, and a "resource lifetimes" page in the plugin docs.

### 2.8 Teleporting during `player-join-event` kicks the client (open)
A teleport from the join handler, before the client confirmed its first position, ends with the client
being kicked for "Wrong teleport id". Use the spawn-location event or wait a few ticks.
- **Worked around**: joins are processed 10 ticks later.

### 2.9 Command permissions: an empty permission locks the command (open, docs)
`registerCommand(cmd, handler)` with the TS helper's default permission `""` registers the node
`<plugin>:` that nobody has. Players get "Unknown or incomplete command" with no hint. Plugin commands
need a registered permission (`ctx.register-permission`, default `allow`).

### 2.10 Missing plugin APIs (added in the fork, upstream candidates)
- `world.drop-item(pos, item, velocity, pickup-delay)`: there was no way to drop an item stack (resource spawners).
- `world.get-entity-by-id(id)`: events only carry entity ids.
- `server.run-command(cmd) -> list<string>`: console command with captured output.
- `world.explode-filtered(pos, power, breakable, damage, exempt)`: vanilla explosion that only destroys
  listed blocks (BedWars: only player-placed blocks; vanilla blast resistance kept).
- `player.close-screen()`, `player.sync-inventory()`.
- `gui.share()`: `open-gui` consumes the GUI, so one inventory could not be shown to several players (team chest).

### 2.11 Event data gaps (open)
- `entity-explode-event` has no block list and `entity-id` is always `0` for `world.explode`.
- `block-explode-event` fires once for the centre only; no per-block filtering.
- `entity-regain-health-event` has no reason (natural / potion / golden apple cannot be told apart).
- `player-interact-event` has no hand, item or clicked face.
- `player-respawn-event` is read only; only `player-spawn-location-event` can move the respawn.

### 2.12 Item data components only as raw network bytes (open, docs + API)
`item-stack.set-component(component, list<u8>)` expects the network codec format, which is not
documented; plugin authors have to read `pumpkin-protocol/src/codec/data_component.rs`. Needed here for
`damage`, `dyed-color`, `potion-contents` (needs the numeric potion registry id), `consumable`,
`attack-range`. Typed setters for the common components would help a lot.

### 2.13 Item names are italic unless you turn it off (docs)
`set-custom-name` / `set-lore` with `from-legacy-string` render italic (vanilla custom name style);
call `italic(false)`. There is also no way to get a legacy string back from a `text-component` (only JSON).

---

## 4. Open upstream PRs (checked 25.10.2026)

All 300 open PRs of Pumpkin-MC/Pumpkin were read by title, the ones that touch BedWars or our fixes in full.
The decompiled vanilla 26.3 server (`reference/vanilla-26.3/src`, Vineflower) was the reference.

### 4.1 Same bug as one of our fixes

| PR | Our fix | Result of the comparison | What the fork has now |
|---|---|---|---|
| #4308 zero LpVector3d | 98d81920a (1.1) | practically identical, found independently | ours |
| #4162 reentry scope before a blocking call | 3ba2704bf (2.15) | practically identical | ours |
| #3811 styled custom item names | 0abc16378 (1.28) | same approach; its test compares against bytes from the vanilla codec | ours plus its test (2e5cee16b) |
| #4099 no server-side crit particles | e9b727589 (1.23) | both right; ours also drops the bubble and flame trails, theirs is a clean single change | ours |
| #3708 player info before entity tracking | e5bde6dce (1.41) | theirs rebuilds the vanilla join order but bundles a second fix; ours is a guard in the tracker | ours |
| #3476 player's own motion on push | 5e85b03c1 (1.49) | theirs follows vanilla `needsSync` / `syncVelocity`, ours only guarded the push | theirs, ported (beacf7811) |
| #3466 wrong teleport id | 05914b3d4 | theirs also serializes id, awaited teleport and packet | its lock idea, without the queue (b35f86f09) |
| #3835 projectile owner and leftOwner | fb561ddfc, 609731185 (1.46) | ours checks the whole vehicle tree like vanilla; theirs uses `leftOwner` for the owner where we kept a 5 tick rule | both (813765056; 1.8 combat keeps the 5 ticks) |

#3717 looked related but is a different bug (entity names from NBT, not item names).

### 4.2 Taken into the fork because they matter for BedWars

| PR | Why | Commit |
|---|---|---|
| #4118 throw loop | Ctrl+Q on a slot that hands out nothing looped forever on the tick thread | 38e722579 |
| #3307 drop event from open screens | items dragged out of the inventory skipped `PlayerDropItemEvent` (the lobby rule "no dropping" could be bypassed); merged with #4118 | 29c71765d |
| #3432 tab list across worlds (part) | vanilla keeps the player list server-wide; Mushroom and Mansion are their own worlds. The tracker part of the PR is already in master | 7442f5c1b |
| #3995 Rayon panic handler | a panic on a Rayon worker aborted the whole server mid-round | 032c09b4c |
| #3351 last block of a stack | placing the last block played the tool break sound and particles | b79a4259e |
| #4149 command suggestions | tab completion of plugin commands from the console panicked outside Tokio | afa2de3a5 |

### 4.3 Read and left out

- #4054 dropped item stacking: rewrites item movement and merging, touches the no-merge flag (2.14); too broad.
- #3243 memory kept after a disconnect: real, but on the old crate layout; not critical for a LAN.
- #4058 validate block breaking: anti-cheat, not needed among friends.
- #3221 death sound: our fork already plays it on death; its branch has unresolved conflict markers.
- #3460 item friction: already in master.
- #4119 shift-click dupe: only crafting table and mount screens; player inventory and chests are fine in the fork.
- #4120 armor durability, #4112 explosion knockback resistance, #4080 friendly fire, #3853 void hurt cooldown, #4068
  container reach, #3666 damaged stacking: vanilla parity, but no effect on BedWars (the plugin handles teams and void).
- Shield PRs (#3525, #3544, #3637): BedWars uses 1.8 sword blocking.

---

## 3. Toolchain and developer experience

- **Plugin files**: Wasm plugins get file access only via WASI preopens; QuickJS has no `fs`, so a
  TypeScript plugin cannot read its own config at runtime. Configs are bundled into the Wasm at build
  time here. A small "plugin config" API (or docs on how TS plugins should do it) would help.
- **Build times**: `release` uses fat LTO; a thin-LTO profile builds the full server in about 5.5 min on 12 cores.
- **Docker**: the official image only downloads release binaries; there is no image/compose for building
  a fork. `rust-toolchain.toml` (`channel = "stable"` + components) makes the `rust` image auto-install a
  second toolchain without `rustfmt`.
- **Defaults in a fresh `pumpkin.toml`**: `fun.april_fools = true`, telemetry on, plugin permission
  prompt on (`ask_permission_confirmation`), Bedrock enabled; every start logs
  `ERROR Failed to fetch Bedrock OIDC keys: Public key build failed: builder error` without internet.
- **Testing clients**: mineflayer supports up to 26.1, Pumpkin only accepts 26.3; tests need a version proxy.
- Tool bugs outside Pumpkin (mineflayer, componentize-qjs, pumpkin-api-ts) are in `TOOLCHAIN-FINDINGS.md`.
- **Parallel work in git worktrees**: copying `target/` per worktree keeps builds incremental when the source is
  always mounted at the same path (`/src`). Never point two source trees at one target dir: cargo decides by file
  mtime, and a source file older than the other tree's artifacts is taken as unchanged (a test passed or failed on
  the wrong tree's build here).
- **Arrow pickups go through the plugin on every tick**: the BedWars plugin cancels every arrow pickup in a round
  (all shop bows have Infinity), and `player-pickup-arrow-event` fires blocking from the entity tick on each tick a
  player touches a pickable stuck arrow. Cheap enough here, but a candidate for a cached per-player flag.
- **Spec flakes**: the bow speed, spawner gap and hologram flakes were the shared Node process (next entry). The
  20-economy despawn check needed more than 40 aged items and sometimes got 29 to 40; it needs 25 now (20 young
  controls plus a few to age out).
- **Open flake, 40-bow "sprint p0 #1"**: with 3 specs at once, the second sprint shot at pitch 0 sometimes leaves at
  2.2 to 2.6 instead of 3.0 blocks per tick, so the server counted 4 to 8 draw ticks fewer than the bot drew. Seen
  twice (before and after the PR merge, with and without the per-process runner), always this shot; it passes alone
  and in every sequential run. Not investigated further.
- **Test harness, specs in parallel**: all specs of a run used to share one Node process. With 2 or 3 at a time
  the bots of one spec lagged the others: both spawners "stalled" at once, holograms skipped a step, arrows lost
  draw ticks, and mineflayer caught up physics ticks in bursts, so a parachute pilot fell faster and landed early.
  The servers ticked on time throughout (economy, bow, melee and special items pass with 3 servers at once when
  each spec has its own process). `run.js` now starts every spec in its own Node process (fixed).
- **Test harness, many servers at once**: `freePort` can hand out the same port twice under heavy parallel load
  (proxy and RCON); the spec fails at start and passes on a rerun. Open, harmless.
- **Console `tp` in tests**: see 1.18; always `execute as <player> at @s run tp ...` for map worlds.
- **Positive**: start in ~20 ms, ~25 MB RAM idle; the event list mirrors Bukkit closely; `AGENTS.md`
  is excellent and made the server code easy to navigate.
