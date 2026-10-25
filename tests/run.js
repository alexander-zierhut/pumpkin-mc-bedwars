#!/usr/bin/env node
// Test runner. Each spec gets its own throwaway server.
//   node run.js                       run all specs (2 in parallel)
//   node run.js shop bow              run specs whose file name contains "shop" or "bow"
//   node run.js --parallel 1 --keep   sequential, keep server copies of failed specs
// Every spec runs in its own Node process (`--child <file>`): specs sharing one event loop lag each other's bots
// (late packets, physics ticks caught up in bursts), which showed up as server stalls that were none.
//
// A spec is a module in specs/ exporting:
//   module.exports = {
//     name: 'shop',
//     server: { pauseCountdown: 10 },          // optional TestServer options
//     timeout: 240000,                          // optional, ms
//     async run (t) { ... }                     // t = test context, see below
//     skip: 'reason',                           // optional, the spec is not run (e.g. a map that is not there)
//   }
// Test context t:
//   t.server            the TestServer (t.server.cmd('give BotA bow'), t.server.logs())
//   t.bot(name, opts)   connect a 1.8.9 bot (all bots are closed automatically)
//   t.check(name, ok, details)   record a check; failing checks fail the spec, the spec continues
//   t.log(...)          write to the spec log
const fs = require('fs')
const path = require('path')
const { TestServer } = require('./harness/server')
const { connectBot } = require('./harness/bots')

const argv = process.argv.slice(2)
const flag = (name, def) => {
  const i = argv.indexOf(name)
  if (i === -1) return def
  const v = argv[i + 1]
  argv.splice(i, 2)
  return v
}
const keep = argv.includes('--keep')
if (keep) argv.splice(argv.indexOf('--keep'), 1)
// 2: specs share this Node process, with 3 the bots of one spec lag the others (missed draw ticks, late drops)
const parallel = Number(flag('--parallel', '2'))
const child = flag('--child', null)
const filters = argv

const specDir = path.join(__dirname, 'specs')
const reportDir = path.join(__dirname, 'reports')
fs.mkdirSync(reportDir, { recursive: true })
const specFiles = fs.readdirSync(specDir).filter(f => f.endsWith('.test.js'))
  .filter(f => filters.length === 0 || filters.some(x => f.includes(x))).sort()

async function runSpec (file) {
  const spec = require(path.join(specDir, file))
  const name = spec.name || file.replace(/\.test\.js$/, '')
  const lines = []
  const log = (...a) => {
    const line = `${new Date().toISOString().slice(11, 23)} ${a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')}`
    lines.push(line)
    if (process.env.VERBOSE) console.log(`[${name}] ${line}`)
  }
  const checks = []
  const bots = []
  const server = new TestServer(name, spec.server || {})
  const t0 = Date.now()
  let crash = null
  try {
    log('starting server')
    await server.start()
    log(`server up on port ${server.port} (rcon ${server.rconPort})`)
    const t = {
      server,
      log,
      async bot (username, opts = {}) {
        const b = await connectBot(server, username, { log: opts.quiet ? null : log, ...opts })
        bots.push(b)
        return b
      },
      check (checkName, ok, details) {
        checks.push({ name: checkName, ok: !!ok, details: details === undefined ? null : details })
        log(`${ok ? 'PASS' : 'FAIL'} ${checkName}${details !== undefined ? ' :: ' + (typeof details === 'string' ? details : JSON.stringify(details)) : ''}`)
      }
    }
    await Promise.race([
      spec.run(t),
      new Promise((resolve, reject) => setTimeout(() => reject(new Error(`spec timed out after ${spec.timeout || 300000} ms`)), spec.timeout || 300000))
    ])
  } catch (e) {
    crash = e.stack || String(e)
    log(`CRASH ${crash}`)
  }
  for (const b of bots) { try { b.quit() } catch (e) {} }
  const errors = server.container ? server.errors() : []
  checks.push({ name: 'no server/plugin exceptions in log', ok: errors.length === 0, details: errors.slice(0, 20) })
  const ok = !crash && checks.every(c => c.ok)
  const report = { spec: name, file, ok, crash, durationSec: Math.round((Date.now() - t0) / 1000), checks, log: lines }
  if (server.container) fs.writeFileSync(path.join(reportDir, `${name}.server.log`), server.logs())
  if (server.proxyContainer) fs.writeFileSync(path.join(reportDir, `${name}.proxy.log`), server.proxyLogs())
  await server.stop({ keep: keep && !ok })
  fs.writeFileSync(path.join(reportDir, `${name}.json`), JSON.stringify(report, null, 2))
  fs.writeFileSync(path.join(reportDir, `${name}.log`), lines.join('\n') + '\n')
  return report
}

// Ctrl+C / kill: exit normally so the harness releases its server slots (containers are removed by stop()).
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    for (const c of children) c.kill(sig)
    process.exit(130)
  })
}

const REPORT_MARK = '@@report '
const children = new Set()

/** Runs one spec in a child process and returns its report. */
function runSpecInChild (file) {
  return new Promise(resolve => {
    const args = [__filename, '--child', file, ...(keep ? ['--keep'] : [])]
    const proc = require('child_process').spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'inherit'], env: process.env })
    children.add(proc)
    let report = null
    let buf = ''
    proc.stdout.on('data', d => {
      buf += d
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i)
        buf = buf.slice(i + 1)
        if (line.startsWith(REPORT_MARK)) report = JSON.parse(fs.readFileSync(line.slice(REPORT_MARK.length), 'utf8'))
        else console.log(line)
      }
    })
    proc.on('exit', code => {
      children.delete(proc)
      resolve(report || { spec: file, file, ok: false, crash: `spec process exited with ${code} before writing a report`, durationSec: 0, checks: [] })
    })
  })
}

async function main () {
  if (child) {
    const r = await runSpec(child)
    console.log(REPORT_MARK + path.join(reportDir, `${r.spec}.json`))
    process.exit(0)
  }
  if (specFiles.length === 0) {
    console.error('no specs matched')
    process.exit(2)
  }
  const queue = [...specFiles]
  const results = []
  await Promise.all(Array.from({ length: Math.min(parallel, queue.length) }, async () => {
    while (queue.length) {
      const file = queue.shift()
      const skip = require(path.join(specDir, file)).skip
      if (skip) { console.log(`- ${file} skipped: ${skip}`); continue }
      console.log(`▶ ${file}`)
      const r = await runSpecInChild(file)
      results.push(r)
      const failed = r.checks.filter(c => !c.ok)
      console.log(`${r.ok ? '✔' : '✘'} ${r.spec} (${r.durationSec}s) ${r.checks.length - failed.length}/${r.checks.length} checks${r.crash ? ' CRASHED' : ''}`)
      for (const c of failed) console.log(`    ✘ ${c.name}${c.details ? ' :: ' + JSON.stringify(c.details).slice(0, 400) : ''}`)
      if (r.crash) console.log('    ' + r.crash.split('\n').slice(0, 3).join('\n    '))
    }
  }))
  const okCount = results.filter(r => r.ok).length
  console.log(`\n${okCount}/${results.length} specs passed. Reports in tests/reports/`)
  process.exit(okCount === results.length ? 0 : 1)
}

main()
