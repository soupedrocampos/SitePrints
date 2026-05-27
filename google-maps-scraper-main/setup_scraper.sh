#!/usr/bin/env bash
set -euo pipefail

VERSION="v1.12.1"
BASE_URL="https://github.com/gosom/google-maps-scraper/releases/download/${VERSION}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$(uname -s)" in
    Linux*)   ASSET="google_maps_scraper-1.12.1-linux-amd64";  OUT="google-maps-scraper"     ;;
    Darwin*)  ASSET="google_maps_scraper-1.12.1-darwin-amd64"; OUT="google-maps-scraper"     ;;
    MINGW*|MSYS*|CYGWIN*) ASSET="google_maps_scraper-1.12.1-windows-amd64.exe"; OUT="google-maps-scraper.exe" ;;
    *) echo "Unsupported OS: $(uname -s)" >&2; exit 1 ;;
esac

DEST="${SCRIPT_DIR}/${OUT}"
if [ -x "${DEST}" ]; then
    echo "Binary already present at ${DEST}. Delete it to re-download."
    exit 0
fi

echo "Downloading ${ASSET} ..."
curl -fSL -o "${DEST}" "${BASE_URL}/${ASSET}"
chmod +x "${DEST}"
echo "Saved to ${DEST}"
echo
echo "On first run the scraper downloads its Playwright driver (~150MB)."
echo "Outbound HTTPS to playwright.azureedge.net must be allowed."
