"""Generates build/pieces.css: the classic cburnett set plus the themed sets (leopard, gems, fox, lynx, panda, wolf)."""
import base64, glob, os, random, math, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from piece_art import WHITE_FOX, RED_FOX, WHITE_LYNX, DARK_LYNX, PANDA, RED_PANDA, KNIGHT_PANDA, KNIGHT_RED

def wrap(size, x, y, draw, pad=6):
    """draw(cx,cy) at (x,y) plus copies across tile edges so the pattern tiles seamlessly"""
    out = []
    for dx in (-size, 0, size):
        for dy in (-size, 0, size):
            cx, cy = x + dx, y + dy
            if -pad < cx < size + pad and -pad < cy < size + pad:
                out.append(draw(cx, cy))
    return ''.join(out)

def pattern(size, base, body, rot=0, scale=1):
    return (f'<pattern id="tx" patternUnits="userSpaceOnUse" width="{size}" height="{size}" '
            f'patternTransform="rotate({rot}) scale({scale})"><rect width="{size}" height="{size}" fill="{base}"/>{body}</pattern>')

# ---------- leopard: big, bold rosettes ----------
def leopard(base, ring, center, spot, rot):
    size = 22
    ros = [(4, 5, 4.2, 10), (14.5, 4, 3.6, 70), (9.5, 14, 4.4, 130), (19.5, 15.5, 3.4, 40)]
    body = ''
    for x, y, r, a in ros:
        body += wrap(size, x, y, lambda cx, cy, r=r, a=a:
            f'<g transform="translate({cx} {cy}) rotate({a}) scale(1 .8)">'
            f'<circle r="{r*.72:.2f}" fill="{center}"/>'
            f'<circle r="{r}" fill="none" stroke="{ring}" stroke-width="{r*.5:.2f}" '
            f'stroke-dasharray="{r*1.9:.2f} {r*.7:.2f} {r*1.2:.2f} {r*.8:.2f}" stroke-linecap="round"/></g>', pad=7)
    for x, y, r in [(10, 1.5, 1.4), (2, 13, 1.3), (16.5, 10, 1.1), (20.5, 1.5, 1.2), (5, 20, 1.2)]:
        body += wrap(size, x, y, lambda cx, cy, r=r: f'<ellipse cx="{cx}" cy="{cy}" rx="{r*1.25:.2f}" ry="{r:.2f}" fill="{spot}"/>')
    return pattern(size, base, body, rot)

# ---------- gems: jittered triangular facets + sparkles ----------
def gems(colors, edge, sparkle, seed):
    rnd = random.Random(seed); size, n = 18, 3; step = size / n
    jit = [[(rnd.uniform(-1.6, 1.6), rnd.uniform(-1.6, 1.6)) for _ in range(n)] for _ in range(n)]
    P = lambda i, j: (i * step + jit[i % n][j % n][0], j * step + jit[i % n][j % n][1])
    body = ''
    for i in range(-1, n + 1):
        for j in range(-1, n + 1):
            a, b, c, d = P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)
            for tri in ((a, b, c), (a, c, d)):
                col = colors[(i * 7 + j * 3 + (tri[2] == c) * 5) % len(colors)]
                pts = ' '.join(f'{x:.2f},{y:.2f}' for x, y in tri)
                body += f'<polygon points="{pts}" fill="{col}" stroke="{edge}" stroke-width=".35" stroke-linejoin="round"/>'
    star = 'M0,-2.6 L.6,-.6 L2.6,0 L.6,.6 L0,2.6 L-.6,.6 L-2.6,0 L-.6,-.6Z'
    for k, (x, y, s) in enumerate([(4, 4, 1.15), (13, 11, 1.35), (8, 16, .9), (15, 3, .8)]):
        # twinkle: each star pulses on its own rhythm (SMIL runs inside the SVG background)
        anim = (f'<animateTransform attributeName="transform" type="scale" additive="sum" values="0.15;1;0.15" '
                f'keyTimes="0;.5;1" dur="{1.8+k*.45:.2f}s" begin="{-k*.7:.2f}s" repeatCount="indefinite"/>'
                f'<animate attributeName="opacity" values=".1;1;.1" dur="{1.8+k*.45:.2f}s" begin="{-k*.7:.2f}s" repeatCount="indefinite"/>')
        body += wrap(size, x, y, lambda cx, cy, s=s, anim=anim:
            f'<g transform="translate({cx} {cy}) scale({s})"><path d="{star}" fill="{sparkle}">{anim}</path></g>')
    return pattern(size, colors[0], body, 15)

# ---------- fur strokes (shared by fox and wolf) ----------
def fur(size, color, seed, count=26, ang=-60, w=.7):
    rnd = random.Random(seed); body = ''
    for _ in range(count):
        x, y = rnd.uniform(0, size), rnd.uniform(0, size)
        a = math.radians(ang + rnd.uniform(-18, 18)); L = rnd.uniform(2.2, 3.6)
        def d(cx, cy, a=a, L=L):
            ex, ey = cx + L * math.cos(a), cy + L * math.sin(a)
            mx, my = (cx + ex) / 2 + .7 * math.sin(a), (cy + ey) / 2 - .7 * math.cos(a)
            return f'<path d="M{cx:.2f},{cy:.2f} Q{mx:.2f},{my:.2f} {ex:.2f},{ey:.2f}" stroke="{color}" stroke-width="{w}" fill="none" stroke-linecap="round"/>'
        body += wrap(size, x, y, d)
    return body

def paw(color):
    return lambda cx, cy, s=1, r=0: (
        f'<g transform="translate({cx} {cy}) rotate({r}) scale({s})" fill="{color}">'
        f'<ellipse cx="0" cy="1.7" rx="2.3" ry="1.9"/><ellipse cx="-2.3" cy="-.7" rx=".9" ry="1.1"/>'
        f'<ellipse cx="-.8" cy="-2.1" rx=".9" ry="1.15"/><ellipse cx=".8" cy="-2.1" rx=".9" ry="1.15"/>'
        f'<ellipse cx="2.3" cy="-.7" rx=".9" ry="1.1"/></g>')

def wolf(base, strokes, paws, seed):
    size = 24; body = fur(size, strokes, seed, count=30); p = paw(paws)
    for x, y, r in [(6, 7, -20), (18, 18, 25)]:
        body += wrap(size, x, y, lambda cx, cy, r=r: p(cx, cy, 1.6, r), pad=8)
    return pattern(size, base, body)

def fox(base, strokes, leaf, vein, seed):
    size = 20; body = fur(size, strokes, seed, count=30, ang=-40, w=.8)
    leafp = 'M0,-3.6 C2.4,-2 2.6,1.6 0,3.6 C-2.6,1.6 -2.4,-2 0,-3.6Z'
    for x, y, r in [(5, 5, 35), (15, 14, -30), (16, 3, 80)]:
        body += wrap(size, x, y, lambda cx, cy, r=r:
            f'<g transform="translate({cx} {cy}) rotate({r}) scale(1.2)"><path d="{leafp}" fill="{leaf}"/>'
            f'<path d="M0,-3 L0,4.4" stroke="{vein}" stroke-width=".45" stroke-linecap="round"/></g>')
    return pattern(size, base, body)

def lynx(base, strokes, spot, seed):
    size = 18; rnd = random.Random(seed); body = fur(size, strokes, seed, count=24, ang=-75, w=.6)
    for _ in range(11):
        x, y = rnd.uniform(0, size), rnd.uniform(0, size); r = rnd.uniform(.7, 1.5); a = rnd.uniform(0, 180)
        body += wrap(size, x, y, lambda cx, cy, r=r, a=a:
            f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{r*1.35:.2f}" ry="{r:.2f}" transform="rotate({a:.0f} {cx:.2f} {cy:.2f})" fill="{spot}"/>')
    return pattern(size, base, body)

def bamboo(base, leaf, leaf2, extra=''):
    size = 22; body = extra
    lf = 'M0,0 C1.6,-1.2 5,-1.3 7,0 C5,1.3 1.6,1.2 0,0 Z'
    for x, y, rots, col in [(4, 5, (-30, 10, 50), leaf), (15, 15, (150, 190, 230), leaf2), (16, 3, (100, 140), leaf), (4, 17, (-80, -40), leaf2)]:
        for r in rots:
            body += wrap(size, x, y, lambda cx, cy, r=r, col=col: f'<path d="{lf}" transform="translate({cx} {cy}) rotate({r})" fill="{col}"/>', pad=8)
    return pattern(size, base, body)

TUFTS = ('<path d="M13.5,7.7 C13.1,5.8 12.8,4.4 12.2,3" fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round"/>'
         '<path d="M21,7.2 C21,5.2 21.2,3.8 21.6,2.4" fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round"/>')

THEMES = {
  'leo':  (leopard('#f7f1e4', '#1f1b17', '#d9c9a8', '#2b2520', 25),          # snow leopard
           leopard('#1d140c', '#f0b03c', '#7a4a1a', '#e09a2a', -20)),        # dark leopard, gold rosettes
  'gems': (gems(['#ffffff', '#c6ebfc', '#8fd0f2', '#e0f5ff', '#6fbde8', '#aee0f8'], '#ffffff', '#ffffff', 3),   # diamond
           gems(['#4a1d78', '#6b2fa6', '#2e0f4d', '#8e4fcf', '#5a238f', '#3a1563'], '#b98be6', '#f6ecff', 7)),  # amethyst
  'fox':  (fox('#fbf6ef', '#d8cbbb', '#e8963a', '#b5651d', 11),              # arctic fox + autumn leaves
           fox('#b8501a', '#e98a45', '#f6c453', '#a0601a', 12)),             # red fox + golden leaves
  'lynx': (lynx('#ebe4d8', '#cfc2ae', '#6e6255', 31),                     # pale northern lynx
           lynx('#7d5a39', '#a07850', '#22170d', 32)),                      # dark tawny lynx
  'panda': (bamboo('#fcfcfa', '#7cbf4f', '#5a9e35'),                       # giant panda: white + bamboo leaves
            bamboo('#bf501e', '#e9c46a', '#8fbf5a', fur(22, '#dc7a3c', 41, count=30, ang=-65, w=.7))),  # red panda fur + leaves
  'wolf': (wolf('#e2e6ea', '#a4adb6', '#55606b', 21),                        # grey wolf
           wolf('#22272d', '#4b555f', '#c7d1db', 22)),                       # black wolf, silver paws
}

def uri(svg): return 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode()).decode()

css = []
for f in sorted(glob.glob(os.path.join(ROOT, 'assets', 'pieces', 'cburnett', '*.svg'))):
    code = os.path.basename(f)[:2]; svg = open(f).read()
    css.append(f'.pc.{code}{{background-image:url("{uri(svg)}")}}')
    for tid, (pw, pb) in THEMES.items():
        if tid == 'fox' and code[1] == 'p':      # pawns become little foxes
            s = WHITE_FOX if code[0] == 'w' else RED_FOX
        elif tid == 'panda' and code[1] == 'p':  # pawns: panda cubs vs red panda cubs
            s = PANDA if code[0] == 'w' else RED_PANDA
        elif tid == 'lynx' and code[1] == 'p':   # pawns become lynx kittens
            s = WHITE_LYNX if code[0] == 'w' else DARK_LYNX
        elif code[0] == 'w':
            s = svg.replace('fill="#fff"', 'fill="url(#tx)"').replace('height="45">', f'height="45"><defs>{pw}</defs>', 1)
        else:
            s = svg.replace('fill="#000"', 'fill="url(#tx)"').replace('height="45">', f'height="45" fill="url(#tx)"><defs>{pb}</defs>', 1)
        if tid == 'panda' and code[1] == 'n':
            s = s.replace('</svg>', (KNIGHT_PANDA if code[0] == 'w' else KNIGHT_RED) + '</svg>')
        if tid == 'lynx' and code[1] == 'n':     # ear tufts on the knight
            s = s.replace('</svg>', TUFTS + '</svg>')
        css.append(f'.pt-{tid} .pc.{code}{{--img:url("{uri(s)}");background-image:var(--img)}}')
os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
open(os.path.join(ROOT, 'build', 'pieces.css'), 'w').write('\n'.join(css))
print('ok', len(css))
