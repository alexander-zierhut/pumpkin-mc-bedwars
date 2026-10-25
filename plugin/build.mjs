// Bundles src/main.ts with esbuild and turns it into a Wasm component with componentize-qjs (QuickJS).
// Usage: node build.mjs [entry.ts] [out.wasm]
import * as esbuild from 'esbuild'
import { componentize } from 'componentize-qjs'
import * as fs from 'node:fs'
import * as path from 'node:path'

const here = import.meta.dirname
const entry = process.argv[2] || path.join(here, 'src/main.ts')
const out = process.argv[3] || path.join(here, 'dist/lan-bedwars.wasm')
const pumpkinWit = path.join(here, '../vendor/Pumpkin/crates/pumpkin-plugin-wit/v0.1')
const wasiWit = path.join(here, 'node_modules/@bytecodealliance/jco/lib/wit/builtin/0.2.12')

// The Pumpkin world plus wasi:filesystem (the plugin data folder, src/storage.ts): componentize-qjs only lets JS
// import interfaces of the user world, even though its QuickJS runtime imports wasi:filesystem anyway.
const wit = path.join(here, '.wit-build')
fs.rmSync(wit, { recursive: true, force: true })
fs.cpSync(pumpkinWit, wit, { recursive: true })
for (const dep of ['wasi-filesystem', 'wasi-io', 'wasi-clocks']) fs.cpSync(path.join(wasiWit, dep), path.join(wit, 'deps', dep), { recursive: true })
fs.writeFileSync(path.join(wit, 'lan-bedwars.wit'), `package pumpkin:plugin@0.1.0;

world lan-bedwars {
    include plugin;
    import wasi:filesystem/preopens@0.2.12;
}
`)

const t0 = Date.now()
const bundle = await esbuild.build({
  entryPoints: [entry], bundle: true, write: false, format: 'esm', target: 'es2022',
  external: ['pumpkin:plugin/*', 'wasi:*'], loader: { '.yml': 'text' }, logLevel: 'warning',
})
const js = bundle.outputFiles[0].text
const { component } = await componentize({ witPath: wit, world: 'lan-bedwars', jsSource: js, sync: true, optSize: true })
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, component)
console.log(`built ${path.relative(process.cwd(), out)} (${(component.length / 1024).toFixed(0)} KiB, js ${(js.length / 1024).toFixed(0)} KiB) in ${Date.now() - t0} ms`)
