// Bow / projectile spec: arrow launch velocity, shooter-motion independence, damage, Power, Punch, knockback source.
//
// Measurement method: the observer bot (BowT) and the shooter bot (BowS) both record the raw 1.8 packets
//   spawn_entity (type = the registry id of minecraft:arrow, position as doubles, velocity in blocks/tick),
//   entity_velocity, entity_teleport / entity_*_move for every arrow, and update_health + entity_velocity for themselves.
// The arrow's initial velocity is the velocity in the spawn packet (plus any later correcting entity_velocity packet).
// As a cross check each arrow is also read server-side with `data get entity @n[type=arrow] Motion` right after spawn.
//
// Reusable by 41-bow-control (module.exports.lib).
const path = require('path')
const { waitForGameStart, waitFor, sleep, countItem, teamOf } = require('../harness/bots')
const { loadMap } = require('../play/map')

const now = () => performance.now()
const D2R = Math.PI / 180

// ---------------------------------------------------------------- small vector helpers
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const len = a => Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z
const scale = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s })
const angleDeg = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))) / D2R
const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length
const std = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, xs.length - 1)) }
const r3 = x => Math.round(x * 1000) / 1000
const rv = v => v && ({ x: r3(v.x), y: r3(v.y), z: r3(v.z) })

/** mineflayer look vector for yaw/pitch (radians, pitch + = up). */
const dirOf = (yaw, pitch) => ({ x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) })
const yawTo = (dx, dz) => Math.atan2(-dx, -dz)

const ticks = (bot, n) => new Promise(resolve => {
  let i = 0
  const f = () => { if (++i >= n) { bot.removeListener('physicsTick', f); resolve() } }
  bot.on('physicsTick', f)
})

// ---------------------------------------------------------------- test platform (map independent)
// The map is read from the arena file at runtime (tests/play/map.js). Nothing about the map is hard coded: the shooting range is a
// flat stone platform that the spec builds with /fill high above the map (above the arena's top bound), centred on the middle of the
// map, so the same measurements work on every map.
let PLAT = null
const P = (dx, dz, dy = 0) => ({ x: PLAT.cx + dx, y: PLAT.y + dy, z: PLAT.cz + dz })
const PLAT_X = 14 // platform half width (x)
const PLAT_Z0 = -44 // platform extent in z, relative to the centre
const PLAT_Z1 = 16

async function buildPlatform (ctx) {
  const map = loadMap()
  const mid = map.named('middle', map.teamNames[0])
  const cx = Math.floor(mid.x) + 0.5
  const cz = Math.floor(mid.z) + 0.5
  const y = Math.max(map.bounds.max[1], map.walkY) + 20
  if (y + 40 > 310) throw new Error(`arena too tall for the shooting platform (platform y ${y}, build limit 319)`)
  PLAT = { cx, cz, y, mapName: map.name, voidY: map.voidY, map }
  const [x1, x2] = [Math.floor(cx - PLAT_X), Math.floor(cx + PLAT_X)]
  const [z1, z2] = [Math.floor(cz + PLAT_Z0), Math.floor(cz + PLAT_Z1)]
  await ctx.server.cmd(`forceload add ${x1} ${z1} ${x2} ${z2}`)
  let out = ''
  for (let i = 0; i < 20; i++) {
    out = await ctx.server.cmd(`fill ${x1} ${y - 1} ${z1} ${x2} ${y - 1} ${z2} minecraft:stone`)
    if (/Successfully filled|Changed the block/i.test(out)) break
    await sleep(500)
  }
  // headroom: clear any block (e.g. leftover spectator cages) 40 blocks above the platform
  await ctx.server.cmd(`fill ${x1} ${y} ${z1} ${x2} ${y + 40} ${z2} minecraft:air`)
  ctx.t.log('platform', { cx, cz, y, x1, x2, z1, z2, map: map.name, fill: out })
  if (!/Successfully filled|Changed the block/i.test(out)) throw new Error('could not build the shooting platform: ' + out)
}

// ---------------------------------------------------------------- packet spy
function attachSpy (bot) {
  const spy = { arrows: new Map(), selfVel: [], health: [], dings: [], sounds: [], onSpawn: null }
  bot._client.on('spawn_entity', p => {
    if (p.type !== bot.registry.entitiesByName.arrow.id) return
    const a = {
      id: p.entityId,
      t: now(),
      owner: p.objectData,
      pos: { x: p.x, y: p.y, z: p.z },
      vel: p.velocity ? { x: p.velocity.x, y: p.velocity.y, z: p.velocity.z } : null,
      later: [],
      cur: { x: p.x, y: p.y, z: p.z } // the position the client knows, updated by the move packets below
    }
    spy.arrows.set(a.id, a)
    if (spy.onSpawn) { try { spy.onSpawn(a) } catch (e) {} }
  })
  bot._client.on('entity_velocity', p => {
    const v = { x: p.velocity.x, y: p.velocity.y, z: p.velocity.z }
    const a = spy.arrows.get(p.entityId)
    if (a) a.later.push({ t: now(), kind: 'velocity', v })
    if (bot.entity && p.entityId === bot.entity.id) spy.selfVel.push({ t: now(), v })
  })
  for (const name of ['sync_entity_position', 'entity_teleport', 'rel_entity_move', 'entity_move_look']) {
    bot._client.on(name, p => {
      const a = spy.arrows.get(p.entityId)
      if (!a) return
      if (p.dX !== undefined) { a.cur.x += p.dX / 4096; a.cur.y += p.dY / 4096; a.cur.z += p.dZ / 4096 } else { a.cur = { x: p.x, y: p.y, z: p.z } }
      a.later.push({ t: now(), kind: name, p: { dX: p.dX, dY: p.dY, dZ: p.dZ, x: p.x, y: p.y, z: p.z }, pos: { ...a.cur } })
    })
  }
  bot._client.on('update_health', p => spy.health.push({ t: now(), health: p.health }))
  // the shooter's "ding" for an arrow that hurt a player: game event 6 (1.8 S2BPacketChangeGameState(6))
  bot._client.on('game_state_change', p => { if (p.reason === 'play_arrow_hit_sound' || p.reason === 6) spy.dings.push({ t: now() }) })
  // sounds by registry id: the packet's sound holder carries id + 1 (0 = inline sound event), which mineflayer does not undo
  bot._client.on('sound_effect', p => {
    const name = p.sound && p.sound.data ? p.sound.data.soundName : (bot.registry.sounds[(p.sound ? p.sound.soundId : p.soundId) - 1] || {}).name
    spy.sounds.push({ t: now(), name: String(name), pos: { x: p.x / 8, y: p.y / 8, z: p.z / 8 } })
  })
  return spy
}

// ---------------------------------------------------------------- game / item setup
async function setupGame (t) {
  const S = await t.bot('BowS')
  const T = await t.bot('BowT')
  const spyS = attachSpy(S)
  const spyT = attachSpy(T)
  await Promise.all([waitForGameStart(S), waitForGameStart(T)])
  await sleep(1500)
  const ctx = { t, server: t.server, S, T, spyS, spyT, teams: { S: teamOf(S), T: teamOf(T) } }
  await t.server.cmd('gamemode survival BowS')
  await t.server.cmd('gamemode survival BowT')
  await t.server.cmd('clear BowS')
  await t.server.cmd('clear BowT')
  await buildPlatform(ctx)
  // Natural regeneration off: OCM's old-player-regen heals 1 HP in the tick right after a hit when the last heal is >3 s ago; if that lands in the
  // same tick as the damage the client sees a single health packet (-3+1) and the measured arrow damage would be one too low (~2 % of the shots).
  let gr = await ctx.server.cmd('gamerule natural_health_regeneration false')
  if (!/false/i.test(gr)) gr = await ctx.server.cmd('gamerule naturalRegeneration false')
  ctx.t.log('gamerule regeneration off:', gr)
  return ctx
}

async function giveBow (ctx, enchants) {
  const { server, S } = ctx
  await server.cmd('clear BowS minecraft:bow')
  ctx.bowEnchants = enchants
  ctx.heldName = 'bow'
  const comp = enchants ? `[minecraft:enchantments={${enchants}}]` : ''
  const out = await server.cmd(`give BowS minecraft:bow${comp} 1`)
  if (!/Gave 1/.test(out)) ctx.t.log('give bow output:', out)
  if (countItem(S, 'arrow') < 8) await server.cmd('give BowS minecraft:arrow 64')
  await waitFor(() => { S.setQuickBarSlot(0); return S.heldItem && S.heldItem.name === 'bow' }, { timeout: 5000, what: 'bow in hand' })
  await sleep(200)
}

/** Makes sure the shooter is alive, healthy, holds the bow and has arrows (a fall or a stray arrow may have killed it). */
async function ensureReady (ctx) {
  const { server, S, T } = ctx
  for (const bot of [S, T]) {
    if (ctx.placed && (!bot.entity || bot.health <= 0 || bot.entity.position.y < PLAT.y - 12 || bot.entity.position.y > PLAT.y + 40 || Math.abs(bot.entity.position.x - PLAT.cx) > 40)) {
      ctx.t.log(`${bot.username} needs recovery (health ${bot.health}, y ${bot.entity && bot.entity.position.y})`)
      await sleep(5500) // respawn protection
    }
  }
  await server.cmd('effect give BowS minecraft:instant_health 1 10 true')
  await server.cmd('effect give BowS minecraft:resistance 20 5 true')
  if ((ctx.heldName || 'bow') === 'bow' && !(S.heldItem && S.heldItem.name === 'bow')) {
    ctx.t.log('re-giving the bow (inventory lost?)', ctx.bowEnchants || null)
    await giveBow(ctx, ctx.bowEnchants || null)
  }
  if (countItem(S, 'arrow') < 6) { await server.cmd('give BowS minecraft:arrow 64'); await sleep(300) }
}

async function settle (bot, timeout = 4000) {
  await waitFor(() => bot.entity.onGround && Math.hypot(bot.entity.velocity.x, bot.entity.velocity.z) < 0.03 && Math.abs(bot.entity.velocity.y) < 0.1,
    { timeout, what: `${bot.username} to settle` })
  await ticks(bot, 2)
}

async function placeBot (ctx, bot, x, y, z, { air = false } = {}) {
  ctx.placed = true
  await ctx.server.cmd(`tp ${bot.username} ${x} ${y} ${z}`)
  await waitFor(() => Math.abs(bot.entity.position.x - x) < 0.6 && Math.abs(bot.entity.position.z - z) < 0.6 && Math.abs(bot.entity.position.y - y) < 1.5,
    { timeout: 5000, what: `${bot.username} to arrive at ${x} ${y} ${z}` })
  if (!air) await settle(bot)
}

/** 1.8 arrow flight: pos += v; v *= 0.99; vy -= 0.05. Returns pitch (rad) that hits height dy at horizontal distance dist. */
function solvePitch (dist, dy, speed = 3.0) {
  const heightAt = pitch => {
    let x = 0; let y = 0; let vx = Math.cos(pitch) * speed; let vy = Math.sin(pitch) * speed
    for (let i = 0; i < 400; i++) {
      const nx = x + vx; const ny = y + vy
      if (nx >= dist) return y + (ny - y) * ((dist - x) / (nx - x))
      x = nx; y = ny
      vx *= 0.99; vy *= 0.99; vy -= 0.05
    }
    return -1e9
  }
  let lo = -20 * D2R; let hi = 45 * D2R
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (heightAt(mid) < dy) lo = mid; else hi = mid
  }
  return (lo + hi) / 2
}

// ---------------------------------------------------------------- motion / launch-velocity measurements
const FACE_X = -Math.PI / 2 // looking along +x
const SCENARIOS = (() => {
  const L = []
  const add = (name, o) => L.push({ name, group: o.group, ...o })
  // standing, many pitches (degrees, + = up)
  for (let i = 0; i < 8; i++) add(`stand p0 #${i}`, { group: 'stand', motion: 'stand', pitch: 0, draw: 22 })
  for (const p of [-70, -45, -20, 20, 45, 70]) add(`stand p${p}`, { group: 'stand-pitch', motion: 'stand', pitch: p, draw: 22 })
  // partial draws
  for (const d of [5, 10, 15]) add(`partial draw ${d}`, { group: 'partial', motion: 'stand', pitch: 10, draw: d })
  // shooter motion
  for (const p of [0, 25, -25]) for (let i = 0; i < 2; i++) add(`jump p${p} #${i}`, { group: 'jump', motion: 'jump', pitch: p, draw: 22 })
  for (const p of [0, -25]) for (let i = 0; i < 2; i++) add(`fall p${p} #${i}`, { group: 'fall', motion: 'fall', pitch: p, draw: 21 })
  for (const p of [0, 25, -25]) for (let i = 0; i < 2; i++) add(`sprint p${p} #${i}`, { group: 'sprint', motion: 'sprint', pitch: p, draw: 22 })
  for (const dir of ['left', 'right']) for (let i = 0; i < 2; i++) add(`strafe ${dir} #${i}`, { group: 'strafe', motion: 'strafe-' + dir, pitch: 0, draw: 22 })
  for (let i = 0; i < 2; i++) add(`sprint-jump #${i}`, { group: 'sprintjump', motion: 'sprintjump', pitch: 5, draw: 22 })
  return L
})()

async function measureShot (ctx, sc) {
  const { server, S, T, spyS, spyT } = ctx
  await server.cmd('kill @e[type=minecraft:arrow]')
  await ensureReady(ctx)
  const yaw = FACE_X
  const pitch = sc.pitch * D2R
  // positions (island of the middle, x -7..7, z -7..7). The observer is parked in a corner, off every arrow lane.
  const rel = {
    stand: [0, 0, -3], jump: [0, 0, -3], fall: [0, 24, -3],
    sprint: [-7, 0, -3], sprintjump: [-7, 0, -3],
    'strafe-right': [0, 0, -5], 'strafe-left': [0, 0, 5]
  }[sc.motion]
  const start = P(rel[0], rel[2], rel[1])
  await placeBot(ctx, T, ...Object.values(P(-8, 8)))
  await placeBot(ctx, S, start.x, start.y, start.z, { air: sc.motion === 'fall' })
  await S.look(yaw, pitch, true)
  await ticks(S, 3)

  const rec = { name: sc.name, group: sc.group, motion: sc.motion, pitchDeg: sc.pitch, draw: sc.draw }
  // per-tick displacement of the shooter (this is what the server sees as its movement; entity.velocity is post-friction)
  const hist = []
  const onTick = () => { hist.push({ x: S.entity.position.x, y: S.entity.position.y, z: S.entity.position.z }); if (hist.length > 3) hist.shift() }
  S.on('physicsTick', onTick)
  let probe = null
  const seenBefore = new Set([...spyS.arrows.keys()])
  spyS.onSpawn = a => {
    const tReq = now()
    server.cmd('execute at BowS run data get entity @n[type=minecraft:arrow] Motion').then(out => {
      probe = { out, ageTicks: (now() - a.t) / 50, reqAfterMs: tReq - a.t }
    }).catch(() => {})
  }

  const sampleState = () => {
    rec.shooter = {
      v: rv(S.entity.velocity), onGround: S.entity.onGround, pos: rv(S.entity.position),
      yaw: S.entity.yaw, pitch: S.entity.pitch, horiz: r3(Math.hypot(S.entity.velocity.x, S.entity.velocity.z))
    }
    const dd = hist.length >= 2 ? sub(hist[hist.length - 1], hist[hist.length - 2]) : { x: 0, y: 0, z: 0 }
    rec.shooter.d = rv(dd)
    rec.shooter.dHoriz = r3(Math.hypot(dd.x, dd.z))
    rec.shooterPos = { x: S.entity.position.x, y: S.entity.position.y, z: S.entity.position.z }
  }
  const release = () => {
    sampleState()
    rec.tRelease = now()
    S.deactivateItem()
  }

  const m = sc.motion
  if (m === 'stand') {
    S.activateItem(); const t0 = now()
    await ticks(S, sc.draw); rec.drawMs = now() - t0
    release()
  } else if (m === 'fall') {
    S.activateItem(); const t0 = now()
    await ticks(S, sc.draw); rec.drawMs = now() - t0
    release()
  } else if (m === 'jump' || m === 'sprintjump') {
    if (m === 'sprintjump') { S.setControlState('forward', true); S.setControlState('sprint', true); await ticks(S, 4) }
    S.activateItem(); const t0 = now()
    await ticks(S, sc.draw - 2); rec.drawMs = now() - t0
    S.setControlState('jump', true)
    await new Promise((resolve, reject) => {
      let n = 0
      let air = 0
      const f = () => {
        n++
        air = S.entity.onGround ? 0 : air + 1
        // release on the 3rd airborne tick (still rising, vy~0.16): the server has then already received airborne movement packets
        // with dy>0, so a shooter-momentum bug would see the upward motion (on the 1st airborne tick the server still sees "on ground, dy=0")
        if ((air >= 3 && S.entity.velocity.y > 0.1) || n > 40) {
          S.removeListener('physicsTick', f)
          rec.drawMs = now() - t0
          release()
          S.setControlState('jump', false)
          n > 40 ? reject(new Error('never rose')) : resolve()
        }
      }
      S.on('physicsTick', f)
    })
  } else if (m === 'sprint') {
    S.setControlState('forward', true); S.setControlState('sprint', true)
    await ticks(S, 4)
    S.activateItem(); const t0 = now()
    await ticks(S, sc.draw); rec.drawMs = now() - t0
    release()
  } else if (m.startsWith('strafe-')) {
    S.setControlState(m.slice(7), true)
    await ticks(S, 4)
    S.activateItem(); const t0 = now()
    await ticks(S, sc.draw); rec.drawMs = now() - t0
    release()
  }
  for (const k of ['forward', 'sprint', 'left', 'right', 'jump', 'back']) S.setControlState(k, false)
  S.removeListener('physicsTick', onTick)

  // collect the new arrow on both bots
  const findNew = spy => [...spy.arrows.values()].find(a => !seenBefore.has(a.id) && a.t >= rec.tRelease - 20)
  const gotS = await waitFor(() => findNew(spyS), { timeout: 2500, what: 'arrow spawn (shooter)' }).catch(() => null)
  if (!gotS) { rec.noArrow = true; return rec }
  await sleep(450)
  const gotT = findNew(spyT) // observer sees the same entity id
  const arrowT = gotT && spyT.arrows.get(gotS.id)
  rec.spawnMs = gotS.t - rec.tRelease
  rec.spawnVel = gotS.vel
  rec.spawnPos = gotS.pos
  rec.owner = gotS.owner
  // last velocity packet within 250 ms after spawn is the effective velocity on the client
  const laterVel = gotS.later.filter(l => l.kind === 'velocity' && l.t - gotS.t < 250)
  rec.laterVelPackets = laterVel.length
  rec.laterVelList = gotS.later.filter(l => l.kind === 'velocity').map(l => ({ dtMs: Math.round(l.t - gotS.t), v: rv(l.v) }))
  // a "correction" is a later velocity packet (within 150 ms) that is not a stop (arrow stuck in a block) and differs from the spawn velocity
  // A velocity packet is a correction when it differs from what the client predicts itself (spawn velocity after k
  // ticks of 1.8 flight). Modern vanilla's tracker sends one sync on the first tick (`tickCount % updateInterval == 0`),
  // which matches the prediction for k = 1.
  const predicted = k => { const v = rec.spawnVel; const d = 0.99 ** k; return { x: v.x * d, y: v.y * d - 0.05 * (1 - d) / 0.01, z: v.z * d } }
  rec.corrections = rec.laterVelList.filter(l => l.dtMs < 150 && len(l.v) > 0.05 && !(rec.spawnVel && [0, 1, 2, 3, 4].some(k => len(sub(l.v, predicted(k))) < 0.01))).length
  rec.effVel = laterVel.length ? laterVel[laterVel.length - 1].v : gotS.vel
  rec.laterMoves = gotS.later.filter(l => l.kind !== 'velocity' && l.t - gotS.t < 250).length
  // Server position vs. 1.8 flight (move with the current motion, then *0.99, then -0.05): the height the first synced
  // position has, compared with the 1.8 path at the same horizontal distance. Only while the arrow still flies.
  const firstMove = gotS.later.find(l => l.kind !== 'velocity')
  const flying = firstMove && gotS.later.some(l => l.kind === 'velocity' && Math.abs(l.t - firstMove.t) < 30 && len(l.v) > 0.05)
  if (firstMove && flying && rec.spawnVel) {
    const h0 = Math.hypot(firstMove.pos.x - gotS.pos.x, firstMove.pos.z - gotS.pos.z)
    let ph = 0; let py = 0; let v = { ...rec.spawnVel }
    for (let k = 0; k < 60; k++) {
      const nh = ph + Math.hypot(v.x, v.z); const ny = py + v.y
      if (nh >= h0 - 1e-9) { const f = nh > ph ? (h0 - ph) / (nh - ph) : 1; rec.firstSync = { ticks: r3(k + f), heightError: r3(firstMove.pos.y - gotS.pos.y - (py + (ny - py) * f)) }; break }
      ph = nh; py = ny; v = { x: v.x * 0.99, y: v.y * 0.99 - 0.05, z: v.z * 0.99 }
    }
  }
  rec.observerVel = arrowT ? arrowT.vel : null
  rec.speed = rec.spawnVel ? len(rec.spawnVel) : null
  rec.effSpeed = rec.effVel ? len(rec.effVel) : null
  const dir = dirOf(rec.shooter.yaw, rec.shooter.pitch)
  rec.dir = dir
  if (rec.spawnVel) {
    rec.dirErrDeg = angleDeg(rec.spawnVel, dir)
    rec.residual = sub(rec.spawnVel, scale(dir, 3.0)) // vs a perfect fully drawn arrow
    rec.residualMag = len(rec.residual)
    // component of the residual that points along the shooter's own motion
    const sv = rec.shooter.d
    const svm = len(sv)
    rec.inherited = svm > 0.01 ? dot(rec.residual, sv) / (svm * svm) : null
    // spawn offset relative to the shooter
    const f = { x: -Math.sin(rec.shooter.yaw), y: 0, z: -Math.cos(rec.shooter.yaw) }
    const r = { x: -f.z, y: 0, z: f.x }
    const rel = sub(rec.spawnPos, rec.shooterPos)
    rec.offset = { fwd: r3(dot(rel, f)), right: r3(dot(rel, r)), up: r3(rel.y - 1.62) }
  }
  // server-side check
  await waitFor(() => probe, { timeout: 2000, what: 'server probe' }).catch(() => null)
  if (probe) {
    const mm = /\[([-0-9.eE]+)d, ([-0-9.eE]+)d, ([-0-9.eE]+)d\]/.exec(probe.out)
    rec.server = { raw: probe.out.slice(0, 120), ageTicks: r3(probe.ageTicks) }
    if (mm) {
      rec.server.motion = { x: +mm[1], y: +mm[2], z: +mm[3] }
      // the probe runs within ~0-2 ticks of the spawn (ageTicks ~0.02 measured): horizontal speed decays by 0.99 per tick
      const hs = Math.hypot(rec.server.motion.x, rec.server.motion.z)
      const hp = Math.hypot(rec.spawnVel.x, rec.spawnVel.z)
      let best = 1e9
      for (let k = 0; k <= 2; k++) best = Math.min(best, Math.abs(hs - hp * Math.pow(0.99, k)))
      rec.server.horizMismatch = r3(best)
      const hd = angleDeg({ x: rec.server.motion.x, y: 0, z: rec.server.motion.z }, { x: rec.spawnVel.x, y: 0, z: rec.spawnVel.z })
      rec.server.horizAngleDeg = r3(Number.isNaN(hd) ? 0 : hd)
    }
  }
  spyS.onSpawn = null
  return rec
}

/** Runs all movement scenarios, returns the list of measurement records. */
async function runMovementSuite (ctx, { only } = {}) {
  await giveBow(ctx, null)
  const out = []
  for (const sc of SCENARIOS) {
    if (only && !only(sc)) continue
    let rec
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        rec = await measureShot(ctx, sc)
        if (!rec.noArrow) break
      } catch (e) {
        ctx.t.log(`scenario ${sc.name} attempt ${attempt} failed: ${e.message}`)
        rec = { name: sc.name, group: sc.group, error: e.message }
        for (const k of ['forward', 'sprint', 'left', 'right', 'jump', 'back']) ctx.S.setControlState(k, false)
      }
    }
    out.push(rec)
    ctx.t.log(`shot ${rec.name}: ` + JSON.stringify({
      spawnVel: rv(rec.spawnVel), effVel: rv(rec.effVel), speed: rec.speed && r3(rec.speed), dirErrDeg: rec.dirErrDeg && r3(rec.dirErrDeg),
      residual: rv(rec.residual), inherited: rec.inherited && r3(rec.inherited), shooterD: rec.shooter && rec.shooter.d, shooterV: rec.shooter && rec.shooter.v, onGround: rec.shooter && rec.shooter.onGround,
      offset: rec.offset, laterVel: rec.laterVelList, laterMoves: rec.laterMoves, server: rec.server && rec.server.motion && { m: rv(rec.server.motion), mis: rec.server.horizMismatch, ang: rec.server.horizAngleDeg, age: rec.server.ageTicks },
      error: rec.error, noArrow: rec.noArrow
    }))
  }
  await ctx.server.cmd('kill @e[type=minecraft:arrow]')
  return out
}

// uses the per-tick displacement r.shooter.d (blocks/tick), which is what the server sees as the shooter's movement
const MOTION_PRECONDITION = {
  jump: r => r.shooter && !r.shooter.onGround && r.shooter.d.y > 0.15,
  sprintjump: r => r.shooter && !r.shooter.onGround && r.shooter.d.y > 0.15 && r.shooter.dHoriz > 0.2,
  fall: r => r.shooter && !r.shooter.onGround && r.shooter.d.y < -0.5,
  sprint: r => r.shooter && r.shooter.dHoriz > 0.24,
  strafe: r => r.shooter && r.shooter.dHoriz > 0.18
}

// ---------------------------------------------------------------- damage / knockback shots
const SHOOT_FROM = () => P(0, -5)
const TARGET_AT = () => P(0, 3)

/**
 * One shot at the target bot. Returns { hit, damage, vel[], ... }.
 *   opts.draw      ticks to draw (22 = full)
 *   opts.from/at   shooter / target positions
 *   opts.trick     {x,y,z}: teleport the shooter there as soon as the arrow spawns
 */
async function hitShot (ctx, opts = {}) {
  const { server, S, T, spyS, spyT } = ctx
  const from = opts.from || SHOOT_FROM()
  const at = opts.at || TARGET_AT()
  const draw = opts.draw || 22
  for (let attempt = 0; attempt < 5; attempt++) {
    await server.cmd('kill @e[type=minecraft:arrow]')
    await ensureReady(ctx)
    await server.cmd('effect give BowT minecraft:instant_health 1 10 true')
    await placeBot(ctx, S, from.x, from.y, from.z)
    await placeBot(ctx, T, at.x, at.y, at.z)
    await waitFor(() => T.health >= 19.99, { timeout: 4000, what: 'target healed' })
    const dx = at.x - from.x; const dz = at.z - from.z
    const dist = Math.hypot(dx, dz)
    const speed = 3 * ((((draw / 20) ** 2) + 2 * (draw / 20)) / 3 > 1 ? 1 : (((draw / 20) ** 2) + 2 * (draw / 20)) / 3)
    const yaw = yawTo(dx, dz)
    const pitch = solvePitch(dist, 1.05 - 1.52, speed)
    await S.look(yaw, pitch, true)
    await ticks(S, 3)
    const h0 = T.health
    const idx = spyT.selfVel.length
    spyS.onSpawn = a => { if (opts.trick) server.cmd(`tp BowS ${opts.trick.x} ${opts.trick.y} ${opts.trick.z}`).catch(() => {}) }
    const seenBefore = new Set([...spyS.arrows.keys()])
    S.activateItem()
    await ticks(S, draw)
    const tRelease = now()
    const shooterPos = { x: S.entity.position.x, y: S.entity.position.y, z: S.entity.position.z }
    S.deactivateItem()
    const hit = await waitFor(() => T.health < h0 - 0.01 && spyT.health.filter(h => h.t > tRelease).length, { timeout: 3500, step: 20, what: 'hit' }).catch(() => null)
    spyS.onSpawn = null
    const arrow = [...spyS.arrows.values()].find(a => !seenBefore.has(a.id))
    if (!hit) continue
    await sleep(350)
    const hitT = spyT.health.find(h => h.t > tRelease).t
    const damage = h0 - Math.min(...spyT.health.filter(h => h.t > tRelease && h.t < hitT + 400).map(h => h.health))
    const vels = spyT.selfVel.slice(idx).filter(v => v.t >= hitT - 150 && v.t < hitT + 300)
    const last = vels.length ? vels[vels.length - 1].v : null
    const dings = spyS.dings.filter(d => d.t > tRelease && d.t < hitT + 350).length
    const hitSounds = spyS.sounds.filter(x => x.t > tRelease && x.t < hitT + 350 && x.name === 'entity.arrow.hit').map(x => x.name)
    const sounds = spyS.sounds.filter(x => x.t > tRelease && x.t < hitT + 350).map(x => x.name)
    return {
      hit: true, attempts: attempt + 1, damage, h0, arrowSpeed: arrow && arrow.vel ? len(arrow.vel) : null, arrowVel: arrow && arrow.vel, dings, hitSounds, sounds,
      velPackets: vels.map(v => ({ dt: Math.round(v.t - hitT), ...rv(v.v) })), last, shooterPos,
      horiz: last ? Math.hypot(last.x, last.z) : null, vert: last ? last.y : null,
      ms: Math.round(hitT - tRelease)
    }
  }
  return { hit: false }
}

const ceilDmg = (speed, dmg) => Math.ceil(speed * dmg)

module.exports = {
  name: '40-bow',
  timeout: 540000,
  lib: { setupGame, giveBow, runMovementSuite, hitShot, MOTION_PRECONDITION, attachSpy, mean, std, len, dot, sub, r3, rv, angleDeg, placeBot, ticks, solvePitch },

  async run (t) {
    const ctx = await setupGame(t)
    t.log('teams', ctx.teams)
    t.check('shooter and observer are on different teams (no friendly-fire protection in the way)', ctx.teams.S !== ctx.teams.T, ctx.teams)

    // BOW_SECTIONS=E (letters) runs only those sections, for quick checks while working on one of them
    const want = section => !process.env.BOW_SECTIONS || process.env.BOW_SECTIONS.toUpperCase().includes(section)

    // ======================================================== A. launch velocity vs. shooter motion
    if (want('A')) {
    const recs = await runMovementSuite(ctx)
    const bad = recs.filter(r => r.noArrow || r.error || !r.spawnVel)
    t.check('every scripted shot produced an arrow spawn packet carrying velocity', bad.length === 0 && recs.length === SCENARIOS.length, { shots: recs.length, bad: bad.map(b => b.name) })
    const good = recs.filter(r => r.spawnVel)
    const G = g => good.filter(r => r.group === g)
    const speedOk = rs => rs.every(r => Math.abs(r.speed - 3.0) < 0.1)

    // standing, level
    const st = G('stand')
    const stRes = st.flatMap(r => [r.residual.x, r.residual.y, r.residual.z])
    t.check('standing full draw: arrow speed 3.0 blocks/tick (every shot +-0.1, mean +-0.03)', st.length >= 6 && speedOk(st) && Math.abs(mean(st.map(r => r.speed)) - 3.0) < 0.03,
      { n: st.length, mean: r3(mean(st.map(r => r.speed))), min: r3(Math.min(...st.map(r => r.speed))), max: r3(Math.max(...st.map(r => r.speed))) })
    t.check('standing full draw: arrow flies along the look direction (< 2 deg; gaussian sigma 0.43 deg per axis)', st.length >= 6 && st.every(r => r.dirErrDeg < 2), { maxDeg: r3(Math.max(...st.map(r => r.dirErrDeg))) })
    const sd = std(stRes)
    t.check('1.8 gaussian spread present (per-axis sigma 0.0225 expected, accept 0.006..0.05)', sd > 0.006 && sd < 0.05, { sigmaPerAxis: r3(sd), samples: stRes.length, vanilla18: 0.0225 })
    // pitches
    const sp = [...st, ...G('stand-pitch')]
    t.check('speed 3.0 and correct direction at every pitch (-70..+70 deg)', G('stand-pitch').length === 6 && speedOk(G('stand-pitch')) && G('stand-pitch').every(r => r.dirErrDeg < 2),
      G('stand-pitch').map(r => ({ p: r.pitchDeg, speed: r3(r.speed), err: r3(r.dirErrDeg), v: rv(r.spawnVel) })))
    // origin
    const offs = st.map(r => r.offset)
    // 1.8 spawned 0.16 to the right of the eyes; the fork starts on the look ray like 26.x (user's choice, playtest 1 point 14)
    t.check('spawn origin on the look ray (no sideways offset), 0.10 below eye height, none forward',
      offs.length >= 6 && offs.every(o => Math.abs(o.right) < 0.07 && Math.abs(o.up + 0.1) < 0.07 && Math.abs(o.fwd) < 0.1),
      { meanRight: r3(mean(offs.map(o => o.right))), meanUp: r3(mean(offs.map(o => o.up))), meanFwd: r3(mean(offs.map(o => o.fwd))) })

    // motion groups
    for (const [label, g, pre] of [
      ['jumping (rising)', 'jump', 'jump'], ['falling', 'fall', 'fall'], ['sprinting forward', 'sprint', 'sprint'],
      ['strafing sideways', 'strafe', 'strafe'], ['sprint-jumping', 'sprintjump', 'sprintjump']
    ]) {
      const rs = G(g)
      const moving = rs.filter(MOTION_PRECONDITION[pre])
      t.check(`[precondition] bot really was ${label} at release`, rs.length > 0 && moving.length === rs.length,
        rs.map(r => ({ name: r.name, moveBlocksPerTick: r.shooter.d, onGround: r.shooter.onGround })))
      t.check(`${label}: arrow velocity is independent of shooter motion (|v - 3.0*look| < 0.10, speed 3.0+-0.1)`,
        rs.length > 0 && rs.every(r => r.residualMag < 0.10) && speedOk(rs),
        rs.map(r => ({ n: r.name, speed: r3(r.speed), res: r3(r.residualMag), inh: r.inherited && r3(r.inherited), moveBlocksPerTick: r.shooter.d })))
    }
    // all the motion groups pooled: mean speed same as standing
    const moved = ['jump', 'fall', 'sprint', 'strafe', 'sprintjump'].flatMap(G)
    t.check('moving shots: mean arrow speed equals standing mean (+-0.03)', moved.length > 0 && Math.abs(mean(moved.map(r => r.speed)) - mean(st.map(r => r.speed))) < 0.03,
      { moving: r3(mean(moved.map(r => r.speed))), standing: r3(mean(st.map(r => r.speed))) })

    // partial draw
    const pd = G('partial').sort((a, b) => a.draw - b.draw)
    const implied = r => 20 * (-1 + Math.sqrt(1 + 3 * (r.speed / 3)))
    t.check('partial draw is slower, grows with draw time and follows the 1.8 curve f=(t^2+2t)/3',
      pd.length === 3 && pd[0].speed < pd[1].speed && pd[1].speed < pd[2].speed && pd[2].speed < 2.7 && pd.every(r => Math.abs(implied(r) - r.draw) < 1.5 && Math.abs(r.speed - 3 * (((r.draw / 20) ** 2) + 2 * (r.draw / 20)) / 3) < 0.15),
      pd.map(r => ({ draw: r.draw, speed: r3(r.speed), impliedTicks: r3(implied(r)), expected: r3(3 * (((r.draw / 20) ** 2) + 2 * (r.draw / 20)) / 3) })))

    // consistency between the two clients and the server
    const both = good.filter(r => r.observerVel)
    t.check('observer receives the same arrow velocity as the shooter', both.length === good.length &&
      both.every(r => len(sub(r.observerVel, r.spawnVel)) < 0.002), { shots: good.length, observed: both.length })
    // (a steep downward shot can already be stuck in the floor when the probe runs: Motion is 0 then, nothing to compare)
    const probes = good.filter(r => r.server && r.server.motion && len(r.server.motion) > 0.05)
    t.check('spawn-packet velocity matches the server-side arrow Motion (horizontal, after <=2 ticks of drag; <0.02 b/t, <2 deg)',
      probes.length >= good.length - 3 && probes.every(r => r.server.horizMismatch < 0.02 && r.server.horizAngleDeg < 2),
      { probed: probes.length, of: good.length, worst: r3(Math.max(...probes.map(r => r.server.horizMismatch))), worstAngle: r3(Math.max(...probes.map(r => r.server.horizAngleDeg))), ages: r3(mean(probes.map(r => r.server.ageTicks))) })
    const synced = good.filter(r => r.firstSync)
    t.check('the server arrow flies the 1.8 path: first synced position within 0.01 blocks of it (no drop before the first move)',
      synced.length >= good.length / 2 && synced.every(r => Math.abs(r.firstSync.heightError) < 0.01),
      { synced: synced.length, of: good.length, worst: synced.map(r => ({ n: r.name, ...r.firstSync })).sort((a, b) => Math.abs(b.heightError) - Math.abs(a.heightError)).slice(0, 5) })
    t.check('no velocity-correction packets after the spawn packet (only syncs that match the client prediction)', good.every(r => r.corrections === 0),
      { withCorrections: good.filter(r => r.corrections > 0).map(r => ({ n: r.name, later: r.laterVelList, spawn: rv(r.spawnVel) })) })

    }

    // ======================================================== B. damage
    if (want('B')) {
    const pre = await ctx.server.cmd('data get entity BowT Inventory')
    t.log('target inventory', pre)
    await giveBow(ctx, null)
    const full = []
    for (let i = 0; i < 10; i++) full.push(await hitShot(ctx))
    const fh = full.filter(r => r.hit)
    const fd = fh.map(r => r.damage)
    t.log('full draw damage', fd, 'speeds', fh.map(r => r3(r.arrowSpeed)))
    t.check('full-draw arrow hits an unarmoured target 10/10 times at 8 blocks', fh.length === 10, { hits: fh.length })
    t.check('full draw damage: base ceil(3*2)=6 (3 hearts) plus 1.8 crit bonus, so every hit within 6..10 and integral',
      fh.length >= 8 && fh.every(r => {
        const base = ceilDmg(r.arrowSpeed, 2) // impact speed is a few % lower than launch speed, so the real base can be one lower
        return r.damage >= ceilDmg(r.arrowSpeed * 0.95, 2) - 1e-6 && r.damage <= base + Math.floor(base / 2) + 1 + 1e-6 && Math.abs(r.damage - Math.round(r.damage)) < 1e-6
      }),
      { damages: fd, mean: r3(mean(fd)), min: Math.min(...fd), max: Math.max(...fd), expectedMean: 8 })
    t.check('full draw crit bonus is random (not always the same value)', new Set(fd).size >= 2, { distinct: [...new Set(fd)] })
    t.check('full draw crits average ~8 (1.8: 6 + rand 0..4); accept 6.5..9.5', fd.length >= 8 && mean(fd) > 6.5 && mean(fd) < 9.5, { mean: r3(mean(fd)) })
    // playtest 1 #5: no sound when an arrow hits a player
    t.check('the shooter hears the arrow "ding" (game event 6) exactly once per hit on a player', fh.length >= 8 && fh.every(r => r.dings === 1), fh.map(r => r.dings))
    t.check('the arrow hit sound (entity.arrow.hit) plays at the target and reaches the shooter', fh.length >= 8 && fh.every(r => r.hitSounds.length >= 1), fh.map(r => r.sounds))

    // partial draw: no crit, deterministic ceil(speed*2)
    const part = []
    for (const d of [10, 10, 10, 12]) part.push({ d, ...(await hitShot(ctx, { draw: d })) })
    const ph = part.filter(r => r.hit)
    t.log('partial hits', ph.map(r => ({ d: r.d, dmg: r.damage, speed: r3(r.arrowSpeed) })))
    t.check('partial draw: no crit bonus, damage = ceil(speed*2) (+- drag)',
      ph.length === 4 && ph.every(r => r.damage <= ceilDmg(r.arrowSpeed, 2) + 1e-6 && r.damage >= ceilDmg(r.arrowSpeed * 0.9, 2) - 1e-6),
      ph.map(r => ({ draw: r.d, speed: r3(r.arrowSpeed), damage: r.damage, expected: ceilDmg(r.arrowSpeed, 2) })))

    // Power I / II
    const powerRes = {}
    for (const [lvl, base] of [[1, 3.0], [2, 3.5]]) {
      await giveBow(ctx, `power:${lvl}`)
      const hits = []
      for (let i = 0; i < 10; i++) hits.push(await hitShot(ctx))
      const hh = hits.filter(r => r.hit)
      powerRes[lvl] = { hits: hh, base }
      t.log(`power ${lvl} damage`, hh.map(r => r.damage))
    }
    for (const lvl of [1, 2]) {
      const { hits: hh, base } = powerRes[lvl]
      // arrow damage attribute 2.0 + 0.5*lvl + 0.5; impact speed ~ 0.96..1.0 of launch speed
      const ok = hh.length >= 6 && hh.every(r => {
        const lo = ceilDmg(r.arrowSpeed * 0.96, base)
        const hi = ceilDmg(r.arrowSpeed, base)
        return r.damage >= lo - 1e-6 && r.damage <= hi + Math.floor(hi / 2 + 1) + 1e-6
      })
      t.check(`Power ${lvl}: arrow damage ${base} * speed (+ crit bonus), 1.8 formula`, ok,
        { damages: hh.map(r => r.damage), mean: r3(mean(hh.map(r => r.damage))), expectedBase: ceilDmg(3, base) })
    }
    const pm = l => mean(powerRes[l].hits.map(r => r.damage))
    t.check('damage grows with Power level (mean: none < I, none + 2 < II)', pm(1) > mean(fd) && pm(2) > mean(fd) + 2,
      { none: r3(mean(fd)), power1: r3(pm(1)), power2: r3(pm(2)) })

    }

    // ======================================================== C. knockback
    if (want('C')) {
    // Melee baseline on the same victim first: a sword hit delivers the raw knockback (0.4 horizontal) to the client.
    await server_giveSword(ctx)
    const melee = []
    for (let i = 0; i < 3; i++) melee.push(await meleeHit(ctx))
    const mh = melee.filter(r => r.hit && r.last)
    t.log('melee baseline', mh.map(r => ({ dmg: r.damage, horiz: r3(r.horiz), vert: r3(r.vert), packets: r.velPackets })))
    t.check('[baseline] melee hit: victim is launched ~0.4 b/t horizontally, ~0.36 vertically (1.8 base knockback)',
      mh.length === 3 && mh.every(r => Math.abs(r.horiz - 0.4) < 0.06 && Math.abs(r.vert - 0.36) < 0.08), mh.map(r => ({ horiz: r3(r.horiz), vert: r3(r.vert) })))
    await ctx.server.cmd('clear BowS')

    const kb = {}
    for (const [label, ench, expH, expVmin, expVmax] of [['none', null, 0.4, 0.33, 0.45], ['Punch I', 'punch:1', 1.0, 0.43, 0.55], ['Punch II', 'punch:2', 1.6, 0.43, 0.55]]) {
      await giveBow(ctx, ench)
      const hits = []
      for (let i = 0; i < 3; i++) hits.push(await hitShot(ctx))
      kb[label] = hits.filter(r => r.hit && r.last)
      const away = { x: TARGET_AT().x - SHOOT_FROM().x, y: 0, z: TARGET_AT().z - SHOOT_FROM().z }
      t.log(`knockback ${label}`, kb[label].map(r => ({ horiz: r3(r.horiz), vert: r3(r.vert), packets: r.velPackets, dmg: r.damage })))
      const rs = kb[label]
      t.check(`${label}: victim is launched away from the shooter (within 10 deg)`,
        rs.length === 3 && rs.every(r => angleDeg({ x: r.last.x, y: 0, z: r.last.z }, away) < 10),
        rs.map(r => ({ angleDeg: r3(angleDeg({ x: r.last.x, y: 0, z: r.last.z }, away)), x: r3(r.last.x), z: r3(r.last.z) })))
      t.check(`${label}: knockback magnitude delivered to the client is the 1.8 value, horizontal ${expH} b/t, vertical ${expVmin}..${expVmax} (base 0.4/0.36, Punch +0.6 per level horizontal +0.1 vertical)`,
        rs.length === 3 && rs.every(r => Math.abs(r.horiz - expH) < 0.06 && r.vert >= expVmin && r.vert <= expVmax),
        { expectedHoriz: expH, got: rs.map(r => ({ horiz: r3(r.horiz), vert: r3(r.vert), packets: r.velPackets.length })) })
    }
    // Root cause evidence (not a 1.8 expectation): the values that reach the client are the correct 1.8 values after ONE server tick of
    // movement friction (horizontal x 0.6*0.91 = 0.546 on ground, vertical (y - 0.08) * 0.98). The PlayerVelocityEvent fires one tick
    // after the arrow collision, i.e. after the victim already went through a native movement step; OCM only replaces the velocity of
    // MELEE hits at that event (it stores the finished value), so melee is unaffected. A fix has to undo this step (see report).
    {
      const exp18 = { none: [0.4, 0.361], 'Punch I': [1.0, 0.461], 'Punch II': [1.6, 0.461] }
      const fit = Object.entries(exp18).map(([k, [h, v]]) => ({ k, kb: kb[k].length ? r3(mean(kb[k].map(r => r.horiz)) / h) : null, vDelta: kb[k].length ? r3(mean(kb[k].map(r => r.vert)) - (v - 0.08) * 0.98) : null }))
      // Passes while the bug exists (and the numbers follow the friction model exactly) and ALSO once it is fixed (magnitudes then equal the 1.8
      // values), so this check never turns red because somebody repaired the knockback. A third, unexplained magnitude fails it.
      const fixedNow = Object.entries(exp18).every(([k, [h, v]]) => kb[k].length === 3 && kb[k].every(r => Math.abs(r.horiz - h) < 0.06 && Math.abs(r.vert - v) < 0.08))
      const frictionModel = fit.every(f => f.kb !== null && Math.abs(f.kb - 0.546) < 0.01 && Math.abs(f.vDelta) < 0.01)
      t.check('[diagnosis] arrow knockback at the client is either the 1.8 value or exactly the 1.8 value after one friction tick (horizontal x0.546, vertical (y-0.08)*0.98)',
        fixedNow || frictionModel, { fixedNow, frictionModel, fit })
    }
    t.check('Punch knockback grows with level (none < I < II)', ['none', 'Punch I', 'Punch II'].every(k => kb[k].length === 3) &&
      mean(kb.none.map(r => r.horiz)) < mean(kb['Punch I'].map(r => r.horiz)) && mean(kb['Punch I'].map(r => r.horiz)) < mean(kb['Punch II'].map(r => r.horiz)),
      Object.fromEntries(Object.entries(kb).map(([k, v]) => [k, v.length ? r3(mean(v.map(r => r.horiz))) : null])))
    t.check('arrow base knockback equals melee base knockback (ratio 0.85..1.15; both are the same 1.8 knockbackEntity call)',
      mh.length === 3 && kb.none.length === 3 && (() => { const q = mean(kb.none.map(r => r.horiz)) / mean(mh.map(r => r.horiz)); return q > 0.85 && q < 1.15 })(),
      { arrowHoriz: kb.none.length ? r3(mean(kb.none.map(r => r.horiz))) : null, meleeHoriz: mh.length ? r3(mean(mh.map(r => r.horiz))) : null, arrowVert: kb.none.length ? r3(mean(kb.none.map(r => r.vert))) : null, meleeVert: mh.length ? r3(mean(mh.map(r => r.vert))) : null })

    }

    // ======================================================== D. 1.8: knockback pushes away from the SHOOTER, not along the arrow
    if (want('D')) {
    // Long shot (arrow in the air ~10 ticks); once the arrow has spawned the shooter is teleported to the far side of the victim.
    await giveBow(ctx, null)
    const far = P(0, -40)
    const tgt = P(0, -10)
    const base = []
    for (let i = 0; i < 3; i++) base.push(await hitShot(ctx, { from: far, at: tgt }))
    const bh = base.filter(r => r.hit && r.last)
    t.log('long shot baseline (no teleport)', bh.map(r => ({ vz: r3(r.last.z), vx: r3(r.last.x), horiz: r3(r.horiz), ms: r.ms, packets: r.velPackets })))
    t.check('baseline long shot (shooter stays put): victim pushed along +z (away from the shooter)', bh.length >= 2 && bh.every(r => r.last.z > 0.1 && Math.abs(r.last.x) < 0.1),
      bh.map(r => ({ vz: r3(r.last.z), horiz: r3(r.horiz) })))
    const trick = []
    for (let i = 0; i < 4; i++) trick.push(await hitShot(ctx, { from: far, at: tgt, trick: P(0, 8) }))
    const th = trick.filter(r => r.hit && r.last)
    t.log('long shot with shooter teleported behind the victim', th.map(r => ({ vz: r3(r.last.z), vx: r3(r.last.x), horiz: r3(r.horiz), ms: r.ms, packets: r.velPackets })))
    t.check('1.8 ArrowKnockbackCompat: shooter teleported behind the victim while the arrow flies -> victim is pushed away from the SHOOTER (towards -z), not along the arrow',
      th.length >= 2 && th.every(r => r.last.z < -0.1 && Math.abs(r.last.x) < 0.1), th.map(r => ({ vz: r3(r.last.z), vx: r3(r.last.x), horiz: r3(r.horiz), flightMs: r.ms })))
    }

    // ======================================================== E. pickup and despawn of stuck arrows (playtest 1 #15)
    if (want('E')) await pickupSuite(ctx)
  }
}

/** Server-side NBT value of the one arrow entity (`data get entity @n[type=arrow] <path>`), null when there is none. */
async function arrowData (ctx, nbtPath) {
  const out = await ctx.server.cmd(`data get entity @n[type=minecraft:arrow] ${nbtPath}`)
  const m = out.match(/data: (.*)$/)
  return m ? m[1].trim() : null
}

/** Shoots one full-draw arrow into the floor 5 blocks ahead of the shooter and waits until it sticks. */
async function shootIntoFloor (ctx) {
  const { server, S } = ctx
  await server.cmd('kill @e[type=minecraft:arrow]')
  await ensureReady(ctx)
  await placeBot(ctx, S, P(0, -5).x, PLAT.y, P(0, -5).z)
  await S.look(yawTo(0, 1), -38 * D2R, true)
  await ticks(S, 3)
  const before = countItem(S, 'arrow')
  S.activateItem()
  await ticks(S, 22)
  S.deactivateItem()
  let stuck = false
  for (let i = 0; i < 40 && !stuck; i++) {
    stuck = /1b|true/.test(await arrowData(ctx, 'inGround') || '')
    if (!stuck) await sleep(100)
  }
  await sleep(300)
  const pos = (await arrowData(ctx, 'Pos') || '').match(/-?[\d.]+(?=d)/g)
  return { stuck, before, after: countItem(S, 'arrow'), pickup: await arrowData(ctx, 'pickup'), pos: pos && { x: Number(pos[0]), y: Number(pos[1]), z: Number(pos[2]) } }
}

/** The shooter walks onto the stuck arrow (shake time is long over) and stays there a second. */
async function standOnArrow (ctx, shot) {
  const { S } = ctx
  if (!shot.pos) return { gone: false, count: countItem(S, 'arrow') }
  await sleep(500)
  await placeBot(ctx, S, shot.pos.x, PLAT.y, shot.pos.z)
  await sleep(1000)
  return { gone: (await arrowData(ctx, 'Pos')) === null, count: countItem(S, 'arrow') }
}

async function pickupSuite (ctx) {
  const { t, server, S } = ctx
  // Infinity: the arrow costs nothing and is CREATIVE_ONLY (pickup 2b), a survival player cannot collect it
  await giveBow(ctx, 'infinity:1')
  const inf = await shootIntoFloor(ctx)
  t.log('infinity shot', inf)
  t.check('[precondition] Infinity arrow stuck in the floor', inf.stuck && !!inf.pos, inf)
  t.check('Infinity bow: shooting does not use up the arrow', inf.after === inf.before, { before: inf.before, after: inf.after })
  t.check('Infinity arrow has pickup status CREATIVE_ONLY (2b) like vanilla 1.8 and modern', inf.pickup === '2b', { pickup: inf.pickup })
  const infStand = await standOnArrow(ctx, inf)
  t.check('Infinity arrow cannot be picked up by a survival player standing on it', !infStand.gone && infStand.count === inf.after, { ...infStand, countBefore: inf.after })

  // stuck arrows despawn after 1200 ticks in the ground: the timer runs (life grows by ~20 a second) ...
  const life0 = Number((await arrowData(ctx, 'life') || '').replace(/[^\d-]/g, ''))
  await sleep(1000)
  const life1 = Number((await arrowData(ctx, 'life') || '').replace(/[^\d-]/g, ''))
  t.check('a stuck arrow counts its despawn timer (life +15..25 per second)', life1 - life0 >= 15 && life1 - life0 <= 25, { life0, life1 })
  // ... and the arrow is gone at 1200 (timer set close to the end)
  const merged = await server.cmd('data merge entity @n[type=minecraft:arrow] {life:1190s}')
  const lifeSet = Number((await arrowData(ctx, 'life') || '').replace(/[^\d-]/g, ''))
  await sleep(1500)
  const despawned = (await arrowData(ctx, 'Pos')) === null
  t.check('a stuck arrow despawns when its timer reaches 1200 ticks', lifeSet >= 1190 && despawned, { merged: merged.trim(), lifeSet, despawned })

  // control: a normal bow uses the arrow up and its arrow is pickable for the server (pickup 1b); in a round the plugin
  // still refuses the pickup (every shop bow has Infinity, nobody picks up arrows)
  await giveBow(ctx, null)
  const normal = await shootIntoFloor(ctx)
  t.log('normal shot', normal)
  t.check('[control] normal bow uses up one arrow, its arrow has pickup ALLOWED (1b)', normal.stuck && normal.after === normal.before - 1 && normal.pickup === '1b', normal)
  const normalStand = await standOnArrow(ctx, normal)
  t.check('in a round even a normal arrow is not picked up (plugin rule)', !normalStand.gone && normalStand.count === normal.after, { ...normalStand, countBefore: normal.after })
  await server.cmd('kill @e[type=minecraft:arrow]')
}

async function server_giveSword (ctx) {
  ctx.heldName = 'diamond_sword'
  await ctx.server.cmd('clear BowS')
  await ctx.server.cmd('give BowS minecraft:diamond_sword 1')
  await waitFor(() => { ctx.S.setQuickBarSlot(0); return ctx.S.heldItem && ctx.S.heldItem.name === 'diamond_sword' }, { timeout: 5000, what: 'sword in hand' })
}

/** Melee reference hit on the target (knockback is delivered immediately by the server for melee). */
async function meleeHit (ctx) {
  const { server, S, T, spyT } = ctx
  for (let attempt = 0; attempt < 4; attempt++) {
    await ensureReady(ctx)
    await server.cmd('effect give BowT minecraft:instant_health 1 10 true')
    await placeBot(ctx, S, P(0, -5).x, PLAT.y, P(0, -5).z)
    await placeBot(ctx, T, P(0, -3.3).x, PLAT.y, P(0, -3.3).z)
    await waitFor(() => T.health >= 19.99, { timeout: 4000, what: 'target healed' })
    await S.look(Math.PI, 0, true)
    await ticks(S, 3)
    const idx = spyT.selfVel.length
    const h0 = T.health
    const t0 = now()
    S.attack(S.players.BowT.entity)
    const hit = await waitFor(() => T.health < h0 - 0.01, { timeout: 2000, step: 20, what: 'melee hit' }).catch(() => null)
    if (!hit) continue
    await sleep(300)
    const vels = spyT.selfVel.slice(idx)
    const last = vels.length ? vels[vels.length - 1].v : null
    return { hit: true, damage: h0 - T.health, velPackets: vels.map(v => ({ dt: Math.round(v.t - t0), ...rv(v.v) })), last, horiz: last && Math.hypot(last.x, last.z), vert: last && last.y }
  }
  return { hit: false }
}
