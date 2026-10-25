#!/bin/sh
# Fills the server directory /srv from the image on the first start and updates the plugin on every start.
# Worlds, pumpkin.toml, ops and statistics in /srv are kept.
set -eu
D=/opt/bedwars
mkdir -p /srv/plugins /srv/data
cp "$D/plugins/lan-bedwars.wasm" /srv/plugins/lan-bedwars.wasm
[ -f /srv/pumpkin.toml ] || cp "$D/pumpkin.toml" /srv/pumpkin.toml
[ -d /srv/bedwars ] || cp -a "$D/bedwars" /srv/bedwars
[ -d /srv/plugins/data ] || cp -a "$D/plugins/data" /srv/plugins/data
if grep -q '^password = "CHANGE_ME"' /srv/pumpkin.toml; then
  pw="${RCON_PASSWORD:-$(head -c 18 /dev/urandom | base64 | tr -d '/+=')}"
  sed -i "s/^password = \"CHANGE_ME\"/password = \"$pw\"/" /srv/pumpkin.toml
  echo "RCON password set in pumpkin.toml ([networking.rcon])"
fi
exec "$@"
