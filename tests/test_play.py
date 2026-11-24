"""«Гра з комп'ютером»: the bot answers with legal moves, takeback, hint, resign, resume after reload,
starting from the end of an opening line, and no stray computer move after leaving the game."""
import random
from playwright.sync_api import sync_playwright
from conftest_helpers import open_page

MY_TURN = "S.pl.over || (!S.pl.thinking && S.pl.g.turn() === S.pl.side)"
LEGAL = "S.pl.g.moves({verbose: true}).map(m => m.from + m.to)"

def my_move(pg, rnd):                    # our moves are reproducible; the bot's are random by design
    mv = rnd.choice(sorted(pg.evaluate(LEGAL))); pg.click(f'.sq[data-sq="{mv[:2]}"]'); pg.click(f'.sq[data-sq="{mv[2:4]}"]')

def start(pg, level, side, frm, book=''):
    pg.click('#bPlay'); pg.wait_for_selector('#play.open .lvl', state='visible')
    pg.click(f'.lvl[data-level="{level}"]'); pg.click(f'#optSide button[data-side="{side}"]'); pg.click(f'#optFrom button[data-from="{frm}"]')
    if frm == 'start': pg.click(f'#optBook button[data-book="{book}"]')
    pg.click('#pStart')

with sync_playwright() as p:
    br, pg, errs = open_page(p)
    pg.evaluate('localStorage.clear()'); pg.reload()
    rnd = random.Random(7)
    for attempt in range(3):                             # a random game may end early; then start another
        start(pg, 2, 'w', 'start')
        for _ in range(6):                               # our moves, each answered by the computer
            pg.wait_for_function(MY_TURN, timeout=30000)
            if pg.evaluate('!!S.pl.over'): break
            my_move(pg, rnd)
        pg.wait_for_function(MY_TURN, timeout=30000)
        if not pg.evaluate('!!S.pl.over'): break
    assert not pg.evaluate('!!S.pl.over'), 'three games in a row ended within six moves'
    n = pg.evaluate('S.pl.ucis.length'); assert n >= 2, n
    assert pg.evaluate('Bot.flavour()') == 'wasm', pg.evaluate('Bot.flavour()')
    pg.click('#pUndo'); assert pg.evaluate('S.pl.ucis.length') == n - 2, 'takeback should remove my move and the reply'
    pg.click('#pHint'); pg.wait_for_function("document.querySelectorAll('.sq.hint').length === 2", timeout=30000)
    assert pg.evaluate("document.getElementById('lbName').textContent").startswith('Рівень 2')
    # an unfinished game survives a reload
    k = pg.evaluate('S.pl.ucis.length'); pg.reload()
    pg.click('#bPlay'); pg.wait_for_selector('#pResume', state='visible'); pg.click('#pResume')
    assert pg.evaluate("S.mode") == 'play' and pg.evaluate('S.pl.ucis.length') == k
    pg.click('#pResign'); assert pg.evaluate('S.pl.over') == 'loss:здача'
    assert pg.evaluate("JSON.parse(localStorage.getItem('openingTrainerPlay')).stats[2].l") >= 1
    # from the end of an opening line, as Black: the computer moves first; leaving must cancel its move
    pg.evaluate('selectLine(1, 0)'); start(pg, 9, 'b', 'line')
    assert pg.evaluate('S.pl.thinking') and pg.evaluate("S.pl.fen0.split(' ')[1]") == 'w'
    pg.click('#mode button[data-m="view"]'); pg.wait_for_timeout(2500)
    assert pg.evaluate('S.mode') == 'view' and pg.evaluate('S.pl.ucis.length') == 0, 'computer moved after leaving the game'
    # opening book: the computer (White) plays the Ruy Lopez; leaving the theory is explained
    pg.evaluate('selectLine(0, 0)'); start(pg, 1, 'b', 'start', book='ruy')
    def mine(u): pg.wait_for_function(MY_TURN, timeout=30000); pg.click(f'.sq[data-sq="{u[:2]}"]'); pg.click(f'.sq[data-sq="{u[2:4]}"]')
    pg.wait_for_function(MY_TURN, timeout=30000); assert pg.evaluate('S.pl.ucis') == ['e2e4']
    mine('e7e5'); pg.wait_for_function(MY_TURN, timeout=30000); assert pg.evaluate('S.pl.ucis[2]') == 'g1f3'
    mine('b8c6'); pg.wait_for_function(MY_TURN, timeout=30000); assert pg.evaluate('S.pl.ucis[4]') == 'f1b5', pg.evaluate('S.pl.ucis')
    pg.click('#pHint'); assert 'за теорією' in pg.inner_text('#msg') and pg.evaluate('S.pl.hint') in ('a7a6', 'g8f6'), pg.inner_text('#msg')
    mine('h7h6'); pg.wait_for_function(MY_TURN, timeout=30000)
    assert 'зійшов(-ла) з теорії' in pg.inner_text('#msg'), pg.inner_text('#msg')
    assert pg.evaluate('document.documentElement.scrollWidth') <= 390
    assert not errs, errs
    print('play: passed')
