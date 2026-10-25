// Special items: Teleporter, Parachute (+ the Rewinside combo), Mobile Shop, Rescue Platform, TNT, Ender Pearl, Team Chest,
// and that none of them work in the lobby or for non-playing spectators. One game, five bots (the last one joins late as spectator).
//
//   ItemA  economy / shop bot: collects one Bronze/Iron/Gold from the spawners, buys every special in the real shop
//   ItemB, ItemC, ItemD  rocket/parachute test pilot (B), bow shooter (an enemy of B), enemy for TNT / chest
//   ItemE  late joiner = spectator
//
// Map-data-driven: no coordinate of the map is hardcoded. Everything comes from the arena file through tests/harness/bots.js (MAP, which
// uses tests/play/map.js): team spawns, spawners, shops, lobby / spectator spawn, walk level and void-kill height. Test spots are
// derived from the team spawn in a local frame (u = towards the other team, v = sideways, snapped to the map axes) and verified at runtime
// (solid floor, open sky, void) before they are used.
//
// ONLY=lobby,rocket,... limits the scenarios while developing (always runs the setup).
const { MAP, Vec3, waitFor, waitForGameStart, teamOf, countItem, invSummary, itemName, sleep } = require('../harness/bots')

const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null
const want = name => !ONLY || ONLY.includes(name)
// special item settings as shipped (config/bedwars.yml)
const CFG = require('yaml').parse(require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'config', 'bedwars.yml'), 'utf8'))
const CHUTE = { speed: Number(CFG.parachute['horizontal-speed']), sink: Number(CFG.parachute['fall-speed']), seconds: Number(CFG.parachute['duration-seconds']) }

// ------------------------------------------------------------------ small helpers

/** Like waitFor, but fn may be async. */
async function poll (fn, { timeout = 10000, step = 100, what = 'condition' } = {}) {
  const t0 = Date.now()
  for (;;) {
    let v
    try { v = await fn() } catch (e) { v = undefined }
    if (v) return v
    if (Date.now() - t0 > timeout) throw new Error(`timed out after ${timeout} ms waiting for ${what}`)
    await sleep(step)
  }
}

const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
const r1 = v => Math.round(v * 10) / 10
const r2 = v => Math.round(v * 100) / 100
const unit = (a, b) => { const dx = b.x - a.x; const dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; return { x: dx / l, z: dz / l } }
const snapAxis = u => (Math.abs(u.x) >= Math.abs(u.z) ? { x: Math.sign(u.x), z: 0 } : { x: 0, z: Math.sign(u.z) })

/** Records the client side position of a bot on every physics tick (20 per second). */
function recorder (bot) {
  const samples = []
  const forced = []
  const onTick = () => {
    const p = bot.entity.position
    samples.push({ t: Date.now(), x: p.x, y: p.y, z: p.z, vy: bot.entity.velocity.y })
  }
  const onForced = () => {
    const p = bot.entity.position
    forced.push({ t: Date.now(), x: p.x, y: p.y, z: p.z })
  }
  bot.on('physicsTick', onTick)
  bot.on('forcedMove', onForced)
  return {
    samples,
    forced,
    stop () { bot.off('physicsTick', onTick); bot.off('forcedMove', onForced) },
    /** Compact trajectory string: one entry every `every` ms, relative to t0. */
    traj (t0, every = 500, from = 0, to = 1e9) {
      const out = []
      let next = t0 + from
      for (const s of samples) {
        if (s.t < next || s.t > t0 + to) continue
        out.push(`${r1((s.t - t0) / 1000)}s:y${r1(s.y)}/x${r1(s.x)}/z${r1(s.z)}`)
        next = s.t + every
      }
      return out.join(' ')
    }
  }
}

function chatSince (bot, t0, re) {
  return bot.chatLog.filter(c => c.t >= t0 && re.test(c.m)).map(c => c.m)
}

async function rightClick (bot) {
  bot.activateItem()
  await sleep(150)
  bot.deactivateItem()
}

async function hold (bot, name) {
  const item = bot.inventory.items().find(i => i.name === name)
  if (!item) throw new Error(`${bot.username} has no ${name}: ${invSummary(bot)}`)
  if (item.slot >= 36 && item.slot <= 44) bot.setQuickBarSlot(item.slot - 36)
  else await bot.equip(item, 'hand')
  await sleep(200)
  return item
}

async function look (bot, x, y, z) {
  await bot.lookAt(new Vec3(x, y, z), true)
}

/** Teleports a bot by console and waits until the client agrees on x/z. */
async function tp (t, bot, x, y, z) {
  await t.server.cmd(`tp ${bot.username} ${x} ${y} ${z}`)
  await waitFor(() => dist2(bot.entity.position, { x, z }) < 1.5 && Math.abs(bot.entity.position.y - y) < 8,
    { timeout: 8000, what: `${bot.username} to arrive at ${x} ${y} ${z}` })
  await sleep(150)
}

async function count (t, selector) {
  const r = await t.server.cmd(`execute if entity ${selector}`)
  const m = /count: (\d+)/.exec(r)
  if (m) return Number(m[1])
  return /passed/i.test(r) ? 1 : 0
}

/** Number of entities matching selector within d blocks of the bot (server side). */
async function countNear (t, bot, type, d = 6) {
  const r = await t.server.cmd(`execute at ${bot.username} if entity @e[type=${type},distance=..${d}]`)
  const m = /count: (\d+)/.exec(r)
  if (m) return Number(m[1])
  return /passed/i.test(r) ? 1 : 0
}

async function health (t, bot) {
  const r = await t.server.cmd(`data get entity ${bot.username} Health`)
  const m = /([\d.]+)f/.exec(r)
  return m ? Number(m[1]) : NaN
}

async function serverPos (t, bot) {
  const r = await t.server.cmd(`data get entity ${bot.username} Pos`)
  const m = /\[([-\d.]+)d, ([-\d.]+)d, ([-\d.]+)d\]/.exec(r)
  return m ? { x: Number(m[1]), y: Number(m[2]), z: Number(m[3]) } : null
}

async function give (t, bot, id, n = 1) {
  const have = countItem(bot, mcToMf(id))
  await t.server.cmd(`give ${bot.username} minecraft:${id} ${n}`)
  await waitFor(() => countItem(bot, mcToMf(id)) >= have + n, { timeout: 5000, what: `${n}x ${id} for ${bot.username}` })
}

// item ids as the client names them (26.x: the same as the server's)
function mcToMf (id) { return id }

/** Items a dead parachute chicken would leave behind (the spawners drop resources all the time, so a plain item count is useless). */
async function chickenDrops (t) {
  let n = 0
  for (const id of ['feather', 'chicken', 'cooked_chicken', 'egg']) n += await count(t, `@e[type=item,nbt={Item:{id:"minecraft:${id}"}}]`)
  return n
}

const solid = blk => !!blk && blk.name !== 'air' && blk.boundingBox === 'block'

// ------------------------------------------------------------------ map geometry (all derived from the arena file)

const WALK_Y = MAP.walkY // players stand here, the floor blocks are at WALK_Y - 1
const TEAMS = MAP.teamNames
const CENTRE = (() => { // the neutral middle (gold spawners), or the middle of the two team spawns
  const g = MAP.spawnerCentroid('gold')
  if (g) return { x: g.x, z: g.z }
  const s = TEAMS.map(n => MAP.teams[n].spawn)
  return { x: (s[0].x + s[1].x) / 2, z: (s[0].z + s[1].z) / 2 }
})()

/** Local frame of a team: u points to the other team, v is sideways. cell(du, dv) = block column + standing position. */
function frame (team) {
  const own = MAP.teams[team].spawn
  const foe = MAP.teams[MAP.other(team)].spawn
  const u = snapAxis(unit(own, foe))
  const v = { x: -u.z + 0, z: u.x + 0 }
  const cell = (du, dv) => {
    const bx = Math.floor(own.x + u.x * du + v.x * dv)
    const bz = Math.floor(own.z + u.z * du + v.z * dv)
    return { bx, bz, x: bx + 0.5, z: bz + 0.5 }
  }
  return { team, home: { x: own.x, y: own.y, z: own.z }, foe, u, v, cell, toCentre: unit(own, CENTRE) }
}

function spawnerPos (type, team) {
  const list = MAP.spawners.filter(s => s.type === type && (team === undefined || s.team === team))
  return list[0]
}

async function waitRespawn (t, bot, team, timeout = 40000) {
  const h = MAP.teams[team].spawn
  await waitFor(() => bot.isAlive !== false && dist2(bot.entity.position, h) < 3 && Math.abs(bot.entity.position.y - h.y) < 3,
    { timeout, what: `${bot.username} to respawn on their island` })
  await sleep(500)
}

// ------------------------------------------------------------------ the spec

const state0 = {}
module.exports = {
  name: 'special-items',
  timeout: 540000,
  server: {},
  async run (t) {
    const LOBBY = MAP.lobbySpawn
    state0.difficultyAtStart = (await t.server.cmd('difficulty')).trim()
    t.log('world difficulty at start:', state0.difficultyAtStart)
    // ============================================================== lobby (A alone, game cannot start with 1 player)
    const a = await t.bot('ItemA')
    await waitFor(() => dist2(a.entity.position, LOBBY) < 6 && Math.abs(a.entity.position.y - LOBBY.y) < 6, { timeout: 20000, what: 'ItemA in the waiting lobby' })
    await sleep(1500)

    if (want('lobby')) {
      const base = a.entity.position.clone()
      await give(t, a, 'firework_rocket', 2)
      await hold(a, 'firework_rocket')
      let t0 = Date.now()
      await rightClick(a)
      await sleep(5500)
      const moved = a.entity.position.distanceTo(base)
      t.check('lobby: Teleporter does nothing (no countdown, no launch, rocket kept)',
        chatSince(a, t0, /Teleport|seconds|Do not move/i).length === 0 && moved < 1.5 && countItem(a, 'firework_rocket') === 2,
        { moved: r2(moved), rockets: countItem(a, 'firework_rocket'), chat: chatSince(a, t0, /./) })

      await give(t, a, 'chicken_spawn_egg', 1)
      await hold(a, 'chicken_spawn_egg')
      await t.server.cmd(`tp ${a.username} ${LOBBY.x} ${LOBBY.y + 10} ${LOBBY.z}`)
      await sleep(400)
      const airborne = !a.entity.onGround
      t0 = Date.now()
      await rightClick(a)
      await sleep(1200)
      const chickens = await count(t, '@e[type=chicken]')
      await tp(t, a, LOBBY.x, LOBBY.y, LOBBY.z)
      t.check('lobby: Parachute does nothing in the air (no chicken, egg kept)',
        airborne && chickens === 0 && countItem(a, 'chicken_spawn_egg') === 1 && chatSince(a, t0, /Parachute|air/i).length === 0,
        { airborne, chickens, eggs: countItem(a, 'chicken_spawn_egg') })

      await sleep(1500)
      const stands0 = await countNear(t, a, 'armor_stand', 8)
      await give(t, a, 'armor_stand', 1)
      await hold(a, 'armor_stand')
      const floor = a.blockAt(a.entity.position.offset(0, -1, 0).floored())
      await a.lookAt(floor.position.offset(0.5, 1, 0.5), true)
      await a._genericPlace(floor, new Vec3(0, 1, 0), { swingArm: 'right' })
      await sleep(1500)
      const shopVillagers = await count(t, '@e[type=villager,name="Mobile Shop"]')
      t.check('lobby: Mobile Shop does not spawn a shop villager', shopVillagers === 0, { shopVillagers, armorStandsBefore: stands0, armorStandsAfter: await countNear(t, a, 'armor_stand', 8) })
      await t.server.cmd(`clear ${a.username}`)
    }

    // ============================================================== start the game with four players
    const b = await t.bot('ItemB')
    const c = await t.bot('ItemC')
    const d = await t.bot('ItemD')
    const bots = [a, b, c, d]
    await Promise.all(bots.map(x => waitForGameStart(x)))
    await sleep(1000)
    const teams = Object.fromEntries(bots.map(x => [x.username, teamOf(x)]))
    t.log('teams', teams)
    t.check('4 players split 2 v 2', TEAMS.every(n => bots.filter(x => teams[x.username] === n).length === 2), teams)

    const teamA = teams[a.username]
    const p = b // pilot
    const tp0 = teams[p.username]
    const q = [c, d].find(x => teams[x.username] !== tp0) || c // shooter: an enemy of the pilot (friendly fire is off)
    const FP = frame(tp0) // pilot's frame
    const FA = frame(teamA)
    const homeP = FP.home
    // the direction in which the combo glide goes: sideways of the team axis, away from the waiting lobby (it hangs near the map)
    const toLobby = unit(CENTRE, LOBBY)
    const glideDir = (FP.v.x * toLobby.x + FP.v.z * toLobby.z) <= 0 ? FP.v : { x: -FP.v.x, z: -FP.v.z }
    t.log('geometry', { walkY: WALK_Y, voidY: MAP.voidY, centre: CENTRE, pilotTeam: tp0, home: homeP, u: FP.u, v: FP.v, glideDir, lobby: LOBBY, spec: MAP.specSpawn })

    // ---------------------------------------------------------------- verify that the spots used below are really there
    const probe = async () => {
      const bad = []
      let sky = true
      // both islands are checked: the pilot suite uses the pilot's, the shop / mobile shop / TNT / chest tests the economy bot's
      for (const F of [...new Set([FP, FA])]) {
        await tp(t, p, F.home.x, F.home.y, F.home.z)
        await sleep(600)
        const spots = { 'home': F.cell(0, 0), 'away (du=2)': F.cell(2, 0), 'tnt placer': F.cell(0, -3), 'tnt': F.cell(0, -5), 'tnt enemy': F.cell(0, -7), 'chest': F.cell(-2, 5), 'chest placer': F.cell(-2, 2), 'chest user': F.cell(-2, 3), 'shop-place': F.cell(3, -3), 'shop-blocked': F.cell(3, -6), 'shop-stand': F.cell(1, -4), 'shop-beside': F.cell(3, -2) }
        for (const [name, s] of Object.entries(spots)) {
          const below = p.blockAt(new Vec3(s.bx, WALK_Y - 1, s.bz)); const feet = p.blockAt(new Vec3(s.bx, WALK_Y, s.bz)); const head = p.blockAt(new Vec3(s.bx, WALK_Y + 1, s.bz))
          if (!solid(below) || (feet && feet.name !== 'air') || (head && head.name !== 'air')) bad.push({ team: F.team, name, at: [s.bx, s.bz], below: below && below.name, feet: feet && feet.name, head: head && head.name })
        }
        for (let y = WALK_Y + 1; y < WALK_Y + 40; y++) { const bl = p.blockAt(new Vec3(Math.floor(F.home.x), y, Math.floor(F.home.z))); if (bl && bl.name !== 'air') sky = false }
      }
      t.check('setup: all test spots on both team islands are standable (solid floor, free above) and the sky above the spawns is open', bad.length === 0 && sky, { bad, sky })
    }
    await probe()

    // the late joiner becomes a spectator of the running game; it also serves as the flying scout that scans the map for void
    const e = await t.bot('ItemE')
    await waitFor(() => dist2(e.entity.position, MAP.specSpawn) < 10, { timeout: 20000, what: 'spectator to be at the spectator spawn' }).catch(() => {})

    // a spot in the void for the Rescue Platform / pearl landing platform (nothing solid within 12 blocks horizontally, from 40 below to 60 above walk level)
    const findVoid = async () => {
      const mid = { x: (MAP.teams[TEAMS[0]].spawn.x + MAP.teams[TEAMS[1]].spawn.x) / 2, z: (MAP.teams[TEAMS[0]].spawn.z + MAP.teams[TEAMS[1]].spawn.z) / 2 }
      for (const off of [30, -30, 45, -45, 60, -60]) {
        const x = Math.floor(mid.x + FP.v.x * off) + 0.5
        const z = Math.floor(mid.z + FP.v.z * off) + 0.5
        await t.server.cmd(`tp ${e.username} ${x} ${WALK_Y + 20} ${z}`)
        await sleep(2500)
        let ok = true
        for (let dx = -12; dx <= 12 && ok; dx += 4) for (let dz = -12; dz <= 12 && ok; dz += 4) for (let y = WALK_Y - 40; y <= WALK_Y + 60 && ok; y += 4) {
          const bl = e.blockAt(new Vec3(Math.floor(x) + dx, y, Math.floor(z) + dz))
          if (!bl || bl.name !== 'air') ok = false
        }
        if (ok) { await t.server.cmd(`tp ${e.username} ${MAP.specSpawn.x} ${MAP.specSpawn.y} ${MAP.specSpawn.z}`); return { x, z } }
      }
      await t.server.cmd(`tp ${e.username} ${MAP.specSpawn.x} ${MAP.specSpawn.y} ${MAP.specSpawn.z}`)
      return null
    }

    // ============================================================== economy: one of each resource, then multiplied (shop only takes real spawner items)
    const economy = (async () => {
      const bronze = spawnerPos('bronze', teamA)
      const silver = MAP.nearestSpawner('silver', MAP.teams[teamA].spawn)
      const gold = spawnerPos('gold')
      await tp(t, a, bronze.x, bronze.y, bronze.z)
      await waitFor(() => countItem(a, 'brick') >= 1, { timeout: 15000, what: 'bronze' })
      await tp(t, a, silver.x, silver.y, silver.z)
      await waitFor(() => countItem(a, 'iron_ingot') >= 1, { timeout: 25000, what: 'silver' })
      await tp(t, a, gold.x, gold.y, gold.z)
      await waitFor(() => countItem(a, 'gold_ingot') >= 1, { timeout: 60000, what: 'gold' })
      await sleep(300)
      // multiply them: /bw cheat give hands out the same named resource items the spawners drop (Pumpkin's /item has no
      // `replace ... from` / `modify`, see PUMPKIN-FINDINGS)
      for (const res of ['bronze', 'iron', 'gold']) await t.server.cmd(`bw cheat give ${res} 64 ${a.username}`)
      await waitFor(() => countItem(a, 'gold_ingot') >= 64 && countItem(a, 'iron_ingot') >= 64 && countItem(a, 'brick') >= 64, { timeout: 8000, what: 'multiplied resources' })
    })()
    economy.catch(() => {})

    // ============================================================== pilot suite (runs while A waits for the first gold)
    const state = {}
    const pilot = async () => {
      await t.server.cmd(`gamemode survival ${p.username}`)
      await give(t, p, 'firework_rocket', 3)
      await give(t, p, 'chicken_spawn_egg', 6)
      const toHome = async () => { await tp(t, p, homeP.x, homeP.y, homeP.z); await sleep(400) }

      // ---------------- Teleporter: moving to another block cancels the countdown
      if (want('rocket')) {
        await toHome()
        await hold(p, 'firework_rocket')
        await look(p, CENTRE.x, homeP.y + 1.62, CENTRE.z) // walk towards the middle of the map (over our own island)
        const r = recorder(p)
        let t0 = Date.now()
        await rightClick(p)
        await waitFor(() => chatSince(p, t0, /Teleporting in/).length, { timeout: 3000, what: 'countdown message' })
        await sleep(1000)
        p.setControlState('forward', true)
        await sleep(700)
        p.setControlState('forward', false)
        const movedTo = p.entity.position.clone()
        await sleep(4500)
        r.stop()
        const maxY = Math.max(...r.samples.map(s => s.y))
        t.check('Teleporter: walking to another block cancels it (message, no launch, rocket kept)',
          chatSince(p, t0, /cancelled/).length === 1 && maxY < homeP.y + 1 && countItem(p, 'firework_rocket') === 3,
          { chat: chatSince(p, t0, /./), maxY: r1(maxY), rockets: countItem(p, 'firework_rocket'), movedBlocks: r1(dist2(movedTo, homeP)) })

        // ---------------- blocks above: refused, and placing one during the countdown cancels it
        await toHome()
        const hx = Math.floor(homeP.x); const hz = Math.floor(homeP.z)
        await t.server.cmd(`setblock ${hx} ${WALK_Y + 2} ${hz} minecraft:stone`)
        const rRef = recorder(p)
        t0 = Date.now()
        await rightClick(p)
        await sleep(5000)
        rRef.stop()
        const maxYRef = Math.max(...rRef.samples.map(s => s.y))
        t.check('Teleporter: refused when a block is above you (message, rocket kept, no launch)',
          chatSince(p, t0, /above you/).length >= 1 && chatSince(p, t0, /Teleporting in/).length === 0 && countItem(p, 'firework_rocket') === 3 && maxYRef < homeP.y + 1,
          { chat: chatSince(p, t0, /./), rockets: countItem(p, 'firework_rocket'), maxY: r1(maxYRef) })
        await t.server.cmd(`setblock ${hx} ${WALK_Y + 2} ${hz} minecraft:air`)

        const r2s = recorder(p)
        t0 = Date.now()
        await rightClick(p)
        await waitFor(() => chatSince(p, t0, /Teleporting in/).length, { timeout: 3000, what: 'countdown message' })
        await sleep(1200)
        await t.server.cmd(`setblock ${hx} ${WALK_Y + 3} ${hz} minecraft:stone`)
        await sleep(4500)
        r2s.stop()
        const maxY3 = Math.max(...r2s.samples.map(s => s.y))
        t.check('Teleporter: a block placed above you during the countdown cancels it',
          chatSince(p, t0, /above you/).length >= 1 && maxY3 < homeP.y + 1 && countItem(p, 'firework_rocket') === 3,
          { chat: chatSince(p, t0, /./), maxY: r1(maxY3), rockets: countItem(p, 'firework_rocket') })
        await t.server.cmd(`setblock ${hx} ${WALK_Y + 3} ${hz} minecraft:air`)

        // using it twice: the second click during the countdown is refused and does not use up a second rocket
        await toHome()
        t0 = Date.now()
        await rightClick(p)
        await waitFor(() => chatSince(p, t0, /Teleporting in/).length, { timeout: 3000, what: 'countdown message' })
        await sleep(500)
        await rightClick(p)
        await sleep(600)
        const again = chatSince(p, t0, /already/).length
        // let this one run out by walking away
        p.setControlState('forward', true); await sleep(500); p.setControlState('forward', false)
        await sleep(600)
        t.check('Teleporter: a second click during the countdown is refused ("already")', again === 1 && countItem(p, 'firework_rocket') === 3, { chat: chatSince(p, t0, /./), rockets: countItem(p, 'firework_rocket') })
        await toHome()
      }

      // ---------------- Teleporter: full flow
      if (want('rocket')) {
        const away = FP.cell(2, 0)
        await tp(t, p, away.x, homeP.y, away.z) // away from the spawn, so we see the teleport home
        await sleep(800)
        const startPos = p.entity.position.clone()
        await hold(p, 'firework_rocket')
        const hp0 = await health(t, p)
        const r = recorder(p)
        const t0 = Date.now()
        await rightClick(p)
        await waitFor(() => chatSince(p, t0, /Teleporting in/).length, { timeout: 3000, what: 'countdown message' })
        // turning the head must not cancel (same block)
        await sleep(900)
        await p.look(1.0, 0.3, true)
        await sleep(300)
        await p.look(2.0, -0.3, true)
        await waitFor(() => r.forced.some(f => f.t > t0), { timeout: 15000, what: 'teleport home' })
        await sleep(2500)
        r.stop()
        const home = r.forced.find(f => f.t > t0)
        const up = r.samples.filter(s => s.t >= t0 && s.t <= home.t)
        const launchIdx = up.findIndex(s => s.y > startPos.y + 0.5)
        const launchAt = (up[launchIdx].t - t0) / 1000
        const peak = Math.max(...up.map(s => s.y))
        const ascent = up.slice(launchIdx)
        const steps = ascent.slice(2).map((s, i) => s.y - ascent[i + 1].y).filter(v => v > 0)
        const topSteps = steps.sort((x, y) => x - y)
        const medianStep = topSteps[Math.floor(topSteps.length / 2)]
        const finalPos = p.entity.position
        const hp1 = await health(t, p)
        t.log('rocket trajectory', r.traj(t0, 250, 2500, 7000))
        t.check('Teleporter: 3 s countdown, then the launch starts', launchAt > 2.7 && launchAt < 3.6, { launchAt: r2(launchAt) })
        t.check('Teleporter: launch speed is ~3.9 blocks/tick', medianStep > 3.3 && medianStep < 4.2, { medianStepPerTick: r2(medianStep), ascentTicks: ascent.length })
        t.check('Teleporter: teleports home once ~150 blocks above the launch point',
          peak - startPos.y > 148 && peak - startPos.y < 162, { peakAboveLaunch: r1(peak - startPos.y), peakY: r1(peak) })
        t.check('Teleporter: lands exactly on the team spawn', dist2(finalPos, homeP) < 1.2 && Math.abs(finalPos.y - homeP.y) < 1.5,
          { finalPos: [r1(finalPos.x), r1(finalPos.y), r1(finalPos.z)], expected: [homeP.x, homeP.y, homeP.z] })
        t.check('Teleporter: rocket consumed exactly once, no damage from the trip',
          countItem(p, 'firework_rocket') === 2 && hp1 >= hp0, { rockets: countItem(p, 'firework_rocket'), hp0, hp1, forcedMoves: r.forced.length })
        await sleep(2500)
        t.check('Teleporter: nothing keeps pushing the player after the teleport (no leftover launch)',
          Math.abs(p.entity.position.y - homeP.y) < 1.5, { y: r1(p.entity.position.y) })
      }

      // ---------------- Parachute: refused on the ground
      if (want('chute')) {
        await toHome()
        await sleep(300)
        await hold(p, 'chicken_spawn_egg')
        const eggs0 = countItem(p, 'chicken_spawn_egg')
        const t0 = Date.now()
        await rightClick(p)
        await sleep(1200)
        t.check('Parachute: refused on the ground (message, egg kept, no chicken)',
          chatSince(p, t0, /in the air/).length === 1 && countItem(p, 'chicken_spawn_egg') === eggs0 && (await countNear(t, p, 'chicken', 8)) === 0,
          { chat: chatSince(p, t0, /./), eggs: countItem(p, 'chicken_spawn_egg') })

        // control: without parachute this drop hurts, so "no damage with the parachute" means something
        await t.server.cmd(`effect give ${p.username} minecraft:instant_health 1 10 true`)
        await sleep(400)
        await tp(t, p, homeP.x, homeP.y + 11, homeP.z)
        await waitFor(() => p.entity.onGround, { timeout: 8000, what: 'control fall to land' })
        await sleep(800)
        const hpControl = await health(t, p)
        t.log('control fall of ~11 blocks without parachute: health', hpControl)
        state.fallDamageWorks = hpControl < 20
        t.check('Parachute control: a fall of ~11 blocks without parachute does damage (so "no damage with the parachute" is meaningful)', state.fallDamageWorks, { hpAfterControlFall: hpControl })
        await t.server.cmd(`effect give ${p.username} minecraft:instant_health 1 10 true`)
        await sleep(600)

        // glide: open 56 blocks up, 16 blocks away from our spawn on the side of the middle (void), look at our spawn (level view): 1 s of gliding
        // (16 blocks) brings us over our own island, then look straight down: sink and land there
        const back = unit(CENTRE, homeP) // from the middle towards our spawn
        const startX = homeP.x - back.x * 16
        const startZ = homeP.z - back.z * 16
        const startY = homeP.y + 56
        await tp(t, p, startX, startY, startZ)
        await hold(p, 'chicken_spawn_egg')
        await look(p, homeP.x + back.x * 400, startY + 1.62, homeP.z + back.z * 400) // level view towards our own island and beyond
        await sleep(100)
        const hpBefore = await health(t, p)
        const r = recorder(p)
        const t1 = Date.now()
        await rightClick(p)
        await poll(async () => (await countNear(t, p, 'chicken', 4)) === 1, { timeout: 3000, what: 'parachute chicken' })
        const chickenWhileOpen = await countNear(t, p, 'chicken', 4)
        const ridingServer = (await t.server.cmd(`execute as ${p.username} on passengers if entity @s[type=chicken]`))
        await sleep(1000)
        // look straight down: glide must stop moving sideways and just sink
        const midPos = p.entity.position.clone()
        await p.look(p.entity.yaw, -Math.PI / 2, true)
        await waitFor(() => p.entity.onGround, { timeout: 40000, step: 200, what: 'parachute landing' })
        const tLand = Date.now()
        await sleep(1500)
        r.stop()
        const seg = r.samples.filter(s => s.t >= t1 + 300 && s.t <= t1 + 1000)
        const dz = seg[seg.length - 1].z - seg[0].z
        const dx = seg[seg.length - 1].x - seg[0].x
        const ticks = seg.length - 1
        const horiz = Math.hypot(dz, dx) / ticks
        const along = (dx * back.x + dz * back.z) / ticks
        const dyPerTick = (seg[seg.length - 1].y - seg[0].y) / ticks
        const sinkSeg = r.samples.filter(s => s.t >= t1 + 5000 && s.t <= t1 + 7000)
        const sink = (sinkSeg[0].y - sinkSeg[sinkSeg.length - 1].y) / (sinkSeg.length - 1)
        const hpAfter = await health(t, p)
        const chickenAfter = await countNear(t, p, 'chicken', 8)
        const drops = await chickenDrops(t)
        t.log('glide trajectory', r.traj(t1, 500))
        t.check('Parachute: opens in the air, consumes the egg, a chicken rides on the player',
          chickenWhileOpen === 1 && /Test passed/i.test(ridingServer) && countItem(p, 'chicken_spawn_egg') === 5, { chicken: chickenWhileOpen, riding: ridingServer, eggs: countItem(p, 'chicken_spawn_egg') })
        t.check(`Parachute: glides ~${CHUTE.speed} blocks/tick in the view direction (config parachute.horizontal-speed)`,
          horiz > CHUTE.speed * 0.93 && horiz < CHUTE.speed * 1.07 && along > 0.97 * horiz,
          { horizontalPerTick: r2(horiz), alongViewPerTick: r2(along), dx: r1(dx), dz: r1(dz), ticks })
        t.check('Parachute: sinks slowly (well below free fall) while gliding',
          dyPerTick < 0 && dyPerTick > -0.5 && sink > CHUTE.sink * 0.95 && sink < CHUTE.sink * 1.6, { glideDyPerTick: r2(dyPerTick), sinkPerTickWhileStraightDown: r2(sink) })
        t.check('Parachute: looking straight down stops the sideways movement and lands on the island', (() => {
          const later = r.samples.filter(s => s.t >= t1 + 5000 && s.t <= tLand)
          return Math.hypot(later[later.length - 1].x - later[0].x, later[later.length - 1].z - later[0].z) < 3 && dist2(p.entity.position, homeP) < 12
        })(), { midPos: [r1(midPos.x), r1(midPos.y), r1(midPos.z)], landed: [r1(p.entity.position.x), r1(p.entity.position.y), r1(p.entity.position.z)] })
        t.check('Parachute: no fall damage on landing, chicken removed, no chicken drops',
          hpAfter >= hpBefore && chickenAfter === 0 && drops === 0, { hpBefore, hpAfter, chickenAfter, drops, controlFallWithoutChuteHealth: hpControl, fallDamageWorksWithoutChute: state.fallDamageWorks })
        const eggsNow = countItem(p, 'chicken_spawn_egg')
        t.check('Parachute: egg count is 5 after one use', eggsNow === 5, { eggs: eggsNow })
      }

      // ---------------- Parachute: breaks after parachute.duration-seconds
      if (want('expire')) {
        // as high as the world allows, looking straight down (sink only): after the configured lifetime the player is still above the island
        await tp(t, p, homeP.x, 312, homeP.z)
        await hold(p, 'chicken_spawn_egg')
        await p.look(p.entity.yaw, -Math.PI / 2, true)
        await sleep(300)
        const r = recorder(p)
        const t1 = Date.now()
        await rightClick(p)
        await poll(async () => (await countNear(t, p, 'chicken', 4)) === 1, { timeout: 3000, what: 'parachute chicken' })
        let tBreak = null
        const watchChicken = async () => {
          while (Date.now() - t1 < (CHUTE.seconds + 10) * 1000) {
            const n = await countNear(t, p, 'chicken', 8)
            if (n === 0) { tBreak = Date.now(); return }
            await sleep(150)
          }
        }
        await watchChicken()
        const yAtBreak = p.entity.position.y
        let vyAfter = 0
        const vyWatch = () => { vyAfter = Math.min(vyAfter, p.entity.velocity.y) }
        p.on('physicsTick', vyWatch)
        await sleep(800)
        p.off('physicsTick', vyWatch)
        await toHome() // save the pilot
        r.stop()
        const lifetime = tBreak ? (tBreak - t1) / 1000 : null
        t.log('expire trajectory', r.traj(t1, 3000))
        t.check(`Parachute: breaks after ${CHUTE.seconds} s (message, chicken gone, player falls on)`,
          lifetime !== null && lifetime > CHUTE.seconds - 0.8 && lifetime < CHUTE.seconds + 1.2 && chatSince(p, t1, /broke/).length === 1 && vyAfter < -0.4 && yAtBreak > WALK_Y + 2,
          { lifetimeSeconds: lifetime && r2(lifetime), yAtBreak: r1(yAtBreak), vyAfter: r2(vyAfter), chat: chatSince(p, t1, /broke/) })
      }

      // ---------------- Parachute: shot down by a bow arrow
      if (want('shot')) {
        // The shooter (an enemy of the pilot) stands on a stone block 5 blocks to the side, ~6 blocks above the chicken (so the arrow clears his block),
        // with the bow fully drawn. The pilot looks straight down, so the chicken only sinks (0.29 b/tick). The shooter leads the target using the
        // server side chicken position (RCON answers in ~2 ms); because the latency to the release is not exactly known the lead is varied over
        // up to 3 shots (x1.0, x0.7, x1.3); the parachute lasts 30 s, so there is time. Between the shots the shooter is moved back next to the pilot.
        const sy = homeP.y + 60
        await give(t, q, 'bow', 1)
        await give(t, q, 'arrow', 16)
        await hold(q, 'bow')
        await hold(p, 'chicken_spawn_egg')
        await tp(t, p, homeP.x, sy, homeP.z)
        await p.look(p.entity.yaw, -Math.PI / 2, true)
        await sleep(200)
        const t1 = Date.now()
        await rightClick(p)
        await poll(async () => (await countNear(t, p, 'chicken', 4)) === 1, { timeout: 3000, what: 'parachute chicken' })
        const chickenPos = async () => {
          const r = await t.server.cmd('data get entity @e[type=chicken,limit=1] Pos')
          const m = /\[([-\d.E]+)d, ([-\d.E]+)d, ([-\d.E]+)d\]/.exec(r)
          return m ? new Vec3(Number(m[1]), Number(m[2]), Number(m[3])) : null
        }
        const attempts = []
        let shotDown = false
        let lastStone = null
        for (const factor of [1.0, 0.7, 1.3]) {
          if (shotDown || (await countNear(t, p, 'chicken', 6)) === 0) break
          await t.server.cmd(`effect give ${p.username} minecraft:instant_health 1 10 true`) // arrows that miss the chicken hit the pilot; keep him alive
          // shooter feet: where the chicken (on the pilot's head, ~2 above his feet) will be after the 1 s draw, plus 4.6
          const py = Math.floor(p.entity.position.y + 1)
          if (lastStone) await t.server.cmd(`setblock ${lastStone} minecraft:air`)
          const sx = Math.floor(homeP.x + FP.v.x * 5); const sz = Math.floor(homeP.z + FP.v.z * 5)
          lastStone = `${sx} ${py - 1} ${sz}`
          await t.server.cmd(`setblock ${lastStone} minecraft:stone`)
          await tp(t, q, sx + 0.5, py, sz + 0.5)
          await hold(q, 'bow')
          q.activateItem() // draw
          await sleep(1000) // fully drawn
          const cp = await chickenPos()
          if (!cp) { q.deactivateItem(); break }
          const eye = new Vec3(q.entity.position.x, q.entity.position.y + 1.62, q.entity.position.z)
          const dist = Math.hypot(cp.x - eye.x, cp.y - eye.y, cp.z - eye.z)
          const flightTicks = Math.ceil(dist / 3)
          const drop = 0.05 * flightTicks * (flightTicks + 1) / 2 * 0.5 // 1.8 arrow gravity 0.05/tick (drag makes it a bit less)
          const lead = 0.29 * 20 * (0.11 + dist / 60) * factor
          const aim = new Vec3(cp.x, cp.y + 0.35 - lead + drop, cp.z)
          await q.lookAt(aim, true)
          await sleep(60) // mineflayer sends the new look direction with the next physics tick
          const arrowsBefore = countItem(q, 'arrow')
          const hpPilot0 = await health(t, p)
          q.deactivateItem()
          await sleep(700)
          shotDown = chatSince(p, t1, /shot down/).length === 1
          const hpPilot1 = await health(t, p)
          attempts.push({ hpPilot: [hpPilot0, hpPilot1], arrowHitPilotInstead: hpPilot1 < hpPilot0, factor, shooterFeetY: py, chicken: [r1(cp.x), r1(cp.y), r1(cp.z)], dist: r1(dist), aimY: r1(aim.y), arrowsBefore, hit: shotDown })
          await sleep(300)
        }
        await sleep(500)
        const chickensLeft = await countNear(t, p, 'chicken', 12)
        const drops = await chickenDrops(t)
        if (p.isAlive === false || p.entity.position.y > homeP.y + 3 && (await health(t, p)) <= 0) await waitRespawn(t, p, tp0)
        t.log('shot attempts', attempts)
        t.check('Parachute: a real bow arrow hits the chicken and ends the parachute (message, chicken gone, no drops)',
          shotDown && chickensLeft === 0 && drops === 0,
          { shotDown, chickensLeft, chickenDrops: drops, arrowsPassedThroughToPilot: attempts.filter(x => x.arrowHitPilotInstead).length, attempts })
        await toHome()
        if (lastStone) await t.server.cmd(`setblock ${lastStone} minecraft:air`)
        await t.server.cmd('kill @e[type=arrow]')
        const hq = MAP.teams[teams[q.username]].spawn
        await tp(t, q, hq.x, hq.y, hq.z)
      }

      // ---------------- Parachute: sneaking cancels it, the player drops
      if (want('sneak')) {
        // (the pilot of the scenario before may still be falling to his death: wait until he is alive at home, his death clears the inventory)
        await waitFor(() => p.isAlive !== false, { timeout: 15000, what: 'pilot alive' }).catch(() => {})
        await sleep(3000)
        await toHome()
        await t.server.cmd(`effect give ${p.username} minecraft:instant_health 1 10 true`)
        await give(t, p, 'chicken_spawn_egg', 1)
        await tp(t, p, homeP.x, homeP.y + 45, homeP.z)
        await hold(p, 'chicken_spawn_egg')
        await p.look(p.entity.yaw, -Math.PI / 2, true)
        await sleep(200)
        const eggs0 = countItem(p, 'chicken_spawn_egg')
        const t1 = Date.now()
        await rightClick(p)
        await poll(async () => (await countNear(t, p, 'chicken', 4)) === 1, { timeout: 3000, what: 'parachute chicken' })
        await sleep(1500)
        const vyGlide = p.entity.velocity.y
        const r = recorder(p)
        p.setControlState('sneak', true)
        const tSneak = Date.now()
        await poll(async () => (await countNear(t, p, 'chicken', 8)) === 0, { timeout: 3000, what: 'chicken gone after sneaking' })
        const goneMs = Date.now() - tSneak
        await sleep(1200)
        p.setControlState('sneak', false)
        const vyAfter = Math.min(...r.samples.filter(x => x.t > tSneak + 300).map(x => x.vy))
        r.stop()
        const drops = await chickenDrops(t)
        t.check('Parachute: sneaking ends it (chicken gone, no drops, no "shot down"), the player drops with normal gravity',
          goneMs < 1500 && drops === 0 && chatSince(p, t1, /shot down/).length === 0 && countItem(p, 'chicken_spawn_egg') === eggs0 - 1 && vyAfter < -0.5 && vyGlide > -0.5,
          { goneMs, drops, vyGlide: r2(vyGlide), vyAfter: r2(vyAfter), eggs: countItem(p, 'chicken_spawn_egg'), chat: chatSince(p, t1, /./) })
        await toHome()
        await t.server.cmd(`effect give ${p.username} minecraft:instant_health 1 10 true`)
      }

      // ---------------- Parachute: shooting a bow from it keeps it open (air support)
      if (want('ownshot')) {
        // (the pilot dropped by the sneak scenario may still die from the fall distance he carried home, /tp keeps it)
        await waitFor(() => p.isAlive !== false, { timeout: 15000, what: 'pilot alive' }).catch(() => {})
        await sleep(1500)
        await toHome()
        await t.server.cmd(`effect give ${p.username} minecraft:instant_health 1 10 true`)
        await give(t, p, 'chicken_spawn_egg', 1)
        await give(t, p, 'bow', 1)
        await give(t, p, 'arrow', 8)
        await tp(t, p, homeP.x, homeP.y + 45, homeP.z)
        await hold(p, 'chicken_spawn_egg')
        await p.look(p.entity.yaw, -0.3, true)
        await sleep(200)
        const t1 = Date.now()
        await rightClick(p)
        await poll(async () => (await countNear(t, p, 'chicken', 4)) === 1, { timeout: 3000, what: 'parachute chicken' })
        await hold(p, 'bow')
        const arrows0 = countItem(p, 'arrow')
        let shots = 0
        for (let i = 0; i < 3; i++) {
          p.activateItem() // draw
          await sleep(1000)
          p.deactivateItem()
          shots++
          await sleep(600)
        }
        const chickens = await countNear(t, p, 'chicken', 6)
        t.check('Parachute: three shots from the parachute do not shoot it down (arrows used, chicken still on the player, no message)',
          chickens === 1 && chatSince(p, t1, /shot down/).length === 0 && countItem(p, 'arrow') <= arrows0 - 2,
          { chickens, arrowsBefore: arrows0, arrowsAfter: countItem(p, 'arrow'), shots, chat: chatSince(p, t1, /./) })
        // (a teleport during the glide would be followed by the glide velocity for a few more ticks: end it by sneaking first)
        p.setControlState('sneak', true)
        await sleep(600)
        p.setControlState('sneak', false)
        await toHome()
        await t.server.cmd('kill @e[type=arrow]')
        await t.server.cmd(`effect give ${p.username} minecraft:instant_health 1 10 true`)
      }

      // ---------------- cleanup on death: mid-launch and mid-glide
      if (want('death')) {
        await toHome()
        await t.server.cmd(`clear ${p.username}`)
        await give(t, p, 'firework_rocket', 1)
        await give(t, p, 'chicken_spawn_egg', 2)
        await hold(p, 'firework_rocket')
        let r = recorder(p)
        let t0 = Date.now()
        await rightClick(p)
        await waitFor(() => r.samples.some(s => s.t > t0 && s.y > homeP.y + 36), { timeout: 12000, what: 'rocket launch to 36 blocks up' })
        await t.server.cmd(`kill ${p.username}`)
        await waitFor(() => p.isAlive === false || p.entity.position.y < homeP.y + 2, { timeout: 5000, what: 'death' }).catch(() => {})
        await waitRespawn(t, p, tp0)
        await sleep(2500)
        r.stop()
        const yAfter = p.entity.position.y
        const gotHome = r.forced.filter(f => f.t > t0)
        t.check('death mid-launch: respawned player is not shot into the sky and not teleported again',
          Math.abs(yAfter - homeP.y) < 1.5, { yAfterRespawn: r1(yAfter), forcedMoves: gotHome.map(f => [r1(f.y)]) })

        // mid-glide
        await give(t, p, 'chicken_spawn_egg', 1)
        const gs = FP.cell(0, 0)
        await t.server.cmd(`tp ${p.username} ${gs.x} ${homeP.y + 50} ${gs.z}`)
        await sleep(600)
        await hold(p, 'chicken_spawn_egg')
        t0 = Date.now()
        await rightClick(p)
        await poll(async () => (await countNear(t, p, 'chicken', 4)) === 1, { timeout: 3000, what: 'parachute chicken' })
        await sleep(1500)
        await t.server.cmd(`kill ${p.username}`)
        await sleep(700)
        const chickensGlobal = await count(t, '@e[type=chicken]')
        await waitRespawn(t, p, tp0)
        await sleep(1500)
        t.check('death mid-glide: parachute chicken is removed immediately', chickensGlobal === 0, { chickensGlobal })
        t.check('death mid-glide: respawned player is on the ground at spawn and unharmed by leftover glide',
          Math.abs(p.entity.position.y - homeP.y) < 1.5 && dist2(p.entity.position, homeP) < 3, { pos: [r1(p.entity.position.x), r1(p.entity.position.y), r1(p.entity.position.z)] })
      }
    }

    await pilot()
    await economy
    t.log('economy ready', invSummary(a))

    // ============================================================== shop: buy every special for real
    if (want('shop') || want('combo') || want('mobile') || want('platform') || want('tnt') || want('pearl') || want('chest') || want('spectator')) {
      await t.server.cmd(`clear ${a.username} minecraft:firework_rocket`)
      const before = { iron: countItem(a, 'iron_ingot'), gold: countItem(a, 'gold_ingot'), brick: countItem(a, 'brick') }
      const shopPos = MAP.named('shop', teamA)
      const store = MAP.nearestStore(MAP.teams[teamA].spawn)
      await tp(t, a, shopPos.x, shopPos.y, shopPos.z)
      await sleep(600)
      const shopkeeper = Object.values(a.entities).find(e => e.name === 'villager' && Math.abs(e.position.x - store.x) < 1.2 && Math.abs(e.position.z - store.z) < 1.2)
      if (!shopkeeper) throw new Error(`no shop villager near ${JSON.stringify(store)}`)
      await a.activateEntityAt(shopkeeper, shopkeeper.position.offset(0, 1, 0))
      await waitFor(() => a.currentWindow, { timeout: 5000, what: 'shop window' })
      await sleep(400)
      const cat = a.currentWindow.slots.findIndex(x => x && itemName(x).includes('Extras'))
      const extrasShown = () => a.currentWindow && a.currentWindow.slots.some(x => x && itemName(x).includes('Team Chest'))
      // (a click that lands while the shop window is still being filled is lost now and then: click again once)
      for (let attempt = 0; attempt < 2 && !extrasShown(); attempt++) {
        await a.clickWindow(cat, 0, 0)
        await waitFor(extrasShown, { timeout: 2500, what: 'Extras page' }).catch(() => {})
      }
      if (!extrasShown()) throw new Error('Extras page did not open')
      const win = () => a.currentWindow
      const buy = async (name, n = 1) => {
        const slot = win().slots.findIndex(x => x && itemName(x).includes(name))
        for (let k = 0; k < n; k++) { await a.clickWindow(slot, 0, 0); await sleep(450) }
      }
      const plan = [['Rescue Platform', 2], ['TNT', 1], ['Team Chest', 1], ['Teleporter', 1], ['Parachute', 1], ['Mobile Shop', 1], ['Ender Pearl', 1]]
      for (const [n, k] of plan) await buy(n, k)
      await sleep(600)
      await a.closeWindow(a.currentWindow)
      await sleep(300)
      const spent = { silver: before.iron - countItem(a, 'iron_ingot'), gold: before.gold - countItem(a, 'gold_ingot'), bronze: before.brick - countItem(a, 'brick') }
      const have = { fireworks: countItem(a, 'firework_rocket'), spawn_egg: countItem(a, 'chicken_spawn_egg'), armor_stand: countItem(a, 'armor_stand'), nether_star: countItem(a, 'nether_star'), tnt: countItem(a, 'tnt'), ender_chest: countItem(a, 'ender_chest'), ender_pearl: countItem(a, 'ender_pearl') }
      t.check('shop: every special is purchasable and arrives as the right item',
        have.fireworks === 1 && have.spawn_egg === 1 && have.armor_stand === 1 && have.nether_star === 2 && have.tnt === 1 && have.ender_chest === 1 && have.ender_pearl === 1, have)
      t.check('shop: prices charged match the shop (22 Iron, 28 Gold)', spent.silver === 22 && spent.gold === 6 + 5 + 1 + 2 + 14, spent)
      const specials = a.inventory.items().filter(i => !['brick', 'iron_ingot', 'gold_ingot'].includes(i.name))
      const rawCodes = specials.filter(i => /&[0-9a-fk-or]/i.test(itemName(i)))
      t.check('shop: item names show colours, no raw "&" codes', rawCodes.length === 0, specials.map(i => itemName(i)))
    }

    // ============================================================== THE COMBO: Teleporter + Parachute
    if (want('combo')) {
      await tp(t, a, FA.home.x, FA.home.y, FA.home.z)
      await sleep(800)
      const gd = FA.v.x * toLobby.x + FA.v.z * toLobby.z <= 0 ? FA.v : { x: -FA.v.x, z: -FA.v.z }
      await look(a, FA.home.x + gd.x * 400, FA.home.y + 1.62, FA.home.z + gd.z * 400) // level, sideways of the team axis, away from the lobby
      const r = recorder(a)
      const t0 = Date.now()
      await hold(a, 'firework_rocket')
      await rightClick(a)
      await waitFor(() => countItem(a, 'firework_rocket') === 0, { timeout: 8000, what: 'rocket to be consumed (launch)' })
      const tLaunch = Date.now()
      await hold(a, 'chicken_spawn_egg') // swap to the parachute while flying up
      await waitFor(() => a.entity.position.y > FA.home.y + 105, { timeout: 5000, step: 20, what: 'player to be ~105 blocks up' })
      const yOpen = a.entity.position.y
      const posOpen = a.entity.position.clone()
      const tOpen = Date.now()
      await rightClick(a)
      await waitFor(() => countItem(a, 'chicken_spawn_egg') === 0, { timeout: 3000, what: 'egg consumed' })
      await sleep(1500)
      const chickenOpen = await countNear(t, a, 'chicken', 6)
      // glide for ~16 s (the void kills below walk level - 21 at the end of the 20 s), sampling the server position now and then
      const GLIDE_S = 16
      const serverSamples = []
      while (Date.now() - tOpen < GLIDE_S * 1000) {
        await sleep(2500)
        const sp2 = await serverPos(t, a)
        if (sp2) serverSamples.push([r1((Date.now() - tOpen) / 1000), r1(sp2.y), r1(sp2.x), r1(sp2.z)])
      }
      const posEnd = a.entity.position.clone()
      const forcedAfterLaunch = r.forced.filter(f => f.t > t0)
      const peak = Math.max(...r.samples.filter(x => x.t > t0).map(x => x.y))
      const glideSeg = r.samples.filter(x => x.t > tOpen + 1000 && x.t < tOpen + (GLIDE_S - 1) * 1000)
      const hSpeed = Math.hypot(glideSeg[glideSeg.length - 1].x - glideSeg[0].x, glideSeg[glideSeg.length - 1].z - glideSeg[0].z) / (glideSeg.length - 1)
      const distance = Math.hypot(posEnd.x - posOpen.x, posEnd.z - posOpen.z)
      const along = (posEnd.x - posOpen.x) * gd.x + (posEnd.z - posOpen.z) * gd.z
      t.log('combo trajectory (launch at t=' + r2((tLaunch - t0) / 1000) + 's)', r.traj(t0, 1000, 0, 30000))
      t.log('combo server positions (s since open, y, x, z)', JSON.stringify(serverSamples))
      t.check('combo: Teleporter + Parachute: no teleport home, player stays high',
        forcedAfterLaunch.length === 0 && peak < FA.home.y + 150 && posEnd.y > MAP.voidY + 5 && chickenOpen === 1,
        { forcedMoves: forcedAfterLaunch.length, openedAtY: r1(yOpen), peakY: r1(peak), yAfterGlide: r1(posEnd.y), chickenWhileGliding: chickenOpen })
      const longWay = CHUTE.speed * 20 * GLIDE_S * 0.95
      t.check(`combo: glides a long way (>=${Math.round(longWay)} blocks in ${GLIDE_S} s at ~${CHUTE.speed}/tick)`,
        distance > longWay && hSpeed > CHUTE.speed * 0.93 && hSpeed < CHUTE.speed * 1.07,
        { distanceBlocks: r1(distance), horizontalPerTick: r2(hSpeed), start: [r1(posOpen.x), r1(posOpen.z)], end: [r1(posEnd.x), r1(posEnd.z)], seconds: GLIDE_S })
      t.check('combo: view direction is kept (flew straight along the look direction)', along > longWay && Math.abs(along - distance) < 8, { along: r1(along), distance: r1(distance), dir: gd })
      // back home before the void gets us, then the parachute must clean itself up on landing
      await t.server.cmd(`tp ${a.username} ${FA.home.x} ${FA.home.y} ${FA.home.z}`)
      await sleep(2500)
      r.stop()
      const chickenEnd = await count(t, '@e[type=chicken]')
      t.check('combo: landing on the island afterwards removes the chicken', chickenEnd === 0, { chickens: chickenEnd })
    }

    // ============================================================== Mobile Shop
    if (want('mobile')) {
      const blocked = FA.cell(3, -6); const free = FA.cell(3, -3); const standAt = FA.cell(1, -4) // within reach (5 blocks) of both
      await tp(t, a, standAt.x, WALK_Y, standAt.z)
      await sleep(500)
      // refused when there is no room
      await give(t, a, 'armor_stand', 1) // plain one for the refusal test
      await t.server.cmd(`setblock ${blocked.bx} ${WALK_Y + 1} ${blocked.bz} minecraft:stone`)
      const floor0 = a.blockAt(new Vec3(blocked.bx, WALK_Y - 1, blocked.bz))
      await hold(a, 'armor_stand')
      let t0 = Date.now()
      await a._genericPlace(floor0, new Vec3(0, 1, 0), { swingArm: 'right' })
      await sleep(1500)
      t.check('Mobile Shop: refused when there is no room above the clicked block',
        chatSince(a, t0, /not enough space/).length === 1 && countItem(a, 'armor_stand') === 2 && (await count(t, '@e[type=villager,name="Mobile Shop"]')) === 0,
        { chat: chatSince(a, t0, /./), stands: countItem(a, 'armor_stand') })
      await t.server.cmd(`setblock ${blocked.bx} ${WALK_Y + 1} ${blocked.bz} minecraft:air`)
      await t.server.cmd(`clear ${a.username} minecraft:armor_stand 1`)
      await sleep(300)

      // real placement
      const spawned = []
      const onSpawn = e => spawned.push(e)
      a.on('entitySpawn', onSpawn)
      const floor = a.blockAt(new Vec3(free.bx, WALK_Y - 1, free.bz))
      await hold(a, 'armor_stand')
      t0 = Date.now()
      await a._genericPlace(floor, new Vec3(0, 1, 0), { swingArm: 'right' })
      await waitFor(() => spawned.find(e => e.name === 'villager'), { timeout: 5000, what: 'shop villager spawn' })
      const tPlaced = Date.now()
      a.off('entitySpawn', onSpawn)
      const villager = spawned.find(e => e.name === 'villager')
      await sleep(500)
      const named = await count(t, '@e[type=villager,name="Mobile Shop"]')
      const standNear = await countNear(t, a, 'armor_stand', 3)
      t.check('Mobile Shop: places a named villager next to the clicked block, consumes the item, no armor stand',
        named === 1 && countItem(a, 'armor_stand') === 0 && Math.abs(villager.position.x - free.x) < 0.6 && Math.abs(villager.position.z - free.z) < 0.6 && standNear === 0,
        { named, villagerAt: [r1(villager.position.x), r1(villager.position.y), r1(villager.position.z)], expected: [free.x, WALK_Y, free.z], armorStandsNear: standNear })
      // opens the shop
      const beside = FA.cell(3, -2)
      await tp(t, a, beside.x, WALK_Y, beside.z)
      await a.activateEntityAt(villager, villager.position.offset(0, 1, 0)).catch(() => {})
      const opened = await waitFor(() => a.currentWindow, { timeout: 4000, what: 'mobile shop window' }).then(() => true).catch(() => false)
      const title = opened ? JSON.stringify(a.currentWindow.title) : null
      const cats = opened ? a.currentWindow.slots.filter(x => x && /Extras/.test(itemName(x))).length : 0
      if (opened) await a.closeWindow(a.currentWindow)
      t.check('Mobile Shop: right-click opens the BedWars shop', opened && cats === 1, { opened, title })
      // vanishes after 20 s
      const tGone = await poll(async () => (await count(t, '@e[type=villager,name="Mobile Shop"]')) === 0 && Date.now(), { timeout: 30000, step: 200, what: 'shop villager to vanish' }).catch(() => null)
      const seconds = tGone ? (tGone - tPlaced) / 1000 : null
      t.check('Mobile Shop: disappears after 20 s', seconds !== null && seconds > 19.2 && seconds < 21.5, { seconds: seconds && r2(seconds) })
    }

    // ============================================================== Rescue Platform
    if (want('platform')) state.voidSpot = await findVoid()
    if (want('platform')) {
      if (!state.voidSpot) throw new Error('no void spot found for the Rescue Platform test')
      const vs = state.voidSpot
      await hold(a, 'nether_star')
      await tp(t, a, vs.x, WALK_Y + 31, vs.z) // far away from every island: void below
      await waitFor(() => a.entity.velocity.y < -0.3, { timeout: 5000, what: 'falling' })
      await sleep(500)
      const yUse = a.entity.position.y
      const t0 = Date.now()
      await rightClick(a)
      await sleep(1000)
      const scan = () => {
        const found = []
        const cpos = a.entity.position
        for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) for (let dy = -4; dy <= 2; dy++) {
          const blk = a.blockAt(new Vec3(Math.floor(cpos.x) + dx, Math.floor(yUse) + dy, Math.floor(cpos.z) + dz))
          if (blk && blk.name !== 'air') found.push({ n: blk.name, dx, dy, dz })
        }
        return found
      }
      const blocks = scan()
      await sleep(1000)
      const stands = a.entity.onGround
      const yStand = a.entity.position.y
      const layers = [...new Set(blocks.map(x => x.dy))]
      t.check('Rescue Platform: builds a platform under the falling player that catches them',
        blocks.length >= 5 && stands && countItem(a, 'nether_star') === 1 && yStand > MAP.voidY + 5 && dist2(a.entity.position, vs) < 4, { blocks: blocks.length, names: [...new Set(blocks.map(x => x.n))], layersDyFromUse: layers, yUse: r1(yUse), yStand: r1(yStand), onGround: stands, stars: countItem(a, 'nether_star') })
      const extent = blocks.length ? [Math.min(...blocks.map(x => x.dx)), Math.max(...blocks.map(x => x.dx)), Math.min(...blocks.map(x => x.dz)), Math.max(...blocks.map(x => x.dz))] : null
      t.log('platform extent dx/dz', extent)
      // a second star right away is on cooldown (shop: delay 5)
      const t1 = Date.now()
      await rightClick(a)
      await sleep(700)
      t.log('second star within 2 s: chat', chatSince(a, t1, /./), 'stars', countItem(a, 'nether_star'))
      t.check('Rescue Platform: a second use within the cooldown is refused (message, star kept)', chatSince(a, t1, /wait /).length === 1 && countItem(a, 'nether_star') === 1,
        { chat: chatSince(a, t1, /./), stars: countItem(a, 'nether_star') })
      // measure break time, then save the player before the platform disappears
      const placedAt = t0 + 150
      const probeAt = new Vec3(Math.floor(vs.x), Math.floor(yUse) + (blocks[0] ? blocks[0].dy : -1), Math.floor(vs.z))
      await sleep(2500)
      await tp(t, a, FA.home.x, FA.home.y, FA.home.z)
      const gone = await waitFor(() => (a.blockAt(probeAt) || { name: 'air' }).name === 'air' && Date.now(), { timeout: 20000, step: 100, what: 'platform to break' }).catch(() => null)
      const seconds = gone ? (gone - placedAt) / 1000 : null
      t.check('Rescue Platform: breaks again after ~10 s', seconds !== null && seconds > 8.5 && seconds < 12, { seconds: seconds && r2(seconds) })
    }

    // ============================================================== TNT
    if (want('tnt')) {
      const enemy = [b, c, d].find(x => teams[x.username] !== teamA)
      const eteam = teams[enemy.username]
      const place = FA.cell(0, -3); const tntCell = FA.cell(0, -5); const foeCell = FA.cell(0, -7) // placer and enemy both stand 2 blocks from the TNT
      await t.server.cmd(`effect give ${a.username} minecraft:instant_health 1 10 true`)
      await tp(t, a, place.x, WALK_Y, place.z)
      await tp(t, enemy, foeCell.x, WALK_Y, foeCell.z)
      let enemyDeaths = 0
      enemy.on('death', () => enemyDeaths++)
      await sleep(900)
      const hpE00 = await health(t, enemy)
      // control: a plain vanilla primed TNT (no BedWars property) next to the enemy, to tell "explosions never hurt" from "the shop TNT does not hurt"
      await t.server.cmd(`summon minecraft:tnt ${foeCell.x} ${WALK_Y + 0.5} ${foeCell.z + (foeCell.z - tntCell.z) * 0.0 + 1} {fuse:20}`)
      await sleep(2000)
      const hpEctl = await health(t, enemy)
      const ctlDeaths = enemyDeaths
      t.log('TNT control (vanilla primed tnt 1 block from the enemy): enemy hp', hpE00, '->', hpEctl, 'deaths', ctlDeaths)
      state.tntControl = { before: hpE00, after: hpEctl, deaths: ctlDeaths }
      t.check('TNT control: a plain explosion next to a player does damage (world difficulty is not Peaceful)', hpEctl < hpE00 || ctlDeaths > 0,
        { enemyHp: [hpE00, hpEctl], deaths: ctlDeaths, difficulty: state0.difficultyAtStart })
      await t.server.cmd(`effect give ${enemy.username} minecraft:instant_health 1 10 true`)
      await sleep(600)
      if (enemyDeaths) { await waitRespawn(t, enemy, eteam) }
      await tp(t, enemy, foeCell.x, WALK_Y, foeCell.z)
      await sleep(1500)
      await t.server.cmd(`effect give ${a.username} minecraft:instant_health 1 10 true`)
      await sleep(900)
      const deathsBeforeShopTnt = enemyDeaths
      const hpA0 = await health(t, a)
      const hpE0 = await health(t, enemy)
      const posE0 = await serverPos(t, enemy)
      const hpTrace = []
      const yTrace = []
      const tracer = setInterval(() => { health(t, enemy).then(h => hpTrace.push(h)).catch(() => {}); serverPos(t, enemy).then(sp => sp && yTrace.push(sp.y)).catch(() => {}) }, 250)
      await hold(a, 'tnt')
      await look(a, tntCell.x, WALK_Y + 0.5, tntCell.z)
      const ground = a.blockAt(new Vec3(tntCell.bx, WALK_Y - 1, tntCell.bz))
      await a._genericPlace(ground, new Vec3(0, 1, 0), { swingArm: 'right' })
      const t0 = Date.now()
      await sleep(300)
      const primed = await count(t, '@e[type=tnt]')
      const blockAfter = a.blockAt(new Vec3(tntCell.bx, WALK_Y, tntCell.bz)).name
      const gone = await poll(async () => (await count(t, '@e[type=tnt]')) === 0 && Date.now(), { timeout: 12000, step: 100, what: 'tnt to explode' }).catch(() => null)
      const fuse = gone ? (gone - t0) / 1000 : null
      await sleep(800)
      const hpA1 = await health(t, a)
      const hpE1 = await health(t, enemy)
      const floorAfter = a.blockAt(new Vec3(tntCell.bx, WALK_Y - 1, tntCell.bz)).name
      const posA = await serverPos(t, a)
      clearInterval(tracer)
      const posE1 = await serverPos(t, enemy)
      t.log('TNT enemy hp trace', hpTrace.join(','), 'enemy pos before/after', JSON.stringify(posE0), JSON.stringify(posE1), 'tnt cell', JSON.stringify(tntCell))
      t.check('TNT: ignites by itself the moment it is placed (primed entity, no TNT block left)', primed === 1 && blockAfter !== 'tnt' && countItem(a, 'tnt') === 0, { primed, blockAfter })
      t.check('TNT: explodes after the 4 s fuse from the shop', fuse !== null && fuse > 3.5 && fuse < 5.0, { fuseSeconds: fuse && r2(fuse) })
      // "hurt" means the explosion itself took health: the polled health dropped below the starting value, or the enemy died while he had never
      // been below the void-kill height (being blown into the void must not count as TNT damage)
      const finite = hpTrace.filter(Number.isFinite)
      const minHp = finite.length ? Math.min(...finite) : NaN
      const minY = yTrace.length ? Math.min(...yTrace) : NaN
      const diedByBlast = enemyDeaths > deathsBeforeShopTnt && !(minY < MAP.voidY + 3)
      t.check('TNT: hurts the enemy next to it (health loss from the blast, not a fall into the void)',
        minHp < hpE0 || diedByBlast, { enemyHp: [hpE0, hpE1], minPolledHp: minHp, minPolledY: minY, voidY: MAP.voidY, enemyDeathsDuringShopTnt: enemyDeaths - deathsBeforeShopTnt, hpTrace: hpTrace.join(',') })
      // damage-placer: false is only meaningful when explosions can hurt at all (control above); otherwise this check must not pass by default
      const explosionsHurt = state.tntControl && (state.tntControl.after < state.tntControl.before || state.tntControl.deaths > 0)
      t.check('TNT: does not hurt the placer (damage-placer: false); only meaningful if explosions hurt at all',
        hpA1 >= hpA0 && !!explosionsHurt, { placerHp: [hpA0, hpA1], placerPos: posA, explosionsHurtInControl: !!explosionsHurt })
      t.check('TNT: the island floor survives (player-placed TNT only breaks player-placed blocks)', floorAfter !== 'air', { floorAfter })
      if (enemyDeaths) await waitRespawn(t, enemy, eteam)
      await tp(t, enemy, MAP.teams[eteam].spawn.x, MAP.teams[eteam].spawn.y, MAP.teams[eteam].spawn.z)
      await tp(t, a, FA.home.x, FA.home.y, FA.home.z)
    }

    // ============================================================== Ender pearl
    if (want('pearl')) {
      await t.server.cmd(`effect give ${a.username} minecraft:instant_health 1 10 true`)
      await tp(t, a, FA.home.x, FA.home.y, FA.home.z)
      // a bot left on the spawn (by the probe or a respawn) stands inside the thrower and the pearl hits it on its first
      // tick. Real clients push themselves apart; mineflayer does not, and the server sends players no push (vanilla).
      for (const o of bots) {
        if (o === a || !o.entity || dist2(o.entity.position, FA.home) > 1.5) continue
        const aside = FA.cell(-2, 3)
        await tp(t, o, aside.x, WALK_Y, aside.z)
      }
      await sleep(800)
      await hold(a, 'ender_pearl')
      // land on a stone platform 25 blocks ahead (towards the middle); simulate the pearl (speed 1.5, drag 0.99, gravity 0.03) to find the pitch
      const dir = FA.toCentre
      const target = { x: FA.home.x + dir.x * 25, z: FA.home.z + dir.z * 25 }
      const fillA = `${Math.floor(target.x) - 8} ${WALK_Y - 1} ${Math.floor(target.z) - 8}`
      const fillB = `${Math.floor(target.x) + 8} ${WALK_Y - 1} ${Math.floor(target.z) + 8}`
      const targetFloor = a.blockAt(new Vec3(Math.floor(target.x), WALK_Y - 1, Math.floor(target.z)))
      const targetWasAir = !targetFloor || targetFloor.name === 'air'
      if (targetWasAir) await t.server.cmd(`fill ${fillA} ${fillB} minecraft:stone replace minecraft:air`)
      const eye = WALK_Y + 1.62
      let bestPitch = 0.2; let bestErr = 1e9
      for (let pitch = 0.02; pitch < 0.9; pitch += 0.002) {
        let y = eye; let h = 0; let vy = 1.5 * Math.sin(pitch); let vh = 1.5 * Math.cos(pitch)
        for (let i = 0; i < 400 && y > WALK_Y; i++) { y += vy; h += vh; vy = vy * 0.99 - 0.03; vh *= 0.99 }
        const err = Math.abs(h - 25)
        if (err < bestErr) { bestErr = err; bestPitch = pitch }
      }
      await look(a, FA.home.x + dir.x * 400, eye, FA.home.z + dir.z * 400)
      await a.look(a.entity.yaw, bestPitch, true)
      await sleep(150)
      const t0 = Date.now()
      const hp0 = await health(t, a)
      const pearlTrace = []
      const pearlTracer = setInterval(() => { health(t, a).then(h => pearlTrace.push(h)).catch(() => {}) }, 120)
      const clientHp = []
      const onHealth = () => clientHp.push(a.health)
      a.on('health', onHealth)
      await rightClick(a)
      await poll(async () => dist2(a.entity.position, FA.home) > 5, { timeout: 8000, what: 'pearl teleport' }).catch(() => {})
      const tTp = Date.now()
      await sleep(1200)
      const pos = a.entity.position
      const hp1 = await health(t, a)
      clearInterval(pearlTracer); a.off('health', onHealth)
      t.log('pearl server hp trace', pearlTrace.join(','), 'client health events', clientHp.join(','))
      t.check('Ender Pearl: teleports the thrower to the landing spot, pearl consumed',
        dist2(pos, target) < 6 && Math.abs(pos.y - WALK_Y) < 2 && countItem(a, 'ender_pearl') === 0,
        { pos: [r1(pos.x), r1(pos.y), r1(pos.z)], target: [r1(target.x), r1(target.z)], pitchDeg: r1(bestPitch * 180 / Math.PI), flightSeconds: r2((tTp - t0) / 1000), pearls: countItem(a, 'ender_pearl') })
      t.check('Ender Pearl: landing costs 5 health like in 1.8', hp0 - hp1 === 5, { hp0, hp1 })
      if (targetWasAir) await t.server.cmd(`fill ${fillA} ${fillB} minecraft:air replace minecraft:stone`)
      await tp(t, a, FA.home.x, FA.home.y, FA.home.z)
    }

    // ============================================================== Team Chest
    if (want('chest')) {
      const mate = [b, c, d].find(x => teams[x.username] === teamA)
      const foe = [b, c, d].find(x => teams[x.username] !== teamA)
      const chestCell = FA.cell(-2, 5); const placerCell = FA.cell(-2, 2); const userCell = FA.cell(-2, 3)
      await tp(t, a, placerCell.x, WALK_Y, placerCell.z)
      await hold(a, 'ender_chest')
      const ground = a.blockAt(new Vec3(chestCell.bx, WALK_Y - 1, chestCell.bz))
      await a._genericPlace(ground, new Vec3(0, 1, 0), { swingArm: 'right' })
      await sleep(800)
      const chest = a.blockAt(new Vec3(chestCell.bx, WALK_Y, chestCell.bz))
      t.check('Team Chest: ender chest can be placed', chest && chest.name === 'ender_chest', { block: chest && chest.name })
      await t.server.cmd(`give ${a.username} minecraft:diamond 5`)
      await waitFor(() => countItem(a, 'diamond') === 5, { timeout: 4000, what: 'diamonds' })
      const openChest = async bot => {
        await tp(t, bot, userCell.x, WALK_Y, userCell.z)
        const ch = bot.blockAt(new Vec3(chestCell.bx, WALK_Y, chestCell.bz))
        await bot.lookAt(ch.position.offset(0.5, 0.5, 0.5), true)
        if (bot.currentWindow) bot.closeWindow(bot.currentWindow)
        await bot.activateBlock(ch)
        await waitFor(() => bot.currentWindow, { timeout: 4000, what: `${bot.username} chest window` }).catch(() => {})
        await sleep(500)
        return bot.currentWindow
      }
      const w = await openChest(a)
      let deposited = 0
      let titleA = null
      if (w) {
        titleA = JSON.stringify(w.title)
        const slot = w.slots.findIndex((x, i) => x && x.name === 'diamond' && i >= w.inventoryStart)
        await a.clickWindow(slot, 0, 1)
        await sleep(600)
        deposited = w.slots.slice(0, w.inventoryStart).filter(x => x && x.name === 'diamond').reduce((n, x) => n + x.count, 0)
        await a.closeWindow(w)
      }
      t.check('Team Chest: placer can open it and put items in', !!w && deposited === 5, { title: titleA, depositedDiamonds: deposited })
      await sleep(400)
      const wm = await openChest(mate)
      const mateSees = wm ? wm.slots.slice(0, wm.inventoryStart).filter(x => x && x.name === 'diamond').reduce((n, x) => n + x.count, 0) : null
      if (wm) await mate.closeWindow(wm)
      t.check('Team Chest: a teammate sees the same items', mateSees === 5, { mate: mate.username, sees: mateSees })
      await tp(t, mate, MAP.teams[teamA].spawn.x, MAP.teams[teamA].spawn.y, MAP.teams[teamA].spawn.z)
      await sleep(300)
      const wf = await openChest(foe)
      const foeSees = wf ? wf.slots.slice(0, wf.inventoryStart).filter(x => x && x.name === 'diamond').reduce((n, x) => n + x.count, 0) : 0
      if (wf) await foe.closeWindow(wf)
      t.check('Team Chest: an enemy does not see the team items', foeSees === 0, { foe: foe.username, windowOpened: !!wf, sees: foeSees })
      const fh = MAP.teams[teams[foe.username]].spawn
      await tp(t, foe, fh.x, fh.y, fh.z)
    }

    // ============================================================== spectator (late joiner)
    if (want('spectator')) {
      await sleep(500)
      await t.server.cmd(`give ${e.username} minecraft:firework_rocket 1`)
      await t.server.cmd(`give ${e.username} minecraft:chicken_spawn_egg 1`)
      await t.server.cmd(`give ${e.username} minecraft:armor_stand 1`)
      const slotRef = (bot, name) => { const it = bot.inventory.items().find(i => i.name === name); return it ? `container.${it.slot >= 36 ? it.slot - 36 : it.slot}` : null }
      await t.server.cmd(`give ${e.username} minecraft:nether_star 1`) // (the Rescue Platform is recognised by the item id)
      await sleep(500)
      const names = ['firework_rocket', 'chicken_spawn_egg', 'armor_stand', 'nether_star']
      const gameType = async () => { const r = await t.server.cmd(`data get entity ${e.username} playerGameType`); const m = /(\d+)\s*$/.exec(r.trim()); return m ? Number(m[1]) : null }
      const snapshot = (c, radius, below) => { // block names around a fixed point (a Rescue Platform would change them)
        const out = new Map()
        for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) for (let dy = -below; dy <= 2; dy++) {
          const pos = new Vec3(Math.floor(c.x) + dx, Math.floor(c.y) + dy, Math.floor(c.z) + dz); const blk = e.blockAt(pos)
          out.set(pos.toString(), blk ? blk.name : '?')
        }
        return out
      }
      // airborne: the spectator is dropped from high up, so that the Parachute and the Rescue Platform would really work if they were allowed to
      const runItems = async (label, expectType, airborne) => {
        const typeNow = await gameType()
        const start = e.entity.position.clone()
        const before = snapshot(start, airborne ? 4 : 6, airborne ? 80 : 6)
        const t0 = Date.now()
        const r = recorder(e)
        let chickensSeen = 0
        for (const name of names) {
          const it = e.inventory.items().find(i => i.name === name)
          if (!it) { t.log('spectator misses', name, invSummary(e)); continue }
          if (it.slot >= 36) e.setQuickBarSlot(it.slot - 36)
          await sleep(200)
          if (name === 'armor_stand' && !airborne && expectType === 0) { // also try the real placement on a block
            const under = e.blockAt(new Vec3(Math.floor(e.entity.position.x), Math.floor(e.entity.position.y) - 1, Math.floor(e.entity.position.z)))
            if (under) await e._genericPlace(under, new Vec3(0, 1, 0), { swingArm: 'right' })
          }
          await rightClick(e)
          await sleep(400)
          chickensSeen = Math.max(chickensSeen, await count(t, '@e[type=chicken]'))
        }
        await sleep(airborne ? 1500 : 5000)
        const after = snapshot(start, airborne ? 4 : 6, airborne ? 80 : 6)
        r.stop()
        let changed = 0
        for (const [k, v] of after) if (before.get(k) !== v) changed++
        const moved = e.entity.position.distanceTo(start)
        const maxUp = Math.max(...r.samples.map(x => x.y - start.y))
        const maxDy = airborne ? maxUp : Math.max(...r.samples.map(x => Math.abs(x.y - start.y)))
        const shops = await count(t, '@e[type=villager,name="Mobile Shop"]')
        t.check(`spectator${label}: Teleporter/Parachute/Mobile Shop/Rescue Platform do nothing`,
          typeNow === expectType && chatSince(e, t0, /Teleport|Parachute|air|Platform|seconds/).length === 0 && chickensSeen === 0 && shops === 0 && maxDy < 2 &&
          changed === 0 && !r.forced.some(f => f.t > t0 + 500) && names.every(n => countItem(e, n) >= 1),
          { gameType: typeNow, expectedGameType: expectType, airborne, moved: r1(moved), maxDy: r1(maxDy), chickensSeen, shops, blocksChangedAround: changed, items: invSummary(e), chat: chatSince(e, t0, /./) })
      }
      await runItems('', 3, false)
      // harder variant: the spectator is put into survival mode above the middle island, i.e. a normal player who is not in any team of the running game
      await t.server.cmd(`gamemode survival ${e.username}`)
      await sleep(500)
      await t.server.cmd(`effect give ${e.username} minecraft:slow_falling 120 0 true`) // stays in the air for the whole item round and survives the landing
      await t.server.cmd(`tp ${e.username} ${CENTRE.x} ${WALK_Y + 85} ${CENTRE.z}`)
      await sleep(800)
      t.check('spectator test setup: the survival-mode non-team player is really in the air', !e.entity.onGround, { y: r1(e.entity.position.y) })
      await runItems(' (survival mode, no team, in the air)', 0, true)
      await t.server.cmd(`effect clear ${e.username}`)
      await sleep(500)
      await t.server.cmd(`tp ${e.username} ${CENTRE.x} ${WALK_Y + 1} ${CENTRE.z}`)
      await sleep(1500)
      await runItems(' (survival mode, no team, on the ground)', 0, false)
      await t.server.cmd(`gamemode spectator ${e.username}`)
      await t.server.cmd(`tp ${e.username} ${MAP.specSpawn.x} ${MAP.specSpawn.y} ${MAP.specSpawn.z}`)
    }

    t.check('no stray parachute chickens at the end', (await count(t, '@e[type=chicken]')) === 0)
  }
}
