// Shop spec: categories, every item of config/shop.yml (material/amount/name/price lore), buying with each currency,
// insufficient funds, shift-click, number-key hotbar buying, team colours, enchants, potions.
// Layout (shop.yml "main page shows the categories in the top row and the Schnellkauf items below them"):
//   main page     slots 0..n-1 category icons, Schnellkauf items from slot 9
//   category page slots 0..n-1 category tabs (the open one glows), slot 8 the Schnellkauf button, its items from slot 9
const fs = require('fs')
const path = require('path')
const { waitFor, sleep, plain, itemName, legacyText } = require('../harness/bots')
const { loadMap } = require('../play/map')

const SHOP_YML = path.resolve(__dirname, '..', '..', 'config', 'shop.yml')

// ---------------------------------------------------------------- tiny YAML reader (block maps/lists, scalars, comments)
function parseYaml (text) {
  const toks = []
  for (const raw of text.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue
    toks.push({ indent: raw.match(/^ */)[0].length, text: raw.trim() })
  }
  let pos = 0
  const scalar = s => {
    s = s.trim()
    if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/\\(.)/g, '$1')
    if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'")
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
    if (s === 'true') return true
    if (s === 'false') return false
    return s
  }
  const isKey = s => /^[^\s"'#-][^:]*:(\s|$)/.test(s)
  const isSeq = s => s.startsWith('- ') || s === '-'
  function parseBlock (indent) { return isSeq(toks[pos].text) ? parseSeq(indent) : parseMap(indent) }
  function parseSeq (indent) {
    const out = []
    while (pos < toks.length && toks[pos].indent === indent && isSeq(toks[pos].text)) {
      const rest = toks[pos].text.slice(1).trim()
      if (isKey(rest)) { toks[pos] = { indent: indent + 2, text: rest }; out.push(parseMap(indent + 2)) } else { out.push(scalar(rest)); pos++ }
    }
    return out
  }
  function parseMap (indent) {
    const out = {}
    while (pos < toks.length && toks[pos].indent === indent && !isSeq(toks[pos].text)) {
      const m = toks[pos].text.match(/^([^:]+):\s*(.*)$/)
      if (!m) throw new Error('yaml: cannot parse: ' + toks[pos].text)
      pos++
      if (m[2] !== '') { out[m[1]] = scalar(m[2]); continue }
      const next = toks[pos]
      out[m[1]] = next && (next.indent > indent || (next.indent === indent && isSeq(next.text))) ? parseBlock(next.indent) : null
    }
    return out
  }
  return parseBlock(toks[0].indent)
}

// ---------------------------------------------------------------- expected model from config/shop.yml
// item names / lore arrive as NBT text components (26.x); txt() turns them into § strings
let REGISTRY = null
const txt = v => v == null ? v : (typeof v === 'string' && !v.startsWith('{') ? v : legacyText(REGISTRY, v))
const strip = s => String(s == null ? '' : txt(s)).replace(/[§&][0-9a-fk-or]/gi, '')
const lead = s => { const m = String(s == null ? '' : txt(s)).match(/[§&]([0-9a-f])/i); return m ? m[1].toLowerCase() : null } // first colour code of a (raw) name
const hasAmp = s => /&[0-9a-fk-or]/i.test(String(s || ''))
const CURRENCY = { // internal key -> display name in the shop + the item SBW hands out from the spawner
  bronze: { label: 'Bronze', item: 'brick', color: 'dark_red' },
  iron: { label: 'Silber', item: 'iron_ingot', color: 'gray' },
  gold: { label: 'Gold', item: 'gold_ingot', color: 'gold' }
}
const LABEL_TO_KEY = Object.fromEntries(Object.entries(CURRENCY).map(([k, v]) => [v.label, k]))
// team colour (arena file "color") -> stained glass dye; unknown colours are not asserted
const GLASS = { RED: ['red'], BLUE: ['blue'], GREEN: ['green'], YELLOW: ['yellow'], WHITE: ['white'], ORANGE: ['orange'], PINK: ['pink'], GRAY: ['light_gray'], CYAN: ['cyan'], PURPLE: ['purple'], LIME: ['lime'] }
// does a dyed leather RGB look like the team colour? (null = no opinion for that colour)
const LOOKS = {
  RED: ([r, g, b]) => r > 140 && g < 110 && b < 110, BLUE: ([r, g, b]) => b > 140 && r < 110,
  GREEN: ([r, g, b]) => g > 140 && r < 140 && b < 140, YELLOW: ([r, g, b]) => r > 180 && g > 180 && b < 120
}
const PRICE_LABEL = /^(Price|Preis|Kosten):$/i
const AMOUNT_LABEL = /^(Amount|Menge|Anzahl):$/i

function loadModel () {
  const yml = parseYaml(fs.readFileSync(SHOP_YML, 'utf8'))
  const parseStack = s => {
    if (typeof s === 'string') {
      const [type, amount, ...name] = s.split(';')
      return { type, amount: Number(amount || 1), name: name.join(';') || null, lore: [], enchants: {}, damage: null, potion: null }
    }
    return { type: s.type, amount: s.amount || 1, name: s['display-name'] || null, lore: s.lore || [], enchants: s.enchants || {}, damage: s.damage == null ? null : s.damage, potion: s['potion-type'] || null }
  }
  const item = it => {
    const [n, , res] = String(it.price).split(' ')
    const props = it.properties == null ? [] : Array.isArray(it.properties) ? it.properties : [it.properties]
    return { price: Number(n), res, stack: parseStack(it.stack), colorByTeam: props.includes('applycolorbyteam') }
  }
  // top-level entries are either categories (with items) or Schnellkauf items (with a price) shown on the main page
  const categories = yml.data.filter(e => e.items).map(cat => ({ icon: parseStack(cat.stack), items: cat.items.map(item) }))
  categories.quick = yml.data.filter(e => e.price != null).map(item)
  return categories
}

// ---------------------------------------------------------------- bot-side helpers
function attach (bot) {
  bot._wo = { n: 0 }
  bot.on('windowOpen', () => { bot._wo.n++ })
}

async function click (bot, slot, button = 0, mode = 0) {
  const p = bot.clickWindow(slot, button, mode).catch(e => { bot._clickErr = e.message })
  await Promise.race([p, sleep(2500)])
}

async function waitNewWindow (bot, prevN, what) {
  return waitFor(() => bot._wo.n > prevN && bot.currentWindow, { timeout: 8000, what: what || 'a new shop window' })
}

async function openShop (bot) {
  if (bot.currentWindow) { bot.closeWindow(bot.currentWindow); await sleep(250) }
  const n = bot._wo.n
  const v = Object.values(bot.entities).filter(e => e.name === 'villager')
    .sort((x, y) => x.position.distanceTo(bot.entity.position) - y.position.distanceTo(bot.entity.position))[0]
  if (!v) throw new Error(`${bot.username}: no villager nearby`)
  // A real 1.8 client sends INTERACT_AT followed by INTERACT; mineflayer's activateEntity only sends INTERACT, which doesn't open the shop.
  require('../harness/bots').useEntity(bot, v)
  return waitNewWindow(bot, n, 'shop window to open')
}

let MODEL = null // set in run(); used to recognise the shop pages
const QUICK_SLOT = 8 // Schnellkauf button on category pages
// plugin/src/shop.ts UNNAMED_BLOCKS: delivered without the shop's display name
const UNNAMED_BLOCK = id => ['red_sandstone', 'end_stone', 'iron_block', 'glass', 'glowstone', 'chest', 'ladder', 'cobweb'].includes(id) || id.endsWith('_stained_glass')
const isShopPage = w => !!(w && MODEL && w.slots[0] && w.slots[0].name === MODEL[0].icon.type && w.slots[1] && w.slots[1].name === MODEL[1].icon.type)
const isMainPage = w => isShopPage(w) && !w.slots[QUICK_SLOT]

async function showCategories (bot) {
  const w = bot.currentWindow
  if (isMainPage(w)) return w
  if (isShopPage(w)) {
    const n = bot._wo.n
    await click(bot, QUICK_SLOT)
    try { return await waitNewWindow(bot, n, 'main page after Schnellkauf') } catch (e) { /* fall through */ }
  }
  return openShop(bot)
}

async function openCategory (bot, idx) {
  if (!isShopPage(bot.currentWindow)) await openShop(bot)
  const n = bot._wo.n
  bot._clickErr = null
  await click(bot, idx)
  return waitNewWindow(bot, n, `category ${idx} page`).catch(e => {
    const w = bot.currentWindow
    throw new Error(`${e.message} (${bot.username}: click error ${bot._clickErr}, window ${w ? w.slots.length : 'none'}, slot ${idx} ${w && w.slots[idx] ? w.slots[idx].name : '-'}, shop page ${isShopPage(w)})`)
  })
}

const pageItems = w => { const out = []; for (let s = 9; s <= 53; s++) if (w.slots[s]) out.push({ slot: s, item: w.slots[s] }); return out }

/** Items in the player's inventory as the client sees them (inventory part of the open window while the shop is open). */
function viewInv (bot) {
  const w = bot.currentWindow
  const res = []
  if (w && w.slots.length >= 90) { for (let s = 54; s <= 89; s++) if (w.slots[s]) res.push({ slot: s - 54 + 9 > 35 ? s - 54 + 9 - 36 : s - 54 + 9, item: w.slots[s] }) } else { for (let s = 9; s <= 44; s++) if (bot.inventory.slots[s]) res.push({ slot: s >= 36 ? s - 36 : s, item: bot.inventory.slots[s] }) }
  return res
}

/** Click a shop slot and wait for SBW's answer. Returns 'bought' | 'denied' | 'none'. */
async function buy (bot, slot, { button = 0, mode = 0, settle = 350 } = {}) {
  const mark = bot.chatLog.length
  await click(bot, slot, button, mode)
  const msgs = () => bot.chatLog.slice(mark).map(x => x.m)
  let result = 'none'
  try {
    await waitFor(() => msgs().some(m => /gekauft|nicht genug/i.test(m)), { timeout: 2500, what: 'purchase answer' })
    result = msgs().some(m => /gekauft/i.test(m)) ? 'bought' : 'denied'
  } catch (e) { /* none */ }
  await sleep(settle) // lets the companion plugin's next-tick move and the inventory packets arrive
  return { result, msgs: msgs().filter(m => /\[BW\]/.test(m)) }
}

// ---------------------------------------------------------------- server-side helpers
function serverApi (server, player) {
  const out = async cmd => String(await server.cmd(cmd))
  const api = {
    async count (id) { const r = await out(`clear ${player} minecraft:${id} 0`); const m = r.match(/Found (\d+)/); return m ? Number(m[1]) : 0 },
    async data (pathExpr) { const r = await out(`data get entity ${player} ${pathExpr}`); const i = r.indexOf('entity data: '); return i >= 0 ? r.slice(i + 13).trim() : null },
    async slot (n) { // {id, count} of inventory slot n (0-8 hotbar, 9-35 main) or null
      const r = await out(`data get entity ${player} Inventory[{Slot:${n}b}]`)
      const id = r.match(/id: "minecraft:([a-z_]+)"/); const count = r.match(/count: (\d+)/)
      return id && count ? { id: id[1], count: Number(count[1]) } : null
    },
    async inv () { const o = {}; for (let n = 0; n < 36; n++) { const s = await api.slot(n); if (s) o[n] = s } return o },
    async clear () { await out(`clear ${player}`) },
    async give (key, n) {
      const c = CURRENCY[key]
      if (n > 0) await out(`give ${player} minecraft:${c.item}[custom_name={extra:[{text:"${c.label}",color:"${c.color}",italic:0b,underlined:0b,bold:0b,strikethrough:0b,obfuscated:0b}],text:""}] ${n}`)
    },
    async put (slotName, key, n) { // put a currency item into a named slot (hotbar.N / inventory.N)
      const c = CURRENCY[key]
      await out(`item replace entity ${player} ${slotName} with minecraft:${c.item}[custom_name={extra:[{text:"${c.label}",color:"${c.color}",italic:0b,underlined:0b,bold:0b,strikethrough:0b,obfuscated:0b}],text:""}] ${n}`)
    },
    async putItem (slotName, id, n) { await out(`item replace entity ${player} ${slotName} with minecraft:${id} ${n}`) },
    async rgb (id) { // dyed colour of a leather item as [r,g,b] or null
      const raw = await api.data(`Inventory[{id:"minecraft:${id}"}].components."minecraft:dyed_color"`)
      const m = raw && raw.match(/-?\d+/)
      if (!m) return { raw, rgb: null }
      const n = Number(m[0]) & 0xFFFFFF
      return { raw, rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
    },
    async money () { return { bronze: await api.count('brick'), iron: await api.count('iron_ingot'), gold: await api.count('gold_ingot') } },
    async enchants (id) {
      const raw = await api.data(`Inventory[{id:"minecraft:${id}"}].components."minecraft:enchantments"`)
      const o = {}; if (raw) for (const m of raw.matchAll(/"?minecraft:([a-z_]+)"?: (\d+)/g)) o[m[1]] = Number(m[2])
      return { raw, parsed: o }
    }
  }
  return api
}
const sumObj = o => Object.values(o).reduce((a, b) => a + b, 0)

module.exports = {
  name: '30-shop',
  timeout: 360000,
  server: { pauseCountdown: 10 }, // default heap (1G); the harness caps the container at 1800 MB, a bigger -Xmx gets OOM-killed
  async run (t) {
    const model = loadModel()
    MODEL = model
    REGISTRY = require('prismarine-registry')('26.1')
    const map = loadMap()
    const totalItems = model.reduce((s, c) => s + c.items.length, 0)
    t.log(`model: ${model.length} categories, ${totalItems} items`)

    const a = await t.bot('ShopA')
    const b = await t.bot('ShopB')
    attach(a); attach(b)
    // harness waitForGameStart/teamOf hard-code the Rewi coordinates; derive the team from the arena file instead
    const nearTeam = bot => { // team whose spawn the bot stands at (within 12 blocks), else null
      const p = bot.entity.position
      for (const tm of map.teamNames) { const sp = map.teams[tm].spawn; if (Math.hypot(p.x - sp.x, p.z - sp.z) < 12 && Math.abs(p.y - sp.y) < 6) return tm }
      return null
    }
    const waitStart = async bot => { await waitFor(() => nearTeam(bot), { timeout: 90000, what: `${bot.username} to be teleported to a team spawn` }); await sleep(500); return nearTeam(bot) }
    const teams = await Promise.all([waitStart(a), waitStart(b)])
    t.check('game started, two teams', teams[0] !== teams[1], teams)
    await sleep(1000)
    const srvA = serverApi(t.server, 'ShopA')
    const srvB = serverApi(t.server, 'ShopB')
    const teamA = teams[0]
    const teamB = teams[1]
    // positions are read from the arena file: next to the team's shop villager, and on the team's own spawners
    const standPos = team => { const p = map.named('shop', team); return `${p.x.toFixed(2)} ${p.y} ${p.z.toFixed(2)}` }
    const stand = (bot, team) => `tp ${bot.username} ${standPos(team)}`
    const spawnerPos = (type, team) => { const s = map.spawners.find(x => x.type === type && (x.team === team || x.team === null)) || map.spawners.find(x => x.type === type); return `${s.x} ${s.y} ${s.z}` }
    const dye = team => GLASS[String(map.teams[team].colorName).toUpperCase()] || null
    const glassId = team => (dye(team) ? `${dye(team)[0]}_stained_glass` : null)
    const looksTeam = (team, rgb) => { const f = LOOKS[String(map.teams[team].colorName).toUpperCase()]; return f ? f(rgb) : null }
    // locate shop items by what they are instead of by index (the Schnellkauf items are not a category)
    const locate = (pred, from = 0) => { for (let ci = from; ci < model.length; ci++) { const ii = model[ci].items.findIndex(pred); if (ii >= 0) return { ci, ii, it: model[ci].items[ii] } } return null }
    const byType = (type, res, price) => locate(it => it.stack.type === type && (res == null || it.res === res) && (price == null || it.price === price))

    // ------------------------------------------------------------ B: collect real spawner output, then use it in the shop
    const rgbs = {}
    const flowB = (async () => {
      const spots = { bronze: spawnerPos('bronze', teamB), iron: spawnerPos('silver', teamB), gold: spawnerPos('gold', null) }
      await srvB.clear()
      const got = {}
      const t0 = Date.now()
      for (const key of ['bronze', 'iron', 'gold']) {
        await t.server.cmd(`tp ShopB ${spots[key]}`)
        const id = CURRENCY[key].item
        await waitFor(() => b.inventory.items().some(i => i.name === id), { timeout: key === 'gold' ? 80000 : 30000, what: `${key} pickup` }).catch(() => {})
        got[key] = await srvB.count(id)
      }
      t.log('B spawner pickups', got, `${Math.round((Date.now() - t0) / 1000)}s`)
      t.check('spawners produce bronze, silver and gold items that a player can pick up', got.bronze > 0 && got.iron > 0 && got.gold > 0, got)
      const names = {}
      for (const key of ['bronze', 'iron', 'gold']) {
        names[key] = await srvB.data(`Inventory[{id:"minecraft:${CURRENCY[key].item}"}].components."minecraft:custom_name".extra[0].text`)
      }
      t.check('spawner items carry the resource names Bronze / Silber / Gold', names.bronze === '"Bronze"' && names.iron === '"Silber"' && names.gold === '"Gold"', names)
      await t.server.cmd('tp ShopB ' + standPos(teamB)) // away from the spawners, next to the shop
      await sleep(600)
      // spend real spawner output: one purchase per currency (cheapest item outside the overview that the pickup can pay for)
      for (const key of ['bronze', 'iron', 'gold']) {
        let pick = null
        for (let ci = 0; ci < model.length; ci++) model[ci].items.forEach((it, ii) => { if (it.res === key && !it.colorByTeam && it.price <= Math.max(got[key], 1) && (!pick || it.price < pick.it.price)) pick = { ci, ii, it } })
        if (!pick) { t.check(`spawner-dropped ${CURRENCY[key].label} can be spent in the shop`, false, 'no affordable item found'); continue }
        const { ci, ii, it } = pick
        const id = it.stack.type
        const before = await srvB.money(); const haveBefore = await srvB.count(id)
        await openShop(b)
        const w = await openCategory(b, ci)
        const r = await buy(b, pageItems(w)[ii].slot)
        const after = await srvB.money(); const haveAfter = await srvB.count(id)
        const ok = r.result === 'bought' && after[key] === before[key] - it.price && haveAfter - haveBefore === it.stack.amount
        t.check(`spawner-dropped ${CURRENCY[key].label} is accepted by the shop (${strip(it.stack.name)} for ${it.price} ${CURRENCY[key].label})`, ok, { result: r.result, before, after, got: haveAfter - haveBefore, msgs: r.msgs })
      }
      // second team: team colours (glass + leather) follow the team of the buyer
      await srvB.clear(); await srvB.give('bronze', 30)
      const gl = locate(it => it.colorByTeam && it.stack.type === 'glass')
      const wB = await openCategory(b, gl.ci)
      const glassItem = pageItems(wB)[gl.ii].item
      const gd = dye(teamB)
      const glassOk = !gd || glassItem.name === glassId(teamB)
      await buy(b, pageItems(wB)[gl.ii].slot)
      const ownGlass = gd ? await srvB.count(glassId(teamB)) : null
      const otherGlass = dye(teamA) && glassId(teamA) !== glassId(teamB) ? await srvB.count(glassId(teamA)) : 0
      t.check(`second team (${teamB}): Glas is stained glass in the team colour ${map.teams[teamB].colorName} (shown and bought as ${glassId(teamB)})`, glassOk && (ownGlass == null || ownGlass === gl.it.stack.amount) && otherGlass === 0, { shown: glassItem.name, ownGlass, otherGlass })
      const colourProblems = []
      for (const id of ['leather_helmet', 'leather_leggings', 'leather_boots']) {
        const lt = locate(it => it.stack.type === id)
        const wr = await openCategory(b, lt.ci)
        await buy(b, pageItems(wr)[lt.ii].slot)
        const c = await srvB.rgb(id)
        const look = looksTeam(teamB, c.rgb || [0, 0, 0])
        if (look === false || !c.rgb) colourProblems.push(`${id}: ${JSON.stringify(c.rgb)} (raw ${c.raw}) does not look ${map.teams[teamB].colorName}`)
        rgbs[`B:${id}`] = c.rgb
      }
      t.check(`second team (${teamB}): leather armour is dyed in the team colour (and differs from the other team)`, colourProblems.length === 0, colourProblems.length ? colourProblems : { second: rgbs['B:leather_helmet'], first: rgbs['A:leather_helmet'] })
      if (b.currentWindow) b.closeWindow(b.currentWindow)
    })().catch(e => { t.check('bot B flow completed without crashing', false, e.stack || String(e)) })

    // ------------------------------------------------------------ A: structure
    await t.server.cmd('clear ShopA')
    await t.server.cmd(stand(a, teamA))
    await sleep(800)
    const w0 = await openShop(a)
    const title = legacyText(a.registry, w0.title)
    t.check('shop opens (chest GUI, 54 slots, title "Shop - Schnellkauf")', w0.slots.length === 90 && /Shop - Schnellkauf/.test(plain(title)), { title, slots: w0.slots.length })

    // categories in configured order in the top row
    const catItems = model.map((c, i) => ({ slot: i, item: w0.slots[i] })).filter(x => x.item)
    const catProblems = []
    model.forEach((c, i) => {
      const got = w0.slots[i]
      const expName = strip(c.icon.name)
      if (!got) { catProblems.push(`slot ${i}: missing ${expName}`); return }
      const gotName = strip(itemName(got))
      if (gotName !== expName) catProblems.push(`slot ${i}: name '${gotName}' != '${expName}'`)
      if (got.name !== c.icon.type) catProblems.push(`slot ${i}: icon ${got.name} != ${c.icon.type}`)
    })
    t.check('categories appear in configured order with right icons in the top row of the main page', catProblems.length === 0,
      catProblems.length ? catProblems : catItems.map(x => strip(itemName(x.item))).join(' | '))
    // Schnellkauf items below the categories
    const quick = pageItems(w0)
    const quickProblems = []
    model.quick.forEach((it, i) => {
      const got = quick[i]
      const exp = it.colorByTeam && it.stack.type === 'glass' && glassId(teamA) ? glassId(teamA) : it.stack.type
      if (!got) { quickProblems.push(`#${i}: missing ${strip(it.stack.name)}`); return }
      if (got.item.name !== exp || strip(itemName(got.item)) !== strip(it.stack.name) || got.item.count !== it.stack.amount) quickProblems.push(`#${i}: ${got.item.name} x${got.item.count} '${strip(itemName(got.item))}' != ${exp} x${it.stack.amount} '${strip(it.stack.name)}'`)
    })
    if (quick.length !== model.quick.length) quickProblems.push(`${quick.length} Schnellkauf items shown, ${model.quick.length} configured`)
    t.check(`the main page shows the ${model.quick.length} Schnellkauf items below the categories`, quickProblems.length === 0, quickProblems.length ? quickProblems : quick.map(x => strip(itemName(x.item))).join(' | '))
    const rawAmpCats = catItems.filter(x => hasAmp(itemName(x.item))).map(x => itemName(x.item))
    t.check('category names have colour codes translated (no literal &x)', rawAmpCats.length === 0, rawAmpCats.length ? { literal: rawAmpCats } : 'ok')

    // every item present on its page with material/amount/name/price lore
    const pages = []
    const presenceProblems = []
    const rawAmpItems = []
    const rawAmpLore = []
    const englishLabels = new Set()
    for (let ci = 0; ci < model.length; ci++) {
      const w = await openCategory(a, ci)
      const items = pageItems(w)
      pages.push(items)
      const cat = model[ci]
      const catName = strip(cat.icon.name)
      if (items.length !== cat.items.length) presenceProblems.push(`${catName}: ${items.length} items shown, ${cat.items.length} configured`)
      cat.items.forEach((it, ii) => {
        const got = items[ii]
        const label = `${catName}/${strip(it.stack.name)}`
        if (!got) { presenceProblems.push(`${label}: missing`); return }
        const gi = got.item
        const exp = it.colorByTeam && it.stack.type === 'glass' && glassId(teamA) ? glassId(teamA) : it.stack.type
        if (gi.name !== exp) presenceProblems.push(`${label}: material ${gi.name} != ${exp}`)
        if (gi.count !== it.stack.amount) presenceProblems.push(`${label}: amount ${gi.count} != ${it.stack.amount}`)
        if (strip(itemName(gi)) !== strip(it.stack.name)) presenceProblems.push(`${label}: name '${strip(itemName(gi))}' != '${strip(it.stack.name)}'`)
        if (lead(gi.customName) !== lead(it.stack.name)) presenceProblems.push(`${label}: name colour §${lead(gi.customName)} != configured §${lead(it.stack.name)} (raw ${JSON.stringify(gi.customName)})`)
        if (hasAmp(itemName(gi))) rawAmpItems.push(`${catName}/${itemName(gi)}`)
        if ((gi.customLore || []).map(txt).some(hasAmp)) rawAmpLore.push(`${label}: ${JSON.stringify(gi.customLore)}`)
        const lore = (gi.customLore || []).map(strip)
        const pi = lore.findIndex(l => PRICE_LABEL.test(l))
        const priceLine = pi >= 0 ? lore[pi + 1] : null
        const expPrice = `${it.price} ${CURRENCY[it.res].label}`
        if (priceLine !== expPrice) presenceProblems.push(`${label}: price lore '${priceLine}' != '${expPrice}'`)
        const ai = lore.findIndex(l => AMOUNT_LABEL.test(l))
        if (pi >= 0 && /^price:?$/i.test(lore[pi])) englishLabels.add(lore[pi])
        if (ai >= 0 && /^amount:?$/i.test(lore[ai])) englishLabels.add(lore[ai])
        if (ai < 0 || lore[ai + 1] !== String(it.stack.amount)) presenceProblems.push(`${label}: amount lore '${ai >= 0 ? lore[ai + 1] : null}' != '${it.stack.amount}'`)
        for (const l of it.stack.lore) if (!lore.includes(strip(l))) presenceProblems.push(`${label}: configured lore line '${strip(l)}' missing`)
      })
    }
    t.check(`all ${totalItems} configured items are listed on their category page with material, amount, name, price and amount lore`, presenceProblems.length === 0,
      presenceProblems.length ? presenceProblems : `${totalItems} items`)
    t.check('item names have colour codes translated (no literal &x)', rawAmpItems.length === 0,
      rawAmpItems.length ? { count: rawAmpItems.length, examples: rawAmpItems.slice(0, 8) } : 'ok')

    t.check('shop lore labels are German (Preis:/Menge:) like the rest of the UI, not English "Price:"/"Amount:"', englishLabels.size === 0, englishLabels.size ? { english: [...englishLabels], source: 'config/bedwars-config.yml shop item lore (&7Price: / &7Amount:)' } : 'ok')

    // Schnellkauf button and tabs
    {
      const wc = await openCategory(a, 0)
      const button = wc.slots[QUICK_SLOT]
      const n = a._wo.n
      await click(a, QUICK_SLOT)
      const ok = await waitNewWindow(a, n).then(isMainPage).catch(() => false)
      t.check('the Schnellkauf button (slot 9) of a category page returns to the main page', !!button && strip(itemName(button)) === 'Schnellkauf' && ok, { button: button && itemName(button) })
      const w1 = isShopPage(await openCategory(a, 0)) // (mineflayer empties a window object once the next one opens)
      const w2 = await openCategory(a, 1)
      const first = pageItems(w2)[0] && strip(itemName(pageItems(w2)[0].item))
      t.check('category tabs stay in the top row, so a category can be opened from another one', w1 && isShopPage(w2) && first === strip(model[1].items[0].stack.name), { first, expected: strip(model[1].items[0].stack.name), tabs: [w1, isShopPage(w2)] })
    }

    // ------------------------------------------------------------ A: buy every item once with exact currency + 3 spare
    const itemFailures = []
    const ampMsgs = []
    const ampLore = []
    const ampBought = []
    const log = []
    for (let ci = 0; ci < model.length; ci++) {
      await openCategory(a, ci)
      const cat = model[ci]
      for (let ii = 0; ii < cat.items.length; ii++) {
        const it = cat.items[ii]
        const label = `${strip(cat.icon.name)}/${strip(it.stack.name)} (${it.price} ${CURRENCY[it.res].label})`
        const slot = pages[ci][ii] && pages[ci][ii].slot
        if (slot == null) { itemFailures.push(`${label}: not listed, cannot buy`); continue }
        await srvA.clear()
        await srvA.give(it.res, it.price + 3)
        const before = await srvA.money()
        const r = await buy(a, slot)
        const after = await srvA.money()
        const problems = []
        if (r.result !== 'bought') problems.push(`result ${r.result}: ${r.msgs.join(' / ')}`)
        for (const m of r.msgs) if (hasAmp(m)) ampMsgs.push(m)
        const expMoney = { ...before, [it.res]: before[it.res] - it.price }
        for (const k of Object.keys(expMoney)) if (after[k] !== expMoney[k]) problems.push(`${k}: ${before[k]} -> ${after[k]}, expected ${expMoney[k]}`)
        let id = it.stack.type
        if (it.colorByTeam && id === 'glass' && glassId(teamA)) id = glassId(teamA)
        const have = await srvA.count(id)
        if (have !== it.stack.amount) problems.push(`got ${have}x ${id}, expected ${it.stack.amount}`)
        // details
        const det = {}
        if (Object.keys(it.stack.enchants).length) {
          const e = await srvA.enchants(id)
          det.ench = e.parsed
          const exp = it.stack.enchants
          const same = Object.keys(exp).length === Object.keys(e.parsed).length && Object.entries(exp).every(([k, v]) => e.parsed[k] === v)
          if (!same) problems.push(`enchants ${JSON.stringify(e.parsed)} (raw ${e.raw}) != ${JSON.stringify(exp)}`)
        } else {
          const e = await srvA.enchants(id)
          if (Object.keys(e.parsed).length) problems.push(`unexpected enchants ${JSON.stringify(e.parsed)} on an item without configured enchants`)
        }
        if (it.stack.damage != null) {
          const d = await srvA.data(`Inventory[{id:"minecraft:${id}"}].components."minecraft:damage"`)
          det.damage = d
          if (Number(String(d).replace(/\D/g, '')) !== it.stack.damage) problems.push(`damage ${d} != ${it.stack.damage}`)
        } else {
          // nothing is sold pre-damaged: a bought bow has its full durability
          const d = await srvA.data(`Inventory[{id:"minecraft:${id}"}].components."minecraft:damage"`)
          if (Number(String(d).replace(/\D/g, '')) > 0) problems.push(`sold pre-damaged: damage ${d}`)
        }
        if (it.stack.potion) {
          const p = await srvA.data(`Inventory[{id:"minecraft:potion"}].components."minecraft:potion_contents"`)
          det.potion = p
          if (!p || !p.includes(`"minecraft:${it.stack.potion}"`)) problems.push(`potion_contents ${p} lacks ${it.stack.potion}`)
        }
        if (it.colorByTeam && /^leather_/.test(id)) {
          const c = await srvA.rgb(id)
          det.rgb = c.rgb; det.rawColor = c.raw
          rgbs[`A:${id}`] = c.rgb
          if (!c.rgb || looksTeam(teamA, c.rgb) === false) problems.push(`leather colour ${JSON.stringify(c.rgb)} (raw ${c.raw}) does not look ${map.teams[teamA].colorName}`)
        }
        // what the client sees of the bought item (name / lore of the purchased stack)
        const bought = viewInv(a).map(x => x.item).find(i => i.name === id && !['brick', 'iron_ingot', 'gold_ingot'].includes(i.name))
        if (bought) {
          const lore = (bought.customLore || []).map(strip)
          if (lore.some(l => PRICE_LABEL.test(l) || AMOUNT_LABEL.test(l))) problems.push('bought item still carries the shop price lore')
          const expLore = it.stack.lore.map(strip)
          if (JSON.stringify(lore) !== JSON.stringify(expLore)) problems.push(`bought item lore ${JSON.stringify(lore)} != configured ${JSON.stringify(expLore)}`)
          if (hasAmp(itemName(bought))) { det.literalAmpName = itemName(bought); ampBought.push(itemName(bought)) }
          det.name = strip(itemName(bought))
          if (UNNAMED_BLOCK(id)) {
            // building blocks are delivered without the shop name, so placed and broken blocks stack again (playtest 1, point 8)
            if (bought.customName) problems.push(`building block delivered with the name ${JSON.stringify(bought.customName)} (expected none)`)
          } else {
            if (det.name !== strip(it.stack.name)) problems.push(`bought item name '${det.name}' != '${strip(it.stack.name)}'`)
            if (lead(bought.customName) !== lead(it.stack.name)) problems.push(`bought item name colour §${lead(bought.customName)} != configured §${lead(it.stack.name)} (raw ${JSON.stringify(bought.customName)})`)
          }
          if ((bought.customLore || []).map(txt).some(hasAmp)) ampLore.push(`${label}: ${JSON.stringify(bought.customLore)}`)
        } else problems.push('bought item not found in the client inventory view (cannot verify name/lore)')
        log.push({ label, det })
        if (problems.length) itemFailures.push(`${label}: ${problems.join('; ')}`)
        t.check(`buy ${label}`, problems.length === 0, problems.length ? problems : det)
      }
    }
    t.log('per-item details', log.length)
    t.check('purchase chat messages show item names with colour codes translated (no literal &x)', ampMsgs.length === 0, ampMsgs.length ? { count: ampMsgs.length, examples: ampMsgs.slice(0, 4) } : 'ok')
    t.check('bought items keep a colour-translated name (no literal &x)', ampBought.length === 0, ampBought.length ? { count: ampBought.length, examples: ampBought.slice(0, 4) } : 'ok')
    t.check('configured lore lines (shop page and bought items) have colour codes translated (no literal &x)', ampLore.length === 0 && !rawAmpLore.length,
      ampLore.length || rawAmpLore.length ? { shop: rawAmpLore.slice(0, 4), bought: ampLore.slice(0, 4) } : 'ok')
    t.check(`every one of the ${totalItems} items can be bought for exactly its price with correct material/amount/enchants/damage/potion`, itemFailures.length === 0, itemFailures.length ? itemFailures : 'ok')

    // ------------------------------------------------------------ fixtures: items used by the scenarios below, located by type/currency (not by index)
    const priciest = pred => { let best = null; for (let ci = 0; ci < model.length; ci++) model[ci].items.forEach((it, ii) => { if (pred(it) && (!best || it.price > best.it.price)) best = { ci, ii, it } }); return best }
    const FX = {
      sand: byType('red_sandstone', 'bronze'), // multi-amount block, cheap
      end: byType('end_stone', 'bronze'), // single block with a price above 1
      ironBlock: byType('iron_block', 'iron'),
      glow: byType('glowstone', 'bronze'), // amount > 1 and price > amount (shift-buy is priced per piece)
      bow: priciest(it => it.stack.type === 'bow'), // the most expensive bow
      arrow: byType('arrow', 'gold'),
      pick: byType('iron_pickaxe', 'gold'),
      mobile: byType('armor_stand', 'iron'),
      pearl: byType('ender_pearl', 'gold')
    }
    {
      const missing = Object.entries(FX).filter(([, v]) => !v).map(([k]) => k)
      t.check('scenario fixtures (sandstone, endstone, iron block, glowstone, bow, arrow, pickaxe, mobile shop, ender pearl) exist in config/shop.yml', missing.length === 0, missing.length ? { missing } : Object.fromEntries(Object.entries(FX).map(([k, v]) => [k, `${v.it.stack.type} ${v.it.price} ${v.it.res} x${v.it.stack.amount} @${v.ci}/${v.ii}`])))
      if (missing.length) return
    }

    // ------------------------------------------------------------ A: scenario helpers
    const slotOf = fx => pages[fx.ci][fx.ii].slot
    const fund = async (m) => { await srvA.clear(); for (const [k, n] of Object.entries(m)) await srvA.give(k, n) }
    const itemCount = async id => srvA.count(id)
    const nm = fx => strip(fx.it.stack.name)
    const lab = fx => `${nm(fx)} (${fx.it.price} ${CURRENCY[fx.it.res].label})`

    // German messages: exact wording, no typos, no raw placeholders / colour codes
    {
      const fx = FX.end
      await openCategory(a, fx.ci)
      await fund({ bronze: fx.it.price - 1 })
      const rd = await buy(a, slotOf(fx))
      await fund({ bronze: fx.it.price })
      const rb = await buy(a, slotOf(fx))
      const expDenied = `[BW] Du hast nicht genug Ressourcen, um ${fx.it.stack.amount}x ${nm(fx)} zu kaufen! Du brauchst ${fx.it.price} ${CURRENCY[fx.it.res].label}!`
      const expBought = `[BW] ${fx.it.stack.amount}x ${nm(fx)} wurde für ${fx.it.price} ${CURRENCY[fx.it.res].label} gekauft!`
      t.check('refusal message is the exact German text without typos (Ressourcen) and with the right price', rd.msgs.map(strip).join('|') === expDenied, { got: rd.msgs, expected: expDenied })
      t.check('purchase message is the exact German text with item name, amount, price and currency', rb.msgs.map(strip).join('|') === expBought, { got: rb.msgs, expected: expBought })
    }

    // insufficient funds: nothing bought, nothing deducted (also with plenty of the WRONG currencies)
    const denied = [FX.end, FX.ironBlock, FX.bow, FX.pick, FX.mobile, FX.pearl]
    const typoMsgs = []
    for (const mode of [0, 1]) {
      for (const fx of denied) {
        await openCategory(a, fx.ci)
        const funds = { bronze: 64, iron: 64, gold: 64, [fx.it.res]: fx.it.price - 1 }
        await fund(funds)
        const id = fx.it.stack.type
        const before = await srvA.money(); const had = await itemCount(id)
        const r = await buy(a, slotOf(fx), { mode })
        const after = await srvA.money(); const has = await itemCount(id)
        const same = JSON.stringify(before) === JSON.stringify(after) && had === has
        for (const m of r.msgs) if (/Resourc|%|&|§/.test(m)) typoMsgs.push(m)
        const expMsg = `[BW] Du hast nicht genug Ressourcen, um ${fx.it.stack.amount}x ${nm(fx)} zu kaufen! Du brauchst ${fx.it.price} ${CURRENCY[fx.it.res].label}!`
        const msgOk = r.msgs.length >= 1 && r.msgs.every(m => strip(m) === expMsg)
        t.check(`insufficient funds${mode ? ' (shift-click)' : ''}: ${lab(fx)} with ${fx.it.price - 1} ${CURRENCY[fx.it.res].label} buys nothing and deducts nothing`, r.result === 'denied' && same && msgOk,
          { result: r.result, before, after, itemBefore: had, itemAfter: has, msgs: r.msgs, expMsg })
      }
    }
    t.check('refusal messages contain no typo ("Resourcen"), raw placeholder (%item%) or colour code', typoMsgs.length === 0, typoMsgs.length ? typoMsgs.slice(0, 3) : 'ok')
    // resources that are NOT the shop's own resource items (plain /give brick) do not count as Bronze
    {
      await openCategory(a, FX.sand.ci)
      await srvA.clear()
      await t.server.cmd('give ShopA minecraft:brick 64')
      const r = await buy(a, slotOf(FX.sand))
      const after = await itemCount(FX.sand.it.stack.type)
      t.check('characterisation: plain minecraft:brick (no resource name) is NOT accepted as Bronze by the shop', r.result === 'denied' && after === 0,
        { result: r.result, bought: after, msgs: r.msgs, note: 'SBW matches the exact resource ItemStack (name Bronze/Silber/Gold), only spawner-made items work' })
    }

    // shift-click: as many as affordable (priced per piece), at most one stack of 64
    const shift = [[FX.sand, 10], [FX.sand, 100], [FX.end, 20], [FX.glow, 40], [FX.arrow, 70]]
    for (const [fx, have] of shift) {
      const unit = fx.it.price / fx.it.stack.amount
      const n = Math.min(64, Math.floor(have / unit))
      const exp = { items: n, left: have - n * unit }
      await openCategory(a, fx.ci)
      await fund({ [fx.it.res]: have })
      const r = await buy(a, slotOf(fx), { mode: 1, settle: 700 })
      const items = await itemCount(fx.it.stack.type); const left = (await srvA.money())[fx.it.res]
      t.check(`shift-click ${nm(fx)} (${fx.it.price} ${CURRENCY[fx.it.res].label} for ${fx.it.stack.amount}) with ${have} ${CURRENCY[fx.it.res].label}${n === 64 ? ' (capped at one stack of 64)' : ''}`, r.result === 'bought' && items === exp.items && left === exp.left,
        { result: r.result, items, left, expected: exp, msgs: r.msgs.slice(0, 3), nMsgs: r.msgs.length })
    }

    // ------------------------------------------------------------ A: number-key buying
    const END = FX.end; const SAND = FX.sand
    const FUND = 30
    const totals = inv => { const o = {}; for (const s of Object.values(inv)) o[s.id] = (o[s.id] || 0) + s.count; return o }
    const where = (inv, id) => Object.entries(inv).filter(([, s]) => s.id === id).map(([k, s]) => `${k}:${s.count}`)
    async function numKey (key, fx, extra = {}) {
      await openCategory(a, fx.ci)
      const before = await srvA.inv()
      const r = await buy(a, slotOf(fx), { button: key, mode: 2, settle: 600, ...extra })
      const after = await srvA.inv()
      return { before, after, r }
    }

    { // N1: empty target slot
      await srvA.clear(); await srvA.put('inventory.0', 'bronze', FUND); await srvA.putItem('hotbar.0', 'coal', 5)
      const { before, after, r } = await numKey(4, END)
      const tb = totals(before); const ta = totals(after)
      const ok = r.result === 'bought' && after[4] && after[4].id === END.it.stack.type && after[4].count === END.it.stack.amount && ta.brick === tb.brick - END.it.price && ta.coal === 5 && where(after, 'coal').join() === '0:5' && where(after, END.it.stack.type).length === 1
      t.check('number key 5 on an empty hotbar slot puts the purchase exactly into hotbar slot 5', ok, { result: r.result, bought: where(after, END.it.stack.type), coal: where(after, 'coal'), bricks: ta.brick })
    }
    { // N2: occupied target slot, occupant moves to a free slot unchanged
      await srvA.clear(); await srvA.put('inventory.0', 'bronze', FUND); await srvA.putItem('hotbar.2', 'coal', 7)
      const { after, r } = await numKey(2, END)
      const ta = totals(after)
      const coalAt = where(after, 'coal')
      const ok = r.result === 'bought' && after[2] && after[2].id === END.it.stack.type && after[2].count === END.it.stack.amount && coalAt.length === 1 && !coalAt[0].startsWith('2:') && ta.coal === 7 && ta.brick === FUND - END.it.price
      t.check('number key 3 on an occupied hotbar slot: purchase lands there, previous item moves to a free slot (no loss, no duplicate)', ok, { result: r.result, slot2: after[2], coal: coalAt, totals: ta })
    }
    { // N3: occupant is the payment itself (bronze stack in the target slot)
      await srvA.clear(); await srvA.put('hotbar.1', 'bronze', FUND)
      const { after, r } = await numKey(1, END)
      const ta = totals(after)
      const ok = r.result === 'bought' && after[1] && after[1].id === END.it.stack.type && ta.brick === FUND - END.it.price && ta[END.it.stack.type] === END.it.stack.amount
      t.check('number key 2 while the target slot holds the Bronze used for payment: no Bronze lost or duplicated', ok, { result: r.result, slot1: after[1], bricks: where(after, 'brick'), totals: ta })
    }
    { // N4: same item bought twice into the same slot stacks there
      await srvA.clear(); await srvA.put('inventory.0', 'bronze', FUND)
      await numKey(5, SAND)
      const { after, r } = await numKey(5, SAND)
      const ta = totals(after); const id = SAND.it.stack.type
      const ok = r.result === 'bought' && after[5] && after[5].id === id && after[5].count === 2 * SAND.it.stack.amount && ta[id] === 2 * SAND.it.stack.amount && ta.brick === FUND - 2 * SAND.it.price
      t.check('number key 6 twice with the same item stacks in hotbar slot 6', ok, { result: r.result, bought: where(after, id), totals: ta })
    }
    { // N5: partial stack of the same item elsewhere is not duplicated or lost
      await srvA.clear(); await srvA.put('inventory.0', 'bronze', FUND)
      await openCategory(a, SAND.ci)
      await buy(a, slotOf(SAND)) // normal click: lands in the first free slot
      const mid = await srvA.inv()
      const { after, r } = await numKey(7, SAND)
      const ta = totals(after); const id = SAND.it.stack.type
      const ok = r.result === 'bought' && after[7] && after[7].id === id && ta[id] === 2 * SAND.it.stack.amount && ta.brick === FUND - 2 * SAND.it.price
      t.check('number key 8 with a partial stack of the same item elsewhere: nothing lost or duplicated, new purchase in hotbar slot 8', ok, { result: r.result, normalBuyLanded: where(mid, id), after: where(after, id), totals: ta })
    }
    { // N6: insufficient funds with number key leaves everything untouched
      await srvA.clear(); await srvA.put('inventory.0', 'bronze', END.it.price - 1); await srvA.putItem('hotbar.3', 'coal', 9); await srvA.putItem('hotbar.0', 'cobblestone', 20)
      const { before, after, r } = await numKey(3, END)
      t.check('number key with insufficient funds changes nothing in the inventory', r.result === 'denied' && JSON.stringify(before) === JSON.stringify(after), { result: r.result, before, after })
    }
    { // N7: every number key 1-9, hotbar completely full of different stacks
      const bad = []
      for (let k = 0; k < 9; k++) {
        await srvA.clear(); await srvA.put('inventory.0', 'bronze', 20)
        for (let h = 0; h < 9; h++) await srvA.putItem(`hotbar.${h}`, ['coal', 'cobblestone', 'dirt', 'stick', 'apple', 'bone', 'flint', 'leather', 'string'][h], h + 2)
        const before = await srvA.inv()
        const { after, r } = await numKey(k, END)
        const tb = totals(before); const ta = totals(after)
        const prev = before[k]
        const moved = where(after, prev.id)
        const okk = r.result === 'bought' && after[k] && after[k].id === END.it.stack.type && after[k].count === END.it.stack.amount && moved.length === 1 && moved[0] === `${moved[0].split(':')[0]}:${prev.count}` && !moved[0].startsWith(`${k}:`) &&
          ta.brick === tb.brick - END.it.price && Object.keys(tb).filter(id => !['brick'].includes(id)).every(id => ta[id] === tb[id])
        if (!okk) bad.push({ key: k + 1, result: r.result, slot: after[k], prevMovedTo: moved, bricks: [tb.brick, ta.brick] })
      }
      t.check('every number key 1-9 buys into exactly that hotbar slot with a full hotbar (occupant preserved in the main inventory)', bad.length === 0, bad.length ? bad : 'all 9 keys ok')
    }
    { // N8: number key over a category icon must not touch the inventory
      await srvA.clear(); await srvA.put('inventory.0', 'bronze', FUND); await srvA.putItem('hotbar.4', 'coal', 3)
      await showCategories(a)
      const before = await srvA.inv()
      const n = a._wo.n
      await click(a, 1, 4, 2)
      await sleep(600)
      const after = await srvA.inv()
      t.check('number key over a category icon leaves the inventory untouched', JSON.stringify(before) === JSON.stringify(after), { before, after, windowOpened: a._wo.n > n })
    }
    { // N9: enchanted/damaged bow keeps all its properties when bought with a number key
      const fx = FX.bow; const id = fx.it.stack.type
      await srvA.clear(); await srvA.put('inventory.0', fx.it.res, fx.it.price + 2); await srvA.putItem('hotbar.8', 'coal', 2)
      const { after, r } = await numKey(8, fx)
      const e = await srvA.enchants(id)
      const d = await srvA.data(`Inventory[{id:"minecraft:${id}"}].components."minecraft:damage"`)
      const okE = Object.keys(fx.it.stack.enchants).length === Object.keys(e.parsed).length && Object.entries(fx.it.stack.enchants).every(([k, v]) => e.parsed[k] === v)
      const wantDamage = fx.it.stack.damage ?? 0 // (the shop bows come with full durability: no damage component)
      t.check(`number key 9 buying ${nm(fx)}: lands in hotbar slot 9 with its enchantments and damage ${wantDamage} intact`,
        r.result === 'bought' && after[8] && after[8].id === id && after[8].count === fx.it.stack.amount && okE && Number(String(d).replace(/\D/g, '')) === wantDamage && totals(after).coal === 2 && where(after, 'coal').length === 1 && !where(after, 'coal')[0].startsWith('8:'), { result: r.result, slot8: after[8], coal: where(after, 'coal'), ench: e.parsed, damage: d })
    }
    { // N10: inventory completely full, the payment stack is exactly consumed -> the freed slot takes the displaced hotbar item
      const filler = ['coal', 'cobblestone', 'dirt', 'stick', 'apple', 'bone', 'flint', 'leather', 'string', 'sand', 'gravel', 'clay_ball', 'feather', 'gunpowder', 'sugar', 'wheat', 'paper', 'book', 'slime_ball', 'egg', 'snowball', 'carrot', 'potato', 'beetroot', 'melon_slice', 'pumpkin_seeds', 'redstone', 'glowstone_dust', 'lapis_lazuli', 'quartz', 'charcoal', 'rotten_flesh', 'spider_eye', 'bowl', 'fire_charge']
      await srvA.clear()
      for (let n = 0; n < 35; n++) await srvA.putItem(n < 9 ? `hotbar.${n}` : `inventory.${n - 9}`, filler[n], 3)
      await srvA.put('inventory.26', 'bronze', END.it.price) // slot 35 (last main slot)
      const before = await srvA.inv()
      const full = Object.keys(before).length
      const { after, r } = await numKey(6, END)
      const tb = totals(before); const ta = totals(after)
      const ok = full === 36 && r.result === 'bought' && after[6] && after[6].id === END.it.stack.type && ta.brick === undefined && Object.keys(tb).filter(id => id !== 'brick').every(id => ta[id] === tb[id]) && Object.keys(after).length === 36
      t.check('number key with a 100% full inventory (payment stack exactly used up): purchase in the chosen slot, displaced item takes the freed slot, nothing dropped', ok,
        { filled: full, result: r.result, slot6: after[6], slots: Object.keys(after).length, lostOrNew: Object.keys({ ...tb, ...ta }).filter(id => tb[id] !== ta[id]) })
    }
    { // N12: the payment stack is used up completely, in a hotbar slot that is not the target slot (the usual "spend my exact 7 Bronze" case)
      const id = END.it.stack.type; const price = END.it.price
      const scen = [
        ['exact payment stack in hotbar slot 1, key 5 (hotbar slot 5 empty)', async () => { await srvA.put('hotbar.0', 'bronze', price) }, 4],
        ['payment split over hotbar slots 1+2 (price in total), key 9', async () => { await srvA.put('hotbar.0', 'bronze', price - 3); await srvA.put('hotbar.1', 'bronze', 3) }, 8],
        ['exact payment stack in the main inventory, key 3', async () => { await srvA.put('inventory.0', 'bronze', price) }, 2]
      ]
      for (const [label, setup, key] of scen) {
        await srvA.clear(); await setup()
        const { before, after, r } = await numKey(key, END)
        const ta = totals(after)
        const ok = r.result === 'bought' && after[key] && after[key].id === id && after[key].count === END.it.stack.amount && where(after, id).length === 1 && ta.brick === undefined
        t.check(`number key when the payment is used up completely: ${label} -> purchase lands in the pressed slot`, ok, { result: r.result, before, after })
      }
    }
    { // N11: inventory full AND payment stack only partly used -> no room for the purchase: no payment may be lost for nothing
      const filler = ['coal', 'cobblestone', 'dirt', 'stick', 'apple', 'bone', 'flint', 'leather', 'string', 'sand', 'gravel', 'clay_ball', 'feather', 'gunpowder', 'sugar', 'wheat', 'paper', 'book', 'slime_ball', 'egg', 'snowball', 'carrot', 'potato', 'beetroot', 'melon_slice', 'pumpkin_seeds', 'redstone', 'glowstone_dust', 'lapis_lazuli', 'quartz', 'charcoal', 'rotten_flesh', 'spider_eye', 'bowl', 'fire_charge']
      await srvA.clear()
      await t.server.cmd('kill @e[type=item]')
      for (let n = 0; n < 35; n++) await srvA.putItem(n < 9 ? `hotbar.${n}` : `inventory.${n - 9}`, filler[n], 3)
      await srvA.put('inventory.26', 'bronze', END.it.price + 5)
      const before = await srvA.inv()
      const { after, r } = await numKey(6, END)
      const tb = totals(before); const ta = totals(after)
      const floor = String(await t.server.cmd(`execute as ShopA at @s if entity @e[type=item,distance=..8,nbt={Item:{id:"minecraft:${END.it.stack.type}"}}]`)).includes('Test passed') // spawner drops (bronze) near the shop must not count
      const paid = tb.brick - (ta.brick || 0)
      const got = (ta[END.it.stack.type] || 0)
      const lostOthers = Object.keys(tb).filter(id => id !== 'brick' && ta[id] !== tb[id])
      // Either the purchase is refused and nothing changes, or it succeeds and the item is in the inventory / on the floor. Paying for nothing is the bug.
      const consistent = (r.result === 'bought' && paid === END.it.price && (got === END.it.stack.amount || floor)) || (paid === 0 && got === 0)
      t.check('number key with a 100% full inventory and no free slot: either refused or delivered, never paid-for-nothing, no other item lost', consistent && lostOthers.length === 0,
        { result: r.result, paid, got, onFloor: floor, lostOthers, msgs: r.msgs })
    }

    await flowB
    {
      const diff = []
      for (const id of ['leather_helmet', 'leather_leggings', 'leather_boots']) {
        const x = rgbs[`A:${id}`]; const y = rgbs[`B:${id}`]
        if (!x || !y) diff.push(`${id}: colour missing (A ${JSON.stringify(x)}, B ${JSON.stringify(y)})`)
        else if (JSON.stringify(x) === JSON.stringify(y)) diff.push(`${id}: both teams get ${JSON.stringify(x)}`)
      }
      t.check('Rot and Blau leather armour get different colours (helmet, leggings, boots)', diff.length === 0, diff.length ? diff : { A: teamA, B: teamB, rgbs })
    }

    // shop.yml loading: no warnings/errors from the plugin about stacks, materials, potions or enchants
    const bad = t.server.logs().split('\n').filter(l => /shop\.yml/i.test(l) || (/(WARN|ERROR)/.test(l) && /(BedWars|ItemStack|material|enchant|potion)/i.test(l) && !/is unsigned|uses the following permissions/.test(l)))
    t.check('server log has no shop.yml / item-stack loading warnings', bad.length === 0, bad.length ? bad.slice(0, 10) : 'clean')
  }
}
