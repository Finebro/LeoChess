"""Assembles dist/index.html — one self-contained page (data, pieces, engines inlined).

    python3 scripts/build.py            # data + pieces + page
    python3 scripts/build.py --page     # only re-inline src/* (fast, after editing HTML/CSS/JS)
"""
import base64, gzip, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
read = lambda *a: open(P(*a), encoding='utf-8').read()

# Stockfish 19 lite: the stock loader fetches stockfish.wasm next to the script. The page is a single
# file inside a sandbox, so the wasm is embedded (gzip + base64: 2.4 MB -> 1.6 MB), unpacked in the worker
# with the browser's DecompressionStream and handed to WebAssembly.instantiate directly. A browser without
# DecompressionStream raises an error in the worker, and the page falls back to Stockfish 10 (asm.js),
# which is kept uncompressed for exactly those older browsers.
SF19_HOOK = '}).instantiateWasm=function(e,r){'
SF19_PATCH = SF19_HOOK + ('self.__SFWASM.then(function(b){return WebAssembly.instantiate(b,e)})'
                          '.then(function(x){r(x.instance,x.module)})'
                          '.catch(function(err){setTimeout(function(){throw err})});return{};')


def sf19_worker():
    js = read('vendor', 'stockfish', 'stockfish-19-lite-single.js')
    if js.count(SF19_HOOK) != 1:
        raise SystemExit('Stockfish loader changed: instantiateWasm hook not found exactly once (see scripts/build.py)')
    raw = open(P('vendor', 'stockfish', 'stockfish-19-lite-single.wasm'), 'rb').read()
    b64 = base64.b64encode(gzip.compress(raw, 9, mtime=0)).decode()
    unpack = ('self.__SFWASM=(function(){var s=atob("' + b64 + '"),z=new Uint8Array(s.length);'
              'for(var i=0;i<s.length;i++)z[i]=s.charCodeAt(i);'
              'return new Response(new Blob([z]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();})();\n')
    return unpack + js.replace(SF19_HOOK, SF19_PATCH)


def main():
    if '--page' not in sys.argv:
        subprocess.run([sys.executable, P('scripts', 'build_data.py')], check=True)
        subprocess.run([sys.executable, P('scripts', 'build_pieces.py')], check=True)
    parts = {
        '<!-- @@COACH@@ -->': read('src', 'coach.svg').rstrip('\n'),
        '/* @@STYLES@@ */': read('src', 'styles.css').rstrip('\n'),
        '/* @@SF19@@ */': sf19_worker(),
        '/* @@SF10@@ */': read('vendor', 'stockfish', 'stockfish-10.asm.js'),
        '/* @@CHESSJS@@ */': '/* chess.js 0.10.3 — (c) Jeff Hlywa, BSD-2-Clause */\n' + read('vendor', 'chess.js'),
        '/* @@APP@@ */': read('src', 'app.js').rstrip('\n'),
    }
    html = read('src', 'index.html')
    for k, v in parts.items():
        if html.count(k) != 1: raise SystemExit(f'placeholder {k} must appear exactly once in src/index.html')
        if '</script' in v and k not in ('<!-- @@COACH@@ -->', '/* @@STYLES@@ */'):
            raise SystemExit(f'{k}: content contains </script and would break the page')
        html = html.replace(k, v)
    # data and pieces go in last: they are inserted into app.js / the trailing <style>
    html = html.replace('/* @@DATA@@ */', read('build', 'data.json'), 1)
    html = html.replace('/* @@PIECES@@ */', read('build', 'pieces.css'), 1)
    # themed piece sets: raw SVG as JSON, turned into CSS only for the set in use (see PieceSets in app.js)
    sets = read('build', 'pieces.json').replace('</', '<\\/')
    if html.count('/* @@PIECESETS@@ */') != 1: raise SystemExit('placeholder /* @@PIECESETS@@ */ must appear exactly once')
    html = html.replace('/* @@PIECESETS@@ */', sets, 1)
    os.makedirs(P('dist'), exist_ok=True)
    open(P('dist', 'index.html'), 'w', encoding='utf-8').write(html)
    print(f'dist/index.html: {len(html) / 1e6:.2f} MB')


if __name__ == '__main__':
    main()
