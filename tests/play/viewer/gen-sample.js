#!/usr/bin/env node
'use strict';
/*
 * Generates a realistic synthetic BedWars replay (2v2 on "Rewi") that follows tests/play/REPLAY_FORMAT.md.
 *
 *   node gen-sample.js [out.json]        default: sample-replay.json next to this script
 *
 * The match is scripted (deterministic, no randomness): collecting, bed cover, bridging, a duel on the middle island,
 * two arrows, a void kill, a teleporter launch to y~214 with a parachute glide, a bed break, a TNT blast on a bridge,
 * a player disconnect, two final kills, and a Blau win. About 5:40 at 10 frames/s.
 */
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || path.join(__dirname, 'sample-replay.json');
const DT = 100;                       // ms per frame (sampleHz 10)
const T = (s) => 10 + 1.3 * s;        // time stretch for everything after the opening collecting phase

// ---------------------------------------------------------------- world (mirrors tools/build_map.py)
const world = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, n) => world.set(key(x, y, z), n);
function fill(x1, y1, z1, x2, y2, z2, n, only) {
  for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) {
    if (only && world.get(key(x, y, z)) !== only) continue;
    put(x, y, z, n);
  }
}
const Y = 63;
function islandBase(x1, z1, x2, z2, top, depth) {
  fill(x1, Y, z1, x2, Y, z2, top);
  for (let i = 1; i <= depth.length; i++) {
    if (x1 + i > x2 - i || z1 + i > z2 - i) break;
    fill(x1 + i, Y - i, z1 + i, x2 - i, Y - i, z2 - i, depth[i - 1]);
  }
}
const TEAMS = { Rot: { s: -1, wool: 'red' }, Blau: { s: 1, wool: 'blue' } };
const spawners = [];
for (const [name, t] of Object.entries(TEAMS)) {
  const s = t.s, c = t.wool, z = (v) => s * v, zc = (v) => s * v + 0.5;
  islandBase(-7, Math.min(z(35), z(49)), 7, Math.max(z(35), z(49)), 'sandstone', ['stone', 'stone', 'andesite', 'cobblestone']);
  fill(-7, Y, Math.min(z(35), z(49)), 7, Y, Math.max(z(35), z(49)), `${c}_terracotta`, 'sandstone');
  fill(-6, Y, Math.min(z(36), z(48)), 6, Y, Math.max(z(36), z(48)), 'sandstone', `${c}_terracotta`);
  fill(-1, Y, Math.min(z(35), z(44)), 1, Y, Math.max(z(35), z(44)), 'chiseled_sandstone');
  for (const [bx, bz] of [[-5, 46], [-5, 44]]) { put(bx, Y, z(bz), 'bricks'); spawners.push({ type: 'bronze', x: bx + 0.5, y: 64, z: zc(bz) }); }
  put(5, Y, z(45), 'iron_block'); spawners.push({ type: 'silver', x: 5.5, y: 64, z: zc(45) });
  put(0, 64, z(46), `${c}_bed`); put(0, 64, z(47), `${c}_bed`);
  for (const cx of [-7, 7]) for (const cz of [35, 49]) put(cx, Y, z(cz), 'glowstone');
}
islandBase(-7, -7, 7, 7, 'stone_bricks', ['stone', 'stone', 'andesite', 'cobblestone']);
fill(-7, Y, -7, 7, Y, 7, 'chiseled_stone_bricks', 'stone_bricks');
fill(-6, Y, -6, 6, Y, 6, 'stone_bricks', 'chiseled_stone_bricks');
fill(-2, Y, -2, 2, Y, 2, 'quartz_block');
// four gold spawners in the middle (per request; config/arena-rewi.yml currently has two) (2x2 around the centre)
for (const gx of [-1, 1]) for (const gz of [-1, 1]) { put(gx, Y, gz, 'gold_block'); spawners.push({ type: 'gold', x: gx + 0.5, y: 64, z: gz + 0.5 }); }
// iron spawners on small side platforms, 20 blocks to the east and west of the middle
for (const sx of [-20, 20]) {
  islandBase(sx - 2, -2, sx + 2, 2, 'stone_bricks', ['stone', 'stone']);
  put(sx, Y, 0, 'iron_block');
  spawners.push({ type: 'silver', x: sx + 0.5, y: 64, z: 0.5 });
}
for (const cx of [-7, 7]) for (const cz of [-7, 7]) put(cx, Y, cz, 'glowstone');
const initialBlocks = [...world].map(([k, n]) => { const [x, y, z] = k.split(',').map(Number); return [x, y, z, n]; })
  .filter((b) => b[1] >= 55 && b[1] <= 90);
const solidAt = (x, z) => world.has(key(Math.floor(x), 63, Math.floor(z)));

// ---------------------------------------------------------------- scripting helpers
const events = [], blockEvents = [];
const ms = (s) => Math.round(s * 1000);
function ev(s, type, text, players, team) {
  const e = { t: ms(s), type, text };
  if (players) e.players = players;
  if (team) e.team = team;
  events.push(e);
}
const blk = (s, x, y, z, name, by) => blockEvents.push({ t: ms(s), x, y, z, name, ...(by ? { by } : {}) });
const deg = (r) => r * 180 / Math.PI;
const yawFromDir = (dx, dz) => deg(Math.atan2(-dx, dz));
const normYaw = (y) => ((y + 180) % 360 + 360) % 360 - 180;
const warn = (...a) => console.warn('[gen]', ...a);

class Actor {
  constructor(name, team, pos) {
    Object.assign(this, { name, team, segs: [], t: 0, p: pos.slice(), yaw: team === 'Rot' ? 0 : 180, hpTL: [[0, 20]], heldTL: [[0, 'wooden_sword']], dead: [], offline: [], riding: [], ptr: 0 });
  }
  _push(t1, f) { this.segs.push({ t0: this.t, t1, f }); this.t = t1; }
  stay(until, o = {}) {
    if (until < this.t - 1e-6) { warn(this.name, 'stay goes backwards', until, this.t); return this; }
    if (until <= this.t + 1e-9) return this;
    const p = this.p.slice(), t0 = this.t, idle = o.idle !== false, ph = this.name.length * 1.7;
    const yaw0 = o.look ? yawFromDir(o.look[0] - p[0], o.look[1] - p[2]) : (o.yaw != null ? o.yaw : this.yaw);
    const pitch0 = o.pitch || 0;
    this._push(until, (t) => {
      const w = t - t0, env = idle ? Math.max(0, Math.min(1, w, until - t)) : 0;
      return { x: p[0] + 0.28 * Math.sin(0.9 * w + ph) * env, y: p[1], z: p[2] + 0.28 * Math.sin(1.3 * w + 2 * ph) * env,
        yaw: yaw0 + (o.look ? 0 : 18 * Math.sin(0.5 * w + ph) * env), pitch: pitch0 + 6 * Math.sin(0.7 * w) * env };
    });
    this.yaw = yaw0;
    return this;
  }
  go(to, speed = 4.3, extra = {}) {
    const a = this.p, b = [to[0], to[1] != null ? to[1] : a[1], to[2]];
    const dx = b[0] - a[0], dz = b[2] - a[2], dist = Math.hypot(dx, dz);
    if (dist < 0.05) return this;
    const t0 = this.t, t1 = t0 + dist / speed, yaw = yawFromDir(dx, dz), pitch = extra.pitch || 0;
    this._push(t1, (t) => { const u = (t - t0) / (t1 - t0); return { x: a[0] + dx * u, y: a[1] + (b[1] - a[1]) * u, z: a[2] + dz * u, yaw, pitch: pitch + 3 * Math.sin(t * 9) }; });
    this.p = b; this.yaw = yaw;
    return this;
  }
  goVia(points, speed) { for (const p of points) this.go(p, speed); return this; }
  // be at [x,z] exactly at time t0 (waits, then runs)
  arrive(t0, to) {
    const dist = Math.hypot(to[0] - this.p[0], to[1] - this.p[2]), travel = dist / 5.6;
    if (this.t + travel > t0 + 0.05) warn(this.name, 'cannot arrive in time', this.t.toFixed(1), '+', travel.toFixed(1), '>', t0.toFixed(1));
    else this.stay(t0 - travel);
    this.go([to[0], this.p[1], to[1]], 5.6);
  }
  hp(s, v) { this.hpTL.push([s, v]); return this; }
  hold(s, item) { this.heldTL.push([s, item]); return this; }
  // bridge along z (fixed block column x). start = block we stand on, end = last block placed
  bridge(t0, t1, x, zs, ze, wool) {
    this.stay(t0, { idle: false });
    const dir = Math.sign(ze - zs), n = Math.abs(ze - zs), zc0 = zs + 0.5, xc = x + 0.5, yaw = dir > 0 ? 180 : 0;
    const startP = this.p.slice();
    for (let k = 1; k <= n; k++) blk(t0 + k * (t1 - t0) / n, x, 63, zs + dir * k, wool, this.name);
    this.hold(t0, wool);
    this._push(t1, (t) => {
      const u = (t - t0) / (t1 - t0), off = Math.max(0, u * n - 0.8);
      return { x: xc + 0.04 * Math.sin(t * 2), y: 64, z: zc0 + dir * off, yaw: yaw + 4 * Math.sin(t * 1.3), pitch: 78 + 2 * Math.sin(t * 2.2) };
    });
    this.p = [xc, 64, zc0 + dir * Math.max(0, n - 0.8)]; this.yaw = yaw;
    void startP;
  }
  // ballistic motion with ground contact on the static islands; returns time when y first drops below 30 (or null)
  fall(v, tmax) {
    const t0 = this.t, h = 0.01, xs = [], ys = [], zs = [];
    let x = this.p[0], y = this.p[1], z = this.p[2], vx = v[0], vy = v[1], vz = v[2], tc = null, i = 0;
    for (; t0 + i * h < tmax; i++) {
      xs.push(x); ys.push(y); zs.push(z);
      const ground = solidAt(x, z) && y <= 64.0001 && vy <= 0;
      if (ground) { y = 64; vy = 0; vx *= 0.985; vz *= 0.985; } else { vy = Math.max(-78, vy - 32 * h); }
      x += vx * h; y += vy * h; z += vz * h;
      if (tc == null && y < 30) tc = t0 + i * h;
      if (y < 4) { y = 4; vy = 0; break; }
    }
    const t1 = t0 + i * h;
    this._push(t1, (t) => { const k = Math.min(xs.length - 1, Math.max(0, Math.round((t - t0) / h))); return { x: xs[k], y: ys[k], z: zs[k], yaw: this.yaw + 120 * (t - t0), pitch: 40 }; });
    this.p = [x, y, z];
    return tc;
  }
  custom(t1, f, end) { this._push(t1, f); this.p = end.slice(); }
  spawnAt(s, pos, yaw) { this.stay(s, { idle: false }); this.p = pos.slice(); this.yaw = yaw != null ? yaw : this.yaw; }
  die(s, until) { this.dead.push([s, until == null ? Infinity : until]); }
  isDead(s) { return this.dead.some(([a, b]) => s >= a && s < b); }
  isOffline(s) { return this.offline.some(([a, b]) => s >= a && s < b); }
  pose(s) {
    const sg = this.segs;
    while (this.ptr > 0 && sg[this.ptr].t0 > s) this.ptr--;
    while (this.ptr < sg.length - 1 && sg[this.ptr].t1 <= s) this.ptr++;
    const g = sg[this.ptr];
    const r = s >= g.t1 ? g.f(g.t1) : g.f(Math.max(g.t0, s));
    return r;
  }
  health(s) {
    if (this.isDead(s)) return 0;
    let last = this.hpTL[0];
    for (const e of this.hpTL) if (e[0] <= s) last = e; else break;
    return Math.min(20, last[1] + 0.25 * (s - last[0]));
  }
  heldAt(s) { let h = this.heldTL[0][1]; for (const e of this.heldTL) if (e[0] <= s) h = e[1]; else break; return h; }
  ridingAt(s) { for (const [a, b, w] of this.riding) if (s >= a && s < b) return w; return null; }
}
function duel(a, b, t0, t1, c, o = {}) {
  const ph = o.phase || 0, w = o.w || 0.9;
  const ang = (t) => { const s = t - t0; return ph + w * s + 0.8 * Math.sin(0.7 * s); };
  const rad = (t) => 1.4 + 0.4 * Math.sin(2.6 * (t - t0));
  const posA = (t) => [c[0] + rad(t) * Math.cos(ang(t)), c[1] + rad(t) * Math.sin(ang(t))];
  const posB = (t) => [c[0] - rad(t) * Math.cos(ang(t)), c[1] - rad(t) * Math.sin(ang(t))];
  a.arrive(t0, posA(t0)); b.arrive(t0, posB(t0));
  const mk = (x, me, other) => {
    x._push(t1, (t) => { const m = me(t), q = other(t); return { x: m[0], y: 64, z: m[1], yaw: yawFromDir(q[0] - m[0], q[1] - m[1]), pitch: 5 + 4 * Math.sin(3 * t) }; });
    const e = me(t1), q = other(t1); x.p = [e[0], 64, e[1]]; x.yaw = yawFromDir(q[0] - e[0], q[1] - e[1]);
  };
  mk(a, posA, posB); mk(b, posB, posA);
}

// ---------------------------------------------------------------- actors
const RS = [0.5, 64, -39.5], BS = [0.5, 64, 40.5];
const alice = new Actor('Alice', 'Rot', [-0.5, 64, -39.5]);
const bob = new Actor('Bob', 'Rot', [1.5, 64, -39.5]);
const carl = new Actor('Carl', 'Blau', [-0.5, 64, 40.5]);
const dora = new Actor('Dora', 'Blau', [1.5, 64, 40.5]);
const actors = [alice, bob, carl, dora];

const rBronzeA = [-4.0, 64, -44.8], rBronzeB = [-4.0, 64, -42.8], rShop = [4.4, 64, -39.2];
const bBronzeA = [-4.0, 64, 45.6], bBronzeB = [-4.0, 64, 43.8], bShop = [4.4, 64, 39.9];
const goldA = [-0.5, 64, -0.8], goldB = [1.5, 64, 1.9];   // next to the four gold spawners

for (const a of actors) ev(0.3 + actors.indexOf(a) * 0.4, 'join', `${a.name} ist dem Spiel beigetreten.`, [a.name]);
ev(3.0, 'info', 'Das Spiel beginnt in 3 Sekunden!');
ev(4.0, 'game_start', 'Das Spiel hat begonnen! Zerstöre das Bett des Gegners!');
ev(6.0, 'chat', '<Alice> Los gehts, Brücke bauen!', ['Alice']);
ev(7.5, 'chat', '<Carl> Wer zuerst die Mitte hat.', ['Carl']);
const buy = (a, what, s) => ev(s, 'buy', `${a.name} hat ${what} gekauft.`, [a.name]);

// ---- phase 1: collecting (raw seconds) -----------------------------------------------------------------------------
alice.stay(4.5).go(rBronzeA).stay(30);
alice.go(rShop); buy(alice, 'Endstein', alice.t + 0.4); alice.hold(alice.t, 'end_stone'); alice.stay(alice.t + 1.5);
alice.go([0.5, 64, -43.4]);
[[1, 64, -46], [1, 64, -47], [-1, 64, -46], [-1, 64, -47], [0, 64, -48], [0, 64, -45], [0, 65, -46], [0, 65, -47]]
  .forEach((c, i) => blk(alice.t + 0.6 + i * 0.9, c[0], c[1], c[2], 'end_stone', 'Alice'));
alice.stay(alice.t + 8.5, { look: [0.5, -46] });
alice.go(rBronzeA).hold(alice.t, 'wooden_sword').stay(T(40));
alice.go(rShop); buy(alice, 'Sandstein', alice.t + 0.3); alice.hold(alice.t, 'red_sandstone'); alice.stay(alice.t + 1.5);
alice.go([0.5, 64, -34.5]);
alice.bridge(T(51), T(69), 0, -35, -8, 'red_sandstone');
alice.hold(T(69), 'wooden_sword');
alice.go(goldA, 5.6).stay(T(81) - 3);

bob.stay(4.5).go(rBronzeB).stay(T(36));
bob.go(rShop); buy(bob, 'Bogen I', bob.t + 0.3); buy(bob, 'Pfeil', bob.t + 1.1); bob.hold(bob.t, 'bow'); bob.stay(bob.t + 1.5);
bob.go(rBronzeB).stay(T(70));
bob.goVia([[0.5, 64, -34.5], [0.5, 64, -8.5], [-3.2, 64, -4.4]], 5.6);
bob.stay(T(86) - 0.8, { look: [3.2, 5.0], pitch: 0 });
// arrow 1: Bob -> Dora (hit)
const arrows = [];
function arrow(s, from, to, o = {}) {
  const speed = o.speed || 14, d = Math.hypot(to[0] - from[0], to[2] - from[2]);
  arrows.push({ id: 300 + arrows.length, t0: s, t1: s + d / speed, from, to });
  return s + d / speed;
}
const hit1 = arrow(T(86), [-3.2, 65.6, -4.4], [3.2, 65.2, 5.0]);
bob.stay(T(86) + 0.4);
dora.hp(hit1, 16);

carl.stay(4.5).go(bBronzeA).stay(T(42));
carl.go(bShop); buy(carl, 'Sandstein', carl.t + 0.3); carl.hold(carl.t, 'red_sandstone'); carl.stay(carl.t + 1.5);
carl.go([0.5, 64, 34.5]);
carl.bridge(T(53), T(71), 0, 35, 8, 'red_sandstone');
carl.hold(T(71), 'wooden_sword');
carl.go(goldB, 5.6).stay(T(81) - 3);

dora.stay(4.5).go(bBronzeB).stay(T(66));
dora.go(bShop); buy(dora, 'Bogen I', dora.t + 0.3); buy(dora, 'Pfeil', dora.t + 1.1); dora.hold(dora.t, 'bow'); dora.stay(dora.t + 1.5);
dora.go(bBronzeB).stay(T(73));
dora.goVia([[0.5, 64, 34.5], [0.5, 64, 8.5], [4.0, 64, 5.4]], 5.6);
dora.stay(T(92) - 0.5, { look: [-3.2, -4.4] });
// arrow 2: Dora -> Bob, misses and flies off into the void
{
  const from = [4.0, 65.6, 5.4], to = [-3.2, 65.2, -4.4];
  const dx = to[0] - from[0], dz = to[2] - from[2];
  const miss = [from[0] + dx * 1.9 - dz * 0.12, 64.2, from[2] + dz * 1.9 + dx * 0.12];
  arrow(T(92), from, miss, { speed: 15 });
}
dora.stay(T(92) + 0.4);

// ---- duel 1: Alice vs Carl on the middle island, Alice wins -----------------------------------------------------------
const C1 = [0.3, 0.2];
alice.hp(T(81), 20).hp(T(84), 17).hp(T(88), 14).hp(T(92), 12).hp(T(96), 10).hp(T(99), 9);
carl.hp(T(81), 20).hp(T(85), 17).hp(T(89), 13).hp(T(93), 9).hp(T(96), 5);
alice.hold(T(80), 'wooden_sword'); carl.hold(T(80), 'wooden_sword');
duel(alice, carl, T(81), T(100), C1, { phase: 3.6 });
ev(T(100), 'kill', 'Carl wurde von Alice getötet.', ['Alice', 'Carl']);
carl.die(T(100), T(105));
carl.stay(T(105), { idle: false });
carl.spawnAt(T(105), BS, 180);
carl.hp(T(105), 20);
ev(T(105), 'respawn', 'Carl ist wieder im Spiel.', ['Carl']);
alice.stay(T(104)).go([-2.8, 64, -2.6]).stay(T(114) - 3);
carl.goVia([[0.5, 64, 34.5], [0.5, 64, 8.5], [0.4, 64, 3.2]], 5.6);

// ---- duel 2: Bob vs Dora, Dora is knocked into the void ---------------------------------------------------------------
const C2 = [4.5, 5.6];
bob.hp(T(108), 20).hp(T(110), 17).hp(T(112), 14).hp(T(114), 12);
dora.hp(T(108), 19).hp(T(110), 15).hp(T(112), 11).hp(T(114), 7).hp(T(115.5), 4);
bob.hold(T(106), 'wooden_sword'); dora.hold(T(106), 'wooden_sword');
duel(bob, dora, T(108), T(116), C2, { phase: 3.9 });
const tVoid = dora.fall([0.8, 4.0, 9.0], T(116) + 6);
ev(tVoid, 'death', 'Dora ist in die Leere gefallen.', ['Dora']);
ev(tVoid + 0.1, 'kill', 'Dora wurde von Bob in den Abgrund gestoßen.', ['Bob', 'Dora']);
dora.die(tVoid, tVoid + 5);
dora.spawnAt(tVoid + 5, [1.5, 64, 40.5], 180);
dora.hp(tVoid + 5, 20);
ev(tVoid + 5, 'respawn', 'Dora ist wieder im Spiel.', ['Dora']);
dora.hold(tVoid + 5, 'bow');
bob.go([-2.6, 64, -4.0]).stay(T(176));

// ---- duel 3: Carl kills Alice -----------------------------------------------------------------------------------------
const C3 = [0.3, -0.2];
alice.hp(T(114), 13).hp(T(117), 10).hp(T(120), 7).hp(T(123), 3);
carl.hp(T(114), 20).hp(T(117), 17).hp(T(120), 14).hp(T(123), 11).hp(T(126), 8);
duel(alice, carl, T(114), T(126), C3, { phase: 0.4, w: -0.8 });
ev(T(126), 'kill', 'Alice wurde von Carl getötet.', ['Carl', 'Alice']);
alice.die(T(126), T(131));
alice.spawnAt(T(131), RS, 0);
alice.hp(T(131), 20);
alice.hold(T(131), 'wooden_sword');
ev(T(131), 'respawn', 'Alice ist wieder im Spiel.', ['Alice']);
alice.go(rShop).stay(T(159) - 1.5, { look: [0.5, -43] });

// ---- teleporter launch + parachute glide (Carl) -----------------------------------------------------------------------
carl.stay(T(134) - 0.2);
buy(carl, 'Teleporter', T(130)); buy(carl, 'Fallschirm', T(132));
carl.hold(T(133), 'firework_rocket');
ev(T(134), 'teleport', 'Carl hat den Teleporter benutzt!', ['Carl']);
{
  const t0 = T(134), t1 = T(137.5), t2 = T(140), t3 = T(156), p0 = carl.p.slice();
  const apex = [1.0, 214, -12], mid = [1.5, 0, -18.5];
  const yMid = 214 - 0.5 * 25 * Math.pow(t2 - t1, 2);
  const land = [2.0, 64, -38.0];
  carl.hp(t0, carl.health(t0)); // pin health so regen doesn't start from an older point
  carl.custom(t1, (t) => {
    const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0))), e = 1 - Math.pow(1 - u, 2);
    return { x: p0[0] + (apex[0] - p0[0]) * u, y: 64 + 150 * e, z: p0[2] + (apex[2] - p0[2]) * u, yaw: 180, pitch: -60 };
  }, apex);
  carl.custom(t2, (t) => {
    const u = (t - t1) / (t2 - t1), d = t - t1;
    return { x: apex[0] + (mid[0] - apex[0]) * u, y: 214 - 0.5 * 25 * d * d, z: apex[2] + (mid[2] - apex[2]) * u, yaw: 180 + 40 * Math.sin(d * 3), pitch: 70 };
  }, [mid[0], yMid, mid[2]]);
  carl.hold(t2 - 0.3, 'chicken_spawn_egg');
  ev(t2, 'parachute', 'Carl gleitet mit dem Fallschirm.', ['Carl']);
  carl.riding.push([t2, t3, 'chicken']);
  carl.custom(t3, (t) => {
    const u = (t - t2) / (t3 - t2), e = u;
    return { x: mid[0] + (land[0] - mid[0]) * u, y: yMid + (land[1] - yMid) * e, z: mid[2] + (land[2] - mid[2]) * u, yaw: 180 + 12 * Math.sin((t - t2) * 0.8), pitch: 22 };
  }, land);
  carl.yaw = 180;
}
carl.hold(T(156), 'iron_sword');
carl.hp(T(160), 17);

// ---- Carl breaks Rot's bed -----------------------------------------------------------------------------------------------
carl.go([1.0, 64, -43.8], 5.6);
const tCover = Math.max(carl.t + 0.6, T(158.1));
carl.stay(T(160.1) + 0.2, { look: [0.5, -46.5] });
blk(tCover, 0, 65, -47, 'air', 'Carl'); blk(tCover + 0.9, 0, 65, -46, 'air', 'Carl');
blk(T(160.1), 0, 64, -46, 'air', 'Carl'); blk(T(160.1) + 0.05, 0, 64, -47, 'air', 'Carl');
ev(T(160.1), 'bed_destroyed', 'Das Bett von Team Rot wurde von Carl zerstört!', ['Carl'], 'Rot');
// ---- duel 4: Alice (defender) vs Carl, Alice wins ----------------------------------------------------------------------
const C4 = [1.0, -42.8];
alice.hp(T(162), 20).hp(T(165), 17).hp(T(169), 14).hp(T(173), 11).hp(T(176), 9);
carl.hp(T(162), 17).hp(T(165), 13).hp(T(168), 9).hp(T(171), 6).hp(T(174), 3);
alice.hold(T(160), 'wooden_sword');
duel(alice, carl, T(162), T(178), C4, { phase: 2.2 });
ev(T(178), 'kill', 'Carl wurde von Alice getötet.', ['Alice', 'Carl']);
carl.die(T(178), T(183));
carl.spawnAt(T(183), BS, 180);
carl.hp(T(183), 20);
ev(T(183), 'respawn', 'Carl ist wieder im Spiel.', ['Carl']);
alice.stay(T(178) + 0.3).go([0.5, 64, -40.5]).stay(T(196), { look: [0.5, -30] });

// ---- Dora disconnects and rejoins ---------------------------------------------------------------------------------------
dora.stay(T(168));
dora.offline.push([T(140), T(146)]);
ev(T(140), 'leave', 'Dora hat das Spiel verlassen.', ['Dora']);
ev(T(146), 'join', 'Dora ist dem Spiel beigetreten.', ['Dora']);

// ---- duel 5: Dora attacks Bob in the middle; Bob flees over the bridge ------------------------------------------------
dora.go(bBronzeB).stay(T(170));
dora.goVia([[0.5, 64, 34.5], [0.5, 64, 8.5]], 5.6);
const C5 = [0.5, 1.5];
bob.hp(T(184), 20).hp(T(187), 17).hp(T(190), 14).hp(T(193), 11);
dora.hp(T(184), 20).hp(T(187), 17).hp(T(190), 13).hp(T(193), 10);
dora.hold(T(180), 'wooden_sword'); bob.hold(T(180), 'wooden_sword');
duel(bob, dora, T(184), T(194), C5, { phase: 1.0 });
// Bob flees to the Rot base
bob.goVia([[0.5, 64, -8.5], [0.5, 64, -34.5], [3.0, 64, -41.0]], 5.6);
bob.stay(T(205));
// Dora chases and throws TNT onto the bridge
dora.goVia([[0.5, 64, -8.5], [0.5, 64, -22.5]], 5.6);
const tThrow = T(200.5);
dora.hold(tThrow - 1, 'tnt');
dora.stay(tThrow, { look: [0.5, -29.5] });
dora.stay(tThrow + 1.5, { look: [0.5, -29.5] });
dora.hold(tThrow + 1.6, 'wooden_sword');
const tnt = { id: 500, t0: tThrow, tLand: tThrow + 1.0, tBoom: tThrow + 5.0, from: [0.5, 65.5, -22.5], to: [0.5, 64.5, -29.5] };
for (let z = -31; z <= -27; z++) blk(tnt.tBoom + (Math.abs(z + 29)) * 0.04, 0, 63, z, 'air', 'Dora');
buy(dora, 'TNT', T(190)); ev(tThrow, 'info', 'Dora hat TNT geworfen!', ['Dora']);
// Carl comes through
carl.goVia([[0.5, 64, 34.5], [0.5, 64, 8.5], [0.5, 64, -8.5], [0.5, 64, -20.5]], 5.6);
carl.stay(tnt.tBoom + 1.0, { look: [0.5, -29.5] });
carl.go([0.5, 64, -25.5], 4.3);
carl.hold(carl.t, 'red_sandstone');
carl.bridge(Math.max(carl.t + 0.3, tnt.tBoom + 2.2), Math.max(carl.t + 0.3, tnt.tBoom + 2.2) + 3.8, 0, -26, -31, 'red_sandstone');
carl.hold(carl.t, 'iron_sword');
carl.goVia([[0.5, 64, -34.5]], 5.6);
dora.stay(tnt.tBoom + 5.2);
dora.go([0.5, 64, -26.0], 4.3).go([0.5, 64, -34.0], 4.3);

// ---- final fights at the Rot base ---------------------------------------------------------------------------------------
const C6 = [0.5, -38.0], C7 = [4.0, -42.0], C8 = [3.0, -41.0];
const f0 = Math.max(carl.t, dora.t) + 2;
const F = (x) => f0 + (x - 216) * 1.0;             // final fights are timed relative to arrival
alice.hp(F(216), 19).hp(F(220), 15).hp(F(224), 11).hp(F(228), 8).hp(F(232), 5).hp(F(238), 0);
carl.hp(F(216), 20).hp(F(220), 17).hp(F(224), 14).hp(F(228), 11).hp(F(232), 8).hp(F(238), 5);
bob.hp(F(218), 20).hp(F(222), 18).hp(F(226), 15).hp(F(230), 12).hp(F(234), 9).hp(F(240), 6).hp(F(244), 4);
dora.hp(F(218), 16).hp(F(223), 13).hp(F(228), 10).hp(F(233), 8).hp(F(238), 6).hp(F(244), 4);
alice.hold(F(210), 'wooden_sword');
duel(alice, carl, F(216), F(238), C6, { phase: 0.3 });
ev(F(238), 'final_kill', 'Alice wurde von Carl getötet. FINAL KILL!', ['Carl', 'Alice']);
alice.die(F(238));
duel(bob, dora, F(218), F(246), C7, { phase: 2.5 });
dora.stay(F(246) + 1, { look: [3.0, -41.0] });
dora.go([-1.0, 64, -37.5], 4.3).stay(F(262));
carl.go([2.2, 64, -37.0], 5.6);
carl.hp(F(247), 6).hp(F(251), 4);
bob.hp(F(248), 4).hp(F(252), 2);
duel(carl, bob, F(248), F(257), C8, { phase: 0.9 });
ev(F(257), 'final_kill', 'Bob wurde von Carl getötet. FINAL KILL!', ['Carl', 'Bob']);
bob.die(F(257));
carl.stay(F(257) + 6, { look: [0.5, -46] });
const tWin = F(257) + 1.0;
ev(tWin, 'win', 'Team Blau hat das Spiel gewonnen!', undefined, 'Blau');
ev(tWin + 1.5, 'chat', '<Carl> gg', ['Carl']);
ev(tWin + 3.0, 'chat', '<Alice> gg, gut gespielt', ['Alice']);
ev(tWin + 5.0, 'info', 'Der Server wird in 10 Sekunden zurückgesetzt.');
const DURATION = Math.ceil(tWin + 8);
for (const a of actors) a.stay(DURATION + 1, { idle: false });
carl.hold(DURATION, 'iron_sword');

// ---------------------------------------------------------------- sample frames
const r1 = (v) => Math.round(v * 10) / 10, r3 = (v) => Math.round(v * 100) / 100;   // 0.01 block resolution
let nextId = 1000;
const items = [];
const sp = spawners.map((s) => ({ ...s, next: 5 + (s.type === 'gold' ? 25 : s.type === 'silver' ? 5 : 0), every: s.type === 'bronze' ? 0.6 : s.type === 'silver' ? 10 : 30 }));
const frames = [];
const prev = {};
let maxStep = [];
for (let tms = 0; tms <= DURATION * 1000; tms += DT) {
  const s = tms / 1000, players = {}, ents = [];
  const living = [];
  for (const a of actors) {
    if (a.isOffline(s)) continue;
    const q = a.pose(s), dead = a.isDead(s);
    const p = {
      x: r3(q.x), y: r3(q.y), z: r3(q.z), yaw: r1(normYaw(q.yaw)), pitch: r1(q.pitch), health: r1(a.health(s)),
      held: a.heldAt(s), team: s < 4 ? null : a.team, alive: !dead, spectator: dead, riding: dead ? null : a.ridingAt(s),
    };
    players[a.name] = p;
    if (!dead) living.push(p);
    const pv = prev[a.name];
    if (pv && !dead && !pv.dead) {
      const step = Math.hypot(p.x - pv.x, p.z - pv.z);
      if (step > 1.4) maxStep.push([a.name, s.toFixed(1), step.toFixed(2)]);
    }
    prev[a.name] = { x: p.x, z: p.z, dead };
  }
  // static shop villagers
  ents.push({ id: 1, type: 'villager', x: 5.5, y: 64, z: -38.5 }, { id: 2, type: 'villager', x: 5.5, y: 64, z: 39.5 });
  // resource drops
  if (s >= 4) for (const sps of sp) {
    while (s >= sps.next) {
      const mine = items.filter((i) => i.sp === sps);
      if (mine.length >= 4) items.splice(items.indexOf(mine[0]), 1);
      items.push({ id: nextId++, sp: sps, x: sps.x + ((nextId * 37 % 10) - 5) * 0.06, z: sps.z + ((nextId * 53 % 10) - 5) * 0.06 });
      sps.next += sps.every;
    }
  }
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (living.some((p) => Math.hypot(p.x - it.x, p.z - it.z) < 1.3 && Math.abs(p.y - 64) < 1.6)) items.splice(i, 1);
  }
  for (const it of items) ents.push({ id: it.id, type: 'item', x: r3(it.x), y: 64.3, z: r3(it.z) });
  for (const a of arrows) if (s >= a.t0 && s < a.t1) {
    const u = (s - a.t0) / (a.t1 - a.t0);
    ents.push({ id: a.id, type: 'arrow', x: r3(a.from[0] + (a.to[0] - a.from[0]) * u), y: r3(a.from[1] + (a.to[1] - a.from[1]) * u + 0.8 * Math.sin(Math.PI * u)), z: r3(a.from[2] + (a.to[2] - a.from[2]) * u) });
  }
  if (s >= tnt.t0 && s < tnt.tBoom) {
    const u = Math.min(1, (s - tnt.t0) / (tnt.tLand - tnt.t0));
    ents.push({ id: tnt.id, type: 'tnt', x: r3(tnt.from[0] + (tnt.to[0] - tnt.from[0]) * u), y: r3(tnt.from[1] + (tnt.to[1] - tnt.from[1]) * u + 2.2 * Math.sin(Math.PI * u)), z: r3(tnt.from[2] + (tnt.to[2] - tnt.from[2]) * u) });
  }
  const cp = carl.ridingAt(s);
  if (cp && players.Carl) ents.push({ id: 700, type: 'chicken', x: players.Carl.x, y: r3(players.Carl.y + 1.5), z: players.Carl.z });
  frames.push({ t: tms, players, entities: ents });
}
if (maxStep.length) warn('large per-frame steps (expect only duel/respawn snaps):', JSON.stringify(maxStep.slice(0, 12)), maxStep.length > 12 ? `(+${maxStep.length - 12} more)` : '');

events.sort((a, b) => a.t - b.t);
blockEvents.sort((a, b) => a.t - b.t);
const replay = {
  version: 1,
  meta: {
    map: 'Rewi',
    recordedAt: '2026-10-23T22:00:00Z',
    durationMs: DURATION * 1000,
    sampleHz: 10,
    teams: {
      Rot: { color: '#e53935', bed: [0, 64, -47], spawn: [0.5, 64, -39.5] },
      Blau: { color: '#1e88e5', bed: [0, 64, 47], spawn: [0.5, 64, 40.5] },
    },
    spawners,
    players: actors.map((a) => ({ name: a.name, team: a.team })),
    winner: 'Blau',
  },
  initialBlocks,
  blocks: blockEvents,
  frames,
  events,
};
fs.writeFileSync(OUT, JSON.stringify(replay));
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`wrote ${OUT}: ${frames.length} frames, ${blockEvents.length} block changes, ${events.length} events, ${initialBlocks.length} initial blocks, ${DURATION}s, ${kb} KiB`);
