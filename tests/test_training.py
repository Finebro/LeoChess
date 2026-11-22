"""Plays every opening line and every Morphy/miniature game in «Тренування» for the trainee's side."""
from playwright.sync_api import sync_playwright
from conftest_helpers import DATA, open_page, tap

with sync_playwright() as p:
    br, pg, errs = open_page(p)
    for oi, o in enumerate(DATA):
        pg.click(f'#tabs .tab[data-i="{oi}"]')
        for li, l in enumerate(o['lines']):
            pg.click(f'#chips .chip[data-i="{li}"]'); pg.click('#mode button[data-m="train"]')
            side = pg.evaluate('S.side')
            for i, u in enumerate(l['uci']):
                if (i % 2 == 0) == (side == 'w'):
                    pg.wait_for_function(f'S.ply=={i} && !S.busy', timeout=20000)
                    tap(pg, u[:2], u[2:4], 0)
            pg.wait_for_function('S.done', timeout=20000)
            pg.click('#mode button[data-m="view"]')
            print('ok', l['id'])
    assert not errs, errs
    print('training: all lines passed')
