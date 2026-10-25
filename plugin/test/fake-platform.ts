// In-memory Platform for integration tests of the game logic without a server: players, inventories, blocks and
// entities are plain objects, time is the tick counter, randomness is seeded. `FakeServer` drives the BedWars
// instance the way src/main.ts wires the Pumpkin events (join, tick, death -> respawn location -> respawn).
import { BedWars } from '../src/bedwars.ts'
import type { Arena, Settings, Shop } from '../src/config.ts'
import type { BlockPos, GameMode, Item, Location, Menu, Platform, PlayerId, ScoreTeam, Slot, Vec3 } from '../src/platform.ts'

export interface FakePlayer {
  name: string
  online: boolean
  op: boolean
  loc: Location
  gamemode: GameMode
  health: number
  slots: Slot[]
  selected: number
  menu: Menu | null
  chat: string[]
  titles: string[]
  dead: boolean
}

export interface FakeEntity { type: string, world: string, pos: Vec3, item?: Item, name?: string, text?: string }

const key = (world: string, p: BlockPos) => `${world}:${Math.floor(p.x)},${Math.floor(p.y)},${Math.floor(p.z)}`
const plain = (s: string) => s.replace(/§./g, '')

export class FakePlatform implements Platform {
  tick = 0
  files: Record<string, string> = {}
  players = new Map<PlayerId, FakePlayer>()
  blocks = new Map<string, string>()
  /** Block state ids: one per block name, like a (tiny) block state registry. */
  private states: string[] = ['air']
  entities = new Map<number, FakeEntity>()
  menus = new Map<string, Slot[]>()
  bossbars = new Map<PlayerId, { text: string, progress: number, color: string }>()
  sidebars = new Map<string, { title: string, lines: string[], scores?: number[] }>()
  logs: string[] = []
  private nextId = 1000
  private seed = 12345

  // ---------------------------------------------------------------- basics
  now () { return this.tick * 50 }
  log (message: string) { this.logs.push(message) }
  random () { this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff; return this.seed / 0x80000000 }
  readData (path: string) { return this.files[path] ?? null }
  writeData (path: string, text: string) { this.files[path] = text; return true }
  listData (path: string) { return Object.keys(this.files).filter(f => f.startsWith(path + '/')).map(f => f.slice(path.length + 1)) }

  // ---------------------------------------------------------------- players
  p (id: PlayerId): FakePlayer {
    const p = this.players.get(id)
    if (!p) throw new Error(`unknown player ${id}`)
    return p
  }

  name (id: PlayerId) { return this.p(id).name }
  isOnline (id: PlayerId) { return this.players.get(id)?.online ?? false }
  isOp (id: PlayerId) { return this.p(id).op }
  location (id: PlayerId) { return { ...this.p(id).loc } }
  /** Players in the air / holding sneak (tests set them; default: on the ground, not sneaking). */
  airborne = new Set<PlayerId>()
  sneakers = new Set<PlayerId>()
  onGround (id: PlayerId) { return !this.airborne.has(id) }
  sneaking (id: PlayerId) { return this.sneakers.has(id) }
  gamemode (id: PlayerId) { return this.p(id).gamemode }
  setGamemode (id: PlayerId, mode: GameMode) { this.p(id).gamemode = mode }
  teleport (id: PlayerId, to: Location) { this.p(id).loc = { ...to } }
  setVelocity () {}
  health (id: PlayerId) { return this.p(id).health }
  setHealth (id: PlayerId, health: number) { this.p(id).health = health }
  setFood () {}
  resetState () {}
  addEffect () {}
  setFallDistance () {}
  kill (id: PlayerId) { const p = this.p(id); p.health = 0; p.dead = true }
  message (id: PlayerId, text: string) { this.p(id).chat.push(plain(text)) }
  actionbar () {}
  title (id: PlayerId, title: string, subtitle: string) { this.p(id).titles.push(plain(`${title} | ${subtitle}`)) }
  sound () {}
  setVisible () {}
  setAllowFlight () {}

  // ---------------------------------------------------------------- inventory
  getSlot (id: PlayerId, slot: number) { const s = this.p(id).slots[slot]; return s ? { ...s } : null }
  setSlot (id: PlayerId, slot: number, item: Slot) { this.p(id).slots[slot] = item ? { ...item } : null }
  clearInventory (id: PlayerId) { this.p(id).slots = Array.from({ length: 41 }, () => null) }
  selectedSlot (id: PlayerId) { return this.p(id).selected }
  openMenu (id: PlayerId, menu: Menu) {
    if (menu.storage && !this.menus.has(menu.id)) this.menus.set(menu.id, [...menu.slots])
    this.p(id).menu = menu
  }

  menuSlots (menuId: string) { return this.menus.get(menuId) ?? [] }
  closeMenu (id: PlayerId) { this.p(id).menu = null }
  syncInventory () {}

  // ---------------------------------------------------------------- scoreboard, bars
  setSidebar (world: string, title: string, lines: string[], scores?: number[]) { this.sidebars.set(world, { title: plain(title), lines: lines.map(plain), scores }) }
  setTeams (_world: string, _teams: ScoreTeam[]) {}
  setBossbar (id: PlayerId, text: string | null, progress: number, color: 'yellow' | 'green' | 'red') {
    if (text === null) this.bossbars.delete(id); else this.bossbars.set(id, { text: plain(text), progress, color })
  }

  // ---------------------------------------------------------------- world
  blockName (world: string, pos: BlockPos) { return this.blocks.get(key(world, pos)) ?? 'air' }
  blockState (world: string, pos: BlockPos) {
    const name = this.blockName(world, pos)
    if (!this.states.includes(name)) this.states.push(name)
    return this.states.indexOf(name)
  }

  setBlock (world: string, pos: BlockPos, name: string) {
    if (name === 'air') this.blocks.delete(key(world, pos)); else this.blocks.set(key(world, pos), name)
  }

  setBlockState (world: string, pos: BlockPos, state: number) { this.setBlock(world, pos, this.states[state] ?? 'air') }

  private add (e: FakeEntity) { const id = this.nextId++; this.entities.set(id, e); return id }
  dropItem (world: string, pos: Vec3, item: Item) { return this.add({ type: 'item', world, pos: { ...pos }, item: { ...item } }) }
  spawnShopkeeper (world: string, at: Location, name: string) { return this.add({ type: 'villager', world, pos: { ...at }, name }) }
  spawnHologram (world: string, at: Vec3, text: string) { return this.add({ type: 'text_display', world, pos: { ...at }, text: plain(text) }) }
  setHologram (_world: string, id: number, text: string) { const e = this.entities.get(id); if (e) e.text = plain(text) }
  spawnEntity (world: string, type: string, at: Vec3) { return this.add({ type, world, pos: { ...at } }) }
  removeEntity (_world: string, id: number) { this.entities.delete(id) }
  entityPosition (_world: string, id: number) { const e = this.entities.get(id); return e ? { ...e.pos } : null }
  addPassenger () {}
  itemEntities (world: string, min: Vec3, max: Vec3) {
    return [...this.entities].filter(([, e]) => e.type === 'item' && e.world === world &&
      e.pos.x >= min.x && e.pos.x <= max.x && e.pos.y >= min.y && e.pos.y <= max.y && e.pos.z >= min.z && e.pos.z <= max.z).map(([id]) => id)
  }

  explode (world: string, _at: Vec3, _power: number, breakable: BlockPos[]) { for (const b of breakable) this.setBlock(world, b, 'air'); return breakable }
  playSound () {}
  particle () {}
  forceChunks () {}
  chunksLoaded () { return true }
  entityIdOf (id: PlayerId) { return [...this.players.keys()].indexOf(id) + 1 }
  runCommand () { return [] }
}

/** BedWars on a FakePlatform, driven like src/main.ts drives it from the Pumpkin events. */
export class FakeServer {
  readonly fake = new FakePlatform()
  readonly bw: BedWars

  constructor (settings: Settings, arenas: Arena[], shop: Shop) {
    // the map worlds have their beds (the game looks for them when a round starts)
    for (const a of arenas) {
      for (const t of a.teams) {
        this.fake.setBlock(a.world, t.bed, `${t.color.dye}_bed`)
        this.fake.setBlock(a.world, { x: t.bed.x + 1, y: t.bed.y, z: t.bed.z }, `${t.color.dye}_bed`)
      }
    }
    this.bw = new BedWars(this.fake, settings, arenas, shop)
    for (const g of this.bw.games.values()) g.prepare()
  }

  join (name: string, op = false): PlayerId {
    this.fake.players.set(name, {
      name, online: true, op, loc: this.bw.spawnLocation(), gamemode: 'adventure', health: 20,
      slots: Array.from({ length: 41 }, () => null), selected: 0, menu: null, chat: [], titles: [], dead: false
    })
    this.bw.onJoin(name)
    return name
  }

  quit (id: PlayerId) { this.bw.onQuit(id); this.fake.p(id).online = false }

  /** One server tick; players killed by the game die and respawn like on Pumpkin (death event, respawn). */
  tick () {
    this.fake.tick++
    this.bw.onTick()
    for (const [id, p] of this.fake.players) {
      if (!p.dead || !p.online) continue
      p.dead = false
      this.bw.onDeath(id)
      p.loc = this.bw.respawnLocation(id)
      p.health = 20
      this.bw.afterRespawn(id)
    }
  }

  ticks (n: number) { for (let i = 0; i < n; i++) this.tick() }
  seconds (s: number) { this.ticks(s * 20) }
}
