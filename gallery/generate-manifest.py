#!/usr/bin/env python3
"""
generate-manifest.py

Scans the gallery/photos folder and writes gallery/photos/manifest.json,
a plain JSON array of filenames that the website reads to build the
homepage photo widget and the /gallery page.

Run this any time you add or remove photos:

    python3 generate-manifest.py

It picks up any file extension that's actually an image (jpg, jpeg, png,
gif, webp, avif, bmp, svg — mixed extensions in the same folder are fine),
skips manifest.json and hidden/system files, and sorts the result so the
order is stable between runs.
"""

import json
from pathlib import Path

PHOTOS_DIR = Path(__file__).parent / "photos"
MANIFEST_PATH = PHOTOS_DIR / "manifest.json"

IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".avif", ".bmp", ".svg", ".jfif", ".tiff",
}


def main():
    if not PHOTOS_DIR.exists():
        print(f"Folder not found: {PHOTOS_DIR}")
        return

    photos = sorted(
        f.name
        for f in PHOTOS_DIR.iterdir()
        if f.is_file()
        and f.suffix.lower() in IMAGE_EXTENSIONS
        and not f.name.startswith(".")
        and f.name != "manifest.json"
    )

    MANIFEST_PATH.write_text(json.dumps(photos, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {len(photos)} photo(s) to {MANIFEST_PATH}")
    for name in photos:
        print(f"  - {name}")


if __name__ == "__main__":
    main()