"""Builds build/data.json from the Python content files in data/.

Every move is parsed with python-chess, so an illegal or mistyped move stops the build
with the line id and ply number. Comments are written inline in SAN strings as {…}.
"""
import json, os, re, sys
import chess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'data'))
from openings import OPENINGS
from middlegame import MG
from morphy import MORPHY
from miniatures import MINIS

SECTIONS = OPENINGS + [MORPHY, MINIS]


def parse_line(ln):
    b = chess.Board()
    toks = re.findall(r'\{[^}]*\}|\S+', ln['moves'])
    san, uci, fen, com = [], [], [b.fen().split(' ')[0]], {}
    for t in toks:
        if t.startswith('{'):
            com[len(san)] = t[1:-1].strip(); continue
        ann = re.sub(r'[!?]+$', '', t); mark = t[len(ann):]
        try:
            m = b.parse_san(ann)
        except Exception as e:
            raise SystemExit(f"{ln['id']}: bad move {t!r} at ply {len(san) + 1}: {e}")
        s = b.san(m); b.push(m)
        san.append(s + mark); uci.append(m.uci()); fen.append(b.fen().split(' ')[0])
    L = {k: ln[k] for k in ('id', 'name', 'side', 'plan')}
    L.update(san=san, uci=uci, fen=fen, com=com)
    return L


def parse_mg(L, m, lid):
    b = chess.Board()
    if m.get('start'):
        for x in m['start'].split(): b.push_san(x)
    else:
        for u in L['uci']: b.push_uci(u)
    G = dict(side=m['side'], goal=m['goal'], t0='w' if b.turn else 'b', n0=b.fullmove_number,
             custom=bool(m.get('start')), fen=[b.fen().split(' ')[0]], uci=[], san=[], kind=[], q=[], why=[], alts=[])
    side = chess.WHITE if m['side'] == 'w' else chess.BLACK
    for st in m['steps']:
        try:
            mv = b.parse_san(st[1])
        except Exception as e:
            raise SystemExit(f"{lid} (middlegame): bad move {st[1]!r}: {e}")
        if (st[0] in 'ta') != (b.turn == side):
            raise SystemExit(f"{lid} (middlegame): step {st[1]!r} has kind {st[0]!r} but it is the other side's turn")
        G['san'].append(b.san(mv)); G['uci'].append(mv.uci()); G['kind'].append(st[0])
        if st[0] == 't':
            G['alts'].append([b.parse_san(a).uci() for a in st[2]]); G['q'].append(st[3]); G['why'].append(st[4])
        else:
            G['alts'].append([]); G['q'].append(''); G['why'].append(st[2])
        b.push(mv); G['fen'].append(b.fen().split(' ')[0])
    return G


def main():
    out, n = [], 0
    for op in SECTIONS:
        o = dict(op); o['lines'] = []
        for ln in op['lines']:
            L = parse_line(ln)
            if ln['id'] in MG: L['mg'] = parse_mg(L, MG[ln['id']], ln['id'])
            o['lines'].append(L); n += 1
        out.append(o)
    os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
    json.dump(out, open(os.path.join(ROOT, 'build', 'data.json'), 'w'), ensure_ascii=False)
    print(f'data.json: {len(out)} sections, {n} lines')


if __name__ == '__main__':
    main()
