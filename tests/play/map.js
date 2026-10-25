// Reads the map definition at runtime from the ScreamingBedWars arena file (and the paper-world config),
// so nothing about coordinates is hardcoded in botd.js / recorder.js / round.js.
'use strict'
const fs = require('fs')
const path = require('path')

const REPO = path.resolve(__dirname, '..', '..')
const DEFAULT_ARENA = path.join(REPO, 'config', 'arena-rush.yml')
const DEFAULT_PAPER = path.join(REPO, 'config', 'paper-world-bedwars.yml')

// ---- minimal YAML subset parser (block mappings, block lists of mappings/scalars, scalars)
function scalar (s) {
  s = s.trim()
  if (s === 'null' || s === '~' || s === '') return null
  if (s === 'true') return true
  if (s === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) return s.slice(1, -1)
  return s
}
function parseYaml (text) {
  const lines = []
  for (const raw of text.split('\n')) {
    if (/^\s*(#.*)?$/.test(raw)) continue
    lines.push({ indent: raw.match(/^ */)[0].length, text: raw.trim() })
  }
  let pos = 0
  function parseBlock (indent) {
    const first = lines[pos]
    if (!first) return null
    if (first.text.startsWith('- ') || first.text === '-') return parseList(first.indent)
    return parseMap(first.indent)
  }
  function parseMap (indent) {
    const obj = {}
    while (pos < lines.length && lines[pos].indent === indent && !lines[pos].text.startsWith('- ')) {
      const ln = lines[pos]
      const m = /^([^:]+?):(?:\s+(.*))?$/.exec(ln.text)
      if (!m) { pos++; continue }
      pos++
      if (m[2] !== undefined && m[2] !== '') obj[m[1]] = scalar(m[2])
      else if (pos < lines.length && (lines[pos].indent > indent || (lines[pos].indent === indent && lines[pos].text.startsWith('- ')))) obj[m[1]] = parseBlock(lines[pos].indent)
      else obj[m[1]] = null
    }
    return obj
  }
  function parseList (indent) {
    const arr = []
    while (pos < lines.length && lines[pos].indent === indent && lines[pos].text.startsWith('- ')) {
      const ln = lines[pos]
      const rest = ln.text.slice(2)
      if (/^[^:]+:(\s|$)/.test(rest) && !/^['"]/.test(rest)) {
        // mapping item: rewrite the "- " as two spaces and parse as map at indent+2
        lines[pos] = { indent: indent + 2, text: rest }
        arr.push(parseMap(indent + 2))
      } else { pos++; arr.push(scalar(rest)) }
    }
    return arr
  }
  return parseBlock(0)
}

const loc = s => {
  const p = String(s).split(';').map(Number)
  return { x: p[0], y: p[1], z: p[2], yaw: p[3] || 0, pitch: p[4] || 0 }
}
const centroid = pts => ({ x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts[0].y, z: pts.reduce((s, p) => s + p.z, 0) / pts.length })
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
const TEAM_COLORS = { RED: '#e53935', BLUE: '#1e88e5', GREEN: '#43a047', YELLOW: '#fdd835', AQUA: '#00acc1', WHITE: '#eeeeee', PINK: '#ec407a', GRAY: '#757575', ORANGE: '#fb8c00', PURPLE: '#8e24aa', BLACK: '#212121', LIME: '#7cb342', CYAN: '#00acc1', LIGHT_PURPLE: '#ba68c8' }

function loadMap ({ arena = DEFAULT_ARENA, paper = DEFAULT_PAPER } = {}) {
  const a = parseYaml(fs.readFileSync(arena, 'utf8'))
  const teams = {}
  for (const [name, t] of Object.entries(a.teams)) {
    teams[name] = { name, color: TEAM_COLORS[String(t.color).toUpperCase()] || '#888888', colorName: t.color, bed: loc(t.bed), spawn: loc(t.spawn) }
  }
  const spawners = (a.spawners || []).map(s => {
    const p = loc(s.location)
    return { type: s.type === 'iron' ? 'silver' : s.type, x: p.x, y: p.y, z: p.z, team: s.team || null }
  })
  const stores = (a.stores || []).map(s => loc(s.loc))
  let voidY = 30
  // Pumpkin port: void-kill heights per world live in config/bedwars.yml
  try {
    const settings = parseYaml(fs.readFileSync(path.join(REPO, 'config', 'bedwars.yml'), 'utf8'))
    const vk = settings['void-kill'] && settings['void-kill'][a.world]
    if (typeof vk === 'number') { voidY = vk; paper = null }
  } catch (e) {}
  try {
    if (!paper) throw new Error('no paper config')
    const pw = parseYaml(fs.readFileSync(paper, 'utf8'))
    const off = pw.environment && pw.environment['void-damage-min-build-height-offset']
    if (typeof off === 'number') voidY = -64 + off
  } catch (e) {}
  const p1 = loc(a.pos1); const p2 = loc(a.pos2)
  const bounds = { min: [Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.min(p1.z, p2.z)], max: [Math.max(p1.x, p2.x), Math.max(p1.y, p2.y), Math.max(p1.z, p2.z)] }
  const names = Object.keys(teams)
  const m = {
    name: a.name, teams, teamNames: names, spawners, stores, voidY, bounds,
    specSpawn: loc(a.specSpawn), lobbySpawn: loc(a.lobbySpawn),
    walkY: Math.floor(Object.values(teams)[0].spawn.y), // players stand at y = walkY, the floor blocks are at walkY - 1
    other (team) { return names.find(n => n !== team) },
    /** centroid of spawners of a type, optionally filtered by team (null = neutral) */
    spawnerCentroid (type, team) {
      const list = spawners.filter(s => s.type === type && (team === undefined || s.team === team))
      return list.length ? centroid(list) : null
    },
    nearestSpawner (type, from) {
      const list = spawners.filter(s => s.type === type)
      list.sort((x, y) => hd(x, from) - hd(y, from))
      return list[0] || null
    },
    nearestStore (from) {
      const list = [...stores]
      list.sort((x, y) => hd(x, from) - hd(y, from))
      return list[0] || null
    },
    /** Named location -> {x,y,z} standing position (y = walk level), null if unknown. */
    named (name, team) {
      if (!team || !teams[team]) team = names[0]
      const own = teams[team]; const enemy = teams[this.other(team)]
      const y = this.walkY
      const toward = (p, q, d) => { // point d blocks from p in the direction of q
        const dx = q.x - p.x; const dz = q.z - p.z; const l = Math.hypot(dx, dz) || 1
        return { x: p.x + dx / l * d, y, z: p.z + dz / l * d }
      }
      switch (name) {
        case 'middle': case 'gold': { const g = this.spawnerCentroid('gold') || centroid([own.spawn, enemy.spawn]); return { x: g.x, y, z: g.z } }
        case 'own_base': return { x: own.spawn.x, y, z: own.spawn.z }
        case 'enemy_base': return { x: enemy.spawn.x, y, z: enemy.spawn.z }
        case 'own_bed': return toward({ x: own.bed.x + 0.5, z: own.bed.z + 0.5 }, own.spawn, 2.2)
        case 'enemy_bed': return toward({ x: enemy.bed.x + 0.5, z: enemy.bed.z + 0.5 }, enemy.spawn, 2.2)
        case 'shop': case 'enemy_shop': {
          const t = name === 'shop' ? own : enemy
          const st = this.nearestStore(t.spawn)
          return st ? toward(st, t.spawn, 1.3) : null
        }
        case 'bronze': case 'enemy_bronze': {
          const t = name === 'bronze' ? team : this.other(team)
          const c = this.spawnerCentroid('bronze', t); return c ? { x: c.x, y, z: c.z } : null
        }
        case 'silver': case 'enemy_silver': {
          const t = name === 'silver' ? own : enemy
          const s = this.nearestSpawner('silver', t.spawn); return s ? { x: s.x, y, z: s.z } : null
        }
        default: return null
      }
    },
    /** Landmark label for a position relative to a team (used for the "on" field in /state). */
    where (x, y, z, team) {
      if (y < voidY + 2) return 'void'
      if (!team || !teams[team]) team = names[0]
      const pts = [['own_base', teams[team].spawn], ['enemy_base', teams[this.other(team)].spawn]]
      const g = this.spawnerCentroid('gold'); if (g) pts.push(['middle', g])
      for (const [lab, tm] of [['own_silver', team], ['enemy_silver', this.other(team)]]) { const s = this.nearestSpawner('silver', teams[tm].spawn); if (s && hd(s, teams[tm].spawn) > 8) pts.push([lab, s]) }
      let best = null
      for (const [lab, p] of pts) { const d = Math.hypot(p.x - x, p.z - z); if (!best || d < best.d) best = { lab, d } }
      if (!best || best.d > 14 || Math.abs(y - this.walkY) > 8) return 'between_islands'
      return best.lab
    }
  }
  return m
}

module.exports = { loadMap, parseYaml, DEFAULT_ARENA, DEFAULT_PAPER }

if (require.main === module) {
  const m = loadMap({ arena: process.argv[2] || DEFAULT_ARENA })
  console.log(JSON.stringify({ name: m.name, teams: m.teams, voidY: m.voidY, walkY: m.walkY, bounds: m.bounds, spawners: m.spawners.length, stores: m.stores }, null, 1))
  for (const n of ['middle', 'own_base', 'enemy_base', 'own_bed', 'enemy_bed', 'shop', 'bronze', 'silver', 'gold', 'enemy_bronze', 'enemy_silver']) console.log(n, JSON.stringify(m.named(n, m.teamNames[0])), JSON.stringify(m.named(n, m.teamNames[1])))
}
