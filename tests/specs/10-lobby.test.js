// Lobby and team flow.
//
// Server 1 (the runner's, lobby countdown 8 s):
//   fresh connection -> auto-join, waiting lobby (glass box at 0,101,150), lone player never starts,
//   /bw leave + auto-join re-add, /autojoin toggle, countdown abort + restart + timing, late joiner (spectator),
//   void kill height.
// Server 2 (started by this spec, REAL lobby countdown 30 s, same configs):
//   team selector GUI, team cap of 4, switching teams, uneven 2v4 start with 6 bots.
// The two servers run one after the other, never at the same time.
const fs = require('fs')
const path = require('path')
const { TestServer } = require('../harness/server')
const { waitFor, sleep, itemName, plain, Vec3 } = require('../harness/bots')
const { loadMap, parseYaml, DEFAULT_ARENA } = require('../play/map')

// Nothing about the map is hardcoded: lobby, spectator spawn, team names/colours/spawns, team size, void height are all read
// from the arena file (config/arena-*.yml via tests/play/map.js) and config/bedwars.yml at runtime.
const MAP = loadMap()
const ARENA_YML = parseYaml(fs.readFileSync(DEFAULT_ARENA, 'utf8'))
const TEAMS = MAP.teamNames
const TEAM_MAX = Object.fromEntries(TEAMS.map(n => [n, ARENA_YML.teams[n].maxPlayers]))
const MAX_PLAYERS = TEAMS.reduce((s, n) => s + TEAM_MAX[n], 0)
const LOBBY = MAP.lobbySpawn
const SPEC = MAP.specSpawn
const VOID_Y = MAP.voidY
const MAPNAME = MAP.name
const re = x => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// wool item per team colour: the dye of the plugin's TEAM_COLORS table (plugin/src/config.ts), e.g. AQUA -> light_blue_wool
const DYES = Object.fromEntries([...fs.readFileSync(path.join(__dirname, '..', '..', 'plugin', 'src', 'config.ts'), 'utf8')
  .matchAll(/^\s+(\w+): \{ code: '.', dye: '(\w+)'/gm)].map(m => [m[1], m[2]]))
const woolOf = team => `${DYES[String(MAP.teams[team].colorName).toUpperCase()]}_wool`
const PC = 8 // lobby countdown on server 1
// lobby countdown on server 2: the shipped arena value, unless it is the LAN "admin starts the round" setting
// (3600 s; the start item / /start is covered by 97-admin-start), then a realistic 30 s
const PC_REAL = ARENA_YML.pauseCountdown > 120 ? 30 : ARENA_YML.pauseCountdown

// waiting lobby = the glass box around the lobby spawn; we only rely on position relative to the configured spawn
const nearSpot = (p, spot, h = 1.5, v = 1.2) => Math.abs(p.x - spot.x) <= h && Math.abs(p.z - spot.z) <= h && Math.abs(p.y - spot.y) <= v
const inLobbyBox = p => Math.abs(p.x - LOBBY.x) <= 7.5 && Math.abs(p.z - LOBBY.z) <= 7.5 && p.y >= LOBBY.y - 1.5 && p.y <= LOBBY.y + 4.5
const teamSpawnDist = (p, team) => Math.hypot(p.x - MAP.teams[team].spawn.x, p.z - MAP.teams[team].spawn.z)
/** team whose spawn is nearest (horizontally) */
const nearestTeam = p => [...TEAMS].sort((a, b) => teamSpawnDist(p, a) - teamSpawnDist(p, b))[0]
const atTeamSpawn = (p, team, tol = 3) => teamSpawnDist(p, team) < tol && Math.abs(p.y - MAP.teams[team].spawn.y) < 2
const onAnyIsland = p => TEAMS.some(t => atTeamSpawn(p, t, 8))
/** Resolves with the team name once the bot has been teleported onto a team spawn (game started). */
async function waitForStart (bot, timeout = 90000) {
  await waitFor(() => TEAMS.some(t => atTeamSpawn(bot.entity.position, t, 4)), { timeout, what: `${bot.username} to be teleported to a team spawn` })
  await sleep(500)
  return nearestTeam(bot.entity.position)
}
// the update checker bundled in OldCombatMechanics (packetevents) asks api.github.com on startup; it is rate limited or
// offline on many networks and logs a stack trace that has nothing to do with the server under test
// (only the update-check lines are dropped; any other packetevents error still counts)
const realErrors = server => server.errors().filter(l => !/api\.github\.com|UpdateChecker|HTTP response code: 403|Failed to parse packetevents version/i.test(l))
const r1 = n => Math.round(n * 10) / 10
const pos = b => ({ x: r1(b.entity.position.x), y: r1(b.entity.position.y), z: r1(b.entity.position.z) })

/** Time (ms epoch) at which the bot received a chat line matching re, after `since`; null on timeout. */
async function chatTime (bot, re, since = 0, timeout = 8000) {
  try {
    return await waitFor(() => { const e = bot.chatLog.find(c => c.t >= since && re.test(c.m)); return e && e.t }, { timeout, step: 25, what: `chat ${re}` })
  } catch (e) { return null }
}

/** Number of chat lines matching re after `since`. */
const chatCount = (bot, re, since = 0) => bot.chatLog.filter(c => c.t >= since && re.test(c.m)).length

/** Server-side data of a player via RCON: { pos:[x,y,z], gm } */
async function serverState (server, name) {
  const p = await server.cmd(`data get entity ${name} Pos`)
  const g = await server.cmd(`data get entity ${name} playerGameType`)
  const nums = (p.match(/-?\d+(\.\d+)?(?=d)/g) || []).map(Number)
  const gm = Number((g.match(/data: (\d+)/) || [])[1])
  return { pos: nums, gm, raw: p }
}

/** Opens the team selector compass and returns the window with its readable slot labels. */
async function openSelector (bot) {
  const slot = bot.inventory.slots.findIndex(i => i && i.name === 'compass')
  if (slot < 0) throw new Error(`${bot.username} has no team selector compass: ${bot.inventory.items().map(i => i.name)}`)
  if (bot.currentWindow) { bot.closeWindow(bot.currentWindow); await sleep(150) }
  bot.setQuickBarSlot(slot - 36)
  await sleep(100)
  const opened = new Promise(resolve => bot.once('windowOpen', resolve))
  bot.activateItem()
  const win = await Promise.race([opened, sleep(5000).then(() => null)])
  if (!win) throw new Error(`${bot.username}: team selector did not open`)
  await sleep(150)
  const labels = {}
  win.slots.forEach((it, n) => {
    if (it && it.name.endsWith('_wool')) labels[plain(itemName(it)).replace(/\s*\(.*$/, '')] = { slot: n, text: plain(itemName(it)) }
  })
  return { win, labels }
}

/** Clicks a team in the selector. Resolves with what the player experienced. */
async function pickTeam (bot, team) {
  const since = Date.now()
  const { win, labels } = await openSelector(bot)
  if (!labels[team]) throw new Error(`no ${team} entry in selector: ${JSON.stringify(labels)}`)
  await bot.clickWindow(labels[team].slot, 0, 0)
  await sleep(700)
  const msgs = bot.chatLog.filter(c => c.t >= since && /\[BW\]/.test(c.m)).map(c => c.m)
  const selected = msgs.find(m => /Selected team/.test(m)) || null
  if (bot.currentWindow) { bot.closeWindow(bot.currentWindow); await sleep(100) }
  return { selected, msgs, labelsBefore: Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, v.text])) }
}

/** Reads the current selector labels without clicking. */
async function selectorLabels (bot) {
  const { labels } = await openSelector(bot)
  const out = Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, v.text]))
  if (bot.currentWindow) { bot.closeWindow(bot.currentWindow); await sleep(100) }
  return out
}

const wool = bot => bot.inventory.items().filter(i => i.name.endsWith('_wool')).map(i => i.name)

const DATA_DIR = path.join('plugins', 'data', 'lan-bedwars') // the plugin's data folder in a server dir
const reportFile = n => path.join(__dirname, '..', 'reports', n)
const bwList = async s => (await s.cmd('bw list')).replace(/§./g, '').replace(/\s+/g, ' ')
const arenaCount = (list, name) => { const m = new RegExp('(?<![\\w-])' + re(name) + '\\s+(\\d+)').exec(list); return m ? Number(m[1]) : null }
// rejoin feature (config/bedwars.yml rejoin.enabled): when the shipped config turns it on it must work
const REJOIN_ON = (() => { try { return !/^\s*enabled:\s*false/m.test(fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'bedwars.yml'), 'utf8').split(/^rejoin:/m)[1] || 'enabled: false') } catch (e) { return false } })()

// ---------------------------------------------------------------------------------------------------------
async function serverOne (t) {
  const s = t.server
  const [T0, T1] = TEAMS

  // ---- 1. fresh connection ------------------------------------------------------------------------------
  const tConnect = Date.now()
  const a = await t.bot('LobA', { quiet: true })
  const firstPos = pos(a)
  const tLogin = await chatTime(a, /LobA joined the game/, tConnect - 50, 5000)
  const tJoinMsg = await chatTime(a, new RegExp(`LobA joined the game! \\[1/${MAX_PLAYERS}\\]`), tConnect - 50, 10000)
  const joinMs = tJoinMsg && tLogin ? tJoinMsg - tLogin : null
  t.check(`fresh connection is auto-joined into the arena lobby (join message [1/${MAX_PLAYERS}])`, !!tJoinMsg, { joinMsAfterLoginMessage: joinMs })
  t.check('auto-join happens within 1.5 s of logging in (tick period 1 s)', joinMs !== null && joinMs <= 1500, { joinMs })
  t.check('first spawn of a fresh connection is not in the void and is the lobby spawn', firstPos.y >= VOID_Y + 10 && nearSpot(firstPos, LOBBY, 2, 2),
    { firstPos, lobbySpawn: LOBBY, voidY: VOID_Y, note: 'without the companion spawn pinning the world-spawn chunk is not loaded for the first player and spawn y falls to -63' })
  await waitFor(() => inLobbyBox(a.entity.position), { timeout: 5000, what: 'A in lobby box' }).catch(() => {})
  await sleep(500)
  t.check('player ends up in the waiting lobby', inLobbyBox(a.entity.position), pos(a))
  t.check('lobby spawn is the configured spot', nearSpot(a.entity.position, LOBBY), { pos: pos(a), configured: LOBBY })
  t.check('lobby player is in survival mode', a.game.gameMode === 'survival', a.game.gameMode)
  const inv = a.inventory.slots.map((i, n) => i ? { n, name: i.name, label: itemName(i) } : null).filter(Boolean)
  t.check('lobby inventory: team selector compass and leave slime ball',
    inv.some(i => i.name === 'compass' && /team/i.test(i.label)) && inv.some(i => i.name === 'slime_ball' && /Leave/.test(i.label)), inv)
  const blk = (x, y, z) => { const b = a.blockAt(new Vec3(x, y, z)); return b ? b.name : null }
  const lx = Math.floor(LOBBY.x); const lz = Math.floor(LOBBY.z); const ly = Math.floor(LOBBY.y)
  const geometry = { underSpawn: blk(lx, ly - 1, lz), twoBelow: blk(lx, ly - 2, lz), floorEast: blk(lx + 1, ly - 1, lz), floorSouth: blk(lx, ly - 1, lz + 1), floorWest: blk(lx - 1, ly - 1, lz) }
  t.check('waiting lobby has a solid floor under the spawn (not an air spawn)', [geometry.underSpawn, geometry.floorEast, geometry.floorSouth, geometry.floorWest].every(n => n && n !== 'air'), geometry)
  t.check(`bw list shows the arena ${MAPNAME} with 1 player`, arenaCount(await bwList(s), MAPNAME) === 1, await bwList(s))

  // ---- 2. a single player never starts the game ----------------------------------------------------------
  const tSolo = Date.now()
  const soloSamples = []
  let soloEscaped = false
  while (Date.now() - tSolo < (PC + 6) * 1000) {
    const p = a.entity.position
    soloSamples.push(r1(p.y))
    if (!inLobbyBox(p)) soloEscaped = true
    await sleep(250)
  }
  t.check(`lone player stays in the lobby for ${PC + 6} s (countdown is ${PC} s)`, !soloEscaped && a.game.gameMode === 'survival',
    { pos: pos(a), minY: Math.min(...soloSamples), seconds: PC + 6 })
  t.check('lone player got no game start / team assignment messages', chatCount(a, /Selected team|game starts|Game started/i, tSolo) === 0,
    a.chatLog.filter(c => c.t >= tSolo).map(c => c.m))

  // ---- 3. /bw leave and auto-join -------------------------------------------------------------------------
  const tLeave0 = Date.now()
  a.chat('/bw leave')
  const tLeft = await chatTime(a, /LobA left the game/, tLeave0 - 50, 5000)
  const tRejoin = await chatTime(a, /LobA joined the game/, (tLeft || tLeave0) + 1, 6000)
  t.check('/bw leave removes the player from the arena (leave message)', !!tLeft)
  const rejoinMs = tRejoin && tLeft ? tRejoin - tLeft : null
  t.check('auto-join re-adds a player who left, within ~1 s (tick period 1 s)', rejoinMs !== null && rejoinMs <= 2200, { rejoinMs })
  await sleep(600)
  t.check('re-added player is back in the lobby box', inLobbyBox(a.entity.position), pos(a))

  // ---- 4. /autojoin ---------------------------------------------------------------------------------------
  // natural flow of a normal player: type /autojoin while sitting in the arena lobby, then leave
  const tAuto0 = Date.now()
  a.chat('/autojoin')
  await sleep(1200)
  const blocked = chatCount(a, /not available during the game/, tAuto0)
  const toggled = chatCount(a, /Auto-join disabled/, tAuto0)
  t.check('/autojoin can be used by a normal player while in the arena lobby', toggled === 1 && blocked === 0,
    { toggled, blockedByBedWars: blocked, chat: a.chatLog.filter(c => c.t >= tAuto0).map(c => c.m) })
  if (!toggled) {
    // The command was swallowed by BedWars' command whitelist. Make the plugin logic itself testable by using an op
    // (ops bypass the command whitelist), so the remaining checks measure the toggle and not the whitelist.
    await s.cmd('op LobA')
    await sleep(600)
    const t1 = Date.now()
    a.chat('/autojoin')
    t.check('(workaround) opped player can toggle /autojoin off', !!(await chatTime(a, /Auto-join disabled/, t1, 4000)))
  }
  const tOff = Date.now()
  a.chat('/bw leave')
  const tOffLeft = await chatTime(a, /LobA left the game/, tOff - 50, 4000)
  t.check('/bw leave works with auto-join off', !!tOffLeft)
  // where does the player end up? BedWars restores the location from before joining; that must be the waiting lobby
  const fall = []
  for (let i = 0; i < 6; i++) { fall.push(r1(a.entity.position.y)); await sleep(250) }
  const fellInVoid = Math.min(...fall) < VOID_Y
  t.check('a player who left the arena with auto-join off is not dropped into the void', !fellInVoid, { yTrail: fall })
  t.check('a player who left the arena with auto-join off is standing in the lobby spot (not stuck in limbo elsewhere)', inLobbyBox(a.entity.position) && ['survival', 'adventure'].includes(a.game.gameMode), { pos: pos(a), gm: a.game.gameMode, note: 'outside a game the server default gamemode (adventure, MODE in docker-compose) applies' })
  if (fellInVoid) await s.cmd(`tp LobA ${LOBBY.x} ${LOBBY.y} ${LOBBY.z}`)
  await sleep(2600)
  const listOff = await bwList(s)
  t.check('with /autojoin off the player is NOT put back into the arena', chatCount(a, /LobA joined the game/, tOffLeft || tOff) === 0 && arenaCount(listOff, MAPNAME) === 0, { bwList: listOff })
  const tOn = Date.now()
  a.chat('/autojoin')
  const tBack = await chatTime(a, /LobA joined the game/, tOn, 5000)
  t.check('/autojoin again re-enables auto-join (player re-added within ~2 s)', !!tBack && tBack - tOn <= 2500, { ms: tBack ? tBack - tOn : null })
  await sleep(700)
  t.check('player is back in the lobby box after re-enabling', inLobbyBox(a.entity.position), pos(a))

  // ---- 5. countdown: starts with the 2nd player, aborts below minPlayers, restarts from full ---------------
  let b = await t.bot('LobB', { quiet: true })
  const tJoinB1 = await chatTime(a, new RegExp(`LobB joined the game! \\[2/${MAX_PLAYERS}\\]`), tOn, 5000)
  t.check(`second player joins the same lobby ([2/${MAX_PLAYERS}])`, !!tJoinB1)
  await sleep(2500) // countdown is running
  const tQuitB = Date.now()
  b.quit()
  await sleep((PC + 5) * 1000)
  const listAbort = await bwList(s)
  t.check('countdown is cancelled when the second player disconnects (A alone stays in lobby)', inLobbyBox(a.entity.position) && a.game.gameMode === 'survival' && arenaCount(listAbort, MAPNAME) === 1,
    { pos: pos(a), bwList: listAbort, chatSinceB: a.chatLog.filter(c => c.t >= tJoinB1).map(c => c.m), waitedSinceQuitSec: r1((Date.now() - tQuitB) / 1000) })

  b = await t.bot('LobB', { quiet: true })
  const tJoinB2 = await chatTime(a, new RegExp(`LobB joined the game! \\[2/${MAX_PLAYERS}\\]`), tQuitB, 5000)
  // two more join right behind B while the countdown runs (must not restart or shorten it); 4 players -> 2 v 2
  const [d, e] = await Promise.all(['LobD', 'LobE'].map(n => t.bot(n, { quiet: true })))
  const players = [a, b, d, e]
  const started = await Promise.all(players.map(p => waitForStart(p, 40000).then(team => ({ team, t: Date.now() }))))
  const teamOfP = Object.fromEntries(players.map((p, i) => [p.username, started[i].team]))
  const countdownMs = tJoinB2 ? Math.min(...started.map(x => x.t)) - tJoinB2 - 500 : null // waitForStart adds 500 ms
  t.check(`game starts ${PC} s after the 2nd player joined (restarted from full, not resumed; later joiners do not shorten it)`, countdownMs !== null && countdownMs >= (PC - 1) * 1000 && countdownMs <= (PC + 2) * 1000,
    { countdownMs, configured: PC * 1000 })
  const counts = Object.fromEntries(TEAMS.map(n => [n, Object.values(teamOfP).filter(x => x === n).length]))
  const lo = Math.floor(4 / TEAMS.length); const hi = Math.ceil(4 / TEAMS.length)
  t.check('four players without a team choice are split evenly over the islands (2 v 2 on a two-team map)', TEAMS.every(n => counts[n] >= lo && counts[n] <= hi) && Object.values(counts).reduce((x, y) => x + y, 0) === 4 && (TEAMS.length !== 2 || TEAMS.every(n => counts[n] === 2)), { counts, teamOfP })
  await sleep(800)
  const st = {}
  for (const p of players) st[p.username] = await serverState(s, p.username)
  t.check('players stand at their team spawn, survival mode', players.every(p => atTeamSpawn({ x: st[p.username].pos[0], y: st[p.username].pos[1], z: st[p.username].pos[2] }, teamOfP[p.username]) && st[p.username].gm === 0), { st, teamOfP })
  t.check('team selector is gone from the inventory of started players', players.every(p => !p.inventory.items().some(i => i.name === 'compass')), players.map(p => p.inventory.items().map(i => i.name)))

  // ---- 6. late joiner while the game runs -------------------------------------------------------------------
  const c = await t.bot('LobC', { quiet: true })
  await sleep(3000)
  const stC = await serverState(s, 'LobC')
  t.check('late joiner is put into the running game as spectator', stC.gm === 3, stC)
  t.check('spectator is not in the waiting lobby box', !inLobbyBox(c.entity.position), pos(c))
  t.check('spectator has no team wool / selector', wool(c).length === 0 && !c.inventory.items().some(i => i.name === 'compass'), c.inventory.items().map(i => i.name))
  const stillOk = async () => {
    const out = {}
    for (const p of players) out[p.username] = await serverState(s, p.username)
    return out
  }
  const stAfter = await stillOk()
  t.check('late joiner does not disturb the players (still survival on own island)', players.every(p => stAfter[p.username].gm === 0 && onAnyIsland({ x: stAfter[p.username].pos[0], y: stAfter[p.username].pos[1], z: stAfter[p.username].pos[2] })), stAfter)
  const listLate = await bwList(s)
  t.check('bw list counts the spectator (5 in arena)', arenaCount(listLate, MAPNAME) === 5, listLate)
  // spectator uses /bw leave, auto-join takes them back as spectator at the spectator spawn.
  // (mineflayer has no spectator no-clip and falls onto the island by itself, so the position is read from the
  // teleport packets the server sends, not from where the bot ends up.)
  const forced = []
  c.on('forcedMove', () => forced.push({ t: Date.now(), ...pos(c) }))
  const tCL = Date.now()
  c.chat('/bw leave')
  await sleep(3200)
  const stC2 = await serverState(s, 'LobC')
  const specTp = forced.find(f => nearSpot(f, SPEC, 1.5, 1.5))
  t.check(`spectator is teleported to the spectator spawn (${SPEC.x}, ${SPEC.y}, ${SPEC.z})`, !!specTp, forced)
  t.check('spectator who leaves is re-added as spectator by auto-join', stC2.gm === 3 && arenaCount(await bwList(s), MAPNAME) === 5,
    { gm: stC2.gm, teleports: forced.length, ms: specTp ? specTp.t - tCL : null })

  // spectator with auto-join off: /bw leave must put them in the lobby (survival), not leave them as a ghost / in the void
  c.chat('/autojoin')
  await sleep(700)
  c.chat('/bw leave')
  await sleep(2800)
  const stC3 = await serverState(s, 'LobC')
  t.check('spectator who leaves with auto-join off ends up in the waiting lobby, not spectator and not in the void',
    [0, 2].includes(stC3.gm) && stC3.pos[1] >= VOID_Y + 10 && inLobbyBox({ x: stC3.pos[0], y: stC3.pos[1], z: stC3.pos[2] }) && arenaCount(await bwList(s), MAPNAME) === 4,
    { stC3, bwList: await bwList(s), chat: c.chatLog.slice(-4).map(x => x.m) })
  c.chat('/autojoin')
  await sleep(2500)
  t.check('re-enabling auto-join puts the spectator back into the running game as spectator', (await serverState(s, 'LobC')).gm === 3 && arenaCount(await bwList(s), MAPNAME) === 5, await bwList(s))

  // ---- 7. rejoin: a player disconnects from a running game and reconnects -------------------------------------
  // "Rejoin into the running world" is nice to have, not required. Hard checks only cover sane behaviour: the returning
  // player must end up inside the game (not stuck in the idle lobby, not in the void) and nobody else is disturbed.
  const eTeam = teamOfP.LobE
  const eInvBefore = e.inventory.items().map(i => i.name).sort().join(',')
  e.quit()
  await sleep(2500)
  const listGone = await bwList(s)
  const e2 = await t.bot('LobE', { quiet: true })
  const ePosAtSpawn = pos(e2)
  await sleep(3500)
  const stE = await serverState(s, 'LobE')
  const listBack = await bwList(s)
  const ePos = { x: stE.pos[0], y: stE.pos[1], z: stE.pos[2] }
  t.check('a player who reconnects during a running game is put into the game again (no limbo in the idle lobby, no void)',
    arenaCount(listBack, MAPNAME) === arenaCount(listGone, MAPNAME) + 1 && !inLobbyBox(ePos) && ePos.y >= VOID_Y + 10,
    { listGone, listBack, ePos, gm: stE.gm, spawnPos: ePosAtSpawn })
  const restored = stE.gm === 0 && nearestTeam(ePos) === eTeam && onAnyIsland(ePos)
  const eInvAfter = e2.inventory.items().map(i => i.name).sort().join(',')
  if (REJOIN_ON) {
    // the shipped companion config enables rejoin, so this is a hard check (it fails if the feature is broken or off)
    t.check('rejoin restores the player on their old team in survival mode (companion rejoin.enabled)', restored, { eTeam, ePos, gm: stE.gm, nearest: nearestTeam(ePos), eInvBefore, eInvAfter })
  } else if (restored) {
    t.check('rejoin restores the player on their old team in survival mode (feature present)', true, { eTeam, ePos, gm: stE.gm, eInvBefore, eInvAfter })
  } else {
    t.log(`SOFT (nice to have, not a failure): rejoin does not restore the player. eTeam=${eTeam} now gm=${stE.gm} pos=${JSON.stringify(ePos)} inv before=[${eInvBefore}] after=[${eInvAfter}]`)
  }
  const stAfterRejoin = await stillOk()
  t.check('others are undisturbed by a rejoin', ['LobA', 'LobB', 'LobD'].every(n => stAfterRejoin[n].gm === 0 && onAnyIsland({ x: stAfterRejoin[n].pos[0], y: stAfterRejoin[n].pos[1], z: stAfterRejoin[n].pos[2] })), stAfterRejoin)

  // ---- 8. void kill height (config/bedwars.yml) ----------------------------------------------------------------
  // D is in the game; hang D below the island at voidY + 6 and let it fall through the void-damage height.
  let died = false
  let deathY = null
  d.once('death', () => { died = true; deathY = r1(d.entity.position.y) })
  const hp0 = d.health
  const dTeam = teamOfP.LobD
  await s.cmd(`tp LobD ${MAP.teams[dTeam].spawn.x} ${VOID_Y + 6} ${MAP.teams[dTeam].spawn.z}`)
  await sleep(2500)
  // 1000 damage per hit below the configured height: the death must happen right below it (a bot falls at most ~4 blocks/tick), not at vanilla's y<-128
  t.check(`falling below y=${VOID_Y} kills a player instantly (void-damage config applied)`, died && deathY !== null && deathY >= VOID_Y - 10 && deathY <= VOID_Y + 0.5, { died, deathY, hp0, hp: d.health, y: r1(d.entity.position.y), voidY: VOID_Y })
  for (const x of [a, b, c, d, e2]) { try { x.quit() } catch (err) {} }
  await sleep(500)
}

// ---------------------------------------------------------------------------------------------------------
async function serverTwo (t, parent) {
  const [S, B] = TEAMS
  const capS = TEAM_MAX[S]; const capB = TEAM_MAX[B]
  const server = new TestServer('lobby-teams', { pauseCountdown: PC_REAL })
  const started = Date.now()
  const bots = []
  try {
    parent.log(`server 2: starting (real lobby countdown of ${PC_REAL} s)`)
    await server.start()
    parent.log(`server 2 up on port ${server.port}`)
    const connect = async n => { const b = await require('../harness/bots').connectBot(server, n); bots.push(b); return b }
    // bots: capS fill team S first, #capS+1 gets rejected, then 2 stay in S, the rest fill B (capB), one more bot is rejected from full B
    const nBots = Math.max(capS + 1, 2 + capB) + 1
    const names = Array.from({ length: nBots }, (_, i) => 'Lob' + (i + 1))
    const [b1, b2] = await Promise.all(names.slice(0, 2).map(connect))
    const tJoin2 = await chatTime(b1, /joined the game! \[2\//, 0, 8000)
    t.check('server 2: the 2nd player joined message was seen (countdown start reference)', !!tJoin2)
    const tCountdown0 = tJoin2 || Date.now()
    const rest = await Promise.all(names.slice(2).map(connect))
    const bs = [b1, b2, ...rest]
    t.check(`${nBots} bots are all auto-joined into the lobby`, (await Promise.all(bs.map(b => chatTime(b, new RegExp(b.username + ' joined the game'), 0, 8000)))).every(Boolean),
      bs.map(b => b.username + ':' + pos(b).y))
    await sleep(800)

    // initial selector state
    const labels0 = await selectorLabels(b1)
    const sq = x => (x || '').replace(/\s+/g, ' ')
    t.check(`team selector GUI opens and lists ${S} and ${B} with 0 / ${capS}`, sq(labels0[S]) === `${S} (0 / ${capS})` && sq(labels0[B]) === `${B} (0 / ${capB})`, labels0)

    // team S: capS players
    const res = {}
    for (const b of bs.slice(0, capS)) res[b.username] = await pickTeam(b, S)
    t.check(`${capS} players can pick ${S} ([1/${capS}] .. [${capS}/${capS}])`, bs.slice(0, capS).every((b, i) => res[b.username].selected && res[b.username].selected.includes(`${S} [${i + 1}/${capS}]`)),
      Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.selected])))
    t.check('picking a team gives the player coloured wool', wool(b1).includes(woolOf(S)) && wool(bs[capS - 1]).includes(woolOf(S)), { want: woolOf(S), got: [wool(b1), wool(bs[capS - 1])] })

    // the next player cannot join the full team
    const over = bs[capS]
    const rOver = await pickTeam(over, S)
    t.check(`selector shows ${S} as full (${capS} / ${capS}) to the next player`, sq(rOver.labelsBefore[S]) === `${S} (${capS} / ${capS})`, rOver.labelsBefore)
    t.check(`player ${capS + 1} is rejected from full team ${S} (never more than ${capS})`, !rOver.selected && rOver.msgs.some(m => new RegExp(`Team ${re(S)}.* is full`).test(m)) && wool(over).length === 0, { msgs: rOver.msgs, wool: wool(over) })
    const afterFull = await selectorLabels(over)
    t.check(`${S} still has exactly ${capS} members after the rejected pick`, sq(afterFull[S]) === `${S} (${capS} / ${capS})`, afterFull)

    // switching: players 3..capS go over to B
    const movers = bs.slice(2, capS)
    const sw = []
    for (const b of movers) sw.push(await pickTeam(b, B))
    t.check(`players can switch teams (${S} -> ${B} frees the slot)`, sw.every((r, i) => r.selected && r.selected.includes(`${B} [${i + 1}/${capB}]`)), sw.map(r => r.selected))
    t.check('switching replaces the wool colour (no leftover wool of the old team)', wool(movers[0]).length > 0 && wool(movers[0]).every(m => m === woolOf(B)), wool(movers[0]))
    const fillers = []
    for (let i = movers.length; i < capB; i++) fillers.push(bs[capS + (i - movers.length)])
    const fillRes = []
    for (const b of fillers) fillRes.push(await pickTeam(b, B))
    t.check(`more players pick ${B} up to [${capB}/${capB}]`, fillRes.every((r, i) => r.selected && r.selected.includes(`${B} [${movers.length + i + 1}/${capB}]`)), fillRes.map(r => r.selected))
    // the last bot (no team yet) cannot get into full B either, then leaves so the game is exactly 2 vs capB.
    const last = bs[bs.length - 1]
    const rLast = await pickTeam(last, B)
    const lL = Object.fromEntries(Object.entries(rLast.labelsBefore).map(([k, v]) => [k, sq(v)]))
    t.check(`selector (as seen by a teamless player) reads ${S} (${2} / ${capS}) and ${B} (${capB} / ${capB})`, lL[S] === `${S} (2 / ${capS})` && lL[B] === `${B} (${capB} / ${capB})`, lL)
    t.check(`last player is rejected from full team ${B}`, !rLast.selected && rLast.msgs.some(m => new RegExp(`Team ${re(B)}.* is full`).test(m)) && wool(last).length === 0, { msgs: rLast.msgs })
    const tSelectDone = Date.now()
    last.quit()

    // start
    const play = [...bs.slice(0, capS), ...fillers]
    const starts = await Promise.all(play.map(b => waitForStart(b, 60000).then(team => ({ team, t: Date.now() })).catch(err => ({ team: null, err: err.message }))))
    const teams = starts.map(x => x.team)
    const nS = teams.filter(x => x === S).length
    const nB = teams.filter(x => x === B).length
    t.check(`game starts with ${play.length} players, teams are 2 (${S}) vs ${capB} (${B})`, nS === 2 && nB === capB, { teams, selectionTookSec: r1((tSelectDone - tCountdown0) / 1000) })
    const expected = [...Array(2).fill(S), ...Array(capB).fill(B)]
    t.check('every player is on the team they picked', play.every((b, i) => teams[i] === expected[i]), teams)
    const startMs = Math.min(...starts.map(x => x.t || Infinity)) - 500 - tCountdown0
    t.check(`real lobby countdown: game starts ~${PC_REAL} s after the 2nd player joined (not earlier because more players joined)`, startMs >= (PC_REAL - 1.5) * 1000 && startMs <= (PC_REAL + 2.5) * 1000,
      { startMs, configured: PC_REAL * 1000, selectionTookSec: r1((tSelectDone - tCountdown0) / 1000) })
    await sleep(800)
    const states = []
    for (const b of play) states.push(await serverState(server, b.username))
    const spawnOk = states.every((x, i) => atTeamSpawn({ x: x.pos[0], y: x.pos[1], z: x.pos[2] }, teams[i]) && x.gm === 0)
    t.check('all players stand at their team spawn in survival mode', spawnOk, states.map((x, i) => `${play[i].username}:${teams[i]}:${x.pos.map(r1)}:gm${x.gm}`))
    const selectorGone = play.every(b => !b.inventory.items().some(i => i.name === 'compass' && /team/i.test(itemName(i) || '')))
    t.check('lobby items (team selector) are removed when the game starts', selectorGone, play.map(b => b.inventory.items().map(i => i.name).join(',')))
  } finally {
    const errs = realErrors(server)
    t.check('server 2: no server/plugin exceptions in log', errs.length === 0, errs.slice(0, 10))
    try { fs.writeFileSync(reportFile('10-lobby.server2.log'), server.logs()) } catch (err) {}
    for (const b of bots) { try { b.quit() } catch (err) {} }
    await server.stop()
    parent.log(`server 2 stopped after ${Math.round((Date.now() - started) / 1000)} s`)
  }
}

// ---------------------------------------------------------------------------------------------------------
// Server 3: /map. A second arena "Zwei" is added to the throwaway copy (same world, other lobby spot 3 blocks to the east),
// because the repo currently ships only one map. minPlayers 4 so nothing ever starts while we switch.
async function serverThree (t, parent) {
  const OTHER = 'Zwei'
  const otherLobby = { x: LOBBY.x + 3, y: LOBBY.y, z: LOBBY.z }
  const server = new TestServer('lobby-map', {
    pauseCountdown: 20,
    minPlayers: 4,
    prepare (dir) {
      // extra arenas are read from the plugin data folder (plugins/data/lan-bedwars/arenas/*.yml); Zwei is a copy of the
      // shipped arena file of the active map with another name and lobby spot
      const zwei = fs.readFileSync(DEFAULT_ARENA, 'utf8').replace(/^name: .*$/m, `name: ${OTHER}`).replace(/^lobbySpawn: .*$/m, `lobbySpawn: ${otherLobby.x};${otherLobby.y};${otherLobby.z};0.0;0.0`)
      fs.mkdirSync(path.join(dir, DATA_DIR, 'arenas'), { recursive: true })
      fs.writeFileSync(path.join(dir, DATA_DIR, 'arenas', 'zwei.yml'), zwei)
    }
  })
  const started = Date.now()
  const bots = []
  try {
    parent.log('server 3: starting (two arenas, /map)')
    await server.start()
    parent.log(`server 3 up on port ${server.port}`)
    const connect = async n => { const b = await require('../harness/bots').connectBot(server, n); bots.push(b); return b }
    const s = server
    const clean = x => plain(x).replace(/\s+/g, ' ').trim()
    const P1 = await connect('MapOp')
    const P2 = await connect('MapUser')
    await Promise.all([P1, P2].map(p => chatTime(p, new RegExp(p.username + ' joined the game'), 0, 8000)))
    await sleep(800)
    const list0 = await bwList(s)
    t.check(`server knows both arenas, both players wait in ${MAPNAME}`, arenaCount(list0, MAPNAME) === 2 && arenaCount(list0, OTHER) === 0, list0)

    // console: "map" lists
    const c0 = clean(await s.cmd('map'))
    t.check('console "map" shows the active map and lists all maps', new RegExp(`Active map: ${re(MAPNAME)}`).test(c0) && new RegExp(`Maps: .*${re(MAPNAME)}`).test(c0) && new RegExp(`Maps: .*${re(OTHER)}`).test(c0), c0)

    // non-op in game cannot switch
    const tU = Date.now()
    P2.chat(`/map ${OTHER}`)
    await sleep(1500)
    const cAfterU = clean(await s.cmd('map'))
    t.check('a normal player cannot switch the map (no permission)', new RegExp(`Active map: ${re(MAPNAME)}`).test(cAfterU) && arenaCount(await bwList(s), MAPNAME) === 2,
      { chat: P2.chatLog.filter(c => c.t >= tU).map(c => c.m), console: cAfterU })

    // op in game: /map lists, /map Zwei switches
    await s.cmd(`op ${P1.username}`)
    await sleep(800)
    const tL = Date.now()
    P1.chat('/map')
    await sleep(1200)
    const listed = P1.chatLog.filter(c => c.t >= tL).map(c => clean(c.m))
    t.check('op can use /map in the arena lobby (BedWars command whitelist lets it through) and gets the map list', listed.some(m => new RegExp(`Active map: ${re(MAPNAME)}`).test(m)) && listed.some(m => new RegExp(`Maps: .*${re(OTHER)}`).test(m)), listed)

    const tS = Date.now()
    P1.chat(`/map ${OTHER}`)
    const bc = await chatTime(P2, new RegExp(`Next map: ${re(OTHER)}`), tS - 50, 4000)
    t.check('map switch is announced to all players', !!bc, P2.chatLog.filter(c => c.t >= tS).map(c => c.m))
    const joinedOther = await Promise.all([P1, P2].map(p => chatTime(p, new RegExp(p.username + ' joined the game'), tS, 5000)))
    await sleep(800)
    const list1 = await bwList(s)
    t.check(`after /map ${OTHER} the waiting players are moved to ${OTHER} (auto-join)`, joinedOther.every(Boolean) && arenaCount(list1, OTHER) === 2 && arenaCount(list1, MAPNAME) === 0, { list1, rejoinMs: joinedOther.map(x => x && x - tS) })
    t.check(`players stand in the lobby spot of ${OTHER}`, [P1, P2].every(p => nearSpot(p.entity.position, otherLobby)), [pos(P1), pos(P2)])
    let cfg = ''
    try { cfg = fs.readFileSync(path.join(server.dir, DATA_DIR, 'config.yml'), 'utf8') } catch (err) {}
    t.check('active map is persisted in the plugin data folder (data/config.yml)', new RegExp(`^arena: ${re(OTHER)}\\s*$`, 'm').test(cfg), cfg.split('\n').filter(l => /^arena:/.test(l)))

    // a fresh connection now spawns in the lobby of the new map and is auto-joined there
    const P3 = await connect('MapNew')
    const p3 = pos(P3)
    await chatTime(P3, /MapNew joined the game/, 0, 6000)
    await sleep(500)
    const list2 = await bwList(s)
    t.check(`a fresh player spawns directly in the ${OTHER} lobby (not in the void or the old lobby) and joins ${OTHER}`, nearSpot(p3, otherLobby, 2, 2) && arenaCount(list2, OTHER) === 3, { firstPos: p3, list2 })
    P3.quit()
    await sleep(500)

    // console: unknown name first (active map is OTHER here, so it must stay OTHER), then switch back with a differently cased name
    const cBad = clean(await s.cmd('map Nirgendwo'))
    const cStill = clean(await s.cmd('map'))
    t.check('unknown map name is rejected and the active map is unchanged', /Unknown map/.test(cBad) && new RegExp(`Active map: ${re(OTHER)}`).test(cStill), { cBad, cStill })
    const odd = MAPNAME.toLowerCase() !== MAPNAME ? MAPNAME.toLowerCase() : MAPNAME.toUpperCase()
    const tB = Date.now()
    const cBack = clean(await s.cmd(`map ${odd}`))
    await sleep(3000)
    const cSame = clean(await s.cmd('map'))
    t.check(`console "map ${odd}" is case-insensitive and really changes the active map from ${OTHER} to ${MAPNAME}`, new RegExp(`Active map: ${re(MAPNAME)}`).test(cSame) && !new RegExp(`Active map: ${re(OTHER)}`).test(cSame), { cBack, cSame })
    const list3 = await bwList(s)
    t.check(`switching back: players are moved to the ${MAPNAME} lobby`, arenaCount(list3, MAPNAME) === 2 && arenaCount(list3, OTHER) === 0 && [P1, P2].every(p => nearSpot(p.entity.position, LOBBY)),
      { list3, pos: [pos(P1), pos(P2)], sinceMs: Date.now() - tB })
    const cfg2 = fs.readFileSync(path.join(server.dir, DATA_DIR, 'config.yml'), 'utf8')
    t.check('switching back is persisted too', new RegExp(`^arena: ${re(MAPNAME)}\\s*$`, 'm').test(cfg2), cfg2.split('\n').filter(l => /^arena:/.test(l)))
  } finally {
    const errs = realErrors(server)
    t.check('server 3: no server/plugin exceptions in log', errs.length === 0, errs.slice(0, 10))
    try { fs.writeFileSync(reportFile('10-lobby.server3.log'), server.logs()) } catch (err) {}
    for (const b of bots) { try { b.quit() } catch (err) {} }
    await server.stop()
    parent.log(`server 3 stopped after ${Math.round((Date.now() - started) / 1000)} s`)
  }
}

module.exports = {
  name: '10-lobby',
  timeout: 540000, // own runtime ~3.2 min, rest is headroom for waiting on machine-wide server slots
  server: { pauseCountdown: PC },
  async run (t) {
    await serverOne(t)
    // server 1 is done: keep its log for the check, then stop it so only one test server runs at a time
    const errs = realErrors(t.server)
    t.check('server 1: no server/plugin exceptions in log', errs.length === 0, errs.slice(0, 10))
    try { fs.writeFileSync(reportFile('10-lobby.server1.log'), t.server.logs()) } catch (err) {}
    await t.server.stop()
    await serverTwo(t, t)
    await serverThree(t, t)
  }
}
