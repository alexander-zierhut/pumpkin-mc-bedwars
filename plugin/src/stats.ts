// Player statistics like ScreamingBedWars (statistics.type: yaml): kills, deaths, wins, losses, games, destroyed
// beds and a score, kept in the plugin data folder (data/stats.yml) by player name.
import { parse, stringify } from 'yaml'
import type { Platform } from './platform.ts'

export interface PlayerStats { kills: number, deaths: number, wins: number, losses: number, games: number, beds: number }

/** ScreamingBedWars statistics.scores of the shipped config (kill 10, win 50, bed-destroy 25, the rest 0). */
const SCORE = { kill: 10, win: 50, bed: 25 }
const FILE = 'stats.yml'

const empty = (): PlayerStats => ({ kills: 0, deaths: 0, wins: 0, losses: 0, games: 0, beds: 0 })

export class Stats {
  private all: Record<string, PlayerStats> = {}

  constructor (private readonly platform: Platform) {
    try {
      const doc = parse(platform.readData(FILE) ?? '') as Record<string, Partial<PlayerStats>> | null
      for (const [name, s] of Object.entries(doc ?? {})) this.all[name] = { ...empty(), ...s }
    } catch { /* unreadable: start empty */ }
  }

  get (name: string): PlayerStats { return this.all[name] ?? empty() }
  score (s: PlayerStats): number { return s.kills * SCORE.kill + s.wins * SCORE.win + s.beds * SCORE.bed }

  private change (name: string, f: (s: PlayerStats) => void) {
    const s = (this.all[name] = this.all[name] ?? empty())
    f(s)
  }

  kill (name: string) { this.change(name, s => { s.kills++ }) }
  death (name: string) { this.change(name, s => { s.deaths++ }) }
  bed (name: string) { this.change(name, s => { s.beds++ }) }
  result (name: string, won: boolean) { this.change(name, s => { s.games++; if (won) s.wins++; else s.losses++ }) }

  save () { this.platform.writeData(FILE, stringify(this.all)) }

  /** The `/bw stats` answer (German, like the ScreamingBedWars language file). */
  lines (name: string): string[] {
    const s = this.get(name)
    const kd = s.deaths === 0 ? s.kills : s.kills / s.deaths
    return [
      `Statistiken von Spieler ${name}:`,
      `§7Kills: §f${s.kills}`,
      `§7Tode: §f${s.deaths}`,
      `§7K/D: §f${kd.toFixed(1)}`,
      `§7Siege: §f${s.wins}`,
      `§7Niederlagen: §f${s.losses}`,
      `§7Spiele: §f${s.games}`,
      `§7Zerstörte Betten: §f${s.beds}`,
      `§7Punkte: §f${this.score(s)}`
    ]
  }
}
