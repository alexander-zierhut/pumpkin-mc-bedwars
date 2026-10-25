// Player-visible messages (English; the wording follows the ScreamingBedWars language file the Paper server used, translated).

export const PREFIX = '§6[BW]§r '

/** Fills `%key%` placeholders. */
export function fmt (template: string, values: Record<string, string | number>): string {
  return template.replace(/%([a-z_]+)%/gi, (m, k) => (k in values ? String(values[k]) : m))
}

export const MSG = {
  join: '%name% §ajoined the game!§r §7[§a%players%§7/§a%maxplayers%§7]',
  leave: '%name% §cleft the game!',
  gameAlreadyRunning: '§cGame §7%arena% §cis already running!',
  gameFull: '§cGame §7%arena% §cis full!',
  teamSelected: '§aSelected team: %team%§r §7[§a%players%§7/§a%maxplayers%§7]',
  teamAlreadySelected: '§aYou are already in team: %team%§r §7[§a%players%§7/§a%maxplayers%§7]',
  teamIsFull: '§cTeam %team%§c is full!',
  teamSelectionTitle: 'Select Team - %arena%',
  teamSelectItem: '%team% §7(§e%in% §f/ §e%max%§7)',
  teamSelectLoreJoin: '§fClick to join the team!',
  teamSelectLoreFull: '§cTeam is full!',
  selectorItem: '§aSelect your team',
  leaveItem: '§cLeave game',
  startItem: '§2Start game',
  countdown: '§eThe game starts in §c%seconds% §eseconds!',
  countdownOne: '§eThe game starts in §c1 §esecond!',
  bossbarWaiting: '§cThe game begins shortly!',
  bossbarRunning: '§aGame in progress, good luck!',
  gameStartTitle: '§aGame started!',
  gameStartSubtitle: '§aGame §7%arena%§a has started! Have fun!',
  bedDestroyed: 'The bed of team %team%§r was destroyed!',
  bedDestroyedBy: 'The bed of team %team%§r was destroyed by %player%§r!',
  bedDestroyedSubtitle: 'The players of this team can no longer respawn!',
  bedDestroyedSubtitleVictim: 'You will no longer respawn!',
  ownBed: '§cYou cannot destroy your own bed!',
  respawnProtection: '§aRespawn protection ends in §f%time%s§a!',
  respawnProtectionEnd: '§cRespawn protection is over!',
  buySuccess: '§aYou purchased §7%item% §afor §7%material%§a!',
  buyFailed: '§cYou do not have enough resources to buy §7%item%§c! You need §7%material%§c!',
  inventoryFull: '§cYour inventory is full!',
  shopTitle: 'Shop',
  shopBack: '§cBack to categories',
  quickBuy: '§eQuick Buy',
  youWon: '§aYour team won!',
  youLost: '§cYour team lost!',
  teamWin: '§aTeam §r%team%§a won the game in §7%time%',
  gameEnd: '§cGame over! Thanks for playing!',
  gameEndedTooEarly: '§cThe game ended early. Nobody wins.',
  playerKilled: '%victim% §7was killed by %killer%§7!',
  killerHearts: ' §7(§c❤ %hearts%§7)',
  playerDied: '%victim% §7died!',
  finalKill: ' §c§lFINAL KILL',
  teamEliminated: 'Team %team%§7 has been eliminated.',
  teamChest: '§a§lTeam Chest',
  teamChestNotYours: '§eThis team chest does not belong to you!',
  teamChestPlaced: '§aNew team chest placed!',
  teamChestBroken: '§cYour team chest was destroyed!',
  rejoinedTeam: 'Welcome back to team %team%§7!',
  mateRejoined: '%player%§7 is back in the game.',
  lostConnection: '%player%§7 lost connection. Team %team%§7 stays in the game for §e%seconds%§7 seconds.',
  spawnerCountdown: '§e%seconds% §bseconds',
  spawnerCountdownOne: '§e1 §bsecond',
  spawnerEverySecond: '§bevery second',
  notInLobby: '§cTeams can only be set in the lobby before the start.',
  needTwoPlayers: '§cAt least 2 players are needed in the lobby to start.',
  alreadyRunning: '§cThe game on %arena% is already running or is being reset.',
  starting: '§aThe game on §e%arena%§a is starting!',
  nextMap: '§7Next map: §e%arena%',
  activeMap: '§7Active map: §e%arena%',
  maps: '§7Maps: §f%maps%§7  (/map <name>)',
  unknownMap: '§cUnknown map. Maps: %maps%',
  autoJoinOn: '§aAuto-join enabled.',
  autoJoinOff: '§eAuto-join disabled. Use /bw leave to leave the arena, /autojoin turns it back on.',
  arenaList: '§7Available arenas:',
  spectating: '§7You are spectating. The next game starts when this one ends.'
} as const

/** Removes § colour codes. */
export function plain (text: string): string {
  return text.replace(/§[0-9a-fk-or]/gi, '')
}

/** Health points (2 per heart) as hearts rounded to half hearts with a decimal point: 13 -> `6.5`, 20 -> `10`. */
export function hearts (health: number): string {
  const half = Math.max(health > 0 ? 1 : 0, Math.round(health))
  return half % 2 === 0 ? String(half / 2) : `${Math.floor(half / 2)}.5`
}

/** mm:ss */
export function clock (seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
