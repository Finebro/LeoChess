"""Shared helpers for the browser tests (Playwright, Chromium)."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = 'file://' + os.path.join(ROOT, 'dist', 'index.html')
DATA = json.load(open(os.path.join(ROOT, 'build', 'data.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'tests', 'out'); os.makedirs(OUT, exist_ok=True)

def tap(pg, a, b, wait=120):
    pg.click(f'.sq[data-sq="{a}"]'); pg.click(f'.sq[data-sq="{b}"]'); pg.wait_for_timeout(wait)

def open_page(p, width=390, height=900):
    br = p.chromium.launch(); pg = br.new_page(viewport={'width': width, 'height': height})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(PAGE); return br, pg, errs

def pick(pg, sec, ln):
    """Chooses a line in the library: opens the sheet on narrow screens, picks the section and the line."""
    if not pg.is_visible('#chips'):
        pg.click('#lineBar'); pg.wait_for_selector('#lib.open #chips', state='visible')
    pg.click(f'#tabs .tab[data-i="{sec}"]'); pg.click(f'#chips .chip[data-i="{ln}"]')
    pg.wait_for_function('!document.querySelector(".sheet.open")'); pg.wait_for_timeout(350)  # let the sheet slide away
