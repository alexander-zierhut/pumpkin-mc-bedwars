// Client compatibility and robustness.
//   1. which client versions mineflayer can connect with, and that they can play next to 1.8.9 (ViaBackwards)
//   2. 1.8.9 client: every shop material + every shop item can be given/bought and held without a kick or server exception
//   3. sidebar / boss bar / German chat on a 1.8 client
//   4. join/leave churn in the lobby and in a running game
//   5. hotbar quick-buy (and plain click) with a full inventory never loses items
//
// Two servers are used: a "lobby" server with a 10 minute countdown (so lobby tests never start a game) and the
// runner's own server (10 s countdown) for everything that needs a running game.
const fs = require('fs')
const path = require('path')
const mineflayer = require('mineflayer')
const { parseYaml, DEFAULT_ARENA } = require('../play/map')
const { TestServer, ROOT } = require('../harness/server')
const { MAP, Vec3, connectBot, waitFor, waitForGameStart, teamOf, itemName, plain, sleep, countItem } = require('../harness/bots')

// ---------------------------------------------------------------- helpers
// Everything is read from the active arena file at runtime (tests/play/map.js via harness/bots.js): no coordinates in here.
const LOBBY = MAP.lobbySpawn
const nearLobby = p => Math.abs(p.x - LOBBY.x) < 30 && Math.abs(p.z - LOBBY.z) < 30 && Math.abs(p.y - LOBBY.y) < 12
// game area of the arena (pos1/pos2 of the arena file) incl. a margin for the spectator spawn / team spawns on top of it
const GA = { x0: MAP.bounds.min[0] - 15, x1: MAP.bounds.max[0] + 15, z0: MAP.bounds.min[2] - 15, z1: MAP.bounds.max[2] + 15,
  y0: Math.min(MAP.bounds.min[1], MAP.voidY) - 5, y1: Math.max(MAP.bounds.max[1], MAP.specSpawn.y) + 15 }
const inGameArea = p => p.x >= GA.x0 && p.x <= GA.x1 && p.z >= GA.z0 && p.z <= GA.z1 && p.y >= GA.y0 && p.y <= GA.y1 && !nearLobby(p)
const inArena = p => nearLobby(p) || inGameArea(p)
const ARENA_FILE = parseYaml(fs.readFileSync(DEFAULT_ARENA, 'utf8'))
const MAX_PLAYERS = Object.values(ARENA_FILE.teams).reduce((n, tm) => n + Number(tm.maxPlayers || 4), 0)
const MID = MAP.named('middle', MAP.teamNames[0])

const rm = (s) => s.replace(/§./g, '')
const rand = (() => { let s = 1234567; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff } })()

function track (bot) {
  bot.kicked = null
  bot.disconnected = false
  bot.on('kicked', r => { bot.kicked = r })
  bot.on('end', r => { bot.disconnected = true; bot.endReason = r })
  bot.on('error', e => { bot.lastError = e.message })
  return bot
}

/** Connects a bot to any TestServer and registers it in `pool` for cleanup. */
async function mk (pool, server, name, opts = {}) {
  const b = track(await connectBot(server, name, { log: null, ...opts }))
  b.ver = opts.version || '1.8.9'
  pool.push(b)
  return b
}

/** Like mk, but returns {bot} or {error} instead of throwing, with timing. */
async function tryMk (pool, server, name, version) {
  const t0 = Date.now()
  try {
    const bot = await mk(pool, server, name, { version })
    return { bot, ms: Date.now() - t0 }
  } catch (e) {
    return { error: e.message, ms: Date.now() - t0 }
  }
}

function quit (bot) { return new Promise(resolve => { if (bot.disconnected) return resolve(); bot.once('end', () => resolve()); try { bot.quit() } catch (e) { resolve() } setTimeout(resolve, 3000) }) }

function sidebar (bot) {
  const sb = bot.scoreboard && bot.scoreboard.sidebar
  if (!sb) return null
  const items = Object.values(sb.itemsMap || {}).map(i => ({ text: rm(i.displayName ? i.displayName.toString() : i.name), v: i.value }))
  return { title: rm(sb.title && sb.title.toString ? sb.title.toString() : String(sb.title)), items }
}

/** Opens the shop villager next to the bot's island. Works for 1.8.9 (raw packets) and newer clients. */
async function openShop (t, bot) {
  const spot = MAP.named('shop', teamOf(bot))
  await t.server.cmd(`tp ${bot.username} ${spot.x} ${spot.y} ${spot.z}`)
  await sleep(900)
  const vill = Object.values(bot.entities).filter(e => /villager/i.test(e.name || ''))
    .sort((x, y) => x.position.distanceTo(bot.entity.position) - y.position.distanceTo(bot.entity.position))[0]
  if (!vill) throw new Error(`${bot.username}: no villager visible`)
  for (let attempt = 0; attempt < 3 && !bot.currentWindow; attempt++) {
    await bot.lookAt(vill.position.offset(0, 1, 0), true)
    await sleep(250)
    if (bot.ver === '1.8.9') {
      require('../harness/bots').useEntity(bot, vill)
      bot.swingArm()
    } else {
      await bot.activateEntityAt(vill, vill.position.offset(0, 1, 0)).catch(() => {})
      await bot.activateEntity(vill).catch(() => {})
    }
    await waitFor(() => bot.currentWindow, { timeout: 3000 }).catch(() => null)
  }
  if (!bot.currentWindow) throw new Error(`${bot.username}: shop did not open`)
  await sleep(500)
  return bot.currentWindow
}

/** Name of an item as the client displays it (works for 1.8 strings and 1.20.5+ component NBT). */
function shownName (item) {
  if (!item) return null
  const n = item.customName
  if (n == null) return plain(item.displayName || item.name)
  if (typeof n === 'string') return plain(n.replace(/^"|"$/g, ''))
  return plain(JSON.stringify(n))
}
function shownLore (item) {
  if (!item || !item.customLore) return []
  return item.customLore.map(l => typeof l === 'string' ? plain(l) : plain(JSON.stringify(l)))
}

/** Slots 9..53 of the shop window that are real items (not the grey filler glass). */
function shopItems (win) {
  const out = []
  for (let i = 0; i < 54; i++) {
    const s = win.slots[i]
    if (s && !/glass_pane/.test(s.name)) out.push({ slot: i, item: s })
  }
  return out
}

async function goBack (bot) {
  const w = bot.currentWindow
  const back = shopItems(w).find(x => x.slot === 0 && x.item.name === 'barrier')
  if (back) { await bot.clickWindow(0, 0, 0); await sleep(500) }
}

/** Parses the item materials out of config/shop.yml (no yaml dependency). */
function shopMaterials () {
  const text = fs.readFileSync(path.join(ROOT, 'config', 'shop.yml'), 'utf8')
  const set = new Set()
  for (const m of text.matchAll(/^\s*type:\s*([a-z_]+)\s*$/gm)) set.add(m[1])
  for (const m of text.matchAll(/stack:\s*"([a-z_]+);/g)) set.add(m[1])
  return [...set]
}

/**
 * Shop layout from config/shop.yml: categories (top row of the main page, slots 9..) with their item counts, plus the
 * Schnellkauf items (top-level price entries) that are shown below the category row of the main page.
 */
function shopModel () {
  const cats = []
  let quick = 0
  for (const l of fs.readFileSync(path.join(ROOT, 'config', 'shop.yml'), 'utf8').split('\n')) {
    if (/^- stack:/.test(l)) cats.push(0)
    else if (/^- price:/.test(l)) quick++
    else if (/^\s{2,}- price:/.test(l) && cats.length) cats[cats.length - 1]++
  }
  return { cats, quick, categoryEntries: cats.reduce((a, b) => a + b, 0), total: cats.reduce((a, b) => a + b, 0) + quick }
}
/** Category icons of the shop main page: the first K item slots from slot 9 on (K = number of categories in shop.yml). */
function categorySlots (win, model) {
  return shopItems(win).filter(i => i.slot >= 9).slice(0, model.cats.length)
}

const rconNum = async (t, cmd) => {
  const out = await t.server.cmd(cmd)
  const m = out.match(/(\d+)/)
  return m ? Number(m[1]) : 0
}
/** Server side count of a vanilla item in a player's inventory (clear with count 0 only counts). */
async function invCount (srv, player, id) {
  const out = await srv.cmd(`clear ${player} minecraft:${id} 0`)
  const m = out.match(/Found (\d+)/)
  return m ? Number(m[1]) : 0
}
/** Server side dropped item entities of one vanilla id near a player: total item count. */
async function droppedCount (srv, player, id, radius = 12) {
  const out = await srv.cmd(`execute at ${player} as @e[type=item,distance=..${radius},nbt={Item:{id:"minecraft:${id}"}}] run data get entity @s Item.count`)
  let n = 0
  for (const m of out.matchAll(/entity data:\s*(\d+)/g)) n += Number(m[1])
  return n
}

const CURRENCY = {
  bronze: { label: 'Bronze', item: 'brick', color: 'dark_red' },
  iron: { label: 'Silber', item: 'iron_ingot', color: 'gray' },
  gold: { label: 'Gold', item: 'gold_ingot', color: 'gold' }
}
/** Gives the real BedWars resource item (SBW only accepts its own named stacks as payment). */
function giveRes (srv, player, key, n) {
  const c = CURRENCY[key]
  return srv.cmd(`give ${player} minecraft:${c.item}[custom_name={extra:[{text:"${c.label}",color:"${c.color}",italic:0b,underlined:0b,bold:0b,strikethrough:0b,obfuscated:0b}],text:""}] ${n}`)
}

/**
 * Inventory as the client sees it. While a container is open, mineflayer keeps the player inventory part in the
 * container window, so bot.inventory is stale; read the window then. invSlot uses mineflayer numbering (9..35 main, 36..44 hotbar).
 */
function invItems (bot) {
  const w = bot.currentWindow
  if (w && w.slots.length >= 63) {
    const base = w.slots.length - 36
    const out = []
    for (let i = 0; i < 36; i++) { const s = w.slots[base + i]; if (s) out.push({ name: s.name, count: s.count, metadata: s.metadata, invSlot: 9 + i, item: s }) }
    return out
  }
  return bot.inventory.items().map(s => ({ name: s.name, count: s.count, metadata: s.metadata, invSlot: s.slot, item: s }))
}
const hotbarOf = bot => { const m = {}; for (const i of invItems(bot)) if (i.invSlot >= 36 && i.invSlot <= 44) m[i.invSlot - 36] = i; return m }

/** Clicks without waiting for mineflayer's transaction confirmation (1.12/1.16 never get one from this shop). */
function click (bot, slot, button = 0, mode = 0) { bot.clickWindow(slot, button, mode).catch(() => {}); return sleep(250) }

async function gameModeOf (srv, player) {
  const out = await srv.cmd(`data get entity ${player} playerGameType`)
  const m = out.match(/entity data:\s*(\d)/)
  return m ? Number(m[1]) : null
}
async function tpsOf (srv) {
  const out = await srv.cmd('tps')
  const m = rm(out).match(/([\d.]+)\*?,\s*([\d.]+)/)
  return { tps: m ? Number(m[1]) : null, raw: out }
}

// ---- TEMPORARY EXPERIMENT (COMPAT_FIX=1): proves the proposed config fix on the throwaway copy only
const fixConfigs = dir => {
  if (!process.env.COMPAT_FIX) return
  const f = path.join(dir, 'plugins', 'BedWars', 'config.yml')
  let cfg = fs.readFileSync(f, 'utf8')
  cfg = cfg.replace("'&7Price:'", "'&7Preis:'").replace("'&7Amount:'", "'&7Menge:'")
    .replace("'&fMap: &2%arena%'", "'&fKarte: &2%arena%'").replace("'&fPlayers: &2%players%&f/&2%maxplayers%'", "'&fSpieler: &2%players%&f/&2%maxplayers%'")
    .replace("'&fWaiting ...'", "'&fWarte auf Spieler ...'")
  fs.writeFileSync(f, cfg)
}

module.exports = {
  name: '80-compat',
  timeout: 420000,
  server: { pauseCountdown: 10, memory: '1G', prepare: fixConfigs },
  async run (t) {
    const pool = []
    // OldCombatMechanics bundles packetevents, whose update check hits api.github.com at startup: when GitHub rate-limits
    // (403) or is unreachable it logs a stack trace that the runner's errors() counts as a server exception. Not our bug.
    const ignoreUpdateCheck = srv => { const orig = srv.errors.bind(srv); srv.errors = () => orig().filter(l => !/packetevents/.test(l)) }
    ignoreUpdateCheck(t.server)
    const closeAll = async () => { await Promise.all(pool.splice(0).map(quit)) }

    // ================================================================= LOBBY SERVER
    const lobby = new TestServer('compat-lobby', { pauseCountdown: 600, memory: '1G', prepare: fixConfigs })
    const skipLobby = !!process.env.COMPAT_SKIP_LOBBY // debugging aid only
    ignoreUpdateCheck(lobby)
    if (!skipLobby) await lobby.start()
    if (!skipLobby) t.log('lobby server up', lobby.port)
    try {
      if (!skipLobby) await lobbyPhase(t, lobby, pool)
    } catch (e) {
      t.check('lobby phase completed without crash', false, e.stack)
    }
    await closeAll()
    const lobbyErrors = skipLobby ? [] : lobby.errors()
    t.check('lobby server: no exceptions in log', lobbyErrors.length === 0, lobbyErrors.slice(0, 10))
    const lobbyVia = skipLobby ? [] : viaWarnings(lobby.logs())
    t.check('lobby server: no ViaVersion/ViaBackwards/ViaRewind warnings', lobbyVia.length === 0, lobbyVia.slice(0, 10))
    if (!skipLobby) fs.writeFileSync(path.join(__dirname, '..', 'reports', '80-compat.lobby.server.log'), lobby.logs())
    if (!skipLobby) await lobby.stop()

    // ================================================================= GAME SERVER
    await gamePhase(t, pool)
    await closeAll()
    const via = viaWarnings(t.server.logs())
    t.check('game server: no ViaVersion/ViaBackwards/ViaRewind warnings', via.length === 0, via.slice(0, 10))
  }
}

function viaWarnings (log) {
  // "Increased world height is NOT SUPPORTED" is ViaBackwards' one-off notice when any <=1.16 client joins (expected)
  return log.split('\n').filter(l => !/Increased world height is NOT SUPPORTED/.test(l)).filter(l => /\[(ViaVersion|ViaBackwards|ViaRewind)\]/.test(l) && /(WARN|ERROR|SEVERE)/.test(l) ||
    /(Unable to (map|translate|handle)|Could not (find|map|translate)|ProtocolException|DecoderException|EncoderException|Failed to (decode|encode)|Disconnecting .* due to)/i.test(l))
}

// ---------------------------------------------------------------- lobby phase
/** Raw 1.7.10 login (mineflayer cannot drive 1.7, so use minecraft-protocol directly). */
function raw17 (server) {
  const mc = require('minecraft-protocol')
  return new Promise(resolve => {
    const out = { login: false, position: false, chat: [], error: null, kicked: null }
    let client
    try { client = mc.createClient({ host: '127.0.0.1', port: server.port, username: 'Raw17', version: '1.7.10', auth: 'offline', hideErrors: true }) } catch (e) { out.error = e.message; return resolve(out) }
    client.on('login', () => { out.login = true })
    client.on('position', () => { out.position = true })
    client.on('chat', p => { try { out.chat.push(rm(JSON.parse(p.message).text || JSON.stringify(JSON.parse(p.message)))) } catch (e) { out.chat.push(String(p.message)) } })
    client.on('kick_disconnect', p => { out.kicked = p.reason })
    client.on('error', e => { out.error = e.message })
    setTimeout(() => { try { client.end() } catch (e) {} resolve(out) }, 5000)
  })
}

async function lobbyPhase (t, lobby, pool) {
  const anchor = await mk(pool, lobby, 'CmpAnchor')
  await waitFor(() => nearLobby(anchor.entity.position), { timeout: 20000, what: 'anchor in lobby' })

  // ---- (3) first look at the lobby on a 1.8.9 client: sidebar, boss bar, German texts
  await sleep(1500)
  const sb = sidebar(anchor)
  t.log('lobby sidebar', sb)
  const wither = Object.values(anchor.entities).filter(e => /wither/i.test(e.name || ''))
  t.log('lobby wither entities (1.8 boss bar emulation)', wither.map(e => `${e.name} ${e.position} meta=${JSON.stringify(e.metadata && e.metadata.slice(0, 3))}`))
  t.check('1.8.9 client in the lobby has a sidebar with title and lines (no protocol errors)', !!(sb && sb.title && sb.items.length >= 3), sb)
  t.check('1.8.9 client in the lobby gets a boss bar (ViaRewind wither emulation) with a German text', wither.length === 1 && /Spiel/.test(JSON.stringify(wither[0].metadata)), wither.map(w => w.metadata))
  const sbText = sb ? sb.items.map(i => i.text.trim()).filter(Boolean).concat([sb.title]).join(' | ') : ''
  t.check('lobby sidebar texts are German (locale de), not English "Map / Players / Waiting"', sb && !/(Players|Waiting|Map:)/.test(sbText), sbText)
  anchor.chatLog.length = 0
  for (const cmd of ['/bw list', '/bw stats', '/bw help']) { anchor.chat(cmd); await sleep(700) }
  const cmdChat = anchor.chatLog.map(c => c.m)
  t.log('command output', cmdChat.slice(0, 14))
  t.check('/bw list, /bw stats, /bw help answer in German (Verfügbare Arenen, Statistiken, Hilfe)',
    cmdChat.some(m => /Verfügbare Arenen/.test(m)) && cmdChat.some(m => /Statistiken/.test(m)) && cmdChat.some(m => /Hilfe/.test(m)) &&
    !cmdChat.some(m => /(Available arenas|Statistics of|Help)/.test(m)), cmdChat.slice(0, 8))

  // ---- (1) version matrix
  const versions = mineflayer.testedVersions.slice()
  const results = {}
  for (let i = 0; i < versions.length; i += 6) {
    const batch = versions.slice(i, i + 6)
    await Promise.all(batch.map(async v => {
      const name = 'V' + v.replace(/\./g, '')
      const r = await tryMk(pool, lobby, name, v)
      if (!r.bot) { results[v] = { ok: false, error: r.error, ms: r.ms }; return }
      const b = r.bot
      const inLobby = await waitFor(() => nearLobby(b.entity.position), { timeout: 10000 }).then(() => true).catch(() => false)
      const joinMsg = await waitFor(() => anchor.chatLog.some(c => /tritt dem Spiel bei/.test(c.m) && c.m.includes(name + ' ')), { timeout: 8000 }).then(() => true).catch(() => false)
      b.chat(`hallo von ${name}`)
      await sleep(1500)
      results[v] = { ok: true, ms: r.ms, inLobby, joinMsg, kicked: b.kicked, pos: b.entity.position.toString() }
    }))
    for (const v of batch) {
      const name = 'V' + v.replace(/\./g, '')
      const b = pool.find(x => x.username === name)
      if (b && results[v].ok) {
        results[v].stillConnected = !b.disconnected
        results[v].seesAnchor = !!(b.players.CmpAnchor && b.players.CmpAnchor.entity)
        results[v].anchorSeesIt = !!(anchor.players[name] && anchor.players[name].entity)
        results[v].chatReachedAnchor = anchor.chatLog.some(c => c.m.includes(`hallo von ${name}`))
        results[v].sawOwnJoinMsg = b.chatLog.some(c => /tritt dem Spiel bei/.test(c.m))
      }
    }
    await Promise.all(pool.filter(b => /^V\d/.test(b.username)).map(quit))
    pool.splice(0, pool.length, ...pool.filter(b => !/^V\d/.test(b.username)))
    await sleep(500)
  }
  t.log('version matrix', results)
  const bad = Object.entries(results).filter(([v, r]) => !r.ok || !r.inLobby || !r.joinMsg || !r.stillConnected || r.kicked)
  t.check(`every client version mineflayer supports (${versions.length}: ${versions[0]} .. ${versions[versions.length - 1]}) joins, is auto-joined into the arena and stays connected`,
    bad.length === 0 && Object.keys(results).length === versions.length, bad.length ? Object.fromEntries(bad) : { versions: versions.join(' '), failed: 0 })
  const noSee = Object.entries(results).filter(([v, r]) => r.ok && !(r.seesAnchor && r.anchorSeesIt))
  t.check('1.8.9 client and every newer client see each other (player entities)', noSee.length === 0, noSee.map(([v, r]) => [v, r.seesAnchor, r.anchorSeesIt]))
  const noChat = Object.entries(results).filter(([v, r]) => r.ok && !r.chatReachedAnchor)
  t.check('chat from every client version reaches the 1.8.9 client', noChat.length === 0, noChat.map(([v]) => v))
  const slow = Object.entries(results).filter(([v, r]) => r.ok && r.ms > 20000)
  t.check('no client version needs more than 20 s to join', slow.length === 0, Object.fromEntries(Object.entries(results).map(([v, r]) => [v, r.ms])))
  const r17 = await raw17(lobby)
  t.log('raw 1.7.10 login (mineflayer has no 1.7 support)', r17)
  t.check('1.7.10 protocol client (raw packets) can log in via ViaRewind and is not kicked', r17.login && !r17.kicked && !r17.error, r17)

  // ---- (3b) chat of the BedWars plugin is German and readable
  const chatBW = anchor.chatLog.map(c => c.m)
  const bwLines = chatBW.filter(m => /^\[BW\]/.test(m))
  const englishBw = bwLines.filter(m => /\b(has joined|You (are|have)|started|Players|Please|left the game|Team (selected|chosen))\b/.test(m))
  const rawPlaceholders = chatBW.concat(cmdChat).filter(m => /%[a-z_]+%|\{[a-z_0-9]+\}|&[0-9a-fk-or]|§|^null$|undefined|\bcom\.|\borg\.screamingsandals\b/i.test(m))
  t.log('anchor chat sample', chatBW.slice(0, 10))
  t.check('BedWars join messages seen by the 1.8.9 client are German "[BW] X tritt dem Spiel bei! [n/8]"', bwLines.length >= 20 && englishBw.length === 0, { n: bwLines.length, sample: bwLines.slice(0, 3), english: englishBw })
  t.check('no raw placeholders / colour codes / class names in lobby chat lines', rawPlaceholders.length === 0, rawPlaceholders)

  // ---- (4a) lobby churn: 8 bots join, leave and rejoin rapidly
  await quit(anchor)
  pool.splice(pool.indexOf(anchor), 1)
  await sleep(500)
  const names = Array.from({ length: MAX_PLAYERS }, (_, i) => `Ch${i + 1}`)
  const churn = await Promise.all(names.map(n => mk(pool, lobby, n).catch(e => ({ err: e.message, username: n }))))
  const connectFails = churn.filter(b => b.err)
  const allIn = async (bots, timeout = 20000) => waitFor(() => bots.every(b => !b.disconnected && nearLobby(b.entity.position)), { timeout }).then(() => true).catch(() => false)
  t.check('8 bots connect at once and are all auto-joined into the lobby', connectFails.length === 0 && await allIn(churn), connectFails.map(b => b.err))
  t.log('after initial join', await lobby.cmd('list'))
  const rounds = []
  for (let round = 0; round < 3; round++) {
    const t0 = Date.now()
    // random half leaves and comes straight back; the other half leaves a moment later and returns
    const order = names.map((n, i) => [rand(), i]).sort((x, y) => x[0] - y[0]).map(x => x[1])
    const first = order.slice(0, 4)
    const second = order.slice(4)
    await Promise.all(first.map(i => quit(churn[i])))
    const back1 = await Promise.all(first.map(i => mk(pool, lobby, names[i]).catch(e => ({ err: e.message, username: names[i] }))))
    first.forEach((i, k) => { churn[i] = back1[k] })
    await sleep(200)
    await Promise.all(second.map(i => quit(churn[i])))
    const back2 = await Promise.all(second.map(i => mk(pool, lobby, names[i]).catch(e => ({ err: e.message, username: names[i] }))))
    second.forEach((i, k) => { churn[i] = back2[k] })
    const errs = churn.filter(b => b.err)
    const ok = errs.length === 0 && await allIn(churn.filter(b => !b.err), 20000)
    rounds.push({ round, ok, ms: Date.now() - t0, errs: errs.map(b => b.err) })
  }
  t.log('lobby churn rounds', rounds)
  t.check('lobby churn: after 3 rounds of rapid leave/rejoin all 8 bots are back in the arena lobby', rounds.every(r => r.ok), rounds)
  const list1 = await lobby.cmd('list')
  t.check(`lobby churn: server player list shows exactly the ${MAX_PLAYERS} bots (no ghost sessions)`, new RegExp(`There are ${MAX_PLAYERS} of a max`).test(list1), list1)
  const tps = await tpsOf(lobby)
  t.check('lobby churn: server TPS healthy (>= 15)', tps.tps !== null && tps.tps >= 15, tps)
  const stuck = churn.filter(b => !b.err && !b.disconnected && !inArena(b.entity.position)).map(b => `${b.username} ${b.entity.position}`)
  t.check('lobby churn: no player stuck outside the arena', stuck.length === 0, stuck)
  const fullRe = new RegExp(`${MAX_PLAYERS}/${MAX_PLAYERS}`)
  const eightOf = b => { const x = sidebar(b); return !!(x && x.items.some(i => fullRe.test(i.text))) }
  await waitFor(() => churn.every(eightOf), { timeout: 8000 }).catch(() => null)
  t.check(`lobby churn: every rejoined client has the lobby sidebar showing ${MAX_PLAYERS}/${MAX_PLAYERS} players`, churn.every(eightOf), churn.map(b => [b.username, sidebar(b)]).filter(([n, x]) => !(x && x.items.some(i => fullRe.test(i.text)))))

  // arena is full now: what happens to a 9th player
  const ninth = await mk(pool, lobby, 'Ch9').catch(e => ({ err: e.message }))
  if (!ninth.err) {
    await sleep(4000)
    const p = ninth.entity.position
    t.log('9th player (arena full) position after 4 s', p.toString(), 'gamemode', ninth.game && ninth.game.gameMode)
    t.check('9th player on a full arena is not left in the void and stays connected', p.y > MAP.voidY + 2 && !ninth.disconnected, { pos: p.toString(), list: await lobby.cmd('list') })
  } else t.check('9th player on a full arena can connect', false, ninth.err)
}

// ---------------------------------------------------------------- game phase
/** Raw scoreboard capture (mineflayer's own scoreboard model drops scores on 1.21.x, so count packets). */
function watchScores (bot) {
  const st = { title: null, scores: {}, sidebarObjective: null }
  bot._client.on('scoreboard_objective', p => { if (p.action === 0 || p.action === 2) st.title = JSON.stringify(p.displayText) })
  bot._client.on('scoreboard_display_objective', p => { if (p.position === 1) st.sidebarObjective = p.name })
  bot._client.on('scoreboard_score', p => {
    const o = (st.scores[p.scoreName] = st.scores[p.scoreName] || {})
    if (p.action === 1) delete o[p.itemName]; else o[p.itemName] = p.value
  })
  bot._client.on('reset_score', p => { for (const o of Object.values(st.scores)) delete o[p.entity_name] })
  bot.scoreRaw = st
}
function rawSidebarItems (bot) {
  const st = bot.scoreRaw
  const o = st && st.scores[st.sidebarObjective]
  return o ? Object.keys(o).map(k => rm(k).trim()).filter(Boolean).sort() : []
}

async function gamePhase (t, pool) {
  const srv = t.server
  const cmd = c => srv.cmd(c)
  // ---- start a game with mixed client versions
  const a = await mk(pool, srv, 'CmpA')
  const b = await mk(pool, srv, 'CmpB')
  const v12 = await mk(pool, srv, 'Cmp1122', { version: '1.12.2' })
  const v16 = await mk(pool, srv, 'Cmp1165', { version: '1.16.5' })
  const v21 = await mk(pool, srv, 'Cmp1214', { version: '1.21.4' })
  const all = [a, b, v12, v16, v21]
  for (const x of all) watchScores(x)
  const teams = await Promise.all(all.map(x => waitForGameStart(x, 90000).catch(e => e.message)))
  t.log('teams', Object.fromEntries(all.map((x, i) => [x.username, teams[i]])))
  t.check('mixed 1.8.9 / 1.12.2 / 1.16.5 / 1.21.4 players are all put on islands when the game starts',
    teams.every(x => MAP.teamNames.includes(x)), teams)
  t.check('both teams are used with 5 mixed-version players', new Set(teams).size === 2, teams)
  await sleep(2500)
  await Promise.all(all.map(x => cmd(`gamemode survival ${x.username}`)))

  // ---- sidebar / boss bar / chat on 1.8.9 in the running game
  const sb1 = sidebar(a)
  await sleep(3200)
  const sb2 = sidebar(a)
  t.log('game sidebar', sb1, sb2)
  t.check('1.8.9 sidebar shows the arena title with a countdown that keeps ticking', !!(sb1 && sb2 && new RegExp(MAP.name).test(sb1.title) && sb1.title !== sb2.title), { sb1: sb1 && sb1.title, sb2: sb2 && sb2.title })
  const oldItems = (sb2 ? sb2.items.map(i => i.text.trim()).filter(Boolean).sort() : [])
  const perVersion = Object.fromEntries([v12, v16, v21].map(x => [x.ver, rawSidebarItems(x)]))
  t.check('1.8.9 sidebar lists both teams with bed state, and 1.12.2 / 1.16.5 / 1.21.4 clients receive the same lines',
    oldItems.length >= 2 && Object.values(perVersion).every(v => JSON.stringify(v) === JSON.stringify(oldItems)), { old: oldItems, perVersion })
  const wither = Object.values(a.entities).filter(e => /wither/i.test(e.name || ''))
  const witherInfo = wither.map(w => ({ pos: w.position.toString(), dist: Math.round(w.position.distanceTo(a.entity.position)), text: JSON.stringify(w.metadata && w.metadata.slice(0, 3)) }))
  t.log('game boss bar entities for 1.8.9 (ViaRewind wither emulation)', witherInfo)
  t.check('1.8.9 boss bar in the running game says the game text (Spiel läuft), not the stale lobby text',
    wither.length === 1 && /läuft/.test(witherInfo[0].text) && !/Kürze/.test(witherInfo[0].text), witherInfo)
  t.check('1.8.9 boss bar entity is within render range (<= 64 blocks) of the player on his island', wither.length === 1 && witherInfo[0].dist <= 64, witherInfo)
  const chat89 = a.chatLog.map(c => c.m)
  t.log('1.8.9 chat during game start', chat89)
  const bwChat = chat89.filter(m => /^\[BW\]/.test(m))
  const nonGerman = bwChat.filter(m => /\b(Team selected|You have joined|has joined|The game|starts in|seconds)\b/.test(m))
  t.check('game start chat from BedWars is German ("Ausgewähltes Team")', bwChat.some(m => /Ausgewähltes Team/.test(m)) && nonGerman.length === 0, { bw: bwChat, nonGerman })
  const dirty = chat89.filter(m => /%[a-z_]+%|&[0-9a-fk-or]|§|undefined|^null$/i.test(m))
  t.check('no raw placeholders / colour codes in 1.8.9 game chat', dirty.length === 0, dirty)

  // ---- cross-version play: PvP both ways, chat
  const old = all.filter(x => x.ver === '1.8.9')
  const neu = all.filter(x => x.ver !== '1.8.9')
  const pairs = []
  for (const o of old) for (const n of neu) if (teamOf(o) !== teamOf(n)) pairs.push([o, n])
  if (!pairs.length) t.check('found an opposing 1.8.9 / modern pair for the PvP check', false, teams)
  else {
    // prefer the 1.21.4 client for the PvP pair
    const [o, n] = pairs.find(p => p[1].ver === '1.21.4') || pairs[0]
    const hit = async (att, vic) => {
      await cmd(`effect give ${vic.username} minecraft:instant_health 1 5`)
      await cmd(`tp ${vic.username} ${MID.x} ${MID.y} ${MID.z - 2}`)
      await cmd(`tp ${att.username} ${MID.x} ${MID.y} ${MID.z - 0.7}`)
      await sleep(1200)
      const e = att.players[vic.username] && att.players[vic.username].entity
      if (!e) return { error: 'victim not visible to attacker' }
      const h0 = vic.health
      for (let i = 0; i < 4; i++) {
        await att.lookAt(e.position.offset(0, 1.2, 0), true)
        att.attack(e)
        await sleep(650)
      }
      await sleep(400)
      return { before: h0, after: vic.health }
    }
    const r1 = await hit(o, n)
    t.log('1.8.9 attacks', n.ver, r1)
    t.check(`1.8.9 client can damage a ${n.ver} client of the other team`, !r1.error && r1.after < r1.before, r1)
    const r2 = await hit(n, o)
    t.log(n.ver, 'attacks 1.8.9', r2)
    t.check(`${n.ver} client can damage a 1.8.9 client of the other team`, !r2.error && r2.after < r2.before, r2)
    for (const x of [o, n]) await cmd(`effect give ${x.username} minecraft:instant_health 1 5`)
    a.chatLog.length = 0; v21.chatLog.length = 0
    a.chat('hallo vom alten client')
    v21.chat('hallo vom neuen client')
    await sleep(1500)
    t.check('chat works both ways between 1.8.9 and 1.21.4 in the running game',
      a.chatLog.some(c => c.m.includes('hallo vom neuen client')) && v21.chatLog.some(c => c.m.includes('hallo vom alten client')),
      { old: a.chatLog.map(c => c.m), neu: v21.chatLog.map(c => c.m) })
  }

  // modern clients can open the shop and see all categories
  const model = shopModel()
  for (const x of [v12, v16, v21]) {
    try {
      const w = await openShop(t, x)
      const main = shopItems(w).filter(i => i.slot >= 9)
      const cats = categorySlots(w, model)
      const quick = main.length - cats.length
      const perCat = []
      for (const c of cats) {
        await click(x, c.slot)
        await sleep(300)
        perCat.push(shopItems(x.currentWindow).filter(i => i.slot >= 9).length)
        await click(x, 0)
        await sleep(200)
      }
      const total = perCat.reduce((p, q) => p + q, 0) + quick
      t.check(`${x.ver} client can open the shop, sees ${model.cats.length} categories + ${model.quick} Schnellkauf items and browses every category page (${total} of ${model.total} entries) without disconnect`,
        cats.length === model.cats.length && quick === model.quick && JSON.stringify(perCat) === JSON.stringify(model.cats) && !x.disconnected && !x.kicked,
        { cats: cats.length, quick, perCat, expected: model.cats, kicked: x.kicked })
      x.closeWindow(x.currentWindow)
    } catch (e) { t.check(`${x.ver} client can open the shop`, false, e.message) }
    // keep them away from the shop spot: standing there they would pick up items dropped by the 1.8.9 client's tests
    await cmd(`tp ${x.username} ${MID.x + 4 + all.indexOf(x)} ${MID.y} ${MID.z + 3 + all.indexOf(x)}`)
  }

  // ---- (2) 1.8.9 client: every shop material is given and held, every shop item is bought and held
  if (!process.env.COMPAT_SKIP_SHOP) await shopAndItems(t, a)

  // ---- (5) hotbar quick-buy with full inventory
  await fullInventory(t, a, b)

  // ---- (4b) churn in a running game
  await gameChurn(t, pool, [a, b, v12, v16, v21])
}

const EXPECT_18 = {
  // modern vanilla id -> 1.8 name the client must see (translation by ViaRewind)
  firework_rocket: 'fireworks', chicken_spawn_egg: 'spawn_egg', cobweb: 'web', red_sandstone: 'red_sandstone',
  end_stone: 'end_stone', nether_star: 'nether_star', armor_stand: 'armor_stand', ender_chest: 'ender_chest',
  glowstone: 'glowstone', golden_apple: 'golden_apple', cooked_beef: 'cooked_beef', brick: 'brick', iron_ingot: 'iron_ingot',
  gold_ingot: 'gold_ingot', tnt: 'tnt', ender_pearl: 'ender_pearl', potion: 'potion'
}

async function shopAndItems (t, a) {
  const srv = t.server
  const cmd = c => srv.cmd(c)
  const P = a.username
  await cmd(`clear ${P}`)
  const mats = [...new Set([...shopMaterials(), 'brick', 'iron_ingot', 'gold_ingot', 'splash_potion', 'leather_chestplate', 'red_bed', 'blue_bed', 'red_wool', 'blue_wool'])]
  t.log('materials', mats)
  // give + hold, 9 at a time (the shop window is closed here, so bot.inventory is current)
  if (a.currentWindow) a.closeWindow(a.currentWindow)
  await sleep(300)
  const held = {}
  const problems = []
  for (let i = 0; i < mats.length; i += 9) {
    const batch = mats.slice(i, i + 9)
    await cmd(`clear ${P}`)
    for (const m of batch) await cmd(`give ${P} minecraft:${m} 1`)
    await sleep(600)
    for (const m of batch) {
      const idx = batch.indexOf(m)
      const it = a.inventory.slots[36 + idx]
      if (!it) { problems.push(`${m}: not in hotbar slot ${idx} (inv: ${a.inventory.items().map(x => x.name + '@' + x.slot).join(',')})`); continue }
      a.setQuickBarSlot(idx)
      await sleep(120)
      const h = a.heldItem
      held[m] = h ? `${h.name}:${h.metadata}` : null
      if (!h) problems.push(`${m}: held item is empty`)
      else if (EXPECT_18[m] && h.name !== EXPECT_18[m]) problems.push(`${m}: expected 1.8 name ${EXPECT_18[m]}, got ${h.name}`)
      else if (/^(air|unknown|barrier)$/.test(h.name)) problems.push(`${m}: shows as ${h.name}`)
    }
    if (a.disconnected) break
  }
  t.log('held items (modern id -> 1.8 name:meta)', held)
  t.check(`1.8.9 client holds all ${mats.length} shop/resource materials (given by command) without kick; names are translated to 1.8 ids`,
    problems.length === 0 && !a.disconnected && !a.kicked, { problems, kicked: a.kicked })
  const alive = await srv.cmd(`data get entity ${P} SelectedItemSlot`)
  t.check('server still has the 1.8.9 client in the game after cycling every hotbar slot', /entity data: \d/.test(alive), alive)

  // buy every shop item for real and hold it
  await cmd(`clear ${P}`)
  let win = await openShop(t, a)
  const model = shopModel()
  const catSlots = categorySlots(win, model).map(i => i.slot)
  const quickSlots = shopItems(win).filter(i => i.slot >= 9 && !catSlots.includes(i.slot)).map(i => i.slot)
  const cats = [...catSlots, 'quick']
  const cat = {}
  const catCounts = []
  const rawNames = []
  const heldBought = new Set()
  let boughtTotal = 0
  const stackNames = []
  for (const cs of cats) {
    await cmd(`clear ${P}`)
    for (const k of ['bronze', 'iron', 'gold']) { await giveRes(srv, P, k, 64); await giveRes(srv, P, k, 64) }
    await sleep(500)
    if (!a.currentWindow) await openShop(t, a)
    let catName = 'Schnellkauf'
    let items
    if (cs === 'quick') {
      items = quickSlots.map(sl => ({ slot: sl, item: a.currentWindow.slots[sl] })).filter(i => i.item)
    } else {
      const catItem = a.currentWindow.slots[cs]
      if (!catItem) continue
      catName = shownName(catItem)
      if (/&[0-9a-f]/.test(catName)) rawNames.push(`category: ${catName}`)
      await click(a, cs)
      await sleep(350)
      items = shopItems(a.currentWindow).filter(i => i.slot >= 9)
    }
    cat[catName] = items.length
    catCounts.push(items.length)
    for (const it of items) {
      const nm = shownName(it.item)
      const lore = shownLore(it.item)
      if (/&[0-9a-f]/.test(nm)) rawNames.push(`${catName}/${nm}`)
      if (lore.some(l => /&[0-9a-f]/.test(l))) rawNames.push(`${catName}/${nm} lore ${lore.join('|')}`)
      stackNames.push({ nm, lore: lore.join(' ') })
      await click(a, it.slot)
      await sleep(100)
      boughtTotal++
      if (a.disconnected) break
    }
    await sleep(500)
    // hold everything that was bought: server stacks sit in the container's inventory part; the hotbar ones can be selected
    const stacks = invItems(a).filter(x => !/^(brick|iron_ingot|gold_ingot)$/.test(x.name))
    for (const s of stacks) {
      heldBought.add(`${s.name}:${s.metadata}`)
      if (s.invSlot >= 36) { a.setQuickBarSlot(s.invSlot - 36); await sleep(50) }
    }
    if (a.disconnected) break
    if (cs !== 'quick') await click(a, 0)
  }
  const entries = model.total
  t.log('categories (items each)', cat)
  t.log('bought and visible in inventory (1.8 name:meta)', [...heldBought])
  t.check(`1.8.9 client browses all ${model.cats.length} shop categories + Schnellkauf and clicks all ${boughtTotal}/${entries} shop entries without kick`,
    catSlots.length === model.cats.length && JSON.stringify(catCounts) === JSON.stringify([...model.cats, model.quick]) && boughtTotal === entries && !a.disconnected && !a.kicked, { cats: cat, kicked: a.kicked })
  t.check('purchased shop items reach the 1.8.9 client with sane 1.8 item ids (no air/unknown/barrier)',
    heldBought.size >= 25 && ![...heldBought].some(n => /^(air|unknown|barrier)/.test(n)), [...heldBought])
  t.check('every shop category and item name shown to the 1.8.9 client is free of raw "&x" colour codes', rawNames.length === 0, rawNames.slice(0, 12))
  const loreEnglish = stackNames.filter(s => /Price:|Amount:/.test(s.lore))
  t.check('shop item lore is German (Preis / Menge), not English "Price: / Amount:"', stackNames.length > 0 && loreEnglish.length === 0, loreEnglish.slice(0, 2))
  if (a.currentWindow) a.closeWindow(a.currentWindow)
  await sleep(300)
  t.check('1.8.9 client is still connected after the shop/items run', !a.disconnected && !a.kicked, a.kicked)
}

async function fullInventory (t, a, b) {
  const srv = t.server
  const cmd = c => srv.cmd(c)
  const P = a.username
  const results = {}

  async function fill (fillers, bronze = 6) {
    await cmd('kill @e[type=item]')
    await cmd(`clear ${P}`)
    await giveRes(srv, P, 'bronze', bronze) // lands in hotbar slot 0
    for (let i = 0; i < fillers; i++) await cmd(`give ${P} minecraft:dirt 64`)
    await sleep(500)
  }
  async function state () {
    await sleep(900)
    return {
      brick: await invCount(srv, P, 'brick'),
      sandstone: await invCount(srv, P, 'red_sandstone'),
      dirt: await invCount(srv, P, 'dirt'),
      droppedSandstone: await droppedCount(srv, P, 'red_sandstone'),
      droppedDirt: await droppedCount(srv, P, 'dirt'),
      droppedBrick: await droppedCount(srv, P, 'brick'),
      droppedAnywhere: await srv.cmd('execute as @e[type=item,nbt={Item:{id:"minecraft:red_sandstone"}}] run data get entity @s Pos')
    }
  }
  let win = await openShop(t, a)
  // Blöcke: first entry = 2x Sandstein for 1 Bronze
  const blocksSlot = categorySlots(win, shopModel())[0].slot // first category = Blöcke
  await click(a, blocksSlot)
  await sleep(400)
  const sandSlot = shopItems(a.currentWindow).find(i => i.slot >= 9 && i.item.name === 'red_sandstone').slot

  async function scenario (label, fillers, prep, act) {
    await fill(fillers)
    if (prep) { await prep(); await sleep(300) }
    const before = await state()
    const msgs0 = a.chatLog.length
    await act()
    await sleep(500)
    const after = await state()
    const msgs = a.chatLog.slice(msgs0).map(c => c.m)
    const spent = before.brick - after.brick
    const gainedSand = after.sandstone + after.droppedSandstone - before.sandstone
    const dirtNow = after.dirt + after.droppedDirt
    const hot = hotbarOf(a)
    results[label] = { before, after, spent, gainedSand, dirtNow, msgs, hotbar: Array.from({ length: 9 }, (_, i) => hot[i] ? hot[i].name + 'x' + hot[i].count : null) }
    return results[label]
  }
  const key = idx => () => click(a, sandSlot, idx, 2)

  const s1 = await scenario('numberkey-fullinv', 35, null, key(2))
  const s2 = await scenario('numberkey-1free', 34, null, key(2))
  const s3 = await scenario('click-fullinv', 35, null, () => click(a, sandSlot, 0, 0))
  const s4 = await scenario('numberkey-empty-hotbar-slot', 28, () => cmd(`item replace entity ${P} hotbar.8 with minecraft:air`), key(8))
  const s5 = await scenario('numberkey-onto-bronze-stack', 28, null, key(0))
  t.log('full inventory scenarios', results)

  const dirtBefore = s => s.before.dirt
  // value conservation: every Bronze that was paid must show up as 2 Sandstein (kept or dropped), no filler item may vanish
  const conserved = (s, fillerLost = 0) => s.gainedSand === 2 * s.spent && s.dirtNow >= dirtBefore(s) - fillerLost && s.dirtNow <= dirtBefore(s)
  t.check('quick-buy (number key) with FULL inventory: nothing is lost (item kept/dropped, or purchase refused without charge)',
    conserved(s1), { spent: s1.spent, gainedSand: s1.gainedSand, dirtBefore: s1.before.dirt, dirtNow: s1.dirtNow, dropped: [s1.after.droppedSandstone, s1.after.droppedDirt], msgs: s1.msgs, hotbar: s1.hotbar })
  t.check('quick-buy with ONE free slot and an occupied hotbar slot: item lands in that hotbar slot, displaced stack is kept (nothing dropped)',
    conserved(s2) && s2.spent === 1 && s2.after.droppedDirt === 0 && s2.after.droppedSandstone === 0 && /red_sandstone/.test(s2.hotbar[2] || ''),
    { spent: s2.spent, gainedSand: s2.gainedSand, dirtNow: s2.dirtNow, dropped: [s2.after.droppedSandstone, s2.after.droppedDirt], hotbar: s2.hotbar, msgs: s2.msgs })
  t.check('plain click buy with FULL inventory: nothing is lost (kept, dropped or refused without charge)',
    conserved(s3), { spent: s3.spent, gainedSand: s3.gainedSand, dirtNow: s3.dirtNow, dropped: [s3.after.droppedSandstone, s3.after.droppedDirt], msgs: s3.msgs })
  t.check('quick-buy into an empty hotbar slot puts the item exactly there (hotbar slot 9)',
    conserved(s4) && s4.spent === 1 && /red_sandstone/.test(s4.hotbar[8] || ''), { spent: s4.spent, hotbar: s4.hotbar, msgs: s4.msgs })
  t.check('quick-buy with the number key of the slot holding the Bronze used as payment: no Bronze lost or duplicated, item kept',
    s5.gainedSand === 2 * s5.spent && s5.after.dirt + s5.after.droppedDirt === s5.before.dirt && s5.spent <= 1 && (s5.spent === 0 || s5.after.sandstone + s5.after.droppedSandstone === 2),
    { spent: s5.spent, gainedSand: s5.gainedSand, hotbar: s5.hotbar, dropped: [s5.after.droppedSandstone, s5.after.droppedBrick], msgs: s5.msgs })
  // no resources at all: the refusal message
  await cmd(`clear ${P}`)
  await sleep(300)
  const refuseMsgs0 = a.chatLog.length
  await click(a, sandSlot, 0, 0)
  await sleep(600)
  const refuseMsgs = a.chatLog.slice(refuseMsgs0).map(c => c.m)
  results.refusal = { msgs: refuseMsgs }
  t.log('refusal message with no resources', refuseMsgs)
  const refused = [s1, s3].filter(s => s.spent === 0).length
  t.log(`full inventory behaviour: ${refused === 2 ? 'purchase refused' : 'purchase accepted (item kept/dropped)'}`, { s1: s1.msgs, s3: s3.msgs })
  const msgsAll = Object.values(results).flatMap(r => r.msgs)
  t.check('shop purchase / refusal chat messages are free of raw "&x" colour codes', !msgsAll.some(m => /&[0-9a-f]/.test(m)) && msgsAll.length > 0, [...new Set(msgsAll)].slice(0, 4))
  t.check('shop refusal message exists, is German and has no spelling error ("Resourccen")', refuseMsgs.some(m => /nicht genug/.test(m)) && !refuseMsgs.some(m => /Resourccen/.test(m)), refuseMsgs)
  if (a.currentWindow) a.closeWindow(a.currentWindow)
  await cmd(`clear ${P}`)
  await cmd('kill @e[type=item]')
}

async function gameChurn (t, pool, base) {
  const srv = t.server
  const names = Array.from({ length: 3 }, (_, i) => `GCh${i + 1}`)
  const bots = await Promise.all(names.map(n => mk(pool, srv, n).catch(e => ({ err: e.message, username: n }))))
  await sleep(3000)
  t.log('game join positions', bots.map(b => b.err || `${b.username} ${b.entity.position}`))
  const joinedOk = bots.every(b => !b.err && inGameArea(b.entity.position))
  t.check('late joiners are put into the running arena (spectators, not stuck outside)', joinedOk, bots.map(b => b.err || `${b.username} ${b.entity.position}`))

  const rounds = []
  const churners = [...bots, base[3], base[4]] // two original players (1.16.5, 1.21.4) churn as well
  const names2 = churners.map(b => b.username)
  const vers = churners.map(b => b.ver || '1.8.9')
  let cur = churners
  // the two real players are in a team; with LanBedWars "rejoin" enabled they should come back into that team (nice to have)
  const teamBefore = Object.fromEntries([base[3], base[4]].map(b => [b.username, teamOf(b)]))
  const rejoinRounds = []
  for (let round = 0; round < 3; round++) {
    const t0 = Date.now()
    await Promise.all(cur.filter(b => !b.err).map(quit))
    const back = await Promise.all(names2.map((n, i) => mk(pool, srv, n, { version: vers[i] }).catch(e => ({ err: e.message, username: n }))))
    cur = back
    await sleep(1500)
    rejoinRounds.push(back.slice(3).map(b => {
      if (b.err) return { name: b.username, err: b.err }
      const tm = MAP.teams[teamBefore[b.username]]
      return { name: b.username, team: teamBefore[b.username], dist: Math.round(b.entity.position.distanceTo(new Vec3(tm.spawn.x, tm.spawn.y, tm.spawn.z))) }
    }))
    for (const r of rejoinRounds[rejoinRounds.length - 1]) r.gm = await gameModeOf(srv, r.name)
    const ok = await waitFor(() => back.every(b => !b.err && !b.disconnected && inGameArea(b.entity.position)), { timeout: 15000 }).then(() => true).catch(() => false)
    rounds.push({ round, ok, ms: Date.now() - t0, errs: back.filter(b => b.err).map(b => b.err), pos: back.map(b => b.err ? 'ERR' : `${b.username}@${b.entity.position}`) })
  }
  t.log('game churn rounds', rounds)
  t.check('game churn: after 3 rounds of rapid leave/rejoin everybody is connected and put back into the running game (not left in the lobby)', rounds.every(r => r.ok), rounds)
  t.log('rejoin: distance of the two team players to their old team spawn after each round', rejoinRounds)
  t.check('rejoin in the running game: a player who was in a team comes back at his own team spawn (not as spectator)',
    rejoinRounds.every(r => r.every(x => !x.err && x.dist <= 6 && x.gm === 0)), rejoinRounds)
  // the late joiners are spectators; after the churn they must still be spectators and must not be falling into the void
  await sleep(2500)
  const spec = []
  for (const b of cur.slice(0, 3)) spec.push({ name: b.username, y: Math.round(b.entity.position.y), gm: await gameModeOf(srv, b.username) })
  t.log('late joiners after the churn', spec)
  t.check('game churn: re-joined late joiners are spectators (game mode 3) hovering inside the arena, not falling into the void',
    spec.every(x => x.gm === 3 && x.y > MAP.voidY + 5), spec)
  const stuck = cur.filter(b => !b.err && !inGameArea(b.entity.position)).map(b => `${b.username} ${b.entity.position}`)
  t.check('game churn: no player stuck outside the running game', stuck.length === 0, stuck)
  const baseOk = base.slice(0, 3).every(b => !b.disconnected && inGameArea(b.entity.position))
  t.check('game churn: the players who stayed (1.8.9 x2, 1.12.2) are not disturbed', baseOk, base.slice(0, 3).map(b => `${b.username} ${b.entity.position} dc=${b.disconnected}`))
  // the 1.8.9 client itself (main audience) disconnects and reconnects into its running game
  {
    const o = base[0]
    const tm0 = MAP.teams[teamOf(o)]
    await quit(o)
    await sleep(800)
    const o2 = await mk(pool, srv, o.username).catch(e => ({ err: e.message }))
    await sleep(2000)
    const r = o2.err ? { err: o2.err } : { dist: Math.round(o2.entity.position.distanceTo(new Vec3(tm0.spawn.x, tm0.spawn.y, tm0.spawn.z))), gm: await gameModeOf(srv, o.username), team: teamOf(o2), sb: !!sidebar(o2) }
    t.log('1.8.9 client reconnect into the running game', r)
    t.check('rejoin in the running game: the 1.8.9 client comes back in survival at its own team spawn and has the game sidebar',
      !r.err && r.dist <= 6 && r.gm === 0 && r.team === teamOf(o) && r.sb, r)
    if (!o2.err) base[0] = o2
  }
  const tps = await tpsOf(srv)
  t.check('game churn: server TPS healthy (>= 15)', tps.tps !== null && tps.tps >= 15, tps)
  const list = await srv.cmd('list')
  t.log('player list', list)
  t.check('game churn: server lists exactly the 8 connected players', /There are 8 of a max/.test(list), list)
}
