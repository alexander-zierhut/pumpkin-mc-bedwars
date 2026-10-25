#!/bin/sh
# Starts the BedWars server from the release archive (Linux x86_64). Run it from anywhere; the server directory is
# the folder of this script (pumpkin.toml, plugins, worlds).
set -eu
cd "$(dirname "$0")"
if grep -q '^password = "CHANGE_ME"' pumpkin.toml; then
  pw="${RCON_PASSWORD:-$(head -c 18 /dev/urandom | base64 | tr -d '/+=')}"
  sed -i "s/^password = \"CHANGE_ME\"/password = \"$pw\"/" pumpkin.toml
  echo "RCON password set in pumpkin.toml ([networking.rcon])"
fi
exec ./pumpkin
