// Rewinside shop: pages, prices and buying (left click once, shift click up to a stack, number key
// straight into a hotbar slot). Pure functions; the game applies the results to the player.
import type { Resource, Settings, Shop, ShopItem, TeamColor } from './config.ts'
import { add, copy, count, fits, maxStack, putInHotbar, remove } from './inventory.ts'
import type { Item, Slot } from './platform.ts'
import { MSG, fmt } from './text.ts'

export const SHOP_ROWS = 6
/** First slot of the item area (row 0 holds the category tabs). */
export const ITEM_START = 9
export const QUICK_BUY_SLOT = 8

export type ShopPage = { kind: 'main' } | { kind: 'category', index: number }

/** Plain building blocks are delivered without the shop's display name: a placed and broken block drops unnamed,
 *  and only unnamed blocks stack with it again (playtest 1, point 8). The shop still shows the name. */
const UNNAMED_BLOCKS = new Set(['red_sandstone', 'end_stone', 'iron_block', 'glass', 'glowstone', 'chest', 'ladder', 'cobweb'])
const isUnnamedBlock = (id: string) => UNNAMED_BLOCKS.has(id) || id.endsWith('_stained_glass')

/** What the buyer receives: team colours applied, swords block like 1.8, building blocks unnamed. */
export function deliveredItem (si: ShopItem, team: TeamColor | null): Item {
  const item = styledItem(si, team)
  if (isUnnamedBlock(item.id)) delete item.name
  return item
}

/** The shop's name of an item, without colour codes (messages). */
export function shopItemName (si: ShopItem): string {
  return (si.stack.name ?? si.stack.id).replace(/§./g, '')
}

function styledItem (si: ShopItem, team: TeamColor | null): Item {
  const item = copy(si.stack)
  if (si.teamColor && team) {
    if (item.id === 'glass') item.id = `${team.dye}_stained_glass`
    else if (item.id.startsWith('leather_')) item.color = team.rgb
    else if (item.id === 'wool' || item.id.endsWith('_wool')) item.id = `${team.dye}_wool`
  }
  if (item.id.endsWith('_sword')) item.blocking = true
  return item
}

export function priceLabel (si: ShopItem, settings: Settings): string {
  const r = settings.resources[si.price.resource]
  return `${si.price.amount} ${r.name}`
}

/** The item as shown in the shop: the delivered item plus the price lore. */
export function shopIcon (si: ShopItem, settings: Settings, team: TeamColor | null): Item {
  const item = styledItem(si, team)
  const r = settings.resources[si.price.resource]
  const lore = settings.shopLore.map(l => fmt(l, { price: si.price.amount, resource: r.name, amount: si.stack.count }))
  item.lore = [...(item.lore ?? []), ...lore]
  return item
}

function tabs (shop: Shop, current: ShopPage): Slot[] {
  const row: Slot[] = Array.from({ length: 9 }, () => null)
  shop.categories.slice(0, 8).forEach((c, i) => {
    const icon = copy(c.icon, 1)
    if (current.kind === 'category' && current.index === i) icon.enchants = { unbreaking: 1 }
    row[i] = icon
  })
  if (current.kind === 'category') row[QUICK_BUY_SLOT] = { id: 'blaze_powder', count: 1, name: MSG.quickBuy }
  return row
}

export function pageItems (shop: Shop, page: ShopPage): ShopItem[] {
  return page.kind === 'main' ? shop.quickBuy : shop.categories[page.index]?.items ?? []
}

export function renderPage (shop: Shop, page: ShopPage, settings: Settings, team: TeamColor | null): Slot[] {
  const slots: Slot[] = Array.from({ length: SHOP_ROWS * 9 }, () => null)
  tabs(shop, page).forEach((s, i) => { slots[i] = s })
  pageItems(shop, page).forEach((si, i) => {
    if (ITEM_START + i < slots.length) slots[ITEM_START + i] = shopIcon(si, settings, team)
  })
  return slots
}

export function pageTitle (shop: Shop, page: ShopPage): string {
  if (page.kind === 'main') return `${MSG.shopTitle} - ${MSG.quickBuy.replace(/§./g, '')}`
  return `${MSG.shopTitle} - ${(shop.categories[page.index]?.icon.name ?? '').replace(/§./g, '')}`
}

export type ShopAction =
  | { kind: 'page', page: ShopPage }
  | { kind: 'buy', item: ShopItem }
  | { kind: 'none' }

/** What a click on a slot of the shop window means. */
export function actionAt (shop: Shop, page: ShopPage, slot: number): ShopAction {
  if (slot >= 0 && slot < 8 && slot < shop.categories.length) return { kind: 'page', page: { kind: 'category', index: slot } }
  if (slot === QUICK_BUY_SLOT && page.kind === 'category') return { kind: 'page', page: { kind: 'main' } }
  const items = pageItems(shop, page)
  const i = slot - ITEM_START
  if (i >= 0 && i < items.length) return { kind: 'buy', item: items[i] }
  return { kind: 'none' }
}

export type BuyMode = { kind: 'once' } | { kind: 'max' } | { kind: 'hotbar', slot: number }

export interface BuyResult {
  ok: boolean
  reason?: 'money' | 'full'
  /** Changed inventory slots. */
  changed: number[]
  /** Item that had to leave the inventory (number key with a full inventory): drop it. */
  displaced: Item | null
  purchases: number
  message: string
}

/** Buys `si` into `inv` (mutated on success only). Currency is the named resource item only (ScreamingBedWars). */
export function buy (inv: Slot[], si: ShopItem, mode: BuyMode, settings: Settings, team: TeamColor | null, selected = 0): BuyResult {
  let item = deliveredItem(si, team)
  const res = settings.resources[si.price.resource]
  const currencyName = `${res.color}${res.name}`
  const have = count(inv, res.item, currencyName)
  const name = shopItemName(si)
  const label = (n: number) => `${n}x ${name}`
  if (have < si.price.amount) {
    return { ok: false, reason: 'money', changed: [], displaced: null, purchases: 0, message: fmt(MSG.buyFailed, { item: label(item.count), material: priceLabel(si, settings) }) }
  }
  let price = si.price.amount
  if (mode.kind === 'max') {
    // shift click: priced per piece (price / bundle), as many pieces as affordable, at most one stack
    const unit = si.price.amount / item.count
    const pieces = Math.max(item.count, Math.min(maxStack(item.id), Math.floor(have / unit + 1e-9)))
    price = Math.ceil(pieces * unit - 1e-9)
    item = copy(item, pieces)
  }
  const purchases = 1
  // work on a copy and commit only when everything fits
  const work = inv.map(s => s && copy(s))
  const changed = new Set<number>()
  let displaced: Item | null = null
  let bought = 0
  for (let n = 0; n < purchases; n++) {
    remove(work, res.item, price, currencyName).forEach(s => changed.add(s))
    if (mode.kind === 'hotbar') {
      const r = putInHotbar(work, mode.slot, item)
      // the previous occupant has nowhere to go: refuse instead of dropping it (nothing paid, nothing lost)
      if (r.displaced) return { ok: false, reason: 'full', changed: [], displaced: null, purchases: 0, message: MSG.inventoryFull }
      r.changed.forEach(s => changed.add(s))
      displaced = r.displaced
    } else {
      if (!fits(work, item, selected)) {
        // give back this purchase's payment by restoring the last good state
        if (bought === 0) return { ok: false, reason: 'full', changed: [], displaced: null, purchases: 0, message: MSG.inventoryFull }
        break
      }
      add(work, item, selected).changed.forEach(s => changed.add(s))
    }
    bought++
    for (let s = 0; s < inv.length; s++) if (changed.has(s)) inv[s] = work[s]
  }
  return { ok: true, changed: [...changed], displaced, purchases: bought, message: fmt(MSG.buySuccess, { item: label(item.count), material: `${price * bought} ${res.name}` }) }
}
