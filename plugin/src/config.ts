// Parses the YAML configs (arenas in the ScreamingBedWars format, the shop, the plugin settings).
// Pure functions: the plugin bundles the files at build time, the tests read them from config/.
import { parse } from 'yaml'
import type { BlockPos, Item, Location, Vec3 } from './platform.ts'

export type Resource = 'bronze' | 'iron' | 'gold'
export const RESOURCES: Resource[] = ['bronze', 'iron', 'gold']

export interface TeamColor {
  /** Legacy colour code letter. */
  code: string
  /** Dye name used for wool, glass, beds. */
  dye: string
  /** Leather armour RGB. */
  rgb: number
}

// ScreamingBedWars `TeamColor` (chat colour, wool/glass dye, leather colour)
export const TEAM_COLORS: Record<string, TeamColor> = {
  BLACK: { code: '0', dye: 'black', rgb: 0x000000 },
  BLUE: { code: '9', dye: 'blue', rgb: 0x5555FF },
  GREEN: { code: '2', dye: 'green', rgb: 0x00AA00 },
  DARK_BLUE: { code: '1', dye: 'blue', rgb: 0x0000AA },
  RED: { code: 'c', dye: 'red', rgb: 0xFF5555 },
  DARK_RED: { code: '4', dye: 'red', rgb: 0xAA0000 },
  MAGENTA: { code: 'd', dye: 'magenta', rgb: 0xFF55FF },
  LIGHT_PURPLE: { code: 'd', dye: 'magenta', rgb: 0xFF55FF },
  PURPLE: { code: '5', dye: 'purple', rgb: 0xAA00AA },
  ORANGE: { code: '6', dye: 'orange', rgb: 0xFFAA00 },
  GOLD: { code: '6', dye: 'orange', rgb: 0xFFAA00 },
  YELLOW: { code: 'e', dye: 'yellow', rgb: 0xFFFF55 },
  LIGHT_BLUE: { code: 'b', dye: 'light_blue', rgb: 0x55FFFF },
  AQUA: { code: 'b', dye: 'light_blue', rgb: 0x55FFFF },
  CYAN: { code: '3', dye: 'cyan', rgb: 0x00AAAA },
  LIGHT_GREEN: { code: 'a', dye: 'lime', rgb: 0x55FF55 },
  LIME: { code: 'a', dye: 'lime', rgb: 0x55FF55 },
  WHITE: { code: 'f', dye: 'white', rgb: 0xFFFFFF },
  GRAY: { code: '7', dye: 'light_gray', rgb: 0xAAAAAA },
  DARK_GRAY: { code: '8', dye: 'gray', rgb: 0x555555 },
  PINK: { code: 'd', dye: 'pink', rgb: 0xFF55FF },
  BROWN: { code: '6', dye: 'brown', rgb: 0x8B4513 }
}

export interface TeamDef {
  name: string
  color: TeamColor
  colorName: string
  maxPlayers: number
  bed: BlockPos
  spawn: Location
}

export interface SpawnerDef {
  pos: Vec3
  type: Resource
  level: number
  team: string | null
  hologram: boolean
}

export interface StoreDef { loc: Location, name: string }

export interface Arena {
  name: string
  world: string
  min: BlockPos
  max: BlockPos
  specSpawn: Location
  lobbySpawn: Location
  minPlayers: number
  pauseCountdown: number
  gameTime: number
  postGameWaiting: number
  teams: TeamDef[]
  spawners: SpawnerDef[]
  stores: StoreDef[]
}

function loc (text: string, world: string): Location {
  const [x, y, z, yaw = 0, pitch = 0] = String(text).split(';').map(Number)
  return { x, y, z, yaw, pitch, world }
}

export function parseArena (yamlText: string): Arena {
  const a = parse(yamlText)
  const world = String(a.world)
  const p1 = loc(a.pos1, world)
  const p2 = loc(a.pos2, world)
  const teams: TeamDef[] = Object.entries(a.teams as Record<string, any>).map(([key, t]) => {
    const colorName = String(t.color).toUpperCase()
    const color = TEAM_COLORS[colorName]
    if (!color) throw new Error(`arena ${a.name}: unknown team colour ${t.color}`)
    const bed = loc(t.bed, world)
    return {
      name: String(t.actualName ?? key),
      color,
      colorName,
      maxPlayers: Number(t.maxPlayers),
      bed: { x: Math.floor(bed.x), y: Math.floor(bed.y), z: Math.floor(bed.z) },
      spawn: loc(t.spawn, world)
    }
  })
  const spawners: SpawnerDef[] = (a.spawners ?? []).map((s: any) => {
    const l = loc(s.location, world)
    return { pos: { x: l.x, y: l.y, z: l.z }, type: String(s.type) as Resource, level: Number(s.startLevel ?? 1), team: s.team ?? null, hologram: s.hologramEnabled !== false }
  })
  const stores: StoreDef[] = (a.stores ?? []).map((s: any) => ({ loc: loc(s.loc, world), name: String(s.name ?? '§eShop') }))
  return {
    name: String(a.name),
    world,
    min: { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y), z: Math.min(p1.z, p2.z) },
    max: { x: Math.max(p1.x, p2.x), y: Math.max(p1.y, p2.y), z: Math.max(p1.z, p2.z) },
    specSpawn: loc(a.specSpawn, world),
    lobbySpawn: loc(a.lobbySpawn, String(a.lobbySpawnWorld ?? world)),
    minPlayers: Number(a.minPlayers ?? 2),
    pauseCountdown: Number(a.pauseCountdown ?? 60),
    gameTime: Number(a.gameTime ?? 3600),
    postGameWaiting: Number(a.postGameWaiting ?? 5),
    teams,
    spawners,
    stores
  }
}

// ---------------------------------------------------------------- shop

export interface Price { amount: number, resource: Resource }
export interface ShopItem {
  price: Price
  stack: Item
  /** `applycolorbyteam`: glass and leather get the buyer's team colour. */
  teamColor: boolean
  /** Special behaviour, e.g. `{ name: 'AutoIgniteableTnt', 'explosion-time': 4 }`. */
  special: Record<string, any> | null
}
export interface ShopCategory { icon: Item, items: ShopItem[] }
export interface Shop {
  categories: ShopCategory[]
  /** Items shown on the main page below the categories (Quick Buy). */
  quickBuy: ShopItem[]
}

const strip = (id: string) => String(id).toLowerCase().replace(/^minecraft:/, '')

export function parseStack (s: any): Item {
  if (typeof s === 'string') {
    const [id, amount, name] = s.split(';')
    return { id: strip(id), count: Number(amount ?? 1), ...(name ? { name } : {}) }
  }
  const item: Item = { id: strip(s.type), count: Number(s.amount ?? 1) }
  if (s['display-name']) item.name = String(s['display-name'])
  if (s.lore) item.lore = (s.lore as unknown[]).map(String)
  if (s.enchants) item.enchants = Object.fromEntries(Object.entries(s.enchants).map(([k, v]) => [strip(k), Number(v)]))
  if (s.damage) item.damage = Number(s.damage)
  if (s['potion-type']) item.potion = strip(s['potion-type'])
  return item
}

export function parsePrice (text: string): Price {
  const m = /^\s*(\d+)\s+of\s+(\w+)\s*$/.exec(String(text))
  if (!m) throw new Error(`shop: bad price "${text}"`)
  const resource = m[2].toLowerCase() as Resource
  if (!RESOURCES.includes(resource)) throw new Error(`shop: unknown resource "${m[2]}"`)
  return { amount: Number(m[1]), resource }
}

function parseShopItem (e: any): ShopItem {
  let teamColor = false
  let special: Record<string, any> | null = null
  const props = e.properties
  const list = props == null ? [] : Array.isArray(props) ? props : [props]
  for (const p of list) {
    if (typeof p === 'string') {
      if (p.toLowerCase() === 'applycolorbyteam') teamColor = true
      else special = { name: p }
    } else if (p && typeof p === 'object') {
      if (String(p.name).toLowerCase() === 'applycolorbyteam') teamColor = true
      else special = { ...p, name: String(p.name) }
    }
  }
  return { price: parsePrice(e.price), stack: parseStack(e.stack), teamColor, special }
}

export function parseShop (yamlText: string): Shop {
  const doc = parse(yamlText)
  const categories: ShopCategory[] = []
  const quickBuy: ShopItem[] = []
  for (const e of doc.data as any[]) {
    if (e.items) categories.push({ icon: parseStack(e.stack), items: (e.items as any[]).map(parseShopItem) })
    else quickBuy.push(parseShopItem(e))
  }
  return { categories, quickBuy }
}

// ---------------------------------------------------------------- settings

export interface ResourceDef { item: string, name: string, color: string, interval: number }
export interface Settings {
  arena: string
  arenas: string[]
  autoJoin: boolean
  hotbarBuy: boolean
  minPlayers: number
  resources: Record<Resource, ResourceDef>
  shopLore: string[]
  respawnProtectionSeconds: number
  friendlyFire: boolean
  allChatPrefix: string
  rejoin: { enabled: boolean, graceSeconds: number }
  teleporter: { countdownSeconds: number, launchHeight: number, launchSpeed: number }
  parachute: { horizontalSpeed: number, fallSpeed: number, durationSeconds: number }
  mobileShop: { durationSeconds: number }
  rescuePlatform: { material: string, breakSeconds: number }
  autoIgniteTnt: { fuseSeconds: number, power: number, damage: number }
  voidKill: Record<string, number>
}

export function parseSettings (yamlText: string): Settings {
  const s = parse(yamlText)
  const res = (k: Resource): ResourceDef => ({ item: strip(s.resources[k].item), name: String(s.resources[k].name), color: String(s.resources[k].color), interval: Number(s.resources[k].interval) })
  return {
    arena: String(s.arena),
    arenas: (s.arenas as unknown[]).map(String),
    autoJoin: s['auto-join'] !== false,
    hotbarBuy: s['hotbar-buy'] !== false,
    minPlayers: Number(s['min-players'] ?? 2),
    resources: { bronze: res('bronze'), iron: res('iron'), gold: res('gold') },
    shopLore: (s['shop-lore'] as unknown[]).map(String),
    respawnProtectionSeconds: Number(s['respawn-protection-seconds'] ?? 3),
    friendlyFire: s['friendly-fire'] === true,
    allChatPrefix: String(s['all-chat-prefix'] ?? '@a'),
    rejoin: { enabled: s.rejoin?.enabled !== false, graceSeconds: Number(s.rejoin?.['grace-seconds'] ?? 60) },
    teleporter: { countdownSeconds: Number(s.teleporter['countdown-seconds']), launchHeight: Number(s.teleporter['launch-height']), launchSpeed: Number(s.teleporter['launch-speed']) },
    parachute: { horizontalSpeed: Number(s.parachute['horizontal-speed']), fallSpeed: Number(s.parachute['fall-speed']), durationSeconds: Number(s.parachute['duration-seconds']) },
    mobileShop: { durationSeconds: Number(s['mobile-shop']['duration-seconds']) },
    rescuePlatform: { material: strip(s['rescue-platform'].material), breakSeconds: Number(s['rescue-platform']['break-seconds']) },
    autoIgniteTnt: { fuseSeconds: Number(s['auto-ignite-tnt']['fuse-seconds']), power: Number(s['auto-ignite-tnt'].power), damage: Number(s['auto-ignite-tnt'].damage) },
    voidKill: Object.fromEntries(Object.entries(s['void-kill'] ?? {}).map(([k, v]) => [k, Number(v)]))
  }
}
