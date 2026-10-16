"""Writes static/icons/icon-{16,32,48,128}.png from the eCash Cat logo, each at its real size."""
import pathlib
import sys
from PIL import Image

here = pathlib.Path(__file__).resolve().parent.parent
if len(sys.argv) != 2:
    sys.exit('usage: python3 scripts/icons.py <square source image>')
src = pathlib.Path(sys.argv[1])
logo = Image.open(src).convert('RGBA')
for size in (16, 32, 48, 128):
    out = here / 'static' / 'icons' / f'icon-{size}.png'
    logo.resize((size, size), Image.LANCZOS).save(out, optimize=True)
    print(f'{out.relative_to(here)} {Image.open(out).size}')
