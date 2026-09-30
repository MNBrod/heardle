#!/usr/bin/env bash
# Interactively downloads the stats from a running Heardle deployment, in the
# format configure-deployment.sh can import into another one.
# Requires only bash and curl.

set -euo pipefail

die() {
  echo "Error: $*" >&2
  exit 1
}

# Downloads a path to a file; fails with the server's message on a non-2xx status.
fetch() {
  local path=$1 out=$2 status
  status=$(curl -sS -o "$out" -w '%{http_code}' "http://$ADDRESS$path") ||
    die "could not reach http://$ADDRESS$path"
  if [[ $status != 2* ]]; then
    die "GET $path failed (HTTP $status): $(cat "$out")"
  fi
}

command -v curl >/dev/null || die "curl is required"

TMP_FILE=$(mktemp)
trap 'rm -f "$TMP_FILE"' EXIT

# --- Address ---------------------------------------------------------------
while true; do
  read -r -p "Server address (IP:port, e.g. 192.168.1.20:8081): " ADDRESS
  if [[ $ADDRESS =~ ^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3}):([0-9]{1,5})$ ]]; then
    valid=true
    for i in 1 2 3 4; do
      # 10# stops bash reading octets with a leading zero (e.g. 08) as octal.
      ((10#${BASH_REMATCH[i]} <= 255)) || valid=false
    done
    port=$((10#${BASH_REMATCH[5]}))
    ((port >= 1 && port <= 65535)) || valid=false
    $valid && break
  fi
  echo "  Enter an IPv4 address and port, like 192.168.1.20:8081."
done

# --- Output file -----------------------------------------------------------
DEFAULT_FILE="heardle-stats-${ADDRESS//[.:]/-}-$(date +%Y-%m-%d).json"
while true; do
  read -r -p "Save to [$DEFAULT_FILE]: " OUT_FILE
  OUT_FILE=${OUT_FILE:-$DEFAULT_FILE}
  OUT_FILE=${OUT_FILE/#\~/$HOME}
  if [[ -d $OUT_FILE ]]; then
    echo "  '$OUT_FILE' is a directory; enter a file name."
    continue
  fi
  if [[ ! -d $(dirname "$OUT_FILE") ]]; then
    echo "  The folder '$(dirname "$OUT_FILE")' doesn't exist."
    continue
  fi
  if [[ -e $OUT_FILE ]]; then
    read -r -p "  '$OUT_FILE' already exists. Overwrite? [y/N] " overwrite
    [[ $overwrite =~ ^[Yy]([Ee][Ss])?$ ]] || continue
  fi
  break
done

# --- Download --------------------------------------------------------------
# Download to a temp file first so a failed request never leaves a partial or
# error response in place of the output file.
fetch /api/admin/stats/export "$TMP_FILE"
grep -q '"version"' "$TMP_FILE" && grep -q '"stats"' "$TMP_FILE" ||
  die "the server's response doesn't look like a stats export: $(head -c 200 "$TMP_FILE")"
mv "$TMP_FILE" "$OUT_FILE"

field() {
  grep -o "\"$1\":[0-9]*" "$OUT_FILE" | head -1 | cut -d: -f2
}
echo "Saved stats from http://$ADDRESS to $OUT_FILE"
echo "  Games played: $(field gamesPlayed), won: $(field gamesWon), max streak: $(field maxStreak)"
