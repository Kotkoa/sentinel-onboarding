#!/bin/sh
# UserPromptSubmit hook — appends a one-line summary of each user prompt to WORKLOG.md.
# Reads the hook JSON payload from stdin. Never blocks input; fails silently on any error.
# Exit 0 always so a logging hiccup never interrupts the session.

set -u

# Resolve project root from the hook payload (cwd) with a sane fallback.
PAYLOAD="$(cat 2>/dev/null || true)"

extract() {
  # extract <json-key>: pulls the string value of a top-level key from the payload.
  # Uses python3 (always present on macOS) for robust JSON parsing; no jq dependency.
  printf '%s' "$PAYLOAD" | python3 -c '
import sys, json
key = sys.argv[1]
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
value = data.get(key, "")
if value is None:
    value = ""
sys.stdout.write(str(value))
' "$1" 2>/dev/null
}

PROMPT="$(extract prompt)"
PROJECT_DIR="$(extract cwd)"

[ -z "$PROJECT_DIR" ] && PROJECT_DIR="$(pwd)"
WORKLOG="$PROJECT_DIR/WORKLOG.md"

# Only log if a WORKLOG.md exists in this project — keeps the hook inert elsewhere.
[ -f "$WORKLOG" ] || exit 0

# Skip empty prompts and slash-only inputs (commands handle their own logging).
[ -z "$PROMPT" ] && exit 0
case "$PROMPT" in
  /*) exit 0 ;;
esac

# Collapse whitespace/newlines to a single line and truncate to keep WORKLOG scannable.
SUMMARY="$(printf '%s' "$PROMPT" | tr '\n\r\t' '   ' | sed 's/  */ /g' | cut -c1-280)"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M')"
ENTRY="- [$TIMESTAMP] prompt: $SUMMARY"

# Insert the entry right after the AUTO marker in the Process section so newest
# entries stay grouped under the right heading. Fall back to append if marker absent.
MARKER='<!-- AUTO: сюда хук дописывает саммари каждого ввода пользователя -->'
if grep -qF "$MARKER" "$WORKLOG" 2>/dev/null; then
  TMP="$(mktemp 2>/dev/null)" || { printf '%s\n' "$ENTRY" >> "$WORKLOG"; exit 0; }
  awk -v marker="$MARKER" -v entry="$ENTRY" '
    { print }
    $0 == marker { print entry }
  ' "$WORKLOG" > "$TMP" 2>/dev/null && cat "$TMP" > "$WORKLOG"
  rm -f "$TMP" 2>/dev/null
else
  printf '%s\n' "$ENTRY" >> "$WORKLOG"
fi

exit 0
