// Text component JSON -> legacy § string, the inverse of TextComponent.fromLegacyString. Names that the plugin did not
// create itself (vanilla commands, items read back from disk) arrive as JSON with their own structure; two names that
// look the same convert to the same § string.

const COLOR_CODES: Record<string, string> = {
  black: '0', dark_blue: '1', dark_green: '2', dark_aqua: '3', dark_red: '4', dark_purple: '5', gold: '6', gray: '7',
  dark_gray: '8', blue: '9', green: 'a', aqua: 'b', red: 'c', light_purple: 'd', yellow: 'e', white: 'f'
}
const FLAGS: [string, string][] = [['obfuscated', 'k'], ['bold', 'l'], ['strikethrough', 'm'], ['underlined', 'n'], ['italic', 'o']]

interface Style { color?: string, [flag: string]: unknown }

/** Legacy § text of a text component given as JSON (string, object or array). Unknown colours (hex) are dropped. */
export function jsonToLegacy (json: string): string {
  let value: unknown
  try { value = JSON.parse(json) } catch { return json }
  let out = ''
  let current = '' // codes already in effect
  const emit = (text: string, style: Style) => {
    if (!text) return
    let codes = style.color && COLOR_CODES[style.color] ? `§${COLOR_CODES[style.color]}` : ''
    for (const [flag, code] of FLAGS) if (style[flag] === true || style[flag] === 1) codes += `§${code}`
    if (codes !== current) {
      // a colour code resets the formatting; without any colour, §r clears what came before
      out += codes === '' ? '§r' : (codes.startsWith('§') && !style.color && current ? '§r' : '') + codes
      current = codes
    }
    out += text
  }
  const walk = (node: unknown, inherited: Style) => {
    if (typeof node === 'string') { emit(node, inherited); return }
    if (Array.isArray(node)) { node.forEach((n, i) => walk(n, i === 0 ? inherited : inherited)); return }
    if (!node || typeof node !== 'object') return
    const o = node as Record<string, unknown>
    const style: Style = { ...inherited }
    if (typeof o.color === 'string') style.color = o.color
    for (const [flag] of FLAGS) if (flag in o) style[flag] = o[flag]
    emit(typeof o.text === 'string' ? o.text : typeof o.translate === 'string' ? o.translate : '', style)
    if (Array.isArray(o.extra)) for (const e of o.extra) walk(e, style)
  }
  walk(value, {})
  return out
}
