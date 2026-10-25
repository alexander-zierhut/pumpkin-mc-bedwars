// Shop purchases against the real config/shop.yml and config/bedwars.yml (no server needed).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseSettings, parseShop, TEAM_COLORS } from '../src/config.ts'
import { emptyInventory } from '../src/inventory.ts'
import { buy, shopIcon } from '../src/shop.ts'
import type { Item, Slot } from '../src/platform.ts'

const settings = parseSettings(readFileSync(new URL('../../config/bedwars.yml', import.meta.url), 'utf8'))
const shop = parseShop(readFileSync(new URL('../../config/shop.yml', import.meta.url), 'utf8'))
const find = (id: string) => shop.categories.flatMap(c => c.items).find(i => i.stack.id === id)!
const bronze = (n: number): Item => ({ id: 'brick', count: n, name: `${settings.resources.bronze.color}${settings.resources.bronze.name}` })
const inventory = (...items: Item[]): Slot[] => { const inv = emptyInventory(); items.forEach((it, i) => { inv[i] = it }); return inv }
const total = (inv: Slot[], id: string) => inv.reduce((n, s) => n + (s && s.id === id ? s.count : 0), 0)
const plain = (s: string) => s.replace(/§./g, '')

test('a purchase takes the price and gives the stack, with the original message', () => {
  const end = find('end_stone')
  const inv = inventory(bronze(10))
  const r = buy(inv, end, { kind: 'once' }, settings, TEAM_COLORS.RED)
  assert.equal(r.ok, true)
  assert.equal(total(inv, 'brick'), 10 - end.price.amount)
  assert.equal(total(inv, 'end_stone'), end.stack.count)
  assert.equal(plain(r.message), `${end.stack.count}x Endstein wurde für ${end.price.amount} Bronze gekauft!`)
})

test('too little money: nothing changes, refusal names amount, item and price', () => {
  const end = find('end_stone')
  const inv = inventory(bronze(end.price.amount - 1))
  const r = buy(inv, end, { kind: 'once' }, settings, null)
  assert.equal(r.ok, false)
  assert.equal(total(inv, 'brick'), end.price.amount - 1)
  assert.equal(plain(r.message), `Du hast nicht genug Ressourcen, um ${end.stack.count}x Endstein zu kaufen! Du brauchst ${end.price.amount} Bronze!`)
})

test('plain bricks without the resource name are no Bronze', () => {
  const inv = inventory({ id: 'brick', count: 64 })
  assert.equal(buy(inv, find('red_sandstone'), { kind: 'once' }, settings, null).ok, false)
})

test('shift click is priced per piece: 40 Bronze buy 10 glowstone at 16 per 4', () => {
  const glow = find('glowstone')
  assert.equal(glow.price.amount / glow.stack.count, 4)
  const inv = inventory(bronze(40))
  const r = buy(inv, glow, { kind: 'max' }, settings, null)
  assert.equal(r.ok, true)
  assert.equal(total(inv, 'glowstone'), 10)
  assert.equal(total(inv, 'brick'), 0)
})

test('shift click buys at most one stack', () => {
  const sand = find('red_sandstone')
  const inv = inventory(bronze(64), bronze(36))
  buy(inv, sand, { kind: 'max' }, settings, null)
  assert.equal(total(inv, 'red_sandstone'), 64)
  assert.equal(total(inv, 'brick'), 100 - 64 * sand.price.amount / sand.stack.count)
})

test('team colours: glass becomes stained glass of the buyer', () => {
  const glass = shop.categories.flatMap(c => c.items).find(i => i.stack.id === 'glass' && i.teamColor)!
  const inv = inventory(bronze(20))
  buy(inv, glass, { kind: 'once' }, settings, TEAM_COLORS.BLUE)
  assert.equal(total(inv, 'blue_stained_glass'), glass.stack.count)
})

test('number key with a full inventory: refused when the slot owner has nowhere to go, nothing paid or lost', () => {
  const end = find('end_stone')
  const inv = emptyInventory()
  for (let i = 0; i < 35; i++) inv[i] = { id: `filler_${i}`, count: 3 }
  inv[35] = bronze(end.price.amount + 5)
  const before = JSON.stringify(inv)
  const r = buy(inv, end, { kind: 'hotbar', slot: 6 }, settings, null)
  assert.equal(r.ok, false)
  assert.equal(r.reason, 'full')
  assert.equal(JSON.stringify(inv), before)
})

test('number key with a full inventory whose payment stack is used up: the freed slot takes the old occupant', () => {
  const end = find('end_stone')
  const inv = emptyInventory()
  for (let i = 0; i < 35; i++) inv[i] = { id: `filler_${i}`, count: 3 }
  inv[35] = bronze(end.price.amount)
  const r = buy(inv, end, { kind: 'hotbar', slot: 6 }, settings, null)
  assert.equal(r.ok, true)
  assert.equal(inv[6]?.id, 'end_stone')
  assert.equal(inv[35]?.id, 'filler_6')
})

test('building blocks come unnamed so placed and broken blocks stack again; the shop still shows the name', () => {
  for (const id of ['red_sandstone', 'end_stone', 'glass', 'ladder', 'cobweb']) {
    const si = find(id)
    const inv = inventory(bronze(64), { id: 'iron_ingot', count: 64, name: `${settings.resources.iron.color}${settings.resources.iron.name}` })
    assert.equal(buy(inv, si, { kind: 'once' }, settings, TEAM_COLORS.RED).ok, true, id)
    const got = inv.find(s => s && s.id !== 'brick' && s.id !== 'iron_ingot')!
    assert.equal(got.name, undefined, `${id} is delivered without a name`)
    assert.ok(shopIcon(si, settings, TEAM_COLORS.RED).name, `${id} keeps its name in the shop`)
  }
  // items that are not plain blocks keep their names (special items are recognised by them)
  for (const id of ['ender_chest', 'tnt', 'chicken_spawn_egg', 'bow']) {
    const si = find(id)
    const inv = inventory({ id: 'gold_ingot', count: 64, name: `${settings.resources.gold.color}${settings.resources.gold.name}` }, { id: 'iron_ingot', count: 64, name: `${settings.resources.iron.color}${settings.resources.iron.name}` })
    assert.equal(buy(inv, si, { kind: 'once' }, settings, TEAM_COLORS.RED).ok, true, id)
    assert.ok(inv.find(s => s && s.id === id)!.name, `${id} keeps its name`)
  }
})
