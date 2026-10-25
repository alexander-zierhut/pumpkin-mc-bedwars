// LAN-party feedback (24.10.): slower bronze/silver, one bronze spawner per base, gold 4 per drop,
// 1.8 regeneration speed, Quick Buy items on the shop's main page, sorting the own inventory while the shop is open.
const { MAP, waitForGameStart, waitFor, sleep, countItem, Vec3 } = require('../harness/bots')

const GOLD = MAP.spawners.filter(s => s.type === 'gold')

async function openShop (bot) {
  const v = Object.values(bot.entities).filter(e => /villager/i.test(e.name || ''))
    .sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position))[0]
  if (!v) throw new Error('no shop villager visible')
  await bot.lookAt(v.position.offset(0, 1.2, 0), true)
  const win = new Promise(resolve => { bot.once('windowOpen', resolve); setTimeout(() => resolve(null), 3000) })
  require('../harness/bots').useEntity(bot, v)
  return win
}

module.exports = {
  name: 'feedback',
  timeout: 300000,
  async run (t) {
    const a = await t.bot('FbA'); const b = await t.bot('FbB')
    const [ta] = await Promise.all([waitForGameStart(a), waitForGameStart(b)])
    const tp = (bot, p) => t.server.cmd(`execute as ${bot.username} at @s run tp @s ${p.x} ${p.y} ${p.z}`)

    // --- spawner layout
    const bronze = MAP.spawners.filter(s => s.type === 'bronze')
    t.check('one bronze spawner per base', MAP.teamNames.every(n => bronze.filter(s => s.team === n).length === 1), bronze)
    t.check('gold spawner drops 4 ingots at a time', GOLD.length === 1 && Number(require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'config', 'arena-rush.yml'), 'utf8').match(/type: gold\n.*\n  startLevel: ([\d.]+)/)[1]) === 4)

    // --- bronze rate: clear the pile, then count for 20 s
    const own = bronze.find(s => s.team === ta)
    await tp(a, own); await sleep(2500)
    const b0 = countItem(a, 'brick'); await sleep(20000)
    const bronzeRate = (countItem(a, 'brick') - b0) / 20
    t.check('bronze: about 1 per second (0.7..1.4)', bronzeRate >= 0.7 && bronzeRate <= 1.4, { perSecond: bronzeRate })

    // --- silver rate: clear the pile, then count for 31 s
    const silver = MAP.nearestSpawner('silver', MAP.teams[ta].spawn)
    await tp(a, silver); await sleep(2500)
    const s0 = countItem(a, 'iron_ingot'); await sleep(31000)
    const silverGot = countItem(a, 'iron_ingot') - s0
    t.check('silver: about 1 per 10 s (2..4 in 31 s)', silverGot >= 2 && silverGot <= 4, { in31s: silverGot })

    // --- gold: one drop = 4 ingots
    await tp(a, GOLD[0]); await sleep(1500)
    const g0 = countItem(a, 'gold_ingot')
    await waitFor(() => countItem(a, 'gold_ingot') > g0, { timeout: 33000, what: 'a gold drop' }).catch(() => {})
    await sleep(800)
    const goldDrop = countItem(a, 'gold_ingot') - g0
    t.check('gold: a drop gives 4 ingots', goldDrop >= 4 && goldDrop % 4 === 0, { got: goldDrop })

    // --- regeneration: 1.8 speed (1 HP per 4 s)
    await t.server.cmd(`effect give ${a.username} minecraft:saturation 1 10 true`)
    await sleep(1200)
    await t.server.cmd(`damage ${a.username} 10 minecraft:generic`)
    await sleep(800)
    const h0 = a.health; await sleep(20000)
    const regenRate = (a.health - h0) / 20
    t.check('natural regeneration about 1 HP per 4 s (0.15..0.35 HP/s)', regenRate >= 0.15 && regenRate <= 0.35, { hpPerSecond: regenRate, from: h0, to: a.health })

    // --- shop: Quick Buy items on the main page
    const sp = MAP.nearestStore(MAP.teams[ta].spawn)
    await tp(a, { x: sp.x - (sp.x > 0 ? 1.5 : -1.5), y: sp.y, z: sp.z }); await sleep(1500)
    const win = await openShop(a)
    t.check('shop opens', !!win)
    if (!win) return
    const top = win.slots.slice(0, win.inventoryStart)
    const names = top.map((it, i) => it ? `${i}:${it.name}` : null).filter(Boolean)
    const sand = top.findIndex(it => it && it.name === 'red_sandstone' && it.count === 2)
    t.check('main page shows the Quick Buy items (Sandstone x2 buyable without opening a category)', sand >= 9, { names })
    t.check('main page still shows the category icons in the first row', top.slice(0, 9).filter(Boolean).length >= 8, { firstRow: names.filter(n => Number(n.split(':')[0]) < 9) })
    const bronzeBefore = countItem(a, 'brick'); const sandBefore = countItem(a, 'red_sandstone')
    await a.clickWindow(sand, 0, 0); await sleep(900)
    t.check('buying from the main page works', countItem(a, 'red_sandstone') === sandBefore + 2 && countItem(a, 'brick') === bronzeBefore - 1,
      { sand: countItem(a, 'red_sandstone') - sandBefore, bronze: countItem(a, 'brick') - bronzeBefore })

    // --- sorting the own inventory with number keys while the shop is open
    const w = a.currentWindow
    const invSlot = w.slots.findIndex((it, i) => i >= w.inventoryStart && i < w.inventoryStart + 35 && it && it.name === 'red_sandstone')
    const hotbar8 = w.inventoryStart + 27 + 8
    const before8 = w.slots[hotbar8] && w.slots[hotbar8].name
    if (invSlot >= 0) {
      await a.clickWindow(invSlot, 8, 2); await sleep(900)
      const after = a.currentWindow ? a.currentWindow.slots[hotbar8] : a.inventory.slots[44]
      t.check('number key on the own inventory moves the item into that hotbar slot while the shop is open',
        after && after.name === 'red_sandstone' && !(a.currentWindow && a.currentWindow.slots[invSlot] && a.currentWindow.slots[invSlot].name === 'red_sandstone'),
        { before8, after8: after && after.name, from: invSlot })
    } else {
      t.check('number key sorting: Sandstone is in the inventory to test with', false, { slots: w.slots.slice(w.inventoryStart).map(s => s && s.name) })
    }
    void b; void Vec3
  }
}
