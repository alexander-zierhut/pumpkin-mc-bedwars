#!/usr/bin/env bash
# Usage: check.sh <branch>...   fmt + clippy + tests (affected packages like Pumpkin CI) per branch
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SP="${FORK_WORK:-$ROOT/work/fork}"
mkdir -p "$SP/checks"
WT=$SP/check
# the git directory of the fork (a .git folder or, in a submodule checkout, .git/modules/vendor/Pumpkin)
GITDIR="$(cd "$ROOT/vendor/Pumpkin" && cd "$(git rev-parse --git-common-dir)" && pwd)"
for b in "$@"; do
  log=$SP/checks/${b//\//_}.log
  git -C $WT switch -q --detach "$b" || { echo "$b CHECKOUT-FAIL" >> $SP/checks/summary.txt; continue; }
  head=$(git -C $WT rev-parse HEAD)
  exec 9>"$ROOT/build/.build.lock"; flock 9
  docker run --rm -u "$(id -u):$(id -g)" --memory 14g --cpus 12 --cpu-shares 128 \
    -e CARGO_HOME=/cargo -e CARGO_TARGET_DIR=/target -e CARGO_BUILD_JOBS=12 \
    -e GIT_CONFIG_COUNT=1 -e GIT_CONFIG_KEY_0=safe.directory -e GIT_CONFIG_VALUE_0='*' \
    -v "$WT:/src" -v "$GITDIR:$GITDIR" \
    -v "$ROOT/build/cargo-home:/cargo" -v "$ROOT/build/target:/target" -w /src pumpkin-build bash -c '
      set -o pipefail
      python3 .github/scripts/ci_packages.py plan --event pull_request --base mine/master --head HEAD --output /tmp/plan >/tmp/planlog || { cat /tmp/planlog; echo STEP=plan; exit 1; }
      cat /tmp/planlog
      export CI_AFFECTED_PACKAGES=$(sed -n "s/^affected_packages=//p" /tmp/plan)
      echo "== fmt"; cargo fmt --check || { echo STEP=fmt; exit 1; }
      echo "== clippy"; python3 .github/scripts/ci_packages.py run -- cargo clippy --all-targets --all-features >/tmp/c 2>&1; rc=$?; grep -vE "^\s+(Compiling|Checking|Blocking|Downloaded|Downloading)" /tmp/c | tail -150; [ $rc = 0 ] || { echo STEP=clippy; exit 1; }
      # tests only for the crates the branch changes (clippy above covers the dependents)
      tp=$(git diff --name-only mine/master HEAD | sed -n "s#^crates/\([^/]*\)/.*#\1#p" | sort -u | while read c; do [ -f crates/$c/Cargo.toml ] && echo "-p $c"; done)
      [ -n "$tp" ] || { echo "== no crate changed, no tests"; echo STEP=ok; exit 0; }
      echo "== test $tp"; cargo test --no-fail-fast $tp >/tmp/t 2>&1; rc=$?; grep -E "^(test result|error|failures:|---- )|FAILED|panicked" /tmp/t | tail -80; [ $rc = 0 ] || { echo STEP=test; exit 1; }
      echo STEP=ok' > "$log" 2>&1
  rc=$?; flock -u 9
  echo "$b $(tail -1 "$log") ${head:0:9}" >> $SP/checks/summary.txt
done
