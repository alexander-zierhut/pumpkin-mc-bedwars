#!/usr/bin/env bash
# Builds the patched Pumpkin server (vendor/Pumpkin, branch lan-bedwars) in a Rust container.
# Output: build/pumpkin (static-ish glibc binary, runs in debian:bookworm-slim)
# Env (for parallel work in git worktrees of the fork):
#   PUMPKIN_SRC     source tree to build (default vendor/Pumpkin); always mounted at /src, so a copied target dir
#                   stays incremental
#   PUMPKIN_TARGET  cargo target dir (default build/target)
#   PUMPKIN_OUT     where the binary goes (default build/pumpkin)
#   PUMPKIN_PROFILE cargo profile (default lan; `profiling` keeps the debug symbols)
# Builds are serialized with a lock (one at a time fits into the RAM of this machine).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$(cd "${PUMPKIN_SRC:-$ROOT/vendor/Pumpkin}" && pwd)"
TARGET="${PUMPKIN_TARGET:-$ROOT/build/target}"
PROFILE="${PUMPKIN_PROFILE:-lan}"
mkdir -p "$ROOT/build/cargo-home" "$TARGET"
TARGET="$(cd "$TARGET" && pwd)"
GIT_DIR_MOUNT=()
# a worktree's .git file points to the main repository: make that path resolve inside the container too
if [[ -f "$SRC/.git" ]]; then GIT_DIR_MOUNT=(-v "$ROOT/vendor/Pumpkin/.git:$ROOT/vendor/Pumpkin/.git:ro"); fi
exec 9>"$ROOT/build/.build.lock"
flock 9
docker run --rm -u "$(id -u):$(id -g)" \
  --memory 14g --cpus 6 --cpu-shares 128 \
  -e CARGO_HOME=/cargo -e CARGO_TARGET_DIR=/target -e CARGO_BUILD_JOBS=6 \
  -v "$SRC:/src" -v "$ROOT/build/cargo-home:/cargo" -v "$TARGET:/target" "${GIT_DIR_MOUNT[@]}" \
  -w /src pumpkin-build \
  cargo build --locked --profile "$PROFILE" -p pumpkin "$@"
flock -u 9
# copy then rename: running test servers keep their old inode instead of "Text file busy"
OUT="${PUMPKIN_OUT:-$ROOT/build/pumpkin}"
cp "$TARGET/$PROFILE/pumpkin" "$OUT.new" && mv -f "$OUT.new" "$OUT"
ls -la "$OUT"
