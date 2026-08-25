#!/usr/bin/env bash
# Build the theme and run every check that can run without a browser.
#   bash saarthi-src/check.sh
# Add a real-browser pass afterwards with:
#   NODE_PATH=<dir with jsdom+puppeteer> node saarthi-src/layout.js
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== 1/3 build + Blogger-structure validation ======================="
python3 saarthi-src/build.py

echo
echo "=== 2/3 static layout / SEO / XML / contrast audit ================"
python3 saarthi-src/audit.py

echo
echo "=== 3/3 runtime behaviour (executes the real theme.js) ============="
if [ -n "${NODE_PATH:-}" ]; then
  node saarthi-src/verify.js
else
  echo "  skipped: set NODE_PATH to a directory containing jsdom, e.g."
  echo "    npm install jsdom && NODE_PATH=\$PWD/node_modules bash saarthi-src/check.sh"
fi

echo
echo "Deliverable: saarthi-blogger-theme.xml"
