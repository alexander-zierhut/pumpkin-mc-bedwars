// The server as the game logic sees it. src/pumpkin-platform.ts implements it on top of the Pumpkin
// plugin API; test/fake-platform.ts implements it in memory, so the whole game runs in Node tests.

export interface Vec3 { x: number, y: number, z: number }
export interface Location extends Vec3 { world: string, yaw: number, pitch: number }
export interface BlockPos { x: number, y: number, z: number }
export type GameMode = 'survival' | 'creative' | 'adventure' | 'spectator'
/** Player UUID as a string. */
export type PlayerId = string

export interface Item {
  /** Item id without namespace, e.g. `red_sandstone`. */
  id: string
  count: number
  /** Custom name with § colour codes. */
  name?: string
  lore?: string[]
  /** Enchantment id (without namespace) -> level. */
  enchants?: Record<string, number>
  /** Durability already used. */
  damage?: number
  /** RGB colour of dyed leather. */
  color?: number
  /** Potion id without namespace, e.g. `strong_healing`. */
  potion?: string
  /** 1.8 sword blocking for modern clients (right click shows the block pose). */
  blocking?: boolean
}
export type Slot = Item | null

/**
 * Player inventory slot numbers: 0-8 hotbar, 9-35 main inventory, 36 boots, 37 leggings,
 * 38 chestplate, 39 helmet, 40 off hand.
 */
export const INVENTORY_SIZE = 41
export const ARMOR_SLOTS = { boots: 36, leggings: 37, chestplate: 38, helmet: 39 } as const

/** A chest GUI the game opened. Clicks arrive as `menuClick` with the menu's id. */
export interface Menu {
  id: string
  title: string
  rows: number
  slots: Slot[]
  /** Players may take items out of / put items into the menu (team chest). */
  storage?: boolean
}

export interface ScoreTeam {
  name: string
  /** Legacy colour code letter, e.g. `c` for red. */
  color: string
  members: string[]
}

export interface Platform {
  now (): number
  log (message: string): void
  /** Uniform random number in [0, 1). */
  random (): number

  // ---------------------------------------------------------------- plugin data folder (fails soft: null / false / [])
  readData (path: string): string | null
  writeData (path: string, text: string): boolean
  listData (path: string): string[]

  // ---------------------------------------------------------------- players
  name (p: PlayerId): string
  isOnline (p: PlayerId): boolean
  isOp (p: PlayerId): boolean
  location (p: PlayerId): Location
  onGround (p: PlayerId): boolean
  sneaking (p: PlayerId): boolean
  gamemode (p: PlayerId): GameMode
  setGamemode (p: PlayerId, mode: GameMode): void
  teleport (p: PlayerId, to: Location): void
  setVelocity (p: PlayerId, v: Vec3): void
  health (p: PlayerId): number
  setHealth (p: PlayerId, health: number): void
  setFood (p: PlayerId, food: number, saturation: number): void
  /** Removes effects, fire and fall distance (fresh spawn). */
  resetState (p: PlayerId): void
  addEffect (p: PlayerId, effect: string, ticks: number, amplifier: number): void
  setFallDistance (p: PlayerId, distance: number): void
  kill (p: PlayerId): void
  message (p: PlayerId, text: string): void
  actionbar (p: PlayerId, text: string): void
  title (p: PlayerId, title: string, subtitle: string, fadeIn: number, stay: number, fadeOut: number): void
  sound (p: PlayerId, sound: string, volume: number, pitch: number): void
  /** Hides `other` from `viewer` (spectators) or shows it again. */
  setVisible (viewer: PlayerId, other: PlayerId, visible: boolean): void
  setAllowFlight (p: PlayerId, allow: boolean): void

  // ---------------------------------------------------------------- inventory
  getSlot (p: PlayerId, slot: number): Slot
  setSlot (p: PlayerId, slot: number, item: Slot): void
  clearInventory (p: PlayerId): void
  selectedSlot (p: PlayerId): number
  openMenu (p: PlayerId, menu: Menu): void
  /** Current items of a storage menu (team chest). */
  menuSlots (menuId: string): Slot[]
  closeMenu (p: PlayerId): void
  /** Re-sends the player's inventory (after a cancelled click). */
  syncInventory (p: PlayerId): void

  // ---------------------------------------------------------------- scoreboard, bars
  /** Sidebar lines top to bottom; `scores` are the numbers shown on the right (default: descending line positions). */
  setSidebar (world: string, title: string, lines: string[], scores?: number[]): void
  setTeams (world: string, teams: ScoreTeam[]): void
  setBossbar (p: PlayerId, text: string | null, progress: number, color: 'yellow' | 'green' | 'red'): void

  // ---------------------------------------------------------------- world
  blockName (world: string, pos: BlockPos): string
  blockState (world: string, pos: BlockPos): number
  setBlock (world: string, pos: BlockPos, name: string): void
  setBlockState (world: string, pos: BlockPos, state: number): void
  dropItem (world: string, pos: Vec3, item: Item, velocity: Vec3 | null, canMerge?: boolean): number
  spawnShopkeeper (world: string, at: Location, name: string): number
  spawnHologram (world: string, at: Vec3, text: string): number
  setHologram (world: string, id: number, text: string): void
  spawnEntity (world: string, type: string, at: Vec3): number
  removeEntity (world: string, id: number): void
  entityPosition (world: string, id: number): Vec3 | null
  /** Seats an entity on the player's head (parachute chicken). */
  addPassenger (p: PlayerId, world: string, entityId: number): void
  /** Item entities inside the box (resource drops), removed by `removeEntity`. */
  itemEntities (world: string, min: Vec3, max: Vec3): number[]
  explode (world: string, at: Vec3, power: number, breakable: BlockPos[], damage: number | null, exempt: number[]): BlockPos[]
  playSound (world: string, at: Vec3, sound: string, volume: number, pitch: number): void
  particle (world: string, at: Vec3, particle: string, count: number, spread: number): void
  /** Keeps the chunks of the box loaded (block reads in unloaded chunks see air, writes are lost). */
  forceChunks (world: string, min: BlockPos, max: BlockPos): void
  chunksLoaded (world: string, min: BlockPos, max: BlockPos): boolean
  entityIdOf (p: PlayerId): number
  runCommand (command: string): string[]
}
