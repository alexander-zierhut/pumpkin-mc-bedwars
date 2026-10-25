// YAML configs are bundled as text (esbuild text loader).
declare module '*.yml' {
  const text: string
  export default text
}

// wasi:filesystem as componentize-qjs exposes it (the QuickJS runtime already imports these interfaces)
declare module 'wasi:filesystem/types@0.2.12' {
  export interface DirectoryEntry { type: string, name: string }
  export interface DirectoryEntryStream { readDirectoryEntry (): DirectoryEntry | null }
  export interface Descriptor {
    openAt (pathFlags: { symlinkFollow?: boolean }, path: string, openFlags: { create?: boolean, directory?: boolean, exclusive?: boolean, truncate?: boolean }, flags: { read?: boolean, write?: boolean }): Descriptor
    stat (): { size: number | bigint }
    read (length: number, offset: number): [Uint8Array | number[], boolean]
    write (buffer: Uint8Array, offset: number): number | bigint
    readDirectory (): DirectoryEntryStream
  }
}
declare module 'wasi:filesystem/preopens@0.2.12' {
  import type { Descriptor } from 'wasi:filesystem/types@0.2.12'
  export function getDirectories (): Array<[Descriptor, string]>
}
