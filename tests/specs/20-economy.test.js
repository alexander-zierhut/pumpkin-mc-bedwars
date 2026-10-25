// Economy: resource spawners (Bronze / Iron / Gold), item names, holograms, pickup, pile-up.
//
// Map-data-driven: nothing about coordinates, teams, spawner counts or rates is hardcoded. The spec reads
//   - the arena file of the arena the test server runs (config/arena-*.yml, the active arena of config/bedwars.yml or
//     of the plugin data folder) through tests/play/map.js: spawner positions / types / owning team / startLevel, team spawns,
//   - config/bedwars.yml (resources: item, colour, name, interval), both built into the plugin.
//
// Expected behaviour (derived from that data; Rewinside values for the current "Rewi" map in brackets):
//   a spawner with startLevel L and interval I drops once per I seconds a stack of floor(L) items, or floor(L)+1 with
//   probability frac(L)  =>  L/I items per second per spawner  (bronze: L = 1.67, I = 1 s => 1.67/s, Rewinside: 1 per 0.6 s;
//   silver "iron": L = 1, I = 10 s; gold: L = 1, I = 30 s, only on the neutral middle spawners).
//   With spawn-resources-on-game-start: false the first drop comes one interval after the start.
//
// How it measures: both bots idle on their island (too far from any spawner to pick something up) and record every
// dropped-item entity the client sees (spawn time, spawn position, item id, stack size, display name) plus every
// hologram (text display, title + countdown line) and its text over time. Afterwards the server-side ground state is read with RCON and
// compared with what the clients saw, then the bots are teleported onto the spawners and pick things up.
const fs = require('fs')
const path = require('path')
const { waitFor, sleep, itemName, plain, countItem, legacyText } = require('../harness/bots')
const { Rcon } = require('../harness/rcon')
const { loadMap, parseYaml } = require('../play/map')

/**
 * RCON command with reconnect. Harness quirk: now and then the server closes the RCON connection for no logged reason
 * (seen once between two commands, "Thread RCON Client shutting down"); the harness client then waits for 15 s and fails.
 */
async function rc (t, command) {
  const srv = t.server
  const dead = () => !srv.rcon.sock || srv.rcon.sock.destroyed || !srv.rcon.sock.writable
  const reconnect = async () => {
    t.log(`RCON connection was closed by the server, reconnecting (harness quirk) before: ${command}`)
    try { srv.rcon.close() } catch (e) { /* already closed */ }
    srv.rcon = await new Rcon('127.0.0.1', srv.rconPort, 'test-rcon').connect()
  }
  if (dead()) await reconnect()
  try {
    return await srv.cmd(command)
  } catch (e) {
    if (!/RCON timeout/.test(e.message)) throw e
    await reconnect()
    return srv.cmd(command)
  }
}

// dimension id of the arena world (volume selectors only look into the dimension of the command source)
let DIM = 'minecraft:overworld'

const WINDOW_MS = 75000 // sampling window (long enough for 2-3 gold cycles and ~75 bronze drops per spawner)

const CHAT_COLOR = { BLACK: '0', DARK_BLUE: '1', DARK_GREEN: '2', DARK_AQUA: '3', DARK_RED: '4', DARK_PURPLE: '5', GOLD: '6', GRAY: '7', DARK_GRAY: '8', BLUE: '9', GREEN: 'a', AQUA: 'b', RED: 'c', LIGHT_PURPLE: 'd', YELLOW: 'e', WHITE: 'f' }

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d
const sum = a => a.reduce((s, x) => s + x, 0)
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null }
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

const CONFIG = path.join(__dirname, '..', '..', 'config')

/** Arena + plugin config of the throwaway server (built into the plugin from config/, plus the data folder state). */
function loadWorld (dataDir, arenaName) {
  // (bedwars.yml uses inline maps, which the small parser of tests/play/map.js does not read)
  const settings = require('yaml').parse(fs.readFileSync(path.join(CONFIG, 'bedwars.yml'), 'utf8'))
  // the arena players are auto-joined into: the test's choice, else the one /map saved in the data folder, else bedwars.yml
  let want = arenaName
  if (!want) { try { want = /^arena:\s*(.+?)\s*$/m.exec(fs.readFileSync(path.join(dataDir, 'plugins', 'data', 'lan-bedwars', 'config.yml'), 'utf8'))[1] } catch (e) { /* none */ } }
  want = String(want || settings.arena).toLowerCase()
  const files = fs.readdirSync(CONFIG).filter(x => /^arena-.*\.yml$/.test(x)).sort()
  const f = files.find(x => String((parseYaml(fs.readFileSync(path.join(CONFIG, x), 'utf8')) || {}).name).toLowerCase() === want)
  if (!f) throw new Error(`economy: no arena named ${want} in config/ (${files.join(',')})`)
  const arena = path.join(CONFIG, f)
  const map = loadMap({ arena })
  const raw = parseYaml(fs.readFileSync(arena, 'utf8'))
  const spawners = map.spawners.map((s, i) => ({ ...s, level: Number(raw.spawners[i].startLevel ?? 1) }))

  const RES = {}
  for (const [key, r] of Object.entries(settings.resources || {})) {
    const type = key === 'iron' ? 'silver' : key // same renaming as tests/play/map.js
    const mat = String(r.item).toLowerCase()
    RES[type] = {
      type, cfgKey: key, item: mat, itemId: `minecraft:${mat}`, interval: Number(r.interval), cfgName: r.name,
      langName: r.name, display: r.name, color: String(r.color).replace(/^§/, '')
    }
  }
  const RES_BY_ITEM = Object.fromEntries(Object.values(RES).map(r => [r.item, r.type]))
  spawners.forEach((s, i) => { s.key = `${s.team || 'Mitte'}-${s.type}-${i}`; s.place = s.team || 'Mitte'; s.res = RES[s.type] })
  // console commands of Pumpkin always run in the main world (map worlds have no dimension of their own), see PUMPKIN-FINDINGS
  const dim = 'minecraft:overworld'
  return { map, spawners, cfg: settings, RES, RES_BY_ITEM, arena, dim, world: raw.world }
}

/** Server-side selector box around a group of spawners (whole island part incl. spawn pile spread). */
function boxAround (list, pad) {
  const xs = list.map(s => s.x); const zs = list.map(s => s.z); const ys = list.map(s => s.y)
  const x0 = Math.min(...xs) - pad; const z0 = Math.min(...zs) - pad; const y0 = Math.min(...ys) - 4
  return { x: x0, y: y0, z: z0, dx: Math.max(...xs) + pad - x0, dy: 10, dz: Math.max(...zs) + pad - z0 }
}

/** Starts recording dropped items and hologram lines seen by this bot. */
function startTracking (bot, drops, holos) {
  const onSpawn = e => {
    if (e.name !== 'item' || drops.has(e.id)) return
    drops.set(e.id, { id: e.id, t: Date.now(), x: e.position.x, y: e.position.y, z: e.position.z, seenBy: bot.username, item: null })
  }
  bot.on('entitySpawn', onSpawn)
  const timer = setInterval(() => {
    const now = Date.now()
    for (const e of Object.values(bot.entities)) {
      if (e.name === 'item') {
        let rec = drops.get(e.id)
        if (!rec) { onSpawn(e); rec = drops.get(e.id) }
        if (rec && !rec.item) {
          let d = null
          try { d = e.getDroppedItem() } catch (err) { /* item metadata not received yet */ }
          if (d) {
            rec.item = d.name
            rec.count = d.count
            rec.rawName = d.customName == null ? null : legacyText(bot.registry, d.customName)
            rec.name = rec.rawName == null ? null : plain(rec.rawName)
          }
        }
      } else if (e.name === 'text_display') {
        // one text display per spawner with the lines "title\ncountdown"; each line is tracked like a hologram line of its
        // own (the title 0.25 above the countdown) so a duplicated or missing hologram still shows in the line counts
        const text = e.metadata && e.metadata[23]
        if (text == null) continue
        const lines = legacyText(bot.registry, text).split('\n')
        lines.forEach((raw, i) => {
          const hkey = `${bot.username}:${e.id}:${i}`
          let h = holos.get(hkey)
          if (!h) { h = { id: e.id, line: i, bot: bot.username, x: e.position.x, y: e.position.y + 0.25 * (lines.length - 1 - i), z: e.position.z, hist: [] }; holos.set(hkey, h) }
          h.billboard = e.metadata[15]
          const last = h.hist[h.hist.length - 1]
          if (raw && (!last || last.raw !== raw)) h.hist.push({ t: now, raw })
        })
      }
    }
  }, 50)
  return () => { clearInterval(timer); bot.removeListener('entitySpawn', onSpawn) }
}

/**
 * Sum of item counts of dropped items of one type in a server-side box. Counts stacks per stack size (1..4) because
 * summing with scoreboard operations prints one feedback line per entity, and RCON answers > 4096 bytes arrive in several
 * packets which the harness client cannot reassemble (it would answer the next command with the tail of the previous one).
 */
async function serverTotal (t, itemId, box) {
  const base = `@e[type=item,x=${box.x},y=${box.y},z=${box.z},dx=${box.dx},dy=${box.dy},dz=${box.dz},`
  const countOf = async sel => Number(/count: (\d+)/i.exec(await rc(t, `execute in ${DIM} if entity ${sel}`))?.[1] ?? 0)
  // bronze keeps dropping once per second while the 5 commands run; a new stack in between makes the per-size counts
  // disagree with the total number of stacks, so the measurement is simply repeated until it is consistent
  let r = null
  for (let attempt = 0; attempt < 8; attempt++) {
    const t0 = Date.now()
    const stacks = await countOf(`${base}nbt={Item:{id:"${itemId}"}}]`)
    let items = 0
    let counted = 0
    for (let n = 1; n <= 4; n++) {
      const c = await countOf(`${base}nbt={Item:{id:"${itemId}",count:${n}}}]`)
      items += n * c
      counted += c
    }
    r = { items: counted === stacks ? items : NaN, stacks, t0, t1: Date.now() }
    if (counted === stacks) break
  }
  return r
}

module.exports = {
  name: 'economy',
  timeout: 360000,
  // ECO_ARENA=Mansion|Mushroom runs the same checks on another map (default: the map the companion auto-joins, Rewi)
  server: process.env.ECO_ARENA ? { pauseCountdown: 10, arena: process.env.ECO_ARENA } : { pauseCountdown: 10 },
  async run (t) {
    // ---------------------------------------------------------------- map data
    const W = loadWorld(t.server.dir, process.env.ECO_ARENA)
    DIM = W.dim
    const { map, spawners: SPAWNERS, RES, RES_BY_ITEM } = W
    const teams = map.teamNames
    const places = [...teams, 'Mitte']
    const resTypes = Object.keys(RES)
    t.log(`map "${map.name}" (world ${W.world}, dimension ${DIM}): teams ${teams.join('/')}, ${SPAWNERS.length} spawners: ${SPAWNERS.map(s => `${s.key}@${s.x};${s.y};${s.z} L${s.level} I${s.res && s.res.interval}`).join(', ')}`)
    t.log('resources:', JSON.stringify(Object.values(RES).map(r => ({ type: r.type, item: r.item, interval: r.interval, name: r.cfgName, color: r.color }))))
    t.check('map data sane: >= 2 teams, every spawner has a known resource type, every resource of the config is used', teams.length >= 2 && SPAWNERS.every(s => s.res) && resTypes.every(r => SPAWNERS.some(s => s.type === r)), { teams, types: [...new Set(SPAWNERS.map(s => s.type))] })
    const neutralTypes = [...new Set(SPAWNERS.filter(s => !s.team).map(s => s.type))]
    const baseTypes = [...new Set(SPAWNERS.filter(s => s.team).map(s => s.type))]
    t.log(`neutral (middle) spawner types: ${neutralTypes.join(',')}; team spawner types: ${baseTypes.join(',')}`)

    // Server-side counting boxes: spawners closer than 13 blocks (Chebyshev) form a cluster with one box around it (pad 6), so the
    // boxes of different clusters never overlap and a box never covers a faraway island (a "middle" place may be scattered).
    const clusters = []
    for (const sp of SPAWNERS) {
      const hit = clusters.filter(c => c.spawners.some(o => Math.max(Math.abs(o.x - sp.x), Math.abs(o.z - sp.z)) < 13))
      const merged = { spawners: [sp] }
      for (const c of hit) { merged.spawners.push(...c.spawners); clusters.splice(clusters.indexOf(c), 1) }
      clusters.push(merged)
    }
    clusters.forEach((c, i) => { c.id = `C${i}[${[...new Set(c.spawners.map(s => s.place))].join('+')}]`; c.box = boxAround(c.spawners, 6); c.spawners.forEach(s => { s.cluster = c }) })
    t.log('counting clusters:', clusters.map(c => `${c.id}: ${c.spawners.map(s => s.key).join(',')}`).join(' | '))
    const uniqClusters = list => [...new Set(list.map(s => s.cluster))]
    const nearest = (x, z) => {
      let best = null; let bd = Infinity
      for (const s of SPAWNERS) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; best = s } }
      return { spawner: best, dist: bd }
    }

    // ---------------------------------------------------------------- bots
    const a = await t.bot('EcoA')
    const b = await t.bot('EcoB')
    const drops = new Map()
    const holos = new Map()
    const stops = [startTracking(a, drops, holos), startTracking(b, drops, holos)]
    // the shared helper waitForGameStart() hardcodes Rewi's z range; here the team is the arena team whose spawn is closest
    const teamAt = bot => teams.map(n => ({ n, d: Math.hypot(map.teams[n].spawn.x - bot.entity.position.x, map.teams[n].spawn.z - bot.entity.position.z) })).sort((x, y) => x.d - y.d)[0]
    const gameSpawn = async bot => {
      await waitFor(() => teamAt(bot).d < 6 && Math.abs(bot.entity.position.y - map.teams[teamAt(bot).n].spawn.y) < 4, { timeout: 90000, what: `${bot.username} to be teleported to a team spawn` })
      await sleep(500)
      return teamAt(bot).n
    }
    // Armor stand holograms are only tracked within ~64 blocks (spigot entity-tracking-range "other"). On maps whose middle is
    // farther away from every island the two idle players cannot see those holograms, so a third client joins as well, is
    // parked in spectator mode in the middle of the far spawners and records them too (spectators pick nothing up).
    const farSp = SPAWNERS.filter(s => Math.min(...teams.map(n => hd(s, map.teams[n].spawn))) > 50)
    let observer = null
    if (farSp.length) observer = await t.bot('EcoM')
    if (observer) stops.push(startTracking(observer, drops, holos))
    const [teamA, teamB] = await Promise.all([gameSpawn(a), gameSpawn(b)])
    const gameStart = Date.now() - 500
    if (observer) {
      const c = { x: sum(farSp.map(s => s.x)) / farSp.length, y: Math.max(...farSp.map(s => s.y)) + 3, z: sum(farSp.map(s => s.z)) / farSp.length }
      await gameSpawn(observer)
      await rc(t, 'gamemode spectator EcoM')
      await rc(t, `execute as EcoM at @s run tp @s ${c.x} ${c.y} ${c.z}`)
      t.log(`${farSp.length} spawner(s) are > 50 blocks from every island (${farSp.map(s => s.key).join(', ')}): hologram observer parked at ${round(c.x)};${round(c.y)};${round(c.z)}, max distance to them ${round(Math.max(...farSp.map(s => hd(s, c))))}`)
      t.check('hologram observer is within 45 blocks of every far spawner', farSp.every(s => hd(s, c) < 45), { far: farSp.map(s => ({ key: s.key, d: round(hd(s, c)) })) })
    }
    const botOf = { [teamA]: a, [teamB]: b }
    const minDistToSpawner = Math.min(...[teamA, teamB].map(n => Math.min(...SPAWNERS.map(s => hd(s, map.teams[n].spawn)))))
    // On maps whose team spawn is right next to its spawner (Rush: 2 blocks) the idle bots would eat the drops that are
    // counted, so they watch as spectators (spectators see every entity and pick nothing up) until the pickup part.
    const parked = minDistToSpawner <= 3
    if (parked) for (const bot of [a, b]) await rc(t, `gamemode spectator ${bot.username}`)
    t.log(`closest team spawn to a spawner: ${round(minDistToSpawner)} blocks${parked ? ' -> idle bots parked as spectators' : ''}`)
    t.check('idle bots cannot pick up the drops that are counted (out of range or spectating)', minDistToSpawner > 3 || parked, { minDistToSpawner: round(minDistToSpawner), parked })

    // sanity: the arena really runs
    t.log('game list:', (await rc(t, 'bw list')).trim())

    // ---------------------------------------------------------------- configured names
    // Independent of the config files (which the test would otherwise just echo back): Rewinside's three currencies.
    const CANON = { bronze: { name: 'Bronze', item: 'brick', color: '4' }, silver: { name: 'Iron', item: 'iron_ingot', color: '7' }, gold: { name: 'Gold', item: 'gold_ingot', color: '6' } }
    t.check('currencies are the Rewinside ones: Bronze (brick, \u00a74), Iron (iron ingot, \u00a77), Gold (gold ingot, \u00a76), no other resource', Object.keys(RES).every(k => CANON[k]) && Object.values(RES).every(r => r.display === CANON[r.type].name && r.item === CANON[r.type].item && r.color === CANON[r.type].color), Object.values(RES).map(r => ({ type: r.type, display: r.display, item: r.item, color: r.color })))
    t.check('every resource has a configured display name (Bronze / Iron / Gold) that is not a default item-name fallback ("Brick", "Iron Ingot", "Gold Ingot")', Object.values(RES).every(r => r.display && !/^(brick|iron ingot|gold ingot)$/i.test(r.display)), Object.values(RES).map(r => ({ type: r.type, display: r.display })))

    // ---------------------------------------------------------------- sampling window
    const w0 = gameStart + 3000
    const w1 = w0 + WINDOW_MS
    t.log(`sampling ${WINDOW_MS / 1000} s ...`)
    await sleep(Math.max(0, w1 - Date.now()) + 1500)

    const all = [...drops.values()]
    const known = all.filter(d => d.item)
    t.check('every dropped item entity delivered its item data to the client', known.length === all.length, { entities: all.length, withData: known.length })
    t.log(`seen ${all.length} item entities; first at +${all.length ? Math.min(...all.map(d => d.t)) - gameStart : '-'} ms after game start`)

    // classify by spawn position
    const per = new Map(SPAWNERS.map(s => [s.key, []]))
    const strays = []
    for (const d of known) {
      const { spawner, dist } = nearest(d.x, d.z)
      const res = RES_BY_ITEM[d.item]
      if (!res || dist > 0.6 || spawner.type !== res || Math.abs(d.y - (spawner.y + 0.05)) > 0.2) strays.push({ item: d.item, x: d.x, y: d.y, z: d.z, dist: round(dist) })
      else per.get(spawner.key).push(d)
    }
    t.check('every dropped item spawned exactly on a spawner of the matching resource type (no strays, e.g. no gold at bases)', strays.length === 0, { strays: strays.slice(0, 8), n: strays.length })

    const inWin = list => list.filter(d => d.t >= w0 && d.t < w1)
    const frac = l => l - Math.floor(l)

    // ---- per spawner: drop cadence, rate and stack sizes (all resources, expectations from interval / startLevel)
    const stats = {}
    const pooled = {} // type -> { items, drops, upper, spawners } for short-interval resources
    for (const s of SPAWNERS) {
      const I = s.res.interval
      const expDrops = WINDOW_MS / 1000 / I
      const all2 = per.get(s.key).sort((x, y) => x.t - y.t)
      const ds = inWin(all2)
      const gaps = all2.slice(1).map((d, i) => d.t - all2[i].t)
      const items = sum(ds.map(d => d.count))
      const lo = Math.floor(s.level)
      const upper = ds.filter(d => d.count === lo + 1).length
      const other = ds.filter(d => d.count !== lo && d.count !== lo + 1).length
      const label = `${s.place} ${s.type} spawner (${s.x};${s.z})`
      stats[s.key] = { drops: ds.length, items, perSec: round(items / (WINDOW_MS / 1000)), medianGapMs: median(gaps), maxGapMs: gaps.length ? Math.max(...gaps) : null, upper, other, level: s.level, interval: I }
      if (expDrops >= 30) {
        // frequent resource (bronze): statistical checks
        t.check(`${label}: one drop per ${I} s (no skipped / doubled cycles)`, ds.length >= expDrops - 2 && ds.length <= expDrops + 2, stats[s.key])
        const expRate = s.level / I
        t.check(`${label}: ~${round(expRate)} items/s (startLevel ${s.level}, interval ${I} s)`, items / (WINDOW_MS / 1000) > expRate * 0.88 && items / (WINDOW_MS / 1000) < expRate * 1.12, { perSec: round(items / (WINDOW_MS / 1000)), items, expected: round(expRate * WINDOW_MS / 1000, 1) })
        t.check(`${label}: no stalls (max gap between drops < ${I * 2.5} s, median ~${I} s)`, gaps.length > 0 && Math.max(...gaps) < I * 2500 && Math.abs(median(gaps) - I * 1000) < 120 * I, { max: Math.max(...gaps), median: median(gaps) })
        t.check(`${label}: stack sizes are ${lo}${frac(s.level) > 0 ? ' or ' + (lo + 1) : ''} (fractional level ${s.level})`, other === 0 && (frac(s.level) > 0 || upper === 0), { upper, other, drops: ds.length })
        const share = upper / Math.max(1, ds.length)
        if (frac(s.level) > 0) t.check(`${label}: ${round(frac(s.level) * 100, 0)}% of the drops are ${lo + 1}-stacks (+-16%)`, Math.abs(share - frac(s.level)) < 0.16, { share: round(share), upper, drops: ds.length })
        const p = pooled[s.type] || (pooled[s.type] = { items: 0, drops: 0, upper: 0, n: 0, level: s.level, interval: I })
        p.items += items; p.drops += ds.length; p.upper += upper; p.n++
      } else {
        // slow resource (silver / gold): exact cadence
        const first = all2.length ? all2[0].t - gameStart : null
        stats[s.key].firstAfterStartMs = first
        stats[s.key].gapsMs = gaps
        stats[s.key].counts = all2.map(d => d.count)
        t.check(`${label}: one drop every ${I} s (${Math.floor(expDrops)}-${Math.ceil(expDrops)} in ${WINDOW_MS / 1000} s), stack size ${lo}${frac(s.level) > 0 ? '-' + (lo + 1) : ''}`, ds.length >= Math.floor(expDrops) && ds.length <= Math.ceil(expDrops) && all2.every(d => d.count === lo || (frac(s.level) > 0 && d.count === lo + 1)), stats[s.key])
        t.check(`${label}: first drop ~${I} s after game start, not at the start (spawn-resources-on-game-start false)`, first > I * 1000 - 1000 && first < I * 1000 + 2000, { firstAfterStartMs: first })
        const tol = Math.max(700, I * 33)
        t.check(`${label}: gaps between drops are ${I} s +-${tol / 1000} s`, gaps.length >= Math.floor(expDrops) - 2 && gaps.every(g => Math.abs(g - I * 1000) < tol), { gapsMs: gaps })
      }
    }
    // Pooled over all spawners of a frequent resource (about 500 items for 4 spawners, sd about 1.6%): tight enough that a wrong level (1.5 -> -10%, 1.8 -> +8%, 2 -> +20%) fails.
    for (const [type, p] of Object.entries(pooled)) {
      const expRate = p.level / p.interval
      const poolRate = p.items / (WINDOW_MS / 1000) / p.n
      t.check(`all ${p.n} ${type} spawners pooled: ${round(expRate)} items/s each within +-6% (catches a wrong level, e.g. 1.5 / 1.8)`, poolRate > expRate * 0.94 && poolRate < expRate * 1.06, { perSpawnerPerSec: round(poolRate, 3), items: p.items, drops: p.drops })
      const f = frac(p.level)
      if (f > 0) t.check(`all ${p.n} ${type} spawners pooled: ${round(f * 100, 0)}% of the drops are ${Math.floor(p.level) + 1}-stacks within +-9%`, Math.abs(p.upper / p.drops - f) < 0.09, { share: round(p.upper / p.drops, 3), upper: p.upper, drops: p.drops })
    }
    // per team: the base total as Rewinside describes it (all frequent spawners of the team)
    for (const team of teams) {
      for (const type of Object.keys(pooled)) {
        const sp = SPAWNERS.filter(s => s.team === team && s.type === type)
        if (!sp.length) continue
        const rate = sum(sp.map(s => stats[s.key].items)) / (WINDOW_MS / 1000)
        const exp = sum(sp.map(s => s.level / s.res.interval))
        t.check(`${team} base makes ~${round(exp)} ${type}/s (${sp.length} spawner(s))`, rate > exp * 0.9 && rate < exp * 1.1, { perSec: round(rate), expected: round(exp) })
      }
    }

    // The expectations above come from the arena file, so a bad map value would be echoed back. Measured per-spawner rates of
    // the three currencies must keep the economy's value order (bronze common, silver rarer, gold rarest) and sane magnitudes.
    const measuredRate = type => { const l = SPAWNERS.filter(s => s.type === type); return l.length ? sum(l.map(s => stats[s.key].items)) / (WINDOW_MS / 1000) / l.length : null }
    const rates = Object.fromEntries(resTypes.map(r => [r, measuredRate(r)]))
    const rb = rates.bronze; const rs = rates.silver; const rg = rates.gold
    // the value order holds for what the whole map produces (Rush: one gold spawner at level 4 makes more per spawner than a
    // silver one, but the two silver spawners together still out-produce it)
    const total = type => SPAWNERS.filter(s => s.type === type).reduce((n, s) => n + stats[s.key].items, 0) / (WINDOW_MS / 1000)
    const tb = total('bronze'); const ts = total('silver'); const tg = total('gold')
    t.check('economy sanity: per spawner bronze 0.5-4, silver 0.05-1, gold 0.02-0.5 items/s; map total bronze > silver > gold', (rb == null || (rb >= 0.5 && rb <= 4)) && (rs == null || (rs >= 0.05 && rs <= 1)) && (rg == null || (rg >= 0.02 && rg <= 0.5)) && (rb == null || rs == null || tb > ts) && (rs == null || rg == null || ts > tg), { perSpawner: rates, mapTotal: { bronze: round(tb, 3), silver: round(ts, 3), gold: round(tg, 3) } })

    // ---- placement: neutral resources only on neutral spawners, base resources only at bases
    const wrongPlace = known.filter(d => {
      const { spawner } = nearest(d.x, d.z)
      return spawner && RES_BY_ITEM[d.item] && spawner.type !== RES_BY_ITEM[d.item]
    })
    const neutralOnly = resTypes.filter(r => SPAWNERS.some(s => s.type === r) && SPAWNERS.every(s => s.type !== r || !s.team))
    const neutralAtBase = known.filter(d => neutralOnly.includes(RES_BY_ITEM[d.item]) && nearest(d.x, d.z).spawner.team)
    t.check(`${neutralOnly.join('/') || '-'} drops only at the neutral (middle) spawners (none at the bases), base resources never in the middle`, neutralAtBase.length === 0 && wrongPlace.length === 0, { neutralAtBase: neutralAtBase.length, wrongPlace: wrongPlace.length, neutralOnly })

    // ---------------------------------------------------------------- item display names as the client receives them
    const byRes = Object.fromEntries(resTypes.map(r => [r, []]))
    for (const d of known) if (RES_BY_ITEM[d.item]) byRes[RES_BY_ITEM[d.item]].push(d)
    for (const [res, r] of Object.entries(RES)) {
      const list = byRes[res]
      const names = [...new Set(list.map(d => d.rawName))]
      t.check(`${res}: ground item is ${r.item} with custom name "${r.display}" (colour code §${r.color}) on the client`, list.length > 0 && list.every(d => d.item === r.item && d.name === r.display && d.rawName.startsWith('§' + r.color)), { n: list.length, rawNames: names })
    }

    // ---------------------------------------------------------------- holograms
    // every bot records its own copy of every hologram line; per spawner use the copy of the bot that saw most updates
    const candidates = []
    for (const h of holos.values()) {
      const near = SPAWNERS.map(s => ({ s, d: Math.hypot(s.x - h.x, s.z - h.z) })).sort((x, y) => x.d - y.d)[0]
      if (near.d < 0.2 && h.y > near.s.y + 0.3 && h.y < near.s.y + 2.5) candidates.push({ ...h, spawner: near.s })
    }
    const lines = []
    for (const s of SPAWNERS) {
      const mine = candidates.filter(c => c.spawner === s)
      const score = bn => sum(mine.filter(c => c.bot === bn).map(c => c.hist.length))
      const best = ['EcoA', 'EcoB', 'EcoM'].sort((x, y) => score(y) - score(x))[0]
      lines.push(...mine.filter(c => c.bot === best))
    }
    const holoSeenBy = {}
    for (const s of SPAWNERS) holoSeenBy[s.key] = [...new Set(candidates.filter(c => c.spawner === s).map(c => c.bot))]
    const missing = []
    const holoReport = {}
    for (const s of SPAWNERS) {
      const mine = lines.filter(l => l.spawner === s).sort((x, y) => y.y - x.y)
      const title = mine[0]
      const sub = mine[1]
      const titleRaw = title && title.hist[0] && title.hist[0].raw
      const subTexts = sub ? sub.hist.map(h => h.raw) : []
      holoReport[s.key] = { title: titleRaw, sub: subTexts.slice(0, 3), nSub: subTexts.length, billboard: title && title.billboard, entities: new Set(mine.map(l => l.id)).size }
      if (!title || !sub) missing.push(s.key)
    }
    const lineCounts = SPAWNERS.map(s => ({ key: s.key, n: lines.filter(l => l.spawner === s).length })).filter(x => x.n !== 2)
    t.check('every spawner has exactly one hologram with two lines (no duplicated / stale holograms)', lineCounts.length === 0 && SPAWNERS.every(s => holoReport[s.key].entities === 1), { lineCounts })
    t.check('every spawner has two hologram lines (title + countdown) visible to the client', missing.length === 0, { missing, holoSeenBy, holoReport })
    const badTitles = SPAWNERS.filter(s => { const r = s.res; const h = holoReport[s.key]; return !h.title || plain(h.title) !== r.display || !h.title.startsWith('§' + r.color) })
    t.check(`hologram titles read ${Object.values(RES).map(r => r.display).join(' / ')} in the resource colour`, badTitles.length === 0, { bad: badTitles.map(s => ({ key: s.key, title: holoReport[s.key].title })) })
    // (1.8 used invisible armor stands with a visible name; a text display with billboard "center" looks the same: it always faces the player)
    const badFlags = SPAWNERS.filter(s => holoReport[s.key].billboard !== 3)
    t.check('holograms always face the player like a name tag (text display billboard center)', badFlags.length === 0, { bad: badFlags.map(s => ({ key: s.key, billboard: holoReport[s.key].billboard })) })
    const rawLeaks = [...holos.values()].flatMap(h => h.hist.map(x => x.raw)).filter(r => /[&%]|null|undefined/.test(r))
    t.check('no hologram text contains raw & codes, %placeholders% or null', rawLeaks.length === 0, { rawLeaks: [...new Set(rawLeaks)].slice(0, 6) })

    // interval-1 resources show the static subtitle "every second"
    const everySecond = SPAWNERS.filter(s => s.res.interval === 1)
    if (everySecond.length) {
      const subs = everySecond.map(s => holoReport[s.key].sub)
      t.check('hologram sub line of the 1 s resources says "every second"', subs.every(sub => sub.length > 0 && sub.every(x => plain(x) === 'every second')), { subs })
    }

    // countdown holograms for slower resources: sequence N..1 then reset to the interval, reset coincides with the drop
    for (const s of SPAWNERS.filter(x => x.res.interval > 1)) {
      const mine = lines.filter(l => l.spawner === s).sort((x, y) => y.y - x.y)
      const sub = mine[1]
      if (!sub) continue
      const seq = sub.hist.map(h => ({ t: h.t, v: Number((/(\d+)/.exec(plain(h.raw)) || [])[1]), raw: h.raw }))
      const interval = s.res.interval
      const bad = []
      const resets = []
      for (let i = 1; i < seq.length; i++) {
        const p = seq[i - 1].v
        const c = seq[i].v
        if (c === p - 1) continue
        if (p === 1 && c === interval) { resets.push(seq[i].t); continue }
        bad.push(`${p}->${c}`)
      }
      const drops2 = per.get(s.key).map(d => d.t)
      const offsets = resets.map(r => Math.min(...drops2.map(d => Math.abs(d - r))))
      const stepGaps = seq.slice(1).map((x, i) => x.t - seq[i].t)
      const texts = [...new Set(seq.map(x => plain(x.raw).replace(/\d+/, 'N')))]
      const atOne = plain((seq.find(x => x.v === 1) || {}).raw)
      t.log(`${s.key} hologram sequence (s after game start: value): ${seq.slice(0, 40).map(x => `${round((x.t - gameStart) / 1000, 1)}:${x.v}`).join(' ')}`)
      t.log(`${s.key} hologram at 1: "${atOne}"`)
      t.check(`${s.key} hologram at 1 is grammatical English (not "1 seconds")`, !/\b1 seconds/.test(atOne), { atOne })
      t.check(`${s.key} countdown hologram counts down by 1 each step and resets to ${interval}`, seq.length > interval && bad.length === 0, { steps: seq.length, bad: bad.slice(0, 5), texts })
      t.check(`${s.key} countdown ticks once per second`, stepGaps.length > 5 && round(median(stepGaps), 0) >= 900 && median(stepGaps) <= 1100, { medianStepMs: median(stepGaps) })
      t.check(`${s.key} countdown reset coincides with the item drop (+-1.2 s)`, resets.length >= 1 && offsets.every(o => o < 1200), { resets: resets.length, offsetsMs: offsets })
    }

    // ---------------------------------------------------------------- server-side ground state vs what the clients saw
    const server = {}
    for (const c of clusters) {
      server[c.id] = {}
      for (const [res, r] of Object.entries(RES)) server[c.id][res] = await serverTotal(t, r.itemId, c.box)
    }
    const groundSeen = (type, list) => sum(uniqClusters(list).map(c => server[c.id][type].items))
    await sleep(800)
    const clusterOfDrop = d => nearest(d.x, d.z).spawner.cluster.id
    // the clients may still have received a few more entities after tAfter; re-read once more
    const known2 = [...drops.values()].filter(d => d.item)
    const cmp = {}
    let allMatch = true
    for (const place of clusters.map(c => c.id)) {
      for (const res of resTypes) {
        // entities spawned before the (last, consistent) measurement started must be there; ones spawned until it ended may be
        const m = server[place][res]
        const lo = sum(known2.filter(d => RES_BY_ITEM[d.item] === res && d.t <= m.t0 - 200 && clusterOfDrop(d) === place).map(d => d.count))
        const hi = sum(known2.filter(d => RES_BY_ITEM[d.item] === res && d.t <= m.t1 + 400 && clusterOfDrop(d) === place).map(d => d.count))
        const sv = server[place][res].items
        const ok = sv >= lo && sv <= hi
        if (!ok && !(lo === 0 && hi === 0 && sv === 0)) allMatch = false
        cmp[`${place}/${res}`] = { server: sv, serverStacks: server[place][res].stacks, clientLo: lo, clientHi: hi, ok }
      }
    }
    t.check('server ground items match exactly what the clients saw spawn (nothing lost, no hidden merging / extra items)', allMatch, cmp)
    const bronzeType = SPAWNERS.find(s => s.res.interval === 1)
    if (bronzeType) {
      const stacksNow = server[bronzeType.cluster.id][bronzeType.type].stacks
      const dropsNow = known2.filter(d => d.item === bronzeType.res.item && clusterOfDrop(d) === bronzeType.cluster.id).length
      t.check(`spawner-disable-merge works: ${bronzeType.type} stays one entity per drop (entities == drops, no merge into big stacks)`, Math.abs(stacksNow - dropsNow) <= 4, { serverStacks: stacksNow, clientDrops: dropsNow })
    }

    // ---- pile-up note
    const groundEntities = Number(/count: (\d+)/i.exec(await rc(t, 'execute if entity @e[type=item]'))?.[1] ?? 0)
    const elapsed = (Date.now() - gameStart) / 1000
    const perSecEntities = groundEntities / elapsed
    const steady = Math.round(perSecEntities * 300) // item-despawn-rate 6000 ticks = 300 s
    const tpsOut = plain(await rc(t, 'tps')).replace(/\s+/g, ' ')
    t.log(`PILE-UP: ${groundEntities} item entities on the ground after ${round(elapsed, 0)} s with nobody collecting (${round(perSecEntities, 1)} entities/s); steady state after the 5 min despawn would be ~${steady} entities. ${tpsOut}`)
    const tps1m = Number((/:\s*\*?([\d.]+)/.exec(tpsOut) || [])[1])
    t.check('server TPS stays healthy while hundreds of item entities lie around', tps1m >= 18, { tpsOut })

    // ---------------------------------------------------------------- pickup (teleport the bots onto the spawners)
    for (const stop of stops) stop()
    if (parked) { for (const bot of [a, b]) await rc(t, `gamemode survival ${bot.username}`); await sleep(500) }
    // tp inside the player's own dimension (a plain "tp <player> x y z" from the console would move the player to the overworld)
    const tp = (bot, p) => rc(t, `execute as ${bot.username} at @s run tp @s ${p.x} ${p.y} ${p.z}`)
    const pickup = {}
    for (const team of teams.filter(n => botOf[n])) {
      const bot = botOf[team]
      const fast = SPAWNERS.filter(s => s.team === team && s.res.interval === 1)
      if (!fast.length) continue
      const type = fast[0].type
      const res = RES[type]
      const mid = { x: sum(fast.map(s => s.x)) / fast.length, y: fast[0].y, z: sum(fast.map(s => s.z)) / fast.length }
      // how far from the spawner does the pile spread? (stacks within r blocks of the first spawner, server side)
      const spread = {}
      for (const r of [0.5, 1, 1.5, 2.5]) spread[r] = Number(/count: (\d+)/i.exec(await rc(t, `execute in ${DIM} if entity @e[type=item,nbt={Item:{id:"${res.itemId}"}},x=${fast[0].x},y=${fast[0].y},z=${fast[0].z},distance=..${r}]`))?.[1] ?? 0)
      const before = (await serverTotal(t, res.itemId, boxAround(fast, 4))).items
      const t0 = Date.now()
      const series = []
      const poll = setInterval(() => series.push([Date.now() - t0, countItem(bot, res.item)]), 250)
      for (const s of fast) { await tp(bot, s); await sleep(3000) }
      clearInterval(poll)
      const c1 = countItem(bot, res.item)
      const groundAfter = await serverTotal(t, res.itemId, boxAround(fast, 3))
      // fresh drops while standing between the spawners (only spawners within ~1 block count); if the spawners of a team are
      // farther apart, stand on the first one
      const stand = fast.some(s => hd(s, mid) <= 1.05) ? mid : fast[0]
      const near = fast.filter(s => hd(s, stand) <= 1.05)
      const expRate = sum(near.map(s => s.level / s.res.interval))
      const measureMs = expRate >= 3 ? 30000 : 40000
      const tol = expRate >= 3 ? 0.13 : 0.16 // ~50-100 items: sd 4-5%
      await tp(bot, stand)
      await sleep(1500)
      const c2 = countItem(bot, res.item)
      const t1 = Date.now()
      await sleep(measureMs)
      const c3 = countItem(bot, res.item)
      const rate = (c3 - c2) / ((Date.now() - t1) / 1000)
      pickup[team] = { onGroundBefore: before, pileSpreadStacksWithinR: spread, collectedStandingOnSpawners: c1, groundAfterStacks: groundAfter.stacks, groundAfterItems: groundAfter.items, freshPerSec: round(rate), expectedPerSec: round(expRate), series: series.filter((_, i) => i % 2 === 0).map(x => x.join(':')).join(' ') }
      t.log(`${type} pickup ${team}: ${JSON.stringify(pickup[team])}`)
      t.check(`${team}: standing on the ${fast.length} ${type} spawner(s) (3 s each) collects the whole pile (>= 95% of ${before})`, c1 >= before * 0.95, pickup[team])
      t.check(`${team}: only a few items stay on the ground at the spawners after that`, groundAfter.items <= 8, { groundAfter })
      t.check(`${team}: standing ${near.length > 1 ? 'between the' : 'on one of the'} ${type} spawners collects fresh drops at ~${round(expRate)}/s (no drop missed)`, near.length > 0 && rate > expRate * (1 - tol) && rate < expRate * (1 + tol), { perSec: round(rate), gained: c3 - c2, spawnersInReach: near.length })
      const stacks = bot.inventory.items().filter(i => i.name === res.item)
      t.check(`${team}: picked-up ${type} is named "${res.display}" in the inventory and stacks to 64`, stacks.length > 0 && stacks.every(i => itemName(i) === res.display) && stacks.filter(i => i.count === 64).length >= 1, { stacks: stacks.slice(0, 8).map(i => `${itemName(i)}x${i.count}@${i.slot}`) })
    }
    // silver (any 10 s resource that exists at the bases): stand on the spawner and let the pile + the next drop come in
    const slowBase = baseTypes.map(ty => RES[ty]).find(r => r.interval > 1 && r.interval <= 12)
    if (slowBase) {
      for (const team of teams.filter(n => botOf[n])) {
        const bot = botOf[team]
        const sp = SPAWNERS.filter(s => s.team === team && s.type === slowBase.type)
        const before = groundSeen(slowBase.type, sp)
        for (const s of sp) { await tp(bot, s); await sleep(1200) }
        await waitFor(() => countItem(bot, slowBase.item) >= before, { timeout: 4000, what: `${slowBase.type} pile pickup` }).catch(() => {})
        const got0 = countItem(bot, slowBase.item)
        const t0 = Date.now()
        // the next drop must arrive within one cycle and be picked up instantly (pickup delay 0)
        await tp(bot, sp[sp.length - 1])
        await waitFor(() => countItem(bot, slowBase.item) > got0, { timeout: slowBase.interval * 1000 + 2000, what: `next ${slowBase.type} drop` }).catch(() => {})
        const got = countItem(bot, slowBase.item)
        const stack = bot.inventory.items().find(i => i.name === slowBase.item)
        t.check(`${team}: ${slowBase.type} pile (${before}) is picked up at once and the next drop follows within ${slowBase.interval + 0.5} s; name "${slowBase.display}"`, got0 >= before && got >= got0 + 1 && got <= got0 + sp.length && Date.now() - t0 < slowBase.interval * 1000 + 500 && itemName(stack) === slowBase.display, { before, got0, got, waitedMs: Date.now() - t0, name: stack && itemName(stack) })
      }
    }
    // neutral resources (gold): stand on each of the middle spawners
    for (const type of neutralTypes) {
      const res = RES[type]
      const sp = SPAWNERS.filter(s => !s.team && s.type === type)
      const bot = botOf[teams[0]] || a
      const before = await (async () => { let n = 0; for (const c of uniqClusters(sp)) n += (await serverTotal(t, res.itemId, c.box)).items; return n })()
      const had = countItem(bot, res.item)
      const visits = []
      for (const s of sp) { await tp(bot, s); await sleep(2000); visits.push(`${s.key}:${countItem(bot, res.item) - had}`) }
      const got = countItem(bot, res.item) - had
      const stack = bot.inventory.items().find(i => i.name === res.item)
      let left = 0
      for (const c of uniqClusters(sp)) left += (await serverTotal(t, res.itemId, c.box)).items
      if (got < before || left > 0) {
        for (const c of uniqClusters(sp)) {
          const bx = c.box
          t.log(`${type} leftover entities in ${c.id}: ${(await rc(t, `execute in ${DIM} as @e[type=item,nbt={Item:{id:"${res.itemId}"}},x=${bx.x},y=${bx.y},z=${bx.z},dx=${bx.dx},dy=${bx.dy},dz=${bx.dz}] run data get entity @s Pos`)).replace(/\n/g, ' | ')}`)
        }
      }
      t.log(`${type} pickup visits (cumulative): ${visits.join(' ')}`)
      t.check(`${type}: standing on all ${sp.length} middle spawners picks up all ${before} items lying there; name "${res.display}"`, before > 0 && got >= before && left === 0 && itemName(stack) === res.display, { before, got, leftOnGround: left, name: stack && itemName(stack) })
      if (res.interval <= 12) {
        // the next drop of a frequent-enough neutral resource arrives within one cycle and is picked up instantly (pickup delay 0)
        const g0 = countItem(bot, res.item)
        const tn = Date.now()
        await waitFor(() => countItem(bot, res.item) > g0, { timeout: res.interval * 1000 + 2000, what: `next ${type} drop` }).catch(() => {})
        const waited = Date.now() - tn
        t.check(`${type}: standing on the last middle spawner, the next drop arrives within ${res.interval + 0.5} s and is picked up at once`, countItem(bot, res.item) > g0 && waited < res.interval * 1000 + 500, { gained: countItem(bot, res.item) - g0, waitedMs: waited })
      }
      const other = botOf[teams[1]] || b
      const inInv = countItem(other, res.item)
      t.check(`the bot that stayed at its base has no ${type} (bases do not produce it)`, inInv === 0, { inInv })
    }

    // ---------------------------------------------------------------- items do despawn (age them artificially)
    for (const team of teams.filter(n => botOf[n])) {
      const sp = map.teams[team].spawn
      await tp(botOf[team], { x: sp.x, y: sp.y, z: sp.z })
    }
    await sleep(1500)
    await rc(t, 'tag @e[type=item] add old')
    const stillFresh = () => rc(t, 'execute if entity @e[type=item,tag=!old]').then(r => Number(/count: (\d+)/i.exec(r)?.[1] ?? 0))
    const oldCount = Number(/count: (\d+)/i.exec(await rc(t, 'execute if entity @e[type=item,tag=old]'))?.[1] ?? 0)
    // (at least 25 items: 20 young controls plus a few to age out; the spawners drop 29 to 60 in the window)
    // 20 "young" control items are aged to 5700 ticks (+120 during the wait = 5820 < 6000: must survive), all others to 5940 (6060 > 6000: must go)
    await rc(t, 'tag @e[type=item,tag=old,limit=20,sort=random] add young')
    const youngCount = Number(/count: (\d+)/i.exec(await rc(t, 'execute if entity @e[type=item,tag=young]'))?.[1] ?? 0)
    await rc(t, 'execute as @e[type=item,tag=old,tag=!young] run data merge entity @s {Age:5940s}')
    await rc(t, 'execute as @e[type=item,tag=young] run data merge entity @s {Age:5700s}')
    await sleep(6000)
    const left = Number(/count: (\d+)/i.exec(await rc(t, 'execute if entity @e[type=item,tag=old,tag=!young]'))?.[1] ?? 0)
    const youngLeft = Number(/count: (\d+)/i.exec(await rc(t, 'execute if entity @e[type=item,tag=young]'))?.[1] ?? 0)
    // upper bound: age the survivors to just below the limit and they must vanish within a few seconds too
    await rc(t, 'execute as @e[type=item,tag=young] run data merge entity @s {Age:5980s}')
    await sleep(3000)
    const youngLeft2 = Number(/count: (\d+)/i.exec(await rc(t, 'execute if entity @e[type=item,tag=young]'))?.[1] ?? 0)
    const fresh = await stillFresh()
    t.check('ground items despawn at age 6000 ticks, not earlier (age 5820 survives) and not later (age 6060 gone; 5980+60 gone)', oldCount >= 25 && youngCount === 20 && left <= Math.max(2, oldCount * 0.05) && youngLeft === 20 && youngLeft2 <= 1, { aged: oldCount, young: youngCount, stillThere: left, youngAfter5820: youngLeft, youngAfter6040: youngLeft2 })
    t.check('despawn is selective: items dropped after the ageing are still there (spawners keep producing)', fresh > 0, { freshItems: fresh })

    const errs = t.server.errors()
    t.check('no server errors / exceptions during the economy run', errs.length === 0, errs.slice(0, 5))
  }
}
