// A player who just respawned (respawn protection) still dies in the void: the void/kill damage types arrive kebab-case
// (`out-of-world`, `generic-kill`) and must pass the protection, otherwise the player falls forever.
const { MAP, waitFor, sleep } = require('../harness/bots')
module.exports = {
  name: 'void-protection', server: { pauseCountdown: 3600 }, timeout: 120000,
  async run (t) {
    const a = await t.bot('VdA'); const b = await t.bot('VdB')
    await t.server.cmd('op VdA')
    await sleep(3000)
    const [ta, tb] = MAP.teamNames
    a.chat(`/setteam VdA ${ta}`); await sleep(600); a.chat(`/setteam VdB ${tb}`); await sleep(600)
    a.chat('/start')
    await waitFor(() => MAP.teams[ta] && a.entity.position.distanceTo(MAP.teams[ta].spawn) < 4, { timeout: 15000, what: 'start' })
    await sleep(2500)
    await t.server.cmd('kill VdB')
    await sleep(900)
    const t0 = Date.now()
    const sp = MAP.teams[tb].spawn
    await t.server.cmd(`tp VdB ${sp.x} ${MAP.voidY - 10} ${sp.z}`)
    await sleep(1500)
    const msgs = b.chatLog.filter(c => c.t >= t0 && /died|was killed|Respawn/.test(c.m)).map(c => c.m)
    t.check('void death during respawn protection', msgs.some(m => /died|was killed/.test(m)), { msgs, y: b.entity.position.y, voidY: MAP.voidY })
  }
}
