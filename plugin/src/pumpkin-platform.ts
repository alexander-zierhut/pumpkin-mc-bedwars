// Platform on top of the Pumpkin plugin API (WIT v0.1 with the LAN BedWars extensions).
import { BossBar } from 'pumpkin:plugin/boss-bar@0.1.0'
import type { NamedColor } from 'pumpkin:plugin/common@0.1.0'
import type { DataComponent } from 'pumpkin:plugin/data-components@0.1.0'
import { TextDisplayEntity } from 'pumpkin:plugin/display@0.1.0'
import type { Enchantment } from 'pumpkin:plugin/enchantments@0.1.0'
import type { EntityType } from 'pumpkin:plugin/entity-types@0.1.0'
import { Gui } from 'pumpkin:plugin/gui@0.1.0'
import { ItemStack } from 'pumpkin:plugin/item-stack@0.1.0'
import * as logging from 'pumpkin:plugin/logging@0.1.0'
import type { Particle } from 'pumpkin:plugin/particles@0.1.0'
import type { Player } from 'pumpkin:plugin/player@0.1.0'
import type { Screen } from 'pumpkin:plugin/screens@0.1.0'
import type { Server } from 'pumpkin:plugin/server@0.1.0'
import type { Sound } from 'pumpkin:plugin/sounds@0.1.0'
import type { StatusEffectType } from 'pumpkin:plugin/status-effect@0.1.0'
import { TextComponent } from 'pumpkin:plugin/text@0.1.0'
import type { Entity, World } from 'pumpkin:plugin/world@0.1.0'
import { POTION_IDS } from './generated/potions.ts'
import type { BlockPos, GameMode, Item, Location, Menu, Platform, PlayerId, ScoreTeam, Slot, Vec3 } from './platform.ts'
import { listData, readData, writeData } from './storage.ts'
import { jsonToLegacy } from './legacy-text.ts'

const NS = 'minecraft:'
const strip = (id: string) => id.replace(/^minecraft:/, '')
const kebab = (name: string) => strip(name).replace(/[._]/g, '-')
const FLAGS = { notifyNeighbors: true, notifyListeners: true }

/** Item data components in the network format Pumpkin's codec reads. */
class Bytes {
  out: number[] = []
  varint (v: number) { let x = v >>> 0; while (x > 0x7f) { this.out.push((x & 0x7f) | 0x80); x >>>= 7 } this.out.push(x); return this }
  bool (b: boolean) { this.out.push(b ? 1 : 0); return this }
  f32 (v: number) { const b = new DataView(new ArrayBuffer(4)); b.setFloat32(0, v); for (let i = 0; i < 4; i++) this.out.push(b.getUint8(i)); return this }
  i32 (v: number) { const b = new DataView(new ArrayBuffer(4)); b.setInt32(0, v); for (let i = 0; i < 4; i++) this.out.push(b.getUint8(i)); return this }
  string (s: string) { const enc = [...unescape(encodeURIComponent(s))].map(c => c.charCodeAt(0)); this.varint(enc.length); this.out.push(...enc); return this }
  get bytes () { return new Uint8Array(this.out) }
}

const LEGACY_TO_NAMED: Record<string, NamedColor> = {
  0: 'black', 1: 'dark-blue', 2: 'dark-green', 3: 'dark-aqua', 4: 'dark-red', 5: 'dark-purple', 6: 'gold', 7: 'gray',
  8: 'dark-gray', 9: 'blue', a: 'green', b: 'aqua', c: 'red', d: 'light-purple', e: 'yellow', f: 'white'
}

/** A legacy text as a non-italic component (item names and lore would otherwise be italic). */
function legacy (text: string): TextComponent {
  const c = TextComponent.fromLegacyString(text)
  c.italic(false)
  return c
}

export class PumpkinPlatform implements Platform {
  readData = readData
  writeData = writeData
  listData = listData

  // mulberry32, seeded when the plugin loads (Math.random would repeat the sequence of the build-time snapshot)
  private seed = (Date.now() ^ 0x9E3779B9) >>> 0
  random (): number {
    let t = (this.seed = (this.seed + 0x6D2B79F5) >>> 0)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  players = new Map<PlayerId, Player>()
  uuids = new Set<PlayerId>()
  entityIds = new Map<PlayerId, number>()
  worlds = new Map<string, World>()
  entities = new Map<number, Entity>()
  menus = new Map<string, Gui>()
  bossbars = new Map<PlayerId, BossBar>()
  /** What each bossbar shows, so the per-second updates of the game bar send only real changes. */
  bossbarShown = new Map<PlayerId, string>()
  /** last text per hologram: spawner holograms are refreshed every second, mostly with the same text */
  hologramShown = new Map<number, string>()
  /** Component JSON -> the legacy text we created it from (item names/lore read back). */
  texts = new Map<string, string>()
  sidebarLines = new Map<string, string[]>()
  teamMembers = new Map<string, Map<string, Set<string>>>()

  constructor (readonly server: Server) {}

  // ---------------------------------------------------------------- bookkeeping

  /**
   * The player name is the PlayerId: componentize-qjs hands WIT u64 values to JS as numbers, so the
   * two u64 halves of a UUID lose precision and `get-player-by-uuid` would not find the player.
   */
  idOf (p: Player): PlayerId { return p.getName() }

  // Handles from events go back to the host when the handler returns, and many API functions take
  // their resource arguments by ownership. So the adapter keeps its own handles for method calls and
  // passes freshly looked-up handles as arguments.

  addPlayer (p: Player) {
    const id = this.idOf(p)
    this.uuids.add(id)
    this.players.delete(id) // resolved lazily: during the join event the server does not list the player yet
    this.entityIds.set(id, p.asEntity().getId())
    return id
  }

  removePlayer (id: PlayerId) {
    this.uuids.delete(id)
    this.players.delete(id)
    this.entityIds.delete(id)
    const bar = this.bossbars.get(id)
    if (bar) { try { bar.removeAll() } catch {} this.bossbars.delete(id) }
    this.bossbarShown.delete(id)
  }

  playerByEntity (entityId: number): PlayerId | null {
    for (const [id, e] of this.entityIds) if (e === entityId) return id
    return null
  }

  world (name: string): World {
    let w = this.worlds.get(name)
    if (!w) {
      w = this.server.getWorldByName(name) ?? this.server.getAllWorlds().find(x => x.getName() === name)
      if (!w) throw new Error(`world ${name} is not loaded`)
      this.worlds.set(name, w)
    }
    return w
  }

  /** A fresh handle to pass as an (owned) argument. */
  private ownPlayer (id: PlayerId): Player | undefined {
    return this.uuids.has(id) ? this.server.getPlayerByName(id) : undefined
  }

  private ownWorld (name: string): World {
    const w = this.server.getWorldByName(name) ?? this.server.getAllWorlds().find(x => x.getName() === name)
    if (!w) throw new Error(`world ${name} is not loaded`)
    return w
  }

  private p (id: PlayerId): Player {
    let p = this.players.get(id)
    if (!p) {
      p = this.ownPlayer(id)
      if (!p) throw new Error(`player ${id} is not online`)
      this.players.set(id, p)
    }
    return p
  }

  private text (t: TextComponent | undefined): string | undefined {
    if (!t) return undefined
    const json = t.toJson()
    return this.texts.get(json) ?? jsonToLegacy(json)
  }

  private remember (text: string): TextComponent {
    const c = legacy(text)
    this.texts.set(c.toJson(), text)
    return legacy(text)
  }

  // ---------------------------------------------------------------- items

  toItem (s: ItemStack | undefined): Slot {
    if (!s) return null
    const count = s.getCount()
    if (count <= 0) return null
    const item: Item & { raw?: { component: DataComponent, value: Uint8Array }[] } = { id: strip(s.getRegistryKey()), count }
    const name = this.text(s.getCustomName())
    if (name) item.name = name
    const lore = s.getLore()
    if (lore.length) item.lore = lore.map(l => this.text(l) ?? '')
    const enchants = s.getEnchantments()
    if (enchants.length) item.enchants = Object.fromEntries(enchants.map((e: any) => [String(e.enchantment ?? e.name ?? '').replace(/-/g, '_'), Number(e.level)]))
    item.raw = s.getComponents()
    for (const c of item.raw) {
      if (c.component === 'consumable' && item.id.endsWith('_sword')) item.blocking = true
    }
    return item
  }

  toStack (item: Item): ItemStack {
    const s = new ItemStack(NS + item.id, item.count)
    const raw = (item as { raw?: { component: DataComponent, value: Uint8Array }[] }).raw
    if (raw) {
      for (const c of raw) s.setComponent(c.component, c.value)
      s.setCount(item.count)
      return s
    }
    if (item.name) s.setCustomName(this.remember(item.name))
    if (item.lore?.length) s.setLore(item.lore.map(l => this.remember(l)))
    for (const [e, lvl] of Object.entries(item.enchants ?? {})) s.addEnchantment(kebab(e) as Enchantment, lvl)
    if (item.damage) s.setComponent('damage', new Bytes().varint(item.damage).bytes)
    if (item.color !== undefined) s.setComponent('dyed-color', new Bytes().i32(item.color).bytes)
    if (item.potion) {
      const id = POTION_IDS[item.potion]
      if (id !== undefined) s.setComponent('potion-contents', new Bytes().bool(true).varint(id).bool(false).varint(0).bool(false).bytes)
    }
    if (item.blocking) {
      // 1.8 sword blocking for modern clients: "use" the sword with the block pose, never finishing
      s.setComponent('consumable', new Bytes().f32(1_000_000).varint(3).varint(0).string('minecraft:intentionally_empty').bool(false).bool(false).varint(0).bytes)
    }
    if (/(_sword|_axe|_pickaxe|_shovel|_hoe|^stick)$/.test(item.id)) {
      // 1.8 hit boxes are 0.1 larger (OldCombatMechanics attack-range)
      s.setComponent('attack-range', new Bytes().f32(0).f32(3).f32(0).f32(5).f32(0.1).f32(1).bytes)
    }
    return s
  }

  // ---------------------------------------------------------------- Platform

  now () { return Date.now() }
  log (message: string) { logging.log('info', message) }

  name (id: PlayerId) { return id }
  isOnline (id: PlayerId) { return this.uuids.has(id) }
  isOp (id: PlayerId) {
    const l = this.p(id).getPermissionLevel()
    return l === 'two' || l === 'three' || l === 'four'
  }

  location (id: PlayerId): Location {
    const p = this.p(id)
    const [x, y, z] = p.getPosition()
    return { x, y, z, yaw: p.getYaw(), pitch: p.getPitch(), world: p.getWorld().getName() }
  }

  onGround (id: PlayerId) { return this.p(id).asEntity().isOnGround() }
  sneaking (id: PlayerId) { return this.p(id).asEntity().isSneaking() }
  gamemode (id: PlayerId): GameMode { return this.p(id).getGamemode() as GameMode }
  setGamemode (id: PlayerId, mode: GameMode) { if (this.gamemode(id) !== mode) this.p(id).setGamemode(mode) }

  teleport (id: PlayerId, to: Location) {
    const p = this.p(id)
    const w = this.ownWorld(to.world)
    if (p.getWorld().getName() === to.world) p.teleport([to.x, to.y, to.z], to.yaw, to.pitch, w)
    else p.teleportWorld(w, [to.x, to.y, to.z], to.yaw, to.pitch)
  }

  setVelocity (id: PlayerId, v: Vec3) { this.p(id).setVelocity([v.x, v.y, v.z]) }
  health (id: PlayerId) { return this.p(id).getHealth() }
  setHealth (id: PlayerId, h: number) { this.p(id).setHealth(h) }
  setFood (id: PlayerId, food: number, saturation: number) { const p = this.p(id); p.setFoodLevel(food); p.setSaturation(saturation) }

  resetState (id: PlayerId) {
    const p = this.p(id)
    p.clearEffects()
    const e = p.asEntity()
    e.setFireTicks(0)
    e.setFallDistance(0)
    p.setVelocity([0, 0, 0])
    p.setAbsorption(0)
  }

  addEffect (id: PlayerId, effect: string, ticks: number, amplifier: number) {
    this.p(id).addEffect({ effectType: kebab(effect) as StatusEffectType, duration: ticks, amplifier, ambient: false, showParticles: true, showIcon: true })
  }

  setFallDistance (id: PlayerId, d: number) { this.p(id).asEntity().setFallDistance(d) }
  kill (id: PlayerId) { this.p(id).kill() }
  message (id: PlayerId, text: string) { this.p(id).sendSystemMessage(TextComponent.fromLegacyString(text), false) }
  actionbar (id: PlayerId, text: string) { this.p(id).showActionbar(TextComponent.fromLegacyString(text)) }

  title (id: PlayerId, title: string, subtitle: string, fadeIn: number, stay: number, fadeOut: number) {
    const p = this.p(id)
    p.sendTitleAnimation(fadeIn, stay, fadeOut)
    p.showSubtitle(TextComponent.fromLegacyString(subtitle))
    p.showTitle(TextComponent.fromLegacyString(title))
  }

  sound (id: PlayerId, sound: string, volume: number, pitch: number) {
    try { this.p(id).playSound(kebab(sound) as Sound, 'players', volume, pitch) } catch (e) { this.log(`sound ${sound}: ${e}`) }
  }

  setVisible (viewer: PlayerId, other: PlayerId, visible: boolean) {
    if (viewer === other) return
    const o = this.ownPlayer(other)
    if (!o) return
    if (visible) this.p(viewer).showPlayer(o)
    else this.p(viewer).hidePlayer(o)
  }

  setAllowFlight (id: PlayerId, allow: boolean) { this.p(id).setAllowFlight(allow) }

  getSlot (id: PlayerId, slot: number): Slot {
    const inv = this.p(id).getInventory()
    switch (slot) {
      case 36: return this.toItem(inv.getBoots())
      case 37: return this.toItem(inv.getLeggings())
      case 38: return this.toItem(inv.getChestplate())
      case 39: return this.toItem(inv.getHelmet())
      case 40: return this.toItem(inv.getOffHand())
      default: return this.toItem(inv.asInventory().getItem(slot))
    }
  }

  setSlot (id: PlayerId, slot: number, item: Slot) {
    const inv = this.p(id).getInventory()
    const stack = item && item.count > 0 ? this.toStack(item) : new ItemStack('minecraft:air', 0)
    switch (slot) {
      case 36: inv.setBoots(stack); break
      case 37: inv.setLeggings(stack); break
      case 38: inv.setChestplate(stack); break
      case 39: inv.setHelmet(stack); break
      case 40: inv.setOffHand(stack); break
      default: inv.asInventory().setItem(slot, stack)
    }
  }

  clearInventory (id: PlayerId) { this.p(id).getInventory().clearAll() }
  selectedSlot (id: PlayerId) { return this.p(id).getSelectedSlot() }

  openMenu (id: PlayerId, menu: Menu) {
    const screen = `generic-9x${Math.min(6, Math.max(1, menu.rows))}` as Screen
    let gui: Gui
    if (menu.storage) {
      let shared = this.menus.get(menu.id)
      if (!shared) {
        shared = new Gui(screen, legacy(menu.title))
        shared.setAllowGrabItems(true)
        shared.setAllowPutItems(true)
        menu.slots.forEach((s, i) => { if (s) shared!.setItem(i, this.toStack(s)) })
        this.menus.set(menu.id, shared)
      }
      gui = shared.share()
    } else {
      gui = new Gui(screen, legacy(menu.title))
      gui.setAllowGrabItems(false)
      gui.setAllowPutItems(false)
      menu.slots.forEach((s, i) => { if (s) gui.setItem(i, this.toStack(s)) })
    }
    this.p(id).openGui(gui)
  }

  menuSlots (menuId: string): Slot[] {
    const gui = this.menus.get(menuId)
    if (!gui) return []
    return Array.from({ length: gui.getSize() }, (_, i) => this.toItem(gui.getItem(i)))
  }

  /** Drops a stored menu (team chest of a finished round). */
  forgetMenu (menuId: string) { this.menus.delete(menuId) }

  closeMenu (id: PlayerId) { this.p(id).closeScreen() }
  syncInventory (id: PlayerId) { this.p(id).syncInventory() }

  setSidebar (world: string, title: string, lines: string[], scores?: number[]) {
    const sb = this.world(world).getScoreboard()
    const old = this.sidebarLines.get(world)
    if (!old) {
      try { sb.addObjective('bw', legacy(title), 'integer', { tag: 'blank' }) } catch { /* exists */ }
      sb.setDisplaySlot('sidebar', 'bw')
    } else {
      sb.updateObjective('bw', legacy(title), 'integer', { tag: 'blank' })
      for (const l of old) if (!lines.includes(l)) sb.removeScore(l, 'bw')
    }
    lines.forEach((l, i) => sb.updateScore(l, 'bw', scores?.[i] ?? lines.length - i, undefined))
    this.sidebarLines.set(world, [...lines])
  }

  setTeams (world: string, teams: ScoreTeam[]) {
    const sb = this.world(world).getScoreboard()
    let known = this.teamMembers.get(world)
    if (!known) { known = new Map(); this.teamMembers.set(world, known) }
    for (const t of teams) {
      const settings = {
        displayName: legacy(`§${t.color}${t.name}`),
        friendlyFire: false,
        seeFriendlyInvisibles: true,
        nametagVisibility: 'always' as const,
        collisionRule: 'always' as const,
        color: LEGACY_TO_NAMED[t.color] ?? 'white',
        prefix: legacy(''),
        suffix: legacy('')
      }
      let members = known.get(t.name)
      if (!members) {
        try { sb.createTeam(t.name, settings) } catch { sb.updateTeam(t.name, settings) }
        members = new Set()
        known.set(t.name, members)
      }
      for (const m of [...members]) if (!t.members.includes(m)) { sb.removePlayerFromTeam(t.name, m); members.delete(m) }
      for (const m of t.members) if (!members.has(m)) { sb.addPlayerToTeam(t.name, m); members.add(m) }
    }
  }

  setBossbar (id: PlayerId, text: string | null, progress: number, color: 'yellow' | 'green' | 'red') {
    let bar = this.bossbars.get(id)
    if (text === null) {
      const own = this.ownPlayer(id)
      if (bar && own) bar.removePlayer(own)
      this.bossbars.delete(id)
      this.bossbarShown.delete(id)
      return
    }
    const progressNow = Math.max(0, Math.min(1, progress))
    const shown = `${text}|${color}|${progressNow}`
    if (bar && this.bossbarShown.get(id) === shown) return
    this.bossbarShown.set(id, shown)
    if (!bar) {
      bar = new BossBar(legacy(text), color, 'notches-20')
      const own = this.ownPlayer(id)
      if (own) bar.addPlayer(own)
      this.bossbars.set(id, bar)
    } else {
      bar.setTitle(legacy(text))
      bar.setColor(color)
    }
    bar.setHealth(progressNow)
  }

  blockName (world: string, pos: BlockPos) { return strip(this.world(world).getBlockState(pos).blockName) }
  blockState (world: string, pos: BlockPos) { return this.world(world).getBlockStateId(pos) }
  setBlock (world: string, pos: BlockPos, name: string) { this.world(world).setBlockByName(pos, NS + strip(name), FLAGS) }
  setBlockState (world: string, pos: BlockPos, state: number) { this.world(world).setBlockState(pos, state, FLAGS) }

  dropItem (world: string, pos: Vec3, item: Item, velocity: Vec3 | null, canMerge = true): number {
    const e = this.world(world).dropItem([pos.x, pos.y, pos.z], this.toStack(item), velocity ? [velocity.x, velocity.y, velocity.z] : undefined, velocity ? 0 : 40, canMerge)
    return e.getId()
  }

  private track (e: Entity): number {
    const id = e.getId()
    this.entities.set(id, e)
    return id
  }

  spawnShopkeeper (world: string, at: Location, name: string): number {
    const e = this.world(world).spawnEntity('villager', [at.x, at.y, at.z])
    const mob = e.asMob()
    if (mob) mob.setAiDisabled(true)
    e.setInvulnerable(true)
    e.setSilent(true)
    e.setRotation(at.yaw, at.pitch)
    e.setCustomName(legacy(name))
    e.setCustomNameVisible(true)
    return this.track(e)
  }

  spawnHologram (world: string, at: Vec3, text: string): number {
    const e = this.world(world).spawnEntity('text-display', [at.x, at.y, at.z])
    const d = TextDisplayEntity.fromEntity(e)
    if (d) {
      d.setText(TextComponent.fromLegacyString(text))
      d.getDisplay().setBillboard('center')
    }
    return this.track(e)
  }

  setHologram (world: string, id: number, text: string) {
    if (this.hologramShown.get(id) === text) return
    const e = this.entities.get(id) ?? this.world(world).getEntityById(id)
    if (!e) return
    TextDisplayEntity.fromEntity(e)?.setText(TextComponent.fromLegacyString(text))
    this.hologramShown.set(id, text)
  }

  spawnEntity (world: string, type: string, at: Vec3): number {
    return this.track(this.world(world).spawnEntity(kebab(type) as EntityType, [at.x, at.y, at.z]))
  }

  removeEntity (world: string, id: number) {
    const e = this.entities.get(id) ?? this.world(world).getEntityById(id)
    this.entities.delete(id)
    this.hologramShown.delete(id)
    try { e?.remove() } catch {}
  }

  entityPosition (world: string, id: number): Vec3 | null {
    const e = this.world(world).getEntityById(id)
    if (!e) return null
    const [x, y, z] = e.getPosition()
    return { x, y, z }
  }

  addPassenger (id: PlayerId, world: string, entityId: number) {
    const e = this.world(world).getEntityById(entityId)
    if (e) this.p(id).asEntity().addPassenger(e)
  }

  itemEntities (world: string, min: Vec3, max: Vec3): number[] {
    const out: number[] = []
    for (const e of this.world(world).getEntities()) {
      if (e.getType() !== 'item') continue
      const [x, y, z] = e.getPosition()
      if (x >= min.x - 1 && x <= max.x + 1 && y >= min.y - 64 && y <= max.y + 16 && z >= min.z - 1 && z <= max.z + 1) {
        this.entities.set(e.getId(), e)
        out.push(e.getId())
      }
    }
    return out
  }

  explode (world: string, at: Vec3, power: number, breakable: BlockPos[], damage: number | null, exempt: number[]): BlockPos[] {
    return this.world(world).explodeFiltered([at.x, at.y, at.z], power, breakable, damage ?? undefined, Int32Array.from(exempt))
  }

  playSound (world: string, at: Vec3, sound: string, volume: number, pitch: number) {
    try { this.world(world).playSound(kebab(sound) as Sound, 'players', [at.x, at.y, at.z], volume, pitch) } catch (e) { this.log(`sound ${sound}: ${e}`) }
  }

  particle (world: string, at: Vec3, particle: string, count: number, spread: number) {
    try { this.world(world).spawnParticle(kebab(particle) as Particle, [at.x, at.y, at.z], [spread, spread, spread], 0, count) } catch (e) { this.log(`particle ${particle}: ${e}`) }
  }

  forceChunks (world: string, min: BlockPos, max: BlockPos) { this.world(world).setChunksForced(min, max, true) }

  chunksLoaded (world: string, min: BlockPos, max: BlockPos) {
    const w = this.world(world)
    for (let x = min.x >> 4; x <= max.x >> 4; x++) for (let z = min.z >> 4; z <= max.z >> 4; z++) if (!w.isChunkLoaded(x, z)) return false
    return true
  }

  entityIdOf (id: PlayerId) { return this.entityIds.get(id) ?? -1 }
  runCommand (command: string) { return this.server.runCommand(command) }
}
