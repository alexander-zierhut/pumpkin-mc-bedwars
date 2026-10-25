// All arenas of the server: which one is active (/map), auto-join, routing of server events to the
// player's game, and the commands. Platform independent like Game.
import { Stats } from './stats.ts'
import type { Arena, Resource, Settings, Shop } from './config.ts'
import { RESOURCES } from './config.ts'
import { Game } from './game.ts'
import type { BlockPos, Item, Location, Platform, PlayerId, Vec3 } from './platform.ts'
import { Specials } from './specials.ts'
import { MSG, PREFIX, fmt } from './text.ts'

export interface CommandResult { lines: string[] }

/** Server state the plugin keeps in its data folder. */
const STATE_FILE = 'config.yml'

export class BedWars {
  games = new Map<string, Game>()
  specials = new Map<string, Specials>()
  active: string
  autoJoinOff = new Set<PlayerId>()
  /** Online players in no game (auto-join off, or the active arena was full). */
  idle = new Set<PlayerId>()

  readonly stats: Stats

  constructor (readonly platform: Platform, readonly settings: Settings, arenas: Arena[], readonly shop: Shop) {
    this.stats = new Stats(platform)
    for (const a of arenas) {
      const g = new Game(platform, settings, a, shop)
      g.stats = this.stats
      const sp = new Specials(g)
      g.hooks.push(sp)
      this.games.set(a.name.toLowerCase(), g)
      this.specials.set(a.name.toLowerCase(), sp)
    }
    // the map chosen with /map survives restarts (data/config.yml, like the companion's config)
    const saved = /^arena:\s*(.+?)\s*$/m.exec(platform.readData(STATE_FILE) ?? '')?.[1]
    const wanted = (saved && this.games.get(saved.toLowerCase())) || this.games.get(settings.arena.toLowerCase()) || [...this.games.values()][0]
    this.active = wanted.name
  }

  get activeGame (): Game { return this.games.get(this.active.toLowerCase())! }
  gameOf (p: PlayerId): Game | null {
    for (const g of this.games.values()) if (g.players.has(p)) return g
    return null
  }

  specialsOf (g: Game) { return this.specials.get(g.name.toLowerCase())! }
  findGame (name: string) { return this.games.get(name.toLowerCase()) ?? null }

  // ---------------------------------------------------------------- server events

  /** Players who just connected: joined into the arena a moment later, once the client has spawned. */
  pending = new Map<PlayerId, number>()
  ticks = 0

  onJoin (p: PlayerId) {
    this.idle.add(p)
    this.pending.set(p, this.ticks + 10)
  }

  private tryAutoJoin (p: PlayerId) {
    if (!this.settings.autoJoin || this.autoJoinOff.has(p) || this.gameOf(p)) return
    const g = this.activeGame
    g.join(p)
    if (g.players.has(p)) this.idle.delete(p)
  }

  onQuit (p: PlayerId) {
    this.pending.delete(p)
    this.gameOf(p)?.leave(p, true)
    this.idle.delete(p)
    this.autoJoinOff.delete(p)
  }

  onTick () {
    this.ticks++
    for (const [p, at] of [...this.pending]) {
      if (this.ticks < at) continue
      this.pending.delete(p)
      if (!this.platform.isOnline(p)) continue
      this.tryAutoJoin(p)
      if (this.idle.has(p)) this.platform.teleport(p, this.activeGame.arena.lobbySpawn)
    }
    for (const g of this.games.values()) g.onTick()
    // every second: put idle players into the active arena (after a reset, a map switch, ...)
    if (this.ticks % 20 === 0) for (const p of [...this.idle]) if (this.platform.isOnline(p) && !this.pending.has(p)) this.tryAutoJoin(p)
  }

  spawnLocation (): Location { return this.activeGame.arena.lobbySpawn }

  respawnLocation (p: PlayerId): Location {
    return this.gameOf(p)?.respawnLocation(p) ?? this.activeGame.arena.lobbySpawn
  }

  afterRespawn (p: PlayerId) { this.gameOf(p)?.afterRespawn(p) }
  onDeath (p: PlayerId) { this.gameOf(p)?.onDeath(p) }

  onMove (p: PlayerId, to: Vec3) {
    const g = this.gameOf(p)
    if (g) {
      g.onMove(p, to)
      this.specialsOf(g).onMove(p, to)
      return
    }
    const limit = this.settings.voidKill[this.platform.location(p).world]
    if (limit !== undefined && to.y < limit) this.platform.teleport(p, this.activeGame.arena.lobbySpawn)
  }

  /** True cancels the damage. `attacker` is the player behind it (melee or arrow), if any. */
  onPlayerDamage (victim: PlayerId, attacker: PlayerId | null): boolean {
    const g = this.gameOf(victim)
    if (!g) return true
    return g.onDamage(victim, attacker)
  }

  /**
   * Damage to a non-player entity. True cancels it. `bySource` is the damage-by-entity event (the attacker is known),
   * otherwise it is the plain damage event, which fires first and knows nothing about who did it.
   */
  onEntityDamage (entity: number, attacker: PlayerId | null, cause: string, bySource = false): boolean {
    for (const g of this.games.values()) {
      const sp = this.specialsOf(g)
      if (g.shopkeepers.includes(entity) || sp.isMobileShop(entity)) return true
      if (sp.isParachuteChicken(entity)) {
        // environment damage just does not happen
        if (!attacker && /fall|in-?wall|suffocat|cramming/i.test(cause)) return true
        // a hit by an entity is decided by the damage-by-entity event that follows, which knows the shooter
        if (!bySource && /arrow|attack|projectile|thrown|trident|spear|spit|wind-?charge/i.test(cause)) return false
        // the glider's own arrow (air support) never shoots its own parachute down
        if (attacker && sp.isGliderOf(attacker, entity)) return true
        // any other hit shoots the parachute down (cancelled: no death, no drops)
        sp.shootDown(entity)
        return true
      }
    }
    return false
  }

  onEntityDeath (entity: number) {
    for (const g of this.games.values()) this.specialsOf(g).onChickenDeath(entity)
  }

  onBlockPlace (p: PlayerId, pos: BlockPos, block: string): boolean {
    const g = this.gameOf(p)
    if (!g) return this.platform.isOp(p) && this.platform.gamemode(p) === 'creative'
    const sp = this.specialsOf(g)
    if (block === 'tnt') { sp.onTntPlace(p, pos); return false }
    const ok = g.onBlockPlace(p, pos, block)
    if (ok && block === 'ender_chest') sp.onEnderChestPlaced(p, pos)
    return ok
  }

  onBlockBreak (p: PlayerId, pos: BlockPos, block: string): { allow: boolean, drop: boolean } {
    const g = this.gameOf(p)
    if (!g) return { allow: this.platform.isOp(p) && this.platform.gamemode(p) === 'creative', drop: false }
    const r = g.onBlockBreak(p, pos, block)
    if (r.allow) this.specialsOf(g).onBlockBroken(pos)
    return r
  }

  /** Right click on an entity. True cancels the vanilla interaction. */
  onInteractEntity (p: PlayerId, entity: number): boolean {
    const g = this.gameOf(p)
    if (!g) return false
    if (g.shopkeepers.includes(entity) || this.specialsOf(g).isMobileShop(entity)) {
      g.openShop(p)
      return true
    }
    return g.phase !== 'running'
  }

  /** Right/left click with the held item; `block` is the clicked block, if any. True cancels it. */
  onUse (p: PlayerId, item: Item | null, action: 'right' | 'left', block: BlockPos | null, blockName: string | null, face: Vec3 | null): boolean {
    const g = this.gameOf(p)
    if (!g) return false
    if (g.phase === 'waiting' || g.players.get(p)?.state === 'lobby') {
      if (action !== 'right' || !item) return true
      if (item.id === 'compass') g.openTeamMenu(p)
      else if (item.id === 'diamond' && this.platform.isOp(p)) {
        const err = g.forceStart()
        this.platform.message(p, PREFIX + (err ?? fmt(MSG.starting, { arena: g.name })))
      } else if (item.id === 'slime_ball') this.leaveGame(p)
      return true
    }
    if (g.players.get(p)?.state !== 'playing') return true
    if (action === 'right' && blockName === 'ender_chest' && block) return this.specialsOf(g).onEnderChestOpen(p, block)
    if (action === 'right' && item) return this.specialsOf(g).onUse(p, item, block, face)
    return false
  }

  onMenuClick (p: PlayerId, slot: number, click: string, hotbar: number): boolean {
    return this.gameOf(p)?.onMenuClick(p, slot, click, hotbar) ?? false
  }

  onMenuClose (p: PlayerId) { this.gameOf(p)?.onMenuClose(p) }

  onChat (p: PlayerId, message: string): boolean {
    const g = this.gameOf(p)
    if (g) return g.onChat(p, message)
    return false
  }

  /** Dropping items: not in the lobby (lobby items), fine in the game. True cancels. */
  onDrop (p: PlayerId): boolean {
    const g = this.gameOf(p)
    return !g || g.players.get(p)?.state !== 'playing' || g.phase !== 'running'
  }

  /** Picking up a shot arrow: not for players of an arena (the arrows of Infinity bows, like CREATIVE_ONLY in Bukkit). True cancels. */
  onPickupArrow (p: PlayerId): boolean {
    return this.gameOf(p) !== null && this.platform.gamemode(p) !== 'creative'
  }

  /** Whether a vanilla explosion (creeper, end crystal, ...) is suppressed: the arenas manage TNT themselves. */
  /** Vanilla explosions are always cancelled; in an arena world they are redone with only placed blocks breaking. */
  onVanillaExplosion (world: string, entity: number, at: Vec3, power: number): boolean {
    const g = [...this.games.values()].find(x => x.world === world)
    if (g) this.specialsOf(g).onVanillaExplosion(entity, at, power)
    return true
  }

  /** Leaves the arena; with auto-join on the player is put back in a moment (like the Paper setup). */
  leaveGame (p: PlayerId, disableAutoJoin = false) {
    const g = this.gameOf(p)
    if (disableAutoJoin) this.autoJoinOff.add(p)
    if (g) g.leave(p, false)
    this.idle.add(p)
    this.platform.clearInventory(p)
    this.platform.setGamemode(p, 'adventure')
    this.platform.teleport(p, this.activeGame.arena.lobbySpawn)
    this.platform.setBossbar(p, null, 0, 'yellow')
    if (disableAutoJoin) this.platform.message(p, PREFIX + MSG.autoJoinOff)
  }

  // ---------------------------------------------------------------- commands

  /** /start (admin) */
  cmdStart (): CommandResult {
    const g = this.activeGame
    const err = g.forceStart()
    if (err) return { lines: [PREFIX + err] }
    for (const p of g.connected()) this.platform.message(p, PREFIX + fmt(MSG.starting, { arena: g.name }))
    return { lines: [PREFIX + fmt(MSG.starting, { arena: g.name })] }
  }

  /** /setteam [player team] (admin) */
  cmdSetTeam (args: string[]): CommandResult {
    const g = this.activeGame
    if (args.length === 0) {
      const lines = [`§7Teams on §e${g.name}§7:`]
      for (const t of g.teams.values()) {
        const members = [...t.members].map(m => this.platform.name(m)).join(', ') || '-'
        lines.push(`§7  ${g.teamLabel(t)}§7 (${t.members.size}/${t.def.maxPlayers}): §f${members}`)
      }
      const without = g.inLobby().filter(p => !g.players.get(p)!.team).map(p => this.platform.name(p))
      lines.push(`§7  no team: §f${without.join(', ') || '-'}`, '§7/setteam <player> <team>')
      return { lines }
    }
    if (args.length !== 2) return { lines: ['§c/setteam <player> <team>'] }
    if (g.phase !== 'waiting') return { lines: [MSG.notInLobby] }
    const target = g.connected().find(p => this.platform.name(p).toLowerCase() === args[0].toLowerCase())
    if (!target) return { lines: [`§c${args[0]} is not in the lobby of ${g.name}.`] }
    const team = [...g.teams.values()].find(t => t.def.name.toLowerCase() === args[1].toLowerCase())
    if (!team) return { lines: [`§cUnknown team. Teams: ${[...g.teams.values()].map(t => t.def.name).join(', ')}`] }
    const ok = g.selectTeam(target, team.def.name)
    return { lines: [ok ? `§a${this.platform.name(target)} is now in team ${g.teamLabel(team)}§a.` : `§cTeam ${team.def.name} is full.`] }
  }

  /** /map [name] (admin) */
  cmdMap (args: string[]): CommandResult {
    const names = [...this.games.values()].map(g => g.name).sort()
    if (args.length === 0) return { lines: [fmt(MSG.activeMap, { arena: this.active }), fmt(MSG.maps, { maps: names.join(', ') })] }
    const target = this.findGame(args[0])
    if (!target) return { lines: [fmt(MSG.unknownMap, { maps: names.join(', ') })] }
    this.active = target.name
    this.platform.writeData(STATE_FILE, `# active map, written by /map\narena: ${target.name}\n`)
    // players waiting in the lobby of another map move over; running games keep going
    for (const g of this.games.values()) {
      if (g === target || g.phase !== 'waiting') continue
      for (const p of g.connected()) { g.leave(p, false); this.idle.add(p) }
    }
    for (const p of [...this.idle]) if (this.platform.isOnline(p)) this.tryAutoJoin(p)
    const line = fmt(MSG.nextMap, { arena: target.name })
    for (const p of [...this.idle, ...[...this.games.values()].flatMap(g => g.connected())]) this.platform.message(p, line)
    return { lines: [line] }
  }

  /** /autojoin (player) */
  cmdAutoJoin (p: PlayerId): CommandResult {
    // like the companion: only toggles; leaving the arena is /bw leave (the auto-join tick picks the player up again)
    if (this.autoJoinOff.delete(p)) {
      this.tryAutoJoin(p)
      return { lines: [MSG.autoJoinOn] }
    }
    this.autoJoinOff.add(p)
    return { lines: [MSG.autoJoinOff] }
  }

  /** /bw <leave|join|list|info|cheat give <resource> [amount] [player]> */
  cmdBw (sender: PlayerId | null, args: string[], isAdmin: boolean): CommandResult {
    const sub = (args[0] ?? '').toLowerCase()
    if (sub === 'leave' && sender) { this.leaveGame(sender); return { lines: [] } }
    if (sub === 'join' && sender) { this.autoJoinOff.delete(sender); this.tryAutoJoin(sender); return { lines: [] } }
    if (sub === 'give' && isAdmin) {
      // /bw give <player> <item> [count] [enchant=level,...]: an item like the shop hands it out (1.8 sword blocking)
      const target = args[1]
      const id = (args[2] ?? '').replace(/^minecraft:/, '')
      if (!target || !id || !this.platform.isOnline(target)) return { lines: ['§c/bw give <player> <item> [amount] [enchantment=level,...]'] }
      const item: Item = { id, count: Math.max(1, Number(args[3] ?? 1) || 1) }
      if (args[4]) item.enchants = Object.fromEntries(args[4].split(',').map(e => e.split('=')).map(([k, v]) => [k, Number(v ?? 1)]))
      if (id.endsWith('_sword')) item.blocking = true
      const slot = Array.from({ length: 36 }, (_, i) => i).find(i => !this.platform.getSlot(target, i))
      if (slot === undefined) return { lines: ['§cInventory full.'] }
      this.platform.setSlot(target, slot, item)
      return { lines: [`§aGave ${id} x${item.count} to ${target}.`] }
    }
    if (sub === 'block' && isAdmin) {
      // debug: block of the active arena world as the server sees it
      const [x, y, z] = args.slice(1, 4).map(Number)
      const w = args[4] ?? this.activeGame.world
      const pos = { x, y, z }
      return { lines: [`${w} ${x},${y},${z}: ${this.platform.blockName(w, pos)} (state ${this.platform.blockState(w, pos)})`] }
    }
    if (sub === 'stats') {
      const name = args[1] ?? (sender ? this.platform.name(sender) : null)
      if (!name) return { lines: ['§c/bw stats <player>'] }
      const [head, ...rest] = this.stats.lines(name)
      return { lines: [PREFIX + head, ...rest] }
    }
    if (sub === 'help') {
      return {
        lines: [
          PREFIX + 'Help:',
          '§e/bw join §7- join the active arena',
          '§e/bw leave §7- leave the arena',
          '§e/bw list §7- all arenas',
          '§e/bw stats [player] §7- statistics',
          '§e/autojoin §7- toggle auto-join',
          ...(isAdmin ? ['§e/start §7- start the game', '§e/map [name] §7- active map', '§e/setteam <player> <team>', '§e/bw cheat give <resource> [amount] [player]'] : [])
        ]
      }
    }
    if (sub === 'list') {
      // ScreamingBedWars `/bw list`: every arena with its player count (spectators included)
      return { lines: [PREFIX + MSG.arenaList, ...[...this.games.values()].map(g => `§a${g.name} §f${g.players.size}`)] }
    }
    if (sub === 'info') return { lines: [...this.games.values()].map(g => (g.name === this.active ? '* ' : '  ') + g.describe()) }
    if (sub === 'cheat' && (args[1] ?? '').toLowerCase() === 'give') {
      if (!isAdmin) return { lines: ['§cYou do not have permission to do that!'] }
      const res = (args[2] ?? '').toLowerCase()
      const resource = (RESOURCES as string[]).includes(res) ? res as Resource
        : (Object.entries(this.settings.resources).find(([, r]) => r.name.toLowerCase() === res)?.[0] as Resource | undefined)
      if (!resource) return { lines: [`§c/bw cheat give <${RESOURCES.join('|')}> [amount] [player]`] }
      const amount = Math.max(1, Math.min(2304, Number(args[3] ?? 64) || 64))
      const g = this.activeGame
      const target = args[4] ? g.connected().find(p => this.platform.name(p).toLowerCase() === args[4].toLowerCase()) : sender
      if (!target || !g.isPlaying(target)) return { lines: ['§cThe player must be in a running game.'] }
      g.giveResource(target, resource, amount)
      return { lines: [`§aGave ${amount} ${this.settings.resources[resource].name} to ${this.platform.name(target)}.`] }
    }
    return { lines: ['§7/bw leave | join | list | stats | help | info | cheat give <resource> [amount] [player]'] }
  }

  /** /bwconfig <key> <value> (console/tests): countdown, min-players, arena */
  cmdConfig (args: string[]): CommandResult {
    const [k, v] = args
    if (k === 'countdown') {
      const n = Number(v)
      for (const g of this.games.values()) {
        (g.arena as { pauseCountdown: number }).pauseCountdown = n
        if (g.phase === 'waiting') { g.countdown = n; g.countdownRunning = false }
      }
      return { lines: [`countdown = ${n}`] }
    }
    if (k === 'min-players') { for (const g of this.games.values()) g.minPlayers = Number(v); return { lines: [`min-players = ${v}`] } }
    if (k === 'arena') return this.cmdMap([v])
    if (k === 'game-time') { for (const g of this.games.values()) (g.arena as { gameTime: number }).gameTime = Number(v); return { lines: [`game-time = ${v}`] } }
    if (k === 'grace-seconds') { (this.settings.rejoin as { graceSeconds: number }).graceSeconds = Number(v); return { lines: [`grace-seconds = ${v}`] } }
    return { lines: ['bwconfig countdown|min-players|arena|game-time|grace-seconds <value>'] }
  }
}
