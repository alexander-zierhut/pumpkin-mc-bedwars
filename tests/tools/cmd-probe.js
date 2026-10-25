// Starts a throwaway server with two bots in a running round and prints the console answer to every argument:
//   node tools/cmd-probe.js "execute if entity @e[type=item]" "data get entity CmdA Health"
const { TestServer } = require('../harness/server')
const { connectBot, waitForGameStart, sleep } = require('../harness/bots')
;(async () => {
  const s = new TestServer('dbg-cmd', { pauseCountdown: 3 })
  await s.start()
  try {
    const a = await connectBot(s, 'CmdA'); const b = await connectBot(s, 'CmdB')
    await Promise.all([waitForGameStart(a), waitForGameStart(b)])
    await sleep(3000)
    for (const c of process.argv.slice(2)) console.log('>', c, '\n ', JSON.stringify(await s.cmd(c)))
  } finally { await s.stop(); process.exit(0) }
})()
