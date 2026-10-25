// A whole BedWars round on the FakePlatform with the shipped configuration: lobby, admin start, teams, spawners,
// the shop, a destroyed bed, a final kill, the win, statistics and the reset back into the lobby.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseArena, parseSettings, parseShop } from '../src/config.ts'
import { FakeServer } from './fake-platform.ts'

const read = (f: string) => readFileSync(new URL(`../../config/${f}`, import.meta.url), 'utf8')
const settings = () => parseSettings(read('bedwars.yml'))
const arenas = () => ['rush', 'mushroom', 'mansion'].map(n => parseArena(read(`arena-${n}.yml`)))
const shop = () => parseShop(read('shop.yml'))
const near = (a: { x: number, z: number }, b: { x: number, z: number }, d = 1.5) => Math.hypot(a.x - b.x, a.z - b.z) <= d

function startRound () {
  const s = new FakeServer(settings(), arenas(), shop())
  const a = s.join('Alex', true)
  const b = s.join('Bea')
  s.seconds(1)
  const g = s.bw.activeGame
  assert.ok(g.players.has(a) && g.players.has(b), 'both are auto-joined into the active arena')
  assert.equal(g.phase, 'waiting')
  assert.ok(near(s.fake.location(a), g.arena.lobbySpawn), 'in the lobby')
  assert.deepEqual(s.bw.cmdStart().lines.length, 1)
  for (let i = 0; i < 200 && g.phase !== 'running'; i++) s.tick()
  assert.equal(g.phase, 'running', 'the admin start starts the round')
  return { s, g, a, b }
}

test('the admin start puts both players onto different islands in survival', () => {
  const { s, g, a, b } = startRound()
  const ta = g.teamOf(a)!; const tb = g.teamOf(b)!
  assert.notEqual(ta.def.name, tb.def.name)
  assert.ok(near(s.fake.location(a), ta.def.spawn) && near(s.fake.location(b), tb.def.spawn))
  assert.equal(s.fake.gamemode(a), 'survival')
  const sb = s.fake.sidebars.get(g.world)!
  assert.deepEqual(sb.scores, [1, 1], 'the sidebar counts one player per team')
})

test('spawners drop the named resources once the round runs', () => {
  const { s, g } = startRound()
  s.seconds(11)
  const drops = [...s.fake.entities.values()].filter(e => e.type === 'item' && e.world === g.world)
  const names = new Set(drops.map(e => `${e.item!.id}:${e.item!.name}`))
  assert.ok(names.has('brick:§4Bronze') && names.has('iron_ingot:§7Iron'), [...names].join(', '))
})

test('a purchase in the shop takes the price and gives the item', () => {
  const { s, g, a } = startRound()
  g.giveResource(a, 'bronze', 10)
  const keeper = g.shopkeepers[0]
  assert.ok(s.bw.onInteractEntity(a, keeper), 'the shop villager opens the shop')
  assert.ok(s.fake.p(a).menu, 'the shop is open')
  const sandstone = g.shop.quickBuy[0]
  s.bw.onMenuClick(a, 9, 'left', -1)
  const inv = s.fake.p(a).slots
  assert.equal(inv.filter(x => x?.id === sandstone.stack.id).reduce((n, x) => n + x!.count, 0), sandstone.stack.count)
  assert.equal(inv.filter(x => x?.id === 'brick').reduce((n, x) => n + x!.count, 0), 10 - sandstone.price.amount)
  assert.ok(s.fake.p(a).chat.some(m => m.includes(`You purchased ${sandstone.stack.count}x Sandstone for`)))
})

test('bed, final kill, win, statistics and the reset into the lobby', () => {
  const { s, g, a, b } = startRound()
  const tb = g.teamOf(b)!
  // Alex breaks Bea's bed
  const res = s.bw.onBlockBreak(a, tb.def.bed, `${tb.def.color.dye}_bed`)
  assert.equal(res.allow, true)
  assert.equal(tb.bed, false)
  assert.ok(s.fake.p(b).chat.some(m => /The bed of team .* was destroyed/.test(m)))
  // Bea's own bed may not be broken by herself... (Alex's bed is still there)
  const ta = g.teamOf(a)!
  assert.equal(s.bw.onBlockBreak(a, ta.def.bed, `${ta.def.color.dye}_bed`).allow, false, 'nobody breaks the own bed')
  // Alex hits and kills Bea: final kill without a bed
  assert.equal(s.bw.onPlayerDamage(b, a), false, 'the enemy can be hurt after the respawn protection')
  s.fake.kill(b)
  s.tick()
  assert.equal(g.players.get(b)!.state, 'spectator')
  assert.ok(s.fake.p(a).chat.some(m => /FINAL KILL/.test(m)))
  assert.equal(g.phase, 'ending')
  assert.ok(s.fake.p(b).chat.some(m => new RegExp(`Team ${ta.def.name} won the game in `).test(m)))
  assert.ok(s.fake.p(a).titles.some(t => /Your team won/.test(t)))
  // statistics, saved in the data folder
  assert.deepEqual([s.bw.stats.get('Alex').kills, s.bw.stats.get('Alex').beds, s.bw.stats.get('Alex').wins], [1, 1, 1])
  assert.deepEqual([s.bw.stats.get('Bea').deaths, s.bw.stats.get('Bea').losses], [1, 1])
  assert.ok(s.fake.files['stats.yml']?.includes('Alex'))
  // after the post-game wait everybody is back in the waiting lobby, the bed is restored
  s.seconds(g.arena.postGameWaiting + 2)
  assert.equal(g.phase, 'waiting')
  assert.ok(near(s.fake.location(b), g.arena.lobbySpawn) && near(s.fake.location(a), g.arena.lobbySpawn))
  assert.ok(s.fake.blockName(g.world, tb.def.bed).endsWith('_bed'), 'the bed is back')
})

test('a disconnected lone player keeps the team in the game for the grace period', () => {
  const { s, g, a, b } = startRound()
  const tb = g.teamOf(b)!
  s.quit(b)
  s.seconds(settings().rejoin.graceSeconds - 2)
  assert.equal(g.phase, 'running', 'still running during the grace period')
  assert.equal(tb.out, false)
  s.seconds(4)
  assert.equal(tb.out, true, 'eliminated after the grace period')
  assert.equal(g.phase, 'ending', 'and the other team has won')
  assert.ok(s.fake.p(a).chat.some(m => /won the game/.test(m)))
})
