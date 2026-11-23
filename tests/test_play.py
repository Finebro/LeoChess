"""«Гра з комп'ютером»: the bot answers with legal moves, takeback, hint, resign, resume after reload,
starting from the end of an opening line, and no stray computer move after leaving the game."""
import random
from playwright.sync_api import sync_playwright
from conftest_helpers import open_page

MY_TURN = "S.pl.over || (!S.pl.thinking && S.pl.g.turn() === S.pl.side)"
RANDOM_MOVE = "(() => { const ms = S.pl.g.moves({verbose: true}); const m = ms[Math.floor(Math.random() * ms.length)]; return m.from + m.to; })()"

with sync_playwright() as p:
    br, pg, errs = open_page(p)
    pg.evaluate('localStorage.clear()'); pg.reload()
    pg.click('#bPlay'); pg.wait_for_selector('#play.open .lvl', state='visible')
    pg.click('.lvl[data-level="2"]'); pg.click('#optSide button[data-side="w"]'); pg.click('#optFrom button[data-from="start"]'); pg.click('#pStart')
    random.seed(7)
    for _ in range(8):                                   # 8 moves of ours, each answered by the computer
        pg.wait_for_function(MY_TURN, timeout=30000)
        if pg.evaluate('!!S.pl.over'): break
        mv = pg.evaluate(RANDOM_MOVE); pg.click(f'.sq[data-sq="{mv[:2]}"]'); pg.click(f'.sq[data-sq="{mv[2:4]}"]')
    pg.wait_for_function(MY_TURN, timeout=30000)
    n = pg.evaluate('S.pl.ucis.length'); assert n >= 2, n
    assert pg.evaluate('Bot.flavour()') == 'wasm', pg.evaluate('Bot.flavour()')
    if not pg.evaluate('!!S.pl.over'):
        pg.click('#pUndo'); assert pg.evaluate('S.pl.ucis.length') == n - 2, 'takeback should remove my move and the reply'
        pg.click('#pHint'); pg.wait_for_function("document.querySelectorAll('.sq.hint').length === 2", timeout=30000)
    assert pg.evaluate("document.getElementById('lbName').textContent").startswith('Рівень 2')
    # an unfinished game survives a reload
    k = pg.evaluate('S.pl.ucis.length'); pg.reload()
    pg.click('#bPlay'); pg.wait_for_selector('#pResume', state='visible'); pg.click('#pResume')
    assert pg.evaluate("S.mode") == 'play' and pg.evaluate('S.pl.ucis.length') == k
    pg.click('#pResign'); assert pg.evaluate('S.pl.over') == 'loss:здача'
    assert pg.evaluate("JSON.parse(localStorage.getItem('openingTrainerPlay')).stats[2].l") == 1
    # from the end of an opening line, as Black: the computer moves first; leaving must cancel its move
    pg.evaluate('selectLine(1, 0)'); pg.click('#bPlay'); pg.wait_for_selector('#play.open .lvl', state='visible')
    pg.click('.lvl[data-level="9"]'); pg.click('#optSide button[data-side="b"]'); pg.click('#optFrom button[data-from="line"]'); pg.click('#pStart')
    assert pg.evaluate('S.pl.thinking') and pg.evaluate("S.pl.fen0.split(' ')[1]") == 'w'
    pg.click('#mode button[data-m="view"]'); pg.wait_for_timeout(2500)
    assert pg.evaluate('S.mode') == 'view' and pg.evaluate('S.pl.ucis.length') == 0, 'computer moved after leaving the game'
    assert pg.evaluate('document.documentElement.scrollWidth') <= 390
    assert not errs, errs
    print('play: passed')
