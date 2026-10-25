#!/usr/bin/env bash
# Assembles the runnable server directory server/ from the sources:
#   config/pumpkin.toml, config/ops.json  -> server/
#   plugin (TypeScript, built here)        -> server/plugins/lan-bedwars.wasm
#   maps/rush                              -> server/bedwars          (main world, only if missing or --maps)
#   maps/<other>                           -> server/bedwars/<other>  (extra map worlds, loaded by the plugin)
#   config/arena-<name>.yml                -> server/plugins/data/lan-bedwars/arenas/  (extra arenas whose map is in
#                                             maps/; the built-in ones are listed in config/bedwars.yml)
# The RCON password is generated once per server directory (<target>/.rcon-password).
# Usage: tools/apply.sh [--maps] [target-dir]   (--maps resets the worlds to the pristine maps)
set -euo pipefail
shopt -s nullglob
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESET_MAPS=0
if [[ "${1:-}" == "--maps" ]]; then RESET_MAPS=1; shift; fi
TARGET="${1:-$ROOT/server}"
ARENAS="$TARGET/plugins/data/lan-bedwars/arenas"
mkdir -p "$TARGET/plugins" "$TARGET/data" "$ARENAS"

(cd "$ROOT/plugin" && node build.mjs >/dev/null)
cp "$ROOT/plugin/dist/lan-bedwars.wasm" "$TARGET/plugins/lan-bedwars.wasm"
cp "$ROOT/config/pumpkin.toml" "$TARGET/pumpkin.toml"
[[ -f "$ROOT/config/ops.json" ]] && cp "$ROOT/config/ops.json" "$TARGET/data/ops.json"

[[ -s "$TARGET/.rcon-password" ]] || head -c 18 /dev/urandom | base64 | tr -d '/+=' > "$TARGET/.rcon-password"
sed -i "s/^password = \"CHANGE_ME\"/password = \"$(cat "$TARGET/.rcon-password")\"/" "$TARGET/pumpkin.toml"

if [[ $RESET_MAPS == 1 || ! -d "$TARGET/bedwars" ]]; then
  rm -rf "$TARGET/bedwars"
  cp -a "$ROOT/maps/rush" "$TARGET/bedwars"
  for map in "$ROOT"/maps/*/; do
    map="$(basename "$map")"
    [[ $map == rush ]] || cp -a "$ROOT/maps/$map" "$TARGET/bedwars/$map"
  done
fi

builtin="$(sed -n 's/^arenas: *//p' "$ROOT/config/bedwars.yml")"
for file in "$ROOT"/config/arena-*.yml; do
  name="$(basename "$file" .yml)"; name="${name#arena-}"
  [[ $builtin =~ (^|[^a-z])$name([^a-z]|$) ]] && continue
  world="$(sed -n 's/^world: *//p' "$file")"
  if [[ -d "$ROOT/maps/$world" ]]; then cp "$file" "$ARENAS/"; else rm -f "$ARENAS/$(basename "$file")"; fi
done
echo "server assembled in $TARGET"
