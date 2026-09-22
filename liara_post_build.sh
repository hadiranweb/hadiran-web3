#!/bin/bash
# Copy migrate files into Next standalone so pre-start can see them on Liara.
set -u
echo "[hadiran] post-build pwd=$(pwd)"
STANDALONE=".next/standalone"
if [ ! -d "$STANDALONE" ]; then
  echo "[hadiran] post-build: standalone dir missing; skip copy"
  exit 0
fi
mkdir -p "$STANDALONE/scripts" "$STANDALONE/src/db/migrations"
if [ -f scripts/apply-migrations.mjs ]; then
  cp -f scripts/apply-migrations.mjs "$STANDALONE/scripts/"
fi
if [ -d src/db/migrations ]; then
  cp -f src/db/migrations/*.sql "$STANDALONE/src/db/migrations/" 2>/dev/null || true
fi
echo "[hadiran] post-build: standalone scripts=$(ls -1 "$STANDALONE/scripts" 2>/dev/null | tr '\n' ' ')"
echo "[hadiran] post-build: standalone sql=$(ls -1 "$STANDALONE/src/db/migrations" 2>/dev/null | tr '\n' ' ')"
exit 0
