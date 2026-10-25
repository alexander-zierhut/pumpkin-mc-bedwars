# Playtest 1 (25.10.2026, 1v1 between two players, Rush, Pumpkin on port 25566)

Reported after the first real match. Fixed in the round on 25.10.2026; each point has its status below (the
commits are on `lan-bedwars` in `vendor/Pumpkin`, details in `PUMPKIN-FINDINGS.md`). Deployed 25.10. ~06:45 (tip
6e06cc478). Afterwards the matching open upstream PRs were merged with our fixes and the BedWars-relevant ones taken
in (`PUMPKIN-FINDINGS.md` section 4, tip 020a56913, clippy clean); that build is not deployed yet.

## Bugs

1. Round start: each player still sees the other standing in the lobby, no movement updates after the teleport to
   the islands. Visible again only after both died (respawn).
   Status: fixed (Pumpkin, moves that raced the teleport were applied after it; findings 1.42, spec 98).
2. Boss bar "Spiel läuft, viel Glück!" stays for the whole round and never disappears (check the original).
   Status: fixed (plugin). Like ScreamingBedWars the bar runs down with the game time and is blank after the end.
3. Shop: switching tabs resets the mouse cursor to the centre (a new window is opened instead of updating the
   open one).
   Status: fixed (Pumpkin, a new screen no longer sends a close packet first; findings 1.43).
4. Inventory moves are glitchy: items lag or show duplicated for a few frames, then snap to the target slot.
   Status: fixed (Pumpkin, item hashes now match the client's; findings 1.44, spec 98).
5. No hit sound when an arrow hits a player.
   Status: fixed (Pumpkin, the shooter hears the hit ding; findings 1.47, spec 40).
6. Players can't walk through villagers (shopkeepers), they get pushed back. Maybe intended, compare original.
   Status: fixed (Pumpkin; findings 1.49). Since the PR merge like vanilla: motion syncs go to the viewers only, a
   player gets its own motion only from a hit (upstream #3476). The small push that is left comes from the client
   itself, as on vanilla and Paper.
7. Running into another player pushes you back.
   Status: fixed with 6.
8. Dropped items sometimes don't stack (not reproducible, worked on retry). Clients in English, blocks have German
   names.
   Status: fixed. Equal items with default entries compared unequal (Pumpkin, findings 1.44), and building blocks come
   without a German name now (decision below).

## Game rules

9. Parachute (chicken): sneaking should cancel it so you drop normally.
   Status: fixed (plugin, the sneak key closes the parachute).
10. Shooting a bow while on the parachute cancels it; it should not (air support is allowed).
   Status: fixed (Pumpkin, arrows skip the shooter's own vehicle, findings 1.46; plugin, its own arrows never shoot the
   parachute down).
13. Death message the other way round ("X was killed by Y") and with the killer's remaining hearts.
   Status: fixed (plugin): "X wurde von Y getötet! (❤ 6,5)".
15. Arrows from an Infinity bow can be picked up; they should not be and should despawn after a while.
   Status: fixed (Pumpkin, Infinity arrows are creative-only pickups and despawn; findings 1.48). All shop bows have
   Infinity, so no arrow can be picked up in a round.
16. A bow bought in the shop should have full durability.
   Status: fixed (plugin, the shop no longer sets damage on bows).

## Feel

11. Sword fighting: blocking and hits feel exactly like 1.8. Good.
   Status: unchanged on purpose.
12. Melee knockback is off: it seems to stack over hits, one hit sent the other player flying like a rocket.
   Status: fixed (Pumpkin, 1.8 knockback starts from the server's motion, not the client's; findings 1.50). Jumps are
   detected like vanilla now too (1.53).
14. The arrow seems to leave slightly to the right of the crosshair; in 1.8 it left from the crosshair.
   Status: changed, see the decision below (findings 1.51).

## Decisions by the user (25.10.2026, during the fix round)

- Point 14: keep the 1.8 flight, but start the arrow on the look ray like 26.3 (no 0.16 sideways offset).
  Done on lane/combat (legacy_combat::arrow_launch, unit test and 40-bow check updated).
- Point 8: option a, building blocks from the shop (Sandstein, Endstein, Eisenblock, Glas, Glowstone, Kiste,
  Leiter, Spinnennetz) are delivered without a name, so placed and broken blocks stack again; the shop still shows the
  names. Done in plugin/src/shop.ts (UNNAMED_BLOCKS), plugin/test/shop.test.ts and spec 30.

## Performance (profiling during the fix round)

Measured with the plugin, CPU in % of one core over 60 s, old binary and new binary running at the same time on the
same busy host (findings 1.54 to 1.56, 2.16, 2.17).

| Scenario | CPU before | CPU after | RSS |
|---|---|---|---|
| lobby, no players | 7.2 % | 1.1 % | about 180 MiB |
| lobby, 2 idle players | 8.0 % | 1.5 % | about 230 MiB |
| lobby, 8 players | 9.3 % | 1.9 % | about 235 MiB |
| 1v1 round, players standing | 9.8 % | 2.5 % | about 250 MiB |
| 1v1 round, players walking and jumping | 14.8 % | 4.4 % | about 260 MiB |

- Peaks in a round: the 1-second CPU peak went from 23 to 27 % down to 14 to 15 %.
- Ticks: average tick in a round with walking players 2.1 ms to 1.7 ms (50 ms budget).
- Where the time went: idle Rayon workers spinning for tiny per-tick loops (most of it), SipHash in the chunk
  maps, and re-typing the plugin's event export on every event.
- The whole plugin now costs about 0.3 to 0.55 % of a core: the tick task about 140 µs per tick (half of it is
  the fixed cost of calling into Wasm), a player move 60 to 115 µs. Moves no longer block the tick (2.17).
- Memory: about 140 MiB is Pumpkin itself; the 390 MiB seen in the playtest came mostly from compiling the plugin
  with a cold cache (about 110 MiB that glibc kept). The server gives it back after loading the plugins now (1.56):
  2 players in the lobby, 237 MiB and 1.3 % CPU.
- The profiling also turned up a rare freeze at round start (2.15), fixed.
