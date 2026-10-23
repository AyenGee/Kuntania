"""
One-off asset preparation: turns the client's phone photos into web-sized images.

    python scripts/prepare-images.py "<folder with IMG-*.jpg>"

Writes to public/images/site and public/images/products. Source files are only read.
Re-run it any time the source photos change. Needs Pillow (pip install pillow).

Crop boxes are in ORIGINAL pixel coordinates (left, top, right, bottom).
"""

import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "public" / "images" / "site"
PRODUCTS = ROOT / "public" / "images" / "products"


def open_rgb(path: Path) -> Image.Image:
    # honour the phone's rotation flag, and drop any metadata (GPS etc.) on save
    return ImageOps.exif_transpose(Image.open(path)).convert("RGB")


def save_webp(img: Image.Image, dest: Path, max_w: int, quality: int = 82) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if img.width > max_w:
        img = img.resize((max_w, round(img.height * max_w / img.width)), Image.LANCZOS)
    img.save(dest, "WEBP", quality=quality, method=6)
    print(f"  {dest.relative_to(ROOT)}  {img.width}x{img.height}  {dest.stat().st_size // 1024} KB")


def crop(img: Image.Image, box):
    return img.crop(box)


def make_logo(src: Path, box, dest: Path, max_w: int) -> None:
    """Extract the gold line-art from a dark background as a transparent PNG."""
    img = open_rgb(src).crop(box)
    px = img.load()
    out = Image.new("RGBA", img.size)
    op = out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b = px[x, y]
            # Gold is bright in GREEN and has a high green/red ratio; the red satin (even its
            # bright sheen) has little green. Keying on both separates line-art from fabric.
            bright = max(0.0, min(1.0, (g - 50) / 100.0))
            hue = max(0.0, min(1.0, ((g / r) if r else 0.0) - 0.40) / 0.25)
            alpha = bright * hue
            # re-colour to a single clean gold so the logo reads on any dark background
            op[x, y] = (232, 196, 140, int(alpha * 255))
    if out.width > max_w:
        out = out.resize((max_w, round(out.height * max_w / out.width)), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "PNG", optimize=True)
    print(f"  {dest.relative_to(ROOT)}  {out.width}x{out.height}  {dest.stat().st_size // 1024} KB")


def main(src_dir: str) -> None:
    src = Path(src_dir)
    f = lambda n: src / f"IMG-20261008-WA{n}.jpg"

    print("Real photos (products):")
    save_webp(open_rgb(f("0021")), PRODUCTS / "oil-1.webp", 1200)
    save_webp(open_rgb(f("0023")), PRODUCTS / "oil-2.webp", 1200)
    save_webp(open_rgb(f("0016")), PRODUCTS / "mask-1.webp", 1200)
    save_webp(open_rgb(f("0018")), PRODUCTS / "mask-2.webp", 1200)

    print("Real photos (site):")
    # Wide banner: the whole range, flowers behind (original 3806x4160)
    save_webp(crop(open_rgb(f("0012")), (0, 880, 3806, 3160)), SITE / "hero-range.webp", 2200)
    # Square-ish feature of the range without flowers (original 4160x4070)
    save_webp(crop(open_rgb(f("0015")), (0, 520, 4160, 3300)), SITE / "range-feature.webp", 1600)

    print("AI-generated mood images (sparkle watermark cropped off):")
    # Gemini sparkle sits in the bottom-right corner of these 896x1195 images.
    save_webp(crop(open_rgb(f("0026")), (0, 0, 896, 1090)), SITE / "mood-satin.webp", 900)
    save_webp(crop(open_rgb(f("0025")), (0, 0, 896, 1090)), SITE / "mood-scalp.webp", 900)

    print("Logo emblem (the 'KUNTA NIA' wordmark is set as live text on the site):")
    # WA0031 is 1380x752. The emblem is clean line-art; the wordmark under it is dim bronze on a
    # satin sheen and can't be separated reliably, so only the emblem is extracted.
    make_logo(f("0031"), (360, 70, 1090, 590), SITE / "logo-emblem.png", 800)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
