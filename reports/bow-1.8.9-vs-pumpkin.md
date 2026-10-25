# Bow arrow: real Minecraft 1.8.9 vs patched Pumpkin
Measured 2026-10-24. All numbers below come from `reports/bow-raw-*.json` (every packet the client received, per shot) through `tests/compare/analyze.js`; nothing is typed in by hand.

## Summary

| Metric | Vanilla 1.8.9 | Pumpkin current | Pumpkin fixed | Verdict |
| :--- | --- | --- | --- | --- |
| Launch speed at full draw | 2.9965 | 2.9972 | 3.0046 | within measurement noise (all three) |
| Launch direction vs look direction, spread per axis | 0.0073 | 0.0076 | 0.0076 | identical (Gaussian 0.0075 per axis in all three) |
| Spawn offset from the shooter (right/forward/up) | 0.16 / 0 / 1.52 (1/32 fixed point) | 0.16 / 0 / 1.52 | 0.16 / 0 / 1.52 | identical to the 1.8 formula (sneaking too) |
| Shooter momentum added to the arrow | none | none | none | identical (no momentum) |
| Draw time to speed | speed = 3*(f0^2+2*f0)/3 | same lattice | same lattice | identical formula |
| Landing distance, pitch 0 (eye 1.62 above floor) | 24.20 | 21.04 | 24.03 | -3.17 blocks (-13.1 %); current build: DIFFERENT (model error vs 1.8 order 2.85 blocks, vanilla 0.16); fixed: identical to the 1.8 order within 0.05 blocks |
| Landing distance, pitch +20 | 94.03 | 91.50 | 96.13 | -2.54 blocks (-2.7 %); current build: DIFFERENT (model error vs 1.8 order 4.12 blocks, vanilla 0.06); fixed: identical to the 1.8 order within 0.05 blocks |
| Landing distance, pitch +45 | 114.77 | 111.52 | 114.66 | -3.25 blocks (-2.8 %); current build: DIFFERENT (model error vs 1.8 order 2.73 blocks, vanilla 0.03); fixed: identical to the 1.8 order within 0.06 blocks |
| Flight time pitch 0 (ticks after the spawn tick, from packets) | 8.93 | 7.90 | 8.85 | current build: about 1 tick shorter; fixed: within noise (z=-0.6) |
| Packets for a flying arrow (pitch 0) | 1 velocity packet at spawn + 1 move, 1 landing packet | 11 velocity (one per tick) + move + landing sync | 3 velocity + move + landing sync | DIFFERENT for the current build (see section 9) |

In one sentence: launch (speed, direction, spread, spawn offset, no momentum, draw formula) is identical to 1.8.9. The flight is not: the current Pumpkin arrow applies gravity and drag before it moves, which makes it drop faster and land short (about 13 % at pitch 0, 3 to 4 % at 20 and 45 degrees, see section 7). The fixed build removes that difference (sections 7 and 8).

## Still different after the fix

- Stuck depth: the stopped arrow sits 0.007 above the floor on 1.8.9 and 0.050 on the fixed build (same as before the fix, 0.050). Cosmetic (0.04 blocks); `arrow.rs` moves the arrow back by 0.05 along the sign of each component instead of along the normalized motion.
- Arrows that land within about 2 blocks of the shooter disappear immediately on Pumpkin (6 of 6 current, 6 of 6 fixed shots at pitch -45, destroyed 0.3 ms after the hit) but 450 ms later on 1.8.9 (arrowShake). Likely cause: no `shake_time` check in `on_player_collision`.
- Extra velocity packets: 3 per pitch-0 flight on the fixed build (spawn duplicate, after first tick, zero at landing) against 0 on 1.8.9. Harmless for the trajectory, noted for completeness.
- Draw tick bookkeeping on Pumpkin is sometimes off by one tick for short draws (see section 6); not seen on 1.8.9. Cause not isolated.

## 1. Method

- Reference: the real Mojang `server.jar` of 1.8.9 (sha1 `b58b2ceb36e01bcd8dbf49c8fb66c55a9f0676cd`, downloaded through the version manifest), run with `eclipse-temurin:8-jre`, offline mode, 1 GB container limit, flat world of stone up to y=149 (`generator-settings=3;150*minecraft:stone;1`), peaceful. The bot connects with mineflayer version `1.8.9`. Script: `tests/compare/vanilla.js`.
- Pumpkin: a throwaway copy of `server/` started by `tests/harness/server.js` (BedWars plugin, `[pvp.legacy_combat]` enabled), bots speak 26.1 through ViaProxy to 26.3. Platform of stone at y=149 (81 x 181 blocks) with cleared headroom above the lane; BedWars round running (2 bots), shooter and floor at y=150 on both servers, so the launch is 1.62 above the floor everywhere. Builds: `build/pumpkin sha256 1cb80fe419a46f7c` (current), copy of `build/pumpkin-next` as of 18:50 local time, sha256 04b603a79215c72b (fixed; an earlier pumpkin-next build, sha256 194e7e0d34c670a4, gave the same results in `bow-raw-pumpkin-fixed-build194e.json`).
- Identical input on every server: `tests/compare/collect.js` drives one bot with the same seeded start positions (random sub-block x/z within 8 blocks, y=150), the same look angles and the same number of draw ticks. Each shot: kill old arrows, teleport, set look, hold the bow N client ticks, release, record every packet about the arrow with a timestamp, wait until the arrow has landed (model flight time + 1.5 s), then ask the SERVER for the stuck arrow (`entitydata @e[type=Arrow,c=1] {}` on 1.8.9, `data get entity @n[type=minecraft:arrow] Pos` on Pumpkin). The server value is the landing position; packets alone cannot give it (see section 9: the arrow leaves the client's tracking range at about 64 blocks on both servers).
- Shot set (128 per server): standing pitch 0 x40, pitch -45/-20/+20/+45 x6 each, yaw 37 and -90 at pitch 0 x6 each, sprinting forward pitch 0 x8 and +20 x4, jump (released on the 3rd airborne tick while rising) x8, strafing left x4, sneaking x5, partial draws 4/8/12/16 ticks x5/8/5/5. Full draw = 22 client ticks (needs 20).
- Units: positions in blocks, velocity in blocks/tick. On 1.8.9 the packets carry position/32 and velocity/8000 (truncated, so spawn positions are floored to 1/32 block); 26.1 carries doubles. Look angles are what the client actually sent (`position_look` writes were recorded), the direction vector is computed with the vanilla formula from them. Residual r = v/3 - dir, which is exactly gaussian*0.0075 for a 1.8 launch at full draw.
- Spread statistics use standing, full-draw shots only (n = 76 / 76 / 76; shots whose draw was cut short by tick jitter are excluded: 0 / 0 / 0 excluded).
- Caveats: the Pumpkin bot packets pass through ViaProxy (26.3 to 26.1 translation), so what is reported is what a 26.1 client sees; I did not test ViaProxy on its own; the launch statistics on Pumpkin match the 1.8.9 ones to within noise, which would not happen if it distorted positions or velocities noticeably. Another agent ran a second Pumpkin test server on the same machine during part of the runs, which adds timing jitter (see the draw tick table). Timestamps are wall clock at the bot, resolution 50 ms ticks.

## 2. Launch speed at full draw (standing, all pitches and yaws)

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| launch speed (blocks per tick), mean +- sd | 2.9965 +- 0.0238 (n=76) | 2.9972 +- 0.0235 (n=76) | 3.0046 +- 0.0224 (n=76) |
| min .. max | 2.927 .. 3.063 | 2.945 .. 3.043 | 2.950 .. 3.063 |
| expected (1.8: 3.0 times the length of dir + 0.0075*gauss) | 3.000 +- 0.0225 | 3.000 +- 0.0225 | 3.000 +- 0.0225 |

Verdict: Pumpkin (current build): within noise (z=0.2); Pumpkin fixed (pumpkin-next): within noise (z=2.2). The standard deviation (0.0238 / 0.0235 / 0.0224) equals the theoretical 0.0225, so the spread is applied in the same way. Responsible code: `legacy_combat.rs` `arrow_launch` (ARROW_SPEED 3.0, spread 0.0075), hooked in `bow.rs` line 179 ff.

## 3. Launch direction and spread

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| angle between velocity and look direction, RMS (deg) | 0.569 | 0.602 | 0.612 |
| largest angle (deg) | 1.34 | 1.50 | 1.46 |
| residual x: mean / sd | 0.0003 / 0.0073 | -0.0000 / 0.0069 | 0.0021 / 0.0075 |
| residual y: mean / sd | 0.0007 / 0.0075 | -0.0014 / 0.0078 | 0.0000 / 0.0076 |
| residual z: mean / sd | -0.0014 / 0.0072 | 0.0003 / 0.0080 | 0.0009 / 0.0074 |
| pooled sd of the three axes | 0.0073 | 0.0076 | 0.0076 |
| theory 1.8.9 (setThrowableHeading, inaccuracy 1.0) | sd 0.0075 per axis, mean 0, RMS angle 0.61 | sd 0.0075 per axis, mean 0, RMS angle 0.61 | sd 0.0075 per axis, mean 0, RMS angle 0.61 |

Verdict: identical. Pooled sd ratio to vanilla: 1.00 / 1.03 / 1.03 (95 % interval for n=70 about 0.85 to 1.17); per-axis means are within 2 standard errors of 0 (se about 0.0009) on all servers, i.e. no systematic aim offset. The launch direction is the look direction (yaw/pitch as sent), the arrow is not rotated or biased.

## 4. Spawn position relative to the shooter

Measured in the shooter frame: right = (-cos yaw, 0, -sin yaw), forward = (-sin yaw, 0, cos yaw), up = height above the feet. 1.8.9 formula: right 0.16, forward 0, up 1.62 - 0.1 = 1.52 (sneaking 1.54 - 0.1 = 1.44).

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| right (mean +- sd) | 0.1737 +- 0.0112 (n=99) | 0.1600 +- 0.0000 (n=99) | 0.1600 +- 0.0000 (n=99) |
| forward (mean +- sd) | -0.0159 +- 0.0092 (n=99) | 0.0000 +- 0.0000 (n=99) | 0.0000 +- 0.0000 (n=99) |
| up (mean +- sd) | 1.5000 +- 0.0000 (n=99) | 1.5200 +- 0.0000 (n=99) | 1.5200 +- 0.0000 (n=99) |
| max distance of any spawn position to the 1.8 formula (with 1/32 flooring on 1.8.9) | 0 (exact in every shot) | 0 (exact in every shot) | 0 (exact in every shot) |
| right / forward at yaw 0 | 0.176 / -0.017 | 0.160 / 0.000 | 0.160 / 0.000 |
| right / forward at yaw 37 | 0.182 / -0.001 | 0.160 / 0.000 | 0.160 / 0.000 |
| right / forward at yaw -90 | 0.146 / -0.019 | 0.160 / 0.000 | 0.160 / 0.000 |
| sneaking: up | 1.4375 +- 0.0000 (n=5) | 1.4400 +- 0.0000 (n=5) | 1.4400 +- 0.0000 (n=5) |

Verdict: identical. The 1.8.9 numbers differ from 0.16 / 0 / 1.52 by at most 1/32 = 0.031 only because the 1.8 protocol floors positions to 1/32 block (up 1.500 instead of 1.52 and 1.4375 instead of 1.44 for the same reason; the right/forward means scatter with the shooter's random sub-block position). Every single 1.8.9 spawn position equals floor(formula*32)/32 exactly and every Pumpkin spawn position equals the formula to 1e-8, so the offset formula (eye height, 0.1 down, 0.16 sideways with the yaw dependent sign, sneaking eye height 1.54) is the same. Responsible code: `arrow_launch` and `player_eye_height` in `legacy_combat.rs`.

## 5. Shooter momentum

Residual of the arrow velocity along the shooter's own per-tick movement (r = v/3 - dir, projected on the unit step of the shooter; units of 3 blocks/tick). If the shooter's momentum were added (1.9+ behaviour) the value would be step/3 (shown).

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| sprint p0: shooter step (blocks/tick) / momentum would add | 0.281 / 0.094 | 0.281 / 0.094 | 0.281 / 0.094 |
| sprint p0: measured residual along the step, mean +- se (n) | 0.0033 +- 0.0025 (8) | 0.0039 +- 0.0033 (8) | 0.0018 +- 0.0020 (8) |
| sprint p+20: shooter step (blocks/tick) / momentum would add | 0.281 / 0.094 | 0.281 / 0.094 | 0.281 / 0.094 |
| sprint p+20: measured residual along the step, mean +- se (n) | -0.0005 +- 0.0040 (4) | -0.0026 +- 0.0017 (4) | -0.0021 +- 0.0059 (4) |
| jump p0: shooter step (blocks/tick) / momentum would add | 0.248 / 0.083 | 0.248 / 0.083 | 0.248 / 0.083 |
| jump p0: measured residual along the step, mean +- se (n) | -0.0004 +- 0.0020 (8) | -0.0041 +- 0.0021 (8) | 0.0056 +- 0.0047 (8) |
| strafe-left p0: shooter step (blocks/tick) / momentum would add | 0.216 / 0.072 | 0.216 / 0.072 | 0.216 / 0.072 |
| strafe-left p0: measured residual along the step, mean +- se (n) | -0.0005 +- 0.0026 (4) | -0.0027 +- 0.0025 (4) | -0.0042 +- 0.0030 (4) |
| mean speed: standing / sprint p0 / jump | 2.992 / 3.010 / 3.000 | 2.994 / 3.012 / 2.992 | 3.002 / 3.005 / 3.013 |

Verdict: identical. In every moving scenario the along-step residual is 0 within about 2 standard errors and at least 20 times smaller than the momentum that would be added; arrow speed does not change with sprinting or jumping.

## 6. Draw time to speed

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| 4 ticks held (expected 0.440) | 0.440 +- 0.003 | 0.465 +- 0.053 | 0.438 +- 0.003 |
| 8 ticks held (expected 0.960) | 0.956 +- 0.007 | 0.864 +- 0.225 | 0.963 +- 0.007 |
| 12 ticks held (expected 1.560) | 1.559 +- 0.012 | 1.553 +- 0.012 | 1.594 +- 0.070 |
| 16 ticks held (expected 2.240) | 2.242 +- 0.016 | 2.206 +- 0.153 | 2.134 +- 0.232 |
| 22 ticks held (expected 3.000) | 2.992 +- 0.018 | 2.994 +- 0.025 | 3.002 +- 0.025 |
| 4: shots where the server counted exactly that many ticks (cap 20) / +-1 / worse | 5 / 0 / 0 of 5 | 4 / 1 / 0 of 5 | 5 / 0 / 0 of 5 |
| 8: shots where the server counted exactly that many ticks (cap 20) / +-1 / worse | 8 / 0 / 0 of 8 | 6 / 1 / 1 of 8 | 8 / 0 / 0 of 8 |
| 12: shots where the server counted exactly that many ticks (cap 20) / +-1 / worse | 5 / 0 / 0 of 5 | 5 / 0 / 0 of 5 | 4 / 1 / 0 of 5 |
| 16: shots where the server counted exactly that many ticks (cap 20) / +-1 / worse | 5 / 0 / 0 of 5 | 2 / 3 / 0 of 5 | 4 / 0 / 1 of 5 |
| 22: shots where the server counted exactly that many ticks (cap 20) / +-1 / worse | 40 / 0 / 0 of 40 | 40 / 0 / 0 of 40 | 40 / 0 / 0 of 40 |
| max distance of the derived draw ticks to an integer (formula lattice) | 0.150 ticks | 0.152 ticks | 0.176 ticks |

Verdict: formula identical. Arrow speeds sit on the 1.8 lattice speed(j) = 3*(f0^2+2*f0)/3 with f0 = j/20, capped at j = 20 (the derived tick count is within about 0.2 ticks of an integer on every server, which is what the 0.0225 spread does to the derivation). What differs is only how many ticks the server counted for a given client draw. Shots off by one tick or more: Vanilla 1.8.9 0 of 63, Pumpkin (current build) 6 of 63, Pumpkin fixed (pumpkin-next) 2 of 63. 1.8.9 counted the client's ticks exactly every time; Pumpkin (both builds) is sometimes off by 1 (once by 5 ticks). That looks like tick/network jitter (ViaProxy hop, machine load incl. a second Pumpkin server) and not like a formula difference, but I could not separate those causes; at full draw (22 ticks held, 20 needed) it never matters.

## 7. Landing distance and height (server-side position of the stuck arrow)

Horizontal distance from the shooter's feet to the stuck arrow, full-draw standing shots. The floor is 1.52 below the launch point. The "ideal" row is the no-spread flight computed with the 1.8 order (move, then drag 0.99, then gravity 0.05) and with the Pumpkin order (gravity, then drag, then move) from the exact launch.

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| pitch -20: distance mean +- sd (n) | 4.15 +- 0.06 (n=6) | 3.93 +- 0.18 (n=6) | 4.08 +- 0.08 (n=6) |
| pitch -20: ideal 1.8 order / ideal Pumpkin order | 4.08 / 3.89 | 4.08 / 3.89 | 4.08 / 3.89 |
| pitch 0: distance mean +- sd (n) | 24.20 +- 1.35 (n=40) | 21.04 +- 1.08 (n=40) | 24.03 +- 1.23 (n=40) |
| pitch 0: ideal 1.8 order / ideal Pumpkin order | 24.19 / 21.30 | 24.19 / 21.30 | 24.19 / 21.30 |
| pitch +20: distance mean +- sd (n) | 94.03 +- 2.12 (n=6) | 91.50 +- 2.00 (n=6) | 96.13 +- 1.49 (n=6) |
| pitch +20: ideal 1.8 order / ideal Pumpkin order | 95.09 / 90.96 | 95.09 / 90.96 | 95.09 / 90.96 |
| pitch +45: distance mean +- sd (n) | 114.77 +- 1.02 (n=6) | 111.52 +- 0.57 (n=6) | 114.66 +- 0.54 (n=6) |
| pitch +45: ideal 1.8 order / ideal Pumpkin order | 114.38 / 111.69 | 114.38 / 111.69 | 114.38 / 111.69 |

| Difference to vanilla | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- |
| pitch -20 | -0.22 blocks (-5.3 %), z=-2.9; error vs 1.8 flight model 0.20 (vanilla 0.08) | -0.07 blocks (-1.8 %), z=-1.9; error vs 1.8 flight model 0.05 (vanilla 0.08) |
| pitch 0 | -3.17 blocks (-13.1 %), z=-11.6; error vs 1.8 flight model 2.85 (vanilla 0.16) | -0.17 blocks (-0.7 %), z=-0.6; error vs 1.8 flight model 0.05 (vanilla 0.16) |
| pitch +20 | -2.54 blocks (-2.7 %), z=-2.1; error vs 1.8 flight model 4.12 (vanilla 0.06) | 2.10 blocks (2.2 %), z=2.0; error vs 1.8 flight model 0.05 (vanilla 0.06) |
| pitch +45 | -3.25 blocks (-2.8 %), z=-6.8; error vs 1.8 flight model 2.73 (vanilla 0.03) | -0.11 blocks (-0.1 %), z=-0.2; error vs 1.8 flight model 0.06 (vanilla 0.03) |

The sample means of 6 shots are noisy (sd of the landing distance 1 to 2 blocks from the spread), so the z of the plain difference is weak at +20. The decisive column is the per-shot model error: the recorded launch of each shot is flown through the 1.8 order and compared with where that same arrow really stopped. Vanilla matches to 0.03 to 0.16 blocks, the current Pumpkin misses by 2.7 to 4.1 blocks at 0, +20 and +45, which is far outside the noise.

Pitch -45: the arrow hits the floor 1.5 blocks in front of the shooter in the first tick. On 1.8.9 the shooter picks it up 450 ms later, on Pumpkin the arrow entity is destroyed 0.1 to 0.3 ms after the hit (before the server could be asked), so no landing position exists for Pumpkin; it is left out. Pickup after 7 ticks is the 1.8 rule (`arrowShake`); `ArrowEntity::on_player_collision` (arrow.rs ~line 968) has no check of `shake_time`, which is the likely cause (the shake time is set to 7 in line 782 but never read for pickup).

Landing height of the stuck arrow above the floor (y - 150):

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| mean +- sd | 0.0069 +- 0.0003 (n=52) | 0.0500 +- 0.0000 (n=52) | 0.0500 +- 0.0000 (n=52) |

Verdict: the pitch-0 stuck height is about 0.007 on 1.8.9 (impact point moved 0.05 back along the NORMALIZED motion) and exactly 0.05 on Pumpkin (impact point moved 0.05 back along the SIGN of each motion component, `arrow.rs` lines ~851 to 858). Difference 0.04 blocks, cosmetic; it is also the reason for the remaining 0.05 model error in the fixed build.

### Which flight order explains each server (model check)

The recorded launch (position, velocity from the spawn packet) is replayed through both flight orders and compared with the server's stuck position (horizontal error, mean over full-draw shots):

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| pitch -20: error of the 1.8 order model / of the Pumpkin order model (blocks) | 0.08 / 0.27 | 0.20 / 0.05 | 0.05 / 0.19 |
| pitch 0: error of the 1.8 order model / of the Pumpkin order model (blocks) | 0.16 / 3.05 | 2.85 / 0.05 | 0.05 / 2.86 |
| pitch +20: error of the 1.8 order model / of the Pumpkin order model (blocks) | 0.06 / 4.16 | 4.12 / 0.05 | 0.05 / 4.14 |
| pitch +45: error of the 1.8 order model / of the Pumpkin order model (blocks) | 0.03 / 2.73 | 2.73 / 0.05 | 0.06 / 2.66 |

Reading: on 1.8.9 the 1.8 order reproduces the stuck position to 0.03 to 0.16 blocks (that is the 1/32 position quantization plus the 0.05 stuck offset) and the Pumpkin order is off by 0.3 to 4 blocks. On the current Pumpkin it is the other way round (Pumpkin order within 0.05, 1.8 order 2.5 to 4 blocks off). On the fixed build the 1.8 order explains the landing again (within 0.05 to 0.06). So the whole landing difference comes from the order of operations in the arrow tick, nothing in the launch.

## 8. Flight time

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| pitch -20: ticks from packets (landing packet time / 50 ms, +1 for the spawn tick), mean +- sd | 2.00 +- 0.00 (n=6) | 2.00 +- 0.00 (n=6) | 2.00 +- 0.00 (n=6) |
| pitch 0: ticks from packets (landing packet time / 50 ms, +1 for the spawn tick), mean +- sd | 8.93 +- 0.57 (n=40) | 7.90 +- 0.38 (n=40) | 8.85 +- 0.53 (n=40) |
| pitch 0: ticks the matching flight model needs for the recorded launch (mean) | 8.9 | 7.9 | 8.8 |
| pitch +20: ticks the matching flight model needs for the recorded launch (mean) | 41.3 | 40.2 | 41.7 |
| pitch +45: ticks the matching flight model needs for the recorded launch (mean) | 77.5 | 75.3 | 78.0 |
| pitch +45: last velocity packet seen by the client (ms after spawn, +1 tick = flight ticks) | no per-tick packets (client predicts) | 3716 ms => 75.3 ticks | no per-tick packets (client predicts) |

Pitch 0: 8.9 ticks on 1.8.9 against 7.9 on the current Pumpkin (one tick shorter, because it hits the floor one tick earlier). At +20 and +45 the model gives 41 vs 40 and 78 vs 76 ticks. The 1.8.9 server sends no packet at the landing tick for arrows that left tracking range, so long flights cannot be timed from packets on 1.8.9; the flight model reproduces the server landing within 0.03 to 0.06 blocks, so its tick count is reliable. The fixed build is back at the 1.8 values.

## 9. What the client is told (packet schedule)

Typical pitch-0 shot, packets in the first 8 ms after the spawn packet:

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| sequence | `entity_move_look(d=0,0,96)` | `entity_velocity(-0.022,-0.014,2.983)`<br>`entity_velocity(-0.022,-0.063,2.953)`<br>`entity_velocity(-0.022,-0.063,2.953)`<br>`entity_move_look(d=-91,-258,12095)` | `entity_velocity(0.019,-0.016,2.963)`<br>`entity_velocity(0.019,-0.066,2.933)`<br>`entity_move_look(d=78,-65,12135)` |
| landing packet at (ms after spawn) | 398 | 348 | 400 |

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| pitch 0: entity_velocity packets, spawn to landing packet (pitch +45: first 1.1 s, no landing packet reaches the client) per shot | 0 | 10.9 (10..12) | 3.0 (3..3) |
| pitch 0: entity_move_look packets, spawn to landing packet (pitch +45: first 1.1 s, no landing packet reaches the client) per shot | 1.0 (1..1) | 1.0 (1..1) | 1.0 (1..1) |
| pitch 0: sync_entity_position packets, spawn to landing packet (pitch +45: first 1.1 s, no landing packet reaches the client) per shot | 0 | 1.0 (1..1) | 1.0 (1..1) |
| pitch 0: entity_teleport packets, spawn to landing packet (pitch +45: first 1.1 s, no landing packet reaches the client) per shot | 1.0 (1..1) | 0 | 0 |
| pitch +45: entity_velocity packets, spawn to landing packet (pitch +45: first 1.1 s, no landing packet reaches the client) per shot | 0 | 25.5 (25..26) | 3.0 (3..3) |
| pitch +45: entity_move_look packets, spawn to landing packet (pitch +45: first 1.1 s, no landing packet reaches the client) per shot | 1.0 (1..1) | 1.0 (1..1) | 1.0 (1..1) |
| pitch +45: sync_entity_position packets, spawn to landing packet (pitch +45: first 1.1 s, no landing packet reaches the client) per shot | 0 | 1.0 (1..1) | 1.0 (1..1) |
| pitch +45: entity_teleport packets, spawn to landing packet (pitch +45: first 1.1 s, no landing packet reaches the client) per shot | 1.0 (1..1) | 0 | 0 |
| interval of the velocity packets (ms, median / min..max), pitch 0 | none | 50 / 46..55 | 399 / 349..450 |
| spawn packet arrow yaw/pitch (pitch 0 shot) / (+45 shot), protocol units | 0/0 / -1/31 | -1/-1 / 0/31 | 0/-1 / 0/32 |
| packets after landing during the 1.5 s wait, pitch 0 (per shot) | 1.1 | 1.0 | 1.1 |

Arrow leaving the client's tracking range:

|  | Vanilla 1.8.9 | Pumpkin (current build) | Pumpkin fixed (pumpkin-next) |
| :--- | --- | --- | --- |
| pitch +20: entity_destroy to the client at (ms) / arrow distance then (blocks) | none | 1409 ms / 71 | 1299 ms / 67 |
| pitch +45: entity_destroy to the client at (ms) / arrow distance then (blocks) | 2150 ms / 76 | 1942 ms / 70 | 1983 ms / 70 |

Verdict, on the facts:

- Spawn: both servers send the spawn packet with the launch position and velocity (same fields, same values within protocol precision, see sections 2 to 4), then one `entity_move_look` for the first tick on both. Pumpkin additionally sends an `entity_velocity` equal to the spawn velocity right after the spawn packet, and an `entity_velocity` after the first tick (the current build sends that one twice in a row); 1.8.9 sends no velocity packets for arrows at all (the 1.8 client simulates the arrow itself from the spawn velocity). The arrow yaw/pitch bytes in the spawn packet differ by 1 unit (1.4 degrees) between shots on all servers, which is the random spread.
- In flight: the current Pumpkin sends one `entity_velocity` per tick (about 50 ms apart) for the whole flight plus a `sync_entity_position` every 20 ticks and a zero velocity plus `sync_entity_position` at the landing tick. 1.8.9 sends nothing between the first-tick move and the landing packet except a periodic teleport at 20 ticks for long flights. The fixed build has no per-tick stream: spawn velocity, velocity after the first tick, a velocity plus sync_entity_position every 20 ticks, and a zero velocity plus sync at the landing; that is close to the 1.8.9 pattern, the remaining extras are the two velocity packets and the zero velocity.
- Range: both servers tell the client to forget the arrow at about 65 to 76 blocks (`entity_destroy`). The current Pumpkin keeps sending a velocity packet every tick for the already forgotten arrow until it lands (the client has no entity for them any more), so part of that stream is wasted.
- The per-tick velocity packets are the likely reason an arrow can look different from 1.8 on a modern client: each packet overwrites the client's own motion with the server velocity, and that velocity is the drag/gravity-first one, i.e. one step further down the curve than 1.8 would have it, so the client is steered onto the lower trajectory. I did not measure what a 26.x client renders (the bot has no renderer); this is an inference from the packet contents.

## 10. Code that is responsible

| Difference | Where | What vanilla 1.8.9 does |
| :--- | --- | --- |
| Arrow lands short (13 % at pitch 0), one tick earlier | `vendor/Pumpkin/crates/pumpkin-core/src/entity/projectile/arrow.rs`, `ArrowEntity::tick`, lines ~625 to 648: `velocity.y -= GRAVITY`, then `velocity * inertia`, then `new_pos = start_pos + velocity` | `EntityArrow.onUpdate`: `pos += motion` (raycast with this motion) first, then `motion *= 0.99`, then `motion.y -= 0.05`. Pumpkin therefore moves with a velocity that already had one drag and one gravity step, and subtracts gravity before multiplying with 0.99 (-0.0495 instead of -0.05 per tick, cosmetic). |
| Per-tick `entity_velocity` stream and spawn-time duplicates | same function, lines ~700 to 702 (`CEntityVelocity` broadcast every tick); the extra packets at spawn come from the spawn/tracking path | `EntityTrackerEntry` for arrows: no velocity updates (`sendVelocityUpdates = false`), position sync every 20 ticks and when the arrow stops |
| Stuck arrow 0.04 higher | same file, lines ~851 to 858 (`velocity.signum() * 0.05`) | `posX -= motionX / |motion| * 0.05` (normalized) |
| Arrow next to the shooter is picked up instantly | same file, `on_player_collision` ~968 (no `shake_time` check) | `EntityArrow.onCollideWithPlayer`: only when `arrowShake <= 0` (7 ticks after the hit) |
| Crit particles spawned in the arrow tick (not measured here, read from the code) | same file, lines ~667 to 695 | client side only in 1.8 (`worldObj.spawnParticle` in the client EntityArrow) |

## 11. Raw data and reproduction

- Raw per-shot packets, spawn data, server queries: `reports/bow-raw-vanilla.json`, `reports/bow-raw-pumpkin.json`, `reports/bow-raw-pumpkin-fixed.json`. All computed numbers: `reports/bow-1.8.9-vs-pumpkin.metrics.json` (contains a per-shot table under `all`).
- Scripts in `tests/compare/`: `vanilla.js` (1.8.9 container), `collect.js` (shot set, run as `node collect.js vanilla|pumpkin`, `LABEL=pumpkin-fixed PUMPKIN_BIN=../build/pumpkin-next node collect.js pumpkin`), `physics.js` (the two flight orders), `analyze.js` (metrics), `report.js` (this file). Run from `tests/`.
- 1.8.9 jar and server.properties: `tests/compare/vanilla189/`.

### Per-shot list (summary columns)

| server | shot | speed | angle err (deg) | landing dist | model ticks (own order) | draw ticks seen by server |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| Vanilla 1.8.9 | stand p0 #0 | 2.999 | 0.18 | 24.75 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #1 | 2.991 | 0.10 | 24.09 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #2 | 2.990 | 0.43 | 24.34 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #3 | 2.959 | 1.03 | 24.19 | 9 | 19.8 |
| Vanilla 1.8.9 | stand p0 #4 | 2.997 | 0.74 | 22.98 | 8 | 20.0 |
| Vanilla 1.8.9 | stand p0 #5 | 3.006 | 0.35 | 25.21 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #6 | 2.996 | 0.12 | 24.50 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #7 | 3.023 | 0.77 | 25.60 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #8 | 3.011 | 0.81 | 26.87 | 10 | 20.0 |
| Vanilla 1.8.9 | stand p0 #9 | 2.987 | 0.83 | 24.36 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 #10 | 2.998 | 0.49 | 23.25 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #11 | 2.991 | 0.14 | 23.89 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #12 | 3.028 | 1.34 | 26.73 | 10 | 20.0 |
| Vanilla 1.8.9 | stand p0 #13 | 3.002 | 0.69 | 23.79 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #14 | 3.018 | 0.67 | 26.32 | 10 | 20.0 |
| Vanilla 1.8.9 | stand p0 #15 | 2.981 | 0.39 | 23.47 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 #16 | 2.989 | 0.54 | 25.80 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 #17 | 2.984 | 0.26 | 23.92 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 #18 | 2.979 | 0.52 | 23.51 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 #19 | 2.958 | 0.65 | 23.08 | 9 | 19.8 |
| Vanilla 1.8.9 | stand p0 #20 | 2.966 | 1.01 | 26.90 | 10 | 19.8 |
| Vanilla 1.8.9 | stand p0 #21 | 2.986 | 0.73 | 21.96 | 8 | 19.9 |
| Vanilla 1.8.9 | stand p0 #22 | 2.993 | 0.59 | 25.45 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #23 | 2.995 | 0.79 | 24.76 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #24 | 2.997 | 0.43 | 23.46 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #25 | 2.981 | 0.43 | 24.06 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 #26 | 3.016 | 0.16 | 24.22 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #27 | 2.975 | 0.66 | 22.10 | 8 | 19.9 |
| Vanilla 1.8.9 | stand p0 #28 | 2.999 | 0.51 | 23.02 | 8 | 20.0 |
| Vanilla 1.8.9 | stand p0 #29 | 2.986 | 0.15 | 24.36 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 #30 | 2.980 | 1.10 | 21.02 | 8 | 19.9 |
| Vanilla 1.8.9 | stand p0 #31 | 3.027 | 0.65 | 22.44 | 8 | 20.0 |
| Vanilla 1.8.9 | stand p0 #32 | 3.020 | 0.34 | 23.52 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #33 | 2.979 | 0.38 | 25.22 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 #34 | 3.001 | 0.48 | 25.73 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #35 | 3.007 | 0.21 | 24.87 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 #36 | 2.970 | 0.52 | 24.65 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 #37 | 2.952 | 0.32 | 23.99 | 9 | 19.8 |
| Vanilla 1.8.9 | stand p0 #38 | 2.994 | 0.43 | 22.96 | 8 | 20.0 |
| Vanilla 1.8.9 | stand p0 #39 | 2.972 | 0.48 | 22.74 | 8 | 19.9 |
| Vanilla 1.8.9 | stand p-45 #0 | 3.023 | 0.35 | 1.48 | 1 | 20.0 |
| Vanilla 1.8.9 | stand p-45 #1 | 3.047 | 0.67 | 1.44 | 1 | 20.0 |
| Vanilla 1.8.9 | stand p-45 #2 | 2.997 | 0.44 | 1.49 | 1 | 20.0 |
| Vanilla 1.8.9 | stand p-45 #3 | 3.005 | 0.77 | 1.44 | 1 | 20.0 |
| Vanilla 1.8.9 | stand p-45 #4 | 3.029 | 0.76 | 1.52 | 1 | 20.0 |
| Vanilla 1.8.9 | stand p-45 #5 | 2.960 | 0.68 | 1.46 | 1 | 19.8 |
| Vanilla 1.8.9 | stand p-20 #0 | 3.000 | 0.23 | 4.05 | 2 | 20.0 |
| Vanilla 1.8.9 | stand p-20 #1 | 3.027 | 0.45 | 4.16 | 2 | 20.0 |
| Vanilla 1.8.9 | stand p-20 #2 | 3.003 | 0.61 | 4.19 | 2 | 20.0 |
| Vanilla 1.8.9 | stand p-20 #3 | 2.947 | 0.66 | 4.13 | 2 | 19.7 |
| Vanilla 1.8.9 | stand p-20 #4 | 2.983 | 0.47 | 4.18 | 2 | 19.9 |
| Vanilla 1.8.9 | stand p-20 #5 | 3.018 | 0.87 | 4.20 | 2 | 20.0 |
| Vanilla 1.8.9 | stand p+20 #0 | 2.927 | 0.63 | 91.44 | 41 | 19.6 |
| Vanilla 1.8.9 | stand p+20 #1 | 3.040 | 0.28 | 96.96 | 42 | 20.0 |
| Vanilla 1.8.9 | stand p+20 #2 | 2.978 | 0.49 | 93.96 | 41 | 19.9 |
| Vanilla 1.8.9 | stand p+20 #3 | 2.995 | 0.36 | 95.65 | 42 | 20.0 |
| Vanilla 1.8.9 | stand p+20 #4 | 2.959 | 0.48 | 91.90 | 40 | 19.8 |
| Vanilla 1.8.9 | stand p+20 #5 | 2.972 | 0.32 | 94.28 | 42 | 19.9 |
| Vanilla 1.8.9 | stand p+45 #0 | 2.998 | 0.65 | 114.56 | 77 | 20.0 |
| Vanilla 1.8.9 | stand p+45 #1 | 3.025 | 0.40 | 115.76 | 78 | 20.0 |
| Vanilla 1.8.9 | stand p+45 #2 | 2.990 | 0.48 | 114.15 | 77 | 20.0 |
| Vanilla 1.8.9 | stand p+45 #3 | 2.987 | 0.51 | 113.18 | 78 | 19.9 |
| Vanilla 1.8.9 | stand p+45 #4 | 3.020 | 0.50 | 115.82 | 78 | 20.0 |
| Vanilla 1.8.9 | stand p+45 #5 | 3.007 | 0.50 | 115.14 | 77 | 20.0 |
| Vanilla 1.8.9 | stand p0 yaw37 #0 | 2.982 | 0.63 | 25.83 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 yaw37 #1 | 3.016 | 0.50 | 25.87 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 yaw37 #2 | 3.029 | 1.02 | 27.78 | 10 | 20.0 |
| Vanilla 1.8.9 | stand p0 yaw37 #3 | 3.003 | 0.12 | 23.86 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 yaw37 #4 | 3.019 | 0.14 | 23.96 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 yaw37 #5 | 2.977 | 0.29 | 23.23 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 yaw-90 #0 | 2.986 | 0.09 | 24.30 | 9 | 19.9 |
| Vanilla 1.8.9 | stand p0 yaw-90 #1 | 3.019 | 0.18 | 24.83 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 yaw-90 #2 | 2.999 | 0.39 | 24.04 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 yaw-90 #3 | 3.063 | 0.30 | 25.36 | 9 | 20.0 |
| Vanilla 1.8.9 | stand p0 yaw-90 #4 | 3.013 | 0.77 | 26.77 | 10 | 20.0 |
| Vanilla 1.8.9 | stand p0 yaw-90 #5 | 3.011 | 0.17 | 24.76 | 9 | 20.0 |
| Vanilla 1.8.9 | sprint p0 #0 | 3.003 | 0.22 | 24.49 | 9 | 20.0 |
| Vanilla 1.8.9 | sprint p0 #1 | 3.053 | 0.27 | 23.95 | 9 | 20.0 |
| Vanilla 1.8.9 | sprint p0 #2 | 3.009 | 0.22 | 24.55 | 9 | 20.0 |
| Vanilla 1.8.9 | sprint p0 #3 | 3.015 | 0.09 | 24.35 | 9 | 20.0 |
| Vanilla 1.8.9 | sprint p0 #4 | 3.008 | 0.27 | 25.06 | 9 | 20.0 |
| Vanilla 1.8.9 | sprint p0 #5 | 3.018 | 0.78 | 25.55 | 9 | 20.0 |
| Vanilla 1.8.9 | sprint p0 #6 | 2.981 | 0.90 | 22.87 | 8 | 19.9 |
| Vanilla 1.8.9 | sprint p0 #7 | 2.995 | 0.54 | 24.94 | 9 | 20.0 |
| Vanilla 1.8.9 | sprint p+20 #0 | 3.027 | 0.67 | 97.97 | 43 | 20.0 |
| Vanilla 1.8.9 | sprint p+20 #1 | 2.991 | 0.22 | 94.14 | 41 | 20.0 |
| Vanilla 1.8.9 | sprint p+20 #2 | 2.969 | 0.37 | 94.16 | 42 | 19.8 |
| Vanilla 1.8.9 | sprint p+20 #3 | 3.013 | 0.48 | 94.97 | 41 | 20.0 |
| Vanilla 1.8.9 | jump p0 #0 | 2.968 | 0.53 | 29.74 | 9 | 19.8 |
| Vanilla 1.8.9 | jump p0 #1 | 2.972 | 0.20 | 28.86 | 9 | 19.9 |
| Vanilla 1.8.9 | jump p0 #2 | 2.973 | 0.40 | 29.83 | 9 | 19.9 |
| Vanilla 1.8.9 | jump p0 #3 | 2.994 | 0.59 | 29.44 | 9 | 20.0 |
| Vanilla 1.8.9 | jump p0 #4 | 3.033 | 0.54 | 27.79 | 8 | 20.0 |
| Vanilla 1.8.9 | jump p0 #5 | 2.998 | 0.26 | 28.85 | 9 | 20.0 |
| Vanilla 1.8.9 | jump p0 #6 | 3.056 | 0.45 | 28.26 | 8 | 20.0 |
| Vanilla 1.8.9 | jump p0 #7 | 3.009 | 0.83 | 29.45 | 9 | 20.0 |
| Vanilla 1.8.9 | strafe-left p0 #0 | 2.994 | 0.78 | 26.64 | 10 | 20.0 |
| Vanilla 1.8.9 | strafe-left p0 #1 | 2.995 | 0.38 | 23.48 | 9 | 20.0 |
| Vanilla 1.8.9 | strafe-left p0 #2 | 3.025 | 0.36 | 25.34 | 9 | 20.0 |
| Vanilla 1.8.9 | strafe-left p0 #3 | 2.999 | 0.49 | 23.25 | 8 | 20.0 |
| Vanilla 1.8.9 | sneak p0 #0 | 3.027 | 0.79 | 26.32 | 10 | 20.0 |
| Vanilla 1.8.9 | sneak p0 #1 | 3.025 | 0.25 | 24.56 | 9 | 20.0 |
| Vanilla 1.8.9 | sneak p0 #2 | 2.968 | 0.79 | 24.61 | 9 | 19.8 |
| Vanilla 1.8.9 | sneak p0 #3 | 2.969 | 0.26 | 23.39 | 9 | 19.8 |
| Vanilla 1.8.9 | sneak p0 #4 | 3.045 | 0.88 | 24.60 | 9 | 20.0 |
| Vanilla 1.8.9 | draw 4 p0 #0 | 0.436 | 0.43 | 3.52 | 9 | 4.0 |
| Vanilla 1.8.9 | draw 4 p0 #1 | 0.440 | 0.59 | 3.53 | 9 | 4.0 |
| Vanilla 1.8.9 | draw 4 p0 #2 | 0.438 | 0.28 | 3.50 | 9 | 4.0 |
| Vanilla 1.8.9 | draw 4 p0 #3 | 0.442 | 0.89 | 3.57 | 9 | 4.0 |
| Vanilla 1.8.9 | draw 4 p0 #4 | 0.443 | 0.49 | 3.53 | 9 | 4.0 |
| Vanilla 1.8.9 | draw 8 p0 #0 | 0.958 | 0.57 | 7.55 | 9 | 8.0 |
| Vanilla 1.8.9 | draw 8 p0 #1 | 0.953 | 0.32 | 7.63 | 9 | 7.9 |
| Vanilla 1.8.9 | draw 8 p0 #2 | 0.958 | 0.35 | 7.76 | 9 | 8.0 |
| Vanilla 1.8.9 | draw 8 p0 #3 | 0.953 | 0.67 | 7.85 | 9 | 8.0 |
| Vanilla 1.8.9 | draw 8 p0 #4 | 0.958 | 0.76 | 7.48 | 9 | 8.0 |
| Vanilla 1.8.9 | draw 8 p0 #5 | 0.964 | 0.46 | 7.89 | 9 | 8.0 |
| Vanilla 1.8.9 | draw 8 p0 #6 | 0.960 | 0.42 | 7.82 | 9 | 8.0 |
| Vanilla 1.8.9 | draw 8 p0 #7 | 0.942 | 1.73 | 7.96 | 9 | 7.9 |
| Vanilla 1.8.9 | draw 12 p0 #0 | 1.559 | 0.42 | 12.21 | 9 | 12.0 |
| Vanilla 1.8.9 | draw 12 p0 #1 | 1.555 | 0.94 | 12.54 | 9 | 12.0 |
| Vanilla 1.8.9 | draw 12 p0 #2 | 1.578 | 0.68 | 12.23 | 9 | 12.1 |
| Vanilla 1.8.9 | draw 12 p0 #3 | 1.545 | 0.15 | 12.54 | 9 | 11.9 |
| Vanilla 1.8.9 | draw 12 p0 #4 | 1.558 | 0.36 | 12.41 | 9 | 12.0 |
| Vanilla 1.8.9 | draw 16 p0 #0 | 2.238 | 0.19 | 18.36 | 9 | 16.0 |
| Vanilla 1.8.9 | draw 16 p0 #1 | 2.223 | 0.99 | 16.60 | 8 | 15.9 |
| Vanilla 1.8.9 | draw 16 p0 #2 | 2.267 | 0.25 | 17.87 | 9 | 16.1 |
| Vanilla 1.8.9 | draw 16 p0 #3 | 2.237 | 1.08 | 19.68 | 10 | 16.0 |
| Vanilla 1.8.9 | draw 16 p0 #4 | 2.247 | 0.33 | 17.79 | 9 | 16.0 |
| Pumpkin (current build) | stand p0 #0 | 2.983 | 0.50 | 20.50 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #1 | 3.022 | 0.51 | 22.55 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #2 | 3.014 | 0.33 | 20.82 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #3 | 3.005 | 0.24 | 21.21 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #4 | 3.033 | 0.25 | 21.62 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #5 | 2.965 | 0.93 | 18.74 | 7 | 19.8 |
| Pumpkin (current build) | stand p0 #6 | 2.976 | 0.38 | 20.24 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #7 | 2.971 | 0.29 | 21.89 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #8 | 2.983 | 0.45 | 20.65 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #9 | 3.013 | 0.40 | 20.61 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #10 | 2.963 | 0.48 | 20.23 | 8 | 19.8 |
| Pumpkin (current build) | stand p0 #11 | 2.986 | 0.34 | 22.12 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #12 | 3.007 | 0.68 | 19.71 | 7 | 20.0 |
| Pumpkin (current build) | stand p0 #13 | 2.976 | 0.27 | 21.38 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #14 | 3.024 | 0.81 | 20.44 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #15 | 2.989 | 0.50 | 21.28 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #16 | 2.995 | 0.67 | 20.45 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #17 | 2.947 | 0.60 | 19.86 | 8 | 19.7 |
| Pumpkin (current build) | stand p0 #18 | 3.029 | 0.22 | 22.13 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #19 | 2.945 | 0.26 | 20.27 | 8 | 19.7 |
| Pumpkin (current build) | stand p0 #20 | 2.988 | 0.49 | 21.29 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #21 | 2.996 | 0.70 | 19.72 | 7 | 20.0 |
| Pumpkin (current build) | stand p0 #22 | 3.008 | 0.15 | 21.77 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #23 | 2.985 | 0.29 | 21.17 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #24 | 2.953 | 0.58 | 22.11 | 8 | 19.8 |
| Pumpkin (current build) | stand p0 #25 | 2.984 | 0.65 | 20.27 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #26 | 3.027 | 0.07 | 21.32 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #27 | 3.033 | 0.06 | 21.69 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #28 | 3.002 | 0.40 | 20.88 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #29 | 2.949 | 0.43 | 22.00 | 8 | 19.7 |
| Pumpkin (current build) | stand p0 #30 | 2.995 | 0.56 | 22.86 | 9 | 20.0 |
| Pumpkin (current build) | stand p0 #31 | 2.967 | 0.46 | 20.52 | 8 | 19.8 |
| Pumpkin (current build) | stand p0 #32 | 2.981 | 0.62 | 22.24 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #33 | 3.014 | 1.33 | 18.06 | 7 | 20.0 |
| Pumpkin (current build) | stand p0 #34 | 3.031 | 0.34 | 21.41 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #35 | 2.979 | 0.41 | 20.61 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 #36 | 3.018 | 0.63 | 22.77 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #37 | 2.996 | 0.21 | 21.69 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 #38 | 3.005 | 0.85 | 19.59 | 7 | 20.0 |
| Pumpkin (current build) | stand p0 #39 | 3.010 | 0.65 | 22.75 | 8 | 20.0 |
| Pumpkin (current build) | stand p-45 #0 | 3.027 | 0.41 | n/a | 1 | 20.0 |
| Pumpkin (current build) | stand p-45 #1 | 3.010 | 1.13 | n/a | 1 | 20.0 |
| Pumpkin (current build) | stand p-45 #2 | 3.015 | 0.97 | n/a | 1 | 20.0 |
| Pumpkin (current build) | stand p-45 #3 | 3.020 | 0.29 | n/a | 1 | 20.0 |
| Pumpkin (current build) | stand p-45 #4 | 3.009 | 0.05 | n/a | 1 | 20.0 |
| Pumpkin (current build) | stand p-45 #5 | 2.999 | 0.32 | n/a | 1 | 20.0 |
| Pumpkin (current build) | stand p-20 #0 | 3.043 | 0.74 | 4.04 | 2 | 20.0 |
| Pumpkin (current build) | stand p-20 #1 | 3.001 | 0.60 | 3.85 | 2 | 20.0 |
| Pumpkin (current build) | stand p-20 #2 | 3.011 | 1.35 | 3.64 | 2 | 20.0 |
| Pumpkin (current build) | stand p-20 #3 | 2.986 | 0.30 | 3.94 | 2 | 19.9 |
| Pumpkin (current build) | stand p-20 #4 | 2.975 | 0.22 | 3.93 | 2 | 19.9 |
| Pumpkin (current build) | stand p-20 #5 | 3.026 | 1.50 | 4.17 | 2 | 20.0 |
| Pumpkin (current build) | stand p+20 #0 | 2.964 | 0.43 | 89.35 | 40 | 19.8 |
| Pumpkin (current build) | stand p+20 #1 | 2.987 | 0.56 | 89.92 | 39 | 19.9 |
| Pumpkin (current build) | stand p+20 #2 | 3.013 | 0.60 | 93.13 | 41 | 20.0 |
| Pumpkin (current build) | stand p+20 #3 | 3.012 | 0.49 | 91.28 | 40 | 20.0 |
| Pumpkin (current build) | stand p+20 #4 | 2.999 | 0.14 | 90.72 | 40 | 20.0 |
| Pumpkin (current build) | stand p+20 #5 | 3.040 | 0.69 | 94.58 | 41 | 20.0 |
| Pumpkin (current build) | stand p+45 #0 | 2.977 | 0.57 | 110.67 | 75 | 19.9 |
| Pumpkin (current build) | stand p+45 #1 | 3.008 | 0.65 | 112.25 | 76 | 20.0 |
| Pumpkin (current build) | stand p+45 #2 | 2.994 | 0.32 | 111.48 | 76 | 20.0 |
| Pumpkin (current build) | stand p+45 #3 | 2.985 | 1.16 | 111.55 | 74 | 19.9 |
| Pumpkin (current build) | stand p+45 #4 | 2.983 | 0.81 | 111.17 | 75 | 19.9 |
| Pumpkin (current build) | stand p+45 #5 | 3.005 | 0.44 | 111.99 | 76 | 20.0 |
| Pumpkin (current build) | stand p0 yaw37 #0 | 2.958 | 0.40 | 20.06 | 8 | 19.8 |
| Pumpkin (current build) | stand p0 yaw37 #1 | 3.033 | 0.94 | 20.79 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 yaw37 #2 | 3.014 | 0.92 | 22.83 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 yaw37 #3 | 3.019 | 0.27 | 21.09 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 yaw37 #4 | 3.003 | 0.11 | 21.56 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 yaw37 #5 | 3.012 | 0.62 | 21.38 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 yaw-90 #0 | 2.988 | 0.55 | 21.12 | 8 | 19.9 |
| Pumpkin (current build) | stand p0 yaw-90 #1 | 2.996 | 0.59 | 19.75 | 7 | 20.0 |
| Pumpkin (current build) | stand p0 yaw-90 #2 | 2.995 | 0.21 | 20.73 | 8 | 20.0 |
| Pumpkin (current build) | stand p0 yaw-90 #3 | 2.968 | 0.49 | 20.30 | 8 | 19.8 |
| Pumpkin (current build) | stand p0 yaw-90 #4 | 3.008 | 0.48 | 20.13 | 7 | 20.0 |
| Pumpkin (current build) | stand p0 yaw-90 #5 | 2.954 | 0.55 | 21.35 | 8 | 19.8 |
| Pumpkin (current build) | sprint p0 #0 | 3.008 | 0.43 | 20.65 | 8 | 20.0 |
| Pumpkin (current build) | sprint p0 #1 | 3.004 | 0.62 | 22.40 | 8 | 20.0 |
| Pumpkin (current build) | sprint p0 #2 | 3.035 | 0.52 | 23.07 | 8 | 20.0 |
| Pumpkin (current build) | sprint p0 #3 | 2.957 | 0.15 | 20.62 | 8 | 19.8 |
| Pumpkin (current build) | sprint p0 #4 | 3.045 | 0.92 | 22.91 | 8 | 20.0 |
| Pumpkin (current build) | sprint p0 #5 | 3.036 | 0.15 | 21.96 | 8 | 20.0 |
| Pumpkin (current build) | sprint p0 #6 | 3.010 | 0.76 | 23.52 | 9 | 20.0 |
| Pumpkin (current build) | sprint p0 #7 | 2.999 | 0.19 | 21.65 | 8 | 20.0 |
| Pumpkin (current build) | sprint p+20 #0 | 3.012 | 0.30 | 92.27 | 40 | 20.0 |
| Pumpkin (current build) | sprint p+20 #1 | 2.970 | 0.92 | 87.05 | 38 | 19.8 |
| Pumpkin (current build) | sprint p+20 #2 | 2.995 | 0.14 | 91.01 | 40 | 20.0 |
| Pumpkin (current build) | sprint p+20 #3 | 2.983 | 0.08 | 90.26 | 40 | 19.9 |
| Pumpkin (current build) | jump p0 #0 | 2.998 | 0.69 | 24.67 | 7 | 20.0 |
| Pumpkin (current build) | jump p0 #1 | 3.011 | 0.16 | 26.30 | 8 | 20.0 |
| Pumpkin (current build) | jump p0 #2 | 3.023 | 0.43 | 25.28 | 8 | 20.0 |
| Pumpkin (current build) | jump p0 #3 | 2.973 | 0.27 | 26.71 | 8 | 19.9 |
| Pumpkin (current build) | jump p0 #4 | 2.963 | 0.59 | 24.88 | 8 | 19.8 |
| Pumpkin (current build) | jump p0 #5 | 2.983 | 0.46 | 24.88 | 8 | 19.9 |
| Pumpkin (current build) | jump p0 #6 | 2.978 | 0.48 | 24.81 | 7 | 19.9 |
| Pumpkin (current build) | jump p0 #7 | 3.005 | 0.60 | 26.81 | 8 | 20.0 |
| Pumpkin (current build) | strafe-left p0 #0 | 2.952 | 0.75 | 23.01 | 9 | 19.8 |
| Pumpkin (current build) | strafe-left p0 #1 | 2.979 | 1.02 | 18.58 | 7 | 19.9 |
| Pumpkin (current build) | strafe-left p0 #2 | 3.014 | 0.70 | 20.10 | 7 | 20.0 |
| Pumpkin (current build) | strafe-left p0 #3 | 2.991 | 0.64 | 22.86 | 9 | 20.0 |
| Pumpkin (current build) | sneak p0 #0 | 2.958 | 0.59 | 21.24 | 8 | 19.8 |
| Pumpkin (current build) | sneak p0 #1 | 2.987 | 0.86 | 22.18 | 8 | 19.9 |
| Pumpkin (current build) | sneak p0 #2 | 2.980 | 0.63 | 21.35 | 8 | 19.9 |
| Pumpkin (current build) | sneak p0 #3 | 3.011 | 0.33 | 21.45 | 8 | 20.0 |
| Pumpkin (current build) | sneak p0 #4 | 3.002 | 0.35 | 21.61 | 8 | 20.0 |
| Pumpkin (current build) | draw 4 p0 #0 | 0.441 | 0.19 | 3.10 | 8 | 4.0 |
| Pumpkin (current build) | draw 4 p0 #1 | 0.559 | 0.45 | 3.90 | 8 | 5.0 |
| Pumpkin (current build) | draw 4 p0 #2 | 0.443 | 0.08 | 3.11 | 8 | 4.0 |
| Pumpkin (current build) | draw 4 p0 #3 | 0.440 | 0.62 | 3.08 | 8 | 4.0 |
| Pumpkin (current build) | draw 4 p0 #4 | 0.440 | 0.13 | 3.09 | 8 | 4.0 |
| Pumpkin (current build) | draw 8 p0 #0 | 0.822 | 0.31 | 5.82 | 8 | 7.0 |
| Pumpkin (current build) | draw 8 p0 #1 | 0.964 | 0.34 | 6.72 | 8 | 8.0 |
| Pumpkin (current build) | draw 8 p0 #2 | 0.321 | 0.46 | 2.26 | 8 | 3.0 |
| Pumpkin (current build) | draw 8 p0 #3 | 0.948 | 0.55 | 6.56 | 8 | 7.9 |
| Pumpkin (current build) | draw 8 p0 #4 | 0.963 | 0.87 | 6.57 | 8 | 8.0 |
| Pumpkin (current build) | draw 8 p0 #5 | 0.964 | 0.49 | 6.93 | 8 | 8.0 |
| Pumpkin (current build) | draw 8 p0 #6 | 0.967 | 0.62 | 6.73 | 8 | 8.1 |
| Pumpkin (current build) | draw 8 p0 #7 | 0.962 | 0.51 | 6.93 | 8 | 8.0 |
| Pumpkin (current build) | draw 12 p0 #0 | 1.552 | 0.58 | 10.59 | 8 | 12.0 |
| Pumpkin (current build) | draw 12 p0 #1 | 1.543 | 1.04 | 10.71 | 8 | 11.9 |
| Pumpkin (current build) | draw 12 p0 #2 | 1.546 | 0.53 | 11.26 | 8 | 11.9 |
| Pumpkin (current build) | draw 12 p0 #3 | 1.552 | 0.36 | 11.13 | 8 | 11.9 |
| Pumpkin (current build) | draw 12 p0 #4 | 1.574 | 0.44 | 10.93 | 8 | 12.1 |
| Pumpkin (current build) | draw 16 p0 #0 | 2.036 | 0.35 | 14.88 | 8 | 14.8 |
| Pumpkin (current build) | draw 16 p0 #1 | 2.261 | 0.34 | 16.34 | 8 | 16.1 |
| Pumpkin (current build) | draw 16 p0 #2 | 2.402 | 0.79 | 17.45 | 8 | 16.9 |
| Pumpkin (current build) | draw 16 p0 #3 | 2.266 | 1.23 | 14.29 | 7 | 16.1 |
| Pumpkin (current build) | draw 16 p0 #4 | 2.067 | 0.91 | 15.90 | 9 | 15.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #0 | 2.963 | 0.48 | 23.01 | 9 | 19.8 |
| Pumpkin fixed (pumpkin-next) | stand p0 #1 | 3.012 | 0.96 | 22.72 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #2 | 2.977 | 0.81 | 26.03 | 10 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 #3 | 3.031 | 0.37 | 23.40 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #4 | 3.003 | 0.24 | 23.73 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #5 | 2.979 | 0.33 | 23.67 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 #6 | 2.998 | 0.51 | 24.90 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #7 | 2.963 | 0.18 | 23.83 | 9 | 19.8 |
| Pumpkin fixed (pumpkin-next) | stand p0 #8 | 3.045 | 0.70 | 26.15 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #9 | 2.980 | 0.32 | 24.14 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 #10 | 2.985 | 0.69 | 23.73 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 #11 | 2.998 | 0.45 | 24.19 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #12 | 2.989 | 1.12 | 21.84 | 8 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 #13 | 3.010 | 0.03 | 24.33 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #14 | 3.048 | 0.52 | 24.04 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #15 | 2.987 | 0.92 | 26.46 | 10 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 #16 | 3.023 | 0.64 | 23.60 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #17 | 2.982 | 0.20 | 24.24 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 #18 | 2.992 | 0.46 | 24.66 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #19 | 2.989 | 0.51 | 25.68 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 #20 | 3.037 | 0.72 | 22.76 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #21 | 3.022 | 0.74 | 26.69 | 10 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #22 | 2.975 | 0.71 | 23.67 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 #23 | 2.984 | 0.22 | 24.34 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 #24 | 3.004 | 0.82 | 21.84 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #25 | 2.969 | 0.53 | 22.80 | 8 | 19.8 |
| Pumpkin fixed (pumpkin-next) | stand p0 #26 | 3.024 | 0.74 | 22.88 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #27 | 3.008 | 0.43 | 23.01 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #28 | 2.992 | 0.15 | 24.54 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #29 | 3.009 | 0.55 | 23.61 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #30 | 3.003 | 0.46 | 25.68 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #31 | 2.963 | 0.38 | 24.59 | 9 | 19.8 |
| Pumpkin fixed (pumpkin-next) | stand p0 #32 | 3.002 | 0.94 | 21.49 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #33 | 3.063 | 0.57 | 24.37 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #34 | 3.003 | 0.33 | 24.34 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #35 | 3.001 | 0.28 | 23.56 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #36 | 3.042 | 0.63 | 22.62 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #37 | 3.026 | 0.47 | 25.09 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #38 | 3.011 | 0.56 | 25.19 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 #39 | 2.998 | 0.38 | 23.72 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-45 #0 | 2.999 | 0.19 | n/a | 1 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-45 #1 | 3.000 | 0.74 | n/a | 1 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-45 #2 | 3.000 | 0.28 | n/a | 1 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-45 #3 | 2.950 | 0.22 | n/a | 1 | 19.7 |
| Pumpkin fixed (pumpkin-next) | stand p-45 #4 | 3.041 | 0.29 | n/a | 1 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-45 #5 | 3.016 | 0.61 | n/a | 1 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-20 #0 | 3.028 | 0.76 | 4.00 | 2 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-20 #1 | 3.009 | 0.55 | 4.18 | 2 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-20 #2 | 2.999 | 0.45 | 4.16 | 2 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-20 #3 | 3.026 | 0.28 | 4.09 | 2 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-20 #4 | 3.010 | 0.30 | 4.02 | 2 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p-20 #5 | 3.019 | 0.38 | 4.01 | 2 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+20 #0 | 3.033 | 0.29 | 97.49 | 42 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+20 #1 | 2.991 | 0.57 | 94.93 | 42 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+20 #2 | 3.022 | 1.46 | 98.50 | 43 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+20 #3 | 3.015 | 0.29 | 95.22 | 41 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+20 #4 | 3.036 | 0.73 | 95.26 | 41 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+20 #5 | 3.020 | 0.37 | 95.39 | 41 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+45 #0 | 3.016 | 0.57 | 115.05 | 78 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+45 #1 | 3.013 | 0.76 | 115.27 | 78 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+45 #2 | 3.020 | 1.39 | 114.91 | 79 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+45 #3 | 2.995 | 0.47 | 113.76 | 78 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+45 #4 | 2.999 | 0.34 | 114.53 | 77 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p+45 #5 | 3.008 | 0.71 | 114.43 | 78 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw37 #0 | 2.962 | 1.06 | 26.61 | 10 | 19.8 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw37 #1 | 2.999 | 1.14 | 23.71 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw37 #2 | 3.025 | 0.75 | 25.86 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw37 #3 | 2.980 | 0.88 | 26.70 | 10 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw37 #4 | 3.003 | 0.25 | 23.50 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw37 #5 | 2.987 | 0.87 | 21.57 | 8 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw-90 #0 | 3.003 | 0.25 | 23.50 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw-90 #1 | 2.997 | 0.70 | 25.21 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw-90 #2 | 3.026 | 0.43 | 25.16 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw-90 #3 | 2.989 | 0.21 | 24.62 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw-90 #4 | 2.995 | 0.25 | 24.02 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | stand p0 yaw-90 #5 | 3.029 | 0.42 | 23.38 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sprint p0 #0 | 3.017 | 0.61 | 23.42 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sprint p0 #1 | 3.033 | 0.62 | 23.74 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sprint p0 #2 | 3.014 | 0.35 | 24.87 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sprint p0 #3 | 2.996 | 0.45 | 24.86 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sprint p0 #4 | 3.005 | 0.75 | 26.65 | 10 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sprint p0 #5 | 3.009 | 0.62 | 23.63 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sprint p0 #6 | 2.996 | 0.32 | 24.05 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sprint p0 #7 | 2.975 | 0.54 | 22.58 | 8 | 19.9 |
| Pumpkin fixed (pumpkin-next) | sprint p+20 #0 | 2.998 | 0.58 | 96.28 | 42 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sprint p+20 #1 | 2.964 | 1.17 | 95.83 | 43 | 19.8 |
| Pumpkin fixed (pumpkin-next) | sprint p+20 #2 | 3.020 | 0.16 | 96.15 | 42 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sprint p+20 #3 | 3.016 | 0.33 | 95.08 | 41 | 20.0 |
| Pumpkin fixed (pumpkin-next) | jump p0 #0 | 3.009 | 1.32 | 33.18 | 10 | 20.0 |
| Pumpkin fixed (pumpkin-next) | jump p0 #1 | 2.972 | 0.34 | 29.30 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | jump p0 #2 | 3.033 | 0.85 | 32.07 | 10 | 20.0 |
| Pumpkin fixed (pumpkin-next) | jump p0 #3 | 3.015 | 0.84 | 29.48 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | jump p0 #4 | 3.015 | 1.25 | 25.83 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | jump p0 #5 | 3.021 | 0.50 | 29.63 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | jump p0 #6 | 3.024 | 0.98 | 32.41 | 10 | 20.0 |
| Pumpkin fixed (pumpkin-next) | jump p0 #7 | 3.016 | 0.61 | 30.16 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | strafe-left p0 #0 | 3.002 | 0.62 | 25.44 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | strafe-left p0 #1 | 2.988 | 0.31 | 24.57 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | strafe-left p0 #2 | 3.015 | 0.46 | 25.05 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | strafe-left p0 #3 | 3.047 | 0.67 | 22.82 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sneak p0 #0 | 3.005 | 1.38 | 28.18 | 10 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sneak p0 #1 | 3.006 | 0.91 | 22.20 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sneak p0 #2 | 2.985 | 0.53 | 23.55 | 9 | 19.9 |
| Pumpkin fixed (pumpkin-next) | sneak p0 #3 | 3.016 | 0.35 | 22.90 | 8 | 20.0 |
| Pumpkin fixed (pumpkin-next) | sneak p0 #4 | 3.016 | 0.18 | 23.41 | 9 | 20.0 |
| Pumpkin fixed (pumpkin-next) | draw 4 p0 #0 | 0.434 | 0.62 | 3.43 | 9 | 4.0 |
| Pumpkin fixed (pumpkin-next) | draw 4 p0 #1 | 0.443 | 1.04 | 3.57 | 9 | 4.0 |
| Pumpkin fixed (pumpkin-next) | draw 4 p0 #2 | 0.438 | 0.53 | 3.52 | 9 | 4.0 |
| Pumpkin fixed (pumpkin-next) | draw 4 p0 #3 | 0.440 | 0.51 | 3.51 | 9 | 4.0 |
| Pumpkin fixed (pumpkin-next) | draw 4 p0 #4 | 0.438 | 0.23 | 3.51 | 9 | 4.0 |
| Pumpkin fixed (pumpkin-next) | draw 8 p0 #0 | 0.972 | 1.06 | 8.12 | 9 | 8.1 |
| Pumpkin fixed (pumpkin-next) | draw 8 p0 #1 | 0.961 | 0.90 | 7.58 | 9 | 8.0 |
| Pumpkin fixed (pumpkin-next) | draw 8 p0 #2 | 0.960 | 0.81 | 7.96 | 9 | 8.0 |
| Pumpkin fixed (pumpkin-next) | draw 8 p0 #3 | 0.969 | 0.64 | 7.95 | 9 | 8.1 |
| Pumpkin fixed (pumpkin-next) | draw 8 p0 #4 | 0.950 | 0.22 | 7.64 | 9 | 7.9 |
| Pumpkin fixed (pumpkin-next) | draw 8 p0 #5 | 0.957 | 0.30 | 7.76 | 9 | 8.0 |
| Pumpkin fixed (pumpkin-next) | draw 8 p0 #6 | 0.966 | 0.13 | 7.78 | 9 | 8.0 |
| Pumpkin fixed (pumpkin-next) | draw 8 p0 #7 | 0.967 | 0.30 | 7.80 | 9 | 8.1 |
| Pumpkin fixed (pumpkin-next) | draw 12 p0 #0 | 1.565 | 0.43 | 12.96 | 9 | 12.0 |
| Pumpkin fixed (pumpkin-next) | draw 12 p0 #1 | 1.552 | 0.72 | 12.76 | 9 | 11.9 |
| Pumpkin fixed (pumpkin-next) | draw 12 p0 #2 | 1.718 | 0.11 | 13.90 | 9 | 13.0 |
| Pumpkin fixed (pumpkin-next) | draw 12 p0 #3 | 1.568 | 0.32 | 12.56 | 9 | 12.0 |
| Pumpkin fixed (pumpkin-next) | draw 12 p0 #4 | 1.565 | 0.59 | 12.13 | 9 | 12.0 |
| Pumpkin fixed (pumpkin-next) | draw 16 p0 #0 | 2.251 | 0.58 | 17.85 | 9 | 16.1 |
| Pumpkin fixed (pumpkin-next) | draw 16 p0 #1 | 1.721 | 1.44 | 15.27 | 10 | 13.0 |
| Pumpkin fixed (pumpkin-next) | draw 16 p0 #2 | 2.245 | 0.29 | 18.52 | 9 | 16.0 |
| Pumpkin fixed (pumpkin-next) | draw 16 p0 #3 | 2.246 | 0.11 | 17.91 | 9 | 16.0 |
| Pumpkin fixed (pumpkin-next) | draw 16 p0 #4 | 2.208 | 0.61 | 16.86 | 8 | 15.8 |
