#!/bin/bash
set -euo pipefail

echo "Hadiran pre-start: applying SQL migrations"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required in Liara env before start." >&2
  exit 1
fi

node scripts/apply-migrations.mjs

echo "Hadiran pre-start: migrations done"
