#!/usr/bin/env node
// Orchestrates one BedWars session on a throwaway server: server + recorder (camera) + one bot daemon per player.
//   node round.js --players "Alice,Bob,Carl,Dora" [--scripted] [--out-dir replays] [--pause 20] [--memory 2G]
//                 [--api-base 9101] [--max-minutes 30] [--no-recorder]
// Ctrl-C (or the end of the game) stops everything and leaves replay.json in <out-dir>/<timestamp>/.
'use strict'
const { spawn } = require('child_process')
const fs = require('fs')
const net = require('net')
const path = require('path')
const { TestServer } = require('../harness/server')
const L = require('./lib')

const argv = process.argv.slice(2)
const opt = {}
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true
const PLAYERS = String(opt.players || 'Alice,Bob').split(',').map(s => s.trim()).filter(Boolean)
const SCRIPTED = !!opt.scripted
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const OUT_DIR = path.resolve(opt['out-dir'] || path.join(__dirname, 'replays'), stamp)
const API_BASE = Number(opt['api-base'] || 9101)
const MAX_MIN = Number(opt['max-minutes'] || 30)
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), '[round]', ...a)
const sleep = L.sleep

const children = []
function run (file, args, logName) {
  const out = fs.openSync(path.join(OUT_DIR, logName), 'a')
  const child = spawn(process.execPath, [path.join(__dirname, file), ...args], { stdio: ['ignore', out, out] })
  children.push(child)
  return child
}
function portFree (port) {
  return new Promise(resolve => {
    const s = net.createServer()
    s.once('error', () => resolve(false))
    s.listen(port, '127.0.0.1', () => s.close(() => resolve(true)))
  })
}

let server = null
let over = false
let stopping = false
let recorder = null

async function stopAll (why) {
  if (stopping) return
  stopping = true
  over = true
  log(`stopping (${why})`)
  // recorder first: it writes the replay when it receives SIGINT
  if (recorder && recorder.exitCode === null) {
    recorder.kill('SIGINT')
    await Promise.race([new Promise(r => recorder.once('exit', r)), sleep(60000)])
  }
  for (const c of children) if (c.exitCode === null) c.kill('SIGTERM')
  await sleep(500)
  try { if (server) { fs.writeFileSync(path.join(OUT_DIR, 'server.log'), server.logs()); await server.stop() } } catch (e) { log('server stop failed:', e.message) }
  summary()
  process.exit(0)
}

function summary () {
  const f = path.join(OUT_DIR, 'replay.json')
  if (!fs.existsSync(f)) { log('no replay.json was written'); return }
  try {
    const r = JSON.parse(fs.readFileSync(f, 'utf8'))
    const types = {}
    for (const e of r.events) types[e.type] = (types[e.type] || 0) + 1
    log(`replay: ${f} (${(fs.statSync(f).size / 1e6).toFixed(1)} MB)`)
    log(`  duration ${(r.meta.durationMs / 1000).toFixed(0)} s, ${r.frames.length} frames, ${r.events.length} events ${JSON.stringify(types)}, ${r.blocks.length} block changes, ${r.initialBlocks.length} initial blocks, winner: ${r.meta.winner}`)
  } catch (e) { log('replay unreadable:', e.message) }
}

async function main () {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  log('starting throwaway server (about 20 s)...')
  server = new TestServer('play', { pauseCountdown: Number(opt.pause || 20), minPlayers: 2, memory: String(opt.memory || '1G') })
  await server.start()
  const rconPw = 'test-rcon'
  // the (only) arena file of the throwaway copy, e.g. rush.yml
  const arenaDir = path.join(server.dir, 'plugins', 'BedWars', 'arenas')
  const arena = path.join(arenaDir, fs.readdirSync(arenaDir).filter(f => f.endsWith('.yml')).sort()[0])
  log(`server up: minecraft 127.0.0.1:${server.port}  rcon ${server.rconPort}`)

  if (!opt['no-recorder']) {
    recorder = run('recorder.js', ['--port', server.port, '--rcon', server.rconPort, '--rcon-password', rconPw, '--out', path.join(OUT_DIR, 'replay.json'), '--arena', arena], 'recorder.log')
    recorder.on('exit', code => { log(`recorder exited (${code})`); if (!stopping) setTimeout(() => stopAll('recorder finished (game over)'), 1500) })
    await sleep(3500) // the camera joins first and switches its own auto-join off
  }

  const players = []
  let port = API_BASE
  for (const name of PLAYERS) {
    while (!(await portFree(port))) port++
    run('botd.js', ['--port', server.port, '--name', name, '--api', port, '--arena', arena], `botd-${name}.log`)
    players.push({ name, port })
    port++
  }
  fs.writeFileSync(path.join(OUT_DIR, 'session.json'), JSON.stringify({ minecraftPort: server.port, rconPort: server.rconPort, players, replay: path.join(OUT_DIR, 'replay.json') }, null, 2))
  await sleep(3000)

  console.log('')
  console.log('==================== BedWars session ====================')
  console.log(`Minecraft (offline mode): 127.0.0.1:${server.port}    RCON: ${server.rconPort} (password ${rconPw})`)
  console.log(`Replay will be written to: ${path.join(OUT_DIR, 'replay.json')}`)
  console.log('Players and their bot APIs:')
  for (const p of players) console.log(`  ${p.name.padEnd(10)} http://127.0.0.1:${p.port}   node tests/play/play.js ${p.port} state`)
  console.log('The lobby countdown starts as soon as 2 players are connected (20 s), then the round begins.')
  console.log('Agents: read tests/play/README.md, then loop:  play.js <port> state  ->  play.js <port> do \'{"action":...}\'')
  console.log(SCRIPTED ? 'Mode: scripted demo (built-in strategies play all bots).' : 'Mode: manual. Press Ctrl-C to end the session and save the replay.')
  console.log(`Safety stop after ${MAX_MIN} minutes.`)
  console.log('=========================================================')
  console.log('')

  process.on('SIGINT', () => stopAll('SIGINT'))
  process.on('SIGTERM', () => stopAll('SIGTERM'))
  setTimeout(() => stopAll('time limit'), MAX_MIN * 60000)

  if (SCRIPTED) {
    const scripted = require('./scripted')
    await scripted.run(players, { log: (...a) => log(...a), isOver: () => over })
    if (!over) { log('scripts finished'); await sleep(8000); stopAll('scripts finished') }
  }
}

main().catch(async e => { console.error(e); try { if (server) await server.stop() } catch (x) {} process.exit(1) })
