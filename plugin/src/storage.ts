// Plugin data folder (`plugins/data/lan-bedwars/` on the server) through WASI. The host preopens it as "data" when
// the plugin declares the `fs.write.data` permission. Everything here fails soft: without the folder the plugin
// simply runs with its built-in configuration.
import { getDirectories } from 'wasi:filesystem/preopens@0.2.12'
import type { Descriptor } from 'wasi:filesystem/types@0.2.12'

let root: Descriptor | null | undefined

function dataDir (): Descriptor | null {
  if (root === undefined) {
    try { root = getDirectories().find(([, name]) => name === 'data')?.[0] ?? null } catch { root = null }
  }
  return root
}

// (QuickJS has no TextEncoder / TextDecoder)
export function encodeUtf8 (text: string): Uint8Array {
  const out: number[] = []
  for (const ch of text) {
    const c = ch.codePointAt(0)!
    if (c < 0x80) out.push(c)
    else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63))
    else if (c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    else out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
  }
  return Uint8Array.from(out)
}

export function decodeUtf8 (bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i]
    const n = b < 0x80 ? 1 : b < 0xE0 ? 2 : b < 0xF0 ? 3 : 4
    let c = n === 1 ? b : b & (0xFF >> (n + 1))
    for (let k = 1; k < n; k++) c = (c << 6) | (bytes[i + k] & 63)
    out += String.fromCodePoint(c)
    i += n
  }
  return out
}

/** Text of `data/<path>`, or null when it does not exist (or there is no data folder). */
export function readData (path: string): string | null {
  const dir = dataDir()
  if (!dir) return null
  try {
    const file = dir.openAt({}, path, {}, { read: true })
    const size = Number(file.stat().size)
    const chunks: Uint8Array[] = []
    let offset = 0
    while (offset < size) {
      const [bytes, end] = file.read(Math.min(65536, size - offset), offset)
      chunks.push(Uint8Array.from(bytes))
      offset += bytes.length
      if (end || bytes.length === 0) break
    }
    const all = new Uint8Array(offset)
    let at = 0
    for (const c of chunks) { all.set(c, at); at += c.length }
    return decodeUtf8(all)
  } catch {
    return null
  }
}

/** Writes `data/<path>` (created or replaced). Returns false when that is not possible. */
export function writeData (path: string, text: string): boolean {
  const dir = dataDir()
  if (!dir) return false
  try {
    const file = dir.openAt({}, path, { create: true, truncate: true }, { write: true })
    const bytes = encodeUtf8(text)
    let offset = 0
    while (offset < bytes.length) offset += Number(file.write(bytes.subarray(offset), offset))
    return true
  } catch {
    return false
  }
}

/** File names in `data/<path>` (empty when the folder does not exist). */
export function listData (path: string): string[] {
  const dir = dataDir()
  if (!dir) return []
  try {
    const sub = dir.openAt({}, path, { directory: true }, { read: true })
    const stream = sub.readDirectory()
    const names: string[] = []
    for (let entry = stream.readDirectoryEntry(); entry; entry = stream.readDirectoryEntry()) {
      if (entry.type === 'regular-file') names.push(entry.name)
    }
    return names.sort()
  } catch {
    return []
  }
}
