import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jsonToLegacy } from '../src/legacy-text.ts'

test('a name the plugin created converts back to its § text', () => {
  assert.equal(jsonToLegacy('{"italic":false,"extra":[{"text":"Bronze","color":"dark_red"}],"text":""}'), '§4Bronze')
})

test('the same look in another structure gives the same § text (vanilla give with italic in the child)', () => {
  assert.equal(jsonToLegacy('{"text":"","extra":[{"color":"dark_red","italic":false,"text":"Bronze"}]}'), '§4Bronze')
})

test('plain strings, several segments and inherited styles', () => {
  assert.equal(jsonToLegacy('"plain"'), 'plain')
  assert.equal(jsonToLegacy('{"text":"","extra":[{"text":"Bronze","color":"gold","bold":true},{"text":" x","color":"gray"}]}'), '§6§lBronze§7 x')
  assert.equal(jsonToLegacy('{"text":"a","extra":[{"text":"b","bold":true}]}'), 'a§lb')
})

test('invalid JSON is returned unchanged', () => {
  assert.equal(jsonToLegacy('§4Bronze'), '§4Bronze')
})
