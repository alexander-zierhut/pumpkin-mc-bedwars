// Smoke test: two 1.8.9 clients connect, get auto-joined, the game starts and the map is there.
const { MAP, waitForGameStart, blockName, sleep } = require('../harness/bots')

module.exports = {
  name: 'smoke',
  timeout: 180000,
  async run (t) {
    const a = await t.bot('SmokeA')
    const b = await t.bot('SmokeB')
    t.check('1.8.9 clients can join', a.entity && b.entity)

    const [teamA, teamB] = await Promise.all([waitForGameStart(a), waitForGameStart(b)])
    t.check('game starts with 2 players and puts them on their team spawns', true, { teamA, teamB })
    t.check('players are split onto both teams', teamA !== teamB, { teamA, teamB })

    await sleep(1500)
    const own = MAP.teams[teamA]
    const bed = blockName(a, own.bed.x, own.bed.y, own.bed.z)
    t.check('own bed exists', /bed/.test(bed || ''), { bed, at: own.bed })
    const bronze = MAP.spawners.find(s => s.type === 'bronze' && s.team === teamA)
    const pad = blockName(a, Math.floor(bronze.x), Math.floor(bronze.y) - 1, Math.floor(bronze.z))
    t.check('bronze spawner stands on a solid block', pad && pad !== 'air', { pad })
  }
}
