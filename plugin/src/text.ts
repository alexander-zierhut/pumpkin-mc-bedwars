// Messages (German, wording from the ScreamingBedWars language file the Paper server used).

export const PREFIX = '§6[BW]§r '

/** Fills `%key%` placeholders. */
export function fmt (template: string, values: Record<string, string | number>): string {
  return template.replace(/%([a-z_]+)%/gi, (m, k) => (k in values ? String(values[k]) : m))
}

export const MSG = {
  join: '%name% §atritt dem Spiel bei!§r §7[§a%players%§7/§a%maxplayers%§7]',
  leave: '%name% §chat das Spiel verlassen!',
  gameAlreadyRunning: '§cSpiel §7%arena% §cläuft bereits!',
  teamSelected: '§aAusgewähltes Team: %team%§r §7[§a%players%§7/§a%maxplayers%§7]',
  teamAlreadySelected: '§aDu bist bereits in Team: %team%§r §7[§a%players%§7/§a%maxplayers%§7]',
  teamIsFull: '§cTeam %team%§c ist voll!',
  teamSelectionTitle: 'Team wählen - %arena%',
  teamSelectItem: '%team% §7(§e%in% §f/ §e%max%§7)',
  teamSelectLoreJoin: '§fKlicke um dem Team beizutreten!',
  teamSelectLoreFull: '§cTeam ist voll!',
  selectorItem: '§aWähle dein Team',
  leaveItem: '§cSpiel verlassen',
  startItem: '§2Spiel starten',
  countdown: '§eDas Spiel startet in §c%seconds% §eSekunden!',
  bossbarWaiting: '§cDas Spiel beginnt in Kürze!',
  bossbarRunning: '§aSpiel läuft, viel Glück!',
  gameStartTitle: '§aSpiel hat begonnen!',
  gameStartSubtitle: '§aSpiel §7%arena%§a hat begonnen! Viel Spaß!',
  bedDestroyed: 'Das Bett von Team %team%§r wurde zerstört!',
  bedDestroyedBy: 'Das Bett von Team %team%§r wurde von %player%§r zerstört!',
  bedDestroyedSubtitle: 'Die Spieler des Teams können nicht mehr respawnen!',
  bedDestroyedSubtitleVictim: 'Jetzt wirst du nie wieder vertrieben werden!',
  ownBed: '§cDu kannst dein eigenes Bett nicht zerstören!',
  respawnProtection: '§aRespawn Schutz wird in §f%time% §aweg sein!',
  respawnProtectionEnd: '§cRespawn Schutz ist weg!',
  buySuccess: '§7%item% §awurde für §7%material%§a gekauft!',
  buyFailed: '§cDu hast nicht genug Ressourcen, um §7%item% §czu kaufen! Du brauchst §7%material%§c!',
  inventoryFull: '§cDein Inventar ist voll!',
  shopTitle: 'Shop',
  shopBack: '§cZurück zu den Kategorien',
  quickBuy: '§eSchnellkauf',
  youWon: '§aDein Team hat gewonnen!',
  youLost: '§cDein Team hat verloren!',
  teamWin: '§aDas Team §r%team%§a hat das Spiel in §7%time% §agewonnen',
  gameEnd: '§cSpiel vorbei! Danke fürs Spielen!',
  gameEndedTooEarly: '§cDas Spiel endet vorzeitig. Keiner gewinnt.',
  playerKilled: '%victim% §7wurde von %killer% §7getötet!',
  killerHearts: ' §7(§c❤ %hearts%§7)',
  playerDied: '%victim% §7ist gestorben!',
  finalKill: ' §c§lFINALER KILL',
  teamEliminated: 'Team %team%§7 ist ausgeschieden.',
  teamChest: '§a§lTeamtruhe',
  teamChestNotYours: '§eDiese Teamtruhe gehört dir nicht!',
  teamChestPlaced: '§aNeue Teamtruhe wurde platziert!',
  teamChestBroken: '§cDeine Teamtruhe wurde zerstört!',
  rejoinedTeam: 'Willkommen zurück in Team %team%§7!',
  mateRejoined: '%player%§7 ist wieder im Spiel.',
  lostConnection: '%player%§7 hat die Verbindung verloren. Team %team%§7 bleibt §e%seconds%§7 Sekunden im Spiel.',
  spawnerCountdown: '§e%seconds% §bSekunden',
  spawnerCountdownOne: '§e1 §bSekunde',
  spawnerEverySecond: '§bjede Sekunde',
  notInLobby: '§cTeams lassen sich nur in der Lobby vor dem Start setzen.',
  needTwoPlayers: '§cZum Starten braucht es mindestens 2 Spieler in der Lobby.',
  alreadyRunning: '§cDie Runde auf %arena% läuft schon oder wird gerade zurückgesetzt.',
  starting: '§aDie Runde auf §e%arena%§a startet!',
  nextMap: '§7Nächste Map: §e%arena%',
  activeMap: '§7Aktive Map: §e%arena%',
  maps: '§7Maps: §f%maps%§7  (/map <Name>)',
  unknownMap: '§cUnbekannte Map. Maps: %maps%',
  autoJoinOn: '§aAuto-Join aktiviert.',
  autoJoinOff: '§eAuto-Join deaktiviert. Mit /bw leave verlässt du die Arena, /autojoin schaltet es wieder ein.',
  arenaList: '§7Verfügbare Arenen:',
  spectating: '§7Du schaust zu. Die nächste Runde startet nach dem Ende dieser Runde.'
} as const

/** Removes § colour codes. */
export function plain (text: string): string {
  return text.replace(/§[0-9a-fk-or]/gi, '')
}

/** Health points (2 per heart) as hearts rounded to half hearts with a German decimal comma: 13 -> `6,5`, 20 -> `10`. */
export function hearts (health: number): string {
  const half = Math.max(health > 0 ? 1 : 0, Math.round(health))
  return half % 2 === 0 ? String(half / 2) : `${Math.floor(half / 2)},5`
}

/** mm:ss */
export function clock (seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
