// Shared helpers for botd.js, recorder.js and round.js: map geometry, text cleanup, chat parsing.
'use strict'

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** Strips legacy colour codes (section sign and ampersand) and JSON quotes. */
function clean (s) {
  if (s == null) return ''
  if (typeof s === 'object') s = JSON.stringify(s)
  return String(s).replace(/[§&][0-9a-fk-orx]/gi, '').replace(/^"|"$/g, '').trim()
}

/** Lower-case, diacritics-free key for fuzzy name comparisons ("Blöcke" -> "blocke"). */
function norm (s) {
  return clean(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]/g, '').trim()
}

// ---------------------------------------------------------------- chat parsing (language_de.yml of ScreamingBedWars 0.2.44)
/**
 * Turns a plain chat line into a typed event or null.
 * Types: join leave bed_destroyed kill death win team_selected game_start chat info
 */
function parseChat (raw) {
  const text = clean(raw).replace(/^\[BW\]\s*/, '')
  let m
  if ((m = /^Das Bett von Team (\S+) wurde zerstört/.exec(text))) return { type: 'bed_destroyed', team: m[1], text }
  if ((m = /^Spieler (\S+) hat (\S+) getötet/.exec(text))) return { type: 'kill', players: [m[1], m[2]], text }
  if ((m = /^Spieler (\S+) ist gestorben/.exec(text))) return { type: 'death', players: [m[1]], text }
  if ((m = /^Das Team (\S+) hat das Spiel in .* gewonnen/.exec(text))) return { type: 'win', team: m[1], text }
  if ((m = /^(\S+) tritt dem Spiel bei! \[(\d+)\/(\d+)\]/.exec(text))) return { type: 'join', players: [m[1]], text }
  if ((m = /^(\S+) hat das Spiel verlassen/.exec(text))) return { type: 'leave', players: [m[1]], text }
  if ((m = /^Ausgewähltes Team: (\S+)/.exec(text))) return { type: 'team_selected', team: m[1], text }
  if (/^Spiel hat begonnen|Spiel vorbei/.test(text)) return { type: 'info', text }
  return null
}

/** True for lines the agent does not need to see (server noise). */
function isNoise (text) {
  return /joined the game|left the game|has made the advancement|\[OCM\]|Set modeset|^\s*$/.test(text)
}

module.exports = { sleep, clean, norm, parseChat, isNoise }
