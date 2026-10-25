// Reads reports/bow-raw-{vanilla,pumpkin[,pumpkin-fixed]}.json (from collect.js) and writes
//   reports/bow-1.8.9-vs-pumpkin.metrics.json  (all computed numbers)
//   reports/bow-1.8.9-vs-pumpkin.md            (the report; the prose verdicts are in report-template.js)
const fs = require('fs')
const path = require('path')
const { simulate } = require('./physics')
const REP = path.resolve(__dirname, '..', '..', 'reports')
const D2R = Math.PI / 180

const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length
const sd = xs => xs.length < 2 ? NaN : Math.sqrt(xs.reduce((s, x) => s + (x - mean(xs)) ** 2, 0) / (xs.length - 1))
const se = xs => sd(xs) / Math.sqrt(xs.length)
const median = xs => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z
const len = a => Math.hypot(a.x, a.y, a.z)
const scale = (a, k) => ({ x: a.x * k, y: a.y * k, z: a.z * k })

function load (label) {
  const f = path.join(REP, `bow-raw-${label}${process.env.QUICKTEST ? '-quick' : ''}.json`)
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null
}

/** One shot in canonical units (blocks, blocks/tick). */
function norm (s0, kind) {
  let s = s0
  if (!s.arrow) return null
  const sp = s.arrow.spawn
  let stuckSource = 'server'
  let sq = s.serverQuery && s.serverQuery.pos && s.serverQuery.pos.length >= 3 ? s.serverQuery : null
  if (!sq) {
    // the shooter picked the stuck arrow up (floor hit within ~2 blocks) before the server query: use the last position the client was told
    let p = kind === 'vanilla' ? { x: sp.x / 32, y: sp.y / 32, z: sp.z / 32 } : { x: sp.x, y: sp.y, z: sp.z }
    let moved = false
    for (const e of s.arrow.events) {
      if (e.n === 'entity_destroy') break
      if (!e.d) continue
      if (e.n === 'entity_teleport' || e.n === 'sync_entity_position' || ((e.n === 'rel_entity_move' || e.n === 'entity_move_look') && (e.d.dX || e.d.dY || e.d.dZ))) moved = true
      if (e.n === 'entity_teleport') p = kind === 'vanilla' ? { x: e.d.x / 32, y: e.d.y / 32, z: e.d.z / 32 } : { x: e.d.x, y: e.d.y, z: e.d.z }
      else if (e.n === 'sync_entity_position') p = { x: e.d.x, y: e.d.y, z: e.d.z }
      else if (e.n === 'rel_entity_move' || e.n === 'entity_move_look') { const k = kind === 'vanilla' ? 32 : 4096; p = { x: p.x + e.d.dX / k, y: p.y + e.d.dY / k, z: p.z + e.d.dZ / k } }
    }
    sq = { pos: [p.x, p.y, p.z], inGround: null }
    stuckSource = moved ? 'packets' : 'none'
  }
  s = { ...s, serverQuery: sq, stuckSource }
  const vel = kind === 'vanilla' ? { x: sp.velocity.x / 8000, y: sp.velocity.y / 8000, z: sp.velocity.z / 8000 } : { ...sp.velocity }
  const pos = kind === 'vanilla' ? { x: sp.x / 32, y: sp.y / 32, z: sp.z / 32 } : { x: sp.x, y: sp.y, z: sp.z }
  const yaw = s.sentLook.yaw * D2R; const pit = s.sentLook.pitch * D2R
  const dir = { x: -Math.sin(yaw) * Math.cos(pit), y: -Math.sin(pit), z: Math.cos(yaw) * Math.cos(pit) }
  const feet = s.sentPos
  const rel = sub(pos, feet)
  const right = { x: -Math.cos(yaw), y: 0, z: -Math.sin(yaw) }
  const fwd = { x: -Math.sin(yaw), y: 0, z: Math.cos(yaw) }
  const eye = s.scenario.startsWith('sneak') ? 1.54 : 1.62
  const expPos = { x: feet.x - Math.cos(yaw) * 0.16, y: feet.y + eye - 0.1, z: feet.z - Math.sin(yaw) * 0.16 }
  const q = kind === 'vanilla' ? { x: Math.floor(expPos.x * 32) / 32, y: Math.floor(expPos.y * 32) / 32, z: Math.floor(expPos.z * 32) / 32 } : expPos
  const stuck = { x: s.serverQuery.pos[0], y: s.serverQuery.pos[1], z: s.serverQuery.pos[2] }
  const o = {
    scenario: s.scenario, group: s.group, motion: s.motion, idx: s.idx, stuckSource,
    pos, vel, speed: len(vel), dir, feet, rel,
    offset: { right: dot(rel, right), fwd: dot(rel, fwd), up: rel.y },
    expectedOffsetErr: len(sub(pos, q)), // distance of the spawn packet position to the 1.8 formula (fixed point applied for 1.8.9)
    resid: scale(sub(vel, scale(dir, 3.0)), 1 / 3), // = gaussian * 0.0075 when the launch is the 1.8 one at full draw
    angleErrDeg: Math.acos(Math.min(1, dot(vel, dir) / (len(vel) * len(dir)))) / D2R,
    step: s.shooterStep, shooterVel: s.shooterAtRelease.vel, onGround: s.shooterAtRelease.onGround,
    stuck, landDist: stuckSource === 'none' ? NaN : Math.hypot(stuck.x - feet.x, stuck.z - feet.z), landDy: stuckSource === 'none' ? NaN : stuck.y - feet.y,
    inGround: s.serverQuery.inGround, drawTicks: s.drawTicks ?? s.drawNominal,
    arrowYawPitch: { yaw: sp.yaw, pitch: sp.pitch }
  }
  // draw ticks the server counted, from the speed: speed = 3 * (f0^2 + 2 f0)/3 with f0 = j/20
  // (f0^2+2f0)/3 = f  =>  f0 = -1 + sqrt(1+3f)
  const f = Math.min(1, o.speed / 3)
  o.drawFromSpeed = (-1 + Math.sqrt(1 + 3 * f)) * 20
  // models
  for (const order of ['vanilla18', 'pumpkin']) {
    const r = simulate(order, pos, vel, feet.y)
    o['model_' + order] = { ticks: r.ticks, dist: Math.hypot(r.stuck.x - feet.x, r.stuck.z - feet.z), err: stuckSource === 'none' ? NaN : Math.hypot(r.stuck.x - stuck.x, r.stuck.z - stuck.z) }
  }
  // packets
  const ev = s.arrow.events.filter(e => e.n !== 'entity_metadata' && e.n !== 'entity_head_rotation')
  o.events = ev
  const posEv = e => e.n === 'entity_teleport' || e.n === 'sync_entity_position' || ((e.n === 'rel_entity_move' || e.n === 'entity_move_look') && (e.d.dX || e.d.dY || e.d.dZ))
  if (kind === 'pumpkin') {
    const z = ev.find(e => e.n === 'entity_velocity' && !e.d.velocity.x && !e.d.velocity.y && !e.d.velocity.z)
    o.landPacketDt = z ? z.dt : null // the zero velocity packet marks the stop; sync_entity_position is also sent every 20 ticks while flying
  } else {
    const cand = ev.filter(e => posEv(e) && e.dt < 900)
    const last = cand[cand.length - 1]
    o.landPacketDt = last && (last.dt >= 20 || o['model_vanilla18'].ticks === 1) && !ev.some(e => e.n === 'entity_destroy' && e.dt < 900) ? last.dt : null
  }
  o.flightTicksPacket = o.landPacketDt == null ? null : Math.round(o.landPacketDt / 50) + 1
  const endDt = o.landPacketDt == null ? 1100 : o.landPacketDt + 5
  const pre = ev.filter(e => e.dt <= endDt)
  o.census = {}
  for (const e of pre) o.census[e.n] = (o.census[e.n] || 0) + 1
  o.velocityDts = pre.filter(e => e.n === 'entity_velocity').map(e => e.dt)
  o.packetsAtSpawn = ev.filter(e => e.dt < 8).map(e => e.n + (e.n === 'entity_velocity' ? `(${e.d.velocity.x.toFixed(3)},${e.d.velocity.y.toFixed(3)},${e.d.velocity.z.toFixed(3)})` : (e.d && e.d.dZ !== undefined ? `(d=${e.d.dX},${e.d.dY},${e.d.dZ})` : '')))
  o.postLandingPackets = ev.filter(e => e.dt > endDt).length
  return o
}

function stats (xs) { xs = xs.filter(x => Number.isFinite(x)); return xs.length ? { n: xs.length, mean: mean(xs), sd: sd(xs), se: se(xs), min: Math.min(...xs), max: Math.max(...xs), median: median(xs) } : { n: 0 } }

function analyse (raw, kind) {
  if (!raw) return null
  const all = raw.shots.map(s => norm(s, kind)).filter(Boolean)
  const failed = raw.shots.length - all.length
  const by = fn => all.filter(fn)
  const FULL = by(o => o.motion === 'stand' && o.drawTicks === 22 && o.speed > 2.85)
  const FULL_ALL = by(o => o.motion === 'stand' && o.drawTicks === 22)
  const R = {}
  R.shots = raw.shots.length; R.usable = all.length; R.failed = failed
  R.fullDrawExcluded = FULL_ALL.length - FULL.length
  // 1 speed / 2 direction (standing, full draw, all pitches and yaws)
  R.speed = stats(FULL.map(o => o.speed))
  R.speedP0 = stats(by(o => o.group === 'stand p0').filter(o => o.speed > 2.85).map(o => o.speed))
  R.angle = { rms: Math.sqrt(mean(FULL.map(o => o.angleErrDeg ** 2))), mean: mean(FULL.map(o => o.angleErrDeg)), max: Math.max(...FULL.map(o => o.angleErrDeg)) }
  R.resid = { x: stats(FULL.map(o => o.resid.x)), y: stats(FULL.map(o => o.resid.y)), z: stats(FULL.map(o => o.resid.z)) }
  R.residPooledSd = Math.sqrt(mean(FULL.flatMap(o => [o.resid.x ** 2, o.resid.y ** 2, o.resid.z ** 2])))
  R.residRaw = FULL.map(o => [o.resid.x, o.resid.y, o.resid.z])
  // 3 spawn offset (standing + sneaking, full draw or not does not matter)
  const stand = by(o => o.motion === 'stand')
  R.offset = { right: stats(stand.map(o => o.offset.right)), fwd: stats(stand.map(o => o.offset.fwd)), up: stats(stand.map(o => o.offset.up)) }
  R.offsetFormulaErr = { max: Math.max(...all.map(o => o.expectedOffsetErr)), mean: mean(all.map(o => o.expectedOffsetErr)) }
  const sneak = by(o => o.motion === 'sneak')
  R.offsetSneak = sneak.length ? { up: stats(sneak.map(o => o.offset.up)), right: stats(sneak.map(o => o.offset.right)) } : null
  R.offsetByYaw = {}
  for (const g of ['stand p0', 'stand p0 yaw37', 'stand p0 yaw-90']) {
    const os = by(o => o.group === g)
    if (os.length) R.offsetByYaw[g] = { right: stats(os.map(o => o.offset.right)), fwd: stats(os.map(o => o.offset.fwd)), up: stats(os.map(o => o.offset.up)), formulaErrMax: Math.max(...os.map(o => o.expectedOffsetErr)) }
  }
  // 4 momentum
  R.momentum = {}
  for (const g of ['stand p0', 'sprint p0', 'sprint p+20', 'jump p0', 'strafe-left p0', 'sneak p0']) {
    const os = by(o => o.group === g)
    if (!os.length) continue
    const m = { n: os.length, speed: stats(os.map(o => o.speed)), angle: mean(os.map(o => o.angleErrDeg)) }
    const withStep = os.filter(o => len(o.step) > 0.02)
    if (withStep.length) {
      m.stepLen = stats(withStep.map(o => len(o.step)))
      m.residAlongStep = stats(withStep.map(o => dot(o.resid, scale(o.step, 1 / len(o.step)))))
      m.momentumWouldAdd = mean(withStep.map(o => len(o.step) / 3))
      m.residY = stats(withStep.map(o => o.resid.y)); m.stepY = stats(withStep.map(o => o.step.y))
      m.residX = stats(withStep.map(o => o.resid.x)); m.residZ = stats(withStep.map(o => o.resid.z))
      m.stepX = stats(withStep.map(o => o.step.x)); m.stepZ = stats(withStep.map(o => o.step.z))
    }
    m.onGround = os.filter(o => o.onGround).length
    R.momentum[g] = m
  }
  // 5 landing per group (server truth = stuck arrow position from the server)
  R.landing = {}
  for (const g of ['stand p-45', 'stand p-20', 'stand p0', 'stand p+20', 'stand p+45']) {
    const os = by(o => o.group === g && o.speed > 2.85)
    if (!os.length) continue
    // nominal: no spread, exact spawn offset, full draw, from the sent look direction
    const nom = {}
    for (const order of ['vanilla18', 'pumpkin']) {
      const o0 = os[0]
      const r = simulate(order, { x: 0, y: 1.52, z: 0 }, scale(o0.dir, 3.0), 0)
      nom[order] = { dist: Math.hypot(r.stuck.x, r.stuck.z), ticks: r.ticks }
    }
    R.landing[g] = {
      removedBeforeObserved: os.filter(o => o.stuckSource === 'none').length,
      pickedUpMs: stats(os.map(o => (o.events.find(e => e.n === 'entity_destroy') || {}).dt).filter(x => x != null)),
      dist: stats(os.map(o => o.landDist)), dy: stats(os.map(o => o.landDy)),
      ticksPacket: stats(os.filter(o => o.flightTicksPacket != null).map(o => o.flightTicksPacket)),
      ticksModelV18: stats(os.map(o => o.model_vanilla18.ticks)), ticksModelPumpkin: stats(os.map(o => o.model_pumpkin.ticks)),
      errV18: stats(os.map(o => o.model_vanilla18.err)), errPumpkin: stats(os.map(o => o.model_pumpkin.err)),
      nominal: nom
    }
  }
  // draw
  R.draw = {}
  for (const d of [4, 8, 12, 16, 22]) {
    const os = by(o => d === 22 ? o.group === 'stand p0' : o.group === `draw ${d} p0`)
    if (!os.length) continue
    const f0 = d / 20; const f = Math.min(1, (f0 * f0 + 2 * f0) / 3)
    R.draw[d] = { speed: stats(os.map(o => o.speed)), expected: 3 * f, drawFromSpeed: stats(os.map(o => o.drawFromSpeed)), landDist: stats(os.map(o => o.landDist)), ticksPacket: stats(os.filter(o => o.flightTicksPacket != null).map(o => o.flightTicksPacket)) }
  }
  // draw-tick bookkeeping: speed -> draw ticks j the server counted; how far from an integer (formula check) and from the nominal client draw
  const drawShots = by(o => o.drawTicks !== undefined && o.motion === 'stand' && o.group !== 'stand p0 yaw37' && o.speed < 2.85)
  R.drawLattice = { n: drawShots.length, maxFracErr: Math.max(...drawShots.map(o => Math.abs(o.drawFromSpeed - Math.round(o.drawFromSpeed)))), meanFracErr: mean(drawShots.map(o => Math.abs(o.drawFromSpeed - Math.round(o.drawFromSpeed)))) }
  R.drawVsNominal = {}
  for (const d of [4, 8, 12, 16, 22]) {
    const os = by(o => d === 22 ? o.group === 'stand p0' : o.group === `draw ${d} p0`)
    const nom = Math.min(d, 20)
    R.drawVsNominal[d] = { n: os.length, exact: os.filter(o => Math.abs(o.drawFromSpeed - nom) < 0.35).length, offBy1: os.filter(o => Math.abs(o.drawFromSpeed - nom) >= 0.35 && Math.abs(o.drawFromSpeed - nom) < 1.35).length, worse: os.filter(o => Math.abs(o.drawFromSpeed - nom) >= 1.35).length }
  }
  // tracking: when does the client stop hearing about the arrow (entity_destroy / last packet), and how far away is the arrow then (model position)
  R.tracking = {}
  for (const g of ['stand p+20', 'stand p+45']) {
    const os = by(o => o.group === g && o.speed > 2.85)
    if (!os.length) continue
    const rows = os.map(o => {
      const order = kind === 'vanilla' ? 'vanilla18' : 'pumpkin'
      const path = simulate(order, o.pos, o.vel, o.feet.y).path
      const at = dt => { const k = Math.min(path.length - 1, Math.max(0, Math.round(dt / 50) + 1)); return Math.hypot(path[k].x - o.feet.x, path[k].z - o.feet.z) }
      const destroy = o.events.find(e => e.n === 'entity_destroy')
      const lastVel = o.events.filter(e => e.n === 'entity_velocity').pop()
      return { destroyDt: destroy ? destroy.dt : null, destroyDist: destroy ? at(destroy.dt) : null, lastVelDt: lastVel ? lastVel.dt : null, lastVelDist: lastVel ? at(lastVel.dt) : null, flightTicksModel: path.length - 1, landDist: o.landDist, lastEventDt: o.events.length ? o.events[o.events.length - 1].dt : null }
    })
    R.tracking[g] = { n: rows.length, destroyDt: stats(rows.map(r => r.destroyDt)), destroyDist: stats(rows.map(r => r.destroyDist)), lastVelDt: stats(rows.map(r => r.lastVelDt)), lastVelDist: stats(rows.map(r => r.lastVelDist)), flightTicksModel: stats(rows.map(r => r.flightTicksModel)), landDist: stats(rows.map(r => r.landDist)) }
  }
  // 6 packet schedule
  R.packets = {}
  for (const g of ['stand p0', 'stand p+20', 'stand p+45', 'draw 8 p0']) {
    const os = by(o => o.group === g)
    if (!os.length) continue
    const census = {}
    for (const o of os) for (const [k, v] of Object.entries(o.census)) (census[k] = census[k] || []).push(v)
    const dts = os.flatMap(o => o.velocityDts.slice(1).map((d, i) => d - o.velocityDts[i])).filter(d => d > 5)
    R.packets[g] = {
      n: os.length,
      perShot: Object.fromEntries(Object.entries(census).map(([k, v]) => [k, { mean: mean(v), min: Math.min(...v), max: Math.max(...v) }])),
      velocityIntervalMs: dts.length ? { median: median(dts), min: Math.min(...dts), max: Math.max(...dts) } : null,
      sample: { name: os[0].scenario, atSpawn: os[0].packetsAtSpawn, landPacketDt: os[0].landPacketDt },
      postLanding: stats(os.map(o => o.postLandingPackets))
    }
  }
  R.arrowYawPitchAtSpawn = (by(o => o.group === 'stand p0')[0] || {}).arrowYawPitch
  R.arrowYawPitch45 = (by(o => o.group === 'stand p+45')[0] || {}).arrowYawPitch
  R.stuckY = stats(all.filter(o => o.stuckSource === 'server' && o.motion === 'stand' && o.group.startsWith('stand p0')).map(o => o.stuck.y - o.feet.y))
  R.stuckYAll = stats(all.filter(o => o.stuckSource === 'server' && o.motion === 'stand').map(o => o.stuck.y - o.feet.y))
  R.noArrowOrError = raw.shots.filter(s => !s.arrow).map(s => ({ scenario: s.scenario, error: s.error, noArrow: s.noArrow }))
  R.meta = { version: raw.version, startedAt: raw.startedAt, binary: raw.binary || null, serverErrors: raw.serverErrors || [] }
  R.all = all.map(o => ({ scenario: o.scenario, group: o.group, speed: o.speed, angleErrDeg: o.angleErrDeg, offset: o.offset, landDist: o.landDist, landDy: o.landDy, flightTicksPacket: o.flightTicksPacket, modelTicksV18: o.model_vanilla18.ticks, modelTicksPumpkin: o.model_pumpkin.ticks, modelErrV18: o.model_vanilla18.err, modelErrPumpkin: o.model_pumpkin.err, drawFromSpeed: o.drawFromSpeed }))
  return R
}

function main () {
  const sets = { vanilla: load('vanilla'), pumpkin: load('pumpkin'), fixed: load('pumpkin-fixed') }
  const res = {}
  for (const [k, raw] of Object.entries(sets)) res[k] = analyse(raw, k === 'vanilla' ? 'vanilla' : 'pumpkin')
  fs.writeFileSync(path.join(REP, 'bow-1.8.9-vs-pumpkin.metrics.json'), JSON.stringify(res, null, 1))
  return res
}
if (require.main === module) {
  const res = main()
  const sh = o => o && JSON.stringify(o, (k, v) => typeof v === 'number' ? +v.toFixed(4) : (k === 'all' || k === 'residRaw' ? undefined : v), 1)
  for (const [k, r] of Object.entries(res)) { if (!r) continue; console.log('=====', k); console.log(sh({ ...r, all: undefined })) }
}
module.exports = { main, analyse, norm, stats }
