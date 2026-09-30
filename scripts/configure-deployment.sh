#!/usr/bin/env bash
# Interactively configures a running Heardle deployment through its admin API:
# background color, title, subtitle, and optionally imports a stats export.
# Requires only bash and curl.

set -euo pipefail

COLORS=(slate navy forest plum burgundy)

die() {
  echo "Error: $*" >&2
  exit 1
}

# Escapes a string for use inside a JSON string literal.
json_escape() {
  local s=$1
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$'\t'/\\t}
  s=${s//$'\r'/\\r}
  s=${s//$'\n'/\\n}
  printf '%s' "$s"
}

# Sends a request and prints the response body; fails with the server's message on a non-2xx status.
api() {
  local method=$1 path=$2
  shift 2
  local body_file status
  body_file=$(mktemp)
  status=$(curl -sS -o "$body_file" -w '%{http_code}' -X "$method" "$@" "http://$ADDRESS$path") || {
    rm -f "$body_file"
    die "could not reach http://$ADDRESS$path"
  }
  if [[ $status != 2* ]]; then
    local body
    body=$(cat "$body_file")
    rm -f "$body_file"
    die "$method $path failed (HTTP $status): $body"
  fi
  cat "$body_file"
  rm -f "$body_file"
}

command -v curl >/dev/null || die "curl is required"

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

echo "Checking the server..."
api GET /api/health >/dev/null
# Older images answer /api/health but lack the admin routes this script uses.
admin_status=$(curl -sS -o /dev/null -w '%{http_code}' "http://$ADDRESS/api/admin/ui") ||
  die "could not reach http://$ADDRESS/api/admin/ui"
[[ $admin_status == 404 ]] &&
  die "http://$ADDRESS is running an older Heardle image without the settings and stats routes. Rebuild the image from the latest main and redeploy it, then run this again."
echo "  Server is up."

# --- Color -----------------------------------------------------------------
echo "Background color:"
for i in "${!COLORS[@]}"; do
  echo "  $((i + 1))) ${COLORS[i]}"
done
while true; do
  read -r -p "Choose 1-${#COLORS[@]} or a name: " choice
  choice=$(printf '%s' "$choice" | tr '[:upper:]' '[:lower:]')
  if [[ $choice =~ ^[0-9]+$ ]] && ((choice >= 1 && choice <= ${#COLORS[@]})); then
    COLOR=${COLORS[choice - 1]}
    break
  fi
  for c in "${COLORS[@]}"; do
    [[ $choice == "$c" ]] && COLOR=$c && break 2
  done
  echo "  Pick one of the listed options."
done

# --- Title and subtitle ----------------------------------------------------
while true; do
  read -r -p "Title (max 100 characters): " TITLE
  TITLE=$(printf '%s' "$TITLE" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
  if [[ -z $TITLE ]]; then
    echo "  The title can't be empty."
  elif ((${#TITLE} > 100)); then
    echo "  That's ${#TITLE} characters; keep it to 100."
  else
    break
  fi
done

while true; do
  read -r -p "Subtitle (max 200 characters, leave blank to hide): " SUBTITLE
  SUBTITLE=$(printf '%s' "$SUBTITLE" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
  ((${#SUBTITLE} <= 200)) && break
  echo "  That's ${#SUBTITLE} characters; keep it to 200."
done

# --- Stats file (optional) -------------------------------------------------
STATS_FILE=""
while true; do
  read -r -p "Stats JSON file to import (leave blank to skip): " STATS_FILE
  STATS_FILE=${STATS_FILE/#\~/$HOME}
  [[ -z $STATS_FILE || -r $STATS_FILE ]] && break
  echo "  Can't read '$STATS_FILE'."
done

# --- Confirm and apply -----------------------------------------------------
echo
echo "About to configure http://$ADDRESS:"
echo "  Color:    $COLOR"
echo "  Title:    $TITLE"
echo "  Subtitle: ${SUBTITLE:-(hidden)}"
if [[ -n $STATS_FILE ]]; then
  echo "  Stats:    import $STATS_FILE (replaces the server's current stats)"
else
  echo "  Stats:    unchanged"
fi
read -r -p "Apply? [y/N] " confirm
[[ $confirm =~ ^[Yy]([Ee][Ss])?$ ]] || { echo "Cancelled; nothing was changed."; exit 0; }

# Stats go first: the file is the only input not already checked above, so if the
# server rejects it nothing has been changed yet.
if [[ -n $STATS_FILE ]]; then
  api POST /api/admin/stats/import -H 'Content-Type: application/json' --data-binary "@$STATS_FILE" >/dev/null
  echo "Imported stats from $STATS_FILE."
fi

payload=$(printf '{"backgroundColor":"%s","title":"%s","subtitle":"%s"}' \
  "$COLOR" "$(json_escape "$TITLE")" "$(json_escape "$SUBTITLE")")
api PATCH /api/admin/ui -H 'Content-Type: application/json' --data-binary "$payload" >/dev/null
echo "Updated color, title and subtitle."

echo "Done. Reload http://$ADDRESS/heardle/ to see the changes."
