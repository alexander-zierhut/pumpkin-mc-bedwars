// Built-in scripted strategies for --scripted demo rounds (drives the same HTTP API an LLM agent would use).
// Per team the first player (alphabetical) attacks: collect -> buy -> bridge to the enemy base -> fight -> break the bed.
// All other players defend: collect -> buy -> defend_bed -> stay at home and fight whoever shows up.
'use strict'
const http = require('http')
const sleep = ms => new Promise(r => setTimeout(r, ms))

function request (port, method, path, body) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, path, method, headers: { 'content-type': 'application/json' } }, res => {
      let d = ''
      res.on('data', c => { d += c })
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch (e) { resolve({ raw: d }) } })
    })
    r.on('error', reject)
    if (body) r.write(JSON.stringify(body))
    r.end()
  })
}

class Player {
  constructor (name, port, log) { this.name = name; this.port = port; this.log = log }
  state (peek = true) { return request(this.port, 'GET', '/state' + (peek ? '?peek=1' : '')) }
  /** Starts an action and waits for it to finish; returns the final action record. */
  async act (action, args = {}, { timeout = 120000 } = {}) {
    const started = await request(this.port, 'POST', '/do', { action, ...args })
    if (!started.ok) { this.log(`${this.name}: ${action} rejected: ${started.error}`); return { status: 'failed', msg: started.error } }
    const t0 = Date.now()
    await sleep(300)
    for (;;) {
      const st = await this.state()
      const a = st.action
      if (a && a.id === started.id && a.status !== 'running') { this.log(`${this.name}: ${action} ${JSON.stringify(args)} -> ${a.status}: ${a.msg}`); return a }
      if (Date.now() - t0 > timeout) { await request(this.port, 'POST', '/do', { action: 'stop' }); return { status: 'timeout', msg: 'timeout' } }
      await sleep(500)
    }
  }
}

function inv (st) {
  const items = st.inv ? st.inv.items : []
  let blocks = 0
  for (const i of items) { const m = /^(Sandstone|End Stone|Glass|Iron Block|Glowstone)(?: x(\d+))?$/.exec(i); if (m) blocks += Number(m[2] || 1) }
  return blocks
}

/** players: [{name, port}], isOver(): () => boolean */
async function run (players, { log, isOver }) {
  const ps = players.map(p => new Player(p.name, p.port, log))
  // wait for the game start
  await Promise.all(ps.map(async p => { for (;;) { const s = await p.state().catch(() => ({})); if (s.phase === 'running' && s.team) return; if (isOver()) return; await sleep(1000) } }))
  const states = await Promise.all(ps.map(p => p.state()))
  const teamOf = {}
  states.forEach((s, i) => { teamOf[ps[i].name] = s.team })
  log('teams: ' + JSON.stringify(teamOf))
  const roles = {}
  for (const team of new Set(Object.values(teamOf))) {
    const mates = ps.filter(p => teamOf[p.name] === team).map(p => p.name).sort()
    mates.forEach((n, i) => { roles[n] = i === 0 ? 'attacker' : 'defender' })
  }
  log('roles: ' + JSON.stringify(roles))
  await Promise.all(ps.map(p => (roles[p.name] === 'attacker' ? attacker(p, isOver, log) : defender(p, isOver, log)).catch(e => log(`${p.name} script error: ${e.stack || e.message}`))))
}

async function shopRun (p, bronzeSeconds, blocks) {
  await p.act('collect', { resource: 'bronze', seconds: bronzeSeconds })
  await p.act('buy', { item: 'Sandstone', count: blocks })
  for (const it of ['Leather Helmet', 'Leather Leggings', 'Leather Boots']) await p.act('buy', { item: it })
}

async function attacker (p, isOver, log) {
  await shopRun(p, 25, 45)
  await p.act('collect', { resource: 'silver', seconds: 25, bridge: true })
  for (const it of ['Sword I', 'Chestplate I']) await p.act('buy', { item: it })
  let lastBridge = 0
  while (!isOver()) {
    const st = await p.state()
    if (st.phase !== 'running') break
    if (!st.alive || st.spectator) { await sleep(2000); continue }
    const hasWeapon = (st.inv.items || []).some(i => /Sword|Knockback Stick/.test(i))
    if (st.on === 'own_base' && !hasWeapon) {
      // died: re-arm cheaply with bronze items
      await p.act('collect', { resource: 'bronze', seconds: 12 })
      await p.act('buy', { item: 'Knockback Stick' })
      for (const it of ['Leather Helmet', 'Leather Leggings', 'Leather Boots']) await p.act('buy', { item: it })
      if (inv(st) < 40) await p.act('buy', { item: 'Sandstone', count: 40 })
      continue
    }
    const near = st.near.filter(q => q.team && q.team !== st.team && q.d <= 14)
    if (st.on === 'enemy_base' || near.length) {
      const adjacent = near.filter(q => q.d <= 5)
      if (adjacent.length) { await p.act('attack', { seconds: 6 }); continue }
      if (st.enemy_bed === 'alive' && st.on === 'enemy_base') { const r = await p.act('break_bed', { seconds: 45 }); if (r.status === 'failed') await p.act('attack', { seconds: 10 }); continue }
      if (near.length) { await p.act('attack', { seconds: 12 }); continue }
      await p.act('attack', { seconds: 20 })
      continue
    }
    // not at the enemy yet (start of the game or after a death): walk over an existing bridge, else build one
    const g = await p.act('goto', { target: 'enemy_base' }, { timeout: 90000 })
    if (g.status === 'done') continue
    if (inv(st) < 40) {
      await p.act('goto', { target: 'own_base' })
      await shopRun(p, 20, 45)
    }
    const b = await p.act('bridge', { target: 'enemy_base' }, { timeout: 150000 })
    if (b.status !== 'done' && Date.now() - lastBridge < 5000) await sleep(2000)
    lastBridge = Date.now()
  }
}

async function defender (p, isOver, log) {
  // the attacker stands on the bronze pad at the start, so start with the silver spawner instead
  await p.act('collect', { resource: 'silver', seconds: 22, bridge: true })
  await shopRun(p, 18, 20)
  for (const it of ['Sword I', 'Chestplate I']) await p.act('buy', { item: it })
  await p.act('defend_bed', { blocks: 12 })
  while (!isOver()) {
    const st = await p.state()
    if (st.phase !== 'running') break
    if (!st.alive || st.spectator) { await sleep(2000); continue }
    const near = st.near.filter(q => q.team && q.team !== st.team && q.d <= 16)
    if (near.length) { await p.act('attack', { seconds: 12 }); continue }
    if (st.on !== 'own_base') { await p.act('goto', { target: 'own_base' }); continue }
    await p.act('collect', { resource: 'bronze', seconds: 12 })
    if (inv(st) < 12) { await p.act('buy', { item: 'Sandstone', count: 8 }); await p.act('defend_bed', { blocks: 6 }) }
  }
}

module.exports = { run, Player, request }
