// Collects bow-arrow measurements from ONE server and writes ../../reports/bow-raw-<target>.json
//   node collect.js vanilla   real Mojang 1.8.9 server.jar in Docker (bots speak 1.8.9)
//   node collect.js pumpkin   throwaway copy of the patched Pumpkin BedWars server (bots speak 26.1 through ViaProxy -> 26.3)
// Env: QUICK=1 for a short run (few repeats), ONLY=<regex> to run only matching scenario groups.
// Every shot is performed by a mineflayer bot with exactly the same input sequence on both servers
// (same seeded start positions, same look angles, same draw lengths), and the bot records what the CLIENT receives.
const fs = require('fs')
const { simulate } = require('./physics')
const path = require('path')

const target = process.argv[2]
if (!['vanilla', 'pumpkin'].includes(target)) { console.error('usage: node collect.js vanilla|pumpkin'); process.exit(2) }
const QUICK = !!process.env.QUICK
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null
let BINARY_INFO = null
const LABEL = process.env.LABEL || target
const OUT = path.resolve(__dirname, '..', '..', 'reports', `bow-raw-${LABEL}${QUICK ? '-quick' : ''}.json`)

const D2R = Math.PI / 180
const sleep = ms => new Promise(r => setTimeout(r, ms))
const now = () => performance.now()
function mulberry32 (a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
const ticks = (bot, n) => new Promise(resolve => {
  let i = 0
  const f = () => { if (++i >= n) { bot.removeListener('physicsTick', f); resolve() } }
  bot.on('physicsTick', f)
})
function waitFor (fn, { timeout = 10000, step = 25, what = 'condition' } = {}) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const tick = () => {
      let v
      try { v = fn() } catch (e) { v = undefined }
      if (v) return resolve(v)
      if (Date.now() - t0 > timeout) return reject(new Error(`timeout waiting for ${what}`))
      setTimeout(tick, step)
    }
    tick()
  })
}

// ------------------------------------------------------------------ scenarios (identical list for both servers)
// pitch = elevation in degrees (+ = up), yaw = Minecraft yaw in degrees (0 = +z, -90 = +x), draw = ticks the bow is held
function scenarios () {
  const L = []
  const add = (group, n, o) => { for (let i = 0; i < n; i++) L.push({ group, name: `${group} #${i}`, motion: 'stand', yaw: 0, pitch: 0, draw: 22, ...o }) }
  const k = QUICK ? 0.25 : 1
  const N = x => Math.max(2, Math.round(x * k))
  add('stand p0', N(40), {})
  for (const p of [-45, -20, 20, 45]) add(`stand p${p > 0 ? '+' : ''}${p}`, N(6), { pitch: p })
  add('stand p0 yaw37', N(6), { yaw: 37 })
  add('stand p0 yaw-90', N(6), { yaw: -90 })
  add('sprint p0', N(8), { motion: 'sprint' })
  add('sprint p+20', N(4), { motion: 'sprint', pitch: 20 })
  add('jump p0', N(8), { motion: 'jump' })
  add('strafe-left p0', N(4), { motion: 'strafe-left' })
  add('sneak p0', N(5), { motion: 'sneak' })
  add('draw 4 p0', N(5), { draw: 4 })
  add('draw 8 p0', N(8), { draw: 8 })
  add('draw 12 p0', N(5), { draw: 12 })
  add('draw 16 p0', N(5), { draw: 16 })
  return ONLY ? L.filter(s => ONLY.test(s.group)) : L
}

// ------------------------------------------------------------------ per-target environment
async function setup () {
  if (target === 'vanilla') {
    const mineflayer = require('mineflayer')
    const { Vanilla189 } = require('./vanilla')
    const server = await new Vanilla189('bow').start()
    const S = mineflayer.createBot({ host: '127.0.0.1', port: server.port, username: 'BowS', version: '1.8.9', auth: 'offline', hideErrors: true })
    await new Promise((resolve, reject) => { S.once('spawn', resolve); S.once('end', () => reject(new Error('bot ended'))) })
    S.on('error', e => console.log('[bot error]', e.message))
    const env = {
      kind: 'vanilla', server, S, version: '1.8.9', cx: 0.5, cz: 0.5, y: 150,
      cmd: c => server.cmd(c),
      killArrows: 'kill @e[type=Arrow]', gm: 'gamemode 0 BowS', give: i => `give BowS ${i}`,
      isArrow: d => d.type === 60,
      stop: () => server.stop()
    }
    await sleep(1000)
    await env.cmd('tp BowS 0.5 150 0.5'); await sleep(2500)
    await env.cmd('gamerule doDaylightCycle false')
    return env
  }
  const { TestServer } = require('../harness/server')
  const { connectBot, waitForGameStart } = require('../harness/bots')
  const { loadMap } = require('../play/map')
  const server = await new TestServer('bowcmp', {}).start()
  const S = await connectBot(server, 'BowS')
  const T = await connectBot(server, 'BowT')
  await Promise.all([waitForGameStart(S), waitForGameStart(T)])
  await sleep(1500)
  const map = loadMap()
  const mid = map.named('middle', map.teamNames[0])
  const arrowId = S.registry.entitiesByName.arrow.id
  const env = {
    kind: 'pumpkin', server, S, T, version: '26.1 (via ViaProxy to 26.3)', cx: Math.floor(mid.x) + 0.5, cz: Math.floor(mid.z) + 0.5, y: 150,
    cmd: c => server.cmd(c),
    killArrows: 'kill @e[type=minecraft:arrow]', gm: 'gamemode survival BowS', give: i => `give BowS minecraft:${i}`,
    isArrow: d => d.type === arrowId,
    stop: () => server.stop()
  }
  return env
}

async function buildPlatform (env) {
  if (env.kind === 'vanilla') { env.plat = { note: 'flat world: stone up to y=149 everywhere (generator-settings 3;150*minecraft:stone;1), floor surface at y=150' }; return }
  const x1 = Math.floor(env.cx - 40); const x2 = Math.floor(env.cx + 40)
  const z1 = Math.floor(env.cz - 30); const z2 = Math.floor(env.cz + 150)
  const y = env.y
  if (env.kind === 'pumpkin') {
    console.log(await env.cmd(`forceload add ${x1} ${z1} ${x2} ${z2}`))
    await env.cmd('gamerule natural_health_regeneration false')
  }
  let out = ''
  for (let i = 0; i < 20; i++) {
    out = await env.cmd(`fill ${x1} ${y - 1} ${z1} ${x2} ${y - 1} ${z2} minecraft:stone`)
    if (/filled|Successfully|Changed/i.test(out)) break
    await sleep(700)
  }
  console.log('platform fill:', out)
  if (!/filled|Successfully|Changed/i.test(out)) throw new Error('platform build failed: ' + out)
  // headroom above the shooting lane (the Rush map volume reaches y=220): clear a 17-wide, 40-high corridor in 4 pieces
  const hx1 = Math.floor(env.cx - 8); const hx2 = Math.floor(env.cx + 8)
  for (let zz = z1; zz <= z2; zz += 46) {
    const r = await env.cmd(`fill ${hx1} ${y} ${zz} ${hx2} ${y + 39} ${Math.min(zz + 45, z2)} minecraft:air`)
    console.log('headroom:', r)
  }
  env.plat = { x1, x2, z1, z2, y }
}

// ------------------------------------------------------------------ packet spy
function attachSpy (env) {
  const S = env.S
  const spy = { arrows: new Map(), writes: new Set() }
  const c = S._client
  // what the client really sends (rotation + position), to know the exact look angles the server received
  spy.sent = { look: null, pos: null }
  const write = c.write.bind(c)
  c.write = (name, params) => {
    spy.writes.add(name)
    if (params && (name === 'position_look' || name === 'look')) spy.sent.look = { yaw: params.yaw, pitch: params.pitch, t: now() }
    if (params && (name === 'position_look' || name === 'position')) spy.sent.pos = { x: params.x, y: params.y ?? params.feetY, z: params.z, t: now() }
    return write(name, params)
  }
  c.on('packet', (d, m) => {
    const t = now()
    if (m.name === 'spawn_entity') {
      if (!env.isArrow(d)) return
      const a = { id: d.entityId, t, spawn: { ...d }, ev: [] }
      delete a.spawn.objectUUID
      spy.arrows.set(a.id, a)
      spy.latest = a
      return
    }
    if (d && d.entityId !== undefined) {
      const a = spy.arrows.get(d.entityId)
      if (!a) return
      if (m.name === 'entity_head_rotation' || m.name === 'entity_metadata') { a.ev.push({ t, n: m.name }); return }
      a.ev.push({ t, n: m.name, d })
    } else if (m.name === 'entity_destroy') {
      for (const id of d.entityIds || []) { const a = spy.arrows.get(id); if (a) a.ev.push({ t, n: 'entity_destroy' }) }
    }
  })
  return spy
}

async function queryArrow (env) {
  const q = {}
  if (env.kind === 'vanilla') {
    const out = await env.cmd('entitydata @e[type=Arrow,c=1] {}')
    q.raw = out.slice(0, 600)
    const pos = /Pos:\[([^\]]+)\]/.exec(out); const mot = /Motion:\[([^\]]+)\]/.exec(out)
    const lst = t => t.split(',').map(x => parseFloat(x.replace(/^\d+:/, '')))
    if (pos) q.pos = lst(pos[1])
    if (mot) q.motion = lst(mot[1])
    const ig = /inGround:(\d)b/.exec(out); if (ig) q.inGround = ig[1] === '1'
    const cr = /crit:(\d)b/.exec(out); if (cr) q.crit = cr[1] === '1'
  } else {
    const get = async path => env.cmd(`execute at BowS run data get entity @n[type=minecraft:arrow] ${path}`)
    const po = await get('Pos'); const mo = await get('Motion')
    q.raw = (po + ' | ' + mo).slice(0, 600)
    const nums = t => (t.match(/-?\d+(?:\.\d+)?(?:[eE]-?\d+)?(?=d\b)/g) || []).map(parseFloat)
    q.pos = nums(po); q.motion = nums(mo)
    const ig = await get('inGround'); q.inGround = /1b|true/.test(ig)
  }
  return q
}

// ------------------------------------------------------------------ one shot
async function shoot (env, spy, sc, rnd, idx) {
  const { S, cmd } = env
  await cmd(env.killArrows)
  if (!S.inventory.items().some(i => i.name === 'arrow' && i.count >= 4)) { await cmd(env.give('arrow 64')); await sleep(400) }
  if (!(S.heldItem && S.heldItem.name === 'bow')) { await cmd('clear BowS'); await cmd(env.give('bow 1')); await cmd(env.give('arrow 64')); await sleep(500); S.setQuickBarSlot(0); await sleep(300) }
  if (S.health <= 0) throw new Error('bot dead')

  const r1 = rnd(); const r2 = rnd()
  let ox = (r1 * 2 - 1) * 8; let oz = (r2 * 2 - 1) * 8
  if (sc.motion === 'sprint') { oz = -18 + r2 * 2; ox = (r1 * 2 - 1) * 6 }
  if (sc.motion === 'strafe-left') { ox = -14 + r1 * 2; oz = (r2 * 2 - 1) * 6 }
  const x = +(env.cx + ox).toFixed(3); const z = +(env.cz + oz).toFixed(3); const y = env.y
  await cmd(`tp BowS ${x} ${y} ${z}`)
  await waitFor(() => Math.abs(S.entity.position.x - x) < 0.6 && Math.abs(S.entity.position.z - z) < 0.6 && Math.abs(S.entity.position.y - y) < 1.2, { what: 'teleport arrival' })
  await waitFor(() => S.entity.onGround && Math.hypot(S.entity.velocity.x, S.entity.velocity.z) < 0.03 && Math.abs(S.entity.velocity.y) < 0.1, { timeout: 5000, what: 'settle' })
  await S.look(Math.PI - sc.yaw * D2R, sc.pitch * D2R, true)
  await ticks(S, 4)

  const rec = { scenario: sc.name, group: sc.group, motion: sc.motion, yawDeg: sc.yaw, pitchDeg: sc.pitch, drawTicks: sc.draw, idx }
  const hist = []
  const onTick = () => { hist.push({ x: S.entity.position.x, y: S.entity.position.y, z: S.entity.position.z }); if (hist.length > 4) hist.shift() }
  S.on('physicsTick', onTick)
  const release = () => {
    rec.tRelease = now()
    rec.shooterAtRelease = { x: S.entity.position.x, y: S.entity.position.y, z: S.entity.position.z, onGround: S.entity.onGround, vel: { x: S.entity.velocity.x, y: S.entity.velocity.y, z: S.entity.velocity.z } }
    rec.shooterStep = hist.length >= 2 ? { x: hist[hist.length - 1].x - hist[hist.length - 2].x, y: hist[hist.length - 1].y - hist[hist.length - 2].y, z: hist[hist.length - 1].z - hist[hist.length - 2].z } : { x: 0, y: 0, z: 0 }
    rec.sentLook = spy.sent.look && { yaw: spy.sent.look.yaw, pitch: spy.sent.look.pitch }
    rec.sentPos = spy.sent.pos && { x: spy.sent.pos.x, y: spy.sent.pos.y, z: spy.sent.pos.z }
    S.deactivateItem()
  }
  const before = new Set(spy.arrows.keys())
  const m = sc.motion
  const reset = () => { for (const kk of ['forward', 'sprint', 'left', 'right', 'jump', 'back', 'sneak']) S.setControlState(kk, false) }
  try {
    if (m === 'sneak') { S.setControlState('sneak', true); await ticks(S, 6) }
    if (m === 'sprint') { S.setControlState('forward', true); S.setControlState('sprint', true); await ticks(S, 4) }
    if (m === 'strafe-left') { S.setControlState('left', true); await ticks(S, 4) }
    if (m === 'jump') {
      S.activateItem(); const t0 = now()
      await ticks(S, sc.draw - 2)
      S.setControlState('jump', true)
      await new Promise((resolve, reject) => {
        let n = 0; let air = 0
        const f = () => {
          n++
          air = S.entity.onGround ? 0 : air + 1
          // release on the 3rd airborne tick, still rising: the server has seen airborne movement packets with dy > 0
          if ((air >= 3 && S.entity.velocity.y > 0.1) || n > 40) {
            S.removeListener('physicsTick', f)
            rec.drawMs = now() - t0
            release(); S.setControlState('jump', false)
            n > 40 ? reject(new Error('never rose')) : resolve()
          }
        }
        S.on('physicsTick', f)
      })
    } else {
      S.activateItem(); const t0 = now()
      await ticks(S, sc.draw); rec.drawMs = now() - t0
      release()
    }
  } finally { reset(); S.removeListener('physicsTick', onTick) }
  rec.eyeSneak = m === 'sneak'

  const fresh = () => [...spy.arrows.values()].find(a => !before.has(a.id) && a.t >= rec.tRelease - 30)
  const a = await waitFor(fresh, { timeout: 3000, what: 'arrow spawn packet' }).catch(() => null)
  if (!a) { rec.noArrow = true; return rec }
  // Wait until the arrow has certainly landed (flight time from a 1.8 physics model of the spawn packet + margin), then read the
  // stuck arrow from the SERVER (entitydata on 1.8.9, data get on Pumpkin). Packets alone are not enough: a 1.8.9 server stops
  // tracking an arrow beyond 64 blocks (the client then gets entity_destroy), and non-crit arrows are synced only every 20 ticks.
  const t0 = a.t
  const sv = a.spawn.velocity
  const vel = env.kind === 'vanilla' ? { x: sv.x / 8000, y: sv.y / 8000, z: sv.z / 8000 } : { x: sv.x, y: sv.y, z: sv.z }
  const pos = env.kind === 'vanilla' ? { x: a.spawn.x / 32, y: a.spawn.y / 32, z: a.spawn.z / 32 } : { x: a.spawn.x, y: a.spawn.y, z: a.spawn.z }
  const est = simulate('vanilla18', pos, vel, env.y)
  const waitMs = Math.max(est.ticks, 1) * 50 + 1500
  await sleep(Math.max(0, waitMs - (now() - t0)))
  rec.serverQuery = await queryArrow(env)
  rec.simTicksVanilla18 = est.ticks
  rec.arrow = { id: a.id, tSpawn: a.t, spawn: a.spawn, events: a.ev.map(e => ({ dt: +(e.t - a.t).toFixed(2), n: e.n, d: e.d })) }
  rec.drawNominal = sc.draw
  return rec
}

;(async () => {
  if (target === 'pumpkin') {
    const bin = process.env.PUMPKIN_BIN ? path.resolve(process.env.PUMPKIN_BIN) : path.resolve(__dirname, '..', '..', 'build', 'pumpkin')
    BINARY_INFO = { path: bin, sha256: require('crypto').createHash('sha256').update(fs.readFileSync(bin)).digest('hex'), mtime: fs.statSync(bin).mtime.toISOString() }
    console.log('binary', JSON.stringify(BINARY_INFO))
  }
  const env = await setup()
  const out = { target, label: LABEL, pumpkinBin: process.env.PUMPKIN_BIN || null, version: env.version, startedAt: new Date().toISOString(), quick: QUICK, plat: null, shots: [] }
  try {
    await env.cmd(env.gm)
    await env.cmd('clear BowS')
    await buildPlatform(env)
    out.plat = env.plat; out.cx = env.cx; out.cz = env.cz
    await sleep(500)
    console.log(await env.cmd(env.give('bow 1')), await env.cmd(env.give('arrow 64')))
    await sleep(800)
    env.S.setQuickBarSlot(0)
    await sleep(400)
    if (!(env.S.heldItem && env.S.heldItem.name === 'bow')) throw new Error('bot does not hold the bow')
    const spy = attachSpy(env)
    const rnd = mulberry32(20261024)
    const sc = scenarios()
    console.log(`${sc.length} shots on ${target}`)
    let i = 0
    for (const s of sc) {
      let rec
      for (let attempt = 0; attempt < 3; attempt++) {
        try { rec = await shoot(env, spy, s, rnd, i); if (!rec.noArrow) break; console.log(`  ${s.name}: no arrow (attempt ${attempt})`) } catch (e) {
          console.log(`  ${s.name}: attempt ${attempt} failed: ${e.message}`)
          rec = { scenario: s.name, group: s.group, error: e.message }
          for (const kk of ['forward', 'sprint', 'left', 'right', 'jump', 'back', 'sneak']) env.S.setControlState(kk, false)
          await sleep(1000)
        }
      }
      out.shots.push(rec)
      i++
      const sp = rec.arrow && rec.arrow.spawn
      console.log(`[${i}/${sc.length}] ${s.name}: ` + (rec.arrow ? `events=${rec.arrow.events.length} spawn=${JSON.stringify(sp.velocity)}` : rec.error || 'no arrow'))
    }
    out.binary = BINARY_INFO
    if (BINARY_INFO) {
      const bin = BINARY_INFO.path
      // the binary must not have been replaced while the run was going on
      out.binaryUnchangedAtEnd = require('crypto').createHash('sha256').update(fs.readFileSync(bin)).digest('hex') === BINARY_INFO.sha256
    }
    out.clientWritePackets = [...spy.writes]
    out.serverErrors = env.kind === 'pumpkin' ? env.server.errors().slice(0, 20) : []
    out.finishedAt = new Date().toISOString()
    fs.mkdirSync(path.dirname(OUT), { recursive: true })
    fs.writeFileSync(OUT, JSON.stringify(out))
    console.log('wrote', OUT)
  } finally {
    await env.stop().catch(e => console.log('stop failed', e.message))
  }
  process.exit(0)
})().catch(e => { console.error(e); process.exit(1) })
