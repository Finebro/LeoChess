"""Solves every middlegame task (mode «Мітельшпіль») for all lines that have one."""
from playwright.sync_api import sync_playwright
from conftest_helpers import DATA, open_page, pick

with sync_playwright() as p:
    br, pg, errs = open_page(p)
    for oi, o in enumerate(DATA):
        for li, l in enumerate(o['lines']):
            if 'mg' not in l: continue
            pick(pg, oi, li); pg.click('#mode button[data-m="mg"]')
            M = l['mg']
            for i, k in enumerate(M['kind']):
                if k != 't': continue
                pg.wait_for_function(f'S.ply=={i} && !S.busy', timeout=20000)
                u = M['uci'][i]; pg.click(f'.sq[data-sq="{u[:2]}"]'); pg.click(f'.sq[data-sq="{u[2:4]}"]')
            pg.wait_for_function('S.done', timeout=20000)
            print('ok', l['id'])
    assert not errs, errs
    print('middlegame: all tasks passed')
