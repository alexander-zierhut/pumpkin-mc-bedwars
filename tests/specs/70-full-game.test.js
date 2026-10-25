// Full-game simulation with three 1.8.9 bots (team of 2 against a team of 1).
//
// Flow: lobby -> auto-join -> game start -> building (place/break, map blocks, bridging over the void)
//   -> own bed cannot be broken -> void death credits the last attacker, instant respawn with respawn
//   protection -> enemy bed destroyed (message/title) -> final kill = spectator, game goes on
//   -> last team alive wins (title/message) -> arena rebuild -> everybody auto-joins the lobby -> round 2.
//
// The core actions (place, dig, attack) are done by the bots. RCON is used to set up positions
// (tp) and to look at the authoritative server state (execute if block ...).
//
// Nothing about the map is hardcoded: teams, spawns, beds, walk level, void height, lobby and spectator spawn
// are read from the arena file through harness/bots.js (MAP = tests/play/map.js). Directions are derived from
// the team spawns (axis towards the other team); build spots and bed stand spots are searched at runtime.
const fs = require('fs')
const { MAP, waitFor, waitForGameStart, countItem, invSummary, Vec3, sleep, legacyText } = require('../harness/bots')
const { parseYaml, DEFAULT_ARENA } = require('../play/map')

// Dimension the arena world lives in for `execute in`: the main world ("bedwars") is the overworld, extra map worlds
// (rewi_mushroom, ...) are separate Bukkit worlds.
const ARENA_WORLD = (() => { try { return parseYaml(fs.readFileSync(DEFAULT_ARENA, 'utf8')).world } catch (e) { return 'bedwars' } })()
const DIM = !ARENA_WORLD || ARENA_WORLD === 'bedwars' ? 'minecraft:overworld' : `minecraft:${ARENA_WORLD}`

const T = n => MAP.teams[n]
const FLOOR_Y = MAP.walkY - 1
const sgn = Math.sign
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
/** axis-aligned unit direction (dominant axis) from a to b */
const dirTo = (a, b) => {
  const dx = b.x - a.x
  const dz = b.z - a.z
  return Math.abs(dx) >= Math.abs(dz) ? { x: sgn(dx), z: 0 } : { x: 0, z: sgn(dz) }
}
/** Minecraft yaw that looks along the unit direction d (0 = +z, 90 = -x) */
const yawFor = d => Math.round(Math.atan2(-d.x, d.z) * 180 / Math.PI)
const neg = d => ({ x: -d.x, z: -d.z })

// ------------------------------------------------------------------ helpers

/** Plain text of a text component (26.x NBT, JSON or a string). */
function flatten (json) {
  if (json == null) return ''
  REGISTRY = REGISTRY || require('prismarine-registry')('26.1')
  return legacyText(REGISTRY, json).replace(/§./g, '')
}
let REGISTRY = null

/** Records death/respawn timing and raw title packets on a bot. */
function track (bot) {
  bot.ev = []
  bot.titles = []
  const push = type => bot.ev.push({ t: Date.now(), type, hp: bot.health, mode: bot.game && bot.game.gameMode, pos: bot.entity && bot.entity.position.clone() })
  bot.on('death', () => push('death'))
  bot.on('spawn', () => push('spawn'))
  bot.on('respawn', () => push('respawn'))
  bot.on('forcedMove', () => push('forcedMove'))
  bot._client.on('title', p => bot.titles.push({ t: Date.now(), action: p.action, text: flatten(p.text) }))
  bot._client.on('set_title_text', p => bot.titles.push({ t: Date.now(), action: 0, text: flatten(p.text) }))
  bot._client.on('set_title_subtitle', p => bot.titles.push({ t: Date.now(), action: 1, text: flatten(p.text) }))
}

const chatSince = (bot, since, re) => bot.chatLog.filter(c => c.t >= since && re.test(c.m)).map(c => c.m)
const pos = bot => bot.entity.position
const fmt = p => `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`

async function blockIs (t, x, y, z, id) {
  const r = await t.server.cmd(`execute in ${DIM} if block ${x} ${y} ${z} ${id}`)
  if (/passed/i.test(r)) return true
  if (/failed/i.test(r)) return false
  return `?${r}`
}
const isAir = (t, x, y, z) => blockIs(t, x, y, z, 'minecraft:air')
const hasBed = (t, x, y, z) => blockIs(t, x, y, z, '#minecraft:beds')

async function tp (t, bot, x, y, z, yaw = 0, pitch = 0) {
  await t.server.cmd(`tp ${bot.username} ${x} ${y} ${z} ${yaw} ${pitch}`)
}
/** Teleports a bot to a team spawn (looking along dir) */
const tpSpawn = (t, bot, team, dir) => tp(t, bot, T(team).spawn.x, T(team).spawn.y, T(team).spawn.z, dir ? yawFor(dir) : T(team).spawn.yaw)

async function giveAndEquip (t, bot, id, count, itemName) {
  await t.server.cmd(`give ${bot.username} minecraft:${id} ${count}`)
  await waitFor(() => countItem(bot, itemName || id) > 0, { timeout: 5000, what: `${bot.username} to receive ${id}` })
  await bot.equip(bot.inventory.items().find(i => i.name === (itemName || id)), 'hand')
}

async function walkTo (bot, x, z, tol = 0.2, timeout = 4000) {
  await bot.lookAt(new Vec3(x, pos(bot).y + 1.62, z), true)
  bot.setControlState('forward', true)
  try {
    await waitFor(() => Math.hypot(pos(bot).x - x, pos(bot).z - z) < tol, { timeout, step: 15, what: 'walk target' })
  } finally {
    bot.setControlState('forward', false)
  }
}

/** Starts digging and waits `ms`; returns true when the client saw the block turn to air. Never throws. */
async function tryDig (bot, block, extra = 2500) {
  let done = false
  const wait = bot.digTime(block)
  bot.dig(block, true).then(() => { done = true }, () => {})
  await sleep(Math.min(wait, 20000) + extra)
  if (bot.targetDigBlock) bot.stopDigging()
  return done
}

/**
 * Starts digging and polls `doneFn` (an async server-side check) until it is true or `timeout` ms passed.
 * mineflayer's dig() never settles when the server rejects the break, so it is never awaited.
 * Returns { ok, ms }.
 */
async function digUntil (bot, block, doneFn, timeout = 6000) {
  const t0 = Date.now()
  bot.dig(block, true).catch(() => {})
  let ok = false
  while (Date.now() - t0 < timeout) {
    if ((await doneFn()) === true) { ok = true; break }
    await sleep(100)
  }
  if (bot.targetDigBlock) bot.stopDigging()
  return { ok, ms: Date.now() - t0 }
}

/** Authoritative server-side health / position of a player (RCON). */
async function srvHealth (t, bot) {
  const r = await t.server.cmd(`data get entity ${bot.username} Health`)
  const m = /entity data: (-?[\d.]+)f?/.exec(r)
  return m ? Number(m[1]) : NaN
}
async function srvPos (t, bot) {
  const r = await t.server.cmd(`data get entity ${bot.username} Pos`)
  const m = /\[(-?[\d.]+)d, (-?[\d.]+)d, (-?[\d.]+)d\]/.exec(r)
  return m ? { x: +m[1], y: +m[2], z: +m[3] } : null
}
const dist3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

async function hit (att, vic, n = 1, gap = 600, trailingWait = true) {
  for (let i = 0; i < n; i++) {
    const e = await waitFor(() => att.players[vic.username] && att.players[vic.username].entity, { timeout: 5000, what: `${att.username} to see ${vic.username}` }).catch(err => {
      const known = Object.fromEntries(Object.entries(att.players).map(([n, pl]) => [n, pl.entity ? fmt(pl.entity.position) : null]))
      throw new Error(`${err.message} (attacker at ${fmt(pos(att))}, victim client at ${fmt(pos(vic))}, attacker knows ${JSON.stringify(known)}, entities ${Object.values(att.entities).filter(x => x.type === 'player').map(x => x.username + '@' + fmt(x.position)).join(' ')})`)
    })
    await att.lookAt(e.position.offset(0, 1.2, 0), true)
    att.attack(e)
    if (trailingWait || i < n - 1) await sleep(gap)
  }
}

/** Teleports the victim just above the void-kill height and waits for the death event. */
async function voidDrop (t, vic, x, z) {
  const t0 = Date.now()
  const died = new Promise(resolve => vic.once('death', () => resolve({ ms: Date.now() - t0, y: pos(vic).y })))
  await tp(t, vic, x, MAP.voidY + 1, z)
  return Promise.race([died, sleep(8000).then(() => null)])
}

/** Both blocks of a team's bed (the arena file names one half), found through RCON. */
async function bedHalves (t, team) {
  const b = T(team).bed
  const out = []
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if ((await hasBed(t, b.x + dx, b.y, b.z + dz)) === true) out.push({ x: b.x + dx, y: b.y, z: b.z + dz })
  }
  return out
}

/** A free standing block next to the bed (air feet + head, solid below), closest to the team spawn. null if none (or chunk not loaded). */
async function bedStandSpot (t, halves, team) {
  const sp = T(team).spawn
  const cands = []
  for (const h of halves) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = { x: h.x + dx, y: h.y, z: h.z + dz }
      if (halves.some(o => o.x === c.x && o.z === c.z)) continue
      cands.push(c)
    }
  }
  cands.sort((a, b) => hd({ x: a.x + 0.5, z: a.z + 0.5 }, sp) - hd({ x: b.x + 0.5, z: b.z + 0.5 }, sp))
  for (const c of cands) {
    if ((await isAir(t, c.x, c.y, c.z)) === true && (await isAir(t, c.x, c.y + 1, c.z)) === true && (await isAir(t, c.x, c.y - 1, c.z)) === false) return c
  }
  return null
}

/** Puts a bot next to the bed of `team` (via that team's spawn so the chunks are loaded), looking at the bed. Returns the spot. */
async function goToBed (t, bot, team, halves) {
  await tpSpawn(t, bot, team)
  let spot = null
  const t0 = Date.now()
  while (!spot && Date.now() - t0 < 10000) {
    await sleep(600)
    spot = await bedStandSpot(t, halves, team)
  }
  if (!spot) throw new Error(`no stand spot next to the ${team} bed`)
  const h = halves[0]
  const d = dirTo({ x: spot.x, z: spot.z }, h)
  await tp(t, bot, spot.x + 0.5, spot.y, spot.z + 0.5, yawFor(d), 20)
  await sleep(500)
  await waitFor(() => bot.blockAt(new Vec3(h.x, h.y, h.z)) && bot.entity.onGround, { timeout: 8000, what: `${bot.username} to see the bed and stand` })
  return spot
}

// ------------------------------------------------------------------ spec

module.exports = {
  name: 'full-game',
  timeout: 295000,
  server: { pauseCountdown: 10 },

  async run (t) {
    const results = {}
    const phase = async (name, fn) => {
      t.log(`---- phase: ${name}`)
      try { await fn() } catch (e) {
        t.check(`phase "${name}" ran without an exception`, false, String(e.stack || e).split('\n').slice(0, 4).join(' | '))
      }
    }
    t.log(`map ${MAP.name}: teams ${MAP.teamNames.join('/')} walkY ${MAP.walkY} voidY ${MAP.voidY} lobby ${fmt(MAP.lobbySpawn)} spec ${fmt(MAP.specSpawn)}`)

    // ---------------------------------------------------------------- lobby + game start
    const bots = [await t.bot('FgA'), await t.bot('FgB'), await t.bot('FgC')]
    bots.forEach(track)
    t.check('3 clients (1.8.9) can join', bots.every(b => b.entity))

    const lobbyStart = Date.now()
    const teams = await Promise.all(bots.map(b => waitForGameStart(b)))
    const gameStartedAt = Date.now() - 500 // waitForGameStart sleeps 500 ms after the teleport
    const startedAfter = Date.now() - lobbyStart
    const [N0, N1] = MAP.teamNames
    const count = n => teams.filter(x => x === n).length
    const balanced = (count(N0) === 2 && count(N1) === 1) || (count(N0) === 1 && count(N1) === 2)
    t.check('game starts after the lobby countdown and teams are balanced 2:1', balanced, { teams, startedAfterMs: startedAfter })
    if (!balanced) return

    const T2 = count(N0) === 2 ? N0 : N1 // team of two (P1, P2)
    const T1 = T2 === N0 ? N1 : N0 // team of one (Q)
    const members = bots.filter((b, i) => teams[i] === T2)
    const P1 = members[0]
    const P2 = members[1]
    const Q = bots.find((b, i) => teams[i] === T1)
    const d2 = dirTo(T(T2).spawn, T(T1).spawn) // from T2's island towards the middle / the enemy
    const d1 = dirTo(T(T1).spawn, T(T2).spawn)
    t.log(`roles: P1=${P1.username} P2=${P2.username} (team ${T2}), Q=${Q.username} (team ${T1}); T2 faces ${JSON.stringify(d2)}`)
    await sleep(1500)

    t.check('all players are in survival mode at their team spawn',
      bots.every((b, i) => b.game.gameMode === 'survival' && hd(pos(b), T(teams[i]).spawn) < 3 && Math.abs(pos(b).y - T(teams[i]).spawn.y) < 1.5),
      bots.map((b, i) => `${b.username}:${b.game.gameMode}@${fmt(pos(b))}`))
    const halves = { [T1]: await bedHalves(t, T1), [T2]: await bedHalves(t, T2) }
    t.check('both beds exist at game start (2 blocks each, server)', halves[T1].length === 2 && halves[T2].length === 2, halves)
    if (halves[T1].length !== 2 || halves[T2].length !== 2) return

    // ---------------------------------------------------------------- building
    const bridge = []
    let buildSpot = null // { x, z }: the island block column used for place/break
    let edge = null // last solid block of the island row facing the middle
    await phase('building', async () => {
      await giveAndEquip(t, P1, 'red_sandstone', 64)
      await t.server.cmd(`give ${P1.username} minecraft:iron_pickaxe 1`)
      await waitFor(() => countItem(P1, 'iron_pickaxe') > 0, { timeout: 5000 })

      // a free column next to the spawn: solid floor, two blocks of air above, away from spawners / shops
      const sp = T(T2).spawn
      const cands = []
      for (let dx = -5; dx <= 5; dx++) {
        for (let dz = -5; dz <= 5; dz++) {
          const x = Math.floor(sp.x) + dx
          const z = Math.floor(sp.z) + dz
          const c = { x: x + 0.5, z: z + 0.5 }
          if (hd(c, sp) < 2.5 || hd(c, sp) > 5) continue
          if (MAP.spawners.some(s => hd(c, s) < 2.5) || MAP.stores.some(s => hd(c, s) < 2.5)) continue
          const fl = P1.blockAt(new Vec3(x, FLOOR_Y, z))
          const f = P1.blockAt(new Vec3(x, MAP.walkY, z))
          const h = P1.blockAt(new Vec3(x, MAP.walkY + 1, z))
          if (fl && fl.name !== 'air' && f && f.name === 'air' && h && h.name === 'air') cands.push({ x, z, d: hd(c, sp) })
        }
      }
      cands.sort((a, b) => a.d - b.d)
      buildSpot = cands[0]
      t.check('a free build spot with solid floor exists next to the spawn', !!buildSpot, { candidates: cands.length, spot: buildSpot })
      if (!buildSpot) return
      const target = new Vec3(buildSpot.x, MAP.walkY, buildSpot.z)
      const floorPos = new Vec3(buildSpot.x, FLOOR_Y, buildSpot.z)
      const floorName = P1.blockAt(floorPos).name

      // place on the island
      let placeErr = null
      await P1.placeBlock(P1.blockAt(floorPos), new Vec3(0, 1, 0)).catch(e => { placeErr = e.message })
      await sleep(300)
      results.placedServer = await blockIs(t, target.x, target.y, target.z, 'minecraft:red_sandstone')
      t.check('a player can place a block on the island (server confirms red_sandstone)',
        results.placedServer === true && !placeErr, { placeErr, at: String(target), blockClient: P1.blockAt(target) && P1.blockAt(target).name })

      // break the player-placed block with a pickaxe
      await P1.equip(P1.inventory.items().find(i => i.name === 'iron_pickaxe'), 'hand')
      const dugBlock = await digUntil(P1, P1.blockAt(target), () => isAir(t, target.x, target.y, target.z), 5000)
      const gone = await isAir(t, target.x, target.y, target.z)
      t.check('a player-placed block can be broken (server confirms air)', gone === true, { ms: dugBlock.ms })

      // map blocks must stay
      // control: the floor block must be within normal survival reach, otherwise a "rejected" break proves nothing
      const eye = pos(P1).offset(0, 1.62, 0)
      const floorReach = eye.distanceTo(new Vec3(floorPos.x + 0.5, floorPos.y + 0.5, floorPos.z + 0.5))
      const clientBroke = await tryDig(P1, P1.blockAt(floorPos))
      await sleep(400)
      const still = await isAir(t, floorPos.x, floorPos.y, floorPos.z)
      t.check('map blocks (island floor) can NOT be broken (block in reach, same pickaxe that broke the player block)', still === false && floorReach < 4.5 && floorName !== 'air',
        { block: floorName, clientSawBreak: clientBroke, serverAir: still, reach: +floorReach.toFixed(2) })
      const afterClient = P1.blockAt(floorPos)
      t.check('client is re-synced after the rejected break (block back on the client)', afterClient && afterClient.name === floorName, { before: floorName, after: afterClient && afterClient.name })

      // bridge over the void towards the middle: starting at the last solid block of the island row
      let k0 = 0
      for (; k0 < 90; k0++) {
        const b = P1.blockAt(new Vec3(Math.floor(sp.x) + d2.x * k0, FLOOR_Y, Math.floor(sp.z) + d2.z * k0))
        if (!b || b.name === 'air') break
      }
      edge = { x: Math.floor(sp.x) + d2.x * (k0 - 1), z: Math.floor(sp.z) + d2.z * (k0 - 1) }
      t.log(`island row ends after ${k0} blocks, edge block ${edge.x},${FLOOR_Y},${edge.z}`)
      await tp(t, P1, edge.x + 0.5, MAP.walkY, edge.z + 0.5, yawFor(d2))
      await sleep(600)
      await P1.equip(P1.inventory.items().find(i => i.name === 'red_sandstone'), 'hand')
      const N = 8
      let placedOk = 0
      let missingAt = null
      const t1 = Date.now()
      for (let k = 1; k <= N; k++) {
        const refBlock = P1.blockAt(new Vec3(edge.x + d2.x * (k - 1), FLOOR_Y, edge.z + d2.z * (k - 1)))
        const bx = edge.x + d2.x * k
        const bz = edge.z + d2.z * k
        try {
          await P1.placeBlock(refBlock, new Vec3(d2.x, 0, d2.z))
        } catch (err) {
          t.log(`bridge placement ${k} failed: ${err.message}`)
          break
        }
        // the server must really have the block before the bot walks on it (otherwise it falls into the void)
        let ok = false
        for (let i = 0; i < 20 && !ok; i++) {
          ok = (await blockIs(t, bx, FLOOR_Y, bz, 'minecraft:red_sandstone')) === true
          if (!ok) await sleep(100)
        }
        if (!ok) { missingAt = k; t.log(`bridge block ${k} (${bx},${FLOOR_Y},${bz}) not on the server 2 s after placing`); break }
        bridge.push(new Vec3(bx, FLOOR_Y, bz))
        placedOk++
        await walkTo(P1, bx + 0.5, bz + 0.5, 0.2, 6000)
      }
      await sleep(500)
      const along = (pos(P1).x - (edge.x + 0.5)) * d2.x + (pos(P1).z - (edge.z + 0.5)) * d2.z
      t.check('a player can bridge over the void (8 blocks placed, bot stands on the bridge)',
        placedOk === N && along >= N - 2 && pos(P1).y > FLOOR_Y + 0.5 && P1.entity.onGround,
        { placedOk, missingAt, along: +along.toFixed(1), pos: fmt(pos(P1)), onGround: P1.entity.onGround, ms: Date.now() - t1 })
      let serverBridge = 0
      for (const b of bridge) if ((await blockIs(t, b.x, b.y, b.z, 'minecraft:red_sandstone')) === true) serverBridge++
      t.check('every bridge block exists on the server', serverBridge === N, { serverBridge })
    })

    // ---------------------------------------------------------------- game bossbar
    await phase('bossbar', async () => {
      const text = b => (typeof b.title === 'string' ? b.title : (b.title && b.title.toString ? b.title.toString() : JSON.stringify(b.title)))
      const bar = () => P1.bossBars.find(b => /Game in progress/.test(text(b)))
      await waitFor(() => bar(), { timeout: 5000, what: 'game bossbar' }).catch(() => {})
      const h1 = bar() && bar().health
      await sleep(3200)
      const h2 = bar() && bar().health
      t.check('the game bossbar runs down with the game time (text stays, bar shrinks)',
        !!bar() && h1 > 0.5 && h1 < 1 && h2 < h1, { bars: P1.bossBars.map(b => [text(b), b.health]), h1, h2 })
    })

    // ---------------------------------------------------------------- own bed
    await phase('own bed', async () => {
      await goToBed(t, P1, T2, halves[T2])
      const msgStart = Date.now()
      const h = halves[T2][0]
      const bed = P1.blockAt(new Vec3(h.x, h.y, h.z))
      t.check('own bed block is a bed before the attempt (client)', bed && /bed/.test(bed.name), bed && bed.name)
      await tryDig(P1, bed, 2500)
      await sleep(500)
      const left = []
      for (const b of halves[T2]) left.push(await hasBed(t, b.x, b.y, b.z))
      t.check('a player can NOT break their own bed', left.every(v => v === true), { left })
      t.check('no bed-destroyed message after the failed attempt on the own bed',
        chatSince(Q, msgStart, /bed of team .* was destroyed/).length === 0)
    })

    // ---------------------------------------------------------------- void kill with credit, respawn, protection
    await phase('void kill + respawn', async () => {
      const sp = T(T2).spawn
      const voidX = edge ? edge.x + 0.5 + d2.x * 20 : sp.x + d2.x * 25
      const voidZ = edge ? edge.z + 0.5 + d2.z * 20 : sp.z + d2.z * 25
      await tpSpawn(t, P1, T2, d2)
      await tp(t, Q, sp.x + d2.x * 1.5, sp.y, sp.z + d2.z * 1.5, yawFor(neg(d2)))
      await sleep(1200)
      const hp0 = await srvHealth(t, P1)
      await hit(Q, P1, 2, 650, false)
      await sleep(150)
      const hp1 = await srvHealth(t, P1)
      t.check('a hit by an enemy damages the victim (server-side health)', hp0 === 20 && hp1 < hp0 && hp1 > 0, { before: hp0, after: hp1, client: P1.health })

      const t0 = Date.now()
      const died = await voidDrop(t, P1, voidX, voidZ)
      t.check('void death is instant (dies right after dropping below the void-kill height)',
        !!died && died.ms < 1500 && died.y > MAP.voidY - 6 && died.y < MAP.voidY + 0.5, { ...died, voidY: MAP.voidY })
      await sleep(400)
      const killMsg = chatSince(Q, t0, new RegExp(`${P1.username} was killed by ${Q.username}! \\(❤ [\\d.]+\\)`))
      const selfMsg = chatSince(Q, t0, new RegExp(`${P1.username}.*died`))
      t.check('void death credits the last attacker (kill message names the attacker)', killMsg.length > 0 && selfMsg.length === 0, { killMsg, selfMsg })

      // respawn
      const deathEv = P1.ev.filter(e => e.type === 'death').pop()
      const spawnEv = await waitFor(() => P1.ev.find(e => e.type === 'spawn' && deathEv && e.t > deathEv.t), { timeout: 6000, what: 'P1 to respawn' }).catch(() => null)
      const respawnMs = spawnEv && deathEv ? spawnEv.t - deathEv.t : null
      t.check('a player with a bed respawns instantly (no respawn cooldown)', respawnMs != null && respawnMs < 1500, { respawnMs })
      const respawnedAt = spawnEv && Date.now()
      await sleep(250)
      t.check('respawn is at the team spawn in survival mode',
        P1.game.gameMode === 'survival' && hd(pos(P1), sp) < 2 && Math.abs(pos(P1).y - sp.y) < 1.5,
        { pos: fmt(pos(P1)), mode: P1.game.gameMode, spawn: fmt(sp) })

      // respawn protection: attacks right after the respawn do no damage
      const protStart = respawnedAt || Date.now()
      const hpBefore = await srvHealth(t, P1)
      // control: the attacker really is in melee range on the server, so the hits below would land without protection
      const pA = await srvPos(t, P1)
      const pB = await srvPos(t, Q)
      const inRange = !!pA && !!pB && dist3(pA, pB) < 3
      // keep hitting until shortly before the end (0.6 s after the "in 1" message, i.e. ~0.4 s before it ends)
      let protHits = 0
      const protLimit = Date.now() + 5000
      while (Date.now() < protLimit) {
        const one = P1.chatLog.find(c => c.t >= protStart - 500 && /Respawn protection ends in 1s/.test(c.m))
        if (protHits >= 2 && one && Date.now() - one.t > 600) break
        if (P1.chatLog.some(c => c.t >= protStart - 500 && /Respawn protection is over/.test(c.m))) break
        await hit(Q, P1, 1, 450)
        protHits++
      }
      const protSpanHit = Date.now() - protStart
      const hpProt = await srvHealth(t, P1)
      t.check('respawn protection blocks damage right after respawning (server health, attacker in range)',
        inRange && hpBefore === 20 && hpProt === 20 && protHits >= 4 && protSpanHit >= 2000, { hpBefore, hpProt, protHits, hitWindowMs: protSpanHit, inRange, dist: pA && pB ? +dist3(pA, pB).toFixed(2) : null, sinceRespawnMs: Date.now() - protStart })
      const protEnd = await waitFor(() => chatSince(P1, protStart - 500, /Respawn protection is over/).length > 0, { timeout: 7000, what: 'respawn protection end message' }).then(() => true, () => false)
      const protMsgs = P1.chatLog.filter(c => c.t >= protStart - 500 && /Respawn protection/.test(c.m))
      const firstMsg = protMsgs[0]
      const lastMsg = protMsgs[protMsgs.length - 1]
      const protSpan = firstMsg && lastMsg ? lastMsg.t - firstMsg.t : null
      t.check('respawn protection counts 3, 2, 1 and ends after about 3 s',
        protEnd && /in 3/.test(protMsgs[0].m) && protMsgs.some(c => /in 2/.test(c.m)) && protMsgs.some(c => /in 1/.test(c.m)) &&
        /is over/.test(lastMsg.m) && protSpan >= 1800 && protSpan <= 3500, { protSpan, msgs: protMsgs.map(c => c.m) })
      if (!protEnd) await sleep(3000)
      // hit every ~700 ms until damage lands (up to 5 hits); records how long after the "is over" message the first hit worked
      const endAt = (protMsgs.find(c => /is over/.test(c.m)) || { t: Date.now() }).t
      const hpAfterProt = await srvHealth(t, P1)
      const attempts = []
      let hpHit = hpAfterProt
      for (let i = 0; i < 5 && !(hpHit < hpAfterProt); i++) {
        await hit(Q, P1, 1, 700, false)
        await sleep(150)
        hpHit = await srvHealth(t, P1)
        const a = await srvPos(t, P1)
        const b = await srvPos(t, Q)
        attempts.push({ afterEndMs: Date.now() - endAt, hp: hpHit, dist: a && b ? +dist3(a, b).toFixed(2) : null })
      }
      const firstDmg = attempts.find(a => a.hp < hpAfterProt)
      t.check('after the protection ended the player takes damage again (within 1.5 s of the "is over" message)',
        hpAfterProt === 20 && hpHit < hpAfterProt && hpHit > 0 && !!firstDmg && firstDmg.afterEndMs <= 1500, { before: hpAfterProt, after: hpHit, attempts })
    })

    // ---------------------------------------------------------------- bed destruction
    await phase('destroy enemy bed', async () => {
      await goToBed(t, P1, T1, halves[T1])
      const t0 = Date.now()
      const h = halves[T1][0]
      const bed = P1.blockAt(new Vec3(h.x, h.y, h.z))
      t.check('enemy bed is a bed block before the attack (client)', bed && /bed/.test(bed.name), bed && bed.name)
      // P1 lost the pickaxe when dying earlier: make sure it holds one
      if (countItem(P1, 'iron_pickaxe') === 0) {
        await t.server.cmd(`give ${P1.username} minecraft:iron_pickaxe 1`)
        await waitFor(() => countItem(P1, 'iron_pickaxe') > 0, { timeout: 5000, what: 'pickaxe' })
      }
      await P1.equip(P1.inventory.items().find(i => i.name === 'iron_pickaxe'), 'hand')
      const dug = await digUntil(P1, bed, () => isAir(t, h.x, h.y, h.z), 6000)
      await sleep(300)
      const gone = []
      for (const b of halves[T1]) gone.push(await isAir(t, b.x, b.y, b.z))
      t.check('the enemy bed can be broken with a pickaxe (both halves gone)', gone.length === 2 && gone.every(v => v === true), { gone, ms: dug.ms, held: P1.heldItem && P1.heldItem.name })
      const msgs = chatSince(P1, t0, /bed of team .* was destroyed/)
      t.check('everybody gets the bed-destroyed chat message naming the team',
        msgs.length > 0 && bots.every(b => chatSince(b, t0, new RegExp(`bed of team ${T1}.* was destroyed`)).length > 0), msgs)
      await sleep(600)
      const victimTitles = Q.titles.filter(x => x.t >= t0).map(x => x.text)
      const otherTitles = P2.titles.filter(x => x.t >= t0).map(x => x.text)
      const bedTitle = new RegExp(`The bed of team ${T1} was destroyed`)
      t.check('the victim team gets the bed-destroyed title naming its team', victimTitles.some(x => bedTitle.test(x)), victimTitles)
      t.check('other players get the bed-destroyed title naming the victim team', otherTitles.some(x => bedTitle.test(x)), otherTitles)
      t.check('the victim team gets its own subtitle (not the one for the other players)',
        victimTitles.some(x => /You will no longer respawn/.test(x)) && !victimTitles.some(x => /can no longer respawn/.test(x)), victimTitles)
      t.check('other players get the "cannot respawn anymore" subtitle (not the victim one)',
        otherTitles.some(x => /can no longer respawn/.test(x)) && !otherTitles.some(x => /You will no longer respawn/.test(x)), otherTitles)
    })

    // Q destroys the bed of P1/P2's team too, so the next death of either is final
    await phase('destroy other bed', async () => {
      await goToBed(t, Q, T2, halves[T2])
      const t0 = Date.now()
      const h = halves[T2][0]
      const bed = Q.blockAt(new Vec3(h.x, h.y, h.z))
      const dug = await digUntil(Q, bed, () => isAir(t, h.x, h.y, h.z), 6000)
      await sleep(300)
      const gone = []
      for (const b of halves[T2]) gone.push(await isAir(t, b.x, b.y, b.z))
      t.check('the second team bed is destroyed by the other bot (both halves)', gone.length === 2 && gone.every(v => v === true), { gone, ms: dug.ms })
      t.check('bed-destroyed message for the second team', chatSince(P2, t0, new RegExp(`bed of team ${T2}.* was destroyed`)).length > 0)
    })

    // ---------------------------------------------------------------- final kill -> spectator
    await phase('final kill', async () => {
      const sp = T(T2).spawn
      const voidX = edge ? edge.x + 0.5 + d2.x * 20 : sp.x + d2.x * 25
      const voidZ = edge ? edge.z + 0.5 + d2.z * 20 : sp.z + d2.z * 25
      await tpSpawn(t, P2, T2, d2)
      await tp(t, Q, sp.x + d2.x * 1.5, sp.y, sp.z + d2.z * 1.5, yawFor(neg(d2)))
      await sleep(1500)
      await hit(Q, P2, 2, 650, false)
      const t0 = Date.now()
      const died = await voidDrop(t, P2, voidX, voidZ)
      t.check('a player without a bed dies in the void', !!died, died)
      await sleep(1800)
      const killMsg = chatSince(Q, t0, new RegExp(`${P2.username} was killed by ${Q.username}! \\(❤ [\\d.]+\\)`))
      t.check('the final kill is credited to the attacker', killMsg.length > 0, killMsg)
      t.check('after the final death the player is a spectator (not respawned on the island)',
        P2.game.gameMode === 'spectator' && hd(pos(P2), sp) > 20,
        { mode: P2.game.gameMode, pos: fmt(pos(P2)) })
      // mineflayer applies gravity to spectators (no noclip), so look at where the server put the player
      const deathT = P2.ev.filter(e => e.type === 'death').pop().t
      const tpEv = P2.ev.filter(e => e.type === 'forcedMove' && e.t >= deathT)
      t.check('the spectator is teleported to the spectator spawn (server teleport after the final death)',
        tpEv.some(e => hd(e.pos, MAP.specSpawn) < 2 && Math.abs(e.pos.y - MAP.specSpawn.y) < 2),
        tpEv.map(e => fmt(e.pos)))
      const gm = await t.server.cmd(`data get entity ${P2.username} playerGameType`)
      t.check('the server has the final-kill victim in spectator mode (gamemode 3)', /: 3\b/.test(gm), gm)
      t.check('the game goes on while two teams are alive (no win/game-over message yet, others still alive in survival)',
        bots.every(b => chatSince(b, t0, /won the game in |Game over/).length === 0) &&
        [P1, Q].every(b => b.game.gameMode === 'survival' && b.isAlive))
      const b = MAP.bounds
      const inArena = p => p.x >= b.min[0] && p.x <= b.max[0] && p.z >= b.min[2] && p.z <= b.max[2] && p.y >= MAP.voidY
      results.gameStillRunning = inArena(pos(Q)) && inArena(pos(P1))
      t.check('the other players stay in the arena', results.gameStillRunning, { Q: fmt(pos(Q)), P1: fmt(pos(P1)) })
    })

    // ---------------------------------------------------------------- last kill -> win
    let winStart = 0
    await phase('win', async () => {
      const sp = T(T2).spawn
      const voidX = edge ? edge.x + 0.5 + d2.x * 20 : sp.x + d2.x * 25
      const voidZ = edge ? edge.z + 0.5 + d2.z * 20 : sp.z + d2.z * 25
      winStart = Date.now()
      // leftover item that the next round must not contain (P1 survives to the end)
      await t.server.cmd(`give ${P1.username} minecraft:red_sandstone 16`)
      await waitFor(() => countItem(P1, 'red_sandstone') > 0, { timeout: 5000, what: 'leftover sandstone' })
      results.leftoverGiven = countItem(P1, 'red_sandstone')
      await tpSpawn(t, P1, T2, d2)
      await tp(t, Q, sp.x + d2.x * 1.5, sp.y, sp.z + d2.z * 1.5, yawFor(neg(d2)))
      await sleep(1500)
      await hit(P1, Q, 2, 650, false)
      const died = await voidDrop(t, Q, voidX, voidZ)
      t.check('the last enemy dies in the void', !!died, died)
      await waitFor(() => chatSince(P1, winStart, /won the game/).length > 0, { timeout: 8000, what: 'win message' }).catch(() => {})
      await sleep(600)
      const winMsg = chatSince(P1, winStart, /won the game in /)
      t.check('the winner message is broadcast and names the winning team', winMsg.length > 0 && winMsg[0].includes(`Team ${T2} `), winMsg)
      const m = winMsg[0] && /in (\d+):(\d+)/.exec(winMsg[0])
      const reported = m ? Number(m[1]) * 60 + Number(m[2]) : null
      const real = (Date.now() - gameStartedAt) / 1000
      t.check('the reported game time matches the real game duration (+-5 s)', reported != null && Math.abs(reported - real) <= 5, { reported, realSec: +real.toFixed(1) })
      const p1Titles = P1.titles.filter(x => x.t >= winStart).map(x => x.text)
      const qTitles = Q.titles.filter(x => x.t >= winStart).map(x => x.text)
      t.check('winners get the win title (and not the lost title)', p1Titles.some(x => /Your team won/.test(x)) && !p1Titles.some(x => /Your team lost/.test(x)), p1Titles)
      t.check('losers get the lost title (and not the win title)', qTitles.some(x => /Your team lost/.test(x)) && !qTitles.some(x => /Your team won/.test(x)), qTitles)
    })

    // ---------------------------------------------------------------- end, rebuild, back to lobby
    await phase('game end -> lobby', async () => {
      const L = MAP.lobbySpawn
      const inLobby = b => hd(pos(b), L) < 30 && Math.abs(pos(b).y - L.y) < 25
      const t0 = Date.now()
      const ok = await waitFor(() => bots.every(inLobby), { timeout: 40000, what: 'all players back in the lobby' }).then(() => true, () => false)
      t.check('all players are put back into the lobby after the game', ok, { ms: Date.now() - t0, lobby: fmt(L), pos: bots.map(b => `${b.username}@${fmt(pos(b))}`) })
      t.check('the game-over message is shown', bots.some(b => chatSince(b, winStart, /Game over/).length > 0), bots.map(b => chatSince(b, winStart, /Game over|being reset/)))
      await sleep(1500)
      t.check('back in the lobby everybody is in survival or adventure mode (nobody spectator/creative)', bots.every(b => ['survival', 'adventure'].includes(b.game.gameMode)), bots.map(b => b.game.gameMode))
    })

    // ---------------------------------------------------------------- arena reset (server side)
    await phase('arena rebuild', async () => {
      // The arena chunks may be unloaded while everybody is in the lobby: force-load them for the check (and unload again),
      // then wait up to 15 s for the rebuild to be complete.
      const spots = [...halves[T1], ...halves[T2], ...bridge]
      const chunks = new Set(spots.map(b => `${b.x},${b.z}`))
      for (const c of chunks) { const [x, z] = c.split(',').map(Number); await t.server.cmd(`execute in ${DIM} run forceload add ${x} ${z}`) }
      const snapshot = async () => {
        const checks = {}
        for (const n of [T1, T2]) for (const b of halves[n]) checks[`${n}@${b.x},${b.y},${b.z}`] = await hasBed(t, b.x, b.y, b.z)
        let leftover = 0
        let unknown = 0
        for (const b of bridge) {
          const r = await isAir(t, b.x, b.y, b.z)
          if (r === false) leftover++
          else if (r !== true) unknown++
        }
        const unknownBeds = Object.values(checks).filter(v => v !== true && v !== false).length
        return { checks, leftover, unknown, unknownBeds, ok: Object.values(checks).every(v => v === true) && leftover === 0 && unknown === 0 }
      }
      const t0 = Date.now()
      let snap = await snapshot()
      while (!snap.ok && Date.now() - t0 < 15000) { await sleep(500); snap = await snapshot() }
      await t.server.cmd(`execute in ${DIM} run forceload remove all`)
      results.rebuild = snap
      t.check('both beds are restored after the game (all 4 halves)', Object.values(snap.checks).length === 4 && Object.values(snap.checks).every(v => v === true), { ...snap.checks, waitedMs: Date.now() - t0 })
      t.check('player-placed bridge blocks are removed by the rebuild', bridge.length > 0 && snap.leftover === 0 && snap.unknown === 0, { bridge: bridge.length, leftover: snap.leftover, unknown: snap.unknown })
    })

    // ---------------------------------------------------------------- round 2
    await phase('round 2', async () => {
      const t0 = Date.now()
      const teams2 = await Promise.all(bots.map(b => waitForGameStart(b, 90000)))
      t.check('a second round starts automatically with the same three players', teams2.length === 3 && teams2.every(x => MAP.teamNames.includes(x)), { teams2, ms: Date.now() - t0 })
      await sleep(2000)
      const c2 = n => teams2.filter(x => x === n).length
      t.check('round 2 teams are balanced again', (c2(N0) === 2 && c2(N1) === 1) || (c2(N0) === 1 && c2(N1) === 2), teams2)
      t.check('round 2: everybody is in survival mode on their island',
        bots.every((b, i) => b.game.gameMode === 'survival' && hd(pos(b), T(teams2[i]).spawn) < 3), bots.map(b => `${b.username}:${b.game.gameMode}@${fmt(pos(b))}`))
      // dead player of round 1 starts fresh
      t.check('round 2: the former spectator is alive with full health', P2.health >= 20 && P2.isAlive, { hp: P2.health })
      t.check('round 2: inventories were reset (no sandstone/pickaxe left over, P1 had sandstone and a pickaxe at the end of round 1)',
        results.leftoverGiven > 0 && bots.every(b => countItem(b, 'red_sandstone') === 0 && countItem(b, 'iron_pickaxe') === 0), bots.map(b => `${b.username}: ${invSummary(b)}`))
      // each client sees the bed of its own island (the other one is out of view distance); the server checks all four halves
      const bedsClient = bots.map((b, i) => {
        const h = bedPos(teams2[i])
        const blk = b.blockAt(new Vec3(h.x, h.y, h.z))
        return blk && blk.name
      })
      const bedsServer = []
      for (const n of [T1, T2]) for (const b of halves[n]) bedsServer.push(await hasBed(t, b.x, b.y, b.z))
      t.check('round 2: both beds exist again (server, all 4 halves)', bedsServer.length === 4 && bedsServer.every(v => v === true), { bedsServer })
      t.check('round 2: the beds also exist on the client (own island)', bedsClient.every(n => n && /bed/.test(n)), bedsClient)
      let leftover = 0
      for (const b of bridge) if ((await isAir(t, b.x, b.y, b.z)) !== true) leftover++
      t.check('round 2: no player-placed bridge block survived (server)', bridge.length > 0 && leftover === 0, { bridge: bridge.length, leftover })
      // the map itself must be unchanged
      if (buildSpot) t.check('round 2: the map floor is intact', (await isAir(t, buildSpot.x, FLOOR_Y, buildSpot.z)) === false)
    })

    // packetevents (inside OldCombatMechanics) queries the GitHub API at startup; offline or rate-limited
    // (HTTP 403) it logs a harmless stack trace that has nothing to do with the game.
    const errs = t.server.errors().filter(l => !/packetevents.*(github|403|version)|api\.github\.com|Failed to parse packetevents version/.test(l))
    t.check('no server exceptions during the whole game', errs.length === 0, errs.slice(0, 5))
  }
}

function bedPos (team) { return T(team).bed }
