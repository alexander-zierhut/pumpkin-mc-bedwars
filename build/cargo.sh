#!/usr/bin/env bash
# Runs any cargo command in the Pumpkin fork inside the Rust container, e.g. build/cargo.sh check -p pumpkin
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec docker run --rm -u "$(id -u):$(id -g)" --memory 14g --cpus 12 \
  -e CARGO_HOME=/cargo -e CARGO_TARGET_DIR=/target -e CARGO_BUILD_JOBS=12 \
  -v "$ROOT/vendor/Pumpkin:/src" -v "$ROOT/build/cargo-home:/cargo" -v "$ROOT/build/target:/target" \
  -w /src pumpkin-build cargo "$@"
