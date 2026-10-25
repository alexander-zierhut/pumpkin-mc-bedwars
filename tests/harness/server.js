// Starts a throwaway copy of the Pumpkin BedWars server in Docker, on free ports, in offline mode.
// The copy is made from ../server (assembled by tools/apply.sh: pumpkin.toml, plugins, worlds), so tests
// always run against what is checked in. Bots speak 26.1 (newest mineflayer) and reach the 26.3 server
// through a ViaProxy container that shares the server container's network; players connect directly.
const { execFileSync, spawnSync } = require('child_process')
const fs = require('fs')
const net = require('net')
const path = require('path')
const { Rcon } = require('./rcon')

const ROOT = path.resolve(__dirname, '..', '..')
// BW_TEMPLATE: another assembled server directory (e.g. a copy with a different plugin build)
const TEMPLATE = process.env.BW_TEMPLATE ? path.resolve(process.env.BW_TEMPLATE) : path.join(ROOT, 'server')
const RUNS = path.join(ROOT, 'tests', '.runs')
const BINARY = process.env.PUMPKIN_BIN ? path.resolve(process.env.PUMPKIN_BIN) : path.join(ROOT, 'build', 'pumpkin')
const VIAPROXY = path.join(ROOT, 'proxy', 'ViaProxy.jar')
const SERVER_IMAGE = 'debian:bookworm-slim'
const PROXY_IMAGE = 'eclipse-temurin:25-jre-alpine'
const RCON_PASSWORD = 'test-rcon'
const SKIPPED = new Set(['logs', 'cache'])

function freePort () {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ---------------------------------------------------------------- machine-wide server limit
// A slot is a directory created atomically with mkdir; stale slots (owner process gone) are reclaimed.
// Pumpkin needs ~50 MB and ViaProxy ~300 MB, so more servers fit than with Paper; BW_MAX_SERVERS overrides (default 3, the machine is shared).
const SLOTS = path.join(ROOT, 'tests', '.slots')
const MAX_SERVERS = Number(process.env.BW_MAX_SERVERS || 3)

function pidAlive (pid) {
  try { process.kill(pid, 0); return true } catch (e) { return e.code === 'EPERM' }
}

async function acquireSlot (label) {
  fs.mkdirSync(SLOTS, { recursive: true })
  let announced = false
  for (;;) {
    for (let i = 0; i < MAX_SERVERS; i++) {
      const dir = path.join(SLOTS, `slot-${i}`)
      try {
        fs.mkdirSync(dir)
      } catch (e) {
        if (e.code !== 'EEXIST') throw e
        let owner = null
        try { owner = JSON.parse(fs.readFileSync(path.join(dir, 'owner.json'), 'utf8')) } catch (err) {}
        const age = Date.now() - (fs.statSync(dir).mtimeMs || 0)
        if ((owner && !pidAlive(owner.pid)) || (!owner && age > 30000)) fs.rmSync(dir, { recursive: true, force: true })
        continue
      }
      fs.writeFileSync(path.join(dir, 'owner.json'), JSON.stringify({ pid: process.pid, label, since: new Date().toISOString() }))
      return dir
    }
    if (!announced) {
      console.error(`[harness] all ${MAX_SERVERS} test-server slots busy, waiting for a free one (${label})`)
      announced = true
    }
    await sleep(2000)
  }
}

/** Sets `key = value` inside `[section]` of a TOML text (adds the key if missing). */
function tomlSet (text, section, key, value) {
  const head = new RegExp(`^\\[${section.replace(/\./g, '\\.')}\\]\\n`, 'm')
  const m = head.exec(text)
  if (!m) return text + `\n[${section}]\n${key} = ${value}\n`
  const start = m.index + m[0].length
  const rest = text.slice(start)
  const next = rest.search(/^\[/m)
  let block = next === -1 ? rest : rest.slice(0, next)
  const line = new RegExp(`^${key} = .*$`, 'm')
  block = line.test(block) ? block.replace(line, `${key} = ${value}`) : `${key} = ${value}\n` + block
  return text.slice(0, start) + block + (next === -1 ? '' : rest.slice(next))
}

class TestServer {
  /**
   * @param {string} name   short name used for the container and run directory
   * @param {object} opts
   *   pauseCountdown  lobby countdown in seconds (default 10)
   *   minPlayers      players needed to start (default 2)
   *   arena           arena players are auto-joined into (default: Rush)
   *   settings        extra plugin settings, applied with `/bwconfig <key> <value>` after start
   *   prepare(dir)    optional hook to modify the copied server dir before start
   */
  constructor (name, opts = {}) {
    this.name = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
    this.opts = opts
    this.logCursor = 0
  }

  async start () {
    if (!fs.existsSync(path.join(TEMPLATE, 'pumpkin.toml'))) throw new Error('server/ is missing, run tools/apply.sh first')
    this.slot = await acquireSlot(this.name)
    const release = () => {
      for (const c of [this.proxyContainer, this.container]) if (c) spawnSync('docker', ['rm', '-f', c])
      try { fs.rmSync(this.slot, { recursive: true, force: true }) } catch (e) {}
    }
    this.releaseSlot = release
    process.once('exit', release)
    this.directPort = await freePort()
    this.port = this.opts.port || await freePort() // ViaProxy port, the one bots use
    this.rconPort = await freePort()
    this.container = `pktest-${this.name}-${this.port}`
    this.proxyContainer = `${this.container}-via`
    this.dir = path.join(RUNS, `${this.name}-${this.port}`)
    fs.rmSync(this.dir, { recursive: true, force: true })
    fs.mkdirSync(this.dir, { recursive: true })
    for (const entry of fs.readdirSync(TEMPLATE)) {
      if (SKIPPED.has(entry)) continue
      execFileSync('cp', ['-a', path.join(TEMPLATE, entry), path.join(this.dir, entry)])
    }

    let toml = fs.readFileSync(path.join(this.dir, 'pumpkin.toml'), 'utf8')
    toml = tomlSet(toml, 'networking.java', 'online_mode', 'false')
    toml = tomlSet(toml, 'networking.java', 'encryption', 'false')
    toml = tomlSet(toml, 'networking.java.authentication', 'enabled', 'false')
    toml = tomlSet(toml, 'networking.java.packet_limiter', 'enabled', 'false')
    toml = tomlSet(toml, 'networking.rcon', 'password', `"${RCON_PASSWORD}"`)
    toml = tomlSet(toml, 'networking.rcon', 'enabled', 'true')
    toml = tomlSet(toml, 'logging', 'color', 'false')
    fs.writeFileSync(path.join(this.dir, 'pumpkin.toml'), toml)
    if (this.opts.prepare) await this.opts.prepare(this.dir)

    const uid = `${process.getuid()}:${process.getgid()}`
    execFileSync('docker', ['run', '-d', '--name', this.container, '-u', uid, '--memory', '768m',
      '-p', `127.0.0.1:${this.directPort}:25565`, '-p', `127.0.0.1:${this.port}:25566`, '-p', `127.0.0.1:${this.rconPort}:25575`,
      '-v', `${this.dir}:/srv`, '-v', `${BINARY}:/usr/local/bin/pumpkin:ro`, '-w', '/srv', '-e', 'RUST_BACKTRACE=1',
      SERVER_IMAGE, 'pumpkin'], { stdio: 'ignore' })
    execFileSync('docker', ['run', '-d', '--name', this.proxyContainer, '-u', uid, '--memory', '640m', '--network', `container:${this.container}`,
      '-v', `${VIAPROXY}:/viaproxy.jar:ro`, '-e', 'HOME=/tmp', '-w', '/tmp', PROXY_IMAGE,
      'java', '-Xmx320m', '-XX:+UseSerialGC', '-jar', '/viaproxy.jar', 'cli',
      '--bind-address', '0.0.0.0:25566', '--target-address', '127.0.0.1:25565', '--target-version', '26.3',
      '--compression-threshold', '-1', '--log-ips', 'false'], { stdio: 'ignore' })

    const t0 = Date.now()
    while (!/Server is now running/.test(this.logs())) {
      if (Date.now() - t0 > 60000) throw new Error(`server ${this.container} did not start:\n${this.logs().slice(-3000)}`)
      if (!this.running()) throw new Error(`server ${this.container} exited:\n${this.logs().slice(-3000)}`)
      await sleep(200)
    }
    for (let i = 0; ; i++) {
      try { this.rcon = await new Rcon('127.0.0.1', this.rconPort, RCON_PASSWORD).connect(); break } catch (e) {
        if (i > 50) throw e
        await sleep(200)
      }
    }
    while (!/Binding proxy server/.test(this.proxyLogs())) {
      if (Date.now() - t0 > 90000) throw new Error(`ViaProxy did not start:\n${this.proxyLogs().slice(-2000)}`)
      await sleep(300)
    }
    // the bind line comes just before the socket accepts connections
    for (let i = 0; ; i++) {
      const ok = await new Promise(resolve => {
        const c = net.createConnection({ host: '127.0.0.1', port: this.port }, () => { c.destroy(); resolve(true) })
        c.on('error', () => resolve(false))
      })
      if (ok) break
      if (i > 100) throw new Error('ViaProxy port does not accept connections')
      await sleep(200)
    }
    await sleep(500)
    const settings = { countdown: this.opts.pauseCountdown ?? 10, 'min-players': this.opts.minPlayers ?? 2, ...(this.opts.settings || {}) }
    if (this.opts.arena) settings.arena = this.opts.arena
    for (const [k, v] of Object.entries(settings)) await this.cmd(`bwconfig ${k} ${v}`)
    return this
  }

  running () {
    const r = spawnSync('docker', ['inspect', '-f', '{{.State.Running}}', this.container])
    return r.stdout.toString().trim() === 'true'
  }

  /** Full server log so far (colour codes stripped). */
  logs () {
    if (this.finalLogs !== undefined) return this.finalLogs // the container is gone (stopped), see stop()
    const r = spawnSync('docker', ['logs', this.container], { maxBuffer: 64 * 1024 * 1024 })
    return (r.stdout.toString() + r.stderr.toString()).replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/§./g, '')
  }

  proxyLogs () {
    if (this.finalProxyLogs !== undefined) return this.finalProxyLogs
    const r = spawnSync('docker', ['logs', this.proxyContainer], { maxBuffer: 16 * 1024 * 1024 })
    return (r.stdout.toString() + r.stderr.toString()).replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
  }

  /** Log lines that were written since the previous call. */
  newLogs () {
    const all = this.logs()
    const fresh = all.slice(this.logCursor)
    this.logCursor = all.length
    return fresh
  }

  /** Panics, errors and plugin traps. */
  errors () {
    return this.logs().split('\n').filter(l =>
      /( ERROR |panicked at|wasm trap|error while executing|Plugin .* failed)/.test(l) &&
      !/OIDC keys|telemetry/i.test(l))
  }

  cmd (command) { return this.rcon.command(command) }

  async stop ({ keep = false } = {}) {
    try { if (this.rcon) this.rcon.close() } catch (e) {}
    // keep the logs: specs that stop their own server (or the runner's) still get them into the report
    if (this.container && this.finalLogs === undefined) { this.finalLogs = this.logs(); this.finalProxyLogs = this.proxyLogs() }
    if (this.releaseSlot) this.releaseSlot()
    if (!keep && this.dir) fs.rmSync(this.dir, { recursive: true, force: true })
  }
}

module.exports = { TestServer, ROOT, tomlSet }
