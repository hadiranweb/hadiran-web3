#!/usr/bin/env bash
# Locked deploy path for hadiran-web3.
# Only this script. Never Liara CLI, never Actions Re-run, never --no-cache.
# CD is GitHub job "deploy" after a push to main without [skip deploy].
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if git log -1 --pretty=%B | grep -qF '[skip deploy]'; then
  echo "HEAD has [skip deploy]. Abort. Deploy push must not skip." >&2
  exit 1
fi

token_file=""
for candidate in "$root"/uploads/token*git.txt; do
  if [ -f "$candidate" ]; then
    token_file="$candidate"
    break
  fi
done
if [ -z "$token_file" ]; then
  echo "Missing local git token file under uploads/. Not printing secrets." >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin https://github.com/hadiranweb/hadiran-web3.git
fi

ask="$(mktemp)"
cleanup() { rm -f "$ask"; }
trap cleanup EXIT
cat > "$ask" <<EOF
#!/bin/sh
case "\$1" in
  *Username*) printf '%s' x-access-token ;;
  *) tr -d '\\n\\r ' < '$token_file' ;;
esac
EOF
chmod 700 "$ask"

GIT_ASKPASS="$ask" SSH_ASKPASS="$ask" GIT_TERMINAL_PROMPT=0 DISPLAY="${DISPLAY:-:0}" \
  git push origin main
