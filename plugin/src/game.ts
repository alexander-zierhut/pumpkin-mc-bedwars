// One BedWars arena: lobby, team selection, countdown, the running game (spawners, beds, deaths,
// respawn protection, scoreboard, team chat), the end and the reset. Talks to the server only
// through Platform, so it runs unchanged in the Node tests.
import type { Stats } from './stats.ts'
import type { Arena, Resource, Settings, Shop, SpawnerDef, TeamDef } from './config.ts'
import { add, copy, emptyInventory } from './inventory.ts'
import { ARMOR_SLOTS, type BlockPos, type Item, type Location, type Platform, type PlayerId, type Slot, type Vec3 } from './platform.ts'
import { actionAt, buy, renderPage, pageTitle, SHOP_ROWS, type BuyMode, type ShopPage } from './shop.ts'
import { MSG, PREFIX, clock, fmt, hearts, plain } from './text.ts'

export type Phase = 'waiting' | 'running' | 'ending'
export const TICKS_PER_SECOND = 20
/** Last hit within this time gets the kill (void, fall). */
const KILL_CREDIT_TICKS = 10 * TICKS_PER_SECOND

export const key = (p: BlockPos) => `${Math.floor(p.x)},${Math.floor(p.y)},${Math.floor(p.z)}`
export const unkey = (k: string): BlockPos => { const [x, y, z] = k.split(',').map(Number); return { x, y, z } }

export type MenuState =
  | { kind: 'shop', page: ShopPage }
  | { kind: 'teams' }
  | { kind: 'teamchest', team: string }

export interface GamePlayer {
  id: PlayerId
  team: string | null
  state: 'lobby' | 'playing' | 'spectator'
  /** Waiting for the respawn screen to finish (dead, bed alive). */
  dead: boolean
  protectedUntil: number
  lastHit: { by: PlayerId, tick: number } | null
  menu: MenuState | null
}

export interface TeamState {
  def: TeamDef
  members: Set<PlayerId>
  bed: boolean
  bedBlocks: { pos: BlockPos, state: number }[]
  chest: Slot[]
  /** Rejoin grace: an empty team stays in the game until this tick. */
  graceUntil: number | null
  /** Had no player at the start of the round (kept as a "forced" team in a one-sided game). */
  startedEmpty: boolean
  out: boolean
}

interface SpawnerState { def: SpawnerDef, next: number, holo: number | null }

/** Hooks for the special items (Teleporter, Parachute, TNT, ...), see specials.ts. */
export interface GameHooks {
  onStart (game: Game): void
  onTick (game: Game): void
  onPlayerOut (game: Game, p: PlayerId): void
  onReset (game: Game): void
}

export class Game {
  phase: Phase = 'waiting'
  /** Shared player statistics (set by BedWars). */
  stats: Stats | null = null
  tick = 0
  players = new Map<PlayerId, GamePlayer>()
  teams = new Map<string, TeamState>()
  /** Blocks placed by players during the round (only these may be broken, and they go at the reset). */
  placed = new Set<string>()
  /** Blocks that must not be broken although they were placed (rescue platforms). */
  unbreakable = new Set<string>()
  countdown: number
  countdownRunning = false
  startedTick = 0
  endTick = 0
  spawners: SpawnerState[] = []
  shopkeepers: number[] = []
  /** Entities to remove at the reset (mobile shops, parachute chickens, holograms). */
  entities = new Set<number>()
  /** Players who lost the connection while alive in a team: id -> team. */
  rejoinTeams = new Map<PlayerId, string>()
  hooks: GameHooks[] = []
  /** Seconds between lobby countdown messages near the end. */
  private lastSidebar = ''
  minPlayers: number

  constructor (readonly platform: Platform, readonly settings: Settings, readonly arena: Arena, readonly shop: Shop) {
    this.countdown = arena.pauseCountdown
    this.minPlayers = Math.max(2, settings.minPlayers || arena.minPlayers)
    for (const def of arena.teams) {
      this.teams.set(def.name, { def, members: new Set(), bed: true, bedBlocks: [], chest: Array.from({ length: 27 }, () => null), graceUntil: null, out: false, startedEmpty: false })
    }
  }

  /** Loads the arena area for good (lobby, map, spectator spawn), see Platform.forceChunks. */
  prepare () {
    const { min, max, lobbySpawn, specSpawn } = this.arena
    this.platform.forceChunks(this.world, min, max)
    for (const l of [lobbySpawn, specSpawn]) {
      const p = { x: Math.floor(l.x), y: Math.floor(l.y), z: Math.floor(l.z) }
      this.platform.forceChunks(l.world, { x: p.x - 16, y: p.y, z: p.z - 16 }, { x: p.x + 16, y: p.y, z: p.z + 16 })
    }
  }

  get name () { return this.arena.name }
  get world () { return this.arena.world }
  get maxPlayers () { return this.arena.teams.reduce((s, t) => s + t.maxPlayers, 0) }
  connected (): PlayerId[] { return [...this.players.keys()].filter(p => this.platform.isOnline(p)) }
  inLobby (): PlayerId[] { return this.connected().filter(p => this.players.get(p)!.state === 'lobby') }
  playing (): PlayerId[] { return this.connected().filter(p => this.players.get(p)!.state === 'playing') }
  teamOf (p: PlayerId): TeamState | null {
    const t = this.players.get(p)?.team
    return t ? this.teams.get(t) ?? null : null
  }

  isPlaying (p: PlayerId) { return this.phase === 'running' && this.players.get(p)?.state === 'playing' }
  colored (p: PlayerId) {
    const t = this.teamOf(p)
    return `§${t ? t.def.color.code : '7'}${this.platform.name(p)}`
  }

  teamLabel (t: TeamState) { return `§${t.def.color.code}${t.def.name}` }

  send (to: Iterable<PlayerId>, text: string) { for (const p of to) this.platform.message(p, text) }
  broadcast (text: string) { this.send(this.connected(), text) }

  // ================================================================= joining and leaving

  /** Adds a player to this arena (lobby while waiting, spectator while running). */
  join (p: PlayerId) {
    if (this.players.has(p)) return
    if (this.phase === 'waiting') {
      if (this.inLobby().length >= this.maxPlayers) {
        this.platform.message(p, PREFIX + fmt(MSG.gameFull, { arena: this.name }))
        return
      }
      this.players.set(p, { id: p, team: null, state: 'lobby', dead: false, protectedUntil: 0, lastHit: null, menu: null })
      this.toLobby(p)
      this.broadcast(PREFIX + fmt(MSG.join, { name: this.platform.name(p), players: this.inLobby().length, maxplayers: this.maxPlayers }))
      this.updateLobbyBoard()
      this.updateTeamsBoard()
      return
    }
    // running or ending: rejoin into the old team or watch
    this.players.set(p, { id: p, team: null, state: 'spectator', dead: false, protectedUntil: 0, lastHit: null, menu: null })
    const team = this.rejoinTeams.get(p)
    if (this.phase === 'running' && team && this.settings.rejoin.enabled && this.canRejoin(team)) {
      this.rejoinTeams.delete(p)
      const t = this.teams.get(team)!
      t.members.add(p)
      t.graceUntil = null
      const gp = this.players.get(p)!
      gp.team = team
      gp.state = 'playing'
      this.spawnInGame(p)
      this.platform.message(p, PREFIX + fmt(MSG.rejoinedTeam, { team: this.teamLabel(t) }))
      this.send([...t.members].filter(m => m !== p && this.platform.isOnline(m)), PREFIX + fmt(MSG.mateRejoined, { player: this.colored(p) }))
      this.updateTeamsBoard()
      this.updateGameBoard()
      return
    }
    this.makeSpectator(p)
    this.platform.message(p, PREFIX + MSG.spectating)
  }

  private canRejoin (team: string) {
    const t = this.teams.get(team)
    if (!t || t.out) return false
    if (this.teamAlive(t)) return true
    return t.graceUntil !== null && this.tick < t.graceUntil && t.bed
  }

  /** Removes a player (disconnect or leaving the arena). */
  leave (p: PlayerId, disconnected: boolean) {
    const gp = this.players.get(p)
    if (!gp) return
    for (const h of this.hooks) h.onPlayerOut(this, p)
    const team = this.teamOf(p)
    if (this.phase === 'running' && gp.state === 'playing' && team) {
      if (disconnected && this.settings.rejoin.enabled) {
        this.rejoinTeams.set(p, team.def.name)
        const others = [...team.members].filter(m => m !== p && this.players.get(m)?.state === 'playing' && this.platform.isOnline(m))
        if (others.length === 0 && team.bed && this.settings.rejoin.graceSeconds > 0) {
          team.graceUntil = this.tick + this.settings.rejoin.graceSeconds * TICKS_PER_SECOND
          this.platform.log(`[BedWars] Team ${team.def.name} is empty, kept in the game for ${this.settings.rejoin.graceSeconds} s so ${this.platform.name(p)} can rejoin`)
          this.send(this.connected().filter(o => o !== p), PREFIX + fmt(MSG.lostConnection, { player: this.colored(p), team: this.teamLabel(team), seconds: this.settings.rejoin.graceSeconds }))
        }
      }
      team.members.delete(p)
    } else if (team) {
      team.members.delete(p)
    }
    // (ScreamingBedWars tells the leaving player too, so the message goes out before the removal)
    if (this.phase === 'waiting') this.broadcast(PREFIX + fmt(MSG.leave, { name: this.platform.name(p) }))
    this.players.delete(p)
    if (this.phase === 'waiting') this.updateLobbyBoard()
    this.updateTeamsBoard()
    if (this.phase === 'running') { this.updateGameBoard(); this.checkWin() }
  }

  // ================================================================= lobby

  private lobbyItems (p: PlayerId) {
    this.platform.clearInventory(p)
    this.platform.setSlot(p, 0, { id: 'compass', count: 1, name: MSG.selectorItem })
    const t = this.teamOf(p)
    if (t) {
      this.platform.setSlot(p, 1, { id: `${t.def.color.dye}_wool`, count: 1, name: this.teamLabel(t) })
      for (const [piece, slot] of Object.entries(ARMOR_SLOTS)) {
        this.platform.setSlot(p, slot, { id: `leather_${piece}`, count: 1, color: t.def.color.rgb })
      }
    }
    if (this.platform.isOp(p)) this.platform.setSlot(p, 2, { id: 'diamond', count: 1, name: MSG.startItem })
    this.platform.setSlot(p, 8, { id: 'slime_ball', count: 1, name: MSG.leaveItem })
  }

  toLobby (p: PlayerId) {
    this.platform.resetState(p)
    this.platform.setGamemode(p, 'survival')
    this.platform.setAllowFlight(p, false)
    this.platform.teleport(p, this.arena.lobbySpawn)
    this.platform.setHealth(p, 20)
    this.platform.setFood(p, 20, 5)
    this.lobbyItems(p)
    this.platform.setBossbar(p, MSG.bossbarWaiting, 1, 'yellow')
  }

  openTeamMenu (p: PlayerId) {
    const slots: Slot[] = []
    for (const t of this.teams.values()) {
      const n = t.members.size
      const full = n >= t.def.maxPlayers
      slots.push({
        id: `${t.def.color.dye}_wool`,
        count: Math.max(1, n),
        name: fmt(MSG.teamSelectItem, { team: this.teamLabel(t), in: n, max: t.def.maxPlayers }),
        lore: ['§f---------------------', ...[...t.members].map(m => `§7${this.platform.name(m)}`), full ? MSG.teamSelectLoreFull : MSG.teamSelectLoreJoin]
      })
    }
    const rows = Math.max(1, Math.ceil(slots.length / 9))
    this.platform.openMenu(p, { id: `teams:${this.name}`, title: fmt(MSG.teamSelectionTitle, { arena: this.name }), rows, slots })
    this.players.get(p)!.menu = { kind: 'teams' }
  }

  /** Puts a lobby player into a team. Returns false when the team is full or unknown. */
  selectTeam (p: PlayerId, name: string, notify = true): boolean {
    const gp = this.players.get(p)
    const t = [...this.teams.values()].find(x => x.def.name.toLowerCase() === name.toLowerCase())
    if (!gp || !t || this.phase !== 'waiting') return false
    const label = this.teamLabel(t)
    if (gp.team === t.def.name) {
      if (notify) this.platform.message(p, PREFIX + fmt(MSG.teamAlreadySelected, { team: label, players: t.members.size, maxplayers: t.def.maxPlayers }))
      return true
    }
    if (t.members.size >= t.def.maxPlayers) {
      if (notify) this.platform.message(p, PREFIX + fmt(MSG.teamIsFull, { team: label }))
      return false
    }
    if (gp.team) this.teams.get(gp.team)?.members.delete(p)
    gp.team = t.def.name
    t.members.add(p)
    if (notify) this.platform.message(p, PREFIX + fmt(MSG.teamSelected, { team: label, players: t.members.size, maxplayers: t.def.maxPlayers }))
    this.lobbyItems(p)
    this.updateTeamsBoard()
    return true
  }

  /** Admin /start: starts with the next tick. */
  forceStart (): string | null {
    if (this.phase !== 'waiting') return fmt(MSG.alreadyRunning, { arena: this.name })
    if (this.inLobby().length < 2) return MSG.needTwoPlayers
    this.countdownRunning = true
    this.countdown = 0
    return null
  }

  private tickLobby () {
    const n = this.inLobby().length
    if (n < this.minPlayers) {
      if (this.countdownRunning) { this.countdownRunning = false; this.countdown = this.arena.pauseCountdown }
      if (this.countdown <= 0) this.countdown = this.arena.pauseCountdown
      for (const p of this.inLobby()) this.platform.setBossbar(p, MSG.bossbarWaiting, 1, 'yellow')
      return
    }
    this.countdownRunning = true
    if (this.tick % TICKS_PER_SECOND !== 0 && this.countdown > 0) return
    if (this.countdown <= 0) {
      // beds and spawners must be readable: the arena chunks are forced at load, wait until they are in
      if (!this.platform.chunksLoaded(this.world, this.arena.min, this.arena.max)) {
        if (this.tick % 100 === 0) this.platform.log(`arena ${this.name}: waiting for its chunks to load`)
        return
      }
      this.start()
      return
    }
    const total = this.arena.pauseCountdown
    for (const p of this.inLobby()) this.platform.setBossbar(p, MSG.bossbarWaiting, Math.max(0, Math.min(1, this.countdown / total)), 'yellow')
    if (this.countdown <= 10 || this.countdown === 30 || this.countdown === 60) {
      for (const p of this.inLobby()) {
        this.platform.message(p, PREFIX + (this.countdown === 1 ? MSG.countdownOne : fmt(MSG.countdown, { seconds: this.countdown })))
        if (this.countdown <= 5) this.platform.title(p, `§c${this.countdown}`, '', 0, 20, 0)
        this.platform.sound(p, 'ui.button.click', 1, 1)
      }
    }
    this.countdown--
  }

  // ================================================================= starting

  /** Balances players without a team into the emptiest teams (SBW join-randomly-after-lobby-timeout). */
  private assignTeams () {
    for (const p of this.inLobby()) {
      const gp = this.players.get(p)!
      if (gp.team) continue
      const t = [...this.teams.values()].filter(x => x.members.size < x.def.maxPlayers)
        .sort((a, b) => a.members.size - b.members.size)[0]
      if (!t) continue
      gp.team = t.def.name
      t.members.add(p)
    }
  }

  start () {
    this.assignTeams()
    this.phase = 'running'
    this.startedTick = this.tick
    this.placed.clear()
    this.unbreakable.clear()
    this.rejoinTeams.clear()
    for (const t of this.teams.values()) {
      t.bed = true
      t.out = false
      t.graceUntil = null
      t.chest = Array.from({ length: 27 }, () => null)
      t.bedBlocks = this.findBed(t.def.bed)
      if (t.bedBlocks.length === 0) this.platform.log(`arena ${this.name}: no bed found for team ${t.def.name} at ${key(t.def.bed)}`)
    }
    for (const p of this.inLobby()) {
      const gp = this.players.get(p)!
      gp.state = 'playing'
      gp.lastHit = null
      this.spawnInGame(p, false)
      this.platform.title(p, MSG.gameStartTitle, fmt(MSG.gameStartSubtitle, { arena: this.name }), 0, 20, 0)
      this.platform.sound(p, 'entity.player.levelup', 1, 1)
    }
    this.updateGameBossbar()
    // teams without players are out from the start, unless the game would be one-sided (then they stay
    // as long as their bed stands, like ScreamingBedWars' forced teams)
    const occupied = [...this.teams.values()].filter(t => t.members.size > 0)
    for (const t of this.teams.values()) t.startedEmpty = t.members.size === 0
    if (occupied.length >= 2) for (const t of this.teams.values()) if (t.members.size === 0) { t.out = true; t.bed = false }
    for (const s of this.arena.stores) this.shopkeepers.push(this.platform.spawnShopkeeper(this.world, s.loc, s.name))
    this.spawners = this.arena.spawners.map(def => ({
      def,
      next: this.tick + this.settings.resources[def.type].interval * TICKS_PER_SECOND,
      holo: def.hologram ? this.platform.spawnHologram(this.world, { x: def.pos.x, y: def.pos.y + 1.75, z: def.pos.z }, this.spawnerText(def, this.settings.resources[def.type].interval)) : null
    }))
    for (const h of this.hooks) h.onStart(this)
    this.updateTeamsBoard()
    this.updateGameBoard()
  }

  /** Both halves of the bed at `pos` (the arena stores one of them). */
  private findBed (pos: BlockPos): { pos: BlockPos, state: number }[] {
    const isBed = (b: BlockPos) => this.platform.blockName(this.world, b).endsWith('_bed')
    if (!isBed(pos)) return []
    const out = [{ pos, state: this.platform.blockState(this.world, pos) }]
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const o = { x: pos.x + dx, y: pos.y, z: pos.z + dz }
      if (isBed(o)) { out.push({ pos: o, state: this.platform.blockState(this.world, o) }); break }
    }
    return out
  }

  /** Puts a playing player on the team spawn with an empty inventory (start, respawn, rejoin). */
  spawnInGame (p: PlayerId, protect = true) {
    const t = this.teamOf(p)
    if (!t) return
    const gp = this.players.get(p)!
    gp.dead = false
    this.platform.closeMenu(p)
    gp.menu = null
    this.platform.resetState(p)
    this.platform.clearInventory(p)
    this.platform.setGamemode(p, 'survival')
    this.platform.setAllowFlight(p, false)
    this.platform.teleport(p, t.def.spawn)
    this.platform.setHealth(p, 20)
    this.platform.setFood(p, 20, 5)
    if (protect && this.settings.respawnProtectionSeconds > 0) {
      gp.protectedUntil = this.tick + this.settings.respawnProtectionSeconds * TICKS_PER_SECOND
      this.platform.message(p, PREFIX + fmt(MSG.respawnProtection, { time: this.settings.respawnProtectionSeconds }))
    }
  }

  private spawnerText (def: SpawnerDef, seconds: number) {
    const r = this.settings.resources[def.type]
    const head = `${r.color}§l${r.name}`
    if (r.interval <= 1) return `${head}\n${MSG.spawnerEverySecond}`
    return `${head}\n${seconds === 1 ? MSG.spawnerCountdownOne : fmt(MSG.spawnerCountdown, { seconds })}`
  }

  resourceItem (type: Resource, amount: number): Item {
    const r = this.settings.resources[type]
    return { id: r.item, count: amount, name: `${r.color}${r.name}` }
  }

  // ================================================================= running

  private tickRunning () {
    for (const s of this.spawners) {
      if (this.tick >= s.next) {
        const intervalTicks = this.settings.resources[s.def.type].interval * TICKS_PER_SECOND
        s.next = this.tick + intervalTicks
        // ScreamingBedWars: floor(level) items, one more with probability frac(level) (level 1.67 -> 1.67 per drop)
        const lo = Math.floor(s.def.level)
        const amount = Math.max(1, lo + (this.platform.random() < s.def.level - lo ? 1 : 0))
        // never merging (ScreamingBedWars spawner-disable-merge): a pile stays one entity per drop
        this.platform.dropItem(this.world, s.def.pos, this.resourceItem(s.def.type, amount), { x: 0, y: 0, z: 0 }, false)
      }
      if (s.holo !== null && this.tick % TICKS_PER_SECOND === 0) {
        const left = Math.max(1, Math.ceil((s.next - this.tick) / TICKS_PER_SECOND))
        this.platform.setHologram(this.world, s.holo, this.spawnerText(s.def, left))
      }
    }
    for (const gp of this.players.values()) {
      if (!gp.protectedUntil) continue
      const online = this.platform.isOnline(gp.id) && gp.state === 'playing'
      if (this.tick >= gp.protectedUntil) {
        gp.protectedUntil = 0
        if (online) this.platform.message(gp.id, PREFIX + MSG.respawnProtectionEnd)
      } else if ((gp.protectedUntil - this.tick) % TICKS_PER_SECOND === 0 && online) {
        // ScreamingBedWars counts down every second: "... in 3", "... in 2", "... in 1"
        this.platform.message(gp.id, PREFIX + fmt(MSG.respawnProtection, { time: (gp.protectedUntil - this.tick) / TICKS_PER_SECOND }))
      }
    }
    for (const t of this.teams.values()) {
      if (t.graceUntil !== null && this.tick >= t.graceUntil) {
        t.graceUntil = null
        if (!this.teamAlive(t) && !t.out) { this.eliminate(t); this.checkWin() }
      }
    }
    for (const h of this.hooks) h.onTick(this)
    if (this.tick % TICKS_PER_SECOND === 0) { this.updateGameBoard(); this.updateGameBossbar() }
    const elapsed = (this.tick - this.startedTick) / TICKS_PER_SECOND
    if (elapsed >= this.arena.gameTime) {
      this.broadcast(PREFIX + MSG.gameEndedTooEarly)
      this.end(null)
    }
  }

  teamAlive (t: TeamState): boolean {
    if (t.out) return false
    for (const m of t.members) {
      const gp = this.players.get(m)
      if (gp && gp.state === 'playing' && this.platform.isOnline(m)) return true
    }
    if (t.graceUntil !== null && this.tick < t.graceUntil) return true
    // one-sided game: a team that started without players stays until its bed is gone (a team whose players
    // left is out once its grace period is over)
    return t.startedEmpty && t.members.size === 0 && t.bed && [...this.teams.values()].filter(x => x.members.size > 0).length < 2
  }

  private eliminate (t: TeamState) {
    if (t.out) return
    t.out = true
    this.broadcast(PREFIX + fmt(MSG.teamEliminated, { team: this.teamLabel(t) }))
  }

  checkWin () {
    if (this.phase !== 'running') return
    for (const t of this.teams.values()) if (!t.out && !this.teamAlive(t)) this.eliminate(t)
    const alive = [...this.teams.values()].filter(t => this.teamAlive(t))
    if (alive.length > 1) return
    this.end(alive[0] ?? null)
  }

  end (winner: TeamState | null) {
    if (this.phase !== 'running') return
    this.phase = 'ending'
    this.endTick = this.tick
    const time = clock((this.tick - this.startedTick) / TICKS_PER_SECOND)
    if (winner) this.broadcast(PREFIX + fmt(MSG.teamWin, { team: this.teamLabel(winner), time }))
    for (const p of this.connected()) {
      const won = winner !== null && this.players.get(p)?.team === winner.def.name
      this.platform.title(p, won ? MSG.youWon : MSG.youLost, MSG.gameEnd, 0, 60, 20)
      this.platform.sound(p, won ? 'ui.toast.challenge_complete' : 'entity.wither.death', 1, 1)
    }
    for (const p of this.connected()) this.platform.message(p, PREFIX + MSG.gameEnd)
    if (this.stats) {
      // every player who was in a team this round (also after a final death) played the game
      for (const gp of this.players.values()) if (gp.team) this.stats.result(this.platform.name(gp.id), winner !== null && gp.team === winner.def.name)
      this.stats.save()
    }
    this.updateGameBoard()
    this.updateGameBossbar()
  }

  /**
   * ScreamingBedWars' game bar (bossbar.game, green, 20 segments): the text stays, the bar runs down with the time left
   * until the round is over; in the post-game wait the text is blank and the bar runs down with that wait.
   */
  private updateGameBossbar () {
    const running = this.phase === 'running'
    const total = running ? this.arena.gameTime : this.arena.postGameWaiting
    const since = (this.tick - (running ? this.startedTick : this.endTick)) / TICKS_PER_SECOND
    const progress = total > 0 ? Math.max(0, Math.min(1, (total - since) / total)) : 0
    for (const p of this.connected()) this.platform.setBossbar(p, running ? MSG.bossbarRunning : ' ', progress, 'green')
  }

  private tickEnding () {
    if (this.tick % TICKS_PER_SECOND === 0) this.updateGameBossbar()
    if (this.tick - this.endTick >= this.arena.postGameWaiting * TICKS_PER_SECOND) this.reset()
  }

  /** Puts the arena back to its original state and everybody back into the lobby. */
  reset () {
    for (const h of this.hooks) h.onReset(this)
    for (const k of this.placed) this.platform.setBlock(this.world, unkey(k), 'air')
    for (const t of this.teams.values()) for (const b of t.bedBlocks) this.platform.setBlockState(this.world, b.pos, b.state)
    this.placed.clear()
    this.unbreakable.clear()
    for (const id of [...this.shopkeepers, ...this.entities, ...this.spawners.map(s => s.holo).filter((h): h is number => h !== null)]) this.platform.removeEntity(this.world, id)
    for (const id of this.platform.itemEntities(this.world, this.arena.min, this.arena.max)) this.platform.removeEntity(this.world, id)
    this.shopkeepers = []
    this.entities.clear()
    this.spawners = []
    this.rejoinTeams.clear()
    this.phase = 'waiting'
    this.countdown = this.arena.pauseCountdown
    this.countdownRunning = false
    const everybody = this.connected()
    this.players.clear()
    for (const t of this.teams.values()) { t.members.clear(); t.bed = true; t.out = false; t.graceUntil = null }
    this.lastSidebar = ''
    for (const p of everybody) {
      for (const o of everybody) this.platform.setVisible(p, o, true)
      this.join(p)
    }
    this.updateTeamsBoard()
    this.updateLobbyBoard()
  }

  // ================================================================= ticking

  onTick () {
    this.tick++
    if (this.phase === 'waiting') this.tickLobby()
    else if (this.phase === 'running') this.tickRunning()
    else this.tickEnding()
  }

  // ================================================================= blocks

  inArena (pos: BlockPos) {
    const { min, max } = this.arena
    return pos.x >= min.x && pos.x <= max.x && pos.y >= min.y && pos.y <= max.y && pos.z >= min.z && pos.z <= max.z
  }

  /** Whether the block place is allowed. */
  onBlockPlace (p: PlayerId, pos: BlockPos, block: string): boolean {
    if (!this.isPlaying(p) || !this.inArena(pos)) return false
    this.placed.add(key(pos))
    return true
  }

  /** Whether the block may be broken, and whether it drops its item. */
  onBlockBreak (p: PlayerId, pos: BlockPos, block: string): { allow: boolean, drop: boolean } {
    if (!this.isPlaying(p)) return { allow: false, drop: false }
    const k = key(pos)
    const bedTeam = [...this.teams.values()].find(t => t.bed && t.bedBlocks.some(b => key(b.pos) === k))
    if (bedTeam) {
      if (bedTeam.def.name === this.players.get(p)!.team) {
        this.platform.message(p, PREFIX + MSG.ownBed)
        return { allow: false, drop: false }
      }
      this.destroyBed(bedTeam, p)
      return { allow: true, drop: false }
    }
    if (this.placed.has(k) && !this.unbreakable.has(k)) {
      this.placed.delete(k)
      return { allow: true, drop: true }
    }
    return { allow: false, drop: false }
  }

  destroyBed (t: TeamState, by: PlayerId | null) {
    if (!t.bed) return
    t.bed = false
    if (by && this.stats) { this.stats.bed(this.platform.name(by)); this.stats.save() }
    for (const b of t.bedBlocks) this.platform.setBlock(this.world, b.pos, 'air')
    const text = by ? fmt(MSG.bedDestroyedBy, { team: this.teamLabel(t), player: this.colored(by) }) : fmt(MSG.bedDestroyed, { team: this.teamLabel(t) })
    for (const p of this.connected()) {
      this.platform.message(p, PREFIX + text)
      const victim = this.players.get(p)?.team === t.def.name
      this.platform.title(p, fmt(MSG.bedDestroyed, { team: this.teamLabel(t) }), victim ? MSG.bedDestroyedSubtitleVictim : MSG.bedDestroyedSubtitle, 0, 20, 0)
      this.platform.sound(p, 'entity.ender_dragon.growl', 1, 1)
    }
    this.updateGameBoard()
    this.checkWin()
  }

  // ================================================================= combat, death, respawn

  /** Returns true when the damage must be cancelled. */
  onDamage (victim: PlayerId, attacker: PlayerId | null): boolean {
    const gp = this.players.get(victim)
    if (!gp || this.phase !== 'running' || gp.state !== 'playing' || gp.dead) return true
    if (gp.protectedUntil > this.tick) return true
    if (attacker) {
      const ap = this.players.get(attacker)
      if (!ap || ap.state !== 'playing') return true
      if (!this.settings.friendlyFire && ap.team === gp.team && attacker !== victim) return true
      if (attacker !== victim) gp.lastHit = { by: attacker, tick: this.tick }
    }
    return false
  }

  /** A playing player died (any cause). */
  onDeath (p: PlayerId) {
    const gp = this.players.get(p)
    if (!gp || this.phase !== 'running' || gp.state !== 'playing' || gp.dead) return
    for (const h of this.hooks) h.onPlayerOut(this, p)
    gp.dead = true
    this.platform.closeMenu(p)
    gp.menu = null
    this.platform.clearInventory(p)
    const killer = gp.lastHit && this.tick - gp.lastHit.tick <= KILL_CREDIT_TICKS && this.platform.isOnline(gp.lastHit.by) ? gp.lastHit.by : null
    gp.lastHit = null
    const t = this.teamOf(p)
    const final = !t || !t.bed
    if (this.stats) {
      this.stats.death(this.platform.name(p))
      if (killer) this.stats.kill(this.platform.name(killer))
      this.stats.save()
    }
    // the killer's remaining hearts tell his team mates how dangerous he still is (not shown once he is dead himself)
    const killerGp = killer ? this.players.get(killer) : undefined
    const killerHealth = killer && killerGp?.state === 'playing' && !killerGp.dead ? this.platform.health(killer) : 0
    const text = killer
      ? fmt(MSG.playerKilled, { killer: this.colored(killer), victim: this.colored(p) }) + (killerHealth > 0 ? fmt(MSG.killerHearts, { hearts: hearts(killerHealth) }) : '')
      : fmt(MSG.playerDied, { victim: this.colored(p) })
    this.broadcast(PREFIX + text + (final ? MSG.finalKill : ''))
    if (killer) this.platform.sound(killer, 'entity.player.levelup', 1, 1)
    if (final) {
      gp.state = 'spectator'
      if (t) t.members.delete(p)
      this.updateGameBoard()
      this.checkWin()
    }
  }

  /** Where a respawning player of this arena appears. */
  respawnLocation (p: PlayerId): Location {
    const gp = this.players.get(p)
    if (!gp || this.phase === 'waiting') return this.arena.lobbySpawn
    if (gp.state === 'playing') return this.teamOf(p)?.def.spawn ?? this.arena.specSpawn
    return this.arena.specSpawn
  }

  /** Called right after the respawn: equips the player for the game again. */
  afterRespawn (p: PlayerId) {
    const gp = this.players.get(p)
    if (!gp) return
    if (this.phase === 'waiting') { this.toLobby(p); return }
    if (gp.state === 'playing' && this.phase === 'running') this.spawnInGame(p)
    else this.makeSpectator(p)
  }

  makeSpectator (p: PlayerId) {
    const gp = this.players.get(p)
    if (!gp) return
    gp.state = 'spectator'
    gp.dead = false
    this.platform.closeMenu(p)
    gp.menu = null
    this.platform.clearInventory(p)
    this.platform.resetState(p)
    this.platform.setGamemode(p, 'spectator')
    this.platform.teleport(p, this.arena.specSpawn)
    this.updateGameBossbar()
    this.updateGameBoard()
  }

  /** Void: below the map players die (playing) or go back to the lobby. */
  onMove (p: PlayerId, to: Vec3) {
    const limit = this.settings.voidKill[this.world]
    if (limit === undefined || to.y >= limit) return
    const gp = this.players.get(p)
    if (!gp) return
    if (this.isPlaying(p) && !gp.dead) this.platform.kill(p)
    else if (gp.state === 'lobby' || this.phase !== 'running') this.platform.teleport(p, this.arena.lobbySpawn)
    else if (gp.state === 'spectator') this.platform.teleport(p, this.arena.specSpawn)
  }

  // ================================================================= chat

  /** Formats and delivers a chat message; returns true (the vanilla message is cancelled). */
  onChat (p: PlayerId, message: string): boolean {
    const gp = this.players.get(p)
    if (!gp) return false
    const name = `<${this.colored(p)}§r> `
    if (this.phase === 'running' && gp.state === 'playing') {
      const t = this.teamOf(p)!
      if (message.startsWith(this.settings.allChatPrefix)) {
        this.broadcast(`§7[ALL] §r${name}${message.slice(this.settings.allChatPrefix.length).trim()}`)
      } else {
        this.send([...t.members].filter(m => this.platform.isOnline(m)), `§7[TEAM] §r${name}${message}`)
      }
      return true
    }
    if (this.phase === 'running' && gp.state === 'spectator') {
      this.send(this.connected().filter(o => this.players.get(o)!.state === 'spectator'), `§7[SPEC] §r${name}${message}`)
      return true
    }
    this.broadcast(name + message)
    return true
  }

  // ================================================================= menus

  openShop (p: PlayerId, page: ShopPage = { kind: 'main' }) {
    if (!this.isPlaying(p)) return
    const t = this.teamOf(p)
    // (opening a menu over another one fires the close event of the old one: set the state afterwards)
    this.platform.openMenu(p, { id: `shop:${this.name}`, title: pageTitle(this.shop, page), rows: SHOP_ROWS, slots: renderPage(this.shop, page, this.settings, t?.def.color ?? null) })
    this.players.get(p)!.menu = { kind: 'shop', page }
  }

  openTeamChest (p: PlayerId) {
    const t = this.teamOf(p)
    if (!t || !this.isPlaying(p)) return
    this.platform.openMenu(p, { id: `teamchest:${this.name}:${t.def.name}`, title: MSG.teamChest, rows: 3, slots: t.chest, storage: true })
    this.players.get(p)!.menu = { kind: 'teamchest', team: t.def.name }
  }

  /**
   * A click in an open game menu. `slot` is the raw window slot (top menu first, then the player
   * inventory). Returns true when the click must be cancelled.
   */
  onMenuClick (p: PlayerId, slot: number, click: string, hotbar: number): boolean {
    const gp = this.players.get(p)
    const menu = gp?.menu
    if (!gp || !menu) return false
    if (menu.kind === 'teamchest') return false
    if (menu.kind === 'teams') {
      const t = [...this.teams.values()][slot]
      if (t && slot >= 0) {
        this.selectTeam(p, t.def.name)
        this.platform.closeMenu(p)
        gp.menu = null
      }
      return true
    }
    // shop
    const topSize = SHOP_ROWS * 9
    if (slot >= topSize || slot < 0) {
      // the player's own inventory: sorting with clicks and number keys is fine, shift/double click
      // would move items into the shop
      return !(click === 'left' || click === 'right' || click === 'number-key')
    }
    const action = actionAt(this.shop, menu.page, slot)
    if (action.kind === 'page') this.openShop(p, action.page)
    else if (action.kind === 'buy') {
      const mode: BuyMode = click === 'number-key' && this.settings.hotbarBuy && hotbar >= 0 && hotbar <= 8
        ? { kind: 'hotbar', slot: hotbar }
        : click === 'shift-left' || click === 'shift-right' ? { kind: 'max' } : { kind: 'once' }
      this.purchase(p, action.item, mode)
    }
    return true
  }

  private readInventory (p: PlayerId): Slot[] {
    const inv = emptyInventory()
    for (let i = 0; i < inv.length; i++) inv[i] = this.platform.getSlot(p, i)
    return inv
  }

  purchase (p: PlayerId, item: import('./config.ts').ShopItem, mode: BuyMode) {
    const inv = this.readInventory(p)
    const t = this.teamOf(p)
    const r = buy(inv, item, mode, this.settings, t?.def.color ?? null, this.platform.selectedSlot(p))
    if (!r.ok) {
      this.platform.message(p, PREFIX + r.message)
      this.platform.sound(p, 'entity.villager.no', 1, 1)
      this.platform.syncInventory(p)
      return
    }
    for (const s of r.changed) this.platform.setSlot(p, s, inv[s])
    if (r.displaced) this.platform.dropItem(this.world, this.platform.location(p), r.displaced, null)
    this.platform.message(p, PREFIX + r.message)
    this.platform.sound(p, 'entity.item.pickup', 1, 1)
  }

  onMenuClose (p: PlayerId) {
    const gp = this.players.get(p)
    if (!gp) return
    if (gp.menu?.kind === 'teamchest') {
      const t = this.teams.get(gp.menu.team)
      if (t) t.chest = this.platform.menuSlots(`teamchest:${this.name}:${t.def.name}`).map(s => s && copy(s))
    }
    gp.menu = null
  }

  /** Gives resources (admin /bw cheat give). */
  giveResource (p: PlayerId, type: Resource, amount: number) {
    const inv = this.readInventory(p)
    const r = add(inv, this.resourceItem(type, amount), this.platform.selectedSlot(p))
    for (const s of r.changed) this.platform.setSlot(p, s, inv[s])
    if (r.leftover > 0) this.platform.dropItem(this.world, this.platform.location(p), this.resourceItem(type, r.leftover), null)
  }

  // ================================================================= scoreboards

  updateTeamsBoard () {
    this.platform.setTeams(this.world, [...this.teams.values()].map(t => ({
      name: t.def.name,
      color: t.def.color.code,
      members: [...t.members].filter(m => this.platform.isOnline(m)).map(m => this.platform.name(m))
    })))
  }

  updateLobbyBoard () {
    if (this.phase !== 'waiting') return
    this.setSidebar('§e§lBEDWARS', [
      ' ',
      `§fMap: §2${this.name}`,
      `§fPlayers: §2${this.inLobby().length}§f/§2${this.maxPlayers}`,
      '  ',
      '§fWaiting ...',
      '   '
    ])
  }

  updateGameBoard () {
    if (this.phase === 'waiting') return
    const left = this.arena.gameTime - (this.tick - this.startedTick) / TICKS_PER_SECOND
    // ScreamingBedWars: one line per team still in the game, "%bed%%color%%team%", the score is its player count
    const teams = [...this.teams.values()].filter(t => !t.out)
    const lines = teams.map(t => `${t.bed ? '§a✔' : '§c✘'}${this.teamLabel(t)}`)
    const scores = teams.map(t => [...t.members].filter(m => this.players.get(m)?.state === 'playing' && this.platform.isOnline(m)).length)
    this.setSidebar(`§a${this.name}§r - ${clock(left)}`, lines, scores)
  }

  private setSidebar (title: string, lines: string[], scores?: number[]) {
    const signature = title + '\n' + lines.join('\n') + '\n' + (scores ?? []).join(',')
    if (signature === this.lastSidebar) return
    this.lastSidebar = signature
    this.platform.setSidebar(this.world, title, lines, scores)
  }

  /** Human readable state for /bw info and the tests. */
  describe (): string {
    const teams = [...this.teams.values()].map(t => `${t.def.name}(${[...t.members].map(m => plain(this.platform.name(m))).join(',')}${t.bed ? '' : ' no bed'}${t.out ? ' out' : ''})`)
    return `${this.name}: ${this.phase} countdown=${this.countdown} players=${this.connected().length} teams=${teams.join(' ')}`
  }
}
