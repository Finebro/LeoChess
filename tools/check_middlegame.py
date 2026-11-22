"""Checks middlegame tasks with a native Stockfish: every accepted alternative must not lose more
than ~0.45 pawns against the best move. Needs `stockfish` on PATH (apt install stockfish).
    python3 tools/check_middlegame.py
"""
import os, sys, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'data'))
import json, chess, chess.engine
from middlegame import MG
data={l['id']:l for o in json.load(open(os.path.join(ROOT,'build','data.json'))) for l in o['lines'] if 'mg' in l}
E=chess.engine.SimpleEngine.popen_uci(shutil.which('stockfish') or '/usr/games/stockfish'); E.configure({'Threads':4})
def val(b, mv):
    bb=b.copy(); bb.push(mv)
    s=E.analyse(bb, chess.engine.Limit(depth=16))['score'].white().score(mate_score=3000)
    return s
try:
 for lid in data:
    m=MG[lid]; b=chess.Board()
    for x in (m.get('start') or ' '.join(data[lid]['san'])).split(): b.push_san(x.rstrip('!?'))
    side = chess.WHITE if m['side']=='w' else chess.BLACK
    for st in m['steps']:
        mv=b.parse_san(st[1])
        if st[0]=='t':
            assert b.turn==side, (lid, st[1], 'not our turn')
            best=E.analyse(b, chess.engine.Limit(depth=16))['score'].white().score(mate_score=3000)
            for a in st[2]:
                try: am=b.parse_san(a)
                except Exception: print('ALT ILLEGAL', lid, st[1], a); continue
                v=val(b,am); loss=(best-v) if b.turn else (v-best)
                if loss>45: print('ALT BAD', lid, st[1], a, loss)
        else:
            assert (b.turn==side)==(st[0]=='a'), (lid, st)
        b.push(mv)
    print('ok', lid)
finally:
 E.quit()
