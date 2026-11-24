"""Puzzles from Lichess, with the network mocked by saved puzzles (tests/fixtures): the opponent's setup move,
wrong moves rejected, automatic replies, two-step hint, «Розв'язок», stats and streak, and the offline message."""
import json, os
from playwright.sync_api import sync_playwright
from conftest_helpers import ROOT, open_page

FIX = {n: json.load(open(os.path.join(ROOT, 'tests', 'fixtures', f'puzzle_{n}.json'), encoding='utf-8')) for n in ('mate1', 'fork')}
queue, urls = [], []                                      # what the mocked Lichess answers next

def lichess(route):
    urls.append(route.request.url)
    item = queue.pop(0) if queue else 'mate1'
    if item == 'offline': return route.abort()
    route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body=json.dumps(FIX[item]))

def tap(pg, u): pg.click(f'.sq[data-sq="{u[:2]}"]'); pg.click(f'.sq[data-sq="{u[2:4]}"]')
READY = "S.pz && S.pz.id === '%s' && !S.pz.busy"

with sync_playwright() as p:
    br, pg, errs = open_page(p)
    pg.route('https://lichess.org/api/puzzle/**', lichess)
    pg.evaluate('localStorage.clear()'); pg.reload()
    # 1. a mate in one: the setup move is shown first, then one correct move solves it
    queue[:] = ['mate1', 'fork']                          # the second one is the prefetch
    pg.click('#bPuz'); pg.wait_for_selector('#puz.open .lvl', state='visible')
    pg.click('#optDiff .lvl[data-diff="easiest"]'); pg.click('#optTheme button[data-theme="mateIn1"]'); pg.click('#zStart')
    m = FIX['mate1']['puzzle']; pg.wait_for_function(READY % m['id'], timeout=10000)
    assert 'difficulty=easiest' in urls[0] and 'angle=mateIn1' in urls[0], urls
    assert pg.evaluate('S.pz.ucis.length') == 1 and 'Суперник зіграв' in pg.inner_text('#msg')
    assert pg.evaluate('S.pz.side') == ('w' if len(FIX['mate1']['game']['pgn'].split()) % 2 == 0 else 'b')
    tap(pg, m['solution'][0]); pg.wait_for_function('S.pz.done', timeout=5000)
    assert "Розв'язано" in pg.inner_text('#msg') and 'Мат в 1 хід' in pg.inner_text('#lnSub')
    st = pg.evaluate("JSON.parse(localStorage.getItem('openingTrainerPuzzles'))"); assert st['solved'] == 1 and st['streak'] == 1, st
    # 2. a three-move fork: hint in two steps, a wrong move is rejected, the reply is played automatically
    f = FIX['fork']['puzzle']; pg.click('#zNext'); pg.wait_for_function(READY % f['id'], timeout=10000)
    pg.click('#zHint'); assert pg.locator('.sq.hint').count() == 1
    pg.click('#zHint'); assert pg.locator('.sq.hint').count() == 2
    legal = pg.evaluate("S.pz.g.moves({verbose:true}).map(m=>m.from+m.to)")
    wrong = next(u for u in legal if u != f['solution'][0][:4])
    tap(pg, wrong); assert pg.evaluate('S.pz.i') == 0 and 'Не той хід' in pg.inner_text('#msg')
    tap(pg, f['solution'][0]); pg.wait_for_function('S.pz.i === 2 && !S.pz.busy', timeout=5000)
    assert pg.evaluate('S.pz.ucis[S.pz.ucis.length-1]') == f['solution'][1]
    tap(pg, f['solution'][2]); pg.wait_for_function('S.pz.done', timeout=5000)
    st = pg.evaluate("JSON.parse(localStorage.getItem('openingTrainerPuzzles'))"); assert st['failed'] == 1 and st['streak'] == 0, st
    # 3. «Розв'язок» plays the rest by itself
    queue[:] = ['fork', 'mate1']; pg.click('#zNext'); pg.wait_for_function("S.pz.id && !S.pz.busy && !S.pz.done", timeout=10000)
    pg.click('#zShow'); pg.wait_for_function('S.pz.done', timeout=10000); assert "Ось розв'язок" in pg.inner_text('#msg')
    # 4. no internet: a clear message, no crash
    queue[:] = ['offline', 'offline']; pg.evaluate('puzPre = null'); pg.click('#zNext')
    pg.wait_for_function("document.getElementById('msg').textContent.includes('потрібен інтернет')", timeout=10000)
    # 5. the line bar names the puzzle set; leaving for another mode works
    assert pg.inner_text('#lbSec').startswith('Шахові задачі')
    pg.click('#mode button[data-m="view"]'); assert pg.evaluate('S.mode') == 'view'
    assert pg.evaluate('document.documentElement.scrollWidth') <= 390
    assert not errs, errs
    print('puzzles: passed')
