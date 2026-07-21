#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/dist/webstore"
VERSION="$(node -e "const fs=require('fs'); const manifest=JSON.parse(fs.readFileSync('$ROOT_DIR/manifest.json','utf8')); if(!manifest.version) process.exit(1); process.stdout.write(manifest.version);")"
ZIP_PATH="$ROOT_DIR/dist/bookmark-tab-grouper-$VERSION.zip"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
rm -f "$ROOT_DIR"/dist/bookmark-tab-grouper-*.zip

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

(cd "$BUILD_DIR" && zip -qr "$ZIP_PATH" .)

if ! unzip -l "$ZIP_PATH" | grep -q 'popup/session-utils\.js'; then
  echo "Release package is missing popup/session-utils.js." >&2
  exit 1
fi

verify_packaged_file() {
  relative_path="$1"
  if ! cmp -s "$ROOT_DIR/$relative_path" "$BUILD_DIR/$relative_path"; then
    echo "Release package $relative_path does not match source." >&2
    exit 1
  fi
  if ! unzip -p "$ZIP_PATH" "$relative_path" | cmp -s "$ROOT_DIR/$relative_path" -; then
    echo "ZIP entry $relative_path does not match source." >&2
    exit 1
  fi
}

for release_file in \
  manifest.json \
  background.js \
  popup/index.html \
  popup/styles.css \
  popup/popup.js \
  popup/session-utils.js \
  _locales/en/messages.json \
  _locales/vi/messages.json
do
  verify_packaged_file "$release_file"
done

if unzip -Z1 "$ZIP_PATH" | grep -Eq '(^|/)(tests|docs|dist|node_modules)(/|$)|(^|/)package(-lock)?\.json$'; then
  echo "Development-only files found in release ZIP." >&2
  exit 1
fi

echo "Created $ZIP_PATH"
