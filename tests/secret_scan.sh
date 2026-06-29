#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."
# build the web bundle if not present
if [ ! -d web/dist ]; then ( cd web && npm run build ); fi
hits=$(grep -rInE 'OPENROUTER_API_KEY|ANTHROPIC_API_KEY|sk-[A-Za-z0-9]{20,}' web/dist web/src api/app 2>/dev/null \
  | grep -vE '\.example|process\.env|os\.getenv|getenv|import\.meta\.env|OPENROUTER_API_KEY=$|=\s*""|self\.(OPENROUTER|ANTHROPIC)_API_KEY|"(OPENROUTER|ANTHROPIC)_API_KEY"' || true)
if [ -n "$hits" ]; then echo "SECRET SCAN FAILED:"; echo "$hits"; exit 1; fi
echo "secret scan: clean"
