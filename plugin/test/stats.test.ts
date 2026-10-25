import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Stats } from '../src/stats.ts'
import type { Platform } from '../src/platform.ts'

/** Just the data folder of a platform, in memory. */
function dataOnly (files: Record<string, string> = {}) {
  return { files, readData: (p: string) => files[p] ?? null, writeData: (p: string, t: string) => { files[p] = t; return true } } as unknown as Platform & { files: Record<string, string> }
}

test('kills, deaths, beds and results add up to the ScreamingBedWars score', () => {
  const p = dataOnly()
  const s = new Stats(p)
  s.kill('Alex'); s.kill('Alex'); s.death('Alex'); s.bed('Alex'); s.result('Alex', true); s.result('Alex', false)
  const a = s.get('Alex')
  assert.deepEqual(a, { kills: 2, deaths: 1, wins: 1, losses: 1, games: 2, beds: 1 })
  assert.equal(s.score(a), 2 * 10 + 50 + 25)
})

test('stats survive a restart (data/stats.yml)', () => {
  const p = dataOnly()
  const s = new Stats(p)
  s.kill('Alex'); s.save()
  assert.equal(new Stats(p).get('Alex').kills, 1)
})

test('the /bw stats answer is English with K/D', () => {
  const s = new Stats(dataOnly())
  s.kill('Bea'); s.kill('Bea'); s.kill('Bea'); s.death('Bea'); s.death('Bea')
  const lines = s.lines('Bea').map(l => l.replace(/§./g, ''))
  assert.equal(lines[0], 'Stats of player Bea:')
  assert.ok(lines.includes('Kills: 3') && lines.includes('Deaths: 2') && lines.includes('K/D: 1.5'))
})

test('an unknown or broken stats file starts empty', () => {
  assert.equal(new Stats(dataOnly({ 'stats.yml': ': : not yaml [' })).get('X').kills, 0)
})
