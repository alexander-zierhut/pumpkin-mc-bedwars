#!/usr/bin/env node
// Camera bot that records a BedWars round to replay.json (format: REPLAY_FORMAT.md).
//   node recorder.js --port <mcPort> --rcon <rconPort> --rcon-password <pw> --out <file> [--host 127.0.0.1] [--arena <arena.yml>] [--name Kamera]
// Recording starts when the game starts (t=0 = game start) and ends with the win message (+4 s), SIGINT or SIGTERM.
// Units: x/y/z world coordinates, yaw/pitch in Minecraft degrees (yaw 0 = looking +z, 90 = looking -x; pitch positive = looking down).
'use strict'
const mineflayer = require('mineflayer')
const { Vec3 } = require('vec3')
const fs = require('fs')
const path = require('path')
const L = require('./lib')
const { loadMap } = require('./map')
const { Rcon } = require('../harness/rcon')

const argv = process.argv.slice(2)
const opt = {}
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true
const MC_PORT = Number(opt.port || 25565)
const MC_HOST = opt.host || '127.0.0.1'
const NAME = opt.name || 'Kamera'
const OUT = path.resolve(opt.out || 'replay.json')
const SAMPLE_HZ = 10
const MAP = loadMap({ arena: opt.arena || undefined })
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), '[recorder]', ...a)
const sleep = L.sleep

// ---------------------------------------------------------------- block name mapping (1.8 id/meta -> modern names the viewer knows)
const COLORS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black']
const META_NAMES = {
  stained_glass: m => `${COLORS[m & 15]}_stained_glass`,
  stained_glass_pane: m => `${COLORS[m & 15]}_stained_glass_pane`,
  stained_hardened_clay: m => `${COLORS[m & 15]}_terracotta`,
  hardened_clay: () => 'terracotta',
  wool: m => `${COLORS[m & 15]}_wool`,
  carpet: m => `${COLORS[m & 15]}_carpet`,
  stone: m => ['stone', 'granite', 'polished_granite', 'diorite', 'polished_diorite', 'andesite', 'polished_andesite'][m] || 'stone',
  sandstone: m => ['sandstone', 'chiseled_sandstone', 'cut_sandstone'][m] || 'sandstone',
  red_sandstone: m => ['red_sandstone', 'chiseled_red_sandstone', 'cut_red_sandstone'][m] || 'red_sandstone',
  stonebrick: m => ['stone_bricks', 'mossy_stone_bricks', 'cracked_stone_bricks', 'chiseled_stone_bricks'][m] || 'stone_bricks',
  quartz_block: m => ['quartz_block', 'chiseled_quartz_block', 'quartz_pillar'][m] || 'quartz_block',
  planks: m => ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'][m] + '_planks',
  brick_block: () => 'bricks',
  lit_redstone_lamp: () => 'redstone_lamp',
  double_stone_slab: () => 'smooth_stone',
  stone_slab: () => 'stone_slab'
}
function blockName (b) {
  if (!b) return 'air'
  if (/bed/.test(b.name) && b.name !== 'bedrock') {
    // 1.8 beds are always red; use the colour of the team whose bed is at this position
    let best = null
    for (const t of Object.values(MAP.teams)) { const d = Math.hypot(t.bed.x - b.position.x, t.bed.z - b.position.z); if (d <= 1.5 && (!best || d < best.d)) best = { d, t } }
    return best ? `${String(best.t.colorName).toLowerCase()}_bed` : 'red_bed'
  }
  const f = META_NAMES[b.name]
  return f ? f(b.metadata || 0) : b.name
}

// ---------------------------------------------------------------- state
const rec = {
  version: 1,
  meta: {
    map: MAP.name,
    recordedAt: new Date().toISOString(),
    durationMs: 0,
    sampleHz: SAMPLE_HZ,
    teams: Object.fromEntries(Object.values(MAP.teams).map(t => [t.name, { color: t.color, bed: [t.bed.x, t.bed.y, t.bed.z], spawn: [t.spawn.x, t.spawn.y, t.spawn.z] }])),
    spawners: MAP.spawners.map(s => ({ type: s.type, x: s.x, y: s.y, z: s.z })),
    players: [],
    winner: null
  },
  initialBlocks: [],
  blocks: [],
  frames: [],
  events: []
}
let bot = null
let rcon = null
let t0 = null // recording start (ms epoch)
let recording = false
let finished = false
let endTimer = null
const nowT = () => (t0 ? Date.now() - t0 : 0)
const bedAlive = {} // team -> bool, from scoreboard
const playerMeta = new Map() // name -> {team}
const pstate = new Map() // name -> {alive, deadAt, lastPos, lastHealth}
const recentDeath = new Map() // name -> t of last death event

function event (type, text, extra = {}) {
  if (!recording) return
  const e = { t: nowT(), type, text, ...extra }
  rec.events.push(e)
  return e
}

// ---------------------------------------------------------------- helpers
const teamOf = name => {
  const t = bot.teamMap && bot.teamMap[name]
  return t && MAP.teams[t.team] ? t.team : null
}
const sidebar = () => (bot.scoreboard && bot.scoreboard.sidebar) || null
function readBeds () {
  const sb = sidebar()
  if (!sb || sb.name !== 'display') return
  for (const key of Object.keys(sb.itemsMap)) {
    const m = /([✔✘])\s*(\S+)/.exec(L.clean(key))
    if (m) bedAlive[m[2]] = m[1] === '✔'
  }
}
function realPlayers () {
  const out = []
  for (const p of Object.values(bot.players)) {
    if (p.username === NAME || !p.entity) continue
    out.push(p)
  }
  return out
}
const r2 = n => Math.round(n * 100) / 100
const mcYaw = e => { let y = (e.yaw * 180 / Math.PI) - 180; y = ((y % 360) + 540) % 360 - 180; return Math.round(y * 10) / 10 }
const mcPitch = e => Math.round(-e.pitch * 180 / Math.PI * 10) / 10
function healthOf (e) {
  const m = e.metadata
  if (m && typeof m[6] === 'number') return Math.round(m[6] * 10) / 10
  return null
}
const nearestPlayer = (pos, maxD, exclude) => {
  let best = null
  for (const p of realPlayers()) {
    if (p.gamemode === 3 || p.username === exclude) continue
    const d = p.entity.position.distanceTo(pos)
    if (d <= maxD && (!best || d < best.d)) best = { d, name: p.username }
  }
  return best ? best.name : null
}

// ---------------------------------------------------------------- recording
function entityType (e) {
  const n = String(e.name || '').toLowerCase()
  if (n.includes('arrow')) return 'arrow'
  if (n === 'item') return 'item'
  if (n.includes('chicken')) return 'chicken'
  if (n.includes('tnt')) return 'tnt'
  if (n.includes('villager')) return 'villager'
  if (n.includes('fireball')) return 'fireball'
  return null
}

function snapshotInitial () {
  const [x0, y0, z0] = MAP.bounds.min; const [x1, y1, z1] = MAP.bounds.max
  const ya = Math.max(y0, MAP.walkY - 9); const yb = Math.min(y1, MAP.walkY + 26)
  const out = []
  const v = new Vec3(0, 0, 0)
  for (let x = Math.max(x0, -60); x <= Math.min(x1, 60); x++) {
    for (let z = z0; z <= z1; z++) {
      for (let y = ya; y <= yb; y++) {
        v.x = x; v.y = y; v.z = z
        const b = bot.world.getBlock(v)
        if (b && b.name !== 'air') out.push([x, y, z, blockName(b)])
      }
    }
  }
  return out
}

function sampleFrame () {
  if (!recording || finished) return
  const t = nowT()
  const players = {}
  const chickens = []
  const entities = []
  for (const e of Object.values(bot.entities)) {
    if (e.type === 'player') continue
    const ty = entityType(e)
    if (!ty) continue
    if (ty === 'chicken') chickens.push(e)
    entities.push({ id: e.id, type: ty, x: r2(e.position.x), y: r2(e.position.y), z: r2(e.position.z) })
  }
  const bounds = MAP.bounds
  for (const p of realPlayers()) {
    const e = p.entity
    const name = p.username
    const team = teamOf(name)
    const spectator = p.gamemode === 3
    const health = healthOf(e)
    const pos = e.position
    let st = pstate.get(name)
    if (!st) pstate.set(name, st = { alive: true, deadAt: 0, last: pos.clone(), lastT: t, lastHealth: health })
    const inGame = pos.x >= bounds.min[0] - 5 && pos.x <= bounds.max[0] + 5 && pos.z >= bounds.min[2] - 5 && pos.z <= bounds.max[2] + 5
    if (!inGame) continue // lobby
    if (team && !playerMeta.has(name)) { playerMeta.set(name, { team }); rec.meta.players.push({ name, team }) }
    const dead = (health !== null && health <= 0) || pos.y < MAP.voidY
    const alive = !dead && !spectator
    // death / respawn / teleport observation
    if (st.alive && dead && !spectator) { st.alive = false; st.deadAt = t; maybeObservedDeath(name, team, t) }
    let justRespawned = false
    if (!st.alive && alive && t - st.deadAt > 100) {
      st.alive = true
      justRespawned = true
      if (!(team && bedAlive[team] === false)) event('respawn', `${name} ist wieder im Spiel`, { players: [name], team })
    }
    if (st.alive && !justRespawned) {
      const jump = Math.hypot(pos.x - st.last.x, pos.y - st.last.y, pos.z - st.last.z)
      if (jump > 40 && t - st.lastT < 400) {
        const sp = team ? MAP.teams[team].spawn : null
        const nearSpawn = sp && Math.hypot(pos.x - sp.x, pos.z - sp.z) < 4
        const died = recentDeath.get(name)
        if (nearSpawn && died !== undefined && t - died < 8000) event('respawn', `${name} ist wieder im Spiel`, { players: [name], team })
        else if (nearSpawn) event('teleport', `${name} wurde zur Basis teleportiert`, { players: [name], team, from: [r2(st.last.x), r2(st.last.y), r2(st.last.z)] })
      }
    }
    st.last = pos.clone(); st.lastT = t
    let riding = null
    for (const c of chickens) if (Math.abs(c.position.x - pos.x) < 1.3 && Math.abs(c.position.z - pos.z) < 1.3 && c.position.y - pos.y > 0.8 && c.position.y - pos.y < 2.6) { riding = 'chicken'; break }
    if (riding && !st.riding) event('parachute', `${name} öffnet den Fallschirm`, { players: [name], team })
    st.riding = riding
    const held = e.equipment && e.equipment[0] ? e.equipment[0].name : (e.heldItem ? e.heldItem.name : null)
    players[name] = {
      x: r2(pos.x), y: r2(pos.y), z: r2(pos.z), yaw: mcYaw(e), pitch: mcPitch(e), health: health === null ? 20 : health,
      held, team, alive, spectator, riding
    }
  }
  // cap noisy entities (dropped resources) per frame
  let items = 0
  const ents = entities.filter(e => (e.type !== 'item') || ++items <= 24)
  rec.frames.push({ t, players, entities: ents })
  rec.meta.durationMs = t
}

function maybeObservedDeath (name, team, t) {
  // chat normally reports deaths (sometimes a couple of seconds late); only add an observed one if no chat death shows up
  setTimeout(() => {
    const last = recentDeath.get(name)
    if (recording && !(last !== undefined && last >= t - 4000)) {
      const final = team && bedAlive[team] === false
      const e = event('death', `${name} ist gestorben`, { players: [name], team, final: !!final, observed: true })
      if (e) e.t = t
    }
  }, 4500)
}

function onBlockUpdate (oldB, newB) {
  if (!recording || !newB) return
  const p = newB.position
  const b = MAP.bounds
  if (p.x < b.min[0] || p.x > b.max[0] || p.y < b.min[1] || p.y > b.max[1] || p.z < b.min[2] || p.z > b.max[2]) return
  const nn = blockName(newB)
  const on = oldB ? blockName(oldB) : 'air'
  if (nn === on) return
  const by = nearestPlayer(p.offset(0.5, 0.5, 0.5), 7)
  const rec1 = { t: nowT(), x: p.x, y: p.y, z: p.z, name: nn }
  if (by) rec1.by = by
  rec.blocks.push(rec1)
}

function onChat (raw) {
  const text = L.clean(raw).replace(/^\[BW\]\s*/, '')
  if (!text || L.isNoise(text) || text.includes(NAME)) return
  const ev = L.parseChat(text)
  if (!ev) { event('chat', text); return }
  switch (ev.type) {
    case 'bed_destroyed': {
      bedAlive[ev.team] = false
      const bp = MAP.teams[ev.team] ? MAP.teams[ev.team].bed : null
      const by = bp ? nearestPlayer(new Vec3(bp.x + 0.5, bp.y, bp.z + 0.5), 8) : null
      event('bed_destroyed', text, { players: by ? [by] : [], team: ev.team })
      break
    }
    case 'kill': {
      const [killer, victim] = ev.players
      const vt = teamOf(victim)
      recentDeath.set(victim, nowT())
      const final = vt && bedAlive[vt] === false
      event(final ? 'final_kill' : 'kill', text, { players: [killer, victim], team: vt })
      break
    }
    case 'death': {
      const victim = ev.players[0]
      const vt = teamOf(victim)
      recentDeath.set(victim, nowT())
      const final = vt && bedAlive[vt] === false
      event('death', text, { players: [victim], team: vt, final: !!final })
      break
    }
    case 'win':
      rec.meta.winner = ev.team
      event('win', text, { team: ev.team })
      scheduleEnd('win')
      break
    case 'join': event('join', text, { players: ev.players }); break
    case 'leave': event('leave', text, { players: ev.players }); break
    case 'team_selected': break
    default: event(ev.type === 'info' ? 'info' : 'chat', text)
  }
}

function scheduleEnd (why) {
  if (endTimer) return
  endTimer = setTimeout(() => finish(why), 4000)
}

// ---------------------------------------------------------------- output
function writeOut () {
  rec.meta.durationMs = nowT()
  const tmp = OUT + '.tmp'
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  const fd = fs.openSync(tmp, 'w')
  const w = s => fs.writeSync(fd, s)
  // arrays are written in chunks to keep peak memory low for long games
  const writeArray = (arr, chunkSize = 500) => {
    w('[')
    for (let i = 0; i < arr.length; i += chunkSize) {
      w((i ? ',' : '') + arr.slice(i, i + chunkSize).map(x => JSON.stringify(x)).join(','))
    }
    w(']')
  }
  w('{"version":1,"meta":' + JSON.stringify(rec.meta) + ',"initialBlocks":')
  writeArray(rec.initialBlocks, 5000)
  w(',"blocks":'); writeArray(rec.blocks)
  w(',"frames":'); writeArray(rec.frames)
  w(',"events":'); writeArray(rec.events.slice().sort((a, b) => a.t - b.t))
  w('}')
  fs.closeSync(fd)
  fs.renameSync(tmp, OUT)
}

let finishing = false
function finish (why) {
  if (finishing) return
  finishing = true
  finished = true
  recording = false
  log(`finishing (${why}): ${rec.frames.length} frames, ${rec.events.length} events, ${rec.blocks.length} block changes, ${rec.initialBlocks.length} initial blocks`)
  try { writeOut(); log('wrote', OUT) } catch (e) { log('write failed', e.message) }
  try { bot.quit() } catch (e) {}
  try { rcon && rcon.close() } catch (e) {}
  setTimeout(() => process.exit(0), 300)
}

// ---------------------------------------------------------------- connect & camera
async function rc (cmd) {
  try { return await rcon.command(cmd) } catch (e) { log('rcon failed:', cmd, e.message); return '' }
}

function start () {
  bot = mineflayer.createBot({ host: MC_HOST, port: MC_PORT, username: NAME, version: '1.8.9', auth: 'offline', hideErrors: true, checkTimeoutInterval: 120000 })
  bot.on('error', e => log('error', e.message))
  bot.on('kicked', r => log('kicked', JSON.stringify(r).slice(0, 200)))
  bot.on('end', () => { if (!finished) { log('disconnected'); setTimeout(() => { if (!finished) start() }, 3000) } })
  bot.on('messagestr', m => { try { onChat(m) } catch (e) { log('chat error', e.message) } })
  bot.once('login', () => {
    // make sure the companion plugin does not put the camera into the arena
    bot.chat('/autojoin')
  })
  bot.once('spawn', async () => {
    bot.world.on('blockUpdate', onBlockUpdate)
    await sleep(2500)
    await rc(`gamemode spectator ${NAME}`)
    await keepCamera(true)
    log('camera ready')
  })
  const lines = []
  bot.on('messagestr', m => {
    lines.push(L.clean(m))
    // if we were auto-joined before /autojoin took effect (waiting lobby), leave again and stay out until the game runs
    if (!recording && new RegExp(`${NAME} tritt dem Spiel bei`).test(L.clean(m))) { log('was auto-joined into the lobby; leaving'); setTimeout(() => bot.chat('/bw leave'), 300) }
    if (/Auto-Join (de)?aktiviert/.test(m)) {
      // the toggle must end up as "deaktiviert"; if it says aktiviert we toggled it back on
      if (/Auto-Join aktiviert/.test(L.clean(m))) setTimeout(() => bot.chat('/autojoin'), 200)
    }
  })
}

let camPos = null
async function keepCamera (force) {
  const mid = MAP.named('middle', MAP.teamNames[0])
  camPos = { x: mid.x, y: MAP.walkY + 31, z: mid.z }
  const p = bot && bot.entity && bot.entity.position
  if (force || !p || Math.hypot(p.x - camPos.x, p.z - camPos.z) > 3 || Math.abs(p.y - camPos.y) > 3) await rc(`tp ${NAME} ${camPos.x} ${camPos.y} ${camPos.z} 0 30`)
}

function phaseRunning () {
  const sb = sidebar()
  return !!sb && sb.name === 'display'
}

const inArena = p => p.x >= MAP.bounds.min[0] - 5 && p.x <= MAP.bounds.max[0] + 5 && p.z >= MAP.bounds.min[2] - 5 && p.z <= MAP.bounds.max[2] + 5 && p.y > MAP.voidY - 40 && p.y < MAP.bounds.max[1] + 20

async function main () {
  rcon = await new Rcon(MC_HOST, Number(opt.rcon), String(opt['rcon-password'] || 'test-rcon')).connect()
  log('rcon connected; connecting camera bot to', MC_HOST + ':' + MC_PORT)
  start()
  process.on('SIGINT', () => finish('SIGINT'))
  process.on('SIGTERM', () => finish('SIGTERM'))
  process.on('uncaughtException', e => log('uncaught', e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e))
  process.on('unhandledRejection', e => log('unhandled', e && e.message ? e.message : e))
  setInterval(() => { if (bot && bot.entity && !finished) keepCamera(false).catch(() => {}) }, 4000)
  // The camera stays outside the arena (auto-join disabled) until players show up on the islands, then joins
  // the running game as a spectator: only then does the server send it the scoreboard, teams and game chat.
  let starting = false
  const poll = setInterval(async () => {
    if (finished || !bot || !bot.entity || starting) return
    readBeds()
    const onIslands = realPlayers().filter(p => p.gamemode !== 3 && inArena(p.entity.position))
    if (!recording && onIslands.length >= 1) {
      starting = true
      await sleep(1200) // let everybody settle on their spawn
      t0 = Date.now()
      recording = true
      rec.meta.recordedAt = new Date().toISOString()
      event('game_start', 'Das Spiel hat begonnen', {})
      for (let attempt = 0; attempt < 5 && !phaseRunning(); attempt++) {
        bot.chat('/bw join ' + MAP.name)
        for (let i = 0; i < 16 && !phaseRunning(); i++) await sleep(250)
      }
      if (!phaseRunning()) log('WARNING: camera could not join the game as spectator; team/chat information will be missing')
      await sleep(500)
      await rc(`gamemode spectator ${NAME}`)
      await keepCamera(true)
      await sleep(1500)
      rec.initialBlocks = snapshotInitial()
      log(`recording started: ${rec.initialBlocks.length} initial blocks, ${onIslands.length} players on the islands`)
      setInterval(sampleFrame, 1000 / SAMPLE_HZ)
      setInterval(() => { try { readBeds(); writeOut() } catch (e) { log('write failed', e.message) } }, 30000)
      setInterval(() => { const sb = sidebar(); if (recording && sb && sb.name === 'lobby') scheduleEnd('lobby') }, 1000)
      clearInterval(poll)
    }
  }, 500)
}

main().catch(e => { console.error(e); process.exit(1) })
