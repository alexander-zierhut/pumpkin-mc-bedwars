#!/usr/bin/env node
'use strict';
/*
 * Embeds a replay into a copy of viewer.html so it can be published as one self-contained file.
 *
 *   node embed.js <replay.json> <out.html> [--raw] [--artifact] [--viewer path/to/viewer.html]
 *
 * By default the replay is compacted before embedding (the viewer understands the result):
 *   - player x/y/z rounded to 0.01, yaw/pitch/health to 0.1; entity coordinates to 0.01
 *   - per player, fields that are unchanged since that player's previous frame are omitted
 *     (the viewer carries them forward; a player that is absent from a frame still counts as absent)
 *   - a frame whose entity list equals the previous frame's gets "entitiesSame": true instead of the list
 * --raw embeds the JSON exactly as given. The data is escaped so it can never terminate the <script> tag.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (f) => { const i = args.indexOf(f); if (i < 0) return false; args.splice(i, 1); return true; };
const raw = flag('--raw');
// --artifact: publishable page body (the host adds doctype/html/head/body itself); title named after the map
const artifact = flag('--artifact');
let viewerPath = path.join(__dirname, 'viewer.html');
{
  const i = args.indexOf('--viewer');
  if (i >= 0) { viewerPath = args[i + 1]; args.splice(i, 2); }
}
if (args.length !== 2) {
  console.error('usage: node embed.js <replay.json> <out.html> [--raw] [--viewer viewer.html]');
  process.exit(2);
}
const [inFile, outFile] = args;

const r2 = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const r1 = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v);

function compact(data) {
  if (!data || !Array.isArray(data.frames)) return data;
  const last = Object.create(null);
  let prevEnts = null;
  const frames = data.frames.map((f) => {
    const out = { t: f.t };
    if (f.players) {
      out.players = {};
      for (const name of Object.keys(f.players)) {
        const p = f.players[name];
        if (!p || typeof p !== 'object') { out.players[name] = p; continue; }
        const q = { ...p };
        for (const k of ['x', 'y', 'z']) if (k in q) q[k] = r2(q[k]);
        for (const k of ['yaw', 'pitch', 'health']) if (k in q) q[k] = r1(q[k]);
        const prev = last[name];
        const e = {};
        for (const k of Object.keys(q)) if (!prev || prev[k] !== q[k]) e[k] = q[k];
        last[name] = { ...(prev || {}), ...q };
        out.players[name] = e;
      }
    }
    if (f.entities) {
      const ents = f.entities.map((e) => (e ? { ...e, x: r2(e.x), y: r2(e.y), z: r2(e.z) } : e));
      const sig = JSON.stringify(ents);
      if (sig === prevEnts) out.entitiesSame = true; else out.entities = ents;
      prevEnts = sig;
    }
    for (const k of Object.keys(f)) if (!(k in out) && k !== 'entities' && k !== 'players') out[k] = f[k];
    return out;
  });
  return { ...data, frames };
}

let data;
try { data = JSON.parse(fs.readFileSync(inFile, 'utf8')); }
catch (e) { console.error(`cannot read ${inFile}: ${e.message}`); process.exit(1); }
if (!data || typeof data !== 'object' || (!Array.isArray(data.frames) && !Array.isArray(data.events))) {
  console.error(`${inFile} does not look like a replay (no frames/events)`);
  process.exit(1);
}
const payload = (raw ? data : compact(data));
// '<' only ever occurs inside JSON strings, where the escape \u003c is equivalent (this covers "</script" and "<!--")
const json = JSON.stringify(payload).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, (c) => (c === '\u2028' ? '\\u2028' : '\\u2029'));

const html = fs.readFileSync(viewerPath, 'utf8');
const open = '<script id="replay-data" type="application/json">';
const a = html.indexOf(open);
if (a < 0) { console.error(`${viewerPath}: embed marker not found`); process.exit(1); }
const b = html.indexOf('</script>', a + open.length);
if (b < 0) { console.error(`${viewerPath}: unterminated embed script tag`); process.exit(1); }
fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
let page = html.slice(0, a + open.length) + json + html.slice(b);
if (artifact) {
  const map = data.meta && data.meta.map ? String(data.meta.map).replace(/[<>&]/g, '') : '';
  page = page
    .replace(/^<!doctype html>\s*/i, '')
    .replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*$/i, '')
    .replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '')
    .replace(/<body>\s*/i, '').replace(/<\/body>\s*/i, '')
    .replace(/<meta charset="utf-8">\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '')
    .replace(/<title>[^<]*<\/title>/i, `<title>${map ? `BedWars ${map} Replay` : 'BedWars Replay'}</title>`);
}
fs.writeFileSync(outFile, page);
const kb = (n) => (n / 1024).toFixed(0) + ' KiB';
console.log(`wrote ${outFile}: ${kb(fs.statSync(outFile).size)} (input ${kb(fs.statSync(inFile).size)}, ${raw ? 'raw' : 'compacted'}, ${(data.frames || []).length} frames)`);
