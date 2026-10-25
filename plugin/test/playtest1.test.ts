// Fixes of the first playtest (PLAYTEST-1.md): game bossbar, parachute, death message, bow durability.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseArena, parseSettings, parseShop, TEAM_COLORS } from '../src/config.ts'
import { emptyInventory } from '../src/inventory.ts'
import { buy } from '../src/shop.ts'
import { hearts } from '../src/text.ts'
import type { Item, Slot } from '../src/platform.ts'
import { FakeServer } from './fake-platform.ts'

const read = (f: string) => readFileSync(new URL(`../../config/${f}`, import.meta.url), 'utf8')
const settings = () => parseSettings(read('bedwars.yml'))
const arenas = () => ['rush', 'mushroom', 'mansion'].map(n => parseArena(read(`arena-${n}.yml`)))
const shop = () => parseShop(read('shop.yml'))

function startRound () {
  const s = new FakeServer(settings(), arenas(), shop())
  const a = s.join('Alex', true)
  const b = s.join('Bea')
  s.seconds(1)
  const g = s.bw.activeGame
  s.bw.cmdStart()
  for (let i = 0; i < 200 && g.phase !== 'running'; i++) s.tick()
  assert.equal(g.phase, 'running')
  return { s, g, a, b, sp: s.bw.specialsOf(g) }
}

// ---------------------------------------------------------------- point 2: bossbar

test('game bossbar: the text stays, the green bar runs down with the game time, blank after the end', () => {
  const s = new FakeServer(settings(), arenas(), shop())
  s.join('Alex', true); s.join('Bea')
  s.seconds(1)
  const g = s.bw.activeGame
  ;(g.arena as { gameTime: number }).gameTime = 100
  s.bw.cmdStart()
  for (let i = 0; i < 200 && g.phase !== 'running'; i++) s.tick()
  assert.deepEqual(s.fake.bossbars.get('Alex'), { text: 'Game in progress, good luck!', progress: 1, color: 'green' })
  s.seconds(50)
  const half = s.fake.bossbars.get('Bea')!
  assert.equal(half.text, 'Game in progress, good luck!')
  assert.ok(Math.abs(half.progress - 0.5) <= 0.02, `about half the time is over: ${half.progress}`)
  s.seconds(25)
  assert.ok(s.fake.bossbars.get('Alex')!.progress < 0.3)
  // a team wins: the text goes away like in ScreamingBedWars, the bar runs down with the post-game wait
  g.end(g.teamOf('Alex'))
  assert.equal(s.fake.bossbars.get('Alex')!.text.trim(), '')
  assert.equal(s.fake.bossbars.get('Alex')!.progress, 1)
  s.seconds(2)
  assert.ok(s.fake.bossbars.get('Alex')!.progress < 0.7, 'post-game bar runs down')
})

// ---------------------------------------------------------------- point 9, 10: parachute

const egg: Item = { id: 'chicken_spawn_egg', count: 2 }

function glide () {
  const r = startRound()
  r.s.fake.setSlot(r.a, 0, egg)
  r.s.fake.airborne.add(r.a)
  r.s.fake.airborne.add(r.b)
  assert.equal(r.s.bw.onUse(r.a, egg, 'right', null, null, null), true)
  assert.ok(r.sp.glides.has(r.a), 'the parachute is open')
  return r
}

test('sneaking cancels the parachute: chicken gone, egg used, no message', () => {
  const { s, a, sp } = glide()
  const chicken = sp.glides.get(a)!.chicken
  s.ticks(3)
  assert.ok(sp.glides.has(a), 'still gliding without sneaking')
  const chat = s.fake.p(a).chat.length
  s.fake.sneakers.add(a)
  s.tick()
  assert.equal(sp.glides.has(a), false, 'sneak ends the parachute')
  assert.equal(s.fake.entities.has(chicken), false, 'the chicken is gone')
  assert.equal(s.fake.p(a).slots[0]!.count, 1, 'the egg is spent')
  assert.equal(s.fake.p(a).chat.length, chat)
  // the player drops: nothing re-opens it
  s.ticks(5)
  assert.equal(sp.glides.size, 0)
})

test('sneak held while opening does not cancel at once, letting go and sneaking again does', () => {
  const r = startRound()
  r.s.fake.setSlot(r.a, 0, egg)
  r.s.fake.airborne.add(r.a)
  r.s.fake.sneakers.add(r.a)
  r.s.bw.onUse(r.a, egg, 'right', null, null, null)
  r.s.ticks(5)
  assert.ok(r.sp.glides.has(r.a), 'sneak that was already held is ignored')
  r.s.fake.sneakers.delete(r.a)
  r.s.ticks(2)
  assert.ok(r.sp.glides.has(r.a))
  r.s.fake.sneakers.add(r.a)
  r.s.tick()
  assert.equal(r.sp.glides.has(r.a), false)
})

test('the glider shooting never shoots his own parachute down, others and unattributed hits do', () => {
  const { s, a, b, sp } = glide()
  const chicken = sp.glides.get(a)!.chicken
  // the plain damage event (no attacker yet) leaves hits by entities to the by-entity event
  assert.equal(s.bw.onEntityDamage(chicken, null, 'arrow'), false, 'arrow: decided by the by-entity event')
  assert.equal(s.bw.onEntityDamage(chicken, null, 'player-attack'), false)
  assert.ok(sp.glides.has(a))
  // own arrow: damage cancelled, the parachute stays
  assert.equal(s.bw.onEntityDamage(chicken, a, 'arrow', true), true)
  assert.ok(sp.glides.has(a) && s.fake.entities.has(chicken), 'own arrow does not hurt the chicken')
  // environment never hurts it
  assert.equal(s.bw.onEntityDamage(chicken, null, 'fall'), true)
  assert.equal(s.bw.onEntityDamage(chicken, null, 'in-wall'), true)
  assert.ok(sp.glides.has(a))
  // an enemy arrow shoots it down (cancelled: no death, no drops)
  assert.equal(s.bw.onEntityDamage(chicken, b, 'arrow', true), true)
  assert.equal(sp.glides.has(a), false)
  assert.equal(s.fake.entities.has(chicken), false)
  assert.ok(s.fake.p(a).chat.some(m => /Parachute was shot down/.test(m)))
})

test('an explosion or fire still takes the parachute down at once', () => {
  const { s, a, sp } = glide()
  assert.equal(s.bw.onEntityDamage(sp.glides.get(a)!.chicken, null, 'explosion'), true)
  assert.equal(sp.glides.has(a), false)
})

// ---------------------------------------------------------------- point 13: death message

test('hearts: half hearts with a decimal point', () => {
  assert.deepEqual([20, 13, 12, 1, 0.4, 7.6, 0].map(hearts), ['10', '6.5', '6', '0.5', '0.5', '4', '0'])
})

test('kill message: victim was killed by killer, plus the killer hearts', () => {
  const { s, g, a, b } = startRound()
  s.fake.setHealth(a, 13)
  assert.equal(s.bw.onPlayerDamage(b, a), false)
  s.fake.kill(b)
  s.tick()
  const msg = s.fake.p(a).chat.find(m => /was killed/.test(m))!
  assert.equal(msg, '[BW] Bea was killed by Alex! (❤ 6.5)')
  assert.ok(s.fake.p(b).chat.includes(msg), 'everybody gets it')
  assert.equal(g.players.get(b)!.state, 'playing', 'not a final kill: the bed stands')
})

test('final kill carries the hearts and the final kill tag', () => {
  const { s, g, a, b } = startRound()
  const tb = g.teamOf(b)!
  s.bw.onBlockBreak(a, tb.def.bed, `${tb.def.color.dye}_bed`)
  s.fake.setHealth(a, 20)
  s.bw.onPlayerDamage(b, a)
  s.fake.kill(b)
  s.tick()
  const msg = s.fake.p(a).chat.find(m => /was killed/.test(m))!
  assert.equal(msg, '[BW] Bea was killed by Alex! (❤ 10) FINAL KILL')
})

test('knocked into the void: the last attacker is credited like a normal kill', () => {
  const { s, g, a, b } = startRound()
  s.fake.setHealth(a, 7)
  s.bw.onPlayerDamage(b, a)
  const limit = s.bw.settings.voidKill[g.world]
  s.bw.onMove(b, { x: 0, y: limit - 1, z: 0 })
  s.tick()
  assert.equal(s.fake.p(a).chat.find(m => /was killed/.test(m)), '[BW] Bea was killed by Alex! (❤ 3.5)')
  assert.equal(s.bw.stats.get('Alex').kills, 1)
})

test('without a recent attacker it is a plain death, without hearts', () => {
  const { s, a, b } = startRound()
  s.fake.kill(b)
  s.tick()
  assert.equal(s.fake.p(a).chat.find(m => /died/.test(m)), '[BW] Bea died!')
})

test('no hearts when the killer died in the same moment', () => {
  const { s, a, b } = startRound()
  s.bw.onPlayerDamage(a, b)
  s.fake.kill(a)
  s.fake.kill(b)
  s.tick()
  const msg = s.fake.p(a).chat.find(m => /Alex was killed by Bea/.test(m))!
  assert.equal(msg, '[BW] Alex was killed by Bea!')
})

// ---------------------------------------------------------------- point 16: bow durability

test('nothing in the shop is sold pre-damaged, shop bows come with full durability', () => {
  const sh = shop()
  const all = [...sh.categories.flatMap(c => c.items), ...sh.quickBuy]
  assert.ok(all.length > 20)
  for (const i of all) assert.ok(!i.stack.damage, `${i.stack.id} (${i.stack.name}) has damage ${i.stack.damage}`)
  const bows = all.filter(i => i.stack.id === 'bow')
  assert.ok(bows.length >= 4, 'three bows and the quick buy bow')
  const st = settings()
  const inv: Slot[] = emptyInventory()
  inv[0] = { id: 'iron_ingot', count: 64, name: `${st.resources.iron.color}${st.resources.iron.name}` }
  inv[1] = { id: 'gold_ingot', count: 64, name: `${st.resources.gold.color}${st.resources.gold.name}` }
  for (const bow of bows) {
    const r = buy(inv, bow, { kind: 'once' }, st, TEAM_COLORS.RED)
    assert.equal(r.ok, true, r.message)
  }
  const got = inv.filter(x => x?.id === 'bow')
  assert.ok(got.length >= 1)
  for (const x of got) assert.ok(!x!.damage, 'a bought bow is undamaged')
  assert.ok(got.every(x => x!.enchants?.infinity === 1), 'the bows keep Infinity')
})

// ---------------------------------------------------------------- point 15: arrows of the Infinity bows

test('players of an arena never pick shot arrows up, the plugin gives no arrow for Infinity itself', () => {
  const { s, a, sp } = startRound()
  assert.equal(s.bw.onPickupArrow(a), true)
  s.fake.p(a).gamemode = 'creative'
  assert.equal(s.bw.onPickupArrow(a), false, 'creative keeps the vanilla rule')
  assert.equal(s.bw.onPickupArrow('Nobody'), false, 'players outside an arena are not our business')
  assert.ok(sp)
  for (const i of shop().categories.flatMap(c => c.items).filter(x => x.stack.id === 'bow')) assert.equal(i.stack.enchants?.infinity, 1)
})
