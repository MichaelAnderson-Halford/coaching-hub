#!/bin/bash
# apply-update.sh — safely apply a Claude-provided update zip to this project.
#
# Usage:
#   ./apply-update.sh ~/Downloads/some-update.zip
#
# This unzips the file directly into this project folder, putting every
# file at its exact correct path (no dragging in Finder, so nothing can
# land in the wrong folder or get swapped).

set -e

if [ -z "$1" ]; then
  echo "Usage: ./apply-update.sh path/to/update.zip"
  exit 1
fi

ZIP_PATH="$1"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ZIP_PATH" ]; then
  echo "Can't find that file: $ZIP_PATH"
  exit 1
fi

echo "Unzipping $ZIP_PATH into $PROJECT_DIR ..."
unzip -o "$ZIP_PATH" -d "$PROJECT_DIR" -x "*.DS_Store" > /dev/null

echo ""
echo "Done. Here's exactly what changed:"
echo ""
cd "$PROJECT_DIR"
git status

echo ""
echo "If that looks right, run:"
echo "  git add -A && git commit -m \"Update\" && git push"
