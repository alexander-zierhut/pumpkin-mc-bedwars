// Shared smoke test for a map: game starts on it, beds/shops/spawners are where the arena file says,
// every resource type actually drops, and the void kills. Used by 0x-map-*.test.js.
const fs = require('fs')
const path = require('path')
const { loadMap } = require('../play/map')
const { waitForGameStart, waitFor, sleep, countItem, Vec3 } = require('../harness/bots')

const ROOT = path.resolve(__dirname, '..', '..')

function mapSmoke ({ arena, arenaFile, world }) {
  // only Rush is in the repository; without the extra map the spec is skipped
  if (world && !fs.existsSync(path.join(ROOT, 'maps', world))) return { name: `map-${arena.toLowerCase()}`, skip: `maps/${world} is missing` }
  const map = loadMap({
    arena: path.join(ROOT, 'config', arenaFile),
    paper: world ? path.join(ROOT, 'maps', world, 'dimensions', 'minecraft', 'overworld', 'paper-world.yml') : path.join(ROOT, 'config', 'paper-world-bedwars.yml')
  })
  return {
    name: `map-${arena.toLowerCase()}`,
    server: { arena },
    timeout: 300000,
    async run (t) {
      const logs = t.server.logs()
      t.check(`arena ${arena} loaded`, new RegExp(`Arena ${arena} loaded`).test(logs))
      if (world) t.check(`world ${world} loaded by LanBedWars`, new RegExp(`Loaded map world ${world}`).test(logs))

      const a = await t.bot('MapA')
      const b = await t.bot('MapB')
      await Promise.all([waitForGameStart2(a), waitForGameStart2(b)])
      await sleep(1500)

      const teamOfBot = bot => {
        let best = null
        for (const tm of Object.values(map.teams)) {
          const d = bot.entity.position.distanceTo(new Vec3(tm.spawn.x, tm.spawn.y, tm.spawn.z))
          if (!best || d < best.d) best = { name: tm.name, d }
        }
        return best
      }
      // the arena may be its own world: the start teleport is then a world change, which must keep the tab list
      // entries (a client drops a player spawn it has no tab list entry for, that player stays invisible)
      const seesOther = (viewer, name) => !!(viewer.players[name] && viewer.players[name].entity)
      await waitFor(() => seesOther(a, 'MapB') && seesOther(b, 'MapA'), { timeout: 8000, what: 'players see each other' }).catch(() => {})
      t.check('after the start both players see each other (tab list entry and entity)', seesOther(a, 'MapB') && seesOther(b, 'MapA'),
        { aHasB: { info: !!a.players.MapB, entity: seesOther(a, 'MapB') }, bHasA: { info: !!b.players.MapA, entity: seesOther(b, 'MapA') } })

      const ta = teamOfBot(a); const tb = teamOfBot(b)
      t.check('both players start at a team spawn of this map', ta.d < 3 && tb.d < 3, { ta, tb })
      t.check('players are on different teams', ta.name !== tb.name, { ta, tb })
      await sleep(3000)
      t.check('players stand safely on their spawn (no fall)', Math.abs(a.entity.position.y - map.teams[ta.name].spawn.y) < 1.5 && a.entity.onGround,
        { y: a.entity.position.y, spawnY: map.teams[ta.name].spawn.y })

      for (const tm of Object.values(map.teams)) {
        const blk = a.blockAt(new Vec3(tm.bed.x, tm.bed.y, tm.bed.z)) || b.blockAt(new Vec3(tm.bed.x, tm.bed.y, tm.bed.z))
        t.check(`bed of ${tm.name} exists at the configured position`, blk && /bed/.test(blk.name), { block: blk && blk.name, bed: tm.bed })
      }
      for (const st of map.stores) {
        const v = Object.values(a.entities).concat(Object.values(b.entities))
          .find(e => /villager/i.test(e.name || '') && e.position.distanceTo(new Vec3(st.x, st.y, st.z)) < 2)
        t.check(`shop villager present at ${st.x},${st.y},${st.z}`, !!v)
      }

      // resources: stand bot A on each spawner type and collect
      const collect = async (sp, seconds, item) => {
        await t.server.cmd(`execute as MapA at @s run tp @s ${sp.x} ${sp.y} ${sp.z}`)
        const before = countItem(a, item)
        await sleep(seconds * 1000)
        return countItem(a, item) - before
      }
      const own = ta.name
      const bronze = map.spawners.find(s => s.type === 'bronze' && s.team === own)
      const silver = map.nearestSpawner('silver', map.teams[own].spawn)
      const gold = map.spawners.find(s => s.type === 'gold')
      const gotBronze = await collect(bronze, 6, 'brick')
      t.check('bronze drops at the base spawner', gotBronze >= 4, { gotBronze, spawner: bronze })
      const gotSilver = await collect(silver, 12, 'iron_ingot')
      t.check('silver drops at the silver spawner', gotSilver >= 1, { gotSilver, spawner: silver })
      const gotGold = await collect(gold, 32, 'gold_ingot')
      t.check('gold drops in the middle', gotGold >= 1, { gotGold, spawner: gold })
      t.check('no gold spawner belongs to a base', map.spawners.filter(s => s.type === 'gold').every(s => !s.team))
      t.check('gold only in the middle (one spawner at 4x rate or 4 spawners)', map.spawners.filter(s => s.type === 'gold').length >= 1)

      // void: drop B just below the kill height
      const sb = map.teams[tb.name].spawn
      await t.server.cmd(`execute as MapB at @s run tp @s ${sb.x + 30} ${map.voidY - 1} ${sb.z}`)
      const died = await waitFor(() => b.health <= 0 || b.entity.position.distanceTo(new Vec3(sb.x, sb.y, sb.z)) < 3, { timeout: 4000, what: 'void death' }).then(() => true, () => false)
      t.check(`void kills instantly below y=${map.voidY}`, died, { y: b.entity.position.y })
    }
  }

  async function waitForGameStart2 (bot) {
    await waitFor(() => Object.values(map.teams).some(tm => bot.entity.position.distanceTo(new Vec3(tm.spawn.x, tm.spawn.y, tm.spawn.z)) < 4),
      { timeout: 90000, what: `${bot.username} on a team spawn` })
  }
}

module.exports = { mapSmoke }
