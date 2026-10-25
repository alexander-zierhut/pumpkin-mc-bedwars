// LAN feedback round 2: no automatic start (an admin starts with the diamond item), no advancement
// messages in chat, readable English price lore in the shop.
const fs = require('fs')
const path = require('path')
const { MAP, waitFor, sleep } = require('../harness/bots')

const onTeamSpawn = bot => Object.values(MAP.teams).some(tm => bot.entity.position.distanceTo({ x: tm.spawn.x, y: tm.spawn.y, z: tm.spawn.z }) < 4)

module.exports = {
  name: 'admin-start',
  server: { pauseCountdown: 3600 },
  timeout: 240000,
  async run (t) {
    const root = path.resolve(__dirname, '..', '..', 'config')
    const arenas = fs.readdirSync(root).filter(f => /^arena-.*\.yml$/.test(f) && !fs.lstatSync(path.join(root, f)).isSymbolicLink())
    t.check('every arena waits 1 h instead of auto-starting', arenas.every(f => /^pauseCountdown: 3600$/m.test(fs.readFileSync(path.join(root, f), 'utf8'))), arenas)
    t.check('shop price is highlighted (white, bold) instead of grey', /- "§f§l%price% %resource%"/.test(fs.readFileSync(path.join(root, 'bedwars.yml'), 'utf8')))
    t.check('advancement messages are off', /false/.test(await t.server.cmd('gamerule show_advancement_messages')),
      await t.server.cmd('gamerule show_advancement_messages'))

    const admin = await t.bot('AdmA'); const other = await t.bot('AdmB')
    await t.server.cmd('op AdmA')
    await sleep(25000)
    t.check('with 2 players the round does not start by itself (25 s)', !onTeamSpawn(admin) && !onTeamSpawn(other),
      { admin: admin.entity.position, other: other.entity.position })

    // the start item is handed out on (re)join to players with bw.vip.startitem (ops)
    admin.chat('/bw leave')
    await waitFor(() => admin.inventory.items().some(i => i.name === 'diamond'), { timeout: 15000, what: 'start item' }).catch(() => {})
    const diamond = admin.inventory.items().find(i => i.name === 'diamond')
    t.check('the admin gets the diamond start item in the lobby', !!diamond, admin.inventory.items().map(i => i.name))
    t.check('a normal player gets no start item', !other.inventory.items().some(i => i.name === 'diamond'), other.inventory.items().map(i => i.name))
    const startItemSlot = diamond ? diamond.slot : null; void startItemSlot

    // the admin assigns the teams, then starts with /start (wait until the admin is back in the lobby after /bw leave)
    await waitFor(() => admin.chatLog.some(c => /AdmA joined the game! \[2\//.test(c.m)), { timeout: 15000, what: 'admin back in the lobby' }).catch(() => {})
    await sleep(1000)
    const [teamA, teamB] = MAP.teamNames
    admin.chat(`/setteam AdmA ${teamA}`); await sleep(700)
    admin.chat(`/setteam AdmB ${teamB}`); await sleep(700)
    const assigned = admin.chatLog.slice(-8).map(c => c.m)
    t.check('/setteam puts players into the chosen teams', assigned.some(m => m.includes(`AdmB is now in team ${teamB}`)) && assigned.some(m => m.includes(`AdmA is now in team ${teamA}`)), assigned)
    admin.chat('/start')
    const started = await waitFor(() => onTeamSpawn(admin) && onTeamSpawn(other), { timeout: 15000, what: 'game start' }).then(() => true, () => false)
    t.check('/start begins the round', started, { admin: admin.entity.position })
    const near = (bot, team) => bot.entity.position.distanceTo(MAP.teams[team].spawn) < 4
    t.check('players start on the teams the admin assigned', near(admin, teamA) && near(other, teamB), { admin: admin.entity.position, other: other.entity.position })

    // shop lore as the client sees it
    await sleep(1000)
    const v = Object.values(admin.entities).filter(e => /villager/i.test(e.name || ''))
      .sort((a, b) => a.position.distanceTo(admin.entity.position) - b.position.distanceTo(admin.entity.position))[0]
    if (v) {
      await t.server.cmd(`execute as AdmA at @s run tp @s ${v.position.x - Math.sign(v.position.x) * 1.5} ${v.position.y} ${v.position.z}`)
      await sleep(1200)
      await admin.lookAt(v.position.offset(0, 1.2, 0), true)
      const win = new Promise(resolve => { admin.once('windowOpen', resolve); setTimeout(() => resolve(null), 3000) })
      require('../harness/bots').useEntity(admin, v)
      const w = await win
      const lore = w && w.slots.slice(0, w.inventoryStart).filter(Boolean).map(it => require('../harness/bots').itemLore(admin, it).join(' ')).join(' ')
      t.check('shop lore shows the price in bold white (§f§l)', !!lore && /§f§l\d/.test(lore), lore && lore.slice(0, 300))
    } else t.check('shop villager visible', false)
  }
}
