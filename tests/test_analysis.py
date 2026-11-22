"""«Аналіз»: free moves, variations, persistence, phone width, engine explanations."""
from playwright.sync_api import sync_playwright
from conftest_helpers import open_page, tap, pick, OUT
import os

def why(pg):
    pg.wait_for_function("document.querySelector('#msg .why') && !document.querySelector('#msg .why.wait')", timeout=90000)
    return pg.inner_text('#msg .why')

with sync_playwright() as p:
    br, pg, errs = open_page(p)
    sec = [i for i, t in enumerate(pg.eval_on_selector_all('#tabs .tab', 'e=>e.map(x=>x.textContent)')) if 'мініатюри' in t][0]
    pick(pg, sec, 0); pg.click('#mode button[data-m="an"]')
    for _ in range(3): pg.click('#aNext')
    tap(pg, 'd8', 'g5'); w = why(pg); print('hanging queen:', w); assert 'без захисту' in w
    pg.evaluate('anGo(0)'); tap(pg, 'f2', 'f3'); tap(pg, 'e7', 'e5'); tap(pg, 'g2', 'g4')
    w = why(pg); print('allows mate:', w); assert 'мат' in w
    pg.evaluate('anGo(0)')
    for _ in range(26): pg.click('#aNext')
    tap(pg, 'h5', 'h6'); w = why(pg); print('missed mate:', w); assert 'Пропущено мат' in w
    # variations survive a reload
    n = pg.evaluate("S.an.nodes.filter(x=>x&&!x.main).length")
    pg.reload(); pick(pg, sec, 0); pg.click('#mode button[data-m="an"]')
    assert pg.evaluate("S.an.nodes.filter(x=>x&&!x.main).length") == n
    assert pg.evaluate('document.documentElement.scrollWidth') <= 390, 'page wider than the phone screen'
    pg.screenshot(path=os.path.join(OUT, 'analysis.png'), full_page=True)
    assert not errs, errs
    print('analysis: passed')
