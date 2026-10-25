// Shared helpers for botd.js, recorder.js and round.js: map geometry, text cleanup, chat parsing.
'use strict'

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** Strips legacy colour codes (section sign and ampersand) and JSON quotes. */
function clean (s) {
  if (s == null) return ''
  if (typeof s === 'object') s = JSON.stringify(s)
  return String(s).replace(/[§&][0-9a-fk-orx]/gi, '').replace(/^"|"$/g, '').trim()
}

/** Lower-case, diacritics-free key for fuzzy name comparisons ("Café" -> "cafe"). */
function norm (s) {
  return clean(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]/g, '').trim()
}

// ---------------------------------------------------------------- chat parsing (the English messages of plugin/src/text.ts)
/**
 * Turns a plain chat line into a typed event or null.
 * Types: join leave bed_destroyed kill death win team_selected game_start chat info
 */
function parseChat (raw) {
  const text = clean(raw).replace(/^\[BW\]\s*/, '')
  let m
  if ((m = /^The bed of team (\S+) was destroyed/.exec(text))) return { type: 'bed_destroyed', team: m[1], text }
  if ((m = /^(\S+) was killed by (\S+?)!/.exec(text))) return { type: 'kill', players: [m[2], m[1]], text }
  if ((m = /^(\S+) died!/.exec(text))) return { type: 'death', players: [m[1]], text }
  if ((m = /^Team (\S+) won the game in /.exec(text))) return { type: 'win', team: m[1], text }
  if ((m = /^(\S+) joined the game! \[(\d+)\/(\d+)\]/.exec(text))) return { type: 'join', players: [m[1]], text }
  if ((m = /^(\S+) left the game/.exec(text))) return { type: 'leave', players: [m[1]], text }
  if ((m = /^Selected team: (\S+)/.exec(text))) return { type: 'team_selected', team: m[1], text }
  if (/^Game started|Game over/.test(text)) return { type: 'info', text }
  return null
}

/** True for lines the agent does not need to see (server noise). */
function isNoise (text) {
  return /(joined|left) the game$|has made the advancement|\[OCM\]|Set modeset|^\s*$/.test(text)
}

module.exports = { sleep, clean, norm, parseChat, isNoise }
