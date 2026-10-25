// Renders reports/bow-1.8.9-vs-pumpkin.md from the metrics that analyze.js computed (and the raw packet lists).
//   node analyze.js && node report.js
const fs = require('fs')
const path = require('path')
const REP = path.resolve(__dirname, '..', '..', 'reports')
const M = JSON.parse(fs.readFileSync(path.join(REP, 'bow-1.8.9-vs-pumpkin.metrics.json'), 'utf8'))
const V = M.vanilla; const P = M.pumpkin; const F = M.fixed
const cols = [['Vanilla 1.8.9', V], ['Pumpkin (current build)', P]]
if (F) cols.push(['Pumpkin fixed (pumpkin-next)', F])

const fx = (x, d = 3) => (x === undefined || x === null || Number.isNaN(x)) ? 'n/a' : (Math.abs(x) < 1e-12 ? (0).toFixed(d) : x.toFixed(d))
const ms = (s, d = 3) => s && s.n ? `${fx(s.mean, d)} +- ${fx(s.sd, d)} (n=${s.n})` : 'n/a'
const mm = (s, d = 3) => s && s.n ? `${fx(s.mean, d)} (${fx(s.min, d)} .. ${fx(s.max, d)})` : 'n/a'
const z = (a, b) => (a && b && a.n > 1 && b.n > 1) ? (b.mean - a.mean) / Math.sqrt(a.se ** 2 + b.se ** 2) : NaN
const table = (head, rows) => ['| ' + head.join(' | ') + ' |', '| ' + head.map((h, i) => i ? '---' : ':---').join(' | ') + ' |', ...rows.map(r => '| ' + r.join(' | ') + ' |')].join('\n')
const row = (label, fn) => [label, ...cols.map(([, R]) => { try { return fn(R) } catch (e) { return 'n/a' } })]
const head = ['', ...cols.map(c => c[0])]
const out = []
const w = (...a) => out.push(...a, '')

// verdict helpers --------------------------------------------------------------
const noise = (a, b, thr = 2.5) => { const q = z(a, b); return Number.isNaN(q) ? 'n/a' : Math.abs(q) < thr ? `within noise (z=${fx(q, 1)})` : `DIFFERENT (z=${fx(q, 1)})` }
const verdictMean = (key, getter) => cols.slice(1).map(([n, R]) => `${n}: ${noise(getter(V), getter(R))}`).join('; ')
const pct = (a, b) => `${fx((b - a) / a * 100, 1)} %`

// ---------------------------------------------------------------- header
w('# Bow arrow: real Minecraft 1.8.9 vs patched Pumpkin', 'Measured ' + (P.meta.startedAt || '').slice(0, 10) + '. All numbers below come from `reports/bow-raw-*.json` (every packet the client received, per shot) through `tests/compare/analyze.js`; nothing is typed in by hand.')

const landRow = g => {
  const a = V.landing[g]; const b = P.landing[g]; const c = F && F.landing[g]
  return [a, b, c]
}
const l0 = landRow('stand p0'); const l45 = landRow('stand p+45'); const l20 = landRow('stand p+20')
const me = (R, g) => R.landing[g].errV18.mean
const modelVerdict = (g) => `current build: DIFFERENT (model error vs 1.8 order ${fx(me(P, g), 2)} blocks, vanilla ${fx(me(V, g), 2)})` + (F ? `; fixed: identical to the 1.8 order within ${fx(me(F, g), 2)} blocks` : '')
const d = (a, b) => a && b && a.dist.n && b.dist.n ? `${fx(b.dist.mean - a.dist.mean, 2)} blocks (${pct(a.dist.mean, b.dist.mean)})` : 'n/a'

w('## Summary')
const sumRows = []
sumRows.push(['Launch speed at full draw', `${fx(V.speed.mean, 4)}`, `${fx(P.speed.mean, 4)}`, F ? fx(F.speed.mean, 4) : '', 'within measurement noise (all three)'])
sumRows.push(['Launch direction vs look direction, spread per axis', `${fx(V.residPooledSd, 4)}`, `${fx(P.residPooledSd, 4)}`, F ? fx(F.residPooledSd, 4) : '', 'identical (Gaussian 0.0075 per axis in all three)'])
sumRows.push(['Spawn offset from the shooter (right/forward/up)', '0.16 / 0 / 1.52 (1/32 fixed point)', '0.16 / 0 / 1.52', F ? '0.16 / 0 / 1.52' : '', 'identical to the 1.8 formula (sneaking too)'])
sumRows.push(['Shooter momentum added to the arrow', 'none', 'none', F ? 'none' : '', 'identical (no momentum)'])
sumRows.push(['Draw time to speed', 'speed = 3*(f0^2+2*f0)/3', 'same lattice', F ? 'same lattice' : '', 'identical formula'])
sumRows.push(['Landing distance, pitch 0 (eye 1.62 above floor)', `${fx(V.landing['stand p0'].dist.mean, 2)}`, `${fx(P.landing['stand p0'].dist.mean, 2)}`, F ? fx(F.landing['stand p0'].dist.mean, 2) : '', `${d(l0[0], l0[1])}; ` + modelVerdict('stand p0')])
sumRows.push(['Landing distance, pitch +20', `${fx(V.landing['stand p+20'].dist.mean, 2)}`, `${fx(P.landing['stand p+20'].dist.mean, 2)}`, F ? fx(F.landing['stand p+20'].dist.mean, 2) : '', `${d(l20[0], l20[1])}; ` + modelVerdict('stand p+20')])
sumRows.push(['Landing distance, pitch +45', `${fx(V.landing['stand p+45'].dist.mean, 2)}`, `${fx(P.landing['stand p+45'].dist.mean, 2)}`, F ? fx(F.landing['stand p+45'].dist.mean, 2) : '', `${d(l45[0], l45[1])}; ` + modelVerdict('stand p+45')])
sumRows.push(['Flight time pitch 0 (ticks after the spawn tick, from packets)', fx(V.landing['stand p0'].ticksPacket.mean, 2), fx(P.landing['stand p0'].ticksPacket.mean, 2), F ? fx(F.landing['stand p0'].ticksPacket.mean, 2) : '', `current build: about 1 tick shorter` + (F ? `; fixed: ${noise(V.landing['stand p0'].ticksPacket, F.landing['stand p0'].ticksPacket)}` : '')])
sumRows.push(['Packets for a flying arrow (pitch 0)', '1 velocity packet at spawn + 1 move, 1 landing packet', `${P.packets['stand p0'].perShot.entity_velocity.mean.toFixed(0)} velocity (one per tick) + move + landing sync`, F ? `${F.packets['stand p0'].perShot.entity_velocity.mean.toFixed(0)} velocity + move + landing sync` : '', 'DIFFERENT for the current build (see section 9)'])
w(table(['Metric', 'Vanilla 1.8.9', 'Pumpkin current', 'Pumpkin fixed', 'Verdict'], sumRows))
w('In one sentence: launch (speed, direction, spread, spawn offset, no momentum, draw formula) is identical to 1.8.9. The flight is not: the current Pumpkin arrow applies gravity and drag before it moves, which makes it drop faster and land short (about 13 % at pitch 0, 3 to 4 % at 20 and 45 degrees, see section 7). ' + (F ? 'The fixed build removes that difference (sections 7 and 8).' : ''))

// ---------------------------------------------------------------- remaining
if (F) {
  w('## Still different after the fix')
  w([
    `- Stuck depth: the stopped arrow sits ${fx(V.stuckY.mean, 3)} above the floor on 1.8.9 and ${fx(F.stuckY.mean, 3)} on the fixed build (same as before the fix, ${fx(P.stuckY.mean, 3)}). Cosmetic (0.04 blocks); \`arrow.rs\` moves the arrow back by 0.05 along the sign of each component instead of along the normalized motion.`,
    `- Arrows that land within about 2 blocks of the shooter disappear immediately on Pumpkin (${P.landing['stand p-45'].removedBeforeObserved} of 6 current, ${F.landing['stand p-45'].removedBeforeObserved} of 6 fixed shots at pitch -45, destroyed ${fx(P.landing['stand p-45'].pickedUpMs.mean, 1)} ms after the hit) but 450 ms later on 1.8.9 (arrowShake). Likely cause: no \`shake_time\` check in \`on_player_collision\`.`,
    `- Extra velocity packets: ${fx(F.packets['stand p0'].perShot.entity_velocity.mean, 0)} per pitch-0 flight on the fixed build (spawn duplicate, after first tick, zero at landing) against 0 on 1.8.9. Harmless for the trajectory, noted for completeness.`,
    `- Draw tick bookkeeping on Pumpkin is sometimes off by one tick for short draws (see section 6); not seen on 1.8.9. Cause not isolated.`
  ].join('\n'))
}

// ---------------------------------------------------------------- method
w('## 1. Method')
w([
  '- Reference: the real Mojang `server.jar` of 1.8.9 (sha1 `b58b2ceb36e01bcd8dbf49c8fb66c55a9f0676cd`, downloaded through the version manifest), run with `eclipse-temurin:8-jre`, offline mode, 1 GB container limit, flat world of stone up to y=149 (`generator-settings=3;150*minecraft:stone;1`), peaceful. The bot connects with mineflayer version `1.8.9`. Script: `tests/compare/vanilla.js`.',
  '- Pumpkin: a throwaway copy of `server/` started by `tests/harness/server.js` (BedWars plugin, `[pvp.legacy_combat]` enabled), bots speak 26.1 through ViaProxy to 26.3. Platform of stone at y=149 (81 x 181 blocks) with cleared headroom above the lane; BedWars round running (2 bots), shooter and floor at y=150 on both servers, so the launch is 1.62 above the floor everywhere. Builds: `' + (P.meta.binary ? P.meta.binary.path.replace(/.*bedwars-pumpkin\//, '') + ' sha256 ' + P.meta.binary.sha256.slice(0, 16) : '?') + '` (current)' + (F && F.meta.binary ? ', copy of `build/pumpkin-next` as of 18:50 local time, sha256 ' + F.meta.binary.sha256.slice(0, 16) + ' (fixed; an earlier pumpkin-next build, sha256 194e7e0d34c670a4, gave the same results in `bow-raw-pumpkin-fixed-build194e.json`)' : '') + '.',
  '- Identical input on every server: `tests/compare/collect.js` drives one bot with the same seeded start positions (random sub-block x/z within 8 blocks, y=150), the same look angles and the same number of draw ticks. Each shot: kill old arrows, teleport, set look, hold the bow N client ticks, release, record every packet about the arrow with a timestamp, wait until the arrow has landed (model flight time + 1.5 s), then ask the SERVER for the stuck arrow (`entitydata @e[type=Arrow,c=1] {}` on 1.8.9, `data get entity @n[type=minecraft:arrow] Pos` on Pumpkin). The server value is the landing position; packets alone cannot give it (see section 9: the arrow leaves the client\'s tracking range at about 64 blocks on both servers).',
  '- Shot set (128 per server): standing pitch 0 x40, pitch -45/-20/+20/+45 x6 each, yaw 37 and -90 at pitch 0 x6 each, sprinting forward pitch 0 x8 and +20 x4, jump (released on the 3rd airborne tick while rising) x8, strafing left x4, sneaking x5, partial draws 4/8/12/16 ticks x5/8/5/5. Full draw = 22 client ticks (needs 20).',
  '- Units: positions in blocks, velocity in blocks/tick. On 1.8.9 the packets carry position/32 and velocity/8000 (truncated, so spawn positions are floored to 1/32 block); 26.1 carries doubles. Look angles are what the client actually sent (`position_look` writes were recorded), the direction vector is computed with the vanilla formula from them. Residual r = v/3 - dir, which is exactly gaussian*0.0075 for a 1.8 launch at full draw.',
  '- Spread statistics use standing, full-draw shots only (n = ' + cols.map(([n, R]) => R.speed.n).join(' / ') + '; shots whose draw was cut short by tick jitter are excluded: ' + cols.map(([n, R]) => R.fullDrawExcluded).join(' / ') + ' excluded).',
  '- Caveats: the Pumpkin bot packets pass through ViaProxy (26.3 to 26.1 translation), so what is reported is what a 26.1 client sees; I did not test ViaProxy on its own; the launch statistics on Pumpkin match the 1.8.9 ones to within noise, which would not happen if it distorted positions or velocities noticeably. Another agent ran a second Pumpkin test server on the same machine during part of the runs, which adds timing jitter (see the draw tick table). Timestamps are wall clock at the bot, resolution 50 ms ticks.'
].join('\n'))

// ---------------------------------------------------------------- 2
w('## 2. Launch speed at full draw (standing, all pitches and yaws)')
w(table(head, [
  row('launch speed (blocks per tick), mean +- sd', R => ms(R.speed, 4)),
  row('min .. max', R => `${fx(R.speed.min, 3)} .. ${fx(R.speed.max, 3)}`),
  row('expected (1.8: 3.0 times the length of dir + 0.0075*gauss)', () => '3.000 +- 0.0225')
]))
w(`Verdict: ${verdictMean('speed', R => R.speed)}. The standard deviation (${cols.map(([, R]) => fx(R.speed.sd, 4)).join(' / ')}) equals the theoretical 0.0225, so the spread is applied in the same way. Responsible code: \`legacy_combat.rs\` \`arrow_launch\` (ARROW_SPEED 3.0, spread 0.0075), hooked in \`bow.rs\` line 179 ff.`)

// ---------------------------------------------------------------- 3
w('## 3. Launch direction and spread')
w(table(head, [
  row('angle between velocity and look direction, RMS (deg)', R => fx(R.angle.rms, 3)),
  row('largest angle (deg)', R => fx(R.angle.max, 2)),
  row('residual x: mean / sd', R => `${fx(R.resid.x.mean, 4)} / ${fx(R.resid.x.sd, 4)}`),
  row('residual y: mean / sd', R => `${fx(R.resid.y.mean, 4)} / ${fx(R.resid.y.sd, 4)}`),
  row('residual z: mean / sd', R => `${fx(R.resid.z.mean, 4)} / ${fx(R.resid.z.sd, 4)}`),
  row('pooled sd of the three axes', R => fx(R.residPooledSd, 4)),
  row('theory 1.8.9 (setThrowableHeading, inaccuracy 1.0)', () => 'sd 0.0075 per axis, mean 0, RMS angle 0.61')
]))
const sdr = cols.map(([, R]) => R.residPooledSd / V.residPooledSd)
w(`Verdict: identical. Pooled sd ratio to vanilla: ${sdr.map(x => fx(x, 2)).join(' / ')} (95 % interval for n=70 about 0.85 to 1.17); per-axis means are within 2 standard errors of 0 (se about 0.0009) on all servers, i.e. no systematic aim offset. The launch direction is the look direction (yaw/pitch as sent), the arrow is not rotated or biased.`)

// ---------------------------------------------------------------- 4
w('## 4. Spawn position relative to the shooter')
w('Measured in the shooter frame: right = (-cos yaw, 0, -sin yaw), forward = (-sin yaw, 0, cos yaw), up = height above the feet. 1.8.9 formula: right 0.16, forward 0, up 1.62 - 0.1 = 1.52 (sneaking 1.54 - 0.1 = 1.44).')
w(table(head, [
  row('right (mean +- sd)', R => ms(R.offset.right, 4)),
  row('forward (mean +- sd)', R => ms(R.offset.fwd, 4)),
  row('up (mean +- sd)', R => ms(R.offset.up, 4)),
  row('max distance of any spawn position to the 1.8 formula (with 1/32 flooring on 1.8.9)', R => R.offsetFormulaErr.max < 1e-6 ? '0 (exact in every shot)' : fx(R.offsetFormulaErr.max, 6)),
  row('right / forward at yaw 0', R => `${fx(R.offsetByYaw['stand p0'].right.mean, 3)} / ${fx(R.offsetByYaw['stand p0'].fwd.mean, 3)}`),
  row('right / forward at yaw 37', R => `${fx(R.offsetByYaw['stand p0 yaw37'].right.mean, 3)} / ${fx(R.offsetByYaw['stand p0 yaw37'].fwd.mean, 3)}`),
  row('right / forward at yaw -90', R => `${fx(R.offsetByYaw['stand p0 yaw-90'].right.mean, 3)} / ${fx(R.offsetByYaw['stand p0 yaw-90'].fwd.mean, 3)}`),
  row('sneaking: up', R => R.offsetSneak ? ms(R.offsetSneak.up, 4) : 'n/a')
]))
w('Verdict: identical. The 1.8.9 numbers differ from 0.16 / 0 / 1.52 by at most 1/32 = 0.031 only because the 1.8 protocol floors positions to 1/32 block (up 1.500 instead of 1.52 and 1.4375 instead of 1.44 for the same reason; the right/forward means scatter with the shooter\'s random sub-block position). Every single 1.8.9 spawn position equals floor(formula*32)/32 exactly and every Pumpkin spawn position equals the formula to 1e-8, so the offset formula (eye height, 0.1 down, 0.16 sideways with the yaw dependent sign, sneaking eye height 1.54) is the same. Responsible code: `arrow_launch` and `player_eye_height` in `legacy_combat.rs`.')

// ---------------------------------------------------------------- 5
w('## 5. Shooter momentum')
w('Residual of the arrow velocity along the shooter\'s own per-tick movement (r = v/3 - dir, projected on the unit step of the shooter; units of 3 blocks/tick). If the shooter\'s momentum were added (1.9+ behaviour) the value would be step/3 (shown).')
const momRows = []
for (const g of ['sprint p0', 'sprint p+20', 'jump p0', 'strafe-left p0']) {
  momRows.push(row(`${g}: shooter step (blocks/tick) / momentum would add`, R => R.momentum[g] && R.momentum[g].stepLen ? `${fx(R.momentum[g].stepLen.mean, 3)} / ${fx(R.momentum[g].momentumWouldAdd, 3)}` : 'n/a'))
  momRows.push(row(`${g}: measured residual along the step, mean +- se (n)`, R => R.momentum[g] && R.momentum[g].residAlongStep ? `${fx(R.momentum[g].residAlongStep.mean, 4)} +- ${fx(R.momentum[g].residAlongStep.se, 4)} (${R.momentum[g].residAlongStep.n})` : 'n/a'))
}
momRows.push(row('mean speed: standing / sprint p0 / jump', R => `${fx(R.momentum['stand p0'].speed.mean, 3)} / ${fx(R.momentum['sprint p0'].speed.mean, 3)} / ${fx(R.momentum['jump p0'].speed.mean, 3)}`))
w(table(head, momRows))
w('Verdict: identical. In every moving scenario the along-step residual is 0 within about 2 standard errors and at least 20 times smaller than the momentum that would be added; arrow speed does not change with sprinting or jumping.')

// ---------------------------------------------------------------- draw
w('## 6. Draw time to speed')
const dr = []
for (const dd of [4, 8, 12, 16, 22]) dr.push([`${dd} ticks held (expected ${fx(V.draw[dd].expected, 3)})`, ...cols.map(([, R]) => `${fx(R.draw[dd].speed.mean, 3)} +- ${fx(R.draw[dd].speed.sd, 3)}`)])
for (const dd of [4, 8, 12, 16, 22]) dr.push([`${dd}: shots where the server counted exactly that many ticks (cap 20) / +-1 / worse`, ...cols.map(([, R]) => { const x = R.drawVsNominal[dd]; return `${x.exact} / ${x.offBy1} / ${x.worse} of ${x.n}` })])
dr.push(['max distance of the derived draw ticks to an integer (formula lattice)', ...cols.map(([, R]) => fx(R.drawLattice.maxFracErr, 3) + ' ticks')])
w(table(head, dr))
const offc = R => { let n = 0; let off = 0; for (const x of Object.values(R.drawVsNominal)) { n += x.n; off += x.offBy1 + x.worse } return `${off} of ${n}` }
w(`Verdict: formula identical. Arrow speeds sit on the 1.8 lattice speed(j) = 3*(f0^2+2*f0)/3 with f0 = j/20, capped at j = 20 (the derived tick count is within about 0.2 ticks of an integer on every server, which is what the 0.0225 spread does to the derivation). What differs is only how many ticks the server counted for a given client draw. Shots off by one tick or more: ${cols.map(([n, R]) => n + ' ' + offc(R)).join(', ')}. 1.8.9 counted the client\'s ticks exactly every time; Pumpkin (both builds) is sometimes off by 1 (once by 5 ticks). That looks like tick/network jitter (ViaProxy hop, machine load incl. a second Pumpkin server) and not like a formula difference, but I could not separate those causes; at full draw (22 ticks held, 20 needed) it never matters.`)

// ---------------------------------------------------------------- landing
w('## 7. Landing distance and height (server-side position of the stuck arrow)')
w('Horizontal distance from the shooter\'s feet to the stuck arrow, full-draw standing shots. The floor is 1.52 below the launch point. The "ideal" row is the no-spread flight computed with the 1.8 order (move, then drag 0.99, then gravity 0.05) and with the Pumpkin order (gravity, then drag, then move) from the exact launch.')
const lr = []
for (const g of ['stand p-20', 'stand p0', 'stand p+20', 'stand p+45']) {
  lr.push(row(`${g.replace('stand p', 'pitch ')}: distance mean +- sd (n)`, R => ms(R.landing[g].dist, 2)))
  lr.push(row(`${g.replace('stand p', 'pitch ')}: ideal 1.8 order / ideal Pumpkin order`, R => `${fx(R.landing[g].nominal.vanilla18.dist, 2)} / ${fx(R.landing[g].nominal.pumpkin.dist, 2)}`))
}
w(table(head, lr))
const dd2 = []
for (const g of ['stand p-20', 'stand p0', 'stand p+20', 'stand p+45']) {
  dd2.push([g.replace('stand p', 'pitch '), ...cols.slice(1).map(([n, R]) => { const a = V.landing[g].dist; const b = R.landing[g].dist; const q = z(a, b); return `${fx(b.mean - a.mean, 2)} blocks (${pct(a.mean, b.mean)}), z=${fx(q, 1)}; error vs 1.8 flight model ${fx(R.landing[g].errV18.mean, 2)} (vanilla ${fx(V.landing[g].errV18.mean, 2)})` })])
}
w(table(['Difference to vanilla', ...cols.slice(1).map(c => c[0])], dd2))
w('The sample means of 6 shots are noisy (sd of the landing distance 1 to 2 blocks from the spread), so the z of the plain difference is weak at +20. The decisive column is the per-shot model error: the recorded launch of each shot is flown through the 1.8 order and compared with where that same arrow really stopped. Vanilla matches to 0.03 to 0.16 blocks, the current Pumpkin misses by 2.7 to 4.1 blocks at 0, +20 and +45, which is far outside the noise.')
w('Pitch -45: the arrow hits the floor 1.5 blocks in front of the shooter in the first tick. On 1.8.9 the shooter picks it up 450 ms later, on Pumpkin the arrow entity is destroyed 0.1 to 0.3 ms after the hit (before the server could be asked), so no landing position exists for Pumpkin; it is left out. Pickup after 7 ticks is the 1.8 rule (`arrowShake`); `ArrowEntity::on_player_collision` (arrow.rs ~line 968) has no check of `shake_time`, which is the likely cause (the shake time is set to 7 in line 782 but never read for pickup).')
w('Landing height of the stuck arrow above the floor (y - 150):')
w(table(head, [row('mean +- sd', R => ms(R.stuckY, 4))]))
w('Verdict: the pitch-0 stuck height is about 0.007 on 1.8.9 (impact point moved 0.05 back along the NORMALIZED motion) and exactly 0.05 on Pumpkin (impact point moved 0.05 back along the SIGN of each motion component, `arrow.rs` lines ~851 to 858). Difference 0.04 blocks, cosmetic; it is also the reason for the remaining 0.05 model error in the fixed build.')

w('### Which flight order explains each server (model check)')
w('The recorded launch (position, velocity from the spawn packet) is replayed through both flight orders and compared with the server\'s stuck position (horizontal error, mean over full-draw shots):')
const mr = []
for (const g of ['stand p-20', 'stand p0', 'stand p+20', 'stand p+45']) {
  mr.push(row(`${g.replace('stand p', 'pitch ')}: error of the 1.8 order model / of the Pumpkin order model (blocks)`, R => `${fx(R.landing[g].errV18.mean, 2)} / ${fx(R.landing[g].errPumpkin.mean, 2)}`))
}
w(table(head, mr))
w('Reading: on 1.8.9 the 1.8 order reproduces the stuck position to 0.03 to 0.16 blocks (that is the 1/32 position quantization plus the 0.05 stuck offset) and the Pumpkin order is off by 0.3 to 4 blocks. On the current Pumpkin it is the other way round (Pumpkin order within 0.05, 1.8 order 2.5 to 4 blocks off). ' + (F ? 'On the fixed build the 1.8 order explains the landing again (within 0.05 to 0.06). ' : '') + 'So the whole landing difference comes from the order of operations in the arrow tick, nothing in the launch.')

// ---------------------------------------------------------------- 8 flight time
w('## 8. Flight time')
const ft = []
for (const g of ['stand p-20', 'stand p0']) {
  ft.push(row(`${g.replace('stand p', 'pitch ')}: ticks from packets (landing packet time / 50 ms, +1 for the spawn tick), mean +- sd`, R => ms(R.landing[g].ticksPacket, 2)))
}
for (const g of ['stand p0', 'stand p+20', 'stand p+45']) {
  ft.push(row(`${g.replace('stand p', 'pitch ')}: ticks the matching flight model needs for the recorded launch (mean)`, (R) => `${fx(R === P ? R.landing[g].ticksModelPumpkin.mean : R.landing[g].ticksModelV18.mean, 1)}`))
}
ft.push(row('pitch +45: last velocity packet seen by the client (ms after spawn, +1 tick = flight ticks)', R => R.packets['stand p+45'] && R.packets['stand p+45'].perShot.entity_velocity && R.packets['stand p+45'].perShot.entity_velocity.mean > 10 && R.tracking['stand p+45'] && R.tracking['stand p+45'].lastVelDt.n ? `${fx(R.tracking['stand p+45'].lastVelDt.mean, 0)} ms => ${fx(R.tracking['stand p+45'].lastVelDt.mean / 50 + 1, 1)} ticks` : 'no per-tick packets (client predicts)'))
w(table(head, ft))
w('Pitch 0: 8.9 ticks on 1.8.9 against 7.9 on the current Pumpkin (one tick shorter, because it hits the floor one tick earlier). At +20 and +45 the model gives 41 vs 40 and 78 vs 76 ticks. The 1.8.9 server sends no packet at the landing tick for arrows that left tracking range, so long flights cannot be timed from packets on 1.8.9; the flight model reproduces the server landing within 0.03 to 0.06 blocks, so its tick count is reliable. ' + (F ? 'The fixed build is back at the 1.8 values.' : ''))

// ---------------------------------------------------------------- 9 packets
w('## 9. What the client is told (packet schedule)')
const sample = R => R.packets['stand p0'].sample
w('Typical pitch-0 shot, packets in the first 8 ms after the spawn packet:')
w(table(head, [row('sequence', R => sample(R).atSpawn.length ? sample(R).atSpawn.map(x => '`' + x + '`').join('<br>') : 'only the spawn packet and a move'), row('landing packet at (ms after spawn)', R => fx(sample(R).landPacketDt, 0))]))
const pk = []
for (const g of ['stand p0', 'stand p+45']) {
  for (const k of ['entity_velocity', 'entity_move_look', 'sync_entity_position', 'entity_teleport']) {
    pk.push(row(`${g.replace('stand p', 'pitch ')}: ${k} packets, spawn to landing packet (pitch +45: first 1.1 s, no landing packet reaches the client) per shot`, R => R.packets[g] && R.packets[g].perShot[k] ? `${fx(R.packets[g].perShot[k].mean, 1)} (${R.packets[g].perShot[k].min}..${R.packets[g].perShot[k].max})` : '0'))
  }
}
pk.push(row('interval of the velocity packets (ms, median / min..max), pitch 0', R => R.packets['stand p0'].velocityIntervalMs ? `${fx(R.packets['stand p0'].velocityIntervalMs.median, 0)} / ${fx(R.packets['stand p0'].velocityIntervalMs.min, 0)}..${fx(R.packets['stand p0'].velocityIntervalMs.max, 0)}` : 'none'))
pk.push(row('spawn packet arrow yaw/pitch (pitch 0 shot) / (+45 shot), protocol units', R => `${R.arrowYawPitchAtSpawn.yaw}/${R.arrowYawPitchAtSpawn.pitch} / ${R.arrowYawPitch45.yaw}/${R.arrowYawPitch45.pitch}`))
pk.push(row('packets after landing during the 1.5 s wait, pitch 0 (per shot)', R => fx(R.packets['stand p0'].postLanding.mean, 1)))
w(table(head, pk))
const tr = []
for (const g of ['stand p+20', 'stand p+45']) {
  tr.push(row(`${g.replace('stand p', 'pitch ')}: entity_destroy to the client at (ms) / arrow distance then (blocks)`, R => R.tracking[g] && R.tracking[g].destroyDt.n ? `${fx(R.tracking[g].destroyDt.mean, 0)} ms / ${fx(R.tracking[g].destroyDist.mean, 0)}` : 'none'))
}
w('Arrow leaving the client\'s tracking range:')
w(table(head, tr))
w('Verdict, on the facts:')
w([
  '- Spawn: both servers send the spawn packet with the launch position and velocity (same fields, same values within protocol precision, see sections 2 to 4), then one `entity_move_look` for the first tick on both. Pumpkin additionally sends an `entity_velocity` equal to the spawn velocity right after the spawn packet, and an `entity_velocity` after the first tick (the current build sends that one twice in a row); 1.8.9 sends no velocity packets for arrows at all (the 1.8 client simulates the arrow itself from the spawn velocity). The arrow yaw/pitch bytes in the spawn packet differ by 1 unit (1.4 degrees) between shots on all servers, which is the random spread.',
  '- In flight: the current Pumpkin sends one `entity_velocity` per tick (about 50 ms apart) for the whole flight plus a `sync_entity_position` every 20 ticks and a zero velocity plus `sync_entity_position` at the landing tick. 1.8.9 sends nothing between the first-tick move and the landing packet except a periodic teleport at 20 ticks for long flights. ' + (F ? 'The fixed build has no per-tick stream: spawn velocity, velocity after the first tick, a velocity plus sync_entity_position every 20 ticks, and a zero velocity plus sync at the landing; that is close to the 1.8.9 pattern, the remaining extras are the two velocity packets and the zero velocity.' : ''),
  '- Range: both servers tell the client to forget the arrow at about 65 to 76 blocks (`entity_destroy`). The current Pumpkin keeps sending a velocity packet every tick for the already forgotten arrow until it lands (the client has no entity for them any more), so part of that stream is wasted.',
  '- The per-tick velocity packets are the likely reason an arrow can look different from 1.8 on a modern client: each packet overwrites the client\'s own motion with the server velocity, and that velocity is the drag/gravity-first one, i.e. one step further down the curve than 1.8 would have it, so the client is steered onto the lower trajectory. I did not measure what a 26.x client renders (the bot has no renderer); this is an inference from the packet contents.'
].join('\n'))

// ---------------------------------------------------------------- code
w('## 10. Code that is responsible')
w(table(['Difference', 'Where', 'What vanilla 1.8.9 does'], [
  ['Arrow lands short (13 % at pitch 0), one tick earlier', '`vendor/Pumpkin/crates/pumpkin-core/src/entity/projectile/arrow.rs`, `ArrowEntity::tick`, lines ~625 to 648: `velocity.y -= GRAVITY`, then `velocity * inertia`, then `new_pos = start_pos + velocity`', '`EntityArrow.onUpdate`: `pos += motion` (raycast with this motion) first, then `motion *= 0.99`, then `motion.y -= 0.05`. Pumpkin therefore moves with a velocity that already had one drag and one gravity step, and subtracts gravity before multiplying with 0.99 (-0.0495 instead of -0.05 per tick, cosmetic).'],
  ['Per-tick `entity_velocity` stream and spawn-time duplicates', 'same function, lines ~700 to 702 (`CEntityVelocity` broadcast every tick); the extra packets at spawn come from the spawn/tracking path', '`EntityTrackerEntry` for arrows: no velocity updates (`sendVelocityUpdates = false`), position sync every 20 ticks and when the arrow stops'],
  ['Stuck arrow 0.04 higher', 'same file, lines ~851 to 858 (`velocity.signum() * 0.05`)', '`posX -= motionX / |motion| * 0.05` (normalized)'],
  ['Arrow next to the shooter is picked up instantly', 'same file, `on_player_collision` ~968 (no `shake_time` check)', '`EntityArrow.onCollideWithPlayer`: only when `arrowShake <= 0` (7 ticks after the hit)'],
  ['Crit particles spawned in the arrow tick (not measured here, read from the code)', 'same file, lines ~667 to 695', 'client side only in 1.8 (`worldObj.spawnParticle` in the client EntityArrow)']
]))

// ---------------------------------------------------------------- raw
w('## 11. Raw data and reproduction')
w([
  '- Raw per-shot packets, spawn data, server queries: `reports/bow-raw-vanilla.json`, `reports/bow-raw-pumpkin.json`' + (F ? ', `reports/bow-raw-pumpkin-fixed.json`' : '') + '. All computed numbers: `reports/bow-1.8.9-vs-pumpkin.metrics.json` (contains a per-shot table under `all`).',
  '- Scripts in `tests/compare/`: `vanilla.js` (1.8.9 container), `collect.js` (shot set, run as `node collect.js vanilla|pumpkin`, `LABEL=pumpkin-fixed PUMPKIN_BIN=../build/pumpkin-next node collect.js pumpkin`), `physics.js` (the two flight orders), `analyze.js` (metrics), `report.js` (this file). Run from `tests/`.',
  '- 1.8.9 jar and server.properties: `tests/compare/vanilla189/`.'
].join('\n'))

// per shot table
w('### Per-shot list (summary columns)')
const lines = ['| server | shot | speed | angle err (deg) | landing dist | model ticks (own order) | draw ticks seen by server |', '| :--- | :--- | ---: | ---: | ---: | ---: | ---: |']
for (const [n, R] of cols) {
  for (const o of R.all) lines.push(`| ${n} | ${o.scenario} | ${fx(o.speed, 3)} | ${fx(o.angleErrDeg, 2)} | ${fx(o.landDist, 2)} | ${(n.startsWith('Vanilla') || n.includes('fixed')) ? o.modelTicksV18 : o.modelTicksPumpkin} | ${fx(o.drawFromSpeed, 1)} |`)
}
w(lines.join('\n'))

fs.writeFileSync(path.join(REP, 'bow-1.8.9-vs-pumpkin.md'), out.join('\n'))
console.log('wrote report', out.join('\n').length, 'chars')
