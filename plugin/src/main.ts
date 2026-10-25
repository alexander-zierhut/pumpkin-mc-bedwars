// LAN BedWars for Pumpkin: plugin entry point. Wires server events and commands to BedWars.
import { Plugin, registerPlugin } from './pumpkin.ts'
import type { Context } from 'pumpkin:plugin/context@0.1.0'
import type { PluginMetadata } from 'pumpkin:plugin/metadata@0.1.0'
import { Command, CommandNode, type CommandSender, type ConsumedArgs } from 'pumpkin:plugin/command@0.1.0'
import * as logging from 'pumpkin:plugin/logging@0.1.0'
import { TextComponent } from 'pumpkin:plugin/text@0.1.0'
import { BedWars, type CommandResult } from './bedwars.ts'
import { parseArena, parseSettings, parseShop } from './config.ts'
import { PumpkinPlatform } from './pumpkin-platform.ts'
import settingsYml from '../../config/bedwars.yml'
import shopYml from '../../config/shop.yml'
import rushYml from '../../config/arena-rush.yml'
import mushroomYml from '../../config/arena-mushroom.yml'
import mansionYml from '../../config/arena-mansion.yml'

const ARENA_FILES: Record<string, string> = { rush: rushYml, mushroom: mushroomYml, mansion: mansionYml }
const PERM_PLAYER = 'lan-bedwars:player'
const PERM_ADMIN = 'lan-bedwars:admin'

let bw: BedWars | null = null
let platform: PumpkinPlatform | null = null

function log (m: string) { logging.log('info', `[BedWars] ${m}`) }

/** Runs an event handler; a bug in one handler must not take the plugin down. */
function guard<T> (what: string, fallback: T, f: () => T): T {
  try { return f() } catch (e) {
    logging.log('error', `[BedWars] ${what}: ${e instanceof Error ? `${e.message}\n${e.stack}` : String(e)}`)
    return fallback
  }
}

function reply (sender: CommandSender, r: CommandResult) {
  for (const line of r.lines) sender.sendMessage(TextComponent.fromLegacyString(line))
}

function argString (args: ConsumedArgs, name: string): string {
  try {
    const v = args.getValue(name) as { tag: string, val?: unknown }
    return v && typeof v.val === 'string' ? v.val : ''
  } catch { return '' }
}

class LanBedWars extends Plugin {
  metadata (): PluginMetadata {
    return {
      name: 'lan-bedwars',
      version: '1.0.0',
      authors: ['zierhut'],
      description: 'Rewinside-style BedWars for LAN parties (TypeScript)',
      dependencies: [],
      permissions: ['fs.write.data']
    }
  }

  onLoad (ctx: Context): void {
    super.onLoad(ctx)
    const server = ctx.getServer()
    const settings = parseSettings(settingsYml)
    const arenas = settings.arenas.map(n => {
      const text = ARENA_FILES[n]
      if (!text) throw new Error(`arena file arena-${n}.yml is not built into the plugin`)
      return parseArena(text)
    })
    const shop = parseShop(shopYml)
    platform = new PumpkinPlatform(server)
    // more arenas from the data folder (plugins/data/lan-bedwars/arenas/*.yml, like ScreamingBedWars' arenas folder);
    // one with the name of a built-in arena replaces it
    for (const file of platform.listData('arenas').filter(f => f.endsWith('.yml'))) {
      guard(`arena file ${file}`, undefined, () => {
        const a = parseArena(platform!.readData(`arenas/${file}`) ?? '')
        const i = arenas.findIndex(b => b.name.toLowerCase() === a.name.toLowerCase())
        if (i >= 0) arenas[i] = a; else arenas.push(a)
        log(`Arena ${a.name} read from data/arenas/${file}`)
      })
    }
    // extra map worlds (the main world is loaded by the server)
    for (const a of arenas) {
      if (!server.getWorldByName(a.world) && !server.getAllWorlds().some(w => w.getName() === a.world)) {
        platform.worlds.set(a.world, server.createWorld(a.world, 'overworld'))
        log(`Loaded map world ${a.world}`)
      }
    }
    for (const w of server.getAllWorlds()) guard('world rules', undefined, () => prepareWorld(w))
    // pumpkin.toml's default_difficulty is not applied; the map's level.dat would win (Rush: peaceful)
    guard('difficulty', undefined, () => server.runCommand('difficulty normal'))
    bw = new BedWars(platform, settings, arenas, shop)
    for (const g of bw.games.values()) {
      guard(`arena ${g.name}`, undefined, () => g.prepare())
      log(`Arena ${g.name} loaded`)
    }
    log(`active arena: ${bw.active}`)

    ctx.registerPermission({ node: PERM_PLAYER, description: 'BedWars player commands', default: { tag: 'allow' }, children: [] })
    ctx.registerPermission({ node: PERM_ADMIN, description: 'BedWars admin commands', default: { tag: 'op', val: 'two' }, children: [] })
    this.registerEvents(ctx)
    this.registerCommands(ctx)
    this.scheduleRepeatingTask(1, 1, () => guard('tick', undefined, () => bw!.onTick()))
  }

  private registerEvents (ctx: Context) {
    const P = platform!
    this.registerEvent(ctx, 'player-join-event', (_s, e) => {
      guard('join', undefined, () => { const id = P.addPlayer(e.player); bw!.onJoin(id) })
      return e
    })
    this.registerEvent(ctx, 'player-leave-event', (_s, e) => {
      guard('leave', undefined, () => { const id = P.idOf(e.player); bw!.onQuit(id); P.removePlayer(id) })
      return e
    })
    this.registerEvent(ctx, 'player-spawn-location-event', (_s, e) => {
      guard('spawn location', undefined, () => {
        const id = P.idOf(e.player)
        const l = P.uuids.has(id) ? bw!.respawnLocation(id) : bw!.spawnLocation()
        e.spawnPos = [l.x, l.y, l.z]
      })
      return e
    })
    this.registerEvent(ctx, 'player-respawn-event', (_s, e) => {
      guard('respawn', undefined, () => bw!.afterRespawn(P.idOf(e.player)))
      return e
    })
    this.registerEvent(ctx, 'player-death-event', (_s, e) => {
      guard('death', undefined, () => {
        e.keepInventory = true // BedWars: nothing drops, the game clears the inventory
        e.droppedExp = 0
        e.deathMessage = TextComponent.text('')
        bw!.onDeath(P.idOf(e.player))
      })
      return e
    })
    // non-blocking: the handler never changes the move (void kill and teleport cancel act afterwards), and a blocking
    // handler held the tick thread for one guest call per move packet
    this.registerEvent(ctx, 'player-move-event', (_s, e) => {
      guard('move', undefined, () => {
        const [x, y, z] = e.toPosition
        bw!.onMove(P.idOf(e.player), { x, y, z })
      })
      return e
    }, 'normal', false)
    this.registerEvent(ctx, 'entity-damage-by-entity-event', (_s, e) => {
      guard('damage by entity', undefined, () => {
        const victim = P.playerByEntity(e.entityId)
        const attacker = P.playerByEntity(e.damagerId)
        if (victim) { if (bw!.onPlayerDamage(victim, attacker)) e.cancelled = true } else if (bw!.onEntityDamage(e.entityId, attacker, e.cause, true)) e.cancelled = true
      })
      return e
    })
    this.registerEvent(ctx, 'entity-damage-event', (_s, e) => {
      guard('damage', undefined, () => {
        const victim = P.playerByEntity(e.entityId)
        const cause = JSON.stringify(e.damageType)
        if (victim) {
          // void/kill damage always goes through, everything else follows the game rules
          if (!/out[-_]of[-_]world|generic[-_]kill|outside[-_]border/.test(cause) && bw!.onPlayerDamage(victim, null)) e.cancelled = true
        } else if (bw!.onEntityDamage(e.entityId, null, cause)) e.cancelled = true
      })
      return e
    })
    this.registerEvent(ctx, 'entity-death-event', (_s, e) => { guard('entity death', undefined, () => bw!.onEntityDeath(e.entityId)); return e })
    this.registerEvent(ctx, 'block-place-event', (_s, e) => {
      guard('place', undefined, () => {
        const block = e.blockPlaced.replace(/^minecraft:/, '').toLowerCase()
        if (!bw!.onBlockPlace(P.idOf(e.player), e.blockPos, block)) e.cancelled = true
      })
      return e
    })
    this.registerEvent(ctx, 'block-break-event', (_s, e) => {
      guard('break', undefined, () => {
        if (!e.player) return
        const r = bw!.onBlockBreak(P.idOf(e.player), e.blockPos, e.block.replace(/^minecraft:/, '').toLowerCase())
        if (!r.allow) e.cancelled = true
        e.shouldDrop = r.drop
      })
      return e
    })
    this.registerEvent(ctx, 'player-interact-event', (_s, e) => {
      guard('interact', undefined, () => {
        const id = P.idOf(e.player)
        const right = e.action === 'right-click-air' || e.action === 'right-click-block'
        const held = P.toItem(e.player.getItemInHand('right'))
        const block = e.action.endsWith('block') && e.clickedPos ? e.clickedPos : null
        const name = block ? e.block.replace(/^minecraft:/, '').toLowerCase() : null
        if (bw!.onUse(id, held, right ? 'right' : 'left', block, name, block ? { x: 0, y: 1, z: 0 } : null)) e.cancelled = true
      })
      return e
    })
    this.registerEvent(ctx, 'player-interact-entity-event', (_s, e) => {
      guard('interact entity', undefined, () => {
        if (e.action === 'attack') return
        if (bw!.onInteractEntity(P.idOf(e.player), e.entityId)) e.cancelled = true
      })
      return e
    })
    this.registerEvent(ctx, 'inventory-click-event', (_s, e) => {
      guard('click', undefined, () => {
        if (!e.windowType) return
        if (bw!.onMenuClick(P.idOf(e.player), e.rawSlot, e.clickType, e.hotbarButton)) e.cancelled = true
      })
      return e
    })
    this.registerEvent(ctx, 'inventory-close-event', (_s, e) => { guard('close', undefined, () => bw!.onMenuClose(P.idOf(e.player))); return e })
    this.registerEvent(ctx, 'player-chat-event', (_s, e) => {
      guard('chat', undefined, () => { if (bw!.onChat(P.idOf(e.player), e.message)) e.cancelled = true })
      return e
    })
    this.registerEvent(ctx, 'player-drop-item-event', (_s, e) => {
      guard('drop', undefined, () => { if (bw!.onDrop(P.idOf(e.player))) e.cancelled = true })
      return e
    })
    // every bow of the shop has Infinity, so a shot arrow is never picked up again (also if the server rule is off)
    this.registerEvent(ctx, 'player-pickup-arrow-event', (_s, e) => {
      guard('pickup arrow', undefined, () => { if (bw!.onPickupArrow(P.idOf(e.player))) e.cancelled = true })
      return e
    })
    this.registerEvent(ctx, 'player-swap-hands-event', (_s, e) => { e.cancelled = true; return e }) // 1.8: no off hand
    this.registerEvent(ctx, 'entity-explode-event', (_s, e) => {
      guard('explosion', undefined, () => { const [x, y, z] = e.position; if (bw!.onVanillaExplosion(e.worldName, e.entityId, { x, y, z }, e.yieldRate)) e.cancelled = true })
      return e
    })
  }

  private registerCommands (ctx: Context) {
    const P = platform!
    const senderId = (s: CommandSender) => (s.asPlayer() ? P.idOf(s.asPlayer()!) : null)
    const isAdmin = (s: CommandSender) => s.isConsole() || (s.asPlayer() ? P.isOp(P.idOf(s.asPlayer()!)) : true)

    const simple = (names: string[], description: string, perm: string, run: (s: CommandSender, args: string[]) => CommandResult) => {
      const cmd = new Command(names, description)
      const rest = CommandNode.argument('args', { tag: 'string', val: 'greedy' })
      this.attach(rest, (s, a) => run(s, argString(a, 'args').split(/\s+/).filter(Boolean)))
      cmd.then(rest)
      this.registerCommand(ctx, cmd, (s) => { guard(names[0], undefined, () => reply(s, run(s, []))); return 1 }, perm)
    }

    simple(['start'], 'Startet die Runde (Admin)', PERM_ADMIN, () => bw!.cmdStart())
    simple(['setteam'], 'Setzt das Team eines Spielers (Admin)', PERM_ADMIN, (_s, a) => bw!.cmdSetTeam(a))
    simple(['map'], 'Zeigt oder wechselt die Map (Admin)', PERM_ADMIN, (_s, a) => bw!.cmdMap(a))
    simple(['bwconfig'], 'Ändert Einstellungen zur Laufzeit (Admin)', PERM_ADMIN, (_s, a) => bw!.cmdConfig(a))
    simple(['autojoin'], 'Auto-Join an/aus', PERM_PLAYER, (s) => { const id = senderId(s); return id ? bw!.cmdAutoJoin(id) : { lines: ['Nur für Spieler.'] } })
    simple(['bw', 'bedwars'], 'BedWars', PERM_PLAYER, (s, a) => bw!.cmdBw(senderId(s), a, isAdmin(s)))
  }

  /** Executes the handler for a node that consumed arguments. */
  private attach (node: CommandNode, run: (s: CommandSender, a: ConsumedArgs) => CommandResult) {
    this.registerCommandNode(node, (s, _srv, a: ConsumedArgs) => { guard('command', undefined, () => reply(s, run(s, a))); return 1 })
  }
}

function prepareWorld (w: import('pumpkin:plugin/world@0.1.0').World) {
  const rules: [string, unknown][] = [
    ['show-advancement-messages', { tag: 'bool', val: false }],
    ['show-death-messages', { tag: 'bool', val: false }],
    ['keep-inventory', { tag: 'bool', val: true }],
    ['immediate-respawn', { tag: 'bool', val: true }],
    ['spawn-mobs', { tag: 'bool', val: false }],
    ['advance-time', { tag: 'bool', val: false }],
    ['advance-weather', { tag: 'bool', val: false }],
    ['fall-damage', { tag: 'bool', val: true }]
  ]
  for (const [rule, value] of rules) guard(`gamerule ${rule}`, undefined, () => w.setGameRule(rule as never, value as never))
  w.setTimeOfDay(6000 as never)
  w.setRaining(false)
  w.setThundering(false)
}

registerPlugin(new LanBedWars())
export * from './pumpkin.ts'
