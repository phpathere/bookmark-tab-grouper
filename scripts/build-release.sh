#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/dist/webstore"
ZIP_PATH="$ROOT_DIR/dist/bookmark-tab-grouper-1.0.0.zip"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

copy_path() {
  src="$1"
  dst="$BUILD_DIR/$src"
  mkdir -p "$(dirname "$dst")"
  cp -R "$ROOT_DIR/$src" "$dst"
}

copy_path "manifest.json"
copy_path "background.js"
copy_path "welcome.html"
copy_path "welcome.js"
copy_path "popup"
copy_path "_locales"
copy_path "icons"
copy_path "LICENSE"
copy_path "NOTICE"
copy_path "PRIVACY.md"
copy_path "THIRD_PARTY_ASSETS.md"

find "$BUILD_DIR" -name ".DS_Store" -delete
find "$BUILD_DIR" -type f \( -name "generate_*" -o -name "test_*" \) -delete

if grep -R -nE '<script[^>]+src="https?://|https://fonts\.googleapis\.com|cdnjs\.cloudflare\.com' "$BUILD_DIR"; then
  echo "Remote code or remote font reference found in release package." >&2
  exit 1
fi

rm -f "$ZIP_PATH"
(cd "$BUILD_DIR" && zip -qr "$ZIP_PATH" .)

echo "Created $ZIP_PATH"
