"""Renders assets/icon.svg into the PNG icons (needs Playwright; run by hand after changing the icon).

    python3 scripts/build_icons.py     # -> assets/icon-32.png, assets/apple-touch-icon.png
The page itself embeds all three files (see ICONS in scripts/build.py).
"""
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
svg = open(os.path.join(ROOT, 'assets', 'icon.svg'), encoding='utf-8').read()
with sync_playwright() as p:
    br = p.chromium.launch()
    for name, size, full in (('icon-32.png', 32, False), ('apple-touch-icon.png', 180, True)):
        pg = br.new_page(viewport={'width': size, 'height': size})
        # the iPhone icon is square (iOS rounds the corners itself), so it fills the whole tile
        art = svg.replace('rx="14"', 'rx="0"') if full else svg
        pg.set_content(f'<html><body style="margin:0;background:transparent">{art.replace("<svg ", f"<svg width={size} height={size} ", 1)}</body></html>')
        pg.screenshot(path=os.path.join(ROOT, 'assets', name), omit_background=True)
        pg.close()
    br.close()
print('ok')
