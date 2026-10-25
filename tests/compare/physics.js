// Arrow flight models used for cross-checks.
//   vanilla18: EntityArrow.onUpdate of 1.8.9: pos += motion; motion *= 0.99; motion.y -= 0.05      (move first)
//   pumpkin  : ArrowEntity::tick of the current Pumpkin:     motion.y -= 0.05; motion *= 0.99; pos += motion  (move last)
// Both stop at the first block face the movement segment crosses; here the only block is the floor plane y = floorY.
// Vanilla (1.8 and 26.x) leaves the arrow 0.05 blocks back along the motion from the impact point.
function simulate (order, pos, vel, floorY, maxTicks = 600) {
  let p = { ...pos }; let v = { ...vel }
  const path = [{ ...p }]
  for (let n = 1; n <= maxTicks; n++) {
    if (order === 'pumpkin') { v.y -= 0.05; v = { x: v.x * 0.99, y: v.y * 0.99, z: v.z * 0.99 } }
    const q = { x: p.x + v.x, y: p.y + v.y, z: p.z + v.z }
    if (q.y <= floorY) {
      const t = (p.y - floorY) / (p.y - q.y)
      const hit = { x: p.x + v.x * t, y: floorY, z: p.z + v.z * t }
      const sp = Math.hypot(v.x, v.y, v.z)
      const stuck = { x: hit.x - v.x / sp * 0.05, y: hit.y - v.y / sp * 0.05, z: hit.z - v.z / sp * 0.05 }
      path.push(stuck)
      return { ticks: n, stuck, hit, path }
    }
    p = q; path.push({ ...p })
    if (order === 'vanilla18') { v = { x: v.x * 0.99, y: v.y * 0.99, z: v.z * 0.99 }; v.y -= 0.05 }
  }
  return { ticks: -1, stuck: p, path }
}
module.exports = { simulate }
