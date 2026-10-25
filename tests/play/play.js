#!/usr/bin/env node
// Tiny CLI for the bot daemon API.
//   node play.js <httpPort> state [peek]
//   node play.js <httpPort> do '<json>'          e.g. do '{"action":"goto","target":"middle"}'
//   node play.js <httpPort> <action> [json|key=value ...]   shortcut, e.g.  goto target=middle   collect resource=bronze seconds=20
//   node play.js <httpPort> help
'use strict'
const http = require('http')
const [port, cmd, ...rest] = process.argv.slice(2)
if (!port || !cmd) { console.error('usage: node play.js <httpPort> state | do \'<json>\' | <action> [key=value ...] | help'); process.exit(2) }

function req (method, path, body) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port: Number(port), path, method, headers: { 'content-type': 'application/json' } }, res => {
      let d = ''
      res.on('data', c => { d += c })
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch (e) { resolve({ raw: d }) } })
    })
    r.on('error', e => reject(e))
    if (body) r.write(body)
    r.end()
  })
}
const j = v => JSON.stringify(v)
function show (o) {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    for (const [k, v] of Object.entries(o)) {
      if (v === null || v === undefined) continue
      if (k === 'chat') { console.log('chat:'); for (const l of v) console.log('  ' + l); if (!v.length) console.log('  (none)'); continue }
      console.log(`${k}: ${j(v)}`)
    }
  } else console.log(j(o))
}
function parseKV (items) {
  if (items.length === 1 && items[0].trim().startsWith('{')) return JSON.parse(items[0])
  const o = {}
  for (const it of items) {
    const i = it.indexOf('=')
    if (i < 0) continue
    let v = it.slice(i + 1)
    if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v)
    o[it.slice(0, i)] = v
  }
  return o
}
;(async () => {
  try {
    if (cmd === 'state') return show(await req('GET', '/state' + (rest.includes('peek') ? '?peek=1' : '')))
    if (cmd === 'help') return console.log(j(await req('GET', '/help')))
    if (cmd === 'do') {
      const a = JSON.parse(rest.join(' '))
      return show(await req('POST', '/do', j(a)))
    }
    const a = parseKV(rest)
    a.action = cmd
    show(await req('POST', '/do', j(a)))
  } catch (e) { console.error('error:', e.message, '(is botd running on port ' + port + '?)'); process.exit(1) }
})()
