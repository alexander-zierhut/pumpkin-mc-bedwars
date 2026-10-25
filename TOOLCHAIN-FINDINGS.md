# Toolchain findings (outside Pumpkin itself)

Running log of bugs and rough edges in the tools around the Pumpkin port, sorted by the project they
should be reported to. Pumpkin server/plugin-host findings are in `PUMPKIN-FINDINGS.md`.

Versions: mineflayer 4.39.0, minecraft-protocol 1.68.0, minecraft-data 3.117.0, prismarine-chunk 1.41.0,
componentize-qjs 0.4.5, @bytecodealliance/jco 1.39.0, pumpkin-api-ts 0.1.1 (CI build of 2026-09-28),
ViaProxy 3.4.14.

---

## mineflayer / minecraft-data (PrismarineJS)

### M1. Sprinting sends the wrong action for 1.21.6+ (26.1)
`supportFeature('entityActionUsesStringMapper')` is `false` for 26.1, so `bot.setControlState('sprint', ...)`
writes the pre-1.21.6 numeric actions `3`/`4` into `entity_action`. Since 1.21.6 the ids are
`0 stop_sleeping, 1 start_sprinting, 2 stop_sprinting, 3 start_riding_jump, 4 stop_riding_jump, ...`,
so the server receives "horse jump" and never sees the bot sprint (no sprint knockback, no sprint particles).
- The 26.1 protocol in minecraft-data already uses a string mapper for `actionId`; the feature flag is out of date.
- Workaround: `tests/harness/bots.js` reports the feature as supported.

### M3. Entity velocities are 8000 times too small for 1.21.9+ (26.1)
`entities.js` handles `entity_velocity` with `conv.fromNotchVelocity(packet.velocity)`, which divides by 8000.
Since 1.21.9 the packet carries an lpVec3 that minecraft-protocol already decodes to blocks per tick, so a bot
never moves from knockback, explosions or plugin launches (e.g. y = 3.9 becomes 0.0005). Workaround in
`tests/harness/bots.js`. Specs that read the raw packet (melee, bow) were not affected.

### M2. Only 26.1 is supported while the current release is 26.3
Testing a 26.3 server needs a protocol proxy (ViaProxy here). Not a bug, but worth a note for anyone
testing current servers.

---

## componentize-qjs (QuickJS Wasm components)

### Q1. WIT `u64` becomes a JS `number`
Values above 2^53 lose precision. Records made of `u64` (e.g. a UUID as two `u64` halves) cannot round trip,
so a plugin cannot pass a UUID it received back to the host. jco's TypeScript guest types declare `bigint`
for the same fields, so the types and the runtime disagree (passing a `BigInt` traps with
`expected number: FromJs { from: "big_int", to: "f64" }`).

### Q2. JS can only import interfaces of the user world, not the ones the runtime already imports
The QuickJS runtime component imports `wasi:filesystem/preopens@0.2.12` (and the rest of wasi:cli) anyway, but
`import { getDirectories } from 'wasi:filesystem/preopens@0.2.12'` fails at build time with
`filesystem module not found: module resolution requires js_path`. It works after adding
`import wasi:filesystem/preopens@0.2.12;` to a world that `include`s the Pumpkin world (see `plugin/build.mjs`).
The error message does not point there.

### Q3. No `TextEncoder` / `TextDecoder`
QuickJS has neither, so reading or writing text files through `wasi:filesystem` needs a hand-written UTF-8 codec
(`plugin/src/storage.ts`). Worth a line in the README, since every file or network plugin needs it.

---

## pumpkin-api-ts (TypeScript SDK)

### T1. Scheduler helpers pass `BigInt` and crash under componentize-qjs
`scheduleDelayedTask` / `scheduleRepeatingTask` call the WIT functions with `BigInt(ticks)`; with the
QuickJS runtime this traps (see Q1). The example plugin's scheduler use therefore kills the plugin.

### T2. `build.js` passes `worldName` instead of `world` to `componentize`
Silently ignored (single-world WIT), but wrong.

### T3. Empty default command permission
`registerCommand(ctx, cmd, handler)` defaults the permission to `""`, which Pumpkin turns into the node
`<plugin>:` that nobody has: the command answers "Unknown or incomplete command".

### T5. Plugin data folder is undocumented
The host preopens `plugins/data/<plugin>/` as `data` only when the plugin metadata lists the `fs.write.data` (or
`fs.read.data`) permission, and `context.get-data-folder()` returns the guest path `"data"`, not a host path.
Neither the SDK nor the docs say so; found by reading `pumpkin-wasm-host/src/runtime.rs`.

### T4. No guidance on resource lifetimes
Event resources go back to the host when the handler returns, and many API calls take resources by
ownership. The SDK could wrap this (borrowed views, fresh lookups) or document it; see PUMPKIN-FINDINGS 2.7.

### T6. mineflayer does not push its bot away from other entities
Vanilla clients push themselves apart; the server sends players no velocity for entity pushes (Pumpkin fork
5e85b03c1, like vanilla `needsSync`). Two bots teleported onto the same spot therefore stay inside each other, and a
projectile thrown by one hits the other on its first tick (seen in the 60 Enderperle check, which now moves other
bots away before the throw).

---

## ViaProxy

Nothing wrong found so far. 26.1 bots to a 26.3 Pumpkin server work, including chunks with large palettes,
entity metadata and inventories.
