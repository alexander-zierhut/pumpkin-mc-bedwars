#!/usr/bin/env node
// Bot control daemon: one 1.8.9 mineflayer bot + a small HTTP JSON API so an LLM agent can play BedWars turn by turn.
//   node botd.js --port <mcPort> --name <BotName> --api <httpPort> [--host 127.0.0.1] [--shop <path to shop.yml>]
// GET /state            compact game state (see README.md)
// POST /do  {json}      start a high-level action, e.g. {"action":"goto","target":"middle"}
// GET /help             list of actions
'use strict'
const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')
const http = require('http')
const fs = require('fs')
const path = require('path')
const L = require('./lib')
const { loadMap } = require('./map')

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2)
const opt = {}
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true
const MC_PORT = Number(opt.port || 25565)
const MC_HOST = opt.host || '127.0.0.1'
const NAME = opt.name || 'Bot'
const API_PORT = Number(opt.api || 9000)
const MAP = loadMap({ arena: opt.arena || undefined })
const SHOP_YML = opt.shop || path.join(__dirname, '..', '..', 'config', 'shop.yml')

const CANCEL = Symbol('cancel')
const sleep = L.sleep
const rnd = (a, b) => a + Math.random() * (b - a)
const r1 = n => Math.round(n * 10) / 10
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), `[${NAME}]`, ...a)

// ---------------------------------------------------------------- shop catalogue (parsed from shop.yml: names, prices, categories)
function parseShop (file) {
  const cat = {} // item display name -> { category, price, currency }
  const categories = []
  let text = ''
  try { text = fs.readFileSync(file, 'utf8') } catch (e) { return { items: cat, categories } }
  let current = null
  let inItems = false
  let price = null
  for (const line of text.split('\n')) {
    let m
    if (/^- stack:/.test(line)) { current = null; inItems = false; continue }
    if (!inItems && (m = /^\s+display-name: "([^"]+)"/.exec(line)) && current === null) { current = L.clean(m[1]); categories.push(current); continue }
    if (/^\s+items:/.test(line)) { inItems = true; continue }
    if (!inItems) continue
    if ((m = /^\s+- price: (\d+) of (\w+)/.exec(line))) { price = { n: Number(m[1]), cur: m[2] === 'iron' ? 'silver' : m[2] }; continue }
    let name = null
    if ((m = /^\s+stack: "[^;"]*;(\d+);([^"]*)"/.exec(line))) name = L.clean(m[2])
    else if ((m = /^\s+display-name: "([^"]+)"/.exec(line))) name = L.clean(m[1])
    if (name && price) {
      const key = L.norm(name)
      if (!cat[key]) cat[key] = { name, categories: [], price: price.n, currency: price.cur }
      cat[key].categories.push(current)
      price = null
    }
  }
  return { items: cat, categories }
}
const SHOP = parseShop(SHOP_YML)

// ---------------------------------------------------------------- global state
let bot = null
let connected = false
let quitting = false
let task = null // current/last action
let taskSeq = 0
let lastResult = null
const chatBuf = []
let chatSeen = 0
let chatSeq = 0
let ended = null // { winner }
let lastDeath = null
let lastDamageAt = 0
let reflexMoving = false
let reflexOff = false
const posHist = new Map() // entity id -> [{t, p}]
let moves = null

function pushChat (text, kind) {
  const line = { i: ++chatSeq, t: Date.now(), text, kind }
  chatBuf.push(line)
  if (chatBuf.length > 300) chatBuf.shift()
  if (task && task.status === 'running') task.chat.push(text)
}

// ---------------------------------------------------------------- connection
function start () {
  bot = mineflayer.createBot({ host: MC_HOST, port: MC_PORT, username: NAME, version: '1.8.9', auth: 'offline', hideErrors: true, checkTimeoutInterval: 120000 })
  const b = bot
  b.loadPlugin(pathfinder)
  b.on('login', () => { connected = true; log('logged in') })
  b.once('spawn', () => {
    moves = makeMovements()
    log('spawned')
  })
  b.on('messagestr', raw => {
    const text = L.clean(raw)
    if (!text || L.isNoise(text)) return
    const ev = L.parseChat(text)
    if (ev && ev.type === 'win') ended = { winner: ev.team }
    pushChat(text, ev ? ev.type : 'chat')
  })
  b.on('death', () => {
    lastDeath = Date.now()
    pushChat('* you died', 'self')
    if (task && task.status === 'running' && !['wait', 'chat'].includes(task.name)) cancelTask(task, 'died')
  })
  b.on('spawn', () => { if (lastDeath && Date.now() - lastDeath < 20000) pushChat('* you respawned', 'self') })
  b.on('health', () => { if (b._lastHealth !== undefined && b.health < b._lastHealth) lastDamageAt = Date.now(); b._lastHealth = b.health })
  b.on('kicked', r => log('kicked', JSON.stringify(r).slice(0, 200)))
  b.on('error', e => log('error', e.message))
  b.on('end', reason => {
    connected = false
    log('disconnected', reason)
    if (task && task.status === 'running') cancelTask(task, 'disconnected')
    if (!quitting) setTimeout(start, 4000)
  })
  b.on('entityDead', e => { if (e.type === 'player') (e._dead = Date.now()) })
}

function makeMovements () {
  const m = new Movements(bot)
  m.canDig = false
  m.allow1by1towers = false
  m.allowParkour = false
  m.allowFreeMotion = false
  m.scafoldingBlocks = []
  m.maxDropDown = 2
  m.infiniteLiquidDropdownDistance = false
  for (const n of ['web', 'fire', 'lava', 'flowing_lava']) { const id = bot.registry.blocksByName[n]; if (id) m.blocksToAvoid.add(id.id) }
  bot.pathfinder.thinkTimeout = 4000
  bot.pathfinder.tickTimeout = 20
  return m
}

// ---------------------------------------------------------------- small helpers
const me = () => bot.entity.position
const myTeam = () => {
  const t = bot.teamMap && bot.teamMap[NAME]
  if (t && (t.team === 'Red' || t.team === 'Blue')) return t.team
  return null
}
const isSpectator = () => bot.game && bot.game.gameMode === 'spectator'
const sidebar = () => (bot.scoreboard && bot.scoreboard.sidebar) || null
function phase () {
  if (ended) {
    const sb = sidebar()
    if (sb && sb.name === 'lobby') ended = null
    else return 'ended'
  }
  const sb = sidebar()
  if (sb && sb.name === 'display') return 'running'
  if (sb && sb.name === 'lobby') return 'lobby'
  return Math.hypot(me().x - MAP.lobbySpawn.x, me().z - MAP.lobbySpawn.z) < 40 ? 'lobby' : 'unknown'
}
function bedStatus () {
  const sb = sidebar()
  const res = {}
  if (!sb || sb.name !== 'display') return res
  for (const key of Object.keys(sb.itemsMap)) {
    const m = /([✔✘])\s*(\S+)/.exec(L.clean(key).replace(/[§]./g, ''))
    if (m) res[m[2]] = m[1] === '✔'
  }
  return res
}
function gameClock () {
  const sb = sidebar()
  const m = sb && /(\d+:\d+)/.exec(L.clean(sb.title || ''))
  return m ? m[1] : null
}
const count = n => bot.inventory.items().filter(i => i.name === n).reduce((s, i) => s + i.count, 0)
const money = () => ({ bronze: count('brick'), silver: count('iron_ingot'), gold: count('gold_ingot') })

function dispName (item) {
  if (!item) return null
  let n = null
  try { n = item.nbt && item.nbt.value && item.nbt.value.display && item.nbt.value.display.value.Name && item.nbt.value.display.value.Name.value } catch (e) {}
  return L.clean(n || item.displayName || item.name)
}
function itemLabel (item) { return dispName(item) + (item.count > 1 ? ` x${item.count}` : '') }
function sharp (item) {
  try { return (item.enchants || []).filter(e => /sharp/.test(e.name)).reduce((s, e) => s + e.lvl, 0) } catch (e) { return 0 }
}

const BLOCK_NAMES = ['red_sandstone', 'end_stone', 'stained_glass', 'glass', 'glowstone', 'iron_block', 'sandstone', 'wool', 'stained_hardened_clay', 'hardened_clay', 'stone', 'cobblestone', 'planks']
const blockItems = () => bot.inventory.items().filter(i => BLOCK_NAMES.includes(i.name))
function bestBlock () {
  const bl = blockItems()
  bl.sort((a, b) => BLOCK_NAMES.indexOf(a.name) - BLOCK_NAMES.indexOf(b.name))
  return bl[0] || null
}
const SWORD_RANK = { stick: 1, wooden_sword: 2, golden_sword: 2.5, stone_sword: 3, iron_sword: 4, diamond_sword: 5 }
function bestSword () {
  const sw = bot.inventory.items().filter(i => SWORD_RANK[i.name])
  sw.sort((a, b) => (SWORD_RANK[b.name] + sharp(b) * 0.4) - (SWORD_RANK[a.name] + sharp(a) * 0.4))
  return sw[0] || null
}
function bestPick () {
  const order = ['diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe']
  for (const n of order) { const it = bot.inventory.items().find(i => i.name === n); if (it) return it }
  return null
}
function findItem (spec) {
  if (!spec) return null
  const q = L.norm(spec)
  const items = bot.inventory.items()
  return items.find(i => L.norm(dispName(i)) === q) ||
    items.find(i => i.name === String(spec).toLowerCase().replace(/ /g, '_')) ||
    items.find(i => L.norm(dispName(i)).includes(q)) ||
    items.find(i => i.name.includes(q.replace(/ /g, '_')))
}
async function equipHand (item) {
  if (!item) return false
  if (bot.heldItem && bot.heldItem.type === item.type && bot.heldItem.metadata === item.metadata && dispName(bot.heldItem) === dispName(item)) return true
  try { await bot.equip(item, 'hand'); return true } catch (e) { return false }
}
const ARMOR_DEST = { helmet: 'head', chestplate: 'torso', leggings: 'legs', boots: 'feet' }
let SKIP_ARMOR = false
const clickQuick = slot => Promise.race([bot.clickWindow(slot, 0, 1).catch(() => {}), sleep(1200)])
async function wearArmor () {
  if (SKIP_ARMOR || bot.currentWindow) return
  for (const it of bot.inventory.items()) {
    const m = /_(helmet|chestplate|leggings|boots)$/.exec(it.name)
    if (!m) continue
    const slot = { head: 5, torso: 6, legs: 7, feet: 8 }[ARMOR_DEST[m[1]]]
    const cur = bot.inventory.slots[slot]
    if (cur && armorScore(cur) >= armorScore(it)) continue
    try {
      // shift-click equips armor on this server (a plain equip() click is dropped); take the old piece off first
      if (cur) { await clickQuick(slot); await sleep(150) }
      const now = bot.inventory.items().find(i => i.name === it.name && i.slot === it.slot) || bot.inventory.items().find(i => i.name === it.name)
      if (now) await clickQuick(now.slot)
      await sleep(150)
    } catch (e) { log('equip armor failed', e.message) }
  }
}
function armorScore (it) {
  const base = { leather: 1, golden: 2, chainmail: 3, iron: 4, diamond: 5 }[it.name.split('_')[0]] || 0
  let prot = 0
  try { prot = (it.enchants || []).filter(e => /protection/.test(e.name)).reduce((s, e) => s + e.lvl, 0) } catch (e) {}
  return base + prot * 0.3
}

const solidAt = (x, y, z) => { const b = bot.blockAt(new Vec3(Math.floor(x), y, Math.floor(z))); return !!b && b.boundingBox === 'block' }
const groundUnder = (x, z) => solidAt(x, MAP.walkY - 1, z) || solidAt(x, MAP.walkY - 2, z) || solidAt(x, MAP.walkY, z)
const eyePos = () => me().offset(0, 1.62, 0)

function playerList () {
  const out = []
  for (const p of Object.values(bot.players)) {
    if (p.username === NAME || !p.entity) continue
    if (p.gamemode === 3) continue
    const team = bot.teamMap && bot.teamMap[p.username] ? bot.teamMap[p.username].team : null
    out.push({ name: p.username, entity: p.entity, team: team === 'Red' || team === 'Blue' ? team : null })
  }
  return out
}
function healthOf (e) {
  const m = e.metadata
  if (m) {
    for (const k of [6, 9]) if (typeof m[k] === 'number' && m[k] >= 0 && m[k] <= 40) return Math.round(m[k] * 10) / 10
  }
  return e.health != null ? e.health : null
}
function enemies (maxDist = 40) {
  const t = myTeam()
  return playerList().filter(p => p.team && p.team !== t && p.entity.position.distanceTo(me()) <= maxDist && !(p.entity._dead && Date.now() - p.entity._dead < 2000))
    .sort((a, b) => a.entity.position.distanceTo(me()) - b.entity.position.distanceTo(me()))
}
// velocity estimate from sampled positions
function sampleVelocities () {
  const now = Date.now()
  for (const p of playerList()) {
    const id = p.entity.id
    let h = posHist.get(id)
    if (!h) posHist.set(id, h = [])
    h.push({ t: now, p: p.entity.position.clone() })
    while (h.length > 6) h.shift()
  }
}
function velOf (e) {
  const h = posHist.get(e.id)
  if (!h || h.length < 3) return new Vec3(0, 0, 0)
  const a = h[0]; const b = h[h.length - 1]
  const dt = (b.t - a.t) / 50
  if (dt <= 0) return new Vec3(0, 0, 0)
  return b.p.minus(a.p).scaled(1 / dt) // blocks per tick
}

// ---------------------------------------------------------------- targets
function resolveTarget (spec) {
  if (!spec) return null
  if (typeof spec === 'object' && spec.x !== undefined && spec.z !== undefined) return { x: Number(spec.x), y: spec.y !== undefined ? Number(spec.y) : MAP.walkY, z: Number(spec.z) }
  if (typeof spec === 'object' && spec.target) return resolveTarget(spec.target)
  if (typeof spec === 'string') {
    if (spec === 'bronze') return resourceSpot('bronze')
    const t = MAP.named(spec, myTeam())
    if (t) return t
    const pl = playerList().find(p => p.name.toLowerCase() === spec.toLowerCase())
    if (pl) return { x: pl.entity.position.x, y: pl.entity.position.y, z: pl.entity.position.z }
  }
  return null
}

// ---------------------------------------------------------------- task engine
function newTask (name, args) {
  const t = {
    id: ++taskSeq, name, args, status: 'running', msg: '', startedAt: Date.now(), cancelled: false, waiters: new Set(), chat: [], progress: '', result: null,
    check () { if (this.cancelled) throw CANCEL },
    sleep (ms) {
      return new Promise((resolve, reject) => {
        if (this.cancelled) return reject(CANCEL)
        const w = () => { clearTimeout(timer); this.waiters.delete(w); reject(CANCEL) }
        const timer = setTimeout(() => { this.waiters.delete(w); resolve() }, ms)
        this.waiters.add(w)
      })
    }
  }
  return t
}
function cancelTask (t, why) {
  if (!t || t.status !== 'running') return
  t.cancelled = true
  t.cancelReason = why
  for (const w of [...t.waiters]) w()
  try { bot.pathfinder.setGoal(null) } catch (e) {}
  try { bot.stopDigging() } catch (e) {}
  try { bot.deactivateItem() } catch (e) {}
  releaseControls()
}
function releaseControls () {
  for (const c of ['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak']) { try { bot.setControlState(c, false) } catch (e) {} }
}

async function runAction (name, args) {
  const prev = task
  if (name !== 'chat' && prev && prev.status === 'running') {
    cancelTask(prev, 'replaced by ' + name)
    await Promise.race([prev.promise, sleep(1500)])
  }
  if (name === 'stop') { releaseControls(); lastResult = { id: prev ? prev.id : 0, action: 'stop', status: 'done', msg: 'stopped' }; return { ok: true, started: 'stop' } }
  const fn = ACTIONS[name]
  if (fn && connected && bot.entity && isSpectator() && !['chat', 'wait', 'look'].includes(name)) return { ok: false, error: 'you are a spectator (your team is eliminated or you are dead for good); only chat/wait/look work' }
  if (!fn) return { ok: false, error: `unknown action '${name}'. actions: ${Object.keys(ACTIONS).join(', ')}` }
  if (name === 'chat') {
    try { const r = await fn(newTask('chat', args), args); return { ok: true, result: r } } catch (e) { return { ok: false, error: e.message } }
  }
  const t = newTask(name, args)
  task = t
  t.promise = (async () => {
    try {
      if (!connected) throw new Error('not connected')
      t.msg = (await fn(t, args)) || 'done'
      t.status = t.cancelled ? 'cancelled' : 'done'
    } catch (e) {
      if (e === CANCEL || t.cancelled) { t.status = 'cancelled'; t.msg = 'cancelled: ' + (t.cancelReason || '') } else { t.status = 'failed'; t.msg = e && e.message ? e.message : String(e); if (!(e && e.message)) log(e) }
    } finally {
      t.endedAt = Date.now()
      if (task === t) { releaseControls(); try { bot.pathfinder.setGoal(null) } catch (e) {} }
      lastResult = { id: t.id, action: t.name, status: t.status, msg: t.msg, took: Math.round((t.endedAt - t.startedAt) / 1000) + 's' }
      if (t.chat.length) lastResult.game_msgs = t.chat.slice(-4)
      log(`#${t.id} ${t.name} -> ${t.status}: ${t.msg}`)
    }
  })()
  return { ok: true, id: t.id, started: name }
}

// ---------------------------------------------------------------- movement helpers
async function gotoPos (t, p, { range = 1.2, exact = false, timeout = 60000 } = {}) {
  t.check()
  const goal = exact ? new goals.GoalBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)) : new goals.GoalNear(p.x, p.y, p.z, range)
  bot.pathfinder.setMovements(moves)
  const timer = setTimeout(() => { try { bot.pathfinder.stop() } catch (e) {} }, timeout)
  try {
    await bot.pathfinder.goto(goal)
  } catch (e) {
    if (t.cancelled) throw CANCEL
    const m = String(e.message || e)
    if (/No path|noPath/i.test(m)) throw new Error(`no walkable path to (${r1(p.x)},${r1(p.y)},${r1(p.z)}). Islands are separated by void: build a bridge first`)
    throw new Error('movement failed: ' + m)
  } finally { clearTimeout(timer) }
  t.check()
  // the pathfinder also "succeeds" when it walks to the end of a partial path (e.g. the edge of the own island)
  const left = Math.hypot(me().x - p.x, me().z - p.z)
  if (left > range + 1.5) {
    throw new Error(`no walkable path to (${r1(p.x)},${r1(p.y)},${r1(p.z)}) (stopped ${r1(left)} blocks short). Islands are separated by void: build a bridge first`)
  }
}

/** Standing spot on a concrete spawner: bronze = an own-team spawner nobody else stands on (nearest first),
 *  silver/gold = as MAP.named. Spawners on Rush are ~11 blocks apart, so the centroid is out of pickup range. */
function resourceSpot (res) {
  if (res !== 'bronze') return MAP.named(res, myTeam())
  const others = Object.values(bot.entities).filter(e => e.type === 'player' && e !== bot.entity)
  const list = MAP.spawners.filter(sp => sp.type === 'bronze' && sp.team === myTeam())
  if (!list.length) return MAP.named(res, myTeam())
  const free = list.filter(sp => !others.some(o => Math.hypot(o.position.x - sp.x, o.position.z - sp.z) < 1.5))
  const pick = (free.length ? free : list).sort((x, y) => Math.hypot(x.x - me().x, x.z - me().z) - Math.hypot(y.x - me().x, y.z - me().z))[0]
  return { x: pick.x, y: MAP.walkY, z: pick.z }
}

/** Short manual walk onto an exact spot (only when the floor under the spot is solid). */
async function nudgeTo (t, p) {
  if (!groundUnder(p.x, p.z)) return
  const t0 = Date.now()
  while (Date.now() - t0 < 2500) {
    t.check()
    const dx = p.x - me().x; const dz = p.z - me().z
    if (Math.hypot(dx, dz) < 0.35) break
    bot.look(Math.atan2(-dx, -dz), 0, true)
    bot.setControlState('forward', true)
    await t.sleep(50)
  }
  bot.setControlState('forward', false)
}

function lookDir (yaw, pitch) {
  return new Vec3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch))
}

// ---------------------------------------------------------------- combat
function effReach (target) {
  const e = eyePos(); const tp = target.position
  const cy = Math.min(Math.max(e.y, tp.y), tp.y + 1.8)
  const hd = Math.max(0, Math.hypot(tp.x - e.x, tp.z - e.z) - 0.3)
  return Math.hypot(hd, e.y - cy)
}
let lastHitAt = 0
function hit (target) {
  const now = Date.now()
  if (now - lastHitAt < 100) return false
  lastHitAt = now + rnd(0, 25)
  try { bot.attack(target) } catch (e) { return false }
  return true
}
let lastEatAt = 0
async function eatItem (item, ms = 1750) {
  if (!item) return false
  if (!await equipHand(item)) return false
  bot.activateItem()
  await sleep(ms)
  bot.deactivateItem()
  return true
}
function gappleItem () { return bot.inventory.items().find(i => i.name === 'golden_apple') }

/** One melee step against target; returns the distance. Keeps the bot on solid ground. */
function meleeStep (target, st) {
  const p = me(); const tp = target.position
  const dx = tp.x - p.x; const dz = tp.z - p.z
  const hd = Math.hypot(dx, dz)
  bot.lookAt(new Vec3(tp.x, tp.y + 1.3, tp.z), true)
  const reach = effReach(target)
  const yaw = Math.atan2(-dx, -dz)
  const fwd = new Vec3(-Math.sin(yaw), 0, -Math.cos(yaw))
  const aheadOk = groundUnder(p.x + fwd.x * 0.9, p.z + fwd.z * 0.9)
  const onGround = bot.entity.onGround
  if (reach > 2.4 && aheadOk && onGround) {
    bot.setControlState('forward', true)
    bot.setControlState('sprint', hd > 2.5)
  } else {
    bot.setControlState('forward', false)
    bot.setControlState('sprint', false)
  }
  // strafe a little, only towards solid ground
  if (Date.now() > st.strafeUntil) {
    st.strafeUntil = Date.now() + rnd(350, 900)
    st.strafe = ['left', 'right', null][Math.floor(Math.random() * 3)]
  }
  const side = new Vec3(-fwd.z, 0, fwd.x)
  for (const dir of ['left', 'right']) {
    const sgn = dir === 'left' ? -1 : 1
    const ok = st.strafe === dir && reach < 3.6 && groundUnder(p.x + side.x * sgn * 0.9, p.z + side.z * sgn * 0.9) && onGround
    bot.setControlState(dir, ok)
  }
  if (reach <= 2.95) hit(target)
  return reach
}

async function fightLoop (t, { targetName, seconds = 30 }) {
  const t0 = Date.now()
  let target = null
  let killed = null
  let hits = 0
  let noPathSince = 0
  const st = { strafeUntil: 0, strafe: null }
  let mode = 'idle'
  const sword = bestSword()
  if (sword) await equipHand(sword)
  while (Date.now() - t0 < seconds * 1000) {
    t.check()
    if (isSpectator() || bot.health <= 0) throw new Error('you are dead/spectating')
    // choose / refresh target
    const list = enemies(60)
    let cand = null
    if (targetName) cand = list.find(p => p.name.toLowerCase() === String(targetName).toLowerCase()) || null
    else cand = target ? list.find(p => p.name === target.name) || list[0] : list[0]
    if (!cand) {
      if (target && !targetName) { /* all gone */ }
      const any = targetName && Object.values(bot.players).find(p => p.username.toLowerCase() === String(targetName).toLowerCase())
      if (target && (target.entity._dead || !bot.entities[target.entity.id])) { killed = target.name; break }
      if (any && any.gamemode === 3) { killed = targetName; break }
      if (!target) { await t.sleep(300); if (Date.now() - t0 > 6000) return 'no enemy in sight (nobody within 60 blocks)'; continue }
      return `lost ${target.name}`
    }
    if (!target || target.name !== cand.name) { target = cand; log('fighting', cand.name) }
    const e = target.entity
    if (e._dead && Date.now() - e._dead < 3000) { killed = target.name; break }
    // heal
    if (bot.health <= 8 && gappleItem() && Date.now() - lastEatAt > 9000) {
      lastEatAt = Date.now(); releaseControls(); bot.pathfinder.setGoal(null)
      await eatItem(gappleItem())
      const sw = bestSword(); if (sw) await equipHand(sw)
      continue
    }
    const d = me().distanceTo(e.position)
    if (d > 4.5) {
      // chase with the pathfinder (it never walks into the void)
      if (mode !== 'path') { releaseControls(); bot.pathfinder.setMovements(moves); bot.pathfinder.setGoal(new goals.GoalFollow(e, 2), true); mode = 'path'; noPathSince = Date.now() }
      if (bot.pathfinder.isMoving() || bot.pathfinder.goal) noPathSince = bot.pathfinder.isMoving() ? Date.now() : noPathSince
      if (Date.now() - noPathSince > 4000 && d > 6) {
        bot.pathfinder.setGoal(null)
        return `${target.name} is not reachable by walking (distance ${r1(d)}): bridge to ${target.entity.position.z < 0 ? 'the Red' : 'the Blue'} side first, or use shoot`
      }
    } else {
      if (mode !== 'melee') { bot.pathfinder.setGoal(null); mode = 'melee' }
      const before = bot.health
      meleeStep(e, st)
      hits += 0
    }
    t.progress = `fighting ${target.name} d=${r1(d)} hp=${r1(bot.health)}`
    await t.sleep(50)
  }
  releaseControls(); bot.pathfinder.setGoal(null)
  if (killed) return `${killed} died/left the fight (my hp ${r1(bot.health)})`
  return `time up, fought ${target ? target.name : 'nobody'} (my hp ${r1(bot.health)}${target ? ', their hp ' + healthOf(target.entity) : ''})`
}

// ---------------------------------------------------------------- bow
function simArrow (pitch, yaw, v0 = 3.0, maxTicks = 80) {
  // returns list of points relative to launch (dx, dy, dz) per tick
  const d = lookDir(yaw, pitch)
  let vx = d.x * v0; let vy = d.y * v0; let vz = d.z * v0
  let x = 0; let y = 0; let z = 0
  const pts = []
  for (let i = 0; i < maxTicks; i++) {
    x += vx; y += vy; z += vz
    vx *= 0.99; vy *= 0.99; vz *= 0.99; vy -= 0.05
    pts.push([x, y, z])
  }
  return pts
}
function solveAim (from, to) {
  // find pitch so that the arrow passes through `to` (horizontal distance based), returns {yaw,pitch,ticks}
  const dx = to.x - from.x; const dz = to.z - from.z
  const yaw = Math.atan2(-dx, -dz)
  const hd = Math.hypot(dx, dz)
  let best = null
  for (let deg = -50; deg <= 60; deg += 0.5) {
    const pitch = deg * Math.PI / 180
    const pts = simArrow(pitch, yaw)
    for (let i = 0; i < pts.length; i++) {
      const h = Math.hypot(pts[i][0], pts[i][2])
      if (h >= hd) {
        const err = Math.abs(pts[i][1] - (to.y - from.y))
        if (!best || err < best.err) best = { err, pitch, yaw, ticks: i + 1 }
        break
      }
    }
  }
  return best
}
function aimAtEntity (e) {
  const from = eyePos()
  const v = velOf(e)
  let T = 10
  let aim = null
  for (let k = 0; k < 4; k++) {
    const to = new Vec3(e.position.x + v.x * T, e.position.y + 1.1 + v.y * T * 0.3, e.position.z + v.z * T)
    aim = solveAim(from, to)
    if (!aim) return null
    T = aim.ticks
  }
  return aim
}

// ---------------------------------------------------------------- block placing
function waitBlockUpdate (pos, ms) {
  return new Promise(resolve => {
    const ev = `blockUpdate:${pos}`
    const to = setTimeout(() => { bot.world.removeListener(ev, fn); resolve(false) }, ms)
    const fn = () => { clearTimeout(to); resolve(true) }
    bot.world.once(ev, fn)
  })
}
const FACES = [new Vec3(0, 1, 0), new Vec3(1, 0, 0), new Vec3(-1, 0, 0), new Vec3(0, 0, 1), new Vec3(0, 0, -1), new Vec3(0, -1, 0)]
/** Places the held item at `pos` (block coords) against any adjacent solid block. */
async function placeAt (t, pos, { maxReach = 4.3 } = {}) {
  const p = new Vec3(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z))
  const here = bot.blockAt(p)
  if (here && here.name !== 'air') return 'exists'
  let ref = null; let face = null
  for (const f of FACES) {
    const rp = p.minus(f) // reference block is on the opposite side of the face vector
    const rb = bot.blockAt(rp)
    if (rb && rb.boundingBox === 'block') { ref = rb; face = f; break }
  }
  if (!ref) return 'no_support'
  const center = ref.position.offset(0.5 + face.x * 0.5, 0.5 + face.y * 0.5, 0.5 + face.z * 0.5)
  if (eyePos().distanceTo(center) > maxReach) return 'too_far'
  t.check()
  bot.lookAt(center, true)
  await sleep(60)
  const waiting = waitBlockUpdate(p, 900)
  try { await bot._genericPlace(ref, face, { forceLook: 'ignore', swingArm: 'right' }) } catch (e) { return 'error:' + e.message }
  const ok = await waiting
  const after = bot.blockAt(p)
  return ok && after && after.name !== 'air' ? 'placed' : 'rejected'
}

// ---------------------------------------------------------------- shop
function findShopkeeper () {
  const vs = Object.values(bot.entities).filter(e => e.name === 'Villager' && e.position.distanceTo(me()) < 8)
  vs.sort((a, b) => a.position.distanceTo(me()) - b.position.distanceTo(me()))
  return vs[0] || null
}
function waitWindow (ms, notId) {
  return new Promise(resolve => {
    const to = setTimeout(() => { bot.removeListener('windowOpen', fn); resolve(bot.currentWindow && bot.currentWindow.id !== notId ? bot.currentWindow : null) }, ms)
    const fn = w => { if (w.id !== notId) { clearTimeout(to); bot.removeListener('windowOpen', fn); resolve(w) } }
    bot.on('windowOpen', fn)
  })
}
async function openShop (t) {
  if (bot.currentWindow) { try { bot.closeWindow(bot.currentWindow) } catch (e) {} await sleep(150) }
  for (let attempt = 0; attempt < 3; attempt++) {
    t.check()
    const v = findShopkeeper()
    if (!v) throw new Error('no shopkeeper nearby: goto shop first')
    await bot.lookAt(v.position.offset(0, 1.2, 0), true)
    const wait = waitWindow(2500, -1)
    require('../harness/bots').useEntity(bot, v)
    const w = await wait
    if (w) { await t.sleep(250); return w }
  }
  throw new Error('shop window did not open')
}
function slotInfo (w) {
  const out = []
  for (let i = 0; i < 54 && i < w.slots.length; i++) { const s = w.slots[i]; if (s && !/stained_glass_pane|barrier/.test(s.name)) out.push({ slot: i, item: s, name: dispName(s) }) }
  return out
}
async function buyOnce (t, w, slot) {
  const mark = chatSeq
  await bot.clickWindow(slot, 0, 0)
  const t0 = Date.now()
  while (Date.now() - t0 < 1200) {
    const lines = chatBuf.filter(c => c.i > mark).map(c => c.text)
    const ok = lines.find(l => /purchased/.test(l)); const bad = lines.find(l => /not have enough/.test(l))
    if (ok) return { ok: true, line: ok }
    if (bad) return { ok: false, line: bad }
    await t.sleep(60)
  }
  return { ok: null, line: '' }
}

// ---------------------------------------------------------------- ACTIONS
const ACTIONS = {}

/** goto, optionally building a bridge when there is no walkable path (a.bridge = true). */
async function gotoOrBridge (t, dest, spec, gopts, autoBridge) {
  try { await gotoPos(t, dest, gopts) } catch (e) {
    if (e === CANCEL || !autoBridge || !/bridge/.test(e.message)) throw e
    if (!bestBlock()) throw new Error(e.message + ' (and you have no blocks to bridge with: buy Sandstone)')
    await ACTIONS.bridge(t, { target: spec })
    await gotoPos(t, dest, gopts)
  }
}

ACTIONS.goto = async (t, a) => {
  const spec = a.target !== undefined ? a.target : (a.x !== undefined ? a : null)
  const dest = resolveTarget(spec)
  if (!dest) throw new Error(`goto needs {x,y,z} or target: ${['middle', 'own_base', 'enemy_base', 'own_bed', 'enemy_bed', 'shop', 'bronze', 'silver', 'gold'].join('|')} or a player name`)
  const resourceSpot = typeof spec === 'string' && ['bronze', 'silver', 'gold', 'enemy_bronze', 'enemy_silver'].includes(spec)
  await gotoOrBridge(t, dest, spec, { range: a.range !== undefined ? Number(a.range) : (resourceSpot ? 1.6 : 1.2) }, a.bridge)
  if (resourceSpot) await nudgeTo(t, dest)
  return `arrived at (${r1(me().x)}, ${r1(me().y)}, ${r1(me().z)})`
}

ACTIONS.collect = async (t, a) => {
  const res = String(a.resource || 'bronze').toLowerCase().replace('iron', 'silver')
  if (!['bronze', 'silver', 'gold'].includes(res)) throw new Error('resource must be bronze|silver|gold')
  const seconds = Math.min(Number(a.seconds || 20), 120)
  const spot = resourceSpot(res)
  const before = money()
  await gotoOrBridge(t, spot, res, { range: 1.6 }, a.bridge)
  await nudgeTo(t, spot)
  const t0 = Date.now()
  while (Date.now() - t0 < seconds * 1000) {
    t.check()
    if (!reflexMoving && me().distanceTo(new Vec3(spot.x, me().y, spot.z)) > 1.2) {
      try { await gotoPos(t, spot, { range: 1.6, timeout: 15000 }); await nudgeTo(t, spot) } catch (e) { if (e === CANCEL) throw e }
    }
    const m = money()
    t.progress = `${res} ${m[res] - before[res]} gained`
    await t.sleep(400)
  }
  const m = money()
  return `collected: bronze +${m.bronze - before.bronze}, silver +${m.silver - before.silver}, gold +${m.gold - before.gold}; now ${m.bronze}/${m.silver}/${m.gold} (bronze/silver/gold)`
}

ACTIONS.buy = async (t, a) => {
  const itemName = a.item || a.name
  if (!itemName) throw new Error('buy needs item')
  const times = Math.max(1, Math.min(Number(a.count || a.amount || 1), 64))
  const key = L.norm(itemName)
  let entry = SHOP.items[key]
  if (!entry) {
    const k = Object.keys(SHOP.items).find(k => k.includes(key) || key.includes(k))
    entry = k ? SHOP.items[k] : null
  }
  if (!entry) throw new Error(`unknown shop item '${itemName}'. known: ${Object.values(SHOP.items).map(i => i.name).join(', ')}`)
  const before = money()
  const invBefore = {}
  for (const it of bot.inventory.items()) invBefore[dispName(it)] = (invBefore[dispName(it)] || 0) + it.count
  const near = findShopkeeper()
  if (!near || near.position.distanceTo(me()) > 5) await gotoPos(t, MAP.named('shop', myTeam()), { range: 1.5 })
  let w = await openShop(t)
  // category selection: prefer a specific category (not "Quick Buy") for the item
  const cats = [...entry.categories].sort((x, y) => (x === 'Quick Buy') - (y === 'Quick Buy'))
  let bought = 0; let lastMsg = ''
  let found = null
  for (const catName of cats) {
    t.check()
    // go back to the category page if needed
    if (w.slots[9] && /Zur/.test(dispName(w.slots[0]) || '') ) { await bot.clickWindow(0, 0, 0); await t.sleep(300); w = bot.currentWindow }
    const catSlot = slotInfo(w).find(s => s.slot >= 9 && s.slot <= 17 && L.norm(s.name) === L.norm(catName))
    if (!catSlot) continue
    const nw = waitWindow(2500, w.id)
    await bot.clickWindow(catSlot.slot, 0, 0)
    const w2 = await nw
    if (!w2) continue
    w = w2
    await t.sleep(200)
    found = slotInfo(w).find(s => s.slot >= 9 && L.norm(s.name) === key)
    if (found) break
  }
  if (!found) { try { bot.closeWindow(bot.currentWindow) } catch (e) {} throw new Error(`item '${entry.name}' not found in the shop window`) }
  for (let i = 0; i < times; i++) {
    t.check()
    const r = await buyOnce(t, w, found.slot)
    lastMsg = r.line
    if (r.ok === false) break
    bought++
    await t.sleep(120)
  }
  try { if (bot.currentWindow) bot.closeWindow(bot.currentWindow) } catch (e) {}
  await t.sleep(250)
  await wearArmor()
  const after = money()
  const m = after
  if (bought === 0) throw new Error(`could not buy ${entry.name} (price ${entry.price} ${entry.currency}); you have ${m.bronze} bronze, ${m.silver} silver, ${m.gold} gold`)
  return `bought ${bought}x ${entry.name}${bought < times ? ` (stopped: not enough money, wanted ${times})` : ''}; money left: ${m.bronze} bronze, ${m.silver} silver, ${m.gold} gold`
}

ACTIONS.equip = async (t, a) => {
  const it = findItem(a.item || a.name)
  if (!it) throw new Error(`no item matching '${a.item || a.name}' in the inventory`)
  const m = /_(helmet|chestplate|leggings|boots)$/.exec(it.name)
  if (m) { const dest = { head: 5, torso: 6, legs: 7, feet: 8 }[ARMOR_DEST[m[1]]]; if (bot.inventory.slots[dest]) { await clickQuick(dest); await sleep(150) } await clickQuick(it.slot); await sleep(200); return `wearing ${dispName(it)}` }
  await bot.equip(it, 'hand')
  return `holding ${dispName(it)}`
}

ACTIONS.eat_gapple = async (t) => {
  const g = gappleItem()
  if (!g) throw new Error('no golden apple (buy one: item "Golden Apple")')
  const hp = bot.health
  await eatItem(g)
  t.check()
  const sw = bestSword(); if (sw) await equipHand(sw)
  return `ate a golden apple, hp ${r1(hp)} -> ${r1(bot.health)}`
}

ACTIONS.wait = async (t, a) => {
  const s = Math.min(Number(a.seconds || 5), 120)
  await t.sleep(s * 1000)
  return `waited ${s}s`
}

ACTIONS.chat = async (t, a) => {
  if (!a.text) throw new Error('chat needs text')
  bot.chat(String(a.text).slice(0, 200))
  return 'sent'
}

ACTIONS.look = async (t, a) => {
  const spec = a.target !== undefined ? a.target : a
  const p = resolveTarget(spec)
  if (!p) throw new Error('look needs a target (name, player or {x,y,z})')
  await bot.lookAt(new Vec3(p.x, p.y + (typeof spec === 'string' && playerList().find(q => q.name === spec) ? 1.6 : 0), p.z), true)
  return 'looking'
}

ACTIONS.attack = async (t, a) => fightLoop(t, { targetName: a.player || a.name, seconds: Math.min(Number(a.seconds || 30), 180) })

ACTIONS.shoot = async (t, a) => {
  const seconds = Math.min(Number(a.seconds || 20), 120)
  const bow = bot.inventory.items().find(i => i.name === 'bow')
  if (!bow) throw new Error('no bow (buy "Bow I")')
  if (!count('arrow')) throw new Error('no arrows (buy "Arrow")')
  await equipHand(bow)
  const t0 = Date.now()
  let shots = 0
  let name = null
  while (Date.now() - t0 < seconds * 1000) {
    t.check()
    const list = enemies(70)
    const c = a.player ? list.find(p => p.name.toLowerCase() === String(a.player).toLowerCase()) : list[0]
    if (!c) { await t.sleep(400); if (Date.now() - t0 > 5000 && !shots) return 'no enemy in sight'; continue }
    name = c.name
    const d = me().distanceTo(c.entity.position)
    if (d > 60) { await t.sleep(300); continue }
    if (!count('arrow')) return `out of arrows after ${shots} shots`
    if (!bot.heldItem || bot.heldItem.name !== 'bow') await equipHand(bow)
    bot.activateItem()
    const drawStart = Date.now()
    while (Date.now() - drawStart < 1150) {
      t.check()
      const aim = aimAtEntity(c.entity)
      if (aim) bot.look(aim.yaw, aim.pitch, true)
      await t.sleep(50)
    }
    const aim = aimAtEntity(c.entity)
    if (aim) { bot.look(aim.yaw, aim.pitch, true); await t.sleep(60) }
    bot.deactivateItem()
    shots++
    t.progress = `${shots} arrows at ${name}`
    await t.sleep(250)
  }
  return `shot ${shots} arrows at ${name || 'nobody'}${name ? ', their hp now ' + healthOf((enemies(80).find(p => p.name === name) || { entity: { metadata: {} } }).entity) : ''}`
}

// ---- bridging: straight (4-connected) line of blocks at floor level between the current position and the target
function lineCells (x0, z0, x1, z1) {
  const cells = []
  const dx = Math.abs(x1 - x0); const dz = Math.abs(z1 - z0)
  const sx = Math.sign(x1 - x0); const sz = Math.sign(z1 - z0)
  let x = x0; let z = z0; let ix = 0; let iz = 0
  while (ix < dx || iz < dz) {
    if (iz >= dz || (ix < dx && (ix + 0.5) / dx < (iz + 0.5) / dz)) { x += sx; ix++ } else { z += sz; iz++ }
    cells.push({ x, z })
  }
  return cells
}

ACTIONS.bridge = async (t, a) => {
  const spec = a.target !== undefined ? a.target : a
  const dest = resolveTarget(spec)
  if (!dest) throw new Error('bridge needs target: middle|enemy_base|own_base|shop|silver|gold|bronze or {x,z}')
  const GY = MAP.walkY - 1
  const sx = Math.floor(me().x); const sz = Math.floor(me().z)
  const ex = Math.floor(dest.x); const ez = Math.floor(dest.z)
  if (!solidAt(sx, GY, sz)) throw new Error(`not standing on a block (floor level y=${GY}); are you in the air?`)
  const cells = lineCells(sx, sz, ex, ez)
  if (!cells.length) return 'already at the target'
  if (cells.length > 250) throw new Error('target too far to bridge (>250 blocks); bridge to the middle first')
  const centerOf = c => new Vec3(c.x + 0.5, GY + 0.5, c.z + 0.5)
  let placed = 0; let fails = 0
  const t0 = Date.now()
  let status = null
  while (Date.now() - t0 < 180000) {
    t.check()
    const g = cells.findIndex(c => !solidAt(c.x, GY, c.z))
    if (g < 0) { status = 'connected'; break }
    const dist = eyePos().distanceTo(centerOf(cells[g]))
    if (dist > 4.2) {
      const a2 = Math.max(0, g - 2)
      const c = cells[a2]
      try { await gotoPos(t, { x: c.x + 0.5, y: MAP.walkY, z: c.z + 0.5 }, { range: 0.5, timeout: 25000 }) } catch (e) { if (e === CANCEL) throw e; status = 'walk_failed:' + e.message; break }
      continue
    }
    let blk = bestBlock()
    if (!blk) { status = 'out_of_blocks'; break }
    if (!bot.heldItem || bot.heldItem.type !== blk.type || bot.heldItem.metadata !== blk.metadata) await equipHand(blk)
    const r = await placeAt(t, new Vec3(cells[g].x, GY, cells[g].z), { maxReach: 4.6 })
    if (r === 'placed') { placed++; fails = 0; t.progress = `placed ${placed}/${cells.length} blocks` } else if (r === 'exists') { /* race */ } else {
      fails++
      if (fails > 6) { status = 'place_failed:' + r; break }
      // step closer / re-aim and retry
      await t.sleep(150)
      if (fails > 2) { try { await gotoPos(t, { x: cells[Math.max(0, g - 1)].x + 0.5, y: MAP.walkY, z: cells[Math.max(0, g - 1)].z + 0.5 }, { range: 0.5, timeout: 8000 }) } catch (e) { if (e === CANCEL) throw e } }
    }
  }
  releaseControls()
  const left = blockItems().reduce((s, i) => s + i.count, 0)
  if (status === 'connected') {
    try { await gotoPos(t, dest, { range: 2.5, timeout: 25000 }) } catch (e) { if (e === CANCEL) throw e }
    return `bridge complete (${placed} blocks placed); standing at (${r1(me().x)}, ${r1(me().y)}, ${r1(me().z)}), ${left} blocks left`
  }
  if (status === 'out_of_blocks') throw new Error(`out of blocks after placing ${placed}; buy more Sandstone and call bridge again (same target)`)
  throw new Error(`bridge stopped (${status || 'timeout'}) after ${placed} blocks`)
}

// ---- bed breaking
const isBed = b => b && /bed/.test(b.name) && b.name !== 'bedrock'
function bedBlocks (teamName) {
  const h = MAP.teams[teamName].bed
  const out = []
  const head = bot.blockAt(new Vec3(h.x, h.y, h.z))
  if (isBed(head)) out.push(head)
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const b = bot.blockAt(new Vec3(h.x + dx, h.y, h.z + dz)); if (isBed(b)) out.push(b) }
  return out
}
function ringSpots (c, r) {
  const out = []
  for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4; out.push({ x: c.x + Math.cos(ang) * r, y: MAP.walkY, z: c.z + Math.sin(ang) * r }) }
  return out
}
ACTIONS.break_bed = async (t, a) => {
  const team = myTeam() || MAP.teamNames[0]
  const enemyName = MAP.other(team)
  const hb = MAP.teams[enemyName].bed
  const bcenter = { x: hb.x + 0.5, y: hb.y, z: hb.z + 0.5 }
  if (!bedBlocks(enemyName).length) return 'the enemy bed is already destroyed'
  const t0 = Date.now()
  let dug = 0; let relocate = 0
  const spots = ringSpots(bcenter, 2.3)
  const near = () => Math.hypot(me().x - bcenter.x, me().z - bcenter.z) < 6 && Math.abs(me().y - MAP.walkY) < 3
  if (!near()) {
    try { await gotoPos(t, { x: bcenter.x, y: MAP.walkY, z: bcenter.z }, { range: 3.5 }) } catch (e) { if (e === CANCEL) throw e; throw new Error(`cannot reach the enemy bed on foot: ${e.message}`) }
  }
  while (Date.now() - t0 < Math.min(Number(a.seconds || 90), 240) * 1000) {
    t.check()
    const beds = bedBlocks(enemyName)
    if (!beds.length) { await t.sleep(300); return `enemy bed destroyed (${dug} blocks dug on the way)` }
    const bed = beds.sort((x, y) => x.position.distanceTo(me()) - y.position.distanceTo(me()))[0]
    const bc = bed.position.offset(0.5, 0.3, 0.5)
    const eye = eyePos()
    if (eye.distanceTo(bc) > 4.4) {
      try { await gotoPos(t, { x: bc.x, y: MAP.walkY, z: bc.z }, { range: 3, timeout: 15000 }) } catch (e) {
        if (e === CANCEL) throw e
        const sp = spots[relocate++ % spots.length]
        try { await gotoPos(t, sp, { range: 1.5, timeout: 15000 }) } catch (e2) { if (e2 === CANCEL) throw e2 }
      }
      continue
    }
    const dir = bc.minus(eye).normalize()
    const target = bot.world.raycast(eye, dir, 6)
    if (!target) { await t.sleep(100); relocate++; continue }
    const pick = bestPick()
    if (isBed(target)) {
      const hand = bot.inventory.items().find(i => /_axe$/.test(i.name)) || pick
      if (hand) await equipHand(hand)
    } else if (pick) await equipHand(pick)
    t.progress = `digging ${target.name} at ${target.position}`
    try {
      await bot.dig(target, true)
      if (!isBed(target)) dug++
    } catch (e) {
      if (t.cancelled) throw CANCEL
      log('dig failed', e.message)
    }
    await t.sleep(120)
    const still = bot.blockAt(target.position)
    if (still && still.name === target.name && !isBed(target)) {
      // unbreakable (map block): approach from another side
      const sp = spots[relocate++ % spots.length]
      try { await gotoPos(t, sp, { range: 1.5, timeout: 15000 }) } catch (e) { if (e === CANCEL) throw e }
    }
  }
  throw new Error('time up; enemy bed still alive (too many blocks around it, or enemies in the way)')
}

ACTIONS.defend_bed = async (t, a) => {
  const team = myTeam() || MAP.teamNames[0]
  const own = MAP.teams[team]
  const n = Math.min(Number(a.blocks || a.count || 10), 40)
  if (!bestBlock()) throw new Error('no blocks to place (buy "Sandstone")')
  const Y = own.bed.y
  const key = (x, y, z) => `${x},${y},${z}`
  const bedCells = bedBlocks(team).map(b => b.position)
  if (!bedCells.length) bedCells.push(new Vec3(own.bed.x, Y, own.bed.z))
  const taken = new Set(bedCells.map(p => key(p.x, p.y, p.z)))
  const H = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  const layer1 = []
  for (const p of bedCells) {
    layer1.push([p.x, Y + 1, p.z])
    for (const [dx, dz] of H) layer1.push([p.x + dx, Y, p.z + dz])
  }
  const layer2 = []
  for (const [x, y, z] of layer1) {
    if (y === Y + 1) layer2.push([x, Y + 2, z])
    else { layer2.push([x, Y + 1, z]); for (const [dx, dz] of H) layer2.push([x + dx, Y, z + dz]) }
  }
  const spawn = own.spawn
  const far = c => -Math.hypot(c[0] + 0.5 - spawn.x, c[2] + 0.5 - spawn.z) // fill the side away from our spawn first, the open side last
  const uniq = []
  for (const c of [...layer1.sort((p, q) => far(p) - far(q)), ...layer2.sort((p, q) => far(p) - far(q))]) {
    const k = key(...c)
    if (taken.has(k)) continue
    taken.add(k); uniq.push(c)
  }
  const stand = MAP.named('own_bed', team)
  await gotoPos(t, stand, { range: 1.2 })
  let placed = 0
  const failed = []
  for (const [x, y, z] of uniq) {
    if (placed >= n) break
    t.check()
    const b = bestBlock(); if (!b) break
    await equipHand(b)
    let r = await placeAt(t, new Vec3(x, y, z), { maxReach: 4.4 })
    if (r === 'too_far') {
      await gotoPos(t, { x: x + 0.5, y: MAP.walkY, z: z + 0.5 }, { range: 3, timeout: 10000 }).catch(e => { if (e === CANCEL) throw e })
      r = await placeAt(t, new Vec3(x, y, z), { maxReach: 4.6 })
    }
    if (r === 'placed') placed++
    else if (r === 'rejected' || r === 'no_support') failed.push([x, y, z])
  }
  // cells we were standing in: step away and retry
  if (failed.length && placed < n) {
    await gotoPos(t, MAP.named('own_base', team), { range: 4 }).catch(e => { if (e === CANCEL) throw e })
    for (const [x, y, z] of failed) {
      if (placed >= n) break
      const b = bestBlock(); if (!b) break
      await equipHand(b)
      if (await placeAt(t, new Vec3(x, y, z), { maxReach: 4.6 }) === 'placed') placed++
    }
  }
  return `placed ${placed} blocks around your bed; ${blockItems().reduce((s2, i) => s2 + i.count, 0)} blocks left`
}

// generic place, e.g. TNT or any block: place {item, at}
ACTIONS.place = async (t, a) => {
  const it = findItem(a.item || a.name) || bestBlock()
  if (!it) throw new Error('no such item')
  const at = a.at ? resolveTarget(a.at) : null
  if (!at) throw new Error('place needs at: {x,y,z} (block coordinates) or a named target')
  await equipHand(it)
  let r = await placeAt(t, new Vec3(Math.floor(at.x), Math.floor(at.y), Math.floor(at.z)), { maxReach: 4.4 })
  if (r === 'too_far') { await gotoPos(t, at, { range: 3 }); r = await placeAt(t, new Vec3(Math.floor(at.x), Math.floor(at.y), Math.floor(at.z)), { maxReach: 4.6 }) }
  return r
}

// ---- special items
ACTIONS.use = async (t, a) => {
  const nm = a.item || a.name
  if (!nm) throw new Error('use needs item')
  const key = L.norm(nm)
  const it = findItem(nm)
  if (!it) throw new Error(`no item matching '${nm}'`)
  const label = L.norm(dispName(it))
  const mark = chatSeq
  const toward = a.toward || a.target
  if (/teleporter/.test(label)) {
    const y0 = me().y
    await equipHand(it)
    bot.activateItem(); await sleep(80); bot.deactivateItem()
    const para = findItem('Parachute')
    if (para && toward) await equipHand(para)
    // wait for the 3 s countdown and the launch
    const t0 = Date.now()
    while (Date.now() - t0 < 9000) {
      t.check()
      if (me().y > y0 + 6) break
      await t.sleep(40)
    }
    if (me().y <= y0 + 6) return `teleporter did not launch: ${chatBuf.filter(c => c.i > mark).map(c => c.text).join(' | ') || 'no message'}`
    if (!toward || !para) {
      // wait for the home teleport
      await t.sleep(2500)
      return `launched; now at (${r1(me().x)}, ${r1(me().y)}, ${r1(me().z)})`
    }
    // open the parachute high up (before the home teleport at +150)
    const t1 = Date.now()
    while (me().y < y0 + 128 && Date.now() - t1 < 4000) { t.check(); await t.sleep(20) }
    bot.activateItem()
    await sleep(60)
    return glide(t, toward, 'teleporter + parachute')
  }
  if (/fallschirm/.test(label)) {
    await equipHand(it)
    if (bot.entity.onGround) throw new Error('you must be in the air to use the Parachute')
    bot.activateItem()
    await sleep(80)
    return glide(t, toward, 'parachute')
  }
  await equipHand(it)
  if (/rettungsplattform/.test(label)) {
    bot.activateItem(); await sleep(300)
    return chatBuf.filter(c => c.i > mark).map(c => c.text).join(' | ') || 'used'
  }
  if (/mobiler shop/.test(label)) {
    // place on the block next to us
    const f = me().offset(0, -1, 0)
    const ground = bot.blockAt(new Vec3(Math.floor(f.x) + 1, MAP.walkY - 1, Math.floor(f.z)))
    if (!ground) throw new Error('no ground')
    await bot.lookAt(ground.position.offset(0.5, 1, 0.5), true)
    bot._genericPlace(ground, new Vec3(0, 1, 0), { forceLook: 'ignore', swingArm: 'right' })
    await sleep(500)
    return chatBuf.filter(c => c.i > mark).map(c => c.text).join(' | ') || 'placed mobile shop next to you (20 s)'
  }
  bot.activateItem(); await sleep(250); bot.deactivateItem()
  return 'used ' + dispName(it)
}

async function glide (t, toward, label) {
  const dest = resolveTarget(toward)
  const t0 = Date.now()
  let steps = 0
  while (Date.now() - t0 < 32000) {
    t.check()
    const p = me()
    if (bot.entity.onGround && Date.now() - t0 > 1500) break
    if (dest) {
      const dx = dest.x - p.x; const dz = dest.z - p.z
      const hd = Math.hypot(dx, dz)
      const yaw = Math.atan2(-dx, -dz)
      // glide flat towards the target; once above it look straight down so you hover and sink onto it
      const pitch = hd < 3.5 ? 1.5 : (hd < 12 ? 0.9 : (p.y > MAP.walkY + 26 ? 0.0 : 0.15))
      bot.look(yaw, pitch, true)
    }
    steps++
    await t.sleep(50)
  }
  return `${label}: landed at (${r1(me().x)}, ${r1(me().y)}, ${r1(me().z)})${dest ? ', ' + r1(Math.hypot(dest.x - me().x, dest.z - me().z)) + ' blocks from the target' : ''}`
}

// ---------------------------------------------------------------- reflexes (run every 100 ms)
function reflexTick () {
  if (connected && bot && bot.entity) { const spec = isSpectator(); if (bot.physicsEnabled === spec) bot.physicsEnabled = !spec }
  if (!connected || !bot || !bot.entity || isSpectator() || bot.health <= 0) return
  const name = task && task.status === 'running' ? task.name : null
  // rescue from the void: use a Rescue Platform while falling
  if (me().y < MAP.walkY - 6 && me().y > MAP.voidY && bot.entity.velocity.y < -0.2) {
    const plat = findItem('Rescue Platform')
    if (plat && Date.now() - (reflexTick.lastPlat || 0) > 3000) {
      reflexTick.lastPlat = Date.now()
      equipHand(plat).then(() => { bot.activateItem(); setTimeout(() => bot.deactivateItem(), 100) })
      pushChat('* auto: Rescue Platform benutzt', 'self')
    }
  }
  if (reflexOff || bot.currentWindow || ['attack', 'shoot', 'buy'].includes(name)) return
  const foes = enemies(6)
  if (!foes.length) { if (reflexMoving) { reflexMoving = false; if (!name || name === 'wait' || name === 'collect') releaseControls() } return }
  const foe = foes[0]
  const reach = effReach(foe.entity)
  const idleish = !name || name === 'wait' || name === 'collect'
  const attacked = Date.now() - lastDamageAt < 2500
  if (reach <= 3.0 && (attacked || reach <= 2.6)) {
    if (idleish) {
      const sw = bestSword(); if (sw && (!bot.heldItem || bot.heldItem.type !== sw.type)) equipHand(sw)
      reflexMoving = true
      meleeStep(foe.entity, reflexTick.st || (reflexTick.st = { strafeUntil: 0, strafe: null }))
    } else hit(foe.entity)
  } else if (idleish && attacked && reach <= 5.5) {
    reflexMoving = true
    meleeStep(foe.entity, reflexTick.st || (reflexTick.st = { strafeUntil: 0, strafe: null }))
  } else if (reflexMoving) {
    reflexMoving = false
    if (idleish) releaseControls()
  }
}
let eating = false
async function idleTick () {
  if (!connected || !bot || !bot.entity || isSpectator() || bot.health <= 0 || eating) return
  const idle = !task || task.status !== 'running' || ['wait', 'collect'].includes(task.name)
  if (!idle || reflexMoving) return
  if (phase() !== 'running') return
  if (bot.food <= 12 || (bot.health <= 10 && bot.food < 20)) {
    const food = bot.inventory.items().find(i => ['cooked_beef', 'apple', 'bread', 'cooked_porkchop'].includes(i.name))
    if (food && Date.now() - lastEatAt > 4000) {
      eating = true; lastEatAt = Date.now()
      try { await eatItem(food, 1800); const sw = bestSword(); if (sw) await equipHand(sw) } finally { eating = false }
    }
  }
  if (bot.health <= 7 && gappleItem() && Date.now() - lastEatAt > 8000 && enemies(8).length === 0) {
    eating = true; lastEatAt = Date.now()
    try { await eatItem(gappleItem()); const sw = bestSword(); if (sw) await equipHand(sw) } finally { eating = false }
  }
  // wear anything better
  if (!idleTick.lastArmor || Date.now() - idleTick.lastArmor > 5000) { idleTick.lastArmor = Date.now(); await wearArmor() }
}

// ---------------------------------------------------------------- state
function invState () {
  const items = {}
  for (const it of bot.inventory.items()) {
    if (['brick', 'iron_ingot', 'gold_ingot'].includes(it.name)) continue
    const k = dispName(it)
    items[k] = (items[k] || 0) + it.count
  }
  const m = money()
  return { bronze: m.bronze, silver: m.silver, gold: m.gold, items: Object.entries(items).map(([k, v]) => (v > 1 ? `${k} x${v}` : k)) }
}
function armorState () {
  const slots = { helmet: 5, chest: 6, legs: 7, boots: 8 }
  const out = {}
  for (const [k, s] of Object.entries(slots)) { const it = bot.inventory.slots[s]; if (it) out[k] = dispName(it) }
  return out
}
function getState (opts = {}) {
  if (!bot || !connected || !bot.entity) return { name: NAME, connected: false }
  const team = myTeam()
  const ph = phase()
  const beds = bedStatus()
  const enemyTeam = team ? MAP.other(team) : null
  const p = me()
  const st = {
    name: NAME,
    team,
    phase: ph,
    alive: !isSpectator() && bot.health > 0,
    spectator: !!isSpectator(),
    time: gameClock(),
    pos: [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.z * 10) / 10],
    on: team ? MAP.where(p.x, p.y, p.z, team) : null,
    hp: r1(bot.health),
    food: bot.food,
    held: bot.heldItem ? dispName(bot.heldItem) : null,
    inv: invState(),
    armor: armorState(),
    own_bed: team ? (beds[team] !== undefined ? (beds[team] ? 'alive' : 'destroyed') : '?') : null,
    enemy_bed: enemyTeam ? (beds[enemyTeam] !== undefined ? (beds[enemyTeam] ? 'alive' : 'destroyed') : '?') : null,
    near: playerList().map(q => ({ n: q.name, team: q.team, pos: [Math.round(q.entity.position.x), Math.round(q.entity.position.y), Math.round(q.entity.position.z)], hp: healthOf(q.entity), d: Math.round(q.entity.position.distanceTo(p) * 10) / 10 }))
      .filter(q => q.d <= 32).sort((a, b) => a.d - b.d),
    action: task ? { id: task.id, name: task.name, status: task.status, msg: task.status === 'running' ? task.progress : task.msg, sec: Math.round(((task.endedAt || Date.now()) - task.startedAt) / 1000) } : null
  }
  if (ended) st.winner = ended.winner
  const lines = chatBuf.filter(c => c.i > chatSeen && c.text)
  if (!opts.peek) chatSeen = chatSeq
  const outChat = []
  for (const c of lines.slice(-40)) {
    const prev = outChat[outChat.length - 1]
    if (prev && prev.text === c.text) prev.n++; else outChat.push({ text: c.text, n: 1 })
  }
  st.chat = outChat.slice(-14).map(c => (c.n > 1 ? `${c.text} (x${c.n})` : c.text))
  if (lastResult && task && lastResult.id === task.id && lastResult.game_msgs) st.action.game_msgs = lastResult.game_msgs.filter((x, i, arr) => arr.indexOf(x) === i)
  else if (lastResult && !task) st.last = lastResult
  return st
}

// ---------------------------------------------------------------- HTTP
const HELP = {
  actions: {
    goto: '{target: middle|own_base|enemy_base|own_bed|enemy_bed|shop|bronze|silver|gold|<playerName>} or {x,y,z}',
    collect: '{resource: bronze|silver|gold, seconds: 20}',
    buy: '{item: "Sandstone", count: 3}  (count = number of purchases)',
    bridge: '{target: middle|enemy_base|own_base} or {x,z}',
    attack: '{player?: name, seconds?: 30}',
    shoot: '{player?: name, seconds?: 20}',
    break_bed: '{}',
    defend_bed: '{blocks: 10}',
    place: '{item?, at: {x,y,z}}',
    equip: '{item}',
    eat_gapple: '{}',
    use: '{item: Teleporter|Parachute|Rescue Platform|Mobile Shop, toward?: target for gliding}',
    look: '{target}',
    chat: '{text}',
    wait: '{seconds}',
    stop: '{}'
  }
}
const server = http.createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)) }
  try {
    const url = new URL(req.url, 'http://x')
    if (req.method === 'GET' && url.pathname === '/state') return send(200, getState({ peek: url.searchParams.has('peek') }))
    if (req.method === 'GET' && url.pathname === '/block') {
      const x = Number(url.searchParams.get('x')); const z = Number(url.searchParams.get('z'))
      const col = {}
      for (let y = MAP.walkY - 4; y <= MAP.walkY + 3; y++) { const b = bot.blockAt(new Vec3(x, y, z)); col[y] = b ? b.name : null }
      return send(200, col)
    }
    if (req.method === 'GET' && url.pathname === '/eval' && process.env.BOTD_DEBUG) {
      let out; try { out = await eval(url.searchParams.get('e')) } catch (e) { out = 'ERR ' + e.message }
      return send(200, { out: JSON.parse(JSON.stringify(out === undefined ? null : out, (k, v) => (typeof v === 'bigint' ? String(v) : v))) })
    }
    if (req.method === 'GET' && url.pathname === '/help') return send(200, HELP)
    if (req.method === 'GET' && url.pathname === '/debug') {
      const near = playerList().map(q => ({ n: q.name, team: q.team, md: q.entity.metadata, held: q.entity.heldItem && q.entity.heldItem.name, equip: (q.entity.equipment || []).map(e => e && e.name) }))
      return send(200, { near, sb: sidebar() && Object.keys(sidebar().itemsMap), teams: Object.keys(bot.teams || {}), shop: Object.keys(SHOP.items).length })
    }
    if (req.method === 'POST' && (url.pathname === '/do' || url.pathname === '/')) {
      let body = ''
      for await (const c of req) body += c
      let a
      try { a = JSON.parse(body || '{}') } catch (e) { return send(400, { ok: false, error: 'invalid JSON' }) }
      const name = a.action || a.do || a.type
      if (!name) return send(400, { ok: false, error: 'missing "action"', ...HELP })
      return send(200, await runAction(String(name), a))
    }
    send(404, { error: 'GET /state | POST /do | GET /help' })
  } catch (e) { send(500, { error: e.message }) }
})
server.listen(API_PORT, '127.0.0.1', () => log(`API on http://127.0.0.1:${API_PORT}`))

start()
setInterval(() => { try { if (connected && bot && bot.entity) sampleVelocities() } catch (e) {} }, 50)
setInterval(() => { try { reflexTick() } catch (e) { log('reflex error', e.message) } }, 100)
setInterval(() => { idleTick().catch(e => log('idle error', e.message)) }, 1000)
process.on('SIGINT', () => { quitting = true; try { bot.quit() } catch (e) {} process.exit(0) })
process.on('SIGTERM', () => { quitting = true; try { bot.quit() } catch (e) {} process.exit(0) })
process.on('uncaughtException', e => log('uncaught', e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e))
process.on('unhandledRejection', e => log('unhandled', e && e.message ? e.message : e))
