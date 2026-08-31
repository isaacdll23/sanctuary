#!/usr/bin/env python3
"""Generate PWA image assets (iOS splash screens, apple-touch-icon, maskable icons).

Run from the repo root:  python3 scripts/generate-pwa-assets.py
Requires Pillow:         python3 -m pip install --user pillow

Outputs into public/:
  - apple-touch-icon.png           (180x180, canonical iOS home-screen icon)
  - maskable-icon-192/512.png      (logo on solid bg with safe-zone padding)
  - splash-<w>x<h>.png             (per-device iOS startup images, themed bg)

All bitmaps are derived from public/sanctuary-logo-512.png. Commit both the
script and the generated files so assets are reproducible.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

# Must match --color-gray-950 in app/app.css and theme_color in manifest.json.
BACKGROUND = (10, 12, 16, 255)  # #0a0c10

LOGO_PATH = PUBLIC / "sanctuary-logo-512.png"


def logo_for(size: int) -> Image.Image:
    logo = Image.open(LOGO_PATH).convert("RGBA")
    return logo.resize((size, size), Image.LANCZOS)


def solid(w: int, h: int) -> Image.Image:
    img = Image.new("RGBA", (w, h), BACKGROUND)
    return img


def with_centered_logo(w: int, h: int, logo_size: int) -> Image.Image:
    canvas = solid(w, h)
    logo = logo_for(logo_size)
    x = (w - logo_size) // 2
    y = (h - logo_size) // 2
    canvas.paste(logo, (x, y), logo)
    return canvas


def generate_icons() -> None:
    # Canonical iOS home-screen icon. Solid background so iOS masking never
    # composites transparent pixels onto black.
    icon = solid(180, 180)
    logo = logo_for(132)  # ~73% content, generous rounded-corner margin
    icon.paste(logo, ((180 - logo.width) // 2, (180 - logo.height) // 2), logo)
    icon.save(PUBLIC / "apple-touch-icon.png", optimize=True)

    # Maskable icons (Android adaptive): keep the logo inside the safe zone
    # (inner ~80% circle) so masking never crops meaningful content.
    for size in (192, 512):
        canvas = solid(size, size)
        logo_size = round(size * 0.72)
        logo = logo_for(logo_size)
        canvas.paste(logo, ((size - logo_size) // 2, (size - logo_size) // 2), logo)
        canvas.save(PUBLIC / f"maskable-icon-{size}.png", optimize=True)


# (width, height, media query). Media queries from Apple's device matrix as
# used by pwa-asset-generator. A None media entry is the universal fallback.
SPLASHES = [
    # iPhones (portrait)
    (1290, 2796, "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"),
    (1179, 2556, "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"),
    (1284, 2778, "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"),
    (1170, 2532, "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"),
    (1242, 2688, "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"),
    (828, 1792, "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"),
    (1125, 2436, "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"),
    (750, 1334, "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"),
    (640, 1136, "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"),
    # iPads (portrait + landscape)
    (2048, 2732, "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"),
    (2732, 2048, "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"),
    (1668, 2388, "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"),
    (2388, 1668, "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"),
    (1668, 2224, "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"),
    (2224, 1668, "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"),
    (1640, 2360, "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"),
    (2360, 1640, "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"),
    (1536, 2048, "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"),
    (2048, 1536, "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"),
    # Universal fallback for devices not covered above
    (1179, 2556, None),
]


def generate_splashes() -> None:
    for width, height, media in SPLASHES:
        # Logo ~1/3 of the shorter edge keeps it balanced on all aspect ratios.
        logo_size = round(min(width, height) / 3)
        img = with_centered_logo(width, height, logo_size)
        name = f"splash-{width}x{height}.png"
        img.save(PUBLIC / name, optimize=True)
        print(f"  {name}  {media or 'universal'}")


def main() -> None:
    print("Generating icons...")
    generate_icons()
    print("Generating splash screens...")
    generate_splashes()
    print("Done.")


if __name__ == "__main__":
    main()
