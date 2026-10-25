// Control experiment for 40-bow: the server runs with `[pvp.legacy_combat] enabled = false` on a throwaway copy.
// The same measurements must now SHOW the modern behaviour (arrow inherits the shooter's momentum, no sideways
// offset). This proves that the measurements in 40-bow are able to detect the difference, so a pass there is meaningful.
const fs = require('fs')
const path = require('path')
const { lib } = require('./40-bow.test.js')

function disableLegacyCombat (dataDir) {
  const file = path.join(dataDir, 'pumpkin.toml')
  const toml = fs.readFileSync(file, 'utf8')
  const patched = toml.replace(/(\[pvp\.legacy_combat\][^\[]*?enabled\s*=\s*)true/, '$1false')
  if (patched === toml) throw new Error('could not disable [pvp.legacy_combat] in pumpkin.toml')
  fs.writeFileSync(file, patched)
}

module.exports = {
  name: '41-bow-control',
  timeout: 300000,
  server: { prepare: disableLegacyCombat },

  async run (t) {
    const { r3, rv, mean, len } = lib
    const ctx = await lib.setupGame(t)
    const NAMES = ['stand p0 #0', 'stand p0 #1', 'stand p0 #2', 'jump p0 #0', 'jump p25 #0', 'jump p-25 #0', 'fall p0 #0', 'fall p-25 #0',
      'sprint p0 #0', 'sprint p25 #0', 'strafe left #0', 'strafe right #0', 'sprint-jump #0', 'sprint-jump #1']
    const recs = await lib.runMovementSuite(ctx, { only: sc => NAMES.includes(sc.name) })
    const good = recs.filter(r => r.spawnVel)
    t.check('control: shots were measured', good.length >= 8, { shots: good.length, names: good.map(r => r.name) })
    const G = g => good.filter(r => r.group === g)
    const st = G('stand')
    t.check('control: standing arrows are still speed 3.0 (the measurement itself is sound)', st.length >= 2 && st.every(r => Math.abs(r.speed - 3) < 0.1 && r.residualMag < 0.1),
      st.map(r => ({ speed: r3(r.speed), res: r3(r.residualMag) })))

    for (const [label, g, pre, minRes] of [
      ['sprinting forward', 'sprint', 'sprint', 0.15], ['strafing', 'strafe', 'strafe', 0.1], ['jumping (rising)', 'jump', 'jump', 0.12],
      ['falling', 'fall', 'fall', 0.3], ['sprint-jumping', 'sprintjump', 'sprintjump', 0.2]
    ]) {
      const rs = G(g)
      t.check(`[precondition] bot really was ${label}`, rs.length > 0 && rs.every(lib.MOTION_PRECONDITION[pre]), rs.map(r => r.shooter && r.shooter.d))
      t.check(`control (legacy combat off): ${label} DOES inherit shooter momentum (|v - 3.0*look| >= ${minRes})`,
        rs.length > 0 && rs.every(r => r.residualMag >= minRes),
        rs.map(r => ({ n: r.name, speed: r3(r.speed), res: r3(r.residualMag), inherited: r.inherited && r3(r.inherited), moveBlocksPerTick: r.shooter.d, residual: rv(r.residual) })))
    }
    const sprint = G('sprint')
    t.check('control: sprint inheritance is ~1.0 x shooter velocity (modern: full momentum added)', sprint.length > 0 && sprint.every(r => r.inherited > 0.6 && r.inherited < 1.5),
      sprint.map(r => ({ inherited: r.inherited && r3(r.inherited) })))
    t.check('control (legacy combat off): no 0.16 sideways spawn offset any more (|right| < 0.05), so the origin check in 40-bow can fail too',
      st.length >= 2 && st.every(r => Math.abs(r.offset.right) < 0.05), st.map(r => r.offset))
    const ratio = x => x.inherited
    t.log('inherited fractions', G('sprint').map(ratio), G('sprintjump').map(ratio), G('jump').map(ratio), G('fall').map(ratio), G('strafe').map(ratio))
  }
}
