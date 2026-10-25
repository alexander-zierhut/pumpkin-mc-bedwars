// Inventory math on plain slot arrays (see INVENTORY_SIZE in platform.ts). No server access, so it is
// unit tested in Node. Functions return the changed slot numbers so callers only send those.
import { INVENTORY_SIZE, type Item, type Slot } from './platform.ts'

/** Slots that hold normal items, in vanilla `Inventory.add` search order. */
const STORAGE = Array.from({ length: 36 }, (_, i) => i)

const UNSTACKABLE = /(_sword|_pickaxe|_axe|_shovel|_hoe|_helmet|_chestplate|_leggings|_boots)$|^(bow|crossbow|potion|splash_potion|lingering_potion|cake|shield|trident|fishing_rod|shears|flint_and_steel)$/
const SIXTEEN = /^(ender_pearl|snowball|egg|armor_stand|sign|.*_sign|bucket|honey_bottle)$/

export function maxStack (id: string): number {
  if (UNSTACKABLE.test(id)) return 1
  if (SIXTEEN.test(id)) return 16
  return 64
}

const sameRecord = (a: Record<string, number> | undefined, b: Record<string, number> | undefined) => {
  const ka = Object.keys(a ?? {}).filter(k => (a as any)[k])
  const kb = Object.keys(b ?? {}).filter(k => (b as any)[k])
  return ka.length === kb.length && ka.every(k => (a as any)[k] === (b as any)?.[k])
}
const sameList = (a: string[] | undefined, b: string[] | undefined) => (a ?? []).join('\n') === (b ?? []).join('\n')

/** Whether two items would stack (everything but the count is equal). */
export function similar (a: Slot, b: Slot): boolean {
  if (!a || !b) return false
  return a.id === b.id && (a.name ?? '') === (b.name ?? '') && sameList(a.lore, b.lore) && sameRecord(a.enchants, b.enchants) &&
    (a.damage ?? 0) === (b.damage ?? 0) && (a.color ?? -1) === (b.color ?? -1) && (a.potion ?? '') === (b.potion ?? '') && !!a.blocking === !!b.blocking
}

export const copy = (item: Item, count = item.count): Item => ({ ...item, count, ...(item.lore ? { lore: [...item.lore] } : {}), ...(item.enchants ? { enchants: { ...item.enchants } } : {}) })

export function emptyInventory (): Slot[] {
  return Array.from({ length: INVENTORY_SIZE }, () => null)
}

/** Number of items with this id in the storage slots and the off hand. */
/** Whether a slot holds this id (and, when given, this exact name: shop currency must be the named resource item). */
const matches = (it: Slot, id: string, name?: string): it is Item => !!it && it.id === id && (name === undefined || (it.name ?? '') === name)

export function count (inv: Slot[], id: string, name?: string): number {
  let n = 0
  for (const s of [...STORAGE, 40]) if (matches(inv[s], id, name)) n += inv[s]!.count
  return n
}

/** Removes `amount` items with this id (hotbar first, like taking from the stacks you hold). */
export function remove (inv: Slot[], id: string, amount: number, name?: string): number[] {
  const changed: number[] = []
  let left = amount
  for (const s of [...STORAGE, 40]) {
    if (left <= 0) break
    const it = inv[s]
    if (!matches(it, id, name)) continue
    const take = Math.min(left, it.count)
    left -= take
    inv[s] = it.count - take > 0 ? copy(it, it.count - take) : null
    changed.push(s)
  }
  if (left > 0) throw new Error(`remove: missing ${left} ${id}`)
  return changed
}

/**
 * Vanilla `Inventory.add`: tops up similar stacks first (selected slot, then storage order), then fills
 * empty storage slots. Returns the changed slots and how many items did not fit.
 */
export function add (inv: Slot[], item: Item, selected = 0): { changed: number[], leftover: number } {
  const changed = new Set<number>()
  let left = item.count
  const max = maxStack(item.id)
  for (const s of [selected, 40, ...STORAGE]) {
    if (left <= 0) break
    const it = inv[s]
    if (!it || !similar(it, item) || it.count >= max) continue
    const put = Math.min(left, max - it.count)
    inv[s] = copy(it, it.count + put)
    left -= put
    changed.add(s)
  }
  for (const s of STORAGE) {
    if (left <= 0) break
    if (inv[s]) continue
    const put = Math.min(left, max)
    inv[s] = copy(item, put)
    left -= put
    changed.add(s)
  }
  return { changed: [...changed], leftover: left }
}

/** Whether `item` fits completely. */
export function fits (inv: Slot[], item: Item, selected = 0): boolean {
  const probe = inv.map(s => s && copy(s))
  return add(probe, item, selected).leftover === 0
}

/**
 * Rewinside number-key buying: puts `item` into hotbar slot `slot`. A similar stack there is topped up;
 * a different item moves to a free slot (or is returned in `displaced` when nothing is free).
 */
export function putInHotbar (inv: Slot[], slot: number, item: Item): { changed: number[], leftover: number, displaced: Item | null } {
  const current = inv[slot]
  if (current && similar(current, item)) {
    const room = maxStack(item.id) - current.count
    if (room >= item.count) {
      inv[slot] = copy(current, current.count + item.count)
      return { changed: [slot], leftover: 0, displaced: null }
    }
  }
  inv[slot] = copy(item)
  if (!current) return { changed: [slot], leftover: 0, displaced: null }
  // the previous occupant moves out of the way, but never back into the slot we just filled
  const probe = inv.map((s, i) => (i === slot ? { id: '\u0000', count: 1 } : s))
  const moved = add(probe, current)
  for (const s of moved.changed) inv[s] = probe[s]
  const displaced = moved.leftover > 0 ? copy(current, moved.leftover) : null
  return { changed: [slot, ...moved.changed], leftover: 0, displaced }
}
