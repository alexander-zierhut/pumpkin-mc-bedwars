#!/usr/bin/env bash
# One entry point for running and developing the BedWars server. Needs Docker and git; the tests also need Node 22+.
#
#   ./bedwars.sh              build everything from source and start the server (same as `up`)
#   ./bedwars.sh up           build (Pumpkin fork + plugin, in Docker) and start; players join on port 25565
#   ./bedwars.sh plugin       rebuild only the plugin and restart (seconds instead of a Rust build)
#   ./bedwars.sh logs         follow the server log
#   ./bedwars.sh console      attach to the server console (detach with Ctrl+P Ctrl+Q)
#   ./bedwars.sh stop         stop the server
#   ./bedwars.sh reset-maps   stop, put the pristine maps back, start
#   ./bedwars.sh test [spec]  run the bot test suite (or the specs whose name contains [spec])
#
# Environment: BEDWARS_PORT (default 25565), BEDWARS_RCON_PORT (default 25575, bound to 127.0.0.1).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
COMPOSE=(docker compose -f "$ROOT/docker-compose.yml")
VIAPROXY_URL=https://github.com/ViaVersion/ViaProxy/releases/download/v3.4.14/ViaProxy-3.4.14.jar
VIAPROXY_SHA256=2894bbfb2f4342f8fde887af6c689313efd5b0e46a8006775eea0e21e2948ab5

need () { command -v "$1" >/dev/null || { echo "$1 is needed: $2" >&2; exit 1; }; }

fork () {
  if [[ ! -f vendor/Pumpkin/Cargo.toml ]]; then
    echo "fetching the Pumpkin fork (vendor/Pumpkin)"
    git submodule update --init vendor/Pumpkin
  fi
}

up () {
  need docker "https://docs.docker.com/get-docker/"
  fork
  echo "building the server image (the first build compiles Pumpkin, about 10 to 20 minutes)"
  "${COMPOSE[@]}" up -d --build
  echo "running: join with Minecraft 26.3 on $(hostname -I 2>/dev/null | awk '{print $1}' || echo localhost):${BEDWARS_PORT:-25565}"
  echo "make yourself op: ./bedwars.sh console, then type: op <your name>"
}

plugin () {
  need docker "https://docs.docker.com/get-docker/"
  fork
  [[ -f data/pumpkin.toml ]] || { echo "start the server once with ./bedwars.sh up first" >&2; exit 1; }
  docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$ROOT:/w" -w /w/plugin node:24-bookworm-slim \
    sh -c '[ -d node_modules ] || npm ci --no-audit --no-fund; node build.mjs'
  cp plugin/dist/lan-bedwars.wasm data/plugins/lan-bedwars.wasm
  "${COMPOSE[@]}" restart
  echo "plugin replaced, server restarted"
}

tests () {
  need docker "https://docs.docker.com/get-docker/"
  need node "the test runner needs Node 22 or newer (https://nodejs.org)"
  fork
  # the server binary comes from the image, so build it first if needed
  docker image inspect pumpkin-mc-bedwars:local >/dev/null 2>&1 || "${COMPOSE[@]}" build
  mkdir -p build proxy
  id="$(docker create pumpkin-mc-bedwars:local)"
  docker cp "$id:/usr/local/bin/pumpkin" build/pumpkin.new && mv -f build/pumpkin.new build/pumpkin
  docker rm "$id" >/dev/null
  if [[ ! -f proxy/ViaProxy.jar ]]; then
    echo "downloading ViaProxy (the bots speak 26.1, the server 26.3)"
    curl -fsSL -o proxy/ViaProxy.jar.part "$VIAPROXY_URL"
    echo "$VIAPROXY_SHA256  proxy/ViaProxy.jar.part" | sha256sum -c --quiet
    mv proxy/ViaProxy.jar.part proxy/ViaProxy.jar
  fi
  (cd plugin && { [[ -d node_modules ]] || npm ci --no-audit --no-fund; } && npm test)
  tools/apply.sh --maps
  (cd tests && { [[ -d node_modules ]] || npm ci --no-audit --no-fund; } && node run.js "$@")
}

case "${1:-up}" in
  up) up ;;
  plugin) plugin ;;
  logs) "${COMPOSE[@]}" logs -f ;;
  console) docker attach pumpkin-mc-bedwars ;;
  stop) "${COMPOSE[@]}" stop ;;
  reset-maps)
    "${COMPOSE[@]}" stop
    rm -rf data/bedwars
    "${COMPOSE[@]}" up -d ;;
  test) shift; tests "$@" ;;
  *) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
