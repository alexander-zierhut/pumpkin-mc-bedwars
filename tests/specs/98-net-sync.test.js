// Network sync found in playtest 1: after the round start each player saw the other frozen in the lobby
// (a move packet raced the start teleport), switching shop tabs re-centred the mouse (close packet before
// the new screen), and inventory clicks snapped back for a few frames (wrong component hashes, so the
// server resent every slot the client had already predicted).
const { MAP, waitFor, waitForGameStart, sleep, useEntity } = require('../harness/bots')

// ---------------------------------------------------------------- vanilla HashOps (CRC-32C) for click hashes
// mineflayer sends full items where 26.x clients send hashes (HashedStack); this computes the hashes the
// real client puts into container_click for the components used here (names, lore).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0x82F63B78 : c >>> 1
    t[i] = c >>> 0
  }
  return t
})()
function crc32c (bytes) {
  let c = 0xFFFFFFFF
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}
const le32 = v => [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]
const hStr = s => { const b = [12, ...le32(s.length)]; for (let i = 0; i < s.length; i++) { const u = s.charCodeAt(i); b.push(u & 0xFF, u >> 8) } return crc32c(b) }
const hBool = v => crc32c([13, v ? 1 : 0])
const hList = hs => crc32c([4, ...hs.flatMap(le32), 5])
const hMap = es => crc32c([2, ...es.sort((x, y) => x[0] - y[0] || x[1] - y[1]).flatMap(([k, v]) => [...le32(k), ...le32(v)]), 3])
const BOOL_KEYS = new Set(['bold', 'italic', 'underlined', 'strikethrough', 'obfuscated'])
/** Hash of a text component given as prismarine-nbt (what the client decoded from our set_slot). */
function hText (tag) {
  if (tag.type === 'string') return hStr(tag.value)
  if (tag.type === 'list') return hList(tag.value.value.map(v => hText({ type: tag.value.type, value: v })))
  if (tag.type !== 'compound') throw new Error(`text tag ${tag.type}`)
  const keys = Object.keys(tag.value)
  if (keys.length === 1 && keys[0] === 'text') return hStr(tag.value.text.value)
  return hMap(keys.map(k => {
    const v = tag.value[k]
    if (BOOL_KEYS.has(k)) return [hStr(k), hBool(v.value !== 0)]
    if (k === 'extra') return [hStr(k), hList(v.value.value.map(x => hText({ type: v.value.type, value: x })))]
    if (v.type === 'string') return [hStr(k), hStr(v.value)]
    throw new Error(`text key ${k}`)
  }))
}
const COMPONENT_HASH = {
  custom_name: data => hText(data),
  lore: data => hList(data.map(hText))
}
/** HashedSlot of a prismarine item, as a 26.x client sends it. */
function hashedSlot (item) {
  if (!item) return undefined
  return {
    itemId: item.type,
    itemCount: item.count,
    components: (item.components || []).map(c => {
      const f = COMPONENT_HASH[c.type]
      if (!f) throw new Error(`no hash for component ${c.type}`)
      return { type: c.type, hash: f(c.data) | 0 }
    }),
    removeComponents: (item.removedComponents || []).map(c => ({ type: c.type || c }))
  }
}

/** Counts the entity packets a bot gets about one entity id (spawn, destroy, moves). */
function watchEntity (bot) {
  const log = []
  const id = () => bot.watchedId
  bot._client.on('spawn_entity', p => { if (p.entityId === id()) log.push({ t: Date.now(), k: 'spawn', x: p.x, y: p.y, z: p.z }) })
  bot._client.on('entity_destroy', p => { if ((p.entityIds || []).includes(id())) log.push({ t: Date.now(), k: 'destroy' }) })
  bot._client.on('sync_entity_position', p => { if (p.entityId === id()) log.push({ t: Date.now(), k: 'sync', x: p.x, y: p.y, z: p.z }) })
  bot._client.on('entity_teleport', p => { if (p.entityId === id()) log.push({ t: Date.now(), k: 'teleport' }) })
  for (const k of ['rel_entity_move', 'entity_move_look']) bot._client.on(k, p => { if (p.entityId === id()) log.push({ t: Date.now(), k: 'move' }) })
  return log
}

module.exports = {
  name: 'net-sync',
  timeout: 240000,
  async run (t) {
    const a = await t.bot('NetA')
    const b = await t.bot('NetB')
    const aLog = watchEntity(a)
    const bLog = watchEntity(b)
    await waitFor(() => a.players.NetB && a.players.NetB.entity && b.players.NetA && b.players.NetA.entity, { timeout: 20000, what: 'bots see each other in the lobby' })
    a.watchedId = a.players.NetB.entity.id
    b.watchedId = b.players.NetA.entity.id
    t.check('the bots see each other in the lobby', true)

    // real players move the mouse all the time: a movement packet every tick, also while the start teleports them
    let yaw = 0
    const spin = setInterval(() => { yaw += 0.3; for (const bot of [a, b]) bot.look(yaw, 0, true) }, 50)
    for (const bot of [a, b]) bot.setControlState('jump', true)
    const [teamA, teamB] = await Promise.all([waitForGameStart(a), waitForGameStart(b)])
    clearInterval(spin)
    for (const bot of [a, b]) bot.setControlState('jump', false)
    t.log('teams', teamA, teamB)
    await sleep(1500)
    const seen = (viewer, name) => viewer.players[name] && viewer.players[name].entity
    const near = (e, team) => e && e.position.distanceTo(MAP.teams[team].spawn) < 4
    t.check('after the start NetA sees NetB on its island', near(seen(a, 'NetB'), teamB),
      { seen: seen(a, 'NetB') && seen(a, 'NetB').position, real: b.entity.position, packets: aLog.slice(-6) })
    t.check('after the start NetB sees NetA on its island', near(seen(b, 'NetA'), teamA),
      { seen: seen(b, 'NetA') && seen(b, 'NetA').position, real: a.entity.position, packets: bLog.slice(-6) })

    // both jump: the other one has to see the movement
    const since = Date.now()
    const y0 = { a: a.entity.position.y, b: b.entity.position.y }
    let maxA = -Infinity; let maxB = -Infinity
    const sample = setInterval(() => {
      const ea = seen(b, 'NetA'); const eb = seen(a, 'NetB')
      if (ea) maxA = Math.max(maxA, ea.position.y)
      if (eb) maxB = Math.max(maxB, eb.position.y)
    }, 25)
    a.setControlState('jump', true); b.setControlState('jump', true)
    await sleep(1500)
    a.setControlState('jump', false); b.setControlState('jump', false)
    await sleep(500)
    clearInterval(sample)
    t.check('NetA sees NetB jump on its island', maxB > y0.b + 0.5, { maxB, y0: y0.b, moves: aLog.filter(e => e.t >= since && e.k === 'move').length })
    t.check('NetB sees NetA jump on its island', maxA > y0.a + 0.5, { maxA, y0: y0.a, moves: bLog.filter(e => e.t >= since && e.k === 'move').length })
    t.log('A packets about B', aLog)
    t.log('B packets about A', bLog)

    // ---------------------------------------------------------------- shop tabs (point 3)
    const closes = []
    a._client.on('close_window', p => closes.push({ t: Date.now(), id: p.windowId }))
    let opened = 0
    a.on('windowOpen', () => { opened++ })
    const v = Object.values(a.entities).filter(e => e.name === 'villager')
      .sort((x, y) => x.position.distanceTo(a.entity.position) - y.position.distanceTo(a.entity.position))[0]
    t.check('a shopkeeper is visible', !!v)
    if (v) {
      await t.server.cmd(`execute as NetA at @s run tp @s ${v.position.x - Math.sign(v.position.x) * 1.5} ${v.position.y} ${v.position.z}`)
      await sleep(1200)
      await a.lookAt(v.position.offset(0, 1.2, 0), true)
      useEntity(a, v)
      await waitFor(() => opened >= 1 && a.currentWindow, { timeout: 8000, what: 'shop window' }).catch(() => {})
      const first = a.currentWindow
      t.check('the shop opens', !!first)
      const ids = [first && first.id]
      for (const tab of [1, 2]) {
        const n = opened
        a.clickWindow(tab, 0, 0).catch(() => {})
        await waitFor(() => opened > n, { timeout: 5000, what: `shop tab ${tab}` }).catch(() => {})
        ids.push(a.currentWindow && a.currentWindow.id)
      }
      t.check('clicking the category tabs opens each page', opened >= 3 && new Set(ids).size === 3, { opened, ids })
      t.check('switching tabs sends no close_window (the client keeps the mouse where it is)', closes.length === 0, closes)
      a.closeWindow(a.currentWindow)
      await sleep(500)
    }

    // ---------------------------------------------------------------- inventory clicks (point 4)
    await t.server.cmd('clear NetA')
    await t.server.cmd('bw cheat give bronze 10 NetA')
    const from = await waitFor(() => { const i = a.inventory.slots.findIndex((it, i) => i >= 9 && it && it.name === 'brick'); return i >= 0 && { i } }, { timeout: 5000, what: 'bronze in the inventory' }).then(r => r.i, () => -1)
    const named = from >= 0 && a.inventory.slots[from]
    t.check('the bronze is a named item', !!named && (named.components || []).some(c => c.type === 'custom_name'), named && named.components)
    // self check of the hasher against the vanilla 26.3 client: §6Bronze, not italic
    t.check('test hasher matches the vanilla client', (hText({ type: 'compound', value: { text: { type: 'string', value: '' }, italic: { type: 'byte', value: 0 }, extra: { type: 'list', value: { type: 'compound', value: [{ text: { type: 'string', value: 'Bronze' }, color: { type: 'string', value: 'gold' } }] } } } }) | 0) === -661018398)
    if (named) {
      let stateId = -1
      const echoes = []
      a._client.on('window_items', p => { stateId = p.stateId; echoes.push({ k: 'window_items' }) })
      a._client.on('set_slot', p => { stateId = p.stateId; echoes.push({ k: 'set_slot', slot: p.slot, window: p.windowId }) })
      a._client.on('set_cursor_item', () => echoes.push({ k: 'set_cursor_item' }))
      a._client.on('set_player_inventory', p => echoes.push({ k: 'set_player_inventory', slot: p.slotId }))
      // a fresh full state for the state id
      a._client.write('window_click', { windowId: 0, stateId: -1, slot: -999, mouseButton: 2, mode: 5, changedSlots: [], cursorItem: undefined })
      await waitFor(() => stateId >= 0, { timeout: 3000, what: 'state id' }).catch(() => {})
      await sleep(300)
      const to = a.inventory.slots.findIndex((it, i) => i >= 9 && i < 45 && i !== from && !it)
      echoes.length = 0
      // pick the stack up, then put it into an empty slot, the way a 26.x client reports it
      a._client.write('window_click', { windowId: 0, stateId, slot: from, mouseButton: 0, mode: 0, changedSlots: [{ location: from, item: undefined }], cursorItem: hashedSlot(named) })
      await sleep(400)
      a._client.write('window_click', { windowId: 0, stateId, slot: to, mouseButton: 0, mode: 0, changedSlots: [{ location: to, item: hashedSlot(named) }], cursorItem: undefined })
      await sleep(600)
      t.check('the server accepts the predicted clicks without resending slots', echoes.length === 0, { echoes, from, to })
      const r = String(await t.server.cmd(`data get entity NetA Inventory[{Slot:${to - 36 >= 0 ? to - 36 : to}b}]`))
      t.check('the stack is in the target slot on the server', /minecraft:brick/.test(r) && /count: 10/.test(r), r)
    }
  }
}
