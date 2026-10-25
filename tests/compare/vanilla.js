// A real vanilla Minecraft 1.8.9 server (Mojang server.jar, eclipse-temurin:8-jre) in a throwaway Docker container.
// Same interface as harness/server.js TestServer where it matters: .port (bots, version 1.8.9), .cmd() (RCON), .stop().
const { execFileSync, spawnSync } = require('child_process')
const fs = require('fs')
const net = require('net')
const path = require('path')
const { Rcon } = require('../harness/rcon')

const HERE = __dirname
const TEMPLATE = path.join(HERE, 'vanilla189')
const RUNS = path.join(HERE, '.runs')
const PW = 'test-rcon'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer()
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)) })
  s.on('error', reject)
})

class Vanilla189 {
  constructor (name = 'vanilla189') { this.name = name }

  async start () {
    this.port = await freePort()
    this.rconPort = await freePort()
    this.container = `bowcmp-${this.name}-${this.port}`
    this.dir = path.join(RUNS, this.container)
    fs.rmSync(this.dir, { recursive: true, force: true })
    fs.mkdirSync(this.dir, { recursive: true })
    for (const f of ['server.jar', 'eula.txt', 'server.properties']) fs.copyFileSync(path.join(TEMPLATE, f), path.join(this.dir, f))
    const uid = `${process.getuid()}:${process.getgid()}`
    process.once('exit', () => spawnSync('docker', ['rm', '-f', this.container]))
    execFileSync('docker', ['run', '-d', '--name', this.container, '--memory', '1g', '-u', uid,
      '-p', `127.0.0.1:${this.port}:25565`, '-p', `127.0.0.1:${this.rconPort}:25575`,
      '-v', `${this.dir}:/srv`, '-w', '/srv', 'eclipse-temurin:8-jre',
      'java', '-Xmx640m', '-Xms256m', '-XX:+UseSerialGC', '-jar', 'server.jar', 'nogui'], { stdio: 'ignore' })
    const t0 = Date.now()
    while (!/Done \(/.test(this.logs())) {
      if (Date.now() - t0 > 120000) throw new Error('1.8.9 did not start:\n' + this.logs().slice(-2000))
      await sleep(300)
    }
    for (let i = 0; ; i++) {
      try { this.rcon = await new Rcon('127.0.0.1', this.rconPort, PW).connect(); break } catch (e) {
        if (i > 50) throw e
        await sleep(300)
      }
    }
    return this
  }

  logs () {
    const r = spawnSync('docker', ['logs', this.container], { maxBuffer: 64 * 1024 * 1024 })
    return (r.stdout.toString() + r.stderr.toString()).replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
  }

  cmd (c) { return this.rcon.command(c) }

  async stop () {
    try { if (this.rcon) this.rcon.close() } catch (e) {}
    spawnSync('docker', ['rm', '-f', this.container])
    if (this.dir) fs.rmSync(this.dir, { recursive: true, force: true })
  }
}

module.exports = { Vanilla189 }
