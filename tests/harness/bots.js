// Helpers for mineflayer bots (26.1 through ViaProxy, see harness/server.js).
const mineflayer = require('mineflayer')
// mineflayer 4.39 divides entity velocities by 8000 (pre-1.21.9 units) although minecraft-protocol already decodes the
// 26.x lpVec3 to blocks per tick: knockback and launches never move a bot. All bots here are 26.1, so undo it.
// (see TOOLCHAIN-FINDINGS.md M3)
{
  const conv = require('mineflayer/lib/conversions')
  const { Vec3: V } = require('vec3')
  conv.fromNotchVelocity = vel => new V(vel.x, vel.y, vel.z)
}
const { Vec3 } = require('vec3')

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** Polls fn() until it returns truthy; resolves with that value or rejects after timeout. */
function waitFor (fn, { timeout = 30000, step = 100, what = 'condition' } = {}) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const tick = () => {
      let v
      try { v = fn() } catch (e) { v = undefined }
      if (v) return resolve(v)
      if (Date.now() - t0 > timeout) return reject(new Error(`timed out after ${timeout} ms waiting for ${what}`))
      setTimeout(tick, step)
    }
    tick()
  })
}

/** Connects a bot (26.1 by default, through ViaProxy) and resolves after its first spawn. Retries a refused first connect. */
async function connectBot (server, username, opts = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await connectOnce(server, username, opts)
    } catch (e) {
      if (attempt >= 3 || !/socketClosed|ECONNRESET|EPIPE/.test(String(e.message))) throw e
      await sleep(1500)
    }
  }
}

function connectOnce (server, username, { version = '26.1', log } = {}) {
  return new Promise((resolve, reject) => {
    const bot = mineflayer.createBot({ host: '127.0.0.1', port: server.port, username, version, auth: 'offline', hideErrors: true })
    // mineflayer 4.39 sends the pre-1.21.6 numeric sprint actions (3/4) for 26.1, which mean horse jump there;
    // the string mapper is right for 1.21.6+ (see PUMPKIN-FINDINGS.md, toolchain)
    const fixFeatures = () => {
      const supportFeature = bot.supportFeature
      if (!supportFeature || supportFeature.lanFixed) return
      bot.supportFeature = feature => feature === 'entityActionUsesStringMapper' || supportFeature(feature)
      bot.supportFeature.lanFixed = true
    }
    fixFeatures()
    // raw sidebar capture from the first packet on (the objective and its display slot arrive with the join)
    {
      const st = { scores: {}, sidebarObjective: null }
      bot._client.on('scoreboard_display_objective', p => { if (p.position === 1) st.sidebarObjective = p.name })
      bot._client.on('scoreboard_score', p => {
        const o = (st.scores[p.scoreName] = st.scores[p.scoreName] || {})
        if (p.action === 1) delete o[p.itemName]; else o[p.itemName] = p.value
      })
      bot._client.on('reset_score', p => { for (const [name, o] of Object.entries(st.scores)) if (!p.objective_name || p.objective_name === name) delete o[p.entity_name] })
      bot.scoreRaw = st
    }
    bot.once('inject_allowed', fixFeatures)
    bot.once('login', fixFeatures)
    bot.chatLog = []
    bot.titleLog = []
    bot.on('messagestr', m => {
      bot.chatLog.push({ t: Date.now(), m })
      if (log) log(`[${username} chat] ${m}`)
    })
    bot.on('title', (t, type) => bot.titleLog.push({ t: Date.now(), text: String(t), type }))
    bot.on('kicked', r => { bot.kickReason = r; if (log) log(`[${username} kicked] ${JSON.stringify(r)}`) })
    bot.on('error', e => { if (log) log(`[${username} error] ${e.message}`) })
    const timer = setTimeout(() => reject(new Error(`${username} did not spawn`)), 60000)
    bot.once('spawn', () => { clearTimeout(timer); resolve(bot) })
    bot.once('end', reason => {
      clearTimeout(timer)
      bot.ended = reason
      reject(new Error(`${username} disconnected before spawning: ${JSON.stringify(bot.kickReason || reason)}`))
    })
  })
}

// Team spawns of the active map, read from the arena file (config/arena-rush.yml by default).
const { loadMap } = require('../play/map')
const MAP = loadMap()
const spawnDist = (bot, tm) => bot.entity.position.distanceTo(new Vec3(tm.spawn.x, tm.spawn.y, tm.spawn.z))

/** Resolves (with the team name) when the bot has been teleported to a team spawn, i.e. the game started. */
async function waitForGameStart (bot, timeout = 90000) {
  await waitFor(() => Object.values(MAP.teams).some(tm => spawnDist(bot, tm) < 4),
    { timeout, what: `${bot.username} to be teleported to a team spawn` })
  await sleep(500)
  return teamOf(bot)
}

/** Name of the team whose spawn is closest to the bot (e.g. 'Red' or 'Blue'). */
function teamOf (bot) {
  return Object.values(MAP.teams).sort((x, y) => spawnDist(bot, x) - spawnDist(bot, y))[0].name
}

/** -1 for the first team in the arena file, +1 for the second (kept for older specs). */
function sideOf (bot) {
  return teamOf(bot) === MAP.teamNames[0] ? -1 : 1
}

function countItem (bot, name) {
  return bot.inventory.items().filter(i => i.name === name).reduce((s, i) => s + i.count, 0)
}

function invSummary (bot) {
  return bot.inventory.items().map(i => `${i.name}x${i.count}@${i.slot}`).join(', ')
}

/** Strips colour codes from window/item names. */
function plain (s) {
  if (s == null) return ''
  if (typeof s === 'object') s = JSON.stringify(s)
  return String(s).replace(/§./g, '')
}

/** A text component (26.x NBT, JSON or legacy string) as a legacy § string. */
function legacyText (registry, v) {
  if (v == null) return ''
  if (typeof v === 'string') {
    try { v = JSON.parse(v) } catch (e) { return v }
  }
  if (v && v.type && v.value !== undefined) v = require('prismarine-nbt').simplify(v)
  if (typeof v === 'string') return v
  const ChatMessage = require('prismarine-chat')(registry)
  return new ChatMessage(v).toMotd()
}

/** Custom name of an item as § text (null without one). */
function itemCustomName (bot, item) {
  if (!item || item.customName == null) return null
  return legacyText(bot.registry, item.customName)
}

/** Lore lines of an item as § text. */
function itemLore (bot, item) {
  const lore = item && item.customLore
  return Array.isArray(lore) ? lore.map(l => legacyText(bot.registry, l)) : []
}

let defaultRegistry = null
/** Display name of an item (custom name if present), without colour codes. */
function itemName (item, bot) {
  if (!item) return null
  if (item.customName != null) {
    const registry = bot ? bot.registry : (defaultRegistry = defaultRegistry || require('prismarine-registry')('26.1'))
    return plain(legacyText(registry, item.customName))
  }
  return plain(item.customName || item.displayName || item.name).replace(/^"|"$/g, '')
}

function blockName (bot, x, y, z) {
  const b = bot.blockAt(new Vec3(x, y, z))
  return b ? b.name : null
}

/** Right-clicks an entity like a 26.x client (one interact packet with hand and hit position). */
function useEntity (bot, entity) {
  bot.activateEntity(entity)
}

module.exports = { legacyText, itemCustomName, itemLore, useEntity, MAP, sleep, waitFor, connectBot, waitForGameStart, teamOf, sideOf, countItem, invSummary, plain, itemName, blockName, Vec3 }
