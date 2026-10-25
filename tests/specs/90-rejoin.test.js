// Rejoin of a running game: a player whose connection dropped comes back INTO THEIR TEAM (LanBedWars "Rejoin").
//
// Three 1.8.9 bots, team of 2 against a team of 1; grace period shortened to 15 s for the test.
//   1. a member of the 2-player team disconnects and reconnects -> same team, team spawn, survival, respawn
//      protection, empty inventory; team chat, scoreboard count, building and fighting work
//   2. the enemy destroys the bed of that team; the player disconnects/reconnects again -> still back in the team
//      (a teammate is alive, so the team is in the game)
//   3. a player who died without a bed (spectator) disconnects and reconnects -> stays a spectator
//   4. the lone player of the other team disconnects -> the team is NOT eliminated during the grace period and the
//      game goes on; reconnect inside the grace period -> back in the team at its spawn
//   5. the lone player disconnects again and stays away -> after the grace period the team is eliminated, the
//      other team wins; reconnecting afterwards does not put the player back into the team
const { MAP, waitFor, waitForGameStart, teamOf, countItem, invSummary, plain, Vec3, sleep } = require('../harness/bots')

const GRACE = 15

// ------------------------------------------------------------------ map geometry (from the arena file, tests/play/map.js)
const SPAWN = team => MAP.teams[team].spawn
/** Unit axis from a team's spawn towards the other team (snapped to x or z) and the sideways axis. */
function axes (team) {
  const a = SPAWN(team); const b = SPAWN(MAP.other(team))
  const dx = b.x - a.x; const dz = b.z - a.z
  const u = Math.abs(dx) > Math.abs(dz) ? { x: Math.sign(dx), z: 0 } : { x: 0, z: Math.sign(dz) }
  return { u, v: { x: -u.z, z: u.x } }
}
/** Spot du blocks towards the enemy and dv sideways from a team spawn, at walking height. */
function at (team, du, dv = 0) {
  const sp = SPAWN(team); const { u, v } = axes(team)
  return { x: sp.x + u.x * du + v.x * dv, y: sp.y, z: sp.z + u.z * du + v.z * dv }
}
/** Minecraft yaw (degrees) looking along a horizontal direction. */
const yawFor = d => Math.atan2(-d.x, d.z) * 180 / Math.PI
const towardsEnemy = team => yawFor(axes(team).u)
const towardsHome = team => yawFor({ x: -axes(team).u.x, z: -axes(team).u.z })

const pos = bot => bot.entity.position
const fmt = p => `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`
const chatSince = (bot, since, re) => bot.chatLog.filter(c => c.t >= since && re.test(c.m)).map(c => c.m)

// ------------------------------------------------------------------ helpers

async function blockIs (t, x, y, z, id) {
  const r = await t.server.cmd(`execute in minecraft:overworld if block ${x} ${y} ${z} ${id}`)
  if (/passed/i.test(r)) return true
  if (/failed/i.test(r)) return false
  return `?${r}`
}
const isAir = (t, x, y, z) => blockIs(t, x, y, z, 'minecraft:air')
const hasBed = (t, x, y, z) => blockIs(t, x, y, z, '#minecraft:beds')

async function tp (t, bot, x, y, z, yaw = 0, pitch = 0) {
  await t.server.cmd(`tp ${bot.username} ${x} ${y} ${z} ${yaw} ${pitch}`)
}

async function srvHealth (t, bot) {
  const r = await t.server.cmd(`data get entity ${bot.username} Health`)
  const m = /entity data: (-?[\d.]+)f?/.exec(r)
  return m ? Number(m[1]) : NaN
}
async function srvGameType (t, bot) {
  const r = await t.server.cmd(`data get entity ${bot.username} playerGameType`)
  const m = /: (\d)\b/.exec(r)
  return m ? Number(m[1]) : null
}
async function srvPos (t, bot) {
  const r = await t.server.cmd(`data get entity ${bot.username} Pos`)
  const m = /\[(-?[\d.]+)d, (-?[\d.]+)d, (-?[\d.]+)d\]/.exec(r)
  return m ? { x: +m[1], y: +m[2], z: +m[3] } : null
}

async function hit (att, vic, n = 1, gap = 600, trailingWait = true) {
  for (let i = 0; i < n; i++) {
    const e = await waitFor(() => att.players[vic.username] && att.players[vic.username].entity, { timeout: 5000, what: `${att.username} to see ${vic.username}` })
    await att.lookAt(e.position.offset(0, 1.2, 0), true)
    att.attack(e)
    if (trailingWait || i < n - 1) await sleep(gap)
  }
}

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

/** Drops the victim right above the void-kill height under its own island. */
async function voidDrop (t, vic, team) {
  const died = new Promise(resolve => vic.once('death', () => resolve(true)))
  await tp(t, vic, SPAWN(team).x, MAP.voidY + 1, SPAWN(team).z)
  return Promise.race([died, sleep(8000).then(() => null)])
}

/** The harness records the sidebar of every bot from its first packet on (bot.scoreRaw). */
function watchScores (bot) {}
/** { 'Rot': 2, 'Blau': 1 } from the team lines of the sidebar ("✔Rot" / "✘Blau"). */
function teamCounts (bot) {
  const st = bot.scoreRaw
  const o = (st && st.scores[st.sidebarObjective]) || {}
  const out = {}
  for (const [k, v] of Object.entries(o)) {
    const m = /(Rot|Blau)\s*$/.exec(plain(k).trim())
    if (m) out[m[1]] = v
  }
  return out
}

/** Closes the connection and waits until the server has noticed. */
async function disconnect (bot) {
  await new Promise(resolve => {
    bot.once('end', resolve)
    try { bot.quit() } catch (e) { resolve() }
    setTimeout(resolve, 3000)
  })
  await sleep(800)
}

const atTeamSpawn = (bot, team) =>
  bot.game.gameMode === 'survival' && Math.hypot(pos(bot).x - SPAWN(team).x, pos(bot).z - SPAWN(team).z) < 3 && Math.abs(pos(bot).y - SPAWN(team).y) < 2
const tpAt = (t, bot, p, yaw = 0) => tp(t, bot, p.x, p.y, p.z, yaw)

// ------------------------------------------------------------------ spec

module.exports = {
  name: 'rejoin',
  timeout: 285000,
  // grace period shortened at runtime (/bwconfig grace-seconds, config/bedwars.yml rejoin.grace-seconds is the default)
  server: { pauseCountdown: 10, settings: { 'grace-seconds': GRACE } },

  async run (t) {
    const phase = async (name, fn) => {
      t.log(`---- phase: ${name}`)
      try { await fn() } catch (e) {
        t.check(`phase "${name}" ran without an exception`, false, String(e.stack || e).split('\n').slice(0, 4).join(' | '))
      }
    }
    const reconnect = async name => {
      const b = await t.bot(name)
      watchScores(b)
      return b
    }

    // ---------------------------------------------------------------- game start
    let bots = [await t.bot('RjA'), await t.bot('RjB'), await t.bot('RjC')]
    bots.forEach(watchScores)
    const teams = await Promise.all(bots.map(b => waitForGameStart(b)))
    const count = n => teams.filter(x => x === n).length
    const balanced = (count('Rot') === 2 && count('Blau') === 1) || (count('Rot') === 1 && count('Blau') === 2)
    t.check('game starts and teams are 2:1', balanced, teams)
    if (!balanced) return
    const T2 = count('Rot') === 2 ? 'Rot' : 'Blau'
    const T1 = T2 === 'Rot' ? 'Blau' : 'Rot'
    const names = bots.map(b => b.username)
    const duoNames = names.filter((n, i) => teams[i] === T2)
    const loneName = names.find((n, i) => teams[i] === T1)
    let P1 = bots.find(b => b.username === duoNames[0]) // the player who loses the connection
    let P2 = bots.find(b => b.username === duoNames[1]) // his teammate
    let Q = bots.find(b => b.username === loneName) // the other team
    t.log(`roles: P1=${P1.username} P2=${P2.username} (team ${T2}), Q=${Q.username} (team ${T1})`)
    await sleep(2500)

    // ---------------------------------------------------------------- 1. member of the 2-player team
    await phase('member rejoins', async () => {
      const before = teamCounts(Q)
      t.check('scoreboard (seen by the enemy) counts 2 players in the team before the disconnect', before[T2] === 2 && before[T1] === 1, before)

      // somewhere else than the spawn, with items, so a restored position or inventory would show
      await tpAt(t, P1, at(T2, 0, 2))
      await t.server.cmd(`give ${P1.username} minecraft:red_sandstone 64`)
      await waitFor(() => countItem(P1, 'red_sandstone') > 0, { timeout: 5000, what: 'sandstone' })
      await sleep(500)

      const quitAt = Date.now()
      await disconnect(P1)
      await sleep(1500)
      const during = teamCounts(Q)
      t.check('scoreboard shows 1 player in the team while the member is away', during[T2] === 1, during)
      t.check('the game goes on without him (teammate and enemy still on their islands)',
        atTeamSpawn(P2, T2) && atTeamSpawn(Q, T1) && chatSince(Q, quitAt, /gewonnen/).length === 0, { P2: fmt(pos(P2)), Q: fmt(pos(Q)) })

      const backAt = Date.now()
      P1 = await reconnect(P1.username)
      const spectated = []
      P1.on('forcedMove', () => spectated.push(P1.game.gameMode))
      const ok = await waitFor(() => atTeamSpawn(P1, T2), { timeout: 25000, what: 'P1 to be back at the team spawn' }).then(() => true, () => false)
      t.check('the reconnecting player is put back at the spawn of his own team in survival mode', ok,
        { ms: Date.now() - backAt, pos: fmt(pos(P1)), mode: P1.game.gameMode })
      t.check('he is on the same island as before (team %s)'.replace('%s', T2), teamOf(P1) === T2, fmt(pos(P1)))
      await sleep(800)
      t.check('server has him in survival mode (gamemode 0)', (await srvGameType(t, P1)) === 0)
      const sp = await srvPos(t, P1)
      t.check('server position is the team spawn, not the old position', !!sp && Math.hypot(sp.x - SPAWN(T2).x, sp.z - SPAWN(T2).z) < 2.5 && Math.abs(sp.y - SPAWN(T2).y) < 1.5, sp)
      t.check('he got the welcome-back message naming the team', chatSince(P1, backAt, new RegExp(`Willkommen zurück in Team ${T2}`)).length > 0, P1.chatLog.slice(-6).map(c => c.m))
      t.check('his teammate is told that he is back', chatSince(P2, backAt, new RegExp(`${P1.username}.* ist wieder im Spiel`)).length > 0)
      t.check('the enemy is not told', chatSince(Q, backAt, /ist wieder im Spiel/).length === 0)
      t.check('inventory is empty like after a death (no old items, no spectator leave item)', P1.inventory.items().length === 0, invSummary(P1))
      t.check('respawn protection runs after the rejoin', chatSince(P1, backAt, /Respawn Schutz/).length > 0, chatSince(P1, backAt, /Respawn/))
      const after = teamCounts(Q)
      t.check('scoreboard (seen by the enemy) counts 2 players in the team again', after[T2] === 2, after)
      await sleep(1000)
      const own = teamCounts(P1)
      t.check('his own sidebar shows both teams with their player counts', own[T2] === 2 && own[T1] === 1, own)

      // team chat: delivered to the team, as [TEAM], not to the enemy
      const chatAt = Date.now()
      P1.chat('hallo-team-p1')
      await sleep(800)
      P2.chat('hallo-team-p2')
      await sleep(1000)
      t.check('his chat goes to the team as team chat ([TEAM])', chatSince(P2, chatAt, /\[TEAM\].*hallo-team-p1/).length > 0, P2.chatLog.slice(-4).map(c => c.m))
      t.check('the chat of his teammate reaches him as team chat', chatSince(P1, chatAt, /\[TEAM\].*hallo-team-p2/).length > 0, P1.chatLog.slice(-4).map(c => c.m))
      t.check('the enemy sees neither', chatSince(Q, chatAt, /hallo-team/).length === 0, chatSince(Q, chatAt, /hallo-team/))

      // building: on the floor one block next to him (towards the enemy)
      await t.server.cmd(`give ${P1.username} minecraft:red_sandstone 64`)
      await waitFor(() => countItem(P1, 'red_sandstone') > 0, { timeout: 5000, what: 'sandstone' })
      await P1.equip(P1.inventory.items().find(i => i.name === 'red_sandstone'), 'hand')
      const stand = at(T2, 0, -2)
      const target = at(T2, 1, -2)
      const tx = Math.floor(target.x); const ty = Math.floor(target.y); const tz = Math.floor(target.z)
      await tpAt(t, P1, stand)
      await sleep(600)
      let placeErr = null
      await P1.placeBlock(P1.blockAt(new Vec3(tx, ty - 1, tz)), new Vec3(0, 1, 0)).catch(e => { placeErr = e.message })
      await sleep(300)
      t.check('he can place blocks (server confirms)', (await blockIs(t, tx, ty, tz, 'minecraft:red_sandstone')) === true && !placeErr, placeErr)

      // fighting: protected at first, then he takes damage from the enemy and deals damage; the teammate cannot hurt him
      await sleep(Math.max(0, 3600 - (Date.now() - backAt)))
      await tpAt(t, P1, at(T2, 0), towardsEnemy(T2))
      await tpAt(t, Q, at(T2, 1.5), towardsHome(T2))
      await sleep(1200)
      const hp0 = await srvHealth(t, P1)
      await hit(Q, P1, 2, 650, false)
      await sleep(150)
      const hp1 = await srvHealth(t, P1)
      t.check('the enemy can hurt him (he is a normal player, not a spectator)', hp0 === 20 && hp1 < hp0 && hp1 > 0, { hp0, hp1 })
      const qhp0 = await srvHealth(t, Q)
      await tpAt(t, Q, at(T2, 1.5), towardsHome(T2))
      await hit(P1, Q, 2, 650, false)
      await sleep(150)
      const qhp1 = await srvHealth(t, Q)
      t.check('he can hurt the enemy', qhp1 < qhp0, { qhp0, qhp1 })
      await tpAt(t, P2, at(T2, 1.2), towardsHome(T2))
      await tpAt(t, Q, at(T1, 0)) // out of the way
      await sleep(1000)
      const hpFriendly0 = await srvHealth(t, P1)
      await hit(P2, P1, 3, 600, false)
      await sleep(150)
      const hpFriendly1 = await srvHealth(t, P1)
      t.check('his teammate cannot hurt him (no friendly fire: he really is in the same team)', hpFriendly1 === hpFriendly0, { hpFriendly0, hpFriendly1 })
    })

    // ---------------------------------------------------------------- 2. bed destroyed, teammate alive
    await phase('bed destroyed, teammate alive', async () => {
      await tpAt(t, P1, at(T2, 0))
      await tpAt(t, P2, at(T2, 0))
      // the bed halves and a free spot next to them (from the arena file's bed position)
      const bed = MAP.teams[T2].bed
      const halves = []
      for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if ((await hasBed(t, bed.x + dx, bed.y, bed.z + dz)) === true) halves.push({ x: bed.x + dx, y: bed.y, z: bed.z + dz })
      let standAt = null
      for (const h of halves) {
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const c = { x: h.x + dx, y: h.y, z: h.z + dz }
          if (standAt || halves.some(o => o.x === c.x && o.z === c.z)) continue
          if ((await isAir(t, c.x, c.y, c.z)) === true && (await isAir(t, c.x, c.y + 1, c.z)) === true && (await isAir(t, c.x, c.y - 1, c.z)) === false) standAt = c
        }
      }
      t.check('setup: the bed (2 halves) and a free spot next to it are found from the arena file', halves.length === 2 && !!standAt, { halves, standAt })
      if (!standAt) return
      await tp(t, Q, standAt.x + 0.5, standAt.y, standAt.z + 0.5)
      await t.server.cmd(`give ${Q.username} minecraft:iron_pickaxe 1`)
      await waitFor(() => countItem(Q, 'iron_pickaxe') > 0, { timeout: 5000, what: 'pickaxe' })
      await Q.equip(Q.inventory.items().find(i => i.name === 'iron_pickaxe'), 'hand')
      await sleep(1000)
      const h0 = halves[0]
      await digUntil(Q, Q.blockAt(new Vec3(h0.x, h0.y, h0.z)), () => isAir(t, h0.x, h0.y, h0.z), 6000)
      await sleep(300)
      let gone = true
      for (const h of halves) if ((await isAir(t, h.x, h.y, h.z)) !== true) gone = false
      t.check('the enemy destroyed the bed of the 2-player team', gone)
      await sleep(800)
      t.check('the team line of the scoreboard shows the lost bed', Object.keys(Q.scoreRaw.scores[Q.scoreRaw.sidebarObjective] || {}).some(k => new RegExp(`✘\\s*${T2}`).test(plain(k))))

      await tpAt(t, P1, at(T2, 0, 2))
      await sleep(500)
      const quitAt = Date.now()
      await disconnect(P1)
      await sleep(1500)
      t.check('the game goes on while the bedless team has one player left', chatSince(Q, quitAt, /gewonnen/).length === 0 && atTeamSpawn(P2, T2) === true)
      const backAt = Date.now()
      P1 = await reconnect(P1.username)
      const ok = await waitFor(() => atTeamSpawn(P1, T2), { timeout: 25000, what: 'P1 back at the team spawn' }).then(() => true, () => false)
      t.check('without a bed but with a living teammate the player comes back into the team (team spawn, survival)', ok,
        { ms: Date.now() - backAt, pos: fmt(pos(P1)), mode: P1.game.gameMode })
      await sleep(800)
      t.check('server has him in survival mode', (await srvGameType(t, P1)) === 0)
      t.check('welcome-back message', chatSince(P1, backAt, new RegExp(`Willkommen zurück in Team ${T2}`)).length > 0)
      const counts = teamCounts(Q)
      t.check('scoreboard counts 2 players again (bed lost)', counts[T2] === 2, counts)
      // with the bed gone, the next death is final: proves he is a real, living team member
      const died = await voidDrop(t, P1, T2)
      t.check('he can die like any player', !!died)
      await sleep(1500)
      t.check('his death without a bed is final (spectator)', P1.game.gameMode === 'spectator' && (await srvGameType(t, P1)) === 3, P1.game.gameMode)
    })

    // ---------------------------------------------------------------- 3. dead player stays spectator
    await phase('dead player stays spectator', async () => {
      // P1 is spectator now (final death); the team has P2 left
      const quitAt = Date.now()
      await disconnect(P1)
      await sleep(1500)
      const backAt = Date.now()
      P1 = await reconnect(P1.username)
      await sleep(5000)
      const sp = await srvPos(t, P1)
      t.check('a player who died without a bed comes back as spectator', (await srvGameType(t, P1)) === 3, { mode: P1.game.gameMode })
      t.check('he is not put at the team spawn', !sp || Math.hypot(sp.x - SPAWN(T2).x, sp.z - SPAWN(T2).z) > 10, sp)
      t.check('no welcome-back message for him', chatSince(P1, backAt, /Willkommen zurück/).length === 0)
      t.check('the team still counts 1 player', teamCounts(Q)[T2] === 1, teamCounts(Q))
      t.check('the game is still running', chatSince(Q, quitAt, /gewonnen/).length === 0)
    })

    // ---------------------------------------------------------------- 4. lone player, grace period
    let loneQuitAt = 0
    await phase('lone player: reconnect inside the grace period', async () => {
      await tpAt(t, Q, at(T1, 0, 2)) // not at the spawn
      await sleep(500)
      const countsBefore = teamCounts(P2)
      loneQuitAt = Date.now()
      await disconnect(Q)
      await waitFor(() => chatSince(P2, loneQuitAt, /hat die Verbindung verloren/).length > 0, { timeout: 5000, what: 'grace message' })
        .then(() => t.check('the other team is told that the team stays in the game for the grace period',
          chatSince(P2, loneQuitAt, new RegExp(`Team ${T1} bleibt ${GRACE} Sekunden im Spiel`)).length > 0, chatSince(P2, loneQuitAt, /Verbindung/)),
        () => t.check('the other team is told that the team stays in the game for the grace period', false, P2.chatLog.slice(-5).map(c => c.m)))
      await sleep(4500)
      t.check('the game goes on although the team has no player (no win message, nobody teleported)',
        chatSince(P2, loneQuitAt, /gewonnen/).length === 0 && atTeamSpawn(P2, T2) === true, { P2: fmt(pos(P2)), mode: P2.game.gameMode })
      t.check('the empty team is still on the scoreboard with its bed', countsBefore[T1] === 1 && teamCounts(P2)[T1] === 0, { before: countsBefore, now: teamCounts(P2) })

      const backAt = Date.now()
      Q = await reconnect(Q.username)
      const ok = await waitFor(() => atTeamSpawn(Q, T1), { timeout: 25000, what: 'Q back at the team spawn' }).then(() => true, () => false)
      t.check('inside the grace period the lone player is back in his team at the team spawn', ok,
        { sinceQuitMs: Date.now() - loneQuitAt, pos: fmt(pos(Q)), mode: Q.game.gameMode })
      await sleep(800)
      t.check('server has him in survival mode', (await srvGameType(t, Q)) === 0)
      t.check('welcome-back message', chatSince(Q, backAt, new RegExp(`Willkommen zurück in Team ${T1}`)).length > 0)
      t.check('scoreboard counts him again', teamCounts(P2)[T1] === 1, teamCounts(P2))

      // the grace period is over for good: staying in the game must not end it when the original deadline passes
      await sleep(Math.max(0, loneQuitAt + (GRACE + 3) * 1000 - Date.now()))
      t.check('after the original deadline the team is still in the game (it is occupied again)',
        chatSince(P2, loneQuitAt, /gewonnen|ausgeschieden/).length === 0 && atTeamSpawn(Q, T1) === true, { mode: Q.game.gameMode, pos: fmt(pos(Q)) })
    })

    // ---------------------------------------------------------------- 5. lone player, grace period expires
    await phase('lone player: grace period expires', async () => {
      await sleep(1000)
      const quitAt = Date.now()
      await disconnect(Q)
      const elim = await waitFor(() => chatSince(P2, quitAt, /ist ausgeschieden/).length > 0, { timeout: GRACE * 1000 + 10000, what: 'elimination message' })
        .then(() => Date.now() - quitAt, () => null)
      t.check('the team is eliminated when the grace period is over (not earlier)', elim != null && elim >= (GRACE - 2) * 1000 && elim <= (GRACE + 5) * 1000, { elapsedMs: elim, graceSeconds: GRACE })
      const won = await waitFor(() => chatSince(P2, quitAt, /hat das Spiel in .* gewonnen/).length > 0, { timeout: 10000, what: 'win message' })
        .then(() => chatSince(P2, quitAt, /hat das Spiel in .* gewonnen/), () => null)
      t.check('the remaining team wins', !!won && won[0].includes(`Team ${T2} `), won)

      const backAt = Date.now()
      Q = await reconnect(Q.username)
      await sleep(6000)
      t.check('reconnecting after the grace period does not put him into the eliminated team', !atTeamSpawn(Q, T1) && chatSince(Q, backAt, /Willkommen zurück/).length === 0,
        { pos: fmt(pos(Q)), mode: Q.game.gameMode })
    })

    const errs = t.server.errors().filter(l => !/packetevents|api\.github\.com|Failed to parse packetevents version/.test(l))
    t.check('no server exceptions during the whole spec', errs.length === 0, errs.slice(0, 5))
    const logs = t.server.logs()
    t.check('server log has the grace-period line', /is empty, kept in the game for \d+ s so \w+ can rejoin/.test(logs))
  }
}
