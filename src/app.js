const DATA = /* @@DATA@@ */;
const $ = id => document.getElementById(id);
const store = {
  get(){ try{ return JSON.parse(localStorage.getItem('openingTrainer')||'{}') }catch(e){ return {} } },
  set(v){ try{ localStorage.setItem('openingTrainer', JSON.stringify(v)) }catch(e){} }
};
let prog = store.get();
const S = { op:0, ln:0, ply:0, mode:'view', side:'w', flip:false, sel:null, hint:0, mistakes:0, done:false, busy:false, auto:null, flash:null };

const line = () => DATA[S.op].lines[S.ln];
const cur = () => S.mode === 'mg' ? line().mg : line();
const turnAt = p => ((S.mode === 'mg' && line().mg.t0 === 'b' ? 1 : 0) + p) % 2 === 0 ? 'w' : 'b';
function label(i){ const M = cur(); const base = S.mode === 'mg' ? (M.n0 - 1) * 2 + (M.t0 === 'b' ? 1 : 0) : 0; const a = base + i;
  return `${Math.floor(a/2)+1}${a%2===0?'.':'…'}`; }
const sqName = (f, r) => 'abcdefgh'[f] + (r + 1);

function parseFen(fen){
  const b = {}; const rows = fen.split('/');
  rows.forEach((row, i) => { let f = 0; const r = 7 - i;
    for (const ch of row){ if (/\d/.test(ch)) f += +ch; else { b[sqName(f, r)] = (ch === ch.toUpperCase() ? 'w' : 'b') + ch.toLowerCase(); f++; } } });
  return b;
}

/* ---------- library: sections and line cards ---------- */
const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
const icon = (id, cls) => `<svg class="ic${cls ? ' ' + cls : ''}"><use href="#i-${id}"/></svg>`;
const doneIn = o => o.lines.filter(l => prog[l.id]).length;
const thumbs = {};
function thumb(l){                       // small board with the final position of the line
  if (thumbs[l.id]) return thumbs[l.id];
  const pos = parseFen(l.fen[l.fen.length - 1]), fl = l.side === 'b'; let h = '';
  for (const sq in pos){ const f = 'abcdefgh'.indexOf(sq[0]), r = +sq[1] - 1, x = fl ? 7 - f : f, y = fl ? r : 7 - r;
    h += `<i class="pc ${pos[sq]}" style="transform:translate(${x*100}%,${y*100}%)"></i>`; }
  return thumbs[l.id] = `<span class="thumb" aria-hidden="true">${h}</span>`;
}
let libKey = '', headKey = '';
const WIDE = window.matchMedia('(min-width:1180px)');      // the library is a sidebar here, a sheet below
const libShown = () => WIDE.matches || $('lib').classList.contains('open');
function renderTabs(force){
  if (S.lib === undefined) S.lib = S.op;
  const pk = JSON.stringify(prog), hk = [S.op, S.ln, pk, S.mode === 'play' && S.pl ? S.pl.id + ':' + S.pl.level : '', S.mode === 'puz' && S.pz ? S.pz.id : ''].join('|');
  if (hk !== headKey){ headKey = hk; renderHead(); }
  if (!force && !libShown()) { libKey = ''; return; }    // a closed sheet is rebuilt when it opens
  const key = [S.lib, S.op, S.ln, pk].join('|');
  if (key === libKey && !force) return; libKey = key;
  $('tabs').innerHTML = DATA.map((o, i) => { const d = doneIn(o);
    return `<button class="tab ${i===S.lib?'on':''}" data-i="${i}" role="tab" aria-selected="${i===S.lib}">${o.name}<span class="cnt${d===o.lines.length?' full':''}">${d}/${o.lines.length}</span></button>`; }).join('');
  const O = DATA[S.lib], d = doneIn(O), n = O.lines.length;
  $('secInfo').innerHTML = `<span>${O.eco ? O.eco + ' · ' : ''}${n} ${plural(n, 'лінія', 'лінії', 'ліній')}</span><span class="bar"><i style="width:${Math.round(100*d/n)}%"></i></span><span>${d}/${n}</span>`;
  $('chips').innerHTML = O.lines.map((l, i) => {
    const p = prog[l.id], mg = prog[l.id + '#mg'], mv = Math.ceil(l.san.length/2);
    const st = p ? (p.best === 0 ? `<span class="bdg ok">${icon('check')}без помилок</span>` : `<span class="bdg go">${icon('star')}пройдено ×${p.runs}</span>`) : '<span class="bdg">нова</span>';
    const mgB = l.mg ? `<span class="bdg${mg ? ' ok' : ''}" title="${mg ? 'Мітельшпіль пройдено' : 'Є завдання з мітельшпілю'}">${icon(mg ? 'check' : 'puzzle')}мітельшпіль</span>` : '';
    const on = S.lib === S.op && i === S.ln;
    return `<button class="chip ${on?'on':''}" data-i="${i}"${on?' aria-current="true"':''}>${thumb(l)}<span class="ch-t"><span class="ch-name">${l.name}</span>`
      + `<span class="ch-meta"><i class="disc ${l.side}"></i>за ${l.side==='w'?'білих':'чорних'} · ${mv} ${plural(mv, 'хід', 'ходи', 'ходів')}</span><span class="badges">${st}${mgB}</span></span></button>`;
  }).join('');
}
function renderHead(){                   // header: overall progress; line bar: current line
  const all = DATA.reduce((a, o) => a + o.lines.length, 0), done = DATA.reduce((a, o) => a + doneIn(o), 0);
  $('progPill').innerHTML = `${icon('star')}${done}/${all} <small>пройдено</small>`;
  const L = line(), O0 = DATA[S.op], P = S.mode === 'play' && S.pl;
  const Z = S.mode === 'puz' && S.pz;
  $('lbSec').textContent = Z ? 'Шахові задачі · Lichess' : P ? `Гра з комп'ютером · ти граєш ${sideName(P.side)}` : `${O0.name} · за ${L.side==='w'?'білих':'чорних'}`;
  $('lbName').textContent = Z ? puzLabel() : P ? `Рівень ${P.level} «${LEVELS[P.level].name}» (${LEVELS[P.level].elo})` : L.name;
  $('lnPrev').disabled = S.op === 0 && S.ln === 0; $('lnNext').disabled = S.op === DATA.length - 1 && S.ln === DATA[S.op].lines.length - 1;
}
function stepLine(d){                    // previous / next line through all sections
  let op = S.op, ln = S.ln + d;
  if (ln < 0){ if (op === 0) return; op--; ln = DATA[op].lines.length - 1; }
  else if (ln >= DATA[op].lines.length){ if (op === DATA.length - 1) return; op++; ln = 0; }
  S.lib = op; selectLine(op, ln);
}

(WIDE.addEventListener ? WIDE.addEventListener('change', () => renderTabs(true)) : WIDE.addListener(() => renderTabs(true)));

/* ---------- sheets (library on narrow screens, settings) ---------- */
function openSheet(id){ if (id === 'lib'){ S.lib = S.op; renderTabs(true); } $(id).classList.add('open'); document.body.classList.add('lock');
  if (id === 'lib'){ const c = document.querySelector('#chips .chip.on'), t = document.querySelector('#tabs .tab.on');
    if (c) c.scrollIntoView({ block: 'nearest' }); if (t) t.scrollIntoView({ block: 'nearest', inline: 'center' }); } }
function closeSheet(id){ $(id).classList.remove('open'); if (!document.querySelector('.sheet.open')) document.body.classList.remove('lock'); }
document.querySelectorAll('.sheet').forEach(sh => sh.addEventListener('click', e => {
  if (e.target === sh || e.target.closest('[data-close]')) closeSheet(sh.id); }));

/* the 64 squares are built once (and again only when the board is flipped); a render just swaps classes,
   so the page does not rebuild the board on every move */
let sqEls = null, sqFlip = null;
function buildSquares(){
  let html = '';
  for (let i = 0; i < 64; i++){
    const row = Math.floor(i/8), col = i % 8, r = S.flip ? row : 7 - row, f = S.flip ? 7 - col : col;
    let inner = '';
    if (row === 7) inner += `<span class="co f">${'abcdefgh'[f]}</span>`;
    if (col === 0) inner += `<span class="co r">${r+1}</span>`;
    html += `<div class="sq ${(f + r) % 2 ? 'l' : 'd'}" data-sq="${sqName(f, r)}">${inner}</div>`;
  }
  $('sqs').innerHTML = html; sqFlip = S.flip;
  sqEls = Array.from($('sqs').children, el => ({ el, n: el.dataset.sq, base: el.className }));
}
function renderBoard(){
  const P = (S.mode === 'play' && S.pl) || (S.mode === 'puz' && S.pz), A = S.mode === 'an' || !!P, nd = S.mode === 'an' ? anNode() : null;
  const L = A ? null : cur();
  const pos = parseFen(P ? P.g.fen().split(' ')[0] : nd ? nd.fen.split(' ')[0] : L.fen[S.ply]);
  const last = P ? (P.ucis[P.ucis.length - 1] || null) : nd ? (nd.uci || null) : (S.ply > 0 ? L.uci[S.ply-1] : null);
  const exp = P ? P.hint : !A && ((S.mode==='train') || (S.mode==='mg' && L.kind[S.ply]==='t')) && S.ply < L.uci.length ? L.uci[S.ply] : null;
  if (P) S.hint = P.hint ? (P.hintLvl || 2) : 0;
  const best = nd && S.showBest ? ((evOf(nd) || {}).pv || [])[0] : null;
  if (!sqEls || sqFlip !== S.flip) buildSquares();
  const mark = {}, add = (n, c) => { if (n) mark[n] = mark[n] ? mark[n] + ' ' + c : c; };
  if (last){ add(last.slice(0,2), 'last'); add(last.slice(2,4), 'last'); }
  add(S.sel, 'sel');
  if (best){ add(best.slice(0,2), 'bm'); add(best.slice(2,4), 'bm'); }
  if (A && S.sel && S.dests) for (const n in S.dests) add(n, pos[n] || S.dests[n].flags.includes('e') ? 'cap' : 'dot');
  if (exp && S.hint >= 1) add(exp.slice(0,2), 'hint');
  if (exp && S.hint >= 2) add(exp.slice(2,4), 'hint');
  if (S.flash) add(S.flash.sq, S.flash.cls);
  for (const q of sqEls){ const c = mark[q.n] ? q.base + ' ' + mark[q.n] : q.base; if (q.el.className !== c) q.el.className = c; }
  $('board').classList.toggle('train', S.mode !== 'view');
  renderPieces(pos);
}

/* pieces live in their own layer and slide between squares */
let pieces = {};
function sqXY(n){ const f = 'abcdefgh'.indexOf(n[0]), r = +n[1] - 1; return S.flip ? [7 - f, r] : [f, 7 - r]; }
function place(el, n){ const [x, y] = sqXY(n); el.style.transform = `translate(${x*100}%,${y*100}%)`; }
function renderPieces(pos){
  const layer = $('layer'), next = {}, removed = [];
  for (const sq in pieces){ if (pos[sq] === pieces[sq].code) next[sq] = pieces[sq]; else removed.push({ sq, ...pieces[sq] }); }
  const dist = (a, b) => Math.abs(a.charCodeAt(0) - b.charCodeAt(0)) + Math.abs(+a[1] - +b[1]);
  for (const sq of Object.keys(pos).filter(q => !next[q])){
    const code = pos[sq]; let bi = -1, bd = 99;
    removed.forEach((r, i) => { if (r.code === code && !r.used){ const d = dist(r.sq, sq); if (d < bd){ bd = d; bi = i; } } });
    if (bi >= 0){
      const r = removed[bi]; r.used = true; r.el.classList.add('up');
      const [x1, y1] = sqXY(r.sq), [x2, y2] = sqXY(sq), d = Math.hypot(x2 - x1, y2 - y1);
      const dur = Math.min(.75, .38 + .07 * d);          // longer hops glide a little longer
      r.el.style.setProperty('--dur', dur.toFixed(2) + 's');
      clearTimeout(r.el._t); r.el._t = setTimeout(() => r.el.classList.remove('up'), dur * 1000 + 30);
      next[sq] = { el: r.el, code };
    } else {
      const el = document.createElement('div'); el.className = 'pc ' + code;
      el.style.transition = 'none'; el.style.opacity = 0; place(el, sq); layer.appendChild(el);
      void el.offsetWidth; el.style.transition = ''; el.style.opacity = 1;
      next[sq] = { el, code };
    }
  }
  removed.filter(r => !r.used).forEach(r => { r.el.style.opacity = 0; setTimeout(() => r.el.remove(), 280); });
  for (const sq in next) place(next[sq].el, sq);
  pieces = next;
}

/* style settings */
let prefs = (() => { try { return JSON.parse(localStorage.getItem('openingTrainerStyle') || '{}') } catch(e){ return {} } })();
const savePrefs = () => { try{ localStorage.setItem('openingTrainerStyle', JSON.stringify(prefs)) }catch(_){} };
const PIECES = [['classic','Класичні'],['leo','Леопард'],['gems','Самоцвіти'],['fox','Лисиці'],['lynx','Рись'],['panda','Панди'],['wolf','Вовки']];
const BOARDS = [['wood','Дерево'],['savanna','Савана'],['green','Зелена'],['blue','Сіро-блакитна'],['pearl','Перлова'],['forest','Осінній ліс'],['night','Нічний ліс'],['taiga','Тайга'],['bamboo','Бамбук']];
const BOARD_FOR = { classic:'wood', leo:'savanna', gems:'pearl', fox:'forest', lynx:'taiga', panda:'bamboo', wolf:'night' };
$('optPieces').innerHTML = PIECES.map(([k, t]) => `<button class="opt" data-pieces="${k}"><span class="sw-p th-${BOARD_FOR[k]}${k === 'classic' ? '' : ' pt-' + k}"><i class="pc wn"></i><i class="pc bn"></i></span>${t}</button>`).join('');
$('optBoard').innerHTML = BOARDS.map(([k, t]) => `<button class="opt" data-board="${k}"><span class="sw-b th-${k}"></span>${t}</button>`).join('');
/* Themed piece sets live in the page as raw SVG (JSON in #pieceSets) and become CSS only when used:
   first as vector images (at once), then, piece by piece in the background, as PNG bitmaps.
   Browsers redraw vector images on every repaint, and the big themed drawings (hundreds of facets in
   «Самоцвіти») made moves and scrolling stutter; a bitmap is drawn once. Any failure keeps the vectors. */
const Raster = (() => {
  const CODES = ['wk','wq','wr','wb','wn','wp','bk','bq','br','bb','bn','bp'], done = {}, vec = {}; let sets = null;
  function svgOf(theme, code){
    if (!sets){ try { sets = JSON.parse($('pieceSets').textContent); } catch(e){ sets = {}; } }
    return (sets[theme] || {})[code];
  }
  const uri = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  function vector(theme){
    if (theme === 'classic' || vec[theme]) return; vec[theme] = true;
    const st = document.createElement('style'); st.dataset.vector = theme;
    st.textContent = CODES.filter(c => svgOf(theme, c)).map(c => `.pt-${theme} .pc.${c}{background-image:url("${uri(svgOf(theme, c))}")}`).join('\n');
    document.head.appendChild(st);
  }
  async function one(theme, code, size){
    const svg = svgOf(theme, code); if (!svg) return '';
    const img = new Image(); img.src = uri(svg); await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = size;
    c.getContext('2d').drawImage(img, 0, 0, size, size);
    return `.pt-${theme} .pc.${code}{background-image:url("${c.toDataURL('image/png')}")}`;
  }
  function make(theme){
    if (!theme || theme === 'classic') return;
    vector(theme); if (done[theme]) return done[theme];
    const sq = ($('board').clientWidth || 400) / 8, size = Math.max(128, Math.min(256, Math.ceil(sq * (window.devicePixelRatio || 1))));
    const pause = () => new Promise(r => setTimeout(r, 0));   // one piece at a time, so the page never freezes
    return done[theme] = (async () => { const rules = []; for (const c of CODES){ rules.push(await one(theme, c, size)); await pause(); } return rules; })().then(rules => {
      if (rules.some(r => !r)) throw new Error('no vector image for ' + theme);
      const st = document.createElement('style'); st.dataset.raster = theme; st.textContent = rules.join('\n'); document.body.appendChild(st);
      const v = document.head.querySelector(`style[data-vector="${theme}"]`); if (v) v.remove();   // the vectors are no longer needed
    }).catch(() => { delete done[theme]; });
  }
  return { make, async all(){ PIECES.forEach(([k]) => k !== 'classic' && vector(k)); for (const [k] of PIECES) await make(k); } };
})();
function applyStyle(){
  const pcs = prefs.pieces || 'classic', th = prefs.board || 'wood';
  ['board', 'lib', 'logo'].forEach(id => { const el = $(id);
    el.className = el.className.split(' ').filter(c => c && !/^(th|pt)-/.test(c)).join(' ');
    el.classList.add('th-' + th); if (pcs !== 'classic') el.classList.add('pt-' + pcs); });
  document.querySelectorAll('[data-pieces]').forEach(b => b.classList.toggle('on', b.dataset.pieces === pcs));
  document.querySelectorAll('[data-board]').forEach(b => b.classList.toggle('on', b.dataset.board === th));
  $('coach').hidden = !COACH_ON || prefs.coach === 'off';
  Raster.make(pcs);
}
$('settings').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b) return;
  if (b.dataset.pieces){ prefs.pieces = b.dataset.pieces; prefs.board = BOARD_FOR[prefs.pieces]; } else prefs.board = b.dataset.board;
  savePrefs(); applyStyle(); });
$('bSettings').onclick = () => { openSheet('settings'); setTimeout(Raster.all, 350); };   // swatches too, after the sheet slid in

/* ---------- leopard coach: mime only ---------- */
const COACH_ON = false;                 // hidden for now at the author's request; true brings the leopard back (also restore #optCoach in index.html)
const Coach = (() => {
  const svg = $('coachSvg'); let t = null;
  function react(mood){
    if (!COACH_ON || prefs.coach === 'off') return;
    clearTimeout(t);
    svg.setAttribute('class', 'leo-coach'); void svg.getBoundingClientRect();   // restart animations
    svg.setAttribute('class', 'leo-coach m-' + mood);
    if (mood !== 'idle') t = setTimeout(() => svg.setAttribute('class', 'leo-coach m-idle'), mood === 'cheer' ? 3200 : 2600);
  }
  function kind(san){
    const s = san.replace(/[!?]+$/, '');
    if (s.includes('#')) return 'mate';
    if (s.startsWith('O-O')) return 'castle';
    if (s.includes('+')) return 'check';
    if (s.includes('x')) return 'capture';
    return /^[NBRQ]/.test(s) ? 'piece' : 'other';
  }
  const MOOD = { mate:'cheer', castle:'cool', check:'surprised', capture:'pounce', piece:'happy', other:'idle' };
  return {
    view(san){ react(MOOD[kind(san)]); },
    idle(){ react('idle'); },
    mine(san){ const k = kind(san); react(k === 'piece' || k === 'other' ? 'happy' : MOOD[k]); },
    opp(san){ const k = kind(san); react(k === 'check' ? 'surprised' : k === 'capture' || k === 'castle' ? 'think' : 'idle'); },
    wrong(){ react('sad'); },
    hint(){ react('think'); },
    finish(m){ react(m === 0 ? 'cheer' : 'happy'); }
  };
})();

/* ---------- free analysis: variation tree, both sides ---------- */
const AN_KEY = 'openingTrainerAn';
function anStore(){ try { return JSON.parse(localStorage.getItem(AN_KEY) || '{}') } catch(e){ return {} } }
function anSave(){
  const N = S.an.nodes, paths = [];
  N.forEach(n => { if (n && !n.main && !n.ch.some(c => N[c] && !N[c].main)) { const p = []; let x = n; while (x.p !== null){ p.unshift(x.uci); x = N[x.p]; } paths.push(p); } });
  const all = anStore(); if (paths.length) all[line().id] = paths; else delete all[line().id];
  try { localStorage.setItem(AN_KEY, JSON.stringify(all)) } catch(e){}
}
const anNode = (id = S.an.cur) => S.an.nodes[id];
function anAdd(pid, mv, main, com){
  const N = S.an.nodes, p = N[pid];
  const id = N.length; N.push({ id, p: pid, san: mv.san, uci: mv.from + mv.to + (mv.promotion || ''), fen: null, ch: [], main, com: com || '', d: p.d + 1 });
  const g = new Chess(p.fen); g.move(mv); N[id].fen = g.fen(); p.ch.push(id); return id;
}
function anPlay(pid, uci, main, com){
  const p = S.an.nodes[pid];
  const ex = p.ch.find(c => S.an.nodes[c] && S.an.nodes[c].uci === uci); if (ex !== undefined) return ex;
  const g = new Chess(p.fen);
  const mv = g.move({ from: uci.slice(0,2), to: uci.slice(2,4), promotion: uci[4] || 'q' }); if (!mv) return null;
  return anAdd(pid, { from: mv.from, to: mv.to, promotion: mv.promotion, san: mv.san }, main, com);
}
function anBuild(){
  const L = line(), M = L.mg && !L.mg.custom ? L.mg : null;
  S.an = { nodes: [{ id: 0, p: null, san: '', uci: '', fen: new Chess().fen(), ch: [], main: true, com: '', d: 0 }], cur: 0, mainIds: [0] };
  let id = 0;
  L.uci.forEach((u, i) => { id = anPlay(id, u, true, L.com[i+1]); S.an.mainIds.push(id); });
  if (M) M.uci.forEach((u, i) => { id = anPlay(id, u, true, M.why[i] ? '(мітельшпіль) ' + M.why[i] : '(мітельшпіль)'); S.an.mainIds.push(id); });
  (anStore()[L.id] || []).forEach(path => { let x = 0; for (const u of path){ const y = anPlay(x, u, false); if (y === null) break; x = y; } });
}
function startAn(fromPly){
  stopTimers();
  anBuild(); S.sel = null; S.dests = null; S.done = false; S.busy = false; S.hint = 0;
  S.an.cur = S.an.mainIds[Math.max(0, Math.min(fromPly || 0, S.an.mainIds.length - 1))];
  S.flip = line().side === 'b'; S.showBest = false; Eng.clear(); render(); anMsg(); Coach.idle(); engReq();
}
function anGo(id, animateCoach){
  if (id === undefined || id === null || !S.an.nodes[id]) return;
  S.an.cur = id; S.sel = null; S.dests = null; S.showBest = false; render(); anMsg(); engReq();
  if (animateCoach && id) Coach.view(anNode().san);
}
function anLabel(n, force){ const white = n.d % 2 === 1, num = Math.ceil(n.d / 2); return white ? `${num}.` : (force ? `${num}…` : ''); }
function anMoves(){
  const N = S.an.nodes;
  const mv = (id, force) => { const n = N[id]; const lb = anLabel(n, force);
    const mk = engOn() ? moveMark(n) : '', e0 = engOn() && !n.main ? evOf(n) : null, e = okEv(e0) ? e0 : null;
    const q = mk ? `<span class="q ${mk === '??' ? 'q3' : mk === '?' ? 'q2' : 'q1'}">${mk}</span>` : '';
    return `<span class="mv${id === S.an.cur ? ' cur' : ''}${n.main ? '' : ' alt'}${n.com ? ' c' : ''}" data-n="${id}">${lb ? `<span class="n">${lb}</span>` : ''}${n.san}${q}${e ? `<span class="evc">${evText(e)}</span>` : ''}</span>`; };
  const cont = (id, force, lvl) => { let out = '', x = id;
    while (true){ const ch = N[x].ch.filter(c => N[c]); if (!ch.length) break;
      const [m, ...alts] = ch; out += mv(m, force) + ' '; force = false;
      for (const a of alts){
        const body = mv(a, true) + ' ' + cont(a, false, lvl + 1);
        out += lvl === 0 ? `<span class="var v1">${body}</span>` : `<span class="var v2">(${body.trim()}) </span>`;
        force = true; }
      x = m; }
    return out; };
  return `<div class="anmv">${cont(0, true, 0)}</div>`;
}
/* ---------- plain-language explanation built from the engine's lines ---------- */
const PV_ = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PNAME = { p: 'пішака', n: 'коня', b: 'слона', r: 'туру', q: 'ферзя', k: 'короля' };
const PNOM = { p: 'Пішак', n: 'Кінь', b: 'Слон', r: 'Тура', q: 'Ферзь', k: 'Король' };
function matW(fen){ let s = 0; for (const ch of fen.split(' ')[0]) { const l = ch.toLowerCase(); if (PV_[l] !== undefined) s += ch === l ? -PV_[l] : PV_[l]; } return s; }
// play an engine line from fen; return material swing for `side` and what each side captured
function runLine(fen, pv, side, maxPly = 6){
  const g = new Chess(fen), m0 = matW(fen), lost = [], won = []; let n = Math.min(maxPly, pv.length); if (n > 1 && n % 2) n--;
  const moves = [];
  for (let i = 0; i < n; i++){
    const u = pv[i], m = g.move({ from: u.slice(0,2), to: u.slice(2,4), promotion: u[4] || 'q' }); if (!m) break;
    moves.push(m);
    if (m.captured){ (m.color === side ? won : lost).push(m.captured); }
  }
  const d = (matW(g.fen()) - m0) * (side === 'w' ? 1 : -1);
  return { swing: d, lost, won, moves };
}
const topPc = arr => arr.slice().sort((a, b) => PV_[b] - PV_[a])[0];
const mateFor = (e, side) => e && e.mate !== undefined && e.mate !== 0 && ((e.mate > 0) === (side === 'w'));
function explain(n){
  if (!n || n.main || n.p === null || !engOn()) return '';
  const p = S.an.nodes[n.p], ep = evOf(p), en = evOf(n);
  const ready = e => e && (e.terminal || e.d >= MIN_D);
  if (!ready(en) || !deepEv(ep)) return '<span class="why wait">💡 Рушій ще рахує цю позицію…</span>';
  const side = p.fen.split(' ')[1], opp = side === 'w' ? 'b' : 'w';
  const best = ep.pv && ep.pv.length ? pvSan(p.fen, ep.pv, 1) : '';
  const bestLine = ep.pv && ep.pv.length ? pvSan(p.fen, ep.pv, 5) : '';
  const reply = en.pv && en.pv.length ? pvSan(n.fen, en.pv, 4) : '';
  const g = new Chess(n.fen);
  if (g.in_checkmate()) return '<span class="why ok">💡 Мат! Кращого ходу не буває.</span>';
  if (ep.pv && ep.pv[0] === n.uci) return '<span class="why ok">💡 Це найкращий хід за рушієм.</span>';
  const mark = moveMark(n), out = [];
  if (mateFor(ep, side) && !mateFor(en, side)) out.push(`Пропущено мат: <b>${bestLine}</b>.`);
  else if (mateFor(en, opp)) out.push(`Після цього ходу суперник ставить мат: <b>${reply}</b>.`);
  else {
    const r = en.pv ? runLine(n.fen, en.pv, side) : null;            // what the opponent does next
    const first = r && r.moves[0];
    if (r && r.swing <= -2.5 && r.lost.length){
      const pc = topPc(r.lost);
      out.push(first && first.captured && PV_[first.captured] >= 3
        ? `${PNOM[first.captured]} на ${first.to} ${first.captured === 'r' ? 'залишилася' : 'залишився'} без захисту — суперник одразу бере: <b>${reply}</b>.`
        : `Суперник виграє ${PNAME[pc]}: <b>${reply}</b>.`);
    } else if (r && r.swing <= -0.9 && r.lost.length){
      out.push(`Суперник виграє пішака: <b>${reply}</b>.`);
    } else {
      const b = ep.pv ? runLine(p.fen, ep.pv, side) : null;          // what the best move would have achieved
      if (b && b.swing >= 2.5 && b.won.length) out.push(`Пропущено виграш ${PNAME[topPc(b.won)]}: <b>${bestLine}</b>.`);
      else if (b && b.swing >= 0.9 && b.won.length) out.push(`Пропущено виграш пішака: <b>${bestLine}</b>.`);
    }
  }
  if (!mark && !out.length) return `<span class="why ok">💡 Хід тримає позицію: різниця з найкращим (${best}) невелика.</span>`;
  if (!out.length && mark === '?!') out.push(`Неточність: хід не програє матеріалу, але сильніше було <b>${best}</b> (оцінка ${evText(ep)} замість ${evText(en)}).`);
  else if (!out.length) out.push(`Оцінка змінилась з ${evText(ep)} до ${evText(en)} — позиція помітно погіршилась без прямої втрати матеріалу. Подивись, що дає суперникові його відповідь: <b>${reply}</b>.`);
  if (best && !/Пропущено|Неточність/.test(out[0])) out.push(`Краще було <b>${best}</b>.`);
  const cls = mark === '??' ? 'bad' : mark === '?' ? 'mid' : 'soft';
  return `<span class="why ${cls}">💡 ${out.join(' ')}</span>`;
}

function anMsg(){
  const n = anNode(), g = new Chess(n.fen), N = S.an.nodes;
  const side = g.turn() === 'w' ? 'білих' : 'чорних';
  let st = g.in_checkmate() ? '<b>Мат.</b>' : g.in_stalemate() ? '<b>Пат — нічия.</b>' : g.in_draw() ? '<b>Нічия.</b>' : (g.in_check() ? `<b>Шах!</b> Хід ${side}.` : `Хід ${side}.`);
  let head = n.id ? `<b>${anLabel(n, true)} ${n.san}</b>` : '<b>Початкова позиція.</b>';
  let txt = '';
  if (n.main) txt = n.com ? ' — ' + n.com : '';
  else {
    let x = n; while (!N[x.p].main) x = N[x.p];
    const par = N[x.p], lineMv = par.ch.map(c => N[c]).find(c => c && c.main);
    txt = ` — <span class="var-tag">варіант</span> ${lineMv ? `За лінією тут було <b>${anLabel(lineMv, true)} ${lineMv.san}</b>.` : 'Позиція вже за межами лінії.'}`;
  }
  const why = explain(n);
  setMsg(`${head}${txt}${why ? '<br>' + why : ''}<br>${st} Ходи вільно за обидві сторони — кожен новий хід стає варіантом.`);
}
function anTap(sq){
  const n = anNode(), g = new Chess(n.fen);
  if (S.sel && S.dests && S.dests[sq]){
    const mv = S.dests[sq]; const uci = mv.from + mv.to + (mv.promotion ? 'q' : '');
    const was = n.ch.find(c => S.an.nodes[c] && S.an.nodes[c].uci === uci);
    const id = anPlay(n.id, uci, false); if (id === null) return;
    if (was === undefined) anSave();
    anGo(id, true); return;
  }
  const pc = g.get(sq);
  if (pc && pc.color === g.turn() && S.sel !== sq){
    S.sel = sq; S.dests = {};
    g.moves({ square: sq, verbose: true }).forEach(m => { S.dests[m.to] = m; });
  } else { S.sel = null; S.dests = null; }
  renderBoard();
}
function anDelete(){
  const n = anNode(); if (n.main || n.p === null) return;
  const N = S.an.nodes, kill = id => { N[id].ch.forEach(kill); N[id] = null; };
  const par = N[n.p]; par.ch = par.ch.filter(c => c !== n.id); kill(n.id); anSave(); anGo(par.id);
}
function anToLine(){ let x = anNode(); while (!x.main) x = S.an.nodes[x.p]; anGo(x.id); }
function anEnd(){ let x = anNode(); while (x.ch.length){ const c = x.ch.map(i => S.an.nodes[i]).find(Boolean); if (!c) break; x = c; } anGo(x.id); }
function anClearAll(){
  const all = anStore(); delete all[line().id]; try { localStorage.setItem(AN_KEY, JSON.stringify(all)) } catch(e){}
  const mainDepth = (() => { let x = anNode(); while (!x.main) x = S.an.nodes[x.p]; return x.d; })();
  startAn(mainDepth);
}

/* ---------- Stockfish (asm.js, runs in a Web Worker) ---------- */
const Eng = (() => {
  let w = null, failed = false, cur = null, queue = [], cache = {}, onUpd = () => {};
  const key = fen => fen.split(' ').slice(0, 4).join(' ');
  let flavour = 'wasm', okT = null;
  function spawn(id){
    const wk = new Worker(URL.createObjectURL(new Blob([$(id).textContent], { type: 'text/javascript' })));
    wk.onmessage = e => { const l = String(e.data); if (l.startsWith('uciok')) clearTimeout(okT); onLine(l); };
    wk.onerror = () => fallback();
    wk.postMessage('uci'); wk.postMessage('setoption name Hash value 32'); wk.postMessage('isready');
    return wk;
  }
  function fallback(){                       // WebAssembly build failed: use the slower asm.js build
    clearTimeout(okT); try { w && w.terminate(); } catch(e){}
    if (flavour === 'asm'){ failed = true; w = null; cur = null; return; }
    flavour = 'asm'; const again = cur; cur = null;
    try { w = spawn('sfsrc'); } catch(e){ failed = true; w = null; return; }
    if (again) queue.unshift(again); next();
  }
  function start(){
    if (w || failed) return;
    try { w = spawn('sfwasm'); okT = setTimeout(fallback, 6000); } catch(e){ fallback(); }
  }
  function onLine(l){
    if (!cur) return;
    if (l.startsWith('info') && l.includes(' pv ') && l.includes(' score ') && !/ (upper|lower)bound/.test(l)){
      const d = +l.match(/ depth (\d+)/)[1], m = l.match(/ score (cp|mate) (-?\d+)/);
      const sgn = cur.fen.split(' ')[1] === 'w' ? 1 : -1;
      const r = m[1] === 'cp' ? { cp: +m[2] * sgn, d } : { mate: +m[2] * sgn, d };
      r.pv = l.split(' pv ')[1].trim().split(' ');
      const k = key(cur.fen); if (!cache[k] || cache[k].d <= d) cache[k] = r;
      onUpd(cur.fen, false);
    } else if (l.startsWith('bestmove')){
      const f = cur.fen, c = cache[key(f)];
      if (c && !cur.stopped) c.full = true;     // search ran to its own limit, not interrupted
      cur = null; onUpd(f, true); next();
    }
  }
  function next(){
    if (cur || !w || !queue.length) return;
    cur = queue.shift(); w.postMessage('position fen ' + cur.fen); w.postMessage(`go depth ${cur.depth} movetime ${cur.ms}`);
  }
  function req(fen, fg){
    start(); if (!w) return false;
    const k = key(fen), depth = fg ? (flavour === 'wasm' ? 24 : 18) : (flavour === 'wasm' ? 18 : 14), c = cache[k];
    if (c && c.d >= depth) return true;
    if (fg){
      queue = queue.filter(q => key(q.fen) !== k);
      if (cur && key(cur.fen) === k && !cur.stopped) return true;
      queue.unshift({ fen, depth, ms: 4000, fg: true });
      if (cur){ cur.stopped = true; w.postMessage('stop'); }
    } else if (!(cur && key(cur.fen) === k && !cur.stopped) && !queue.some(q => key(q.fen) === k)){
      queue.push({ fen, depth, ms: flavour === 'wasm' ? 4000 : 3000 });
    }
    next(); return true;
  }
  return { req, get: fen => cache[key(fen)], flavour: () => failed ? 'none' : flavour, deep: () => flavour === 'wasm' ? 18 : 14, onUpdate(f){ onUpd = f; }, pending: () => queue.length + (cur ? 1 : 0),
           clear(){ queue = []; if (cur && w){ cur.stopped = true; w.postMessage('stop'); } }, failed: () => failed };
})();

const engOn = () => prefs.engine !== 'off';
function evOf(n){
  if (!n) return null;
  const g = new Chess(n.fen);
  if (g.in_checkmate()) return { mate: 0, loser: g.turn(), d: 99, terminal: true };
  if (g.in_draw() || g.in_stalemate()) return { cp: 0, d: 99, terminal: true };
  return Eng.get(n.fen) || null;
}
function evPawns(e){                       // white's point of view, in pawns
  if (!e) return null;
  if (e.mate !== undefined){ if (e.mate === 0) return e.loser === 'w' ? -100 : 100; return e.mate > 0 ? 100 - e.mate : -100 - e.mate; }
  return e.cp / 100;
}
function evText(e){
  if (!e) return '…';
  if (e.mate !== undefined) return e.mate === 0 ? (e.loser === 'w' ? '0–1' : '1–0') : `#${e.mate > 0 ? '' : '−'}${Math.abs(e.mate)}`;
  const v = e.cp / 100; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
}
const MIN_D = 14;                           // shallower scores are too noisy to judge a move
const okEv = e => e && (e.terminal || e.d >= MIN_D);
const deepEv = e => e && (e.terminal || e.d >= Eng.deep() || (e.full && e.d >= MIN_D));
const winCh = p => 2 / (1 + Math.exp(-0.368 * p)) - 1;   // pawns -> winning chances in [-1, 1] (as on Lichess)
function moveMark(n){                      // ?!, ?, ?? for the move that led to node n
  if (!n || n.p === null || n.main) return '';           // the main line keeps its human annotations
  const p = S.an.nodes[n.p], en = evOf(n), ep = evOf(p);
  if (!okEv(en) || !deepEv(ep)) return '';   // judge only against a deep score of the position before the move
  if (ep.pv && ep.pv[0] === n.uci) return '';                                // the engine's own choice is never a mistake
  const wMove = p.fen.split(' ')[1] === 'w';
  const a = evPawns(ep), b = evPawns(en);
  const loss = (winCh(a) - winCh(b)) * (wMove ? 1 : -1);
  if (loss >= 0.3) return '??'; if (loss >= 0.2) return '?'; if (loss >= 0.1) return '?!'; return '';
}
function pvSan(fen, pv, n = 6){
  const g = new Chess(fen); let out = [], ply0 = (+fen.split(' ')[5] - 1) * 2 + (fen.split(' ')[1] === 'b' ? 1 : 0);
  for (let i = 0; i < Math.min(n, pv.length); i++){
    const u = pv[i], m = g.move({ from: u.slice(0,2), to: u.slice(2,4), promotion: u[4] || 'q' }); if (!m) break;
    const a = ply0 + i; out.push((a % 2 === 0 ? `${a/2+1}. ` : (i === 0 ? `${Math.floor(a/2)+1}… ` : '')) + m.san);
  }
  return out.join(' ');
}
function engPanel(){
  const box = $('engBox'); box.hidden = S.mode !== 'an';
  if (S.mode !== 'an') return;
  $('engOn').checked = engOn();
  const n = anNode(), e = evOf(n);
  $('engBody').hidden = !engOn();
  if (!engOn()) return;
  if (Eng.failed()){ $('evNum').textContent = '—'; $('evInfo').textContent = 'Рушій не запустився в цьому браузері.'; return; }
  const v = evPawns(e);
  $('evFill').style.width = (v === null ? 50 : 50 + 50 * Math.tanh(v / 4)) + '%';
  $('evNum').textContent = evText(e);
  const mark = moveMark(n);
  const verdict = mark === '??' ? ' · хід програє багато' : mark === '?' ? ' · помилка' : mark === '?!' ? ' · неточність' : '';
  $('evInfo').textContent = e ? (e.terminal ? 'Гру завершено' : `глибина ${e.d}${Eng.pending() ? ' · рахую…' : ''}`) + verdict : 'рахую…';
  const best = e && e.pv && e.pv.length ? pvSan(n.fen, e.pv) : '';
  $('evPv').innerHTML = S.showBest && best ? `Найкраще продовження: <b>${best}</b>` : '';
  $('aBest').textContent = S.showBest ? 'Сховати найкращий хід' : 'Показати найкращий хід';
  $('aBest').disabled = !best;
  const q = Eng.pending(); $('aCheck').textContent = q > 1 ? `Перевіряю… (${q})` : 'Перевірити мої варіанти';
}
function engReq(){
  if (S.mode !== 'an' || !engOn()) return;
  const n = anNode(), g = new Chess(n.fen);
  if (!g.game_over()) Eng.req(n.fen, true);
  if (n.p !== null && !(evOf(S.an.nodes[n.p]) || {}).terminal) Eng.req(S.an.nodes[n.p].fen, false);
}
Eng.onUpdate((fen, final) => {
  if (S.mode !== 'an') return;
  if (anNode().fen === fen || final) engPanel();
  if (final){ $('moves').innerHTML = anMoves(); if (S.showBest) renderBoard();
    const n = anNode(); if (!n.main && (n.fen === fen || (n.p !== null && S.an.nodes[n.p].fen === fen))) anMsg(); }
});

let movesKey = '', infoKey = '';
function renderMoves(){
  if (S.mode === 'an'){ movesKey = ''; $('moves').innerHTML = anMoves(); return; }
  if (S.mode === 'play'){ movesKey = ''; $('moves').innerHTML = playMoves(); return; }
  if (S.mode === 'puz'){ movesKey = ''; $('moves').innerHTML = puzMoves(); return; }
  const growing = (S.mode === 'train' || S.mode === 'mg') && !S.done;
  const key = [S.op, S.ln, S.mode, S.done, growing ? S.ply : ''].join('|');
  if (key === movesKey){                 // same list: only the highlighted move changes
    const o = $('moves').querySelector('.mv.cur'), n = $('moves').querySelector(`.mv[data-p="${S.ply}"]`);
    if (o !== n){ if (o) o.classList.remove('cur'); if (n) n.classList.add('cur'); }
    return;
  }
  movesKey = key;
  const L = cur(); let h = '';
  L.san.forEach((s, i) => {
    const lb = label(i); const num = (lb.endsWith('.') || i === 0) ? `<span class="n">${lb}</span>` : '';
    if ((S.mode === 'train' || S.mode === 'mg') && !S.done && i >= S.ply) return;
    const c = (S.mode === 'mg' ? L.why[i] : L.com[i+1]) ? ' c' : '';
    h += `<span class="mv${S.ply===i+1?' cur':''}${c}" data-p="${i+1}">${num}${s}</span>`;
  });
  $('moves').innerHTML = h || (S.mode!=='view' ? '<span style="color:var(--mut)">Ходи зʼявлятимуться в міру тренування.</span>' : '');
}

function renderInfo(){
  if (S.mode === 'play') return playInfo();
  if (S.mode === 'puz') return puzInfo();
  const O = DATA[S.op], L = line();
  const key = [S.op, S.ln, S.mode, JSON.stringify(prog[L.id + (S.mode === 'mg' ? '#mg' : '')] || 0)].join('|');
  if (key === infoKey) return; infoKey = key;
  $('lnTitle').textContent = L.name + (S.mode === 'mg' ? ' · мітельшпіль' : S.mode === 'an' ? ' · аналіз' : '');
  $('lnSub').textContent = S.mode === 'an' ? 'Основна лінія звичайним шрифтом, твої варіанти — курсивом. Варіанти зберігаються в цьому браузері.'
    : S.mode === 'mg'
    ? `План: ${L.mg.goal}. Граєш за ${L.mg.side==='w'?'білих':'чорних'} · завдань: ${L.mg.kind.filter(k => k==='t').length}`
    : O.id === 'morphy' ? `${O.name} · ${Math.ceil(L.san.length/2)} ходів · Морфі грає ${L.side==='w'?'білими':'чорними'} · у тренуванні шукаєш його ходи`
    : O.id === 'minis' ? `${O.name} · ${Math.ceil(L.san.length/2)} ходів · атакують ${L.side==='w'?'білі':'чорні'} · у тренуванні шукаєш їхні ходи`
    : `${O.name} · ${O.eco} · ${Math.ceil(L.san.length/2)} ходів · основна сторона: ${L.side==='w'?'білі':'чорні'}`;
  $('plan').innerHTML = `<p><span class="lbl"><i class="disc w"></i>Білі:</span> ${L.plan.w}</p><p><span class="lbl"><i class="disc b"></i>Чорні:</span> ${L.plan.b}</p>`;
  $('intro').textContent = O.intro; const mo = O.id === 'morphy' || O.id === 'minis';
  $('hPlan').textContent = mo ? 'Уроки партії' : 'План у мітельшпілі'; $('hIntro').textContent = O.id === 'morphy' ? 'Стиль Морфі' : O.id === 'minis' ? 'Про розділ' : 'Про дебют';
  const p = prog[L.id + (S.mode === 'mg' ? '#mg' : '')];
  $('stats').innerHTML = icon('star') + (p ? `Пройдено ${p.runs} ${plural(p.runs, 'раз', 'рази', 'разів')}, найкращий результат: ${p.best === 0 ? 'без помилок' : `${p.best} ${plural(p.best, 'помилка', 'помилки', 'помилок')}`}.` : (S.mode === 'mg' ? 'Мітельшпіль цієї лінії ще не тренували.' : 'Цю лінію ще не тренували.'));
}

function setMsg(html, err){ const m = $('msg'); m.innerHTML = html; m.classList.toggle('err', !!err); }

function viewMsg(){
  const L = line();
  if (S.ply === 0) { setMsg('Натисни ▶, щоб іти ходами. Коментарі зʼявлятимуться тут.'); return; }
  const i = S.ply - 1; const n = Math.floor(i/2)+1;
  const head = `<b>${n}${i%2===0?'.':'…'} ${L.san[i]}</b>`;
  setMsg(L.com[S.ply] ? `${head} — ${L.com[S.ply]}` : head + (S.ply === L.san.length ? ' — кінець лінії. Подивись план праворуч.' : ''));
}

function render(){ const mgB = document.querySelector('#mode button[data-m="mg"]'); mgB.hidden = !line().mg; $('mode').classList.toggle('three', !line().mg);
  renderTabs(); renderBoard(); renderMoves(); renderInfo(); engPanel(); $('ctrlView').hidden = S.mode!=='view'; $('ctrlTrain').hidden = S.mode!=='train' && S.mode!=='mg'; $('ctrlAn').hidden = S.mode!=='an'; $('ctrlPlay').hidden = S.mode!=='play'; $('ctrlPuz').hidden = S.mode!=='puz'; $('bSide').hidden = S.mode==='mg';
  $('bSide').textContent = 'Граю за: ' + (S.side==='w'?'білих':'чорних');
  document.querySelectorAll('#mode button').forEach(b => b.classList.toggle('on', b.dataset.m === S.mode));
  if (S.mode === 'an') { const n = anNode(); $('aPrev').disabled = $('aStart').disabled = n.p === null; $('aNext').disabled = $('aEnd').disabled = !n.ch.some(c => S.an.nodes[c]);
    $('aDel').disabled = n.main; $('aLine').disabled = n.main; }
  if (S.mode === 'play') playButtons();
  if (S.mode === 'puz') puzButtons();
  if (S.mode === 'view') { $('bPrev').disabled = $('bStart').disabled = S.ply===0; $('bNext').disabled = $('bEnd').disabled = S.ply===line().san.length; }
}

function setAuto(on){ $('bAuto').innerHTML = icon(on ? 'pause' : 'play') + `<span>${on ? 'Стоп' : 'Авто'}</span>`; }
function stopAuto(){ if (S.auto){ clearInterval(S.auto); S.auto = null; setAuto(false); } }
function go(p){ const prev = S.ply; S.ply = Math.max(0, Math.min(line().san.length, p)); render(); viewMsg();
  if (S.mode !== 'view') return;
  if (S.ply === prev + 1) Coach.view(line().san[S.ply - 1]);
  else if (S.ply === 0) Coach.idle();
  else if (S.ply !== prev) Coach.idle(); }

function selectLine(op, ln){
  if (S.mode === 'play'){ leavePlay(); S.mode = 'view'; }
  if (S.mode === 'puz'){ leavePuz(); S.mode = 'view'; }
  stopAuto(); stopTimers(); S.op = op; S.ln = ln; S.lib = op; (S.lastLn = S.lastLn || {})[op] = ln; S.side = line().side;
  if (S.mode === 'mg' && !line().mg) S.mode = 'view';
  if (S.mode === 'train') startTrain(); else if (S.mode === 'mg') startMg(); else if (S.mode === 'an') startAn(0); else { S.flip = S.side === 'b'; go(0); }
}

/* ---------- training ---------- */
function startTrain(){
  stopTimers();
  S.ply = 0; S.lastMine = ''; S.sel = null; S.hint = 0; S.mistakes = 0; S.done = false; S.busy = false; S.flash = null;
  S.flip = S.side === 'b'; render();
  Coach.idle();
  if (turnAt(0) !== S.side) { setMsg('Суперник ходить першим…'); oppMove(); }
  else setMsg(`Твій хід за ${S.side==='w'?'білих':'чорних'}. Зіграй перший хід лінії «${line().name}».`);
}

/* pending opponent moves / middlegame steps must never leak into another line or mode */
function stopTimers(){ clearTimeout(S.mgT); clearTimeout(S.oppT); clearTimeout(S.flashT); S.flash = null; S.busy = false; }
function oppMove(){
  S.busy = true;
  clearTimeout(S.oppT); S.oppT = setTimeout(() => { S.ply++; S.busy = false; afterMove(false); }, 900);
}

function afterMove(mine){
  const L = line(); S.sel = null; S.hint = 0; render();
  const i = S.ply - 1; const n = Math.floor(i/2)+1; const mv = `${n}${i%2===0?'.':'…'} ${L.san[i]}`;
  const c = L.com[S.ply] ? ` — ${L.com[S.ply]}` : '';
  if (S.ply >= L.san.length) { finish(mine, mv + c); return; }
  if (mine) Coach.mine(L.san[i]); else Coach.opp(L.san[i]);
  if (mine) { S.lastMine = `<b>✓ ${mv}</b>${c}`; setMsg(S.lastMine); oppMove(); }
  else { setMsg((S.lastMine ? S.lastMine + '<br>' : '') + `Суперник: <b>${mv}</b>${c}<br><i>Твій хід.</i>`); S.lastMine = ''; }
}

function finish(mine, last){
  S.done = true; const L = line();
  const p = prog[L.id] || { runs:0, best:99 }; p.runs++; p.best = Math.min(p.best, S.mistakes); prog[L.id] = p; store.set(prog);
  render(); Coach.finish(S.mistakes);
  const res = S.mistakes === 0 ? '🎉 Лінію пройдено без помилок!' : `Лінію пройдено. Помилок: ${S.mistakes}. Спробуй ще раз без них.`;
  setMsg(`<b>${last}</b><br><br>${res}<br>Тепер прочитай план у мітельшпілі — саме заради нього ці ходи.`);
}

function tap(n){
  if (S.mode === 'play') return playTap(n);
  if (S.mode === 'puz') return puzTap(n);
  if (S.mode === 'an') return anTap(n);
  if (S.mode === 'mg') return mgTap(n);
  if (S.mode !== 'train' || S.done || S.busy) return;
  const L = line(); if (turnAt(S.ply) !== S.side) return;
  const pos = parseFen(L.fen[S.ply]); const pc = pos[n];
  if (pc && pc[0] === S.side) { S.sel = (S.sel === n ? null : n); renderBoard(); return; }
  if (!S.sel) return;
  const exp = L.uci[S.ply]; const tryMv = S.sel + n;
  if (tryMv === exp.slice(0,4)) { S.ply++; afterMove(true); flash(n,'good'); }
  else {
    S.mistakes++; S.sel = null; flash(n,'bad'); Coach.wrong(S.mistakes);
    setMsg(`Не за лінією. Спробуй ще раз — або натисни «Підказка». Помилок: ${S.mistakes}.`, true);
  }
}

/* ---------- middlegame trainer ---------- */
function mgLog(html){ S.log.push(html); setMsg(S.log.slice(-3).join('<br>')); }
function startMg(){
  const M = line().mg; stopTimers();
  S.ply = 0; S.sel = null; S.hint = 0; S.mistakes = 0; S.done = false; S.busy = true; S.flash = null; S.log = [];
  S.side = M.side; S.flip = M.side === 'b'; render(); Coach.idle();
  const nT = M.kind.filter(k => k === 't').length;
  mgLog(`<b>Мітельшпіль: ${M.goal}.</b> ${M.custom ? 'Позиція — якщо суперник не потрапив у пастку. ' : 'Продовжуємо з кінця лінії. '}Граєш за ${M.side==='w'?'білих':'чорних'}, завдань: ${nT}.`);
  S.mgT = setTimeout(mgNext, 1100);
}
function mgNext(){
  const M = line().mg; if (S.mode !== 'mg') return;
  if (S.ply >= M.san.length) return mgFinish();
  if (M.kind[S.ply] === 't'){
    S.busy = false; const ti = M.kind.slice(0, S.ply + 1).filter(k => k === 't').length, tt = M.kind.filter(k => k === 't').length;
    mgLog(`🧩 <b>Завдання ${ti}/${tt}.</b> ${M.q[S.ply]}`); renderBoard(); return;
  }
  S.busy = true;
  S.mgT = setTimeout(() => {
    if (S.mode !== 'mg') return;
    const i = S.ply; S.ply++; S.sel = null; S.hint = 0; render();
    const who = M.kind[i] === 'o' ? 'Суперник' : 'Ти (автоматично)';
    mgLog(`${who}: <b>${label(i)} ${M.san[i]}</b>${M.why[i] ? ' — ' + M.why[i] : ''}`);
    if (M.kind[i] === 'o') Coach.opp(M.san[i]); else Coach.view(M.san[i]);
    S.mgT = setTimeout(mgNext, M.kind[S.ply] === 't' ? 500 : 900);
  }, 1000);
}
function mgTap(n){
  const M = line().mg; if (S.done || S.busy || M.kind[S.ply] !== 't') return;
  const pos = parseFen(M.fen[S.ply]); const pc = pos[n];
  if (pc && pc[0] === M.side) { S.sel = (S.sel === n ? null : n); renderBoard(); return; }
  if (!S.sel) return;
  const tryMv = S.sel + n, main = M.uci[S.ply].slice(0,4), alts = M.alts[S.ply].map(u => u.slice(0,4));
  if (tryMv === main || alts.includes(tryMv)){
    const i = S.ply; const altNote = tryMv === main ? '' : ` Твій хід теж за планом 👍 — граємо основний варіант.`;
    S.ply++; S.sel = null; S.hint = 0; S.busy = true; render(); flash(main.slice(2,4), 'good');
    mgLog(`✓ <b>${label(i)} ${M.san[i]}</b> — ${M.why[i]}${altNote}`); Coach.mine(M.san[i]);
    S.mgT = setTimeout(mgNext, 2200);
  } else {
    S.mistakes++; S.sel = null; flash(n, 'bad'); Coach.wrong(S.mistakes);
    setMsg(S.log.slice(-2).join('<br>') + `<br><span style="color:var(--bad)">Не за планом. Подумай ще — або натисни «Підказка». Помилок: ${S.mistakes}.</span>`, true);
  }
}
function mgFinish(){
  const M = line().mg, L = line(); S.done = true; S.busy = false;
  const key = L.id + '#mg'; const p = prog[key] || { runs:0, best:99 }; p.runs++; p.best = Math.min(p.best, S.mistakes); prog[key] = p; store.set(prog);
  render(); Coach.finish(S.mistakes);
  mgLog(`<br>${S.mistakes === 0 ? '🎉 План виконано без помилок!' : `План виконано. Помилок: ${S.mistakes}.`} Головна ідея: <b>${M.goal}</b>. Ходи можна переглянути в списку праворуч.`);
}

function flash(sq, cls){ clearTimeout(S.flashT); S.flash = { sq, cls }; renderBoard(); S.flashT = setTimeout(() => { S.flash = null; renderBoard(); }, 600); }

/* ---------- play against the computer ----------
   Bot: its own Stockfish worker (analysis keeps its cache). Levels 1–8: a search to a limited depth over
   several candidate moves, a weighted random choice among them (temperature T, in centipawns) and,
   sometimes, a random legal move — the way real beginners miss things. Strength grows with depth, so the
   levels are strictly ordered (checked by bot-vs-bot matches). Stockfish's own UCI_Elo was tried and
   dropped: at quick move times it was weaker than these levels and not monotonic. Level 9 is full strength.
   The ratings are rough estimates for orientation, not measured against people. */
const LEVELS = [null,
  { name: 'Пішак',       elo: '≈400',  depth: 1, mpv: 10, T: 250, rnd: .30 },
  { name: 'Кінь',        elo: '≈600',  depth: 2, mpv: 8,  T: 150, rnd: .15 },
  { name: 'Слон',        elo: '≈800',  depth: 3, mpv: 6,  T: 90,  rnd: .08 },
  { name: 'Тура',        elo: '≈1000', depth: 4, mpv: 5,  T: 65,  rnd: .05 },
  { name: 'Ферзь',       elo: '≈1200', depth: 6, mpv: 4,  T: 35,  rnd: .025 },
  { name: 'Король',      elo: '≈1400', depth: 7, mpv: 4,  T: 28,  rnd: .015 },
  { name: 'Кандидат',    elo: '≈1700', depth: 8, mpv: 3,  T: 20,  rnd: .005 },
  { name: 'Майстер',     elo: '≈2000', depth: 12, mpv: 2, T: 10,  rnd: 0 },
  { name: 'Гросмейстер', elo: 'максимум', full: true, ms: 1200 }];
const Bot = (() => {
  let w = null, booting = null, flavour = 'none', job = null, chain = Promise.resolve();
  function boot(){
    if (w) return Promise.resolve(true);
    if (booting) return booting;
    return booting = new Promise(resolve => {
      const tryOne = (id, next) => {
        let done = false, wk;
        const fail = () => { if (done) return; done = true; clearTimeout(t); try { wk.terminate(); } catch(e){} next ? next() : (booting = null, resolve(false)); };
        const t = setTimeout(fail, 8000);
        try { wk = new Worker(URL.createObjectURL(new Blob([$(id).textContent], { type: 'text/javascript' }))); } catch(e){ return fail(); }
        wk.onerror = fail;
        wk.onmessage = e => { const l = String(e.data);
          if (l === 'uciok' && !done){ done = true; clearTimeout(t); w = wk; flavour = id === 'sfwasm' ? 'wasm' : 'asm'; booting = null;
            wk.onmessage = ev => onLine(String(ev.data));
            wk.onerror = () => { w = null; if (job) job.finish(null); };
            wk.postMessage('setoption name Hash value 16'); resolve(true); } };
        wk.postMessage('uci');
      };
      tryOne('sfwasm', () => tryOne('sfsrc', null));
    });
  }
  function onLine(l){
    if (!job) return;
    if (l.startsWith('info') && l.includes(' pv ') && l.includes(' score ') && !/ (upper|lower)bound/.test(l)){
      const k = +((l.match(/ multipv (\d+)/) || [0, 1])[1]), m = l.match(/ score (cp|mate) (-?\d+)/);
      const sc = m[1] === 'cp' ? +m[2] : (+m[2] > 0 ? 20000 - +m[2] : -20000 - +m[2]);
      job.cands[k] = { uci: l.split(' pv ')[1].trim().split(' ')[0], score: sc };
    } else if (l.startsWith('bestmove')) job.finish(l.split(' ')[1]);
  }
  const uciOf = m => m.from + m.to + (m.promotion || '');
  function fallback(fen){                    // no engine at all: take the biggest capture, else any move
    const g = new Chess(fen), ms = g.moves({ verbose: true }); if (!ms.length) return null;
    const v = { p: 1, n: 3, b: 3, r: 5, q: 9 }; ms.sort((a, b) => (v[b.captured] || 0) - (v[a.captured] || 0));
    return uciOf(ms[0].captured ? ms[0] : ms[Math.floor(Math.random() * ms.length)]);
  }
  function choose(fen, cfg, cands, best){
    if (!cfg.mpv || !best || best === '(none)') return best;
    const ms = new Chess(fen).moves({ verbose: true });
    if (Math.random() < cfg.rnd) return uciOf(ms[Math.floor(Math.random() * ms.length)]);
    const list = Object.values(cands); if (!list.length) return best;
    const top = Math.max(...list.map(c => c.score)), ws = list.map(c => Math.exp((c.score - top) / cfg.T));
    let r = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++){ r -= ws[i]; if (r <= 0) return list[i].uci; }
    return best;
  }
  function run(fen, cfg){                    // one search; jobs never overlap (see chain)
    return new Promise(resolve => {
      const send = c => w.postMessage(c);
      job = { cands: {}, finish(best){ const j = job; job = null; resolve(best && best !== '(none)' ? choose(fen, cfg, j.cands, best) : null); } };
      send('setoption name MultiPV value ' + (cfg.mpv || 1));
      send('position fen ' + fen);
      send(cfg.mpv ? `go depth ${cfg.depth} movetime 2500` : 'go movetime ' + cfg.ms);   // a slow phone never waits long
    });
  }
  function ask(fen, cfg){
    const p = chain.then(() => boot()).then(ok => ok && w ? run(fen, cfg) : fallback(fen)).then(u => u || fallback(fen));
    chain = p.catch(() => {}); return p;
  }
  return {
    move: (fen, level) => ask(fen, LEVELS[level]),
    best: fen => ask(fen, { full: true, ms: 700 }),
    cancel(){ if (job && w) w.postMessage('stop'); },
    flavour: () => flavour,
  };
})();

const PLAY_KEY = 'openingTrainerPlay';
let playSt = (() => { try { return JSON.parse(localStorage.getItem(PLAY_KEY) || '{}') } catch(e){ return {} } })();
const playSave = () => { try { localStorage.setItem(PLAY_KEY, JSON.stringify(playSt)) } catch(e){} };
const sideName = (s, gen) => s === 'w' ? (gen ? 'білих' : 'білими') : (gen ? 'чорних' : 'чорними');
const endFens = {};
function lineEndFen(){                   // line data keeps only piece placement: replay the moves for a full FEN
  const L = line(); if (endFens[L.id]) return endFens[L.id];
  const g = new Chess(); L.uci.forEach(u => g.move({ from: u.slice(0,2), to: u.slice(2,4), promotion: u[4] || 'q' }));
  return endFens[L.id] = g.fen();
}
const lineEndOk = () => !new Chess(lineEndFen()).game_over();

/* Opening book: the computer can play one of the opening sections (or one line of it) from the start
   position. While the game follows the section's lines (plus their middlegame continuations) it plays a
   book move; moves marked ? or ?? (traps for that side) are not played from the book. When the book runs
   out or the player leaves it, the computer goes on at the chosen level, and the player sees what the
   lines play in that position. */
const START_FEN = new Chess().fen();
const BOOK_SECTIONS = () => DATA.filter(o => o.id !== 'morphy' && o.id !== 'minis');
const badMark = san => /(\?\?|[^!]\?)$/.test(san);
function bookLines(B){
  const O = B && B.sec && DATA.find(o => o.id === B.sec); if (!O) return [];
  return O.lines.filter(l => !B.line || l.id === B.line).map(l => { const M = l.mg && !l.mg.custom ? l.mg : null;
    return { name: l.name, uci: l.uci.concat(M ? M.uci : []), san: l.san.concat(M ? M.san : []) }; });
}
function bookNext(P, ucis){              // book moves for the position after `ucis` (game from the start only)
  if (!P.book || !P.book.sec || P.fen0 !== START_FEN) return [];
  const n = ucis.length;
  return bookLines(P.book).filter(b => b.uci.length > n && ucis.every((u, i) => b.uci[i].slice(0,4) === u.slice(0,4)))
    .map(b => ({ uci: b.uci[n], san: b.san[n], name: b.name }));
}
const bookName = B => { const O = B && B.sec && DATA.find(o => o.id === B.sec); if (!O) return '';
  const L = B.line && O.lines.find(l => l.id === B.line); return L ? `${O.name}: ${L.name}` : O.name; };
function renderBookOpts(){
  const B = playSt.book || {}, off = playSt.from === 'line' && lineEndOk();
  $('optBook').innerHTML = `<button data-book=""${!B.sec ? ' class="on"' : ''}>Комп'ютер вирішує сам</button>`
    + BOOK_SECTIONS().map(o => `<button data-book="${o.id}"${B.sec === o.id ? ' class="on"' : ''}>${o.name}</button>`).join('');
  const O = B.sec && DATA.find(o => o.id === B.sec);
  $('optBookLine').innerHTML = !O ? '' : `<button data-bookline=""${!B.line ? ' class="on"' : ''}>Будь-яка лінія</button>`
    + O.lines.map(l => `<button data-bookline="${l.id}"${B.line === l.id ? ' class="on"' : ''}><i class="disc ${l.side}"></i>${l.name}</button>`).join('');
  document.querySelectorAll('#optBook button, #optBookLine button').forEach(b => { b.disabled = off; });
  $('bookNote').textContent = off ? 'Дебют діє, коли партія починається зі звичайної початкової позиції.'
    : O ? 'Комп\'ютер ходитиме за лініями розділу, поки ти теж граєш за теорією. Далі — сам, на обраному рівні.' : '';
}
function openPlay(){
  const lv = playSt.level || 2, side = playSt.side || 'w', from = playSt.from === 'line' && lineEndOk() ? 'line' : 'start', st = playSt.stats || {};
  $('optLevel').innerHTML = LEVELS.map((c, i) => !c ? '' : `<button class="lvl${i === lv ? ' on' : ''}" data-level="${i}"><b>${i}</b><span>${c.name}</span><small>${c.elo}</small><em>${st[i] && st[i].w ? '✓ ' + st[i].w : ''}</em></button>`).join('');
  document.querySelectorAll('#optSide button').forEach(b => b.classList.toggle('on', b.dataset.side === side));
  document.querySelectorAll('#optFrom button').forEach(b => b.classList.toggle('on', b.dataset.from === from));
  $('optFromLine').textContent = `З кінця лінії «${line().name}»`; $('optFromLine').disabled = !lineEndOk();
  renderBookOpts();
  const G = playSt.game;
  $('playResume').innerHTML = G && !G.over ? `<div class="resume"><span><b>Незакінчена гра</b><br>Рівень ${G.level} «${LEVELS[G.level].name}», ${Math.ceil(G.ucis.length / 2)} ${plural(Math.ceil(G.ucis.length / 2), 'хід', 'ходи', 'ходів')}</span><button class="btn sm pri" id="pResume">Продовжити</button></div>` : '';
  openSheet('play');
}
$('play').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.level){ playSt.level = +b.dataset.level; document.querySelectorAll('.lvl').forEach(x => x.classList.toggle('on', x === b)); }
  else if (b.dataset.side){ playSt.side = b.dataset.side; document.querySelectorAll('#optSide button').forEach(x => x.classList.toggle('on', x === b)); }
  else if (b.dataset.from && !b.disabled){ playSt.from = b.dataset.from; document.querySelectorAll('#optFrom button').forEach(x => x.classList.toggle('on', x === b)); renderBookOpts(); }
  else if (b.dataset.book !== undefined && !b.disabled){ playSt.book = { sec: b.dataset.book, line: '' }; renderBookOpts(); }
  else if (b.dataset.bookline !== undefined && !b.disabled){ playSt.book = Object.assign({}, playSt.book, { line: b.dataset.bookline }); renderBookOpts(); }
  else if (b.id === 'pStart'){ closeSheet('play'); newGame(); }
  else if (b.id === 'pResume'){ closeSheet('play'); startPlay(playSt.game); }
  playSave();
});
$('bPlay').onclick = openPlay;

function newGame(){
  const level = playSt.level || 2, pick = playSt.side || 'w', side = pick === 'r' ? (Math.random() < .5 ? 'w' : 'b') : pick;
  const fromLine = playSt.from === 'line' && lineEndOk();
  const book = !fromLine && playSt.book && playSt.book.sec ? { sec: playSt.book.sec, line: playSt.book.line || '' } : null;
  startPlay({ id: Date.now(), level, side, fen0: fromLine ? lineEndFen() : START_FEN, from: fromLine ? line().name : '', book, ucis: [], over: null, counted: false, hints: 0, undos: 0 });
}
function startPlay(G){
  stopAuto(); stopTimers(); if (S.mode === 'an') Eng.clear();
  const g = new Chess(G.fen0), sans = [];
  for (const u of G.ucis){ const m = g.move({ from: u.slice(0,2), to: u.slice(2,4), promotion: u[4] || 'q' }); if (!m) break; sans.push(m.san); }
  S.mode = 'play'; S.sel = null; S.dests = null; S.flip = G.side === 'b';
  S.pl = Object.assign(G, { g, sans, hint: null, thinking: false, note: '', botNote: '', bookDone: false, token: (S.pl && S.pl.token || 0) + 1 });
  playSt.game = G; playSave(); render();
  if (!G.over && g.turn() !== G.side) botTurn(); else playMsg();
}
function leavePlay(){ if (!S.pl) return; S.pl.token++; S.pl.thinking = false; Bot.cancel(); clearTimeout(S.oppT); }
function playStore(){ const P = S.pl; playSt.game = { id: P.id, level: P.level, side: P.side, fen0: P.fen0, from: P.from, book: P.book || null, ucis: P.ucis, over: P.over, counted: P.counted, hints: P.hints, undos: P.undos }; playSave(); }
function moveLabel(i){ const P = S.pl, f = P.fen0.split(' '), a = (+f[5] - 1) * 2 + (f[1] === 'b' ? 1 : 0) + i; return `${Math.floor(a/2)+1}${a % 2 ? '…' : '.'}`; }

function playTap(sq){
  const P = S.pl; if (!P || P.over || P.thinking || P.g.turn() !== P.side) return;
  if (S.sel && S.dests && S.dests[sq]){ const m = S.dests[sq]; playMove({ from: m.from, to: m.to, promotion: 'q' }, true); flash(sq, 'good'); return; }
  const pc = P.g.get(sq);
  if (pc && pc.color === P.side && S.sel !== sq){ S.sel = sq; S.dests = {}; P.g.moves({ square: sq, verbose: true }).forEach(m => { S.dests[m.to] = m; }); }
  else { S.sel = null; S.dests = null; }
  renderBoard();
}
function playMove(mv, mine){
  const P = S.pl, before = mine ? bookNext(P, P.ucis) : [], m = P.g.move(mv); if (!m) return;
  P.note = '';
  if (mine && before.length){
    const u = m.from + m.to;
    if (before.some(c => c.uci.slice(0,4) === u)) P.note = '✓ За теорією.';
    else { const opts = [...new Set(before.map(c => c.san.replace(/[!?]+$/, '')))];
      P.note = `Ти зійшов(-ла) з теорії «${bookName(P.book)}»: тут у лініях грають ${opts.map(x => moveLabel(P.ucis.length) + ' ' + x).join(' або ')}. Партія продовжується.`; }
  }
  P.ucis.push(m.from + m.to + (m.promotion || '')); P.sans.push(m.san); P.hint = null; S.sel = null; S.dests = null;
  checkOver(); playStore(); render();
  if (P.over) return playMsg();
  if (mine) botTurn(); else playMsg();
}
function botTurn(){
  const P = S.pl, token = ++P.token, t0 = performance.now(); P.thinking = true; playMsg(); playButtons();
  const book = bookNext(P, P.ucis).filter(c => !badMark(c.san));
  const pickBook = book.length ? book[Math.floor(Math.random() * book.length)] : null;
  if (pickBook){                         // name a line only once the game belongs to just one of them
    const names = [...new Set(book.filter(c => c.uci === pickBook.uci).map(c => c.name))];
    pickBook.label = names.length === 1 ? names[0] : DATA.find(o => o.id === P.book.sec).name; }
  const stillInBook = bookLines(P.book).some(b => b.uci.length >= P.ucis.length && P.ucis.every((x, i) => b.uci[i].slice(0,4) === x.slice(0,4)));
  if (P.book && P.book.sec && P.fen0 === START_FEN && !pickBook && !P.bookDone && P.ucis.length && stillInBook){
    P.bookDone = true; P.botNote = `Дебют «${bookName(P.book)}» закінчився — далі комп'ютер грає сам.`; }
  (pickBook ? Promise.resolve(pickBook.uci) : Bot.move(P.g.fen(), P.level)).then(u => {
    if (S.mode !== 'play' || S.pl !== P || token !== P.token || !u) return;
    clearTimeout(S.oppT);
    S.oppT = setTimeout(() => { if (token !== P.token) return; P.thinking = false;
      const note = P.note || '', bn = P.botNote || ''; P.botNote = '';
      playMove({ from: u.slice(0,2), to: u.slice(2,4), promotion: u[4] || 'q' }, false);
      P.note = [pickBook ? `За теорією: ${pickBook.label}.` : bn, note].filter(Boolean).join(' '); playMsg(); }, Math.max(0, 650 - (performance.now() - t0)));
  });
}
function checkOver(){
  const P = S.pl, g = P.g; if (P.over) return;
  if (g.in_checkmate()) P.over = g.turn() === P.side ? 'loss:мат' : 'win:мат';
  else if (g.in_stalemate()) P.over = 'draw:пат';
  else if (g.in_threefold_repetition()) P.over = 'draw:троєкратне повторення позиції';
  else if (g.insufficient_material()) P.over = 'draw:недостатньо фігур для мату';
  else if (g.in_draw()) P.over = 'draw:правило 50 ходів';
  if (P.over) countResult();
}
function countResult(){
  const P = S.pl; if (P.counted) return; P.counted = true;
  const st = (playSt.stats = playSt.stats || {}), r = (st[P.level] = st[P.level] || { w: 0, d: 0, l: 0 });
  r[P.over[0] === 'w' ? 'w' : P.over[0] === 'd' ? 'd' : 'l']++; playSave();
}
function playMsg(){
  const P = S.pl, g = P.g, n = P.sans.length, last = n ? `<b>${moveLabel(n - 1)} ${P.sans[n - 1]}</b>` : '';
  if (P.over){
    const [res, why] = P.over.split(':');
    const next = res === 'win' && P.level < 9 ? ` Спробуй рівень ${P.level + 1} «${LEVELS[P.level + 1].name}»!` : '';
    setMsg(res === 'win' ? `🎉 ${last ? last + ' — ' : ''}<b>Перемога!</b> ${why === 'мат' ? 'Мат комп\'ютеру.' : ''}${next}`
      : res === 'draw' ? `${last ? last + ' — ' : ''}<b>Нічия:</b> ${why}.`
      : why === 'здача' ? 'Партію здано. Нічого страшного — натисни «Нова гра» і спробуй ще.'
      : `${last} — <b>мат.</b> Цього разу виграв комп'ютер. Натисни «Хід назад», щоб знайти кращий хід, або «Нова гра».`, res === 'loss');
    return;
  }
  const note = P.note ? `<br><span class="var">${P.note}</span>` : '';
  if (P.thinking){ setMsg(`${last ? 'Ти: ' + last + '. ' : ''}Комп'ютер думає…${note}`); return; }
  const chk = g.in_check() ? ' <b>Шах!</b>' : '', bk = P.book && P.book.sec ? ` Дебют комп'ютера: «${bookName(P.book)}».` : '';
  setMsg(n ? `Комп'ютер: ${last}.${chk} Твій хід.${note}` : `Гра почалась: ти граєш ${sideName(P.side)}, рівень ${P.level} «${LEVELS[P.level].name}».${bk} Твій хід.`);
}
function playButtons(){
  const P = S.pl; if (!P) return; const mine = !P.over && !P.thinking && P.g.turn() === P.side;
  $('pUndo').disabled = P.thinking || !P.ucis.length || (P.ucis.length === 1 && P.g.turn() !== P.side && !P.over);
  $('pHint').disabled = !mine; $('pResign').disabled = !!P.over || !P.ucis.length;
}
function playMoves(){
  const P = S.pl; if (!P || !P.sans.length) return '<span style="color:var(--mut)">Ходи партії зʼявлятимуться тут.</span>';
  return P.sans.map((s, i) => { const lb = moveLabel(i), num = lb.endsWith('.') || i === 0 ? `<span class="n">${lb}</span>` : '';
    return `<span class="mv${i === P.sans.length - 1 ? ' cur' : ''}">${num}${s}</span>`; }).join('');
}
function playInfo(){
  const P = S.pl, c = LEVELS[P.level], st = playSt.stats || {};
  const key = ['play', P.id, P.level, JSON.stringify(st)].join('|'); if (key === infoKey) return; infoKey = key;
  $('lnTitle').textContent = `Гра з комп'ютером · рівень ${P.level}`;
  $('lnSub').textContent = `Суперник «${c.name}» (${c.elo}) · ти граєш ${sideName(P.side)}` + (P.from ? ` · з кінця лінії «${P.from}»` : '') + (P.book && P.book.sec ? ` · дебют: ${bookName(P.book)}` : '');
  $('hPlan').textContent = 'Поради'; $('hIntro').textContent = 'Твої результати';
  $('plan').innerHTML = '<p>Перед кожним ходом спитай себе: що загрожує мені і що я можу взяти? Не віддавай фігури без захисту.</p>'
    + '<p>«Підказка» показує найкращий хід, а «Хід назад» дозволяє виправити помилку — так вчитися можна й на поразках.</p>';
  const rows = LEVELS.map((x, i) => x && st[i] ? `<span>${i}. ${x.name}</span><span class="n">${st[i].w}</span><span class="n">${st[i].d}</span><span class="n">${st[i].l}</span>` : '').join('');
  $('intro').innerHTML = rows ? `<div class="res-tab"><span class="h">Рівень</span><span class="h n">перемоги</span><span class="h n">нічиї</span><span class="h n">поразки</span>${rows}</div>` : 'Ще жодної завершеної гри. Почни з рівня, на якому виграєш приблизно половину партій.';
  const r = st[P.level]; $('stats').innerHTML = icon('star') + (r ? `На цьому рівні: ${r.w} ${plural(r.w, 'перемога', 'перемоги', 'перемог')}, ${r.d} ${plural(r.d, 'нічия', 'нічиї', 'нічиїх')}, ${r.l} ${plural(r.l, 'поразка', 'поразки', 'поразок')}.` : 'На цьому рівні ти ще не грав(-ла).');
}
$('pNew').onclick = openPlay;
$('pFlip').onclick = () => { S.flip = !S.flip; Object.values(pieces).forEach(p => p.el.style.setProperty('--dur', '.6s')); renderBoard(); };
$('pResign').onclick = () => { const P = S.pl; if (!P || P.over) return; leavePlay(); P.thinking = false; P.over = 'loss:здача'; countResult(); playStore(); render(); playMsg(); };
$('pUndo').onclick = () => {
  const P = S.pl; if (!P || P.thinking || !P.ucis.length) return;
  const g = new Chess(P.fen0); let keep = P.ucis.slice(0, -1);
  if (keep.length){ const t = new Chess(P.fen0); keep.forEach(u => t.move({ from: u.slice(0,2), to: u.slice(2,4), promotion: u[4] || 'q' }));
    if (t.turn() !== P.side) keep = keep.slice(0, -1); }          // take back the computer's reply and my move
  P.undos++; P.over = null; startPlay(Object.assign(P, { ucis: keep }));
};
$('pHint').onclick = () => {
  const P = S.pl; if (!P || P.over || P.thinking || P.g.turn() !== P.side) return;
  const token = P.token, theory = bookNext(P, P.ucis).filter(c => !badMark(c.san));
  if (theory.length){ P.hint = theory[0].uci; P.hints++; playStore(); renderBoard(); playButtons();
    setMsg(`Підказка за теорією «${bookName(P.book)}»: ${[...new Set(theory.map(c => moveLabel(P.ucis.length) + ' ' + c.san.replace(/[!?]+$/, '')))].join(' або ')}.`); return; }
  $('pHint').disabled = true; setMsg('Шукаю найкращий хід…');
  Bot.best(P.g.fen()).then(u => { if (S.pl !== P || token !== P.token || !u) return; P.hint = u; P.hints++; playStore(); renderBoard(); playButtons();
    setMsg('Підказка: підсвічено фігуру й поле для найкращого ходу.'); });
};

/* ---------- puzzles, loaded online from the Lichess puzzle database (CC0) ----------
   The only part of the page that needs the internet: GET lichess.org/api/puzzle/next (difficulty relative to
   1500 for anonymous users; `angle` = theme) and /api/puzzle/daily; no account, CORS allowed. One request at a
   time, the next puzzle is fetched in advance. The puzzle position is the game after its PGN; the last PGN move
   (the opponent's) is shown first, then the player finds `solution[0]`; replies are played automatically.
   Any move that gives mate is accepted, as on Lichess. */
const PUZ_KEY = 'openingTrainerPuzzles';
let puzSt = (() => { try { return JSON.parse(localStorage.getItem(PUZ_KEY) || '{}') } catch(e){ return {} } })();
const puzSave = () => { try { localStorage.setItem(PUZ_KEY, JSON.stringify(puzSt)) } catch(e){} };
const PUZ_DIFF = [['easiest', 'Найлегші', '≈700–1000'], ['easier', 'Легкі', '≈1200–1300'], ['normal', 'Середні', '≈1300–1550'],
                  ['harder', 'Складні', '≈1550–1700'], ['hardest', 'Найскладніші', '≈1900–2200']];
const PUZ_THEMES = [['', 'Будь-яка тема'], ['mateIn1', 'Мат в 1 хід'], ['mateIn2', 'Мат у 2 ходи'], ['fork', 'Вилка'], ['pin', 'Зв\'язка'],
                    ['hangingPiece', 'Незахищена фігура'], ['backRankMate', 'Мат по останній горизонталі'], ['endgame', 'Ендшпіль'], ['opening', 'Дебют']];
const THEME_UA = { mate: 'Мат', mateIn1: 'Мат в 1 хід', mateIn2: 'Мат у 2 ходи', mateIn3: 'Мат у 3 ходи', mateIn4: 'Мат у 4 ходи', mateIn5: 'Довгий мат',
  oneMove: 'В один хід', short: 'Коротка', long: 'Довга', veryLong: 'Дуже довга', fork: 'Вилка', pin: 'Зв\'язка', skewer: 'Лінійний удар',
  hangingPiece: 'Незахищена фігура', discoveredAttack: 'Відкритий напад', doubleCheck: 'Подвійний шах', sacrifice: 'Жертва',
  deflection: 'Відволікання', attraction: 'Завлікання', interference: 'Перекриття', intermezzo: 'Проміжний хід', trappedPiece: 'Спіймана фігура',
  capturingDefender: 'Знищення захисника', backRankMate: 'Мат по останній горизонталі', smotheredMate: 'Спертий мат',
  kingsideAttack: 'Атака на королівському фланзі', queensideAttack: 'Атака на ферзевому фланзі', exposedKing: 'Відкритий король',
  endgame: 'Ендшпіль', middlegame: 'Мітельшпіль', opening: 'Дебют', advantage: 'Перевага', crushing: 'Вирішальна перевага',
  equality: 'Зрівняння', defensiveMove: 'Захисний хід', quietMove: 'Тихий хід', zugzwang: 'Цугцванг', promotion: 'Перетворення пішака',
  underPromotion: 'Слабке перетворення', enPassant: 'Взяття на проході', castling: 'Рокіровка', xRayAttack: 'Рентген',
  clearance: 'Звільнення лінії', rookEndgame: 'Туровий ендшпіль', pawnEndgame: 'Пішаковий ендшпіль', queenEndgame: 'Ферзевий ендшпіль',
  bishopEndgame: 'Слоновий ендшпіль', knightEndgame: 'Коневий ендшпіль', queenRookEndgame: 'Ферзь і тура', anastasiaMate: 'Мат Анастасії',
  arabianMate: 'Арабський мат', hookMate: 'Мат гачком', bodenMate: 'Мат Бодена', doubleBishopMate: 'Мат двома слонами',
  dovetailMate: 'Мат «ластівчин хвіст»', epauletteMate: 'Мат «еполети»', operaMate: 'Оперний мат', morphysMate: 'Мат Морфі',
  pillsburysMate: 'Мат Пілсбері', cornerMate: 'Мат у кутку', master: 'Партія майстра' };
const diffOf = id => PUZ_DIFF.find(d => d[0] === id) || PUZ_DIFF[0];
const themeOf = id => PUZ_THEMES.find(t => t[0] === id) || PUZ_THEMES[0];
const puzKey = () => (puzSt.diff || 'easiest') + '|' + (puzSt.theme || '');
function puzLabel(){ const Z = S.pz; return Z.daily ? 'Задача дня' : `${diffOf(Z.diff)[1]} · ${themeOf(Z.theme)[1]}`; }
function puzFetch(daily){
  const url = daily ? 'https://lichess.org/api/puzzle/daily'
    : `https://lichess.org/api/puzzle/next?difficulty=${puzSt.diff || 'easiest'}${puzSt.theme ? '&angle=' + puzSt.theme : ''}`;
  return fetch(url, { headers: { Accept: 'application/json' } }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => { if (!d || !d.puzzle || !d.game || !d.game.pgn) throw new Error('bad data'); return d; });
}
let puzPre = null, puzChain = Promise.resolve();          // requests never overlap
function puzQueue(daily){ const p = puzChain.then(() => puzFetch(daily)); puzChain = p.catch(() => {}); return p; }
function prefetchPuz(){ puzPre = { key: puzKey(), p: puzQueue(false) }; puzPre.p.catch(() => { puzPre = null; }); }
function openPuz(){
  const d = puzSt.diff || 'easiest', t = puzSt.theme || '';
  $('optDiff').innerHTML = PUZ_DIFF.map(([k, n, r]) => `<button class="lvl${k === d ? ' on' : ''}" data-diff="${k}"><span>${n}</span><small>${r}</small></button>`).join('');
  $('optTheme').innerHTML = PUZ_THEMES.map(([k, n]) => `<button data-theme="${k}"${k === t ? ' class="on"' : ''}>${n}</button>`).join('');
  openSheet('puz');
}
$('puz').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.diff){ puzSt.diff = b.dataset.diff; document.querySelectorAll('#optDiff .lvl').forEach(x => x.classList.toggle('on', x === b)); puzSave(); }
  else if (b.dataset.theme !== undefined){ puzSt.theme = b.dataset.theme; document.querySelectorAll('#optTheme button').forEach(x => x.classList.toggle('on', x === b)); puzSave(); }
  else if (b.id === 'zStart'){ closeSheet('puz'); nextPuz(false); }
  else if (b.id === 'zDaily'){ closeSheet('puz'); nextPuz(true); }
});
$('bPuz').onclick = openPuz;
let puzLoading = 0;
function nextPuz(daily){
  const ticket = ++puzLoading, seen = new Set(puzSt.seen || []);
  enterPuzMode(); setMsg('Завантажую задачу з Lichess…'); puzButtons();
  const get = () => { if (!daily && puzPre && puzPre.key === puzKey()){ const p = puzPre.p; puzPre = null; return p; } return puzQueue(daily); };
  get().then(d => (!daily && seen.has(d.puzzle.id)) ? puzQueue(false) : d)        // one retry for a puzzle seen before
    .then(d => { if (ticket !== puzLoading || S.mode !== 'puz') return; startPuz(d, daily); if (!daily) prefetchPuz(); })
    .catch(() => { if (ticket !== puzLoading || S.mode !== 'puz') return;
      setMsg('Не вдалося завантажити задачу. Задачі беруться з Lichess, тому потрібен інтернет. Перевір з\'єднання й натисни «Наступна».', true); puzButtons(); });
}
function enterPuzMode(){
  if (S.mode === 'play') leavePlay();
  stopAuto(); stopTimers(); if (S.mode === 'an') Eng.clear();
  if (S.mode !== 'puz'){ S.mode = 'puz'; S.sel = null; S.dests = null; if (!S.pz) S.pz = { id: '', g: new Chess(), ucis: [], sans: [], sol: [], themes: [], loading: true, diff: puzSt.diff, theme: puzSt.theme }; render(); }
}
function leavePuz(){ puzLoading++; clearTimeout(S.oppT); if (S.pz) S.pz.busy = false; }
function startPuz(d, daily){
  const moves = d.game.pgn.split(/\s+/).filter(Boolean), g = new Chess();
  for (const m of moves.slice(0, -1)) if (!g.move(m)) return setMsg('Задача пошкоджена — натисни «Наступна».', true);
  const P = S.pz = { id: d.puzzle.id, rating: d.puzzle.rating, themes: d.puzzle.themes || [], sol: d.puzzle.solution, i: 0, g,
    ucis: [], sans: [], hint: null, hintLvl: 0, failed: false, hinted: false, done: false, busy: true, daily: !!daily,
    diff: puzSt.diff || 'easiest', theme: daily ? '' : (puzSt.theme || '') };
  const last = g.move(moves[moves.length - 1]); g.undo();                      // the opponent's move that sets the puzzle
  P.side = last.color === 'w' ? 'b' : 'w'; S.flip = P.side === 'b'; S.sel = null; S.dests = null;
  puzSt.seen = (puzSt.seen || []).concat(P.id).slice(-300); puzSave();
  infoKey = ''; render(); setMsg('Дивись, як походив суперник…'); puzButtons();
  clearTimeout(S.oppT);
  S.oppT = setTimeout(() => { if (S.pz !== P) return; const m = g.move(last.san);
    P.ucis.push(m.from + m.to + (m.promotion || '')); P.busy = false; render();
    setMsg(`Суперник зіграв <b>${m.san}</b>. Знайди найкращий хід за ${sideName(P.side, true)}!`); puzButtons(); }, 700);
}
function puzTap(sq){
  const P = S.pz; if (!P || !P.sol.length || P.done || P.busy || P.g.turn() !== P.side) return;
  if (S.sel && S.dests && S.dests[sq]){ const m = S.dests[sq]; puzMove(m.from, m.to, sq); return; }
  const pc = P.g.get(sq);
  if (pc && pc.color === P.side && S.sel !== sq){ S.sel = sq; S.dests = {}; P.g.moves({ square: sq, verbose: true }).forEach(m => { S.dests[m.to] = m; }); }
  else { S.sel = null; S.dests = null; }
  renderBoard();
}
function puzMove(from, to, sq){
  const P = S.pz, exp = P.sol[P.i], g = P.g;
  const m = g.move({ from, to, promotion: exp && exp.slice(0,4) === from + to && exp[4] ? exp[4] : 'q' }); if (!m) return;
  S.sel = null; S.dests = null;
  if ((m.from + m.to) !== exp.slice(0,4) && !g.in_checkmate()){
    g.undo(); P.failed = true; flash(sq, 'bad');
    setMsg('Не той хід. Подумай ще: які шахи, взяття й загрози є в позиції? Або натисни «Підказка».', true); return;
  }
  P.ucis.push(m.from + m.to + (m.promotion || '')); P.sans.push(m.san); P.i++; P.hint = null; P.hintLvl = 0;
  if (g.in_checkmate() || P.i >= P.sol.length){ render(); flash(sq, 'good'); return puzSolved(); }
  P.busy = true; render(); flash(sq, 'good'); setMsg(`✓ <b>${m.san}</b> — правильно! Суперник відповідає…`); puzButtons();
  clearTimeout(S.oppT);
  S.oppT = setTimeout(() => { if (S.pz !== P) return; const r = P.sol[P.i], o = g.move({ from: r.slice(0,2), to: r.slice(2,4), promotion: r[4] });
    P.ucis.push(r); P.sans.push(o.san); P.i++; P.busy = false; render();
    setMsg(`Суперник: <b>${o.san}</b>. Продовжуй — знайди наступний хід.`); puzButtons(); }, 650);
}
function puzCount(clean){
  const P = S.pz; if (P.counted) return; P.counted = true;
  if (clean){ puzSt.solved = (puzSt.solved || 0) + 1; puzSt.streak = (puzSt.streak || 0) + 1; puzSt.best = Math.max(puzSt.best || 0, puzSt.streak); }
  else { puzSt.failed = (puzSt.failed || 0) + 1; puzSt.streak = 0; }
  puzSave();
}
function puzSolved(){
  const P = S.pz; P.done = true; const clean = !P.failed && !P.hinted; puzCount(clean);
  infoKey = ''; render();
  setMsg(clean ? `🎉 <b>Розв'язано!</b> Рейтинг задачі ${P.rating}. Серія: ${puzSt.streak}. Натисни «Наступна».`
    : `<b>Розв'язано</b>, але ${P.hinted ? 'з підказкою' : 'не з першої спроби'} — у серію не йде. Рейтинг задачі ${P.rating}. Спробуй наступну!`);
  puzButtons();
}
function puzShowSolution(){
  const P = S.pz; if (!P || P.done || P.busy || !P.sol.length) return;
  P.failed = true; P.busy = true; P.hint = null; puzButtons();
  const step = () => { if (S.pz !== P) return;
    if (P.i >= P.sol.length){ P.busy = false; P.done = true; puzCount(false); infoKey = ''; render();
      setMsg(`Ось розв'язок: <b>${P.sans.join(' ')}</b>. Рейтинг задачі ${P.rating}. Наступна вийде краще!`); puzButtons(); return; }
    const r = P.sol[P.i], m = P.g.move({ from: r.slice(0,2), to: r.slice(2,4), promotion: r[4] });
    P.ucis.push(r); P.sans.push(m.san); P.i++; render(); S.oppT = setTimeout(step, 750); };
  step();
}
function puzButtons(){
  const P = S.pz, ready = P && P.sol && P.sol.length && !P.done && !P.busy && P.g.turn() === P.side;
  $('zHint').disabled = !ready; $('zShow').disabled = !ready;
  $('zNext').classList.toggle('pri', !P || !P.sol.length || P.done); $('zNext').disabled = false;
}
function puzMoves(){
  const P = S.pz; if (!P || !P.sans.length) return '<span style="color:var(--mut)">Твої ходи в задачі зʼявлятимуться тут.</span>';
  return P.sans.map((s, i) => `<span class="mv${i === P.sans.length - 1 ? ' cur' : ''}">${s}</span>`).join('');
}
function puzInfo(){
  const P = S.pz, key = ['puz', P.id, P.done, JSON.stringify(puzSt.solved || 0) + (puzSt.failed || 0) + (puzSt.streak || 0)].join('|');
  if (key === infoKey) return; infoKey = key;
  const th = P.themes.map(t => THEME_UA[t]).filter(Boolean);
  $('lnTitle').textContent = P.id ? (P.daily ? 'Задача дня' : 'Задача') + ` · рейтинг ${P.rating}` : 'Шахові задачі';
  $('lnSub').textContent = !P.id ? 'Задачі з бази Lichess' : P.done ? (th.length ? 'Теми: ' + th.join(', ') : '') : `${puzLabel()} · теми покажу після розв'язку`;
  $('hPlan').textContent = 'Як розв\'язувати'; $('hIntro').textContent = 'Твої результати';
  $('plan').innerHTML = '<p>Спершу шукай шахи, потім взяття, потім загрози — у такому порядку. Найсильніший хід часто з них.</p>'
    + '<p>Неправильний хід не зараховується — можна думати далі. «Підказка» спершу показує фігуру, вдруге — поле.</p>';
  const ok = puzSt.solved || 0, bad = puzSt.failed || 0;
  $('intro').innerHTML = ok + bad ? `<div class="res-tab" style="grid-template-columns:repeat(4,auto)"><span class="h">розв'язано</span><span class="h">з помилкою</span><span class="h">серія</span><span class="h">рекорд серії</span>`
    + `<span class="n">${ok}</span><span class="n">${bad}</span><span class="n">${puzSt.streak || 0}</span><span class="n">${puzSt.best || 0}</span></div>` : 'Ще жодної задачі. Почни з найлегших — і поступово складніше!';
  $('stats').innerHTML = icon('star') + (P.done && P.id ? `<a class="pz-link" href="https://lichess.org/training/${P.id}" target="_blank" rel="noopener">Відкрити цю задачу на Lichess</a>` : 'Задачі: база Lichess (CC0).');
}
$('zNext').onclick = () => nextPuz(false);
$('zSet').onclick = openPuz;
$('zShow').onclick = puzShowSolution;
$('zHint').onclick = () => { const P = S.pz; if (!P || P.done || P.busy || P.g.turn() !== P.side) return;
  P.hinted = true; P.hint = P.sol[P.i]; P.hintLvl = Math.min(2, (P.hintLvl || 0) + 1); renderBoard();
  setMsg(P.hintLvl === 1 ? 'Підказка: підсвічено фігуру, якою треба ходити. Ще раз — і покажу поле.' : 'Підказка: показано і фігуру, і поле.'); };
$('zFlip').onclick = () => { S.flip = !S.flip; Object.values(pieces).forEach(p => p.el.style.setProperty('--dur', '.6s')); renderBoard(); };

/* ---------- events ---------- */
$('tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; const i = +b.dataset.i;
  if (i !== S.op) selectLine(i, (S.lastLn || {})[i] || 0); });
$('chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b){ closeSheet('lib'); selectLine(S.lib, +b.dataset.i); } });
$('lineBar').onclick = () => openSheet('lib');
$('lnPrev').onclick = () => stepLine(-1);
$('lnNext').onclick = () => stepLine(1);
$('mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || (b.dataset.m === 'mg' && !line().mg)) return; stopAuto();
  const prevMode = S.mode, L0 = line();
  if (prevMode === 'play'){ leavePlay(); S.ply = 0; }
  if (prevMode === 'puz'){ leavePuz(); S.ply = 0; }
  const entry = prevMode === 'mg' ? (L0.mg && !L0.mg.custom ? L0.san.length + S.ply : L0.san.length) : prevMode === 'an' ? 0 : S.ply;
  if (prevMode === 'an' && b.dataset.m !== 'an'){ let x = anNode(); while (!x.main) x = S.an.nodes[x.p]; S.ply = Math.min(x.d, L0.san.length); }
  if (prevMode === 'an' && b.dataset.m !== 'an') Eng.clear();
  S.mode = b.dataset.m; S.sel = null; S.dests = null;
  stopTimers();
  if (S.mode === 'an') { startAn(entry); return; }
  if (S.mode === 'train') { S.side = line().side; startTrain(); }
  else if (S.mode === 'mg') startMg();
  else { S.side = line().side; S.sel = null; S.hint = 0; S.done = false; S.busy = false; go(Math.min(S.ply, line().san.length)); } });
$('board').addEventListener('click', e => { const s = e.target.closest('.sq'); if (s) tap(s.dataset.sq); });
$('moves').addEventListener('click', e => { const m = e.target.closest('.mv'); if (S.mode === 'play' || S.mode === 'puz') return;
  if (m && S.mode === 'an') { anGo(+m.dataset.n); return; }
  if (!m || (S.mode!=='view' && !S.done)) return;
  if (S.mode === 'mg') { S.ply = +m.dataset.p; render(); const i = S.ply - 1; const M = line().mg;
    setMsg(`<b>${label(i)} ${M.san[i]}</b>${M.why[i] ? ' — ' + M.why[i] : ''}`); return; }
  if (S.mode === 'train') { S.mode = 'view'; S.done = false; } stopAuto(); go(+m.dataset.p); });
$('bStart').onclick = () => { stopAuto(); go(0); };
$('bPrev').onclick = () => { stopAuto(); go(S.ply-1); };
$('bNext').onclick = () => { stopAuto(); go(S.ply+1); };
$('bEnd').onclick = () => { stopAuto(); go(line().san.length); };
$('bFlip').onclick = () => { S.flip = !S.flip; Object.values(pieces).forEach(p => p.el.style.setProperty('--dur', '.6s')); renderBoard(); };
$('bAuto').onclick = () => {
  if (S.auto) { stopAuto(); return; }
  if (S.ply >= line().san.length) go(0);
  setAuto(true);
  S.auto = setInterval(() => { if (S.ply >= line().san.length) { stopAuto(); return; } go(S.ply+1); }, 1600);
};
$('bSide').onclick = () => { S.side = S.side === 'w' ? 'b' : 'w'; startTrain(); };
$('bHint').onclick = () => { if (S.done || S.busy || turnAt(S.ply) !== S.side || (S.mode === 'mg' && line().mg.kind[S.ply] !== 't')) return; S.hint = Math.min(2, S.hint+1); Coach.hint(S.hint);
  setMsg(S.hint === 1 ? 'Підказка: підсвічено фігуру, якою треба ходити. Ще раз — і покажу поле.' : 'Підказка: показано і фігуру, і поле.'); renderBoard(); };
$('bRestart').onclick = () => { stopTimers(); S.mode === 'mg' ? startMg() : startTrain(); };
$('bRandom').onclick = () => { const ls = DATA[S.op].lines; let i = Math.floor(Math.random()*ls.length);
  if (ls.length > 1 && i === S.ln) i = (i+1) % ls.length; stopTimers(); S.ln = i; S.lib = S.op; (S.lastLn = S.lastLn || {})[S.op] = i;
  if (S.mode === 'mg') startMg(); else { S.mode = 'train'; S.side = line().side; startTrain(); } };
$('aStart').onclick = () => anGo(0);
$('aPrev').onclick = () => anGo(anNode().p);
$('aNext').onclick = () => { const c = anNode().ch.find(i => S.an.nodes[i]); if (c !== undefined) anGo(c, true); };
$('aEnd').onclick = anEnd;
$('aFlip').onclick = () => { S.flip = !S.flip; Object.values(pieces).forEach(p => p.el.style.setProperty('--dur', '.6s')); renderBoard(); };
$('aLine').onclick = anToLine;
$('engOn').onchange = e => { prefs.engine = e.target.checked ? 'on' : 'off'; try{ localStorage.setItem('openingTrainerStyle', JSON.stringify(prefs)) }catch(_){}
  if (!engOn()) Eng.clear(); S.showBest = false; render(); engReq(); };
$('aBest').onclick = () => { S.showBest = !S.showBest; renderBoard(); engPanel(); };
$('aCheck').onclick = () => { if (!engOn()) return; const N = S.an.nodes;
  N.forEach(n => { if (n && !n.main){ [n, N[n.p]].forEach(x => { if (!(evOf(x) || {}).terminal) Eng.req(x.fen, false); }); } }); engPanel(); };
$('aDel').onclick = anDelete;
$('aClear').onclick = () => { const b = $('aClear');
  if (b.dataset.arm) { delete b.dataset.arm; b.textContent = 'Очистити все'; anClearAll(); return; }
  b.dataset.arm = '1'; b.textContent = 'Точно? Ще раз'; setTimeout(() => { delete b.dataset.arm; b.textContent = 'Очистити все'; }, 3000); };
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ document.querySelectorAll('.sheet.open').forEach(x => closeSheet(x.id)); return; }
  if (document.querySelector('.sheet.open')) return;
  if (S.mode === 'an') { if (e.key === 'ArrowLeft') $('aPrev').click(); else if (e.key === 'ArrowRight') $('aNext').click(); return; }
  if (S.mode !== 'view') return;
  if (e.key === 'ArrowRight') { stopAuto(); go(S.ply+1); } else if (e.key === 'ArrowLeft') { stopAuto(); go(S.ply-1); } });

S.side = line().side; S.flip = S.side === 'b'; applyStyle(); render(); viewMsg();
