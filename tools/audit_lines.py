"""Flags moves in the opening lines that a native Stockfish considers clear mistakes (eval drop > 0.7).
Lines that are traps on purpose are skipped. Needs `stockfish` on PATH.
    python3 tools/audit_lines.py
"""
import os, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import json, chess, chess.engine
data=json.load(open(os.path.join(ROOT,'build','data.json')))
e=chess.engine.SimpleEngine.popen_uci(shutil.which('stockfish') or '/usr/games/stockfish'); e.configure({'Threads':4})
def ev(b):
    if b.is_checkmate(): return -10000 if b.turn else 10000
    return e.analyse(b, chess.engine.Limit(depth=15))['score'].white().score(mate_score=10000)
for o in data:
    for l in o['lines']:
        if l['id'] in ('ruy-noah','ita-fried-liver','ck-trap') or l['id'].startswith(('mo-','mini-')): continue
        b=chess.Board(); prev=ev(b); bad=[]
        for i,u in enumerate(l['uci']):
            mover=b.turn; san=l['san'][i]; b.push_uci(u); cur=ev(b)
            drop=(prev-cur) if mover else (cur-prev)
            if drop>70: bad.append(f"{i//2+1}{'.' if mover else '...'}{san} drop={drop} eval={cur}")
            prev=cur
        print(l['id'], 'final', prev, bad)
e.quit()
