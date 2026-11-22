"""Interface checks: the library always matches the board, pending moves never leak into another line,
settings persist, no horizontal scroll on phones."""
from playwright.sync_api import sync_playwright
from conftest_helpers import DATA, PAGE, open_page, tap, pick

STATE = "({op:S.op, ln:S.ln, name:line().name, lb:document.getElementById('lbName').textContent,"\
        " tab:+document.querySelector('#tabs .tab.on').dataset.i, title:document.getElementById('lnTitle').textContent})"

with sync_playwright() as p:
    br, pg, errs = open_page(p)
    pg.evaluate('localStorage.clear()'); pg.reload()
    # a section tab opens that section at once (bug: the tab lit up, the board kept the old game)
    pick(pg, 4, 0)
    pg.click('#lineBar'); pg.wait_for_selector('#lib.open #chips', state='visible'); pg.click('#tabs .tab[data-i="2"]')
    s = pg.evaluate(STATE)
    assert s['op'] == 2 and s['tab'] == 2 and s['lb'] == s['name'] and s['title'].startswith(s['name']), s
    pg.click('#tabs .tab[data-i="0"]'); pg.click('#chips .chip[data-i="3"]'); pg.wait_for_timeout(350)
    pick(pg, 1, 0); pick(pg, 0, 0)
    pg.click('#lineBar'); pg.wait_for_selector('#lib.open #chips', state='visible'); pg.click('#tabs .tab[data-i="1"]')
    pg.click('#tabs .tab[data-i="0"]'); assert pg.evaluate('S.ln') == 0, 'section should reopen its last line'
    pg.keyboard.press('Escape'); pg.wait_for_timeout(350)
    # the opponent's pending reply must not be played in the next line
    pg.evaluate('selectLine(0,1)'); pg.click('#mode button[data-m="train"]'); pg.wait_for_timeout(200)
    pg.evaluate('selectLine(1,0)'); pg.wait_for_timeout(1300)
    assert pg.evaluate('S.side') == 'w' and pg.evaluate('S.ply') == 0, 'opponent move leaked into the new line'
    # every line through the arrows: line bar and title agree with the state
    pg.evaluate('selectLine(0,0)')
    for _ in range(sum(len(o['lines']) for o in DATA) - 1):
        pg.click('#lnNext'); s = pg.evaluate(STATE)
        assert s['lb'] == s['name'] and s['tab'] == s['op'], s
    assert pg.is_disabled('#lnNext')
    # settings survive a reload
    pg.click('#bSettings'); pg.wait_for_timeout(350); pg.click('[data-pieces="fox"]')
    pg.keyboard.press('Escape'); pg.reload()
    assert 'pt-fox' in pg.get_attribute('#board', 'class') and pg.is_hidden('#coach'), 'settings not saved / leopard should be hidden'
    # fancy pieces are turned into bitmaps (vector «Самоцвіти» made the page stutter)
    pg.wait_for_function("getComputedStyle(document.querySelector('#layer .pc.wq')).backgroundImage.includes('image/png')", timeout=10000)
    br.close()
    for w in (320, 390):
        br, pg, e2 = open_page(p, width=w)
        for m in ('view', 'train', 'an'):
            pg.click(f'#mode button[data-m="{m}"]')
            assert pg.evaluate('document.documentElement.scrollWidth') <= w, f'horizontal scroll at {w}px ({m})'
        errs += e2; br.close()
    assert not errs, errs
    print('ui: passed')
