// Lobby under load and the German info commands (the client-independent parts of the old 1.8 compat spec):
//   /bw list, /bw stats, /bw help answer in German; 8 players connect at once and are all auto-joined; three rounds
//   of rapid leave/rejoin leave no ghost sessions, keep the TPS healthy and every sidebar at 8/8; a 9th player on a
//   full arena is not left in the void and stays connected.
const { connectBot, waitFor, sleep, MAP } = require('../harness/bots')
const { parseYaml, DEFAULT_ARENA } = require('../play/map')
const fs = require('fs')

const ARENA = parseYaml(fs.readFileSync(DEFAULT_ARENA, 'utf8'))
const MAX_PLAYERS = Object.values(ARENA.teams).reduce((n, t) => n + t.maxPlayers, 0)
const LOBBY = MAP.lobbySpawn
const nearLobby = p => Math.abs(p.x - LOBBY.x) <= 8 && Math.abs(p.z - LOBBY.z) <= 8 && p.y >= LOBBY.y - 2 && p.y <= LOBBY.y + 5
const sidebarLines = bot => { const st = bot.scoreRaw; return Object.keys((st && st.scores[st.sidebarObjective]) || {}).map(l => l.replace(/§./g, '')) }

module.exports = {
  name: '80-lobby-load',
  timeout: 300000,
  // nobody may start a round while the lobby is churned
  server: { pauseCountdown: 3600 },

  async run (t) {
    const server = t.server
    const bots = []
    const join = async name => { const b = await connectBot(server, name); b.on('end', () => { b.disconnected = true }); return b }
    const quit = async b => { await new Promise(resolve => { b.once('end', resolve); try { b.quit() } catch (e) { resolve() } setTimeout(resolve, 3000) }) }

    // ---- commands in German
    const anchor = await join('LdAnchor')
    await waitFor(() => nearLobby(anchor.entity.position), { timeout: 10000, what: 'anchor in the lobby' })
    anchor.chatLog.length = 0
    for (const cmd of ['/bw list', '/bw stats', '/bw help']) { anchor.chat(cmd); await sleep(700) }
    const out = anchor.chatLog.map(c => c.m)
    t.log('command output', out.slice(0, 20))
    t.check('/bw list, /bw stats, /bw help answer in German (Verfügbare Arenen, Statistiken, Hilfe)',
      out.some(m => /Verfügbare Arenen/.test(m)) && out.some(m => /Statistiken von Spieler LdAnchor/.test(m)) && out.some(m => /Hilfe/.test(m)) &&
      !out.some(m => /(Available arenas|Statistics of|Help:)/.test(m)), out.slice(0, 12))
    t.check('/bw list names the arena with its player count', out.some(m => new RegExp(`${MAP.name} 1\\b`).test(m)), out.filter(m => new RegExp(MAP.name).test(m)))
    t.check('/bw stats shows kills, deaths and K/D', ['Kills:', 'Tode:', 'K/D:'].every(k => out.some(m => m.includes(k))), out)
    const sb = sidebarLines(anchor)
    t.check('lobby sidebar is German (Map / Spieler / Warten), not English', sb.some(l => /Map: /.test(l)) && sb.some(l => /Spieler: /.test(l)) && sb.some(l => /Warten/.test(l)) && !sb.some(l => /Players|Waiting/.test(l)), sb)
    await quit(anchor)
    await sleep(800)

    // ---- 8 at once
    const names = Array.from({ length: MAX_PLAYERS }, (_, i) => `Ld${i + 1}`)
    const churn = await Promise.all(names.map(n => join(n).catch(e => ({ err: e.message, username: n }))))
    const fails = churn.filter(b => b.err)
    const allIn = (list, timeout = 20000) => waitFor(() => list.every(b => !b.err && !b.disconnected && nearLobby(b.entity.position)), { timeout }).then(() => true, () => false)
    t.check(`${MAX_PLAYERS} players connect at once and are all auto-joined into the lobby`, fails.length === 0 && await allIn(churn), fails.map(b => b.err))

    // ---- churn: half leaves and comes straight back, then the other half
    const rounds = []
    for (let round = 0; round < 3; round++) {
      const t0 = Date.now()
      const order = names.map((n, i) => [Math.random(), i]).sort((x, y) => x[0] - y[0]).map(x => x[1])
      for (const half of [order.slice(0, MAX_PLAYERS / 2), order.slice(MAX_PLAYERS / 2)]) {
        await Promise.all(half.map(i => churn[i].err ? null : quit(churn[i])))
        const back = await Promise.all(half.map(i => join(names[i]).catch(e => ({ err: e.message, username: names[i] }))))
        half.forEach((i, k) => { churn[i] = back[k] })
        await sleep(200)
      }
      const errs = churn.filter(b => b.err)
      rounds.push({ round, ok: errs.length === 0 && await allIn(churn), ms: Date.now() - t0, errs: errs.map(b => b.err) })
    }
    t.log('churn rounds', rounds)
    t.check('after 3 rounds of rapid leave/rejoin every player is back in the arena lobby', rounds.every(r => r.ok), rounds)
    const list = await server.cmd('list')
    t.check(`the server player list shows exactly the ${MAX_PLAYERS} players (no ghost sessions)`, new RegExp(`There are ${MAX_PLAYERS} of a max`).test(list), list)
    const bwList = (await server.cmd('bw list')).replace(/\s+/g, ' ')
    t.check(`the arena counts exactly ${MAX_PLAYERS} players`, new RegExp(`${MAP.name} ${MAX_PLAYERS}\\b`).test(bwList), bwList)
    const tps = Number((/TPS: ([\d.]+)/.exec(await server.cmd('tps')) || [])[1])
    t.check('server TPS stays healthy (>= 15)', tps >= 15, { tps })
    const full = new RegExp(`Spieler: ${MAX_PLAYERS}/${MAX_PLAYERS}`)
    await waitFor(() => churn.every(b => sidebarLines(b).some(l => full.test(l))), { timeout: 8000 }).catch(() => null)
    t.check(`every rejoined client has the lobby sidebar showing ${MAX_PLAYERS}/${MAX_PLAYERS}`, churn.every(b => sidebarLines(b).some(l => full.test(l))),
      churn.filter(b => !sidebarLines(b).some(l => full.test(l))).map(b => [b.username, sidebarLines(b)]))

    // ---- a 9th player on the full arena
    const ninth = await join(`Ld${MAX_PLAYERS + 1}`).catch(e => ({ err: e.message }))
    if (ninth.err) t.check('a 9th player on a full arena can connect', false, ninth.err)
    else {
      await sleep(4000)
      const p = ninth.entity.position
      t.check('a 9th player on a full arena is not left in the void and stays connected', p.y > MAP.voidY + 2 && !ninth.disconnected, { pos: p.toString(), chat: ninth.chatLog.slice(-3).map(c => c.m) })
      bots.push(ninth)
    }
    for (const b of [...churn, ...bots]) { try { b.quit() } catch (e) {} }
  }
}
