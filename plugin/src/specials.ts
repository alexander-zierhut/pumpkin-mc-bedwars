// Rewinside special items, ported from the Paper companion plugin (which ported github.com/Marfien/rewi-bw):
//  Teleporter (firework rocket): stand still for the countdown, get shot up, get teleported home.
//  Fallschirm (chicken spawn egg): a chicken on your head lets you glide in your view direction.
//  Combo: opening the Fallschirm during the Teleporter launch cancels the home teleport.
//  Mobiler Shop (armor stand): a shopkeeper for 20 s.
//  TNT: ignites itself when placed, the explosion only breaks placed blocks.
//  Rettungsplattform (nether star): a platform under your feet for 10 s.
//  Teamkiste (ender chest): a chest the whole team shares.
import { key, type Game, type GameHooks, TICKS_PER_SECOND } from './game.ts'
import type { BlockPos, Item, PlayerId, Vec3 } from './platform.ts'
import { PREFIX, MSG } from './text.ts'

const RED = '§c'


interface Countdown { remaining: number, nextTick: number, block: string }
interface Launch { startY: number, startTick: number }
interface Glide { chicken: number, startTick: number, vy: number, sneaked: boolean }
interface Tnt { entity: number, pos: Vec3, explodeTick: number, placer: PlayerId, damagePlacer: boolean }
interface Platform { blocks: string[], removeTick: number }

export class Specials implements GameHooks {
  countdowns = new Map<PlayerId, Countdown>()
  launches = new Map<PlayerId, Launch>()
  glides = new Map<PlayerId, Glide>()
  tnts: Tnt[] = []
  platforms: Platform[] = []
  rescueCooldown = new Map<PlayerId, number>()
  mobileShops: { entity: number, removeTick: number }[] = []
  /** Team chest positions -> team. */
  teamChests = new Map<string, string>()

  constructor (readonly game: Game) {}

  private get p () { return this.game.platform }
  private get s () { return this.game.settings }

  /** Removes one item with this id from the player (selected slot first). */
  private takeOne (player: PlayerId, id: string): boolean {
    const sel = this.p.selectedSlot(player)
    for (const slot of [sel, 40, ...Array.from({ length: 36 }, (_, i) => i)]) {
      const it = this.p.getSlot(player, slot)
      if (it && it.id === id) {
        this.p.setSlot(player, slot, it.count > 1 ? { ...it, count: it.count - 1 } : null)
        return true
      }
    }
    return false
  }

  private hasItem (player: PlayerId, id: string) {
    for (let slot = 0; slot <= 40; slot++) if (this.p.getSlot(player, slot)?.id === id) return true
    return false
  }

  /** Right click with an item. Returns true when the vanilla use must be cancelled. */
  onUse (player: PlayerId, item: Item, clicked: BlockPos | null, face: Vec3 | null): boolean {
    if (!this.game.isPlaying(player)) return false
    switch (item.id) {
      case 'firework_rocket': this.startTeleporter(player); return true
      case 'chicken_spawn_egg': this.openParachute(player); return true
      case 'armor_stand':
        if (clicked && face) this.placeMobileShop(player, { x: clicked.x + face.x, y: clicked.y + face.y, z: clicked.z + face.z })
        return true
      case 'nether_star': this.rescuePlatform(player); return true
      default: return false
    }
  }

  // ---------------------------------------------------------------- teleporter

  private underBlocks (player: PlayerId): boolean {
    const l = this.p.location(player)
    const top = this.game.arena.max.y + 10
    for (const dx of [0.2, -0.2]) {
      for (const dz of [0.2, -0.2]) {
        const x = Math.floor(l.x + dx)
        const z = Math.floor(l.z + dz)
        for (let y = Math.floor(l.y) + 2; y <= top; y++) {
          if (this.p.blockName(this.game.world, { x, y, z }) !== 'air') return true
        }
      }
    }
    return false
  }

  startTeleporter (player: PlayerId) {
    if (this.countdowns.has(player) || this.launches.has(player)) {
      this.p.message(player, PREFIX + 'Du teleportierst dich bereits.')
      return
    }
    if (this.underBlocks(player)) {
      this.p.message(player, PREFIX + RED + 'Über dir dürfen keine Blöcke sein!')
      return
    }
    const seconds = this.s.teleporter.countdownSeconds
    this.p.message(player, PREFIX + `Teleport in §e${seconds}§7 Sekunden. Nicht bewegen!`)
    this.countdowns.set(player, { remaining: seconds, nextTick: this.game.tick, block: key(this.p.location(player)) })
  }

  private cancelCountdown (player: PlayerId, message: string | null) {
    if (!this.countdowns.delete(player)) return
    if (message && this.p.isOnline(player)) this.p.message(player, PREFIX + message)
  }

  onMove (player: PlayerId, to: Vec3) {
    const c = this.countdowns.get(player)
    if (c && key(to) !== c.block) this.cancelCountdown(player, RED + 'Teleport abgebrochen, du hast dich bewegt.')
  }

  private tickTeleporter (game: Game) {
    for (const [player, c] of [...this.countdowns]) {
      if (game.tick < c.nextTick) continue
      if (!game.isPlaying(player)) { this.countdowns.delete(player); continue }
      if (this.underBlocks(player)) { this.cancelCountdown(player, RED + 'Über dir dürfen keine Blöcke sein!'); continue }
      if (!this.hasItem(player, 'firework_rocket')) { this.cancelCountdown(player, RED + 'Du hast keinen Teleporter mehr.'); continue }
      const at = this.p.location(player)
      if (c.remaining <= 0) {
        this.countdowns.delete(player)
        this.takeOne(player, 'firework_rocket')
        this.launches.set(player, { startY: at.y, startTick: game.tick })
        this.p.playSound(game.world, at, 'entity.firework_rocket.launch', 1, 1)
        continue
      }
      this.p.particle(game.world, { x: at.x, y: at.y + 2.2, z: at.z }, 'firework', 12, 0.4)
      for (const other of game.connected()) this.p.sound(other, 'block.note_block.pling', 1, 1)
      c.remaining--
      c.nextTick = game.tick + TICKS_PER_SECOND
    }
    for (const [player, l] of [...this.launches]) {
      // the clone gave up after 5 s if the player never got high enough (ceiling)
      if (!game.isPlaying(player) || game.tick - l.startTick > 100) { this.launches.delete(player); continue }
      const at = this.p.location(player)
      if (at.y > l.startY + this.s.teleporter.launchHeight) {
        this.launches.delete(player)
        const home = game.teamOf(player)?.def.spawn
        if (home) {
          this.p.setVelocity(player, { x: 0, y: 0, z: 0 })
          this.p.setFallDistance(player, 0)
          this.p.teleport(player, home)
          this.p.sound(player, 'entity.enderman.teleport', 1, 1)
        }
        continue
      }
      this.p.setFallDistance(player, 0)
      this.p.setVelocity(player, { x: 0, y: this.s.teleporter.launchSpeed, z: 0 })
    }
  }

  // ---------------------------------------------------------------- parachute

  openParachute (player: PlayerId) {
    if (this.p.onGround(player)) {
      this.p.message(player, PREFIX + RED + 'Du musst in der Luft sein, um den Fallschirm zu benutzen.')
      return
    }
    if (this.glides.has(player)) {
      this.p.message(player, PREFIX + 'Dein Fallschirm ist bereits offen.')
      return
    }
    if (!this.takeOne(player, 'chicken_spawn_egg')) return
    // the Rewinside "bug": the parachute ends the teleporter launch before the home teleport
    this.launches.delete(player)
    const at = this.p.location(player)
    const chicken = this.p.spawnEntity(this.game.world, 'chicken', { x: at.x, y: at.y + 1.6, z: at.z })
    this.game.entities.add(chicken)
    this.p.addPassenger(player, this.game.world, chicken)
    this.p.setVelocity(player, { x: 0, y: 0, z: 0 })
    // sneaking cancels the parachute; a player who still holds sneak from before has to let go first
    this.glides.set(player, { chicken, startTick: this.game.tick, vy: 0, sneaked: this.p.sneaking(player) })
  }

  isParachuteChicken (entity: number) {
    for (const g of this.glides.values()) if (g.chicken === entity) return true
    return false
  }

  /** Whether this chicken is the parachute `player` glides with (a shot from the glider never hits it). */
  isGliderOf (player: PlayerId, entity: number) {
    return this.glides.get(player)?.chicken === entity
  }

  /** A hit on a parachute chicken (arrow, sword ...): the parachute is shot down, the chicken vanishes without drops. */
  shootDown (entity: number) {
    for (const [player, g] of [...this.glides]) {
      if (g.chicken === entity) this.closeParachute(player, RED + 'Dein Fallschirm wurde abgeschossen!')
    }
  }

  /** The chicken died anyway (e.g. /kill). */
  onChickenDeath (entity: number) {
    for (const [player, g] of this.glides) {
      if (g.chicken !== entity) continue
      this.glides.delete(player)
      this.game.entities.delete(entity)
      this.p.message(player, PREFIX + RED + 'Dein Fallschirm wurde abgeschossen!')
    }
  }

  private closeParachute (player: PlayerId, message: string | null) {
    const g = this.glides.get(player)
    if (!g) return
    this.glides.delete(player)
    const pos = this.p.entityPosition(this.game.world, g.chicken)
    if (pos) this.p.particle(this.game.world, pos, 'large_smoke', 6, 0.2)
    this.p.removeEntity(this.game.world, g.chicken)
    this.game.entities.delete(g.chicken)
    if (message && this.p.isOnline(player)) this.p.message(player, PREFIX + message)
  }

  private tickParachutes (game: Game) {
    for (const [player, g] of [...this.glides]) {
      if (!game.isPlaying(player)) { this.closeParachute(player, null); continue }
      if (game.tick - g.startTick > this.s.parachute.durationSeconds * TICKS_PER_SECOND) { this.closeParachute(player, RED + 'Dein Fallschirm ist kaputt gegangen.'); continue }
      if (game.tick - g.startTick > 2 && this.p.onGround(player)) { this.closeParachute(player, null); continue }
      // sneak: the parachute is gone and the player drops (the fall distance of the glide stays reset, as when it ends otherwise)
      const sneaking = this.p.sneaking(player)
      if (sneaking && !g.sneaked) { this.closeParachute(player, null); continue }
      g.sneaked = sneaking
      // glide: horizontal speed in the view direction, vertical speed eases towards the sink rate
      g.vy += (-this.s.parachute.fallSpeed - g.vy) * 0.25
      const l = this.p.location(player)
      const yaw = l.yaw * Math.PI / 180
      const pitch = l.pitch * Math.PI / 180
      const xz = Math.cos(pitch)
      const speed = this.s.parachute.horizontalSpeed
      this.p.setVelocity(player, { x: -xz * Math.sin(yaw) * speed, y: g.vy, z: xz * Math.cos(yaw) * speed })
      this.p.setFallDistance(player, 0)
    }
  }

  // ---------------------------------------------------------------- mobile shop

  isMobileShop (entity: number) { return this.mobileShops.some(m => m.entity === entity) }

  private placeMobileShop (player: PlayerId, at: BlockPos) {
    const air = (y: number) => this.p.blockName(this.game.world, { x: at.x, y, z: at.z }) === 'air'
    if (!air(at.y) || !air(at.y + 1)) {
      this.p.message(player, PREFIX + RED + 'Hier ist nicht genug Platz für den Shop.')
      return
    }
    if (!this.takeOne(player, 'armor_stand')) return
    const l = this.p.location(player)
    const entity = this.p.spawnShopkeeper(this.game.world, { x: at.x + 0.5, y: at.y, z: at.z + 0.5, yaw: l.yaw + 180, pitch: 0, world: this.game.world }, '§eMobiler Shop')
    this.game.entities.add(entity)
    this.mobileShops.push({ entity, removeTick: this.game.tick + this.s.mobileShop.durationSeconds * TICKS_PER_SECOND })
  }

  private tickMobileShops (game: Game) {
    for (const m of [...this.mobileShops]) {
      if (game.tick < m.removeTick) continue
      const pos = this.p.entityPosition(game.world, m.entity)
      if (pos) this.p.particle(game.world, { x: pos.x, y: pos.y + 1, z: pos.z }, 'large_smoke', 10, 0.3)
      this.p.removeEntity(game.world, m.entity)
      game.entities.delete(m.entity)
      this.mobileShops = this.mobileShops.filter(x => x !== m)
    }
  }

  // ---------------------------------------------------------------- TNT

  /** Placing TNT ignites it (ScreamingBedWars AutoIgniteableTnt). Returns true when handled. */
  onTntPlace (player: PlayerId, pos: BlockPos): boolean {
    if (!this.game.isPlaying(player) || !this.game.inArena(pos)) return false
    const special = this.game.shop.categories.flatMap(c => c.items).concat(this.game.shop.quickBuy)
      .find(i => i.stack.id === 'tnt')?.special
    const fuse = Number(special?.['explosion-time'] ?? this.s.autoIgniteTnt.fuseSeconds)
    const damagePlacer = special?.['damage-placer'] !== false
    if (!this.takeOne(player, 'tnt')) return true
    const at = { x: pos.x + 0.5, y: pos.y, z: pos.z + 0.5 }
    const entity = this.p.spawnEntity(this.game.world, 'tnt', at)
    this.game.entities.add(entity)
    this.tnts.push({ entity, pos: at, explodeTick: this.game.tick + fuse * TICKS_PER_SECOND, placer: player, damagePlacer })
    this.p.playSound(this.game.world, at, 'entity.tnt.primed', 1, 1)
    return true
  }

  /**
   * A vanilla explosion (summoned TNT, creeper, ...) in this arena's world: it hurts like vanilla, but like on the
   * Paper server only blocks placed by players break, the map stays.
   */
  onVanillaExplosion (entity: number, at: Vec3, power: number) {
    // the shop TNT explodes through tickTnt (placer exempt), never as a vanilla explosion
    if (this.tnts.some(t => t.entity === entity)) return
    const reach = (power * 2) ** 2
    const near = [...this.game.placed].filter(k => !this.game.unbreakable.has(k)).map(k => k.split(',').map(Number))
      .filter(([x, y, z]) => (x + 0.5 - at.x) ** 2 + (y + 0.5 - at.y) ** 2 + (z + 0.5 - at.z) ** 2 <= reach)
      .map(([x, y, z]) => ({ x, y, z }))
    for (const b of this.p.explode(this.game.world, at, power, near, null, [])) {
      this.game.placed.delete(key(b))
      this.teamChests.delete(key(b))
    }
  }

  private tickTnt (game: Game) {
    for (const t of [...this.tnts]) {
      const pos = this.p.entityPosition(game.world, t.entity)
      if (pos) t.pos = pos
      if (game.tick < t.explodeTick && pos) continue
      this.tnts = this.tnts.filter(x => x !== t)
      this.p.removeEntity(game.world, t.entity)
      game.entities.delete(t.entity)
      const near = [...game.placed].filter(k => !game.unbreakable.has(k)).map(k => k.split(',').map(Number))
        .filter(([x, y, z]) => (x + 0.5 - t.pos.x) ** 2 + (y + 0.5 - t.pos.y) ** 2 + (z + 0.5 - t.pos.z) ** 2 <= 64)
        .map(([x, y, z]) => ({ x, y, z }))
      const exempt = !t.damagePlacer && this.p.isOnline(t.placer) ? [this.p.entityIdOf(t.placer)] : []
      const destroyed = this.p.explode(game.world, t.pos, this.s.autoIgniteTnt.power, near, this.s.autoIgniteTnt.damage, exempt)
      for (const b of destroyed) {
        game.placed.delete(key(b))
        this.teamChests.delete(key(b))
      }
    }
  }

  // ---------------------------------------------------------------- rescue platform

  rescuePlatform (player: PlayerId) {
    const ready = this.rescueCooldown.get(player) ?? 0
    if (this.game.tick < ready) {
      const seconds = Math.ceil((ready - this.game.tick) / TICKS_PER_SECOND)
      // ScreamingBedWars wording
      this.p.message(player, PREFIX + RED + `Du musst noch ${seconds} ${seconds === 1 ? 'Sekunde' : 'Sekunden'} warten, bis du die nächste Rettungsplattform benutzen kannst!`)
      return
    }
    if (this.p.onGround(player)) {
      this.p.message(player, PREFIX + RED + 'Die Rettungsplattform geht nur in der Luft.')
      return
    }
    const l = this.p.location(player)
    const cy = Math.floor(l.y) - 1
    const blocks: string[] = []
    const team = this.game.teamOf(player)
    const material = this.s.rescuePlatform.material === 'glass' && team ? `${team.def.color.dye}_stained_glass` : this.s.rescuePlatform.material
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const b = { x: Math.floor(l.x) + dx, y: cy, z: Math.floor(l.z) + dz }
        if (!this.game.inArena(b) || this.p.blockName(this.game.world, b) !== 'air') continue
        this.p.setBlock(this.game.world, b, material)
        const k = key(b)
        blocks.push(k)
        this.game.placed.add(k)
        this.game.unbreakable.add(k)
      }
    }
    if (blocks.length === 0) return
    this.takeOne(player, 'nether_star')
    const special = this.game.shop.categories.flatMap(c => c.items).concat(this.game.shop.quickBuy).find(i => i.stack.id === 'nether_star')?.special
    this.rescueCooldown.set(player, this.game.tick + Number(special?.delay ?? 0) * TICKS_PER_SECOND)
    this.p.setVelocity(player, { x: 0, y: 0, z: 0 })
    this.p.setFallDistance(player, 0)
    this.p.teleport(player, { ...l, y: cy + 1 })
    this.platforms.push({ blocks, removeTick: this.game.tick + this.s.rescuePlatform.breakSeconds * TICKS_PER_SECOND })
  }

  private tickPlatforms (game: Game) {
    for (const pl of [...this.platforms]) {
      if (game.tick < pl.removeTick) continue
      this.platforms = this.platforms.filter(x => x !== pl)
      for (const k of pl.blocks) {
        const [x, y, z] = k.split(',').map(Number)
        game.unbreakable.delete(k)
        game.placed.delete(k)
        this.p.setBlock(game.world, { x, y, z }, 'air')
      }
    }
  }

  // ---------------------------------------------------------------- team chest

  onEnderChestPlaced (player: PlayerId, pos: BlockPos) {
    const t = this.game.teamOf(player)
    if (!t) return
    this.teamChests.set(key(pos), t.def.name)
    for (const m of t.members) if (this.p.isOnline(m)) this.p.message(m, PREFIX + MSG.teamChestPlaced)
  }

  /** Right click on an ender chest. Returns true when handled (vanilla ender chest cancelled). */
  onEnderChestOpen (player: PlayerId, pos: BlockPos): boolean {
    if (!this.game.isPlaying(player)) return false
    const owner = this.teamChests.get(key(pos))
    const t = this.game.teamOf(player)
    if (owner && t && owner !== t.def.name) {
      this.p.message(player, PREFIX + MSG.teamChestNotYours)
      return true
    }
    this.game.openTeamChest(player)
    return true
  }

  onBlockBroken (pos: BlockPos) {
    const owner = this.teamChests.get(key(pos))
    if (!owner) return
    this.teamChests.delete(key(pos))
    const t = this.game.teams.get(owner)
    if (t) for (const m of t.members) if (this.p.isOnline(m)) this.p.message(m, PREFIX + MSG.teamChestBroken)
  }

  // ---------------------------------------------------------------- hooks

  onStart (_game: Game) { this.clear() }

  onTick (game: Game) {
    this.tickTeleporter(game)
    this.tickParachutes(game)
    this.tickMobileShops(game)
    this.tickTnt(game)
    this.tickPlatforms(game)
  }

  onPlayerOut (_game: Game, player: PlayerId) {
    this.cancelCountdown(player, null)
    this.launches.delete(player)
    this.closeParachute(player, null)
  }

  onReset (game: Game) {
    for (const g of this.glides.values()) this.p.removeEntity(game.world, g.chicken)
    for (const t of this.tnts) this.p.removeEntity(game.world, t.entity)
    this.clear()
  }

  private clear () {
    this.countdowns.clear()
    this.launches.clear()
    this.glides.clear()
    this.tnts = []
    this.platforms = []
    this.rescueCooldown.clear()
    this.mobileShops = []
    this.teamChests.clear()
  }
}
