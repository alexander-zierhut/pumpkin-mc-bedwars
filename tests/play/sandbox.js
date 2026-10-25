#!/usr/bin/env node
// Sandbox: a throwaway copy of the server where a single player can try the shop and items.
// The game starts with MIN_PLAYERS players (default 2); ops can use "/bw cheat give <bronze|iron|gold> <amount>".
//   node play/sandbox.js <op-name> [<op-name> ...]      (Ctrl-C stops and removes it)
const fs = require('fs')
const path = require('path')
const { TestServer } = require('../harness/server')

const ops = process.argv.slice(2)
;(async () => {
  const server = new TestServer('sandbox', {
    minPlayers: Number(process.env.MIN_PLAYERS || 2),
    port: Number(process.env.PORT || 25570),
    pauseCountdown: Number(process.env.COUNTDOWN || 3600),

    prepare (dir) {
      const cfg = path.join(dir, 'plugins', 'BedWars', 'config.yml')
      fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^enable-cheat-command-for-admins: false$/m, 'enable-cheat-command-for-admins: true'))
    }
  })
  await server.start()
  for (const name of ops) console.log(await server.cmd(`op ${name}`))
  console.log(`SANDBOX READY on 127.0.0.1:${server.port} (rcon ${server.rconPort})`)
  const stop = async () => { await server.stop(); process.exit(0) }
  process.on('SIGINT', stop); process.on('SIGTERM', stop)
  setInterval(() => {}, 1 << 30)
})().catch(e => { console.error(e); process.exit(1) })
