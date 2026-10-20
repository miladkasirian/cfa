/* CFA Level III Ethics Practice
   Two modes:
   - local: results stored in this browser (GitHub Pages, or index.html opened directly)
   - server: cfa.ringmk.com; sign-in (Google or e-mail + password), results stored on the server per member
*/
(function () {
'use strict';
const APP_VERSION = '2026.10.22-1';

const B = window.BANK;
const LEARN = window.LEARN || [];
const I18N = window.I18N;
const QMAP = {}; B.qs.forEach(q => { QMAP[q.id] = q; });
const LS_KEY = 'cfa-ethics-v1';
const LS_PREF = 'cfa-ethics-prefs';

/* ---------------- safe storage ---------------- */
const store = {
  get(k, d, s) { try { const v = (s ? sessionStorage : localStorage).getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------------- error capture (sent with bug reports) ---------------- */
const ERRS = [];
function pushErr(e) { ERRS.push(e); if (ERRS.length > 20) ERRS.shift(); }
window.addEventListener('error', (ev) => {
  const e = { t: new Date().toISOString(), msg: String(ev.message || 'error'), src: ev.filename || '', line: ev.lineno || 0, col: ev.colno || 0, stack: ev.error && ev.error.stack ? String(ev.error.stack).slice(0, 1500) : '' };
  pushErr(e); autoReport(e);
});
window.addEventListener('unhandledrejection', (ev) => {
  const r = ev.reason || {}; const e = { t: new Date().toISOString(), msg: 'unhandled rejection: ' + String(r.message || r), stack: r.stack ? String(r.stack).slice(0, 1500) : '' };
  pushErr(e); autoReport(e);
});

/* ---------------- standards dictionary ---------------- */
const STD = window.CFAG.STD;
const STD_ORDER = Object.keys(STD);
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
const LETTER_FA = { A: 'آ', B: 'بی', C: 'سی', D: 'دی', E: 'ای', F: 'اف' };
const GROUPS = [['I', 'Professionalism', 'حرفه‌ای‌گری'], ['II', 'Integrity of Capital Markets', 'یکپارچگی بازارهای سرمایه'], ['III', 'Duties to Clients', 'وظایف در برابر مشتریان'],
  ['IV', 'Duties to Employers', 'وظایف در برابر کارفرما'], ['V', 'Investment Analysis, Recommendations, and Actions', 'تحلیل، توصیه و اقدام سرمایه‌گذاری'],
  ['VI', 'Conflicts of Interest', 'تضاد منافع'], ['VII', 'Responsibilities as a Member or Candidate', 'مسئولیت‌های عضو یا داوطلب'], ['AMC', '', ''], ['CODE', '', '']];

/* ---------------- language ---------------- */
let PREF = Object.assign({ lang: 'en', theme: '' }, store.get(LS_PREF, {}));
const savePref = () => store.set(LS_PREF, PREF);
let L = PREF.lang === 'fa' ? 'fa' : 'en';
const t = (k, ...a) => { const v = I18N[L][k]; return typeof v === 'function' ? v(...a) : (v == null ? k : v); };
const FA_DIG = '۰۱۲۳۴۵۶۷۸۹';
const num = (x) => L === 'fa' ? String(x).replace(/[0-9]/g, d => FA_DIG[d]).replace(/\./g, '٫') : String(x);
const pct = (x) => L === 'fa' ? num(x) + '٪' : x + '%';
const SEP = () => L === 'fa' ? '، ' : ' · ';
const tx = (o) => (o && (o[L] || o.en)) || '';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const toAscii = (s) => String(s || '').replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x06F0).replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x0660);
const LETTERS = { en: ['A', 'B', 'C', 'D', 'E'], fa: ['الف', 'ب', 'ج', 'د', 'ه'] };
const optLetter = (i) => LETTERS[L][i];

function stdCode(code) {
  if (L !== 'fa') return code === 'CODE' ? 'Code' : code;
  if (code === 'AMC') return 'کد مدیران دارایی';
  if (code === 'CODE') return 'کد اخلاق';
  const m = code.match(/^([IVX]+)\(([A-F])\)$/);
  if (!m) return num(code);
  return num(ROMAN[m[1]]) + '(' + LETTER_FA[m[2]] + ')';
}
function stdLabel(code) {
  const n = STD[code] ? STD[code][L === 'fa' ? 1 : 0] : code;
  if (code === 'AMC' || code === 'CODE') return n;
  return (L === 'fa' ? 'استاندارد ' : 'Standard ') + stdCode(code) + ': ' + n;
}
function groupOf(code) { if (code === 'AMC' || code === 'CODE') return code; const m = code.match(/^([IVX]+)\(/); return m ? m[1] : 'CODE'; }
function groupLabel(g) {
  if (g === 'AMC') return t('groupAMC'); if (g === 'CODE') return t('groupCode');
  const G = GROUPS.find(x => x[0] === g);
  return (L === 'fa' ? 'استاندارد ' + num(ROMAN[g]) + ': ' + G[2] : 'Standard ' + g + ': ' + G[1]);
}

/* ---------------- essay (constructed-response) index ---------------- */
const CR = B.cr || {};
const CRMAP = {}; // essay item id -> item (with .cid = its essay set)
Object.keys(CR).forEach(cid => (CR[cid].items || []).forEach(it => { it.cid = cid; CRMAP[it.id] = it; }));
const isCR = (id) => !!CRMAP[id];
const known = (id) => !!(QMAP[id] || CRMAP[id]);
const itemMax = (it) => it.parts.reduce((s, p) => s + p.pts, 0);
const MC_PTS = 3; // each multiple-choice question is worth 3 points, as on the real exam
const groupExams = (g) => B.exams.filter(e => (e.group || 'main') === g).sort((a, b) => a.n - b.n);
const HAS_IMP = groupExams('imp').length > 0;

/* ---------------- state and storage ---------------- */
// prog: one saved "in progress" attempt per exam or practice list, so several can be open at the same time
// ui: where you were in every tab (route, scroll, open tree branches), kept across refresh and sign-in
const blank = () => ({ v: 2, fav: [], hard: [], runs: [], prog: {}, ui: {} });
let S = blank();
let MODE = 'local', ME = null, GCID = '';
let saveTimer = null;
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const pkey = (kind, arg) => (kind === 'exam' || kind === 'imp' || kind === 'std') ? kind + ':' + arg : kind;
const liveProg = (k) => { const p = S.prog[k]; return p && !p.del && Array.isArray(p.qids) ? p : null; };

function normalize(s) {
  const o = blank();
  if (s && typeof s === 'object') {
    o.fav = Array.isArray(s.fav) ? s.fav.filter(known) : [];
    o.hard = Array.isArray(s.hard) ? s.hard.filter(known) : [];
    o.runs = Array.isArray(s.runs) ? s.runs.filter(r => r && typeof r === 'object') : [];
    o.runs.forEach(r => { if (!r.id) r.id = rid(); });
    const pr = s.prog && typeof s.prog === 'object' ? s.prog : {};
    Object.keys(pr).forEach(k => { const p = pr[k]; if (p && (p.del || (Array.isArray(p.qids) && p.qids.length))) o.prog[k] = p; });
    const c = s.cur; // older versions kept only one exam in progress
    if (c && Array.isArray(c.qids) && c.qids.length) { const k = pkey(c.kind || 'exam', c.arg); if (!o.prog[k]) o.prog[k] = Object.assign({ pid: rid() }, c); }
    Object.values(o.prog).forEach(p => { if (!p.del) { p.qids = p.qids.filter(known); p.ans = p.ans || {}; p.rev = p.rev || {}; p.cra = p.cra || {}; p.crc = p.crc || {}; if (!p.pid) p.pid = rid(); } });
    o.ui = s.ui && typeof s.ui === 'object' ? s.ui : {};
  }
  return o;
}
// newer copy of each in-progress attempt wins; finished attempts are never brought back
function mergeProg(a, b) {
  const out = Object.assign({}, a);
  Object.keys(b || {}).forEach(k => { if (!out[k] || (b[k].ts || 0) > (out[k].ts || 0)) out[k] = b[k]; });
  const done = new Set(S.runs.map(r => r.pid).filter(Boolean));
  Object.keys(out).forEach(k => { if (out[k] && out[k].pid && done.has(out[k].pid)) delete out[k]; });
  return out;
}
const loadLocal = () => normalize(store.get(LS_KEY, null));
const saveLocal = (st) => store.set(LS_KEY, st);
const cacheKey = () => 'cfa-cache-' + (ME ? ME.id || ME.email : 'x');

async function api(path, method, body, opts) {
  const r = await fetch('/api/' + path, Object.assign({ method: method || 'GET', credentials: 'same-origin', cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }, opts || {}));
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && MODE === 'server' && path !== 'auth/password') { ME = null; render(); }
  if (!r.ok) { const e = new Error(j.error || String(r.status)); e.status = r.status; throw e; }
  return j;
}

function save(slow) {
  if (MODE === 'local') { saveLocal(S); return; }
  if (!ME) return;
  store.set(cacheKey(), { prog: S.prog, ui: S.ui }); // survives a refresh even before the server has it
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushPrefs, slow ? 2500 : 500);
}
function prefsBody() {
  // tombstones (discarded attempts) only need to live a few days
  const prog = {}; const old = Date.now() - 7 * 864e5;
  Object.keys(S.prog).forEach(k => { const p = S.prog[k]; if (!(p.del && (p.ts || 0) < old)) prog[k] = p; });
  return { fav: S.fav, hard: S.hard, prog, ui: S.ui };
}
async function pushPrefs() {
  clearTimeout(saveTimer); saveTimer = null;
  const body = prefsBody();
  try { const j = await api('state', 'PUT', body); adoptProg(j.prog, body.prog); }
  catch (e) { if (e.status !== 401) { toast(t('saveFail')); saveTimer = setTimeout(pushPrefs, 5000); } }
}
// the server merged our copy with other devices: take newer attempts, drop the ones finished elsewhere
function adoptProg(srv, sent) {
  if (!srv || typeof srv !== 'object') return;
  let changed = false;
  Object.keys(srv).forEach(k => { const a = S.prog[k], b = srv[k]; if (!a || (b.ts || 0) > (a.ts || 0)) { S.prog[k] = normalize({ prog: { [k]: b } }).prog[k] || b; changed = true; } });
  Object.keys(sent || {}).forEach(k => { if (!(k in srv) && S.prog[k] && sent[k] && S.prog[k].pid === sent[k].pid) { delete S.prog[k]; changed = true; } });
  if (changed) { store.set(cacheKey(), { prog: S.prog, ui: S.ui }); refreshIfIdle(); }
}
// back to this tab or window after a while: bring in what other devices did meanwhile
let lastSync = 0;
async function syncFromServer() {
  if (MODE !== 'server' || !ME || Date.now() - lastSync < 8000) return;
  lastSync = Date.now();
  if (saveTimer) await pushPrefs();
  try {
    const st = normalize(await api('state'));
    const have = new Set(S.runs.map(r => r.id)); let changed = false;
    st.runs.forEach(r => { if (!have.has(r.id)) { S.runs.push(r); changed = true; } });
    S.runs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const before = JSON.stringify(S.prog); S.prog = mergeProg(S.prog, st.prog); if (JSON.stringify(S.prog) !== before) changed = true;
    S.fav = st.fav; S.hard = st.hard;
    if (changed) { store.set(cacheKey(), { prog: S.prog, ui: S.ui }); refreshIfIdle(); }
  } catch (e) {}
}
function refreshIfIdle() { // redraw lists and reports; never redraw a question while you are on it, unless it is gone
  const r = route(); const a = document.activeElement;
  if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return;
  if (r.name === 'quiz' && liveProg(r.arg)) return;
  if (['exams', 'imp', 'practice', 'report', 'review', 'quiz'].includes(r.name)) { const y = window.scrollY; render(); window.scrollTo(0, y); }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncFromServer(); });
window.addEventListener('focus', () => syncFromServer());
// leaving or hiding the page: flush the pending save so a refresh comes back to the same place
function flushPrefs() {
  if (MODE === 'local') { saveLocal(S); return; }
  if (!ME || !saveTimer) return;
  clearTimeout(saveTimer); saveTimer = null;
  const body = JSON.stringify(prefsBody()); // browsers allow at most 64 KB for a request sent while the page closes
  try { fetch('/api/state', { method: 'PUT', keepalive: body.length < 60000, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body }); } catch (e) {}
}
window.addEventListener('pagehide', flushPrefs);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushPrefs(); });

async function pushRun(run) {
  if (MODE !== 'server') return;
  for (let i = 0; i < 4; i++) {
    try { await api('attempts', 'POST', run); return; }
    catch (e) { if (e.status === 401 || e.status === 400) return; toast(t('saveFail')); await new Promise(r => setTimeout(r, 3000 * (i + 1))); }
  }
}
async function clearRuns() { if (MODE === 'server') { try { await api('attempts', 'DELETE'); } catch (e) { toast(t('saveFail')); } } }
async function mergeIn(state) { // import: add runs and flags from a backup, never delete anything
  const inc = normalize(state); const have = new Set(S.runs.map(r => r.id)); const added = [];
  inc.runs.forEach(r => { if (!have.has(r.id)) { S.runs.push(r); added.push(r); } });
  S.runs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  S.fav = [...new Set(S.fav.concat(inc.fav))]; S.hard = [...new Set(S.hard.concat(inc.hard))];
  S.prog = mergeProg(S.prog, inc.prog);
  if (MODE === 'server') { await pushPrefs(); for (const r of added) await pushRun(r); }
  else saveLocal(S);
}
async function detectServer() {
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch('/api/config', { cache: 'no-store', signal: ctl.signal, credentials: 'same-origin' });
    clearTimeout(tm);
    if (!r.ok) return false;
    const j = await r.json();
    if (!j || !('googleClientId' in j)) return false;
    GCID = j.googleClientId || '';
    return true;
  } catch (e) { return false; }
}
async function loadServer() {
  try {
    const j = await api('me');
    ME = j.user || null;
    if (ME) {
      if (ME.lang === 'en' || ME.lang === 'fa') { L = ME.lang; PREF.lang = L; savePref(); }
      S = normalize(await api('state'));
      const c = store.get(cacheKey(), null); // this browser may hold newer progress saved just before a refresh
      if (c && typeof c === 'object') {
        const loc = normalize({ prog: c.prog, ui: c.ui });
        S.prog = mergeProg(S.prog, loc.prog);
        if ((loc.ui.ts || 0) > (S.ui.ts || 0)) S.ui = loc.ui;
      }
    }
  } catch (e) { ME = null; }
}
const userName = () => ME ? (ME.name || ME.email) : '';

/* ---------------- where you were: per tab route, scroll and list positions ---------------- */
const UI = () => S.ui;
function uiSet(k, v, slow) { S.ui[k] = v; S.ui.ts = Date.now(); save(slow !== false); }

/* ---------------- exams ---------------- */
function examOf(group, n) { return B.exams.find(e => (e.group || 'main') === group && e.n === n); }
function examSteps(ex) { // multiple-choice questions first (item sets), then the essay items
  if (!ex) return [];
  const mc = ex.sets.flatMap(sid => B.qs.filter(q => q.set === sid).sort((a, b) => a.k - b.k).map(q => q.id));
  const cr = (ex.cr || []).flatMap(cid => (CR[cid] ? CR[cid].items.slice().sort((a, b) => a.k - b.k).map(it => it.id) : []));
  return mc.concat(cr);
}
function stepsMax(ids) { return ids.reduce((s, id) => s + (QMAP[id] ? MC_PTS : CRMAP[id] ? itemMax(CRMAP[id]) : 0), 0); }
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const setOf = (id) => QMAP[id] ? QMAP[id].set : CRMAP[id].cid;
const kOf = (id) => QMAP[id] ? QMAP[id].k : CRMAP[id].k;
function groupBySet(ids, r) { // keep questions of the same case together, shuffle the order of cases, essays after item sets
  const groups = {}; const order = [];
  ids.forEach(id => { const s = setOf(id); if (!groups[s]) { groups[s] = []; order.push(s); } groups[s].push(id); });
  const sh = shuffle(order, r); const mc = sh.filter(s => !CR[s]), cr = sh.filter(s => CR[s]);
  return mc.concat(cr).flatMap(s => groups[s].sort((a, b) => kOf(a) - kOf(b)));
}
// latest outcome of every question or essay item: true right, false wrong (essay: less than full points)
function lastOutcome() {
  const m = {};
  S.runs.forEach(r => {
    const a = r.ans || {}; Object.keys(a).forEach(id => { if (QMAP[id]) m[id] = a[id] === QMAP[id].a; });
    const c = r.cr || {}; Object.keys(c).forEach(id => { if (CRMAP[id]) m[id] = (c[id].p || []).reduce((s, x) => s + x, 0) >= itemMax(CRMAP[id]) - 1e-9; });
  });
  return m;
}
const missedIds = () => { const m = lastOutcome(); return Object.keys(m).filter(id => m[id] === false); };
const cls = (p) => p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad';
const stdIds = (code) => B.qs.filter(q => (q.std || []).includes(code)).map(q => q.id).concat(Object.values(CRMAP).filter(it => (it.std || []).includes(code)).map(it => it.id));

function labelOf(c) {
  if (c.kind === 'exam') return t('exam') + ' ' + num(c.arg);
  if (c.kind === 'imp') return t('impExam') + ' ' + num(c.arg);
  if (c.kind === 'fav') return t('fav');
  if (c.kind === 'hard') return t('hard');
  if (c.kind === 'missed') return t('missed');
  if (c.kind === 'std') return stdLabel(c.arg);
  return '';
}
const runLabel = (r) => labelOf({ kind: r.kind || 'exam', arg: r.kind ? r.arg : r.exam });
const runsOf = (kind, arg) => S.runs.filter(r => (r.kind || 'exam') === kind && (kind === 'exam' || kind === 'imp' ? (r.kind ? r.arg : r.exam) === arg : (kind === 'std' ? r.arg === arg : true)));

/* ---------------- router (hash), tabs and scroll memory ---------------- */
const el = document.getElementById('app');
let navByApp = false, restoring = true, curTab = 'exams', openedBare = false;
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [a, ...rest] = h.split('/');
  let arg = rest.join('/'); try { arg = decodeURIComponent(arg); } catch (e) {}
  return { name: a || 'exams', arg };
}
const TAB_NAMES = ['exams', 'imp', 'practice', 'learn', 'review', 'report', 'account'];
function tabOf(r) {
  if (r.name === 'quiz') { const k = r.arg.split(':')[0]; return k === 'exam' ? 'exams' : k === 'imp' ? 'imp' : 'practice'; }
  if (r.name === 'result') { const ctx = (UI().rctx || {})[r.arg]; if (ctx) return ctx; const run = S.runs.find(x => x.id === r.arg); const k = run ? run.kind || 'exam' : 'exam'; return k === 'exam' ? 'exams' : k === 'imp' ? 'imp' : 'practice'; }
  return TAB_NAMES.includes(r.name) ? r.name : 'exams';
}
function nav(hash, keepScroll) {
  navByApp = !keepScroll;
  if (location.hash === hash) { render(); if (keepScroll) restoreScroll(); else window.scrollTo(0, 0); navByApp = false; return; }
  location.hash = hash;
}
const quizHash = (k) => '#/quiz/' + encodeURIComponent(k);
function rememberRoute() {
  const r = route(); if (r.name === 'print') return; curTab = tabOf(r);
  const tabs = Object.assign({}, UI().tabs || {}); tabs[curTab] = location.hash;
  S.ui.tabs = tabs; S.ui.last = location.hash; S.ui.ts = Date.now(); save(true);
}
function scrollKey() { const r = route(); if (r.name === 'quiz') { const p = liveProg(r.arg); return 'quiz/' + r.arg + ':' + (p ? p.idx : 0); } return r.name + '/' + r.arg; }
let scrollT = null;
window.addEventListener('scroll', () => {
  if (restoring) return;
  clearTimeout(scrollT);
  scrollT = setTimeout(() => {
    const m = Object.assign({}, UI().scroll || {}); const k = scrollKey(); delete m[k]; m[k] = Math.round(window.scrollY);
    const ks = Object.keys(m); if (ks.length > 150) ks.slice(0, ks.length - 150).forEach(x => delete m[x]);
    uiSet('scroll', m);
  }, 250);
}, { passive: true });
function restoreScroll() {
  const y = (UI().scroll || {})[scrollKey()] || 0;
  restoring = true;
  const go = (n) => { window.scrollTo(0, y); if (n > 0 && Math.abs(window.scrollY - y) > 2 && document.body.scrollHeight > y) setTimeout(() => go(n - 1), 60); else restoring = false; };
  requestAnimationFrame(() => go(10));
  setTimeout(() => { restoring = false; }, 1200);
}
window.addEventListener('hashchange', () => {
  const byApp = navByApp; navByApp = false;
  rememberRoute();
  render();
  if (byApp) { window.scrollTo(0, 0); } else restoreScroll();
});
function setScrollTop() { const m = Object.assign({}, UI().scroll || {}); m[scrollKey()] = 0; uiSet('scroll', m); window.scrollTo(0, 0); }

/* ---------------- shell: header, tabs, language, theme ---------------- */
function toast(msg) {
  const d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = msg; document.body.appendChild(d);
  setTimeout(() => d.remove(), 3200);
}
function applyLang() {
  document.documentElement.lang = L; document.documentElement.dir = L === 'fa' ? 'rtl' : 'ltr';
  document.title = t('title');
  document.getElementById('t-title').textContent = t('title');
  document.getElementById('t-sub').textContent = t('sub', num(groupExams('main').length + groupExams('imp').length), num(B.qs.length + Object.keys(CRMAP).length));
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === L));
  const bug = document.getElementById('bugBtn');
  bug.hidden = !(MODE === 'server' && ME); bug.title = t('bugTitle'); bug.setAttribute('aria-label', t('bugTitle'));
  const on = tabOf(route());
  const tabs = [['exams', t('tabHome')]];
  if (HAS_IMP) tabs.push(['imp', t('tabImp')]);
  tabs.push(['practice', t('tabPractice')], ['learn', t('tabLearn')], ['review', t('tabReview')], ['report', t('tabReport')]);
  if (MODE === 'server' && ME) tabs.push(['account', t('tabAccount')]);
  document.getElementById('tabs').innerHTML = (MODE === 'server' && !ME) ? '' : tabs.map(([v, n]) => `<button type="button" data-v="${v}" class="${on === v ? 'on' : ''}" ${on === v ? 'aria-current="page"' : ''}>${esc(n)}</button>`).join('');
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => {
    const v = b.dataset.v;
    if (v === on) { if (location.hash !== '#/' + v) nav('#/' + v, true); return; } // tapping the open tab goes to its main page
    nav((UI().tabs || {})[v] || '#/' + v, true); // other tabs open where you left them
  });
  document.getElementById('foot').textContent = (L === 'fa' ? 'نسخه ' : 'Version ') + num(APP_VERSION);
}
function applyTheme() { if (PREF.theme) document.documentElement.dataset.theme = PREF.theme; else delete document.documentElement.dataset.theme; }
document.querySelectorAll('.lang button').forEach(b => b.onclick = () => {
  L = b.dataset.lang; PREF.lang = L; savePref(); const y = window.scrollY; render(); window.scrollTo(0, y);
  if (MODE === 'server' && ME) api('me/lang', 'PUT', { lang: L }).catch(() => {});
});
document.getElementById('themeBtn').onclick = () => {
  const dark = PREF.theme ? PREF.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  PREF.theme = dark ? 'light' : 'dark'; savePref(); applyTheme(); if (route().name === 'report') { const y = window.scrollY; render(); window.scrollTo(0, y); }
};
document.getElementById('bugBtn').onclick = () => openReport({});

/* in-page confirmation dialog (the browser's own pop-ups are never used) */
function askConfirm(msg, okLabel, danger) {
  return new Promise((done) => {
    const ov = document.createElement('div'); ov.className = 'modal'; ov.setAttribute('role', 'alertdialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = `<div class="sheet small"><p class="cmsg"></p><div class="bar"><button class="act ${danger ? 'danger' : ''}" data-ok>${esc(okLabel || t('ok'))}</button><button class="act ghost" data-no>${esc(t('cancel'))}</button></div></div>`;
    ov.querySelector('.cmsg').textContent = msg;
    const end = (v) => { ov.remove(); document.removeEventListener('keydown', key); done(v); };
    const key = (e) => { if (e.key === 'Escape') end(false); };
    document.addEventListener('keydown', key);
    ov.addEventListener('click', (e) => { if (e.target === ov) end(false); });
    ov.querySelector('[data-ok]').onclick = () => end(true); ov.querySelector('[data-no]').onclick = () => end(false);
    document.body.appendChild(ov); ov.querySelector('[data-no]').focus();
  });
}

/* ---------------- render ---------------- */
function render() {
  applyLang();
  if (MODE === 'server' && !ME) return renderLogin();
  const r = route();
  document.body.classList.toggle('printing', r.name === 'print');
  if (r.name === 'print') return renderPrint(r.arg);
  if (r.name === 'quiz') { if (liveProg(r.arg)) return renderQuiz(r.arg); location.replace('#/' + tabOf(r)); return; }
  if (r.name === 'result') return renderResult(S.runs.find(x => x.id === r.arg));
  if (r.name === 'learn') return r.arg ? renderLesson(r.arg) : renderTree();
  if (r.name === 'imp') return HAS_IMP ? renderExamList('imp') : location.replace('#/exams');
  if (r.name === 'practice') return renderPractice();
  if (r.name === 'review') return renderReview();
  if (r.name === 'report') return renderReport();
  if (r.name === 'account') return MODE === 'server' ? renderAccount() : renderReport();
  return renderExamList('main');
}

/* ---------------- one row of a list: an exam or a practice list ---------------- */
function progLine(p) {
  const n = p.qids.length; const a = p.qids.filter(id => answeredStep(p, id)).length;
  return `<span class="xst prog-on">${esc(t('inProgress', num(a), num(n)))}</span>`;
}
function rowHtml(o) { // o: {key, kind, arg, title, meta, total, mark}
  const p = liveProg(o.key); const runs = runsOf(o.kind, o.arg);
  const best = runs.length ? Math.max(...runs.map(r => r.score)) : null; const last = runs.length ? runs[runs.length - 1] : null;
  let st = '';
  if (p) st += progLine(p);
  if (runs.length) st += `<span class="xst score-${cls(best)}">${esc(t('taken', num(runs.length), pct(best)))}${runs.length > 1 ? esc(SEP() + t('lastScore', pct(last.score))) : ''}</span>`;
  if (!p && !runs.length) st += `<span class="xst">${esc(t('notTaken'))}</span>`;
  let acts = '';
  if (p) acts += `<button class="act sm" data-x="cont" data-key="${esc(o.key)}">${esc(t('resumeBtn'))}</button>`;
  else acts += `<button class="act sm ${runs.length ? 'ghost' : ''}" data-x="start" data-key="${esc(o.key)}" ${o.empty ? 'disabled' : ''}>${esc(runs.length ? t('retake') : t('start'))}</button>`;
  if (runs.length) acts += `<button class="act sm ghost" data-x="res" data-run="${esc(last.id)}">${esc(t('results'))}</button>`;
  if (p) acts += `<button class="flag sm" data-x="over" data-key="${esc(o.key)}">${esc(t('startOver'))}</button>`;
  const status = p ? 'prog' : runs.length ? 'done' : 'new';
  return `<div class="xrow ${o.mark ? 'mark' : ''}" data-status="${status}" data-row="${esc(o.key)}">
    ${o.badge != null ? `<span class="xnum" aria-hidden="true">${esc(o.badge)}</span>` : ''}
    <div class="xmain"><b class="xt">${esc(o.title)}</b><span class="xmeta">${esc(o.meta)}</span><span class="xsts">${st}</span></div>
    <div class="xacts">${acts}</div></div>`;
}
function wireRows(scope, tab) {
  scope.querySelectorAll('[data-x]').forEach(b => b.onclick = async () => {
    const x = b.dataset.x, key = b.dataset.key;
    if (key) { const m = Object.assign({}, UI().mark || {}); m[tab] = key; uiSet('mark', m); }
    if (x === 'cont') { nav(quizHash(key), true); }
    if (x === 'start') startKey(key);
    if (x === 'res') { const c = Object.assign({}, UI().rctx || {}); c[b.dataset.run] = tab; uiSet('rctx', c); nav('#/result/' + b.dataset.run); }
    if (x === 'over') { if (await askConfirm(t('confirmOver'), t('startOver'), true)) startKey(key, true); }
  });
}
function listScroller(box, id) { // fixed-height list that remembers its own scroll position
  if (!box) return;
  const all = Object.assign({}, UI().lists || {});
  const y = all[id];
  if (y != null) box.scrollTop = y;
  else { const m = box.querySelector('.xrow.mark'); if (m) box.scrollTop = m.offsetTop - box.clientHeight / 3; }
  let tm = null;
  box.addEventListener('scroll', () => { clearTimeout(tm); tm = setTimeout(() => { const l = Object.assign({}, UI().lists || {}); l[id] = Math.round(box.scrollTop); uiSet('lists', l); }, 250); }, { passive: true });
}
function filterBar(id, counts) {
  const f = (UI().filt || {})[id] || 'all';
  const opts = [['all', t('fAll')], ['new', t('fNew')], ['prog', t('fProg')], ['done', t('fDone')]];
  return `<div class="chips" role="group" aria-label="${esc(t('filter'))}">${opts.map(([v, n]) => `<button class="chip ${f === v ? 'on' : ''}" data-f="${v}" aria-pressed="${f === v}">${esc(n)} <small>${esc(num(counts[v]))}</small></button>`).join('')}</div>`;
}
function applyFilter(box, id) {
  const f = (UI().filt || {})[id] || 'all'; let shown = 0;
  box.querySelectorAll('.xrow').forEach(r => { const on = f === 'all' || r.dataset.status === f; r.hidden = !on; if (on) shown++; });
  let e = box.querySelector('.xempty'); if (!shown) { if (!e) { e = document.createElement('div'); e.className = 'xempty empty'; e.textContent = t('noneHere'); box.appendChild(e); } } else if (e) e.remove();
}
function wireFilter(scope, box, id) {
  scope.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
    const fl = Object.assign({}, UI().filt || {}); fl[id] = b.dataset.f; uiSet('filt', fl);
    scope.querySelectorAll('[data-f]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    applyFilter(box, id); box.scrollTop = 0;
  });
  applyFilter(box, id);
}
function examMeta(ex) {
  const nq = ex.sets.reduce((s, sid) => s + B.qs.filter(q => q.set === sid).length, 0);
  const parts = [t('sets', num(ex.sets.length)), t('qs', num(nq))];
  if ((ex.cr || []).length) parts.push(t('essaySets', num(ex.cr.length)));
  parts.push(t('points', num(stepsMax(examSteps(ex)))));
  return parts.join(SEP());
}

/* ---------------- exams and important exams ---------------- */
function renderExamList(group) {
  const tab = group === 'imp' ? 'imp' : 'exams'; const kind = group === 'imp' ? 'imp' : 'exam';
  const exs = groupExams(group); const mark = (UI().mark || {})[tab];
  const rows = exs.map(ex => ({ key: pkey(kind, ex.n), kind, arg: ex.n, badge: num(ex.n), title: (group === 'imp' ? t('impExam') : t('exam')) + ' ' + num(ex.n), meta: examMeta(ex) }));
  rows.forEach(o => { o.mark = o.key === mark; });
  const counts = { all: rows.length, new: 0, prog: 0, done: 0 };
  rows.forEach(o => { counts[liveProg(o.key) ? 'prog' : runsOf(o.kind, o.arg).length ? 'done' : 'new']++; });
  let h = `<div class="card"><div class="xhead"><div><h2>${esc(group === 'imp' ? t('impTitle') : t('exams'))}</h2>
    <div class="meta">${esc(group === 'imp' ? t('impMeta', num(exs.length)) : t('examsMeta2', num(exs.length)))}</div></div>
    ${dlButton(tab)}</div>
    ${filterBar(tab, counts)}
    <div class="xlist" id="xl-${tab}" tabindex="0" aria-label="${esc(group === 'imp' ? t('impTitle') : t('exams'))}">${rows.map(rowHtml).join('')}</div></div>`;
  el.innerHTML = h;
  const box = document.getElementById('xl-' + tab);
  wireRows(el, tab); wireFilter(el, box, tab); listScroller(box, tab); wireDl(tab);
}

/* ---------------- practice: your lists and each standard ---------------- */
function renderPractice() {
  const mark = (UI().mark || {}).practice;
  const miss = missedIds();
  const mine = [
    { key: 'fav', kind: 'fav', arg: null, title: t('fav'), meta: t('saved', num(S.fav.length)), empty: !S.fav.length },
    { key: 'hard', kind: 'hard', arg: null, title: t('hard'), meta: t('flagged', num(S.hard.length)), empty: !S.hard.length },
    { key: 'missed', kind: 'missed', arg: null, title: t('missed'), meta: t('toRedo', num(miss.length)), empty: !miss.length }];
  const out = lastOutcome();
  const std = STD_ORDER.map(code => { const ids = stdIds(code); if (!ids.length) return null;
    const seen = ids.filter(id => id in out); const ok = seen.filter(id => out[id]).length;
    return { key: pkey('std', code), kind: 'std', arg: code, badge: stdCode(code), title: STD[code][L === 'fa' ? 1 : 0],
      meta: t('qs', num(ids.length)) + (seen.length ? SEP() + t('accSoFar', pct(Math.round(ok / seen.length * 100)), num(seen.length)) : '') }; }).filter(Boolean);
  [...mine, ...std].forEach(o => { o.mark = o.key === mark; });
  const counts = { all: std.length, new: 0, prog: 0, done: 0 };
  std.forEach(o => { counts[liveProg(o.key) ? 'prog' : runsOf(o.kind, o.arg).length ? 'done' : 'new']++; });
  let h = `<div class="card"><div class="xhead"><div><h2>${esc(t('practiceTitle'))}</h2><div class="meta">${esc(t('practiceMeta'))}</div></div>${dlButton('practice')}</div>
    <h3>${esc(t('targeted'))}</h3><div class="xlist short">${mine.map(rowHtml).join('')}</div>
    <h3>${esc(t('byStd'))}</h3>${filterBar('practice', counts)}
    <div class="xlist" id="xl-practice" tabindex="0" aria-label="${esc(t('byStd'))}">${std.map(rowHtml).join('')}</div></div>`;
  el.innerHTML = h;
  const box = document.getElementById('xl-practice');
  wireRows(el, 'practice'); wireFilter(el, box, 'practice'); listScroller(box, 'practice'); wireDl('practice');
}

/* ---------------- start / continue ---------------- */
function idsFor(kind, arg) {
  let ids = [];
  if (kind === 'exam' || kind === 'imp') return examSteps(examOf(kind === 'imp' ? 'imp' : 'main', +arg));
  if (kind === 'fav') ids = S.fav.slice();
  if (kind === 'hard') ids = S.hard.slice();
  if (kind === 'missed') ids = missedIds();
  if (kind === 'std') ids = stdIds(arg);
  return groupBySet(ids.filter(known), rng(Date.now() % 99991));
}
function startKey(key, fresh) {
  if (!fresh && liveProg(key)) { nav(quizHash(key), true); return; }
  const i = key.indexOf(':'); const kind = i < 0 ? key : key.slice(0, i); let arg = i < 0 ? null : key.slice(i + 1);
  if (kind === 'exam' || kind === 'imp') arg = +arg;
  startWith(kind, arg, idsFor(kind, arg), key);
}
function startWith(kind, arg, ids, key) {
  if (!ids.length) { toast(t('nothing')); return; }
  key = key || pkey(kind, arg);
  S.prog[key] = { pid: rid(), kind, arg, qids: ids, idx: 0, ans: {}, rev: {}, cra: {}, crc: {}, t0: Date.now(), ts: Date.now() };
  save(); const m = Object.assign({}, UI().scroll || {}); delete m['quiz/' + key + ':0']; S.ui.scroll = m;
  nav(quizHash(key));
}
// kept for links elsewhere (report, lessons)
function startSet(kind, arg) { startKey(pkey(kind, arg)); }

/* ---------------- essay grading (case does not matter; small typos are forgiven) ---------------- */
const { nrm, parseStd, parseNum, gradePart, blankVal } = window.CFAG;
function gradeItem(it, vals) {
  const res = it.parts.map((p, i) => gradePart(p, (vals || [])[i]));
  // as in real grading, a justification earns nothing when the Yes/No verdict it supports is wrong
  let yn = null;
  it.parts.forEach((p, i) => { if (p.type === 'yesno') yn = res[i]; else if (p.type === 'keywords' && yn && yn.ok !== 1 && res[i].got > 0) { res[i].got = 0; res[i].ok = 0; res[i].verdict = true; } });
  return { res, got: res.reduce((s, x) => s + x.got, 0), max: itemMax(it) };
}
function partAnswer(p) { // the correct answer of one part, written for the reader
  if (p.type === 'yesno') return t(p.answer);
  if (p.type === 'choice') return optLetter(p.answer) + '. ' + tx(p.options[p.answer]);
  if (p.type === 'number') return num(p.answer);
  if (p.type === 'std') return p.answer.map(c => stdLabel(c)).join(L === 'fa' ? ' یا ' : ' or ');
  if (p.type === 'keywords') return p.groups.map((g, i) => `(${num(i + 1)}) ` + (g[L] || g.en).slice(0, 3).join(L === 'fa' ? '، ' : ', ')).join('   ');
  return '';
}
function answeredStep(p, id) {
  if (QMAP[id]) return p.ans[id] !== undefined;
  const v = (p.cra || {})[id]; return !!(v && v.some(x => !blankVal(x)));
}

/* ---------------- quiz ---------------- */
function renderQuiz(key) {
  const c = liveProg(key); const n = c.qids.length; c.idx = Math.max(0, Math.min(n - 1, c.idx || 0));
  const id = c.qids[c.idx];
  const nAns = c.qids.filter(x => answeredStep(c, x)).length;
  const done = (x) => QMAP[x] ? !!c.rev[x] : !!c.crc[x];
  const isRight = (x) => QMAP[x] ? c.ans[x] === QMAP[x].a : (c.crc[x] && c.crc[x].got >= c.crc[x].max - 1e-9);
  let h = `<div class="card"><div class="bar" style="margin-top:0">
      <div style="min-width:0;flex:1 1 12rem"><h2 style="margin:0">${esc(labelOf(c))}</h2>
      <div class="meta">${esc(t('qOf', num(c.idx + 1), num(n)))}${SEP()}${esc(t('answered', num(nAns)))}</div></div>
      <button class="act ghost" data-a="list">${esc(t('toList'))}</button>
      <button class="act ghost" data-a="finish">${esc(t('finish'))}</button></div>
      <div class="prog"><i style="width:${(nAns / n * 100).toFixed(1)}%"></i></div>
      <div class="qnav">${c.qids.map((x, i) => {
        let k = isCR(x) ? 'crq ' : ''; if (done(x)) k += isRight(x) ? 'ok' : 'no'; else if (answeredStep(c, x)) k += 'ans-d';
        return `<button data-go="${i}" class="${k} ${i === c.idx ? 'cur' : ''}" aria-label="${esc(t('qOf', num(i + 1), num(n)))}${isCR(x) ? ' ' + esc(t('essayTag')) : ''}">${esc(num(i + 1))}</button>`; }).join('')}</div></div>`;
  h += QMAP[id] ? mcHtml(c, QMAP[id]) : crHtml(c, CRMAP[id]);
  h += `<div class="card"><div class="bar" style="margin-top:0">
    <button class="flag ${S.fav.includes(id) ? 'on' : ''}" data-a="fav">${esc(S.fav.includes(id) ? t('favOn') : t('favOff'))}</button>
    <button class="flag hard ${S.hard.includes(id) ? 'on' : ''}" data-a="hard">${esc(S.hard.includes(id) ? t('hardOn') : t('hardOff'))}</button>
    ${MODE === 'server' ? `<button class="flag" data-a="repq">⚐ ${esc(t('reportQ'))}</button>` : ''}
    <span class="spacer"></span>
    <button class="act ghost" data-a="prev" ${c.idx === 0 ? 'disabled' : ''}>${esc(t('prev'))}</button>
    <button class="act" data-a="next" ${c.idx === n - 1 ? 'disabled' : ''}>${esc(c.idx === n - 1 ? t('last') : t('next'))}</button>
  </div></div>`;
  el.innerHTML = h;
  const det = el.querySelector('details.vig'); if (det) det.addEventListener('toggle', () => uiSet('vig', det.open));
  const go = (i) => { c.idx = i; c.ts = Date.now(); save(); rememberRoute(); renderQuiz(key); restoreScroll(); };
  const touch = () => { c.ts = Date.now(); save(); };
  el.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { if (c.rev[id]) return; c.ans[id] = +b.dataset.pick; touch(); keepY(() => renderQuiz(key)); });
  el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(+b.dataset.go));
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'reveal') { c.rev[id] = true; touch(); keepY(() => renderQuiz(key)); }
    if (a === 'fav') { toggle('fav', id); keepY(() => renderQuiz(key)); }
    if (a === 'hard') { toggle('hard', id); keepY(() => renderQuiz(key)); }
    if (a === 'repq') openReport({ kind: 'question', qid: id });
    if (a === 'prev') go(Math.max(0, c.idx - 1));
    if (a === 'next') go(Math.min(n - 1, c.idx + 1));
    if (a === 'finish') finish(key);
    if (a === 'list') nav('#/' + tabOf(route()), true);
  });
  if (isCR(id)) wireCR(c, CRMAP[id], key, touch);
}
function keepY(fn) { const y = window.scrollY; fn(); window.scrollTo(0, y); }
function mcHtml(c, q) {
  const set = B.sets[q.set];
  const firstOfSet = c.idx === 0 || setOf(c.qids[c.idx - 1]) !== q.set;
  const setQs = c.qids.filter(x => setOf(x) === q.set);
  const vigOpen = UI().vig !== false;
  let h = `<div class="card">
    <div><span class="pill">${esc(t('setId'))}: ${esc(tx(set.title))}</span><span class="pill">${esc(t('ofTotal', num(setQs.indexOf(q.id) + 1), num(setQs.length)))}</span><span class="pill">${esc(t('points', num(MC_PTS)))}</span></div>
    <details class="vig" ${vigOpen || firstOfSet ? 'open' : ''}><summary>${esc(t('vignette'))}</summary><div class="vignette">${esc(tx(set.vig))}</div></details>
    <div class="qtext">${esc(tx(q.q))}</div><div>`;
  q.o.forEach((o, i) => {
    let k = 'opt';
    if (c.rev[q.id]) { if (i === q.a) k += ' right'; else if (c.ans[q.id] === i) k += ' wrong'; }
    else if (c.ans[q.id] === i) k += ' sel';
    h += `<button class="${k}" data-pick="${i}" ${c.rev[q.id] ? 'disabled' : ''}><span class="lt">${esc(optLetter(i))}.</span><span class="tx">${esc(tx(o))}</span></button>`;
  });
  h += `</div>`;
  if (c.rev[q.id]) h += explainBlock(q);
  else h += `<div class="bar"><button class="act" data-a="reveal">${esc(t('reveal'))}</button></div>`;
  return h + `</div>`;
}
function crHtml(c, it) {
  const set = CR[it.cid]; const vals = c.cra[it.id] || []; const chk = c.crc[it.id];
  const firstOfSet = c.idx === 0 || setOf(c.qids[c.idx - 1]) !== it.cid;
  const items = c.qids.filter(x => setOf(x) === it.cid);
  const vigOpen = UI().vig !== false;
  const now = chk ? gradeItem(it, vals) : null;
  let h = `<div class="card crcard">
    <div><span class="pill crpill">${esc(t('essayTag'))}</span><span class="pill">${esc(t('setId'))}: ${esc(tx(set.title))}</span><span class="pill">${esc(t('ofTotal', num(items.indexOf(it.id) + 1), num(items.length)))}</span><span class="pill">${esc(t('points', num(itemMax(it))))}</span></div>
    <details class="vig" ${vigOpen || firstOfSet ? 'open' : ''}><summary>${esc(t('vignette'))}</summary><div class="vignette">${esc(tx(set.vig))}</div></details>
    <div class="qtext">${esc(tx(it.q))}</div><div class="parts">`;
  it.parts.forEach((p, i) => {
    const v = vals[i]; const r = now ? now.res[i] : null; const first = chk ? chk.res[i] : null;
    h += `<div class="part ${r ? (r.ok === 1 ? 'p-ok' : r.ok ? 'p-half' : 'p-bad') : ''}" data-part="${i}">
      <div class="plabel"><b>${esc(tx(p.label))}</b> <small>(${esc(t('points', num(p.pts)))})</small></div>`;
    if (p.type === 'yesno') h += `<div class="seg" role="radiogroup">${['yes', 'no'].map(y => `<button type="button" role="radio" aria-checked="${v === y}" class="segb ${v === y ? 'on' : ''}" data-yn="${y}">${esc(t(y))}</button>`).join('')}</div>`;
    else if (p.type === 'choice') h += `<div>${p.options.map((o, j) => `<button type="button" class="opt ${+v === j && !blankVal(v) ? 'sel' : ''}" data-ch="${j}"><span class="lt">${esc(optLetter(j))}.</span><span class="tx">${esc(tx(o))}</span></button>`).join('')}</div>`;
    else {
      const ph = p.type === 'std' ? t('phStd') : p.type === 'number' ? t('phNum') : t('phKw');
      const field = p.type === 'keywords'
        ? `<textarea class="inp crin" rows="3" dir="auto" data-in="${i}" placeholder="${esc(ph)}" autocapitalize="off" spellcheck="true"></textarea>`
        : `<input class="inp crin" type="text" dir="auto" data-in="${i}" placeholder="${esc(ph)}" autocapitalize="off" autocomplete="off" ${p.type === 'number' ? 'inputmode="decimal"' : ''}>`;
      h += `<div class="inwrap">${field}<span class="casenote">${esc(t('caseNote'))}</span></div>`;
    }
    if (r) {
      const mark = r.ok === 1 ? `✓ ${t('pRight')}` : r.ok ? `◐ ${t('pHalf')}` : (blankVal(v) ? `✕ ${t('pEmpty')}` : `✕ ${t('pWrong')}`);
      h += `<div class="pfb"><b>${esc(mark)}</b> ${esc(t('pGot', num(r.got), num(r.max)))}${r.amb ? ' ' + esc(t('pAmb')) : ''}`;
      if (p.type === 'keywords') h += `<div>${esc(t('kwFound', num(r.hit.length), num(p.need || p.groups.length)))}</div>${r.verdict ? `<div>${esc(t('kwVerdict'))}</div>` : ''}`;
      if (r.ok !== 1) h += `<div><b>${esc(t('pCorrect'))}:</b> ${esc(partAnswer(p))}</div>`;
      if (first && (first.got !== r.got)) h += `<div class="small">${esc(t('firstCheck', num(first.got), num(first.max)))}</div>`;
      h += `</div>`;
    }
    h += `</div>`;
  });
  h += `</div>`;
  if (chk) {
    h += `<div class="crscore">${esc(t('itemScore', num(chk.got), num(chk.max)))}</div>
      <div class="ans"><b>${esc(t('model'))}:</b> ${esc(tx(it.model))}\n\n<b>${esc(t('why'))}:</b> ${lessonFmt(esc(tx(it.why)))}</div>
      <div class="ref"><b>${esc(t('ref'))}:</b> ${esc(tx(it.ref))}\n${(it.std || []).map(s => `<span class="pill">${esc(stdLabel(s))}</span>`).join(' ')}</div>
      <div class="bar"><button class="act ghost" data-a="recheck">${esc(t('recheck'))}</button></div><div class="tip">${esc(t('recheckNote'))}</div>`;
  } else h += `<div class="bar"><button class="act" data-a="check">${esc(t('check'))}</button></div>`;
  return h + `</div>`;
}
function wireCR(c, it, key, touch) {
  const vals = c.cra[it.id] = c.cra[it.id] || [];
  el.querySelectorAll('[data-in]').forEach(inp => {
    const i = +inp.dataset.in; inp.value = vals[i] == null ? '' : vals[i];
    let tm = null;
    inp.addEventListener('input', () => { vals[i] = inp.value; clearTimeout(tm); tm = setTimeout(touch, 400); });
    inp.addEventListener('blur', () => { vals[i] = inp.value; touch(); });
  });
  el.querySelectorAll('.part').forEach(pe => {
    const i = +pe.dataset.part;
    pe.querySelectorAll('[data-yn]').forEach(b => b.onclick = () => { vals[i] = b.dataset.yn; touch(); keepY(() => renderQuiz(key)); });
    pe.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => { vals[i] = +b.dataset.ch; touch(); keepY(() => renderQuiz(key)); });
  });
  const ck = () => { el.querySelectorAll('[data-in]').forEach(inp => { vals[+inp.dataset.in] = inp.value; }); };
  const b1 = el.querySelector('[data-a="check"]');
  if (b1) b1.onclick = () => { ck(); const g = gradeItem(it, vals); c.crc[it.id] = { got: g.got, max: g.max, res: g.res.map(r => ({ got: r.got, max: r.max })), v: vals.slice() }; touch(); keepY(() => renderQuiz(key)); };
  const b2 = el.querySelector('[data-a="recheck"]');
  if (b2) b2.onclick = () => { ck(); touch(); keepY(() => renderQuiz(key)); };
}
function toggle(list, id) { const i = S[list].indexOf(id); if (i < 0) S[list].push(id); else S[list].splice(i, 1); save(); }
function lessonFmt(h) { return h.replace(/\s*(Lesson:|درس:)\s*/, '\n\n<b>$1</b> '); }
function explainBlock(q) {
  return `<div class="ans"><b>${esc(t('answer'))}: ${esc(optLetter(q.a))}.</b> ${esc(tx(q.o[q.a]))}\n\n<b>${esc(t('why'))}:</b> ${lessonFmt(esc(tx(q.why)))}</div>
    <div class="ref"><b>${esc(t('ref'))}:</b> ${esc(tx(q.ref))}\n${(q.std || []).map(s => `<span class="pill">${esc(stdLabel(s))}</span>`).join(' ')}</div>`;
}
async function finish(key) {
  const c = liveProg(key); const n = c.qids.length; const nAns = c.qids.filter(x => answeredStep(c, x)).length;
  if (nAns < n && !(await askConfirm(t('confirmFinishPart', num(n - nAns)), t('finish')))) return;
  const mc = c.qids.filter(x => QMAP[x]); const crIds = c.qids.filter(x => CRMAP[x]);
  const correct = mc.filter(x => c.ans[x] === QMAP[x].a).length;
  const cr = {}; let crGot = 0;
  crIds.forEach(x => { // the first check counts; an item never checked is graded now
    const it = CRMAP[x]; const chk = c.crc[x]; const vals = chk ? chk.v : (c.cra[x] || []);
    const res = chk ? chk.res : gradeItem(it, vals).res;
    const p = res.map(r => r.got); crGot += p.reduce((s, y) => s + y, 0);
    cr[x] = { v: (vals || []).map(v => (v == null ? null : typeof v === 'number' ? v : String(v).slice(0, 600))), p, m: itemMax(it) };
  });
  const max = stepsMax(c.qids); const pts = correct * MC_PTS + crGot;
  const run = { exam: c.kind === 'exam' || c.kind === 'imp' ? c.arg : null, kind: c.kind, arg: c.arg, pid: c.pid, date: new Date().toISOString(),
    mins: Math.max(1, Math.round((Date.now() - c.t0) / 60000)), total: mc.length, answered: mc.filter(x => c.ans[x] !== undefined).length, correct,
    score: max ? Math.round(pts / max * 100) : 0, pts, max, qids: mc, ans: c.ans, cr, id: rid() };
  S.runs.push(run); S.prog[key] = { del: 1, ts: Date.now() }; save(); pushRun(run);
  const ctx = Object.assign({}, UI().rctx || {}); ctx[run.id] = tabOf(route()); uiSet('rctx', ctx);
  const mk = Object.assign({}, UI().mark || {}); mk[tabOf(route())] = key; uiSet('mark', mk);
  setScrollTop(); nav('#/result/' + run.id);
}

/* ---------------- result of one attempt ---------------- */
const runMax = (r) => r.max || (r.total || 0) * MC_PTS;
const runPts = (r) => r.pts != null ? r.pts : (r.correct || 0) * MC_PTS;
function renderResult(r) {
  if (!r) { location.replace('#/' + tabOf(route())); return; }
  const kind = r.kind || 'exam'; const arg = r.kind ? r.arg : r.exam;
  const all = runsOf(kind, arg); const k = all.indexOf(r);
  const crIds = Object.keys(r.cr || {}).filter(x => CRMAP[x]);
  const crGot = crIds.reduce((s, x) => s + r.cr[x].p.reduce((a, b) => a + b, 0), 0), crMax = crIds.reduce((s, x) => s + itemMax(CRMAP[x]), 0);
  let h = `<div class="card"><h2>${esc(runLabel(r))}: ${esc(t('result'))}</h2>
    ${all.length > 1 ? `<div class="chips">${all.map((x, i) => `<button class="chip ${x === r ? 'on' : ''}" data-other="${esc(x.id)}">${esc(t('attemptN', num(i + 1)))} <small>${esc(pct(x.score))}</small></button>`).join('')}</div>` : ''}
    <div class="stats"><span class="stat"><b class="${cls(r.score)}">${esc(pct(r.score))}</b><span>${esc(t('score'))}</span></span>
    <span class="stat"><b>${esc(num(runPts(r)))}/${esc(num(runMax(r)))}</b><span>${esc(t('ptsWord'))}</span></span>
    ${r.total ? `<span class="stat"><b>${esc(num(r.correct))}/${esc(num(r.total))}</b><span>${esc(t('mcRight'))}</span></span>` : ''}
    ${crIds.length ? `<span class="stat"><b>${esc(num(crGot))}/${esc(num(crMax))}</b><span>${esc(t('crPts'))}</span></span>` : ''}
    <span class="stat"><b>${esc(t('mins', num(r.mins)))}</b><span>${esc(t('duration'))}</span></span></div>
    <div class="tip">${esc(t('scoreNote2'))}</div>
    <div class="bar"><button class="act" data-a="home">${esc(t('back'))}</button>
    <button class="act ghost" data-a="redo">${esc(t('redo'))}</button>
    <button class="act ghost" data-a="rep">${esc(t('seeReport'))}</button></div></div>`;
  const acc = accBy([r], q => (q.std || ['CODE'])[0]);
  h += `<div class="card"><h2>${esc(t('rpByStd'))}</h2>${hbars(acc, x => stdLabel(x), true)}</div>`;
  h += `<div class="card"><h2>${esc(t('details'))}</h2>`;
  (r.qids || []).forEach((id, i) => {
    const q = QMAP[id]; if (!q) return; const a = (r.ans || {})[id]; const ok = a === q.a;
    h += `<div class="result-q"><div><span class="pill">${esc(num(i + 1))}</span><span class="pill ${ok ? 'good' : 'bad'}">${esc(ok ? t('correct') : t('wrong'))}</span>
      <span class="pill">${esc(t('setId'))}: ${esc(tx(B.sets[q.set].title))}</span></div>
      <details><summary class="qtext" style="cursor:pointer">${esc(tx(q.q))}</summary>
      <details class="vig"><summary>${esc(t('vignette'))}</summary><div class="vignette">${esc(tx(B.sets[q.set].vig))}</div></details>
      ${q.o.map((o, j) => `<div class="opt ${j === q.a ? 'right' : (j === a ? 'wrong' : '')}"><span class="lt">${esc(optLetter(j))}.</span><span class="tx">${esc(tx(o))}</span></div>`).join('')}
      <div class="meta">${esc(t('yourAns'))}: ${a === undefined ? esc(t('none')) : esc(optLetter(a))}</div>
      ${explainBlock(q)}</details></div>`;
  });
  crIds.forEach((id, i) => {
    const it = CRMAP[id]; const rec = r.cr[id]; const got = rec.p.reduce((a, b) => a + b, 0); const mx = itemMax(it);
    h += `<div class="result-q"><div><span class="pill crpill">${esc(t('essayTag'))} ${esc(num(i + 1))}</span><span class="pill ${got >= mx ? 'good' : got > 0 ? 'mid' : 'bad'}">${esc(t('pGot', num(got), num(mx)))}</span>
      <span class="pill">${esc(t('setId'))}: ${esc(tx(CR[it.cid].title))}</span></div>
      <details><summary class="qtext" style="cursor:pointer">${esc(tx(it.q))}</summary>
      <details class="vig"><summary>${esc(t('vignette'))}</summary><div class="vignette">${esc(tx(CR[it.cid].vig))}</div></details>
      ${it.parts.map((p, j) => { const v = rec.v[j]; const shown = blankVal(v) ? t('none') : p.type === 'yesno' ? t(v) : p.type === 'choice' ? optLetter(+v) + '. ' + tx(p.options[+v]) : String(v);
        return `<div class="part ${rec.p[j] >= p.pts ? 'p-ok' : rec.p[j] > 0 ? 'p-half' : 'p-bad'}"><div class="plabel"><b>${esc(tx(p.label))}</b></div>
          <div class="meta">${esc(t('yourAns'))}: <span class="usertext" dir="auto">${esc(shown)}</span>${SEP()}${esc(t('pGot', num(rec.p[j]), num(p.pts)))}</div>
          ${rec.p[j] >= p.pts ? '' : `<div class="meta"><b>${esc(t('pCorrect'))}:</b> ${esc(partAnswer(p))}</div>`}</div>`; }).join('')}
      <div class="ans"><b>${esc(t('model'))}:</b> ${esc(tx(it.model))}\n\n<b>${esc(t('why'))}:</b> ${lessonFmt(esc(tx(it.why)))}</div>
      <div class="ref"><b>${esc(t('ref'))}:</b> ${esc(tx(it.ref))}</div></details></div>`;
  });
  h += `</div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-other]').forEach(b => b.onclick = () => { const c = Object.assign({}, UI().rctx || {}); c[b.dataset.other] = tabOf(route()); uiSet('rctx', c); nav('#/result/' + b.dataset.other); });
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'home') nav('#/' + tabOf(route()), true);
    if (a === 'rep') nav('#/report', true);
    if (a === 'redo') {
      const w = (r.qids || []).filter(id => QMAP[id] && (r.ans || {})[id] !== QMAP[id].a).concat(crIds.filter(id => r.cr[id].p.reduce((x, y) => x + y, 0) < itemMax(CRMAP[id])));
      if (!w.length) { toast(t('nothing')); return; }
      startWith('missed', null, groupBySet(w, rng(Date.now() % 99991)), 'missed');
    }
  });
}

/* ---------------- review (favorites, hard) ---------------- */
function itemReviewHtml(id) {
  if (QMAP[id]) { const q = QMAP[id];
    return `<div class="result-q"><div>${(q.std || []).slice(0, 1).map(s => `<span class="pill">${esc(stdLabel(s))}</span>`).join('')}</div>
      <details><summary class="qtext" style="cursor:pointer">${esc(tx(q.q))}</summary>
      <details class="vig"><summary>${esc(t('vignette'))}</summary><div class="vignette">${esc(tx(B.sets[q.set].vig))}</div></details>
      ${q.o.map((o, j) => `<div class="opt ${j === q.a ? 'right' : ''}"><span class="lt">${esc(optLetter(j))}.</span><span class="tx">${esc(tx(o))}</span></div>`).join('')}
      ${explainBlock(q)}</details></div>`; }
  const it = CRMAP[id];
  return `<div class="result-q"><div><span class="pill crpill">${esc(t('essayTag'))}</span>${(it.std || []).slice(0, 1).map(s => `<span class="pill">${esc(stdLabel(s))}</span>`).join('')}</div>
    <details><summary class="qtext" style="cursor:pointer">${esc(tx(it.q))}</summary>
    <details class="vig"><summary>${esc(t('vignette'))}</summary><div class="vignette">${esc(tx(CR[it.cid].vig))}</div></details>
    ${it.parts.map(p => `<div class="meta"><b>${esc(tx(p.label))}:</b> ${esc(partAnswer(p))}</div>`).join('')}
    <div class="ans"><b>${esc(t('model'))}:</b> ${esc(tx(it.model))}\n\n<b>${esc(t('why'))}:</b> ${lessonFmt(esc(tx(it.why)))}</div>
    <div class="ref"><b>${esc(t('ref'))}:</b> ${esc(tx(it.ref))}</div></details></div>`;
}
function renderReview() {
  let h = '';
  [['fav', t('fav')], ['hard', t('hard')]].forEach(([k, title]) => {
    const ids = S[k].filter(known);
    h += `<div class="card"><h2>${esc(title)} <span class="meta">(${esc(num(ids.length))})</span></h2>`;
    if (!ids.length) h += `<div class="empty">${esc(t('reviewEmpty'))}</div>`;
    else {
      h += `<div class="bar" style="margin-top:0"><button class="act" data-a="practice" data-k="${k}">${esc(t('practice'))}</button><button class="flag" data-a="clear" data-k="${k}">${esc(t('clear'))}</button></div>`;
      ids.forEach(id => { h += itemReviewHtml(id); });
    }
    h += `</div>`;
  });
  el.innerHTML = h;
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
    if (b.dataset.a === 'practice') startKey(b.dataset.k);
    if (b.dataset.a === 'clear' && await askConfirm(t('confirmClearList'), t('clear'), true)) { S[b.dataset.k] = []; save(); render(); }
  });
}


/* ---------------- print pages (used to make the downloadable PDF files) ---------------- */
function printMC(q, i) {
  return `<div class="pq"><div class="pqh"><b>${esc(num(i))}.</b> ${esc(tx(q.q))}</div>
    ${q.o.map((o, j) => `<div class="popt ${j === q.a ? 'pright' : ''}"><span class="lt">${esc(optLetter(j))}.</span> ${esc(tx(o))}</div>`).join('')}
    ${explainBlock(q)}</div>`;
}
function printCR(it, i) {
  return `<div class="pq"><div class="pqh"><b>${esc(num(i))}.</b> ${esc(tx(it.q))} <small>(${esc(t('points', num(itemMax(it))))})</small></div>
    ${it.parts.map(p => `<div class="ppart"><b>${esc(tx(p.label))}</b> <small>(${esc(t('points', num(p.pts)))})</small><br>${p.type === 'choice' ? p.options.map((o, j) => `<div class="popt ${j === p.answer ? 'pright' : ''}"><span class="lt">${esc(optLetter(j))}.</span> ${esc(tx(o))}</div>`).join('') : ''}<span class="pcorr">${esc(t('pCorrect'))}: ${esc(partAnswer(p))}</span></div>`).join('')}
    <div class="ans"><b>${esc(t('model'))}:</b> ${esc(tx(it.model))}\n\n<b>${esc(t('why'))}:</b> ${lessonFmt(esc(tx(it.why)))}</div>
    <div class="ref"><b>${esc(t('ref'))}:</b> ${esc(tx(it.ref))}</div></div>`;
}
function printSets(ids) { // group questions by their case, print each case once
  let h = ''; let last = null; let i = 0;
  ids.forEach(id => {
    const sid = setOf(id);
    if (sid !== last) {
      last = sid; const isC = !!CR[sid]; const S0 = isC ? CR[sid] : B.sets[sid];
      h += `<h2 class="pset">${isC ? esc(t('essayTag')) + ': ' : ''}${esc(tx(S0.title))}</h2><div class="vignette">${esc(tx(S0.vig))}</div>`;
    }
    i++; h += QMAP[id] ? printMC(QMAP[id], i) : printCR(CRMAP[id], i);
  });
  return h;
}
function printLearn(n, d) {
  let h = `<h${Math.min(d + 1, 4)} class="plh">${esc(tx(n.t))}</h${Math.min(d + 1, 4)}>`;
  if (n.b) h += `<div class="md">${md(tx(n.b))}</div>`;
  (n.c || []).forEach(c => { h += printLearn(c, d + 1); });
  return h;
}
function renderPrint(arg) {
  const [kind, id] = arg.split(':'); let title = '', body = '';
  if (kind === 'exam' || kind === 'imp') {
    const ex = examOf(kind === 'imp' ? 'imp' : 'main', +id); if (!ex) return;
    title = (kind === 'imp' ? t('impExam') : t('exam')) + ' ' + num(ex.n); body = `<div class="meta">${esc(examMeta(ex))}</div>` + printSets(examSteps(ex));
  } else if (kind === 'std') {
    title = stdLabel(id); body = printSets(groupBySet(stdIds(id), () => 0.5).sort((a, b) => 0));
  } else if (kind === 'learn') {
    const n = NODE[id]; if (!n) return; title = tx(n.t); body = printLearn(n, 0).replace(/^<h1[^>]*>.*?<\/h1>/, '');
  }
  document.title = title;
  el.innerHTML = `<article class="printdoc"><h1>${esc(title)}</h1>${body}<div class="pfoot">${esc(t('title'))}</div></article>`;
  document.body.dataset.printReady = '1';
}

/* ---------------- downloads (PDF files in a zip, made ahead of time) ---------------- */
let DL = null; // manifest of ready-made zip files: { exams: {en: {file, bytes}, fa: ...}, ... }
async function loadDl() { try { const r = await fetch('downloads/manifest.json', { cache: 'no-cache' }); if (r.ok) DL = await r.json(); } catch (e) {} }
function dlButton(tab) {
  const d = DL && DL[tab] && DL[tab][L]; if (!d) return '';
  return `<a class="act ghost sm dl" href="downloads/${esc(d.file)}" download data-dl="${tab}">⤓ ${esc(t('dlZip'))} <small>(${esc(num((d.bytes / 1048576).toFixed(1)))} ${esc(t('mb'))})</small></a>`;
}
function wireDl() {}

/* ================= LEARN: topic tree ================= */
const NODE = {}; const PARENT = {}; const STDNODE = {};
(function index(nodes, parent) { nodes.forEach(n => { NODE[n.id] = n; PARENT[n.id] = parent; if (n.std && !STDNODE[n.std]) STDNODE[n.std] = n.id; if (n.c) index(n.c, n.id); }); })(LEARN, null);
let openSet = new Set();
const loadOpen = () => { openSet = new Set(Array.isArray(UI().tree) ? UI().tree : []); };
const saveOpen = () => uiSet('tree', [...openSet]);
let learnQuery = '';

function nodeStd(id) { let x = id; while (x) { if (NODE[x].std) return NODE[x].std; x = PARENT[x]; } return null; }
function renderTree() {
  loadOpen(); learnQuery = UI().treeQ || '';
  const q = learnQuery.trim().toLowerCase();
  let match = null;
  if (q) { match = new Set(); Object.values(NODE).forEach(n => { if ((tx(n.t) + ' ' + n.t.en).toLowerCase().includes(q)) { let x = n.id; while (x) { match.add(x); x = PARENT[x]; } } }); }
  const cur = UI().treeCur || '';
  const path = new Set(); { let x = PARENT[cur]; while (x) { path.add(x); x = PARENT[x]; } }
  const CHEV = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const row = (n, d) => {
    if (match && !match.has(n.id)) return '';
    const kids = n.c || []; const open = match ? true : openSet.has(n.id);
    const cls = 'tn lv' + Math.min(d, 4) + (n.id === cur ? ' cur' : '') + (path.has(n.id) ? ' path' : '') + (kids.length ? ' br' : ' lf') + (open ? ' open' : '');
    let h = `<li class="${cls}" style="--d:${d}"><div class="trow">`;
    if (kids.length) h += `<button class="tog" data-tog="${n.id}" aria-expanded="${open}"${n.id === cur ? ' aria-current="true"' : ''}><span class="chev">${CHEV}</span><span class="tt">${esc(tx(n.t))}</span><span class="cnt">${esc(num(kids.length))}</span></button>`;
    else h += `<button class="tog leaf" data-open="${n.id}"${n.id === cur ? ' aria-current="true"' : ''}><span class="dot"></span><span class="tt">${esc(tx(n.t))}</span></button>`;
    h += `<button class="lesbtn" data-open="${n.id}" aria-label="${esc(t('lesson'))}: ${esc(tx(n.t))}">${esc(t('lesson'))}</button></div>`;
    if (kids.length && open) h += `<ul>${kids.map(k => row(k, d + 1)).join('')}</ul>`;
    return h + '</li>';
  };
  let h = `<div class="card"><h2>${esc(t('learnTitle'))}</h2><div class="tip">${esc(t('learnTip'))}</div>
    <div class="bar"><input type="search" id="lq" class="inp" placeholder="${esc(t('searchLearn'))}" value="${esc(learnQuery)}" dir="auto">
    <button class="flag" data-a="openall">${esc(t('openAll'))}</button><button class="flag" data-a="closeall">${esc(t('closeAll'))}</button></div></div>
    <div class="card tree"><ul class="troot">${LEARN.map(n => row(n, 0)).join('') || ''}</ul>${match && !match.size ? `<div class="empty">${esc(t('noMatch'))}</div>` : ''}</div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-tog]').forEach(b => b.onclick = () => { const id = b.dataset.tog; S.ui.treeCur = id; openSet.has(id) ? openSet.delete(id) : openSet.add(id); saveOpen(); renderTree(); });
  el.querySelectorAll('[data-open]').forEach(b => b.onclick = () => nav('#/learn/' + b.dataset.open));
  const lq = document.getElementById('lq');
  lq.oninput = () => { learnQuery = lq.value; uiSet('treeQ', learnQuery); const pos = lq.selectionStart; renderTree(); const n = document.getElementById('lq'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} };
  el.querySelector('[data-a="openall"]').onclick = () => { Object.values(NODE).forEach(n => { if (n.c) openSet.add(n.id); }); saveOpen(); renderTree(); };
  el.querySelector('[data-a="closeall"]').onclick = () => { openSet.clear(); saveOpen(); renderTree(); };
}
function siblings(id) { const p = PARENT[id]; return p ? NODE[p].c : LEARN; }
function renderLesson(id) {
  const n = NODE[id]; if (!n) { location.replace('#/learn'); return; }
  // keep the tree open down to this lesson, so "back" shows where you were
  loadOpen(); let x = PARENT[id]; while (x) { openSet.add(x); x = PARENT[x]; } S.ui.treeCur = id; saveOpen();
  const crumbs = []; x = id; while (x) { crumbs.unshift(NODE[x]); x = PARENT[x]; }
  const sib = siblings(id); const i = sib.indexOf(n);
  const std = nodeStd(id);
  let h = `<div class="card"><div class="bar" style="margin-top:0"><button class="act ghost" data-a="tree">${esc(t('backToTree'))}</button></div>
    <nav class="crumbs">${crumbs.map((c, k) => k < crumbs.length - 1 ? `<a href="#/learn/${c.id}">${esc(tx(c.t))}</a>` : `<span>${esc(tx(c.t))}</span>`).join('<span class="sep">' + (L === 'fa' ? '‹' : '›') + '</span>')}</nav>
    <h2 class="lesson-h">${esc(tx(n.t))}</h2>`;
  const body = n.b ? tx(n.b) : '';
  if (body) h += `<div class="md">${md(body)}</div>`;
  if (n.c) {
    h += `<h3>${esc(t('subtopics'))}</h3><div class="sublist">${n.c.map(ch => {
      const snip = ch.b ? firstLine(tx(ch.b)) : (ch.c ? ch.c.map(g => tx(g.t)).slice(0, 4).join(SEP()) : '');
      return `<a class="subitem" href="#/learn/${ch.id}"><b>${esc(tx(ch.t))}</b>${snip ? `<span>${esc(snip)}</span>` : ''}</a>`; }).join('')}</div>`;
  }
  if (std && STD[std]) h += `<div class="bar"><button class="act" data-a="practice">${esc(t('practiceStd', stdLabel(std)))}</button></div>`;
  h += `<div class="bar"><button class="act ghost" data-a="prevt" ${i <= 0 ? 'disabled' : ''}>${esc(t('prevTopic'))}</button><span class="spacer"></span>
    <button class="act ghost" data-a="nextt" ${i >= sib.length - 1 ? 'disabled' : ''}>${esc(t('nextTopic'))}</button></div></div>`;
  el.innerHTML = h;
  el.querySelectorAll('.crumbs a, .subitem').forEach(a => a.onclick = (e) => { e.preventDefault(); nav(a.getAttribute('href')); });
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'tree') nav('#/learn', true);
    if (a === 'practice') startSet('std', std);
    if (a === 'prevt' && i > 0) nav('#/learn/' + sib[i - 1].id);
    if (a === 'nextt' && i < sib.length - 1) nav('#/learn/' + sib[i + 1].id);
  });
}
function firstLine(s) { const l = s.split('\n').map(x => x.replace(/^[-*>|#\s]+/, '').replace(/\*\*/g, '').trim()).find(x => x && !/^[-|:\s]+$/.test(x)); return l ? (l.length > 140 ? l.slice(0, 137) + '...' : l) : ''; }

/* Markdown to HTML (safe: the text is escaped first; only our own notes are rendered) */
function inlineMd(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (m, a, u) => /^(https?:|#)/.test(u) ? `<a href="${u}" target="_blank" rel="noopener noreferrer">${a}</a>` : a);
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (m, p, u) => `${p}<a href="${u}" target="_blank" rel="noopener noreferrer">${u.length > 60 ? u.slice(0, 57) + '...' : u}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
  return s;
}
function md(src) {
  const lines = src.replace(/\r/g, '').split('\n'); let out = ''; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (/^\s*\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim());
      const body = rows.filter(r => !/^\s*\|[\s:|-]+\|\s*$/.test(r));
      const hd = rows.length > 1 && /^\s*\|[\s:|-]+\|\s*$/.test(rows[1]);
      const heads = hd ? cells(body[0]).map(c => inlineMd(c).replace(/<[^>]+>/g, '')) : [];
      out += `<div class="tablewrap"><table class="${hd ? 'stack' : ''}">`;
      body.forEach((r, k) => { const tag = hd && k === 0 ? 'th' : 'td'; out += '<tr>' + cells(r).map((c, j) => `<${tag}${tag === 'td' && heads[j] ? ` data-label="${heads[j]}"` : ''}>${inlineMd(c)}</${tag}>`).join('') + '</tr>'; });
      out += '</table></div>'; continue;
    }
    if (/^\s*>/.test(l)) { const q = []; while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; } out += `<blockquote>${md(q.join('\n'))}</blockquote>`; continue; }
    const hm = l.match(/^(#{1,6})\s+(.*)$/); if (hm) { out += `<h4>${inlineMd(hm[2])}</h4>`; i++; continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(l)) { out += '<hr>'; i++; continue; }
    if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
      const items = []; while (i < lines.length && (/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) { items.push(lines[i]); i++; }
      out += listHtml(items); continue;
    }
    const p = []; while (i < lines.length && lines[i].trim() && !/^\s*(\||>|#|([-*+]|\d+[.)])\s)/.test(lines[i])) { p.push(lines[i].trim()); i++; }
    if (p.length) out += `<p>${inlineMd(p.join(' '))}</p>`; else i++;
  }
  return out;
}
function listHtml(items) {
  const ind = (s) => s.match(/^\s*/)[0].length;
  const base = ind(items[0]); const ordered = /^\s*\d+[.)]\s/.test(items[0]);
  let out = ordered ? '<ol>' : '<ul>'; let k = 0;
  while (k < items.length) {
    const it = items[k]; const text = it.replace(/^\s*([-*+]|\d+[.)])\s+/, ''); k++;
    const sub = []; while (k < items.length && ind(items[k]) > base) { sub.push(items[k]); k++; }
    out += `<li>${inlineMd(text)}${sub.length ? (/^\s*([-*+]|\d+[.)])\s/.test(sub[0]) ? listHtml(sub) : '<p>' + inlineMd(sub.map(s => s.trim()).join(' ')) + '</p>') : ''}</li>`;
  }
  return out + (ordered ? '</ol>' : '</ul>');
}

/* ================= RESULTS REPORT (analysis) ================= */
function qType(q) {
  const s = q.q.en.toLowerCase(); const o = q.o.map(x => x.en);
  if (s.includes('least likely')) return 'least';
  if (o.some(x => /statement\s*\d|:\s*(yes|no)\b.*[;,]/i.test(x))) return 'grid';
  if (/most appropriate|best course|best describes|should|most consistent|which (policy|procedure|action)|required to|best action|most likely/.test(s)) return 'action';
  if (/violat|consistent with|comply|complies|conform/.test(s)) return 'viol';
  return 'other';
}
function qVerdict(q) { // 'none' when the correct answer is "no violation / compliant", 'viol' when it is a violation; null otherwise
  const s = q.q.en.toLowerCase(); const a = q.o[q.a].en.trim().toLowerCase();
  if (/violat/.test(s)) return /^no\b/.test(a) ? 'none' : (/^yes\b/.test(a) ? 'viol' : null);
  if (/consistent|comply|complies|conform/.test(s)) return /^yes\b/.test(a) ? 'none' : (/^no\b/.test(a) ? 'viol' : null);
  return null;
}
const QTYPE = {}; const QVERD = {}; B.qs.forEach(q => { QTYPE[q.id] = qType(q); QVERD[q.id] = qVerdict(q); });
function answeredPairs(runs) { const out = []; runs.forEach(r => { const a = r.ans || {}; (r.qids || Object.keys(a)).forEach(id => { const q = QMAP[id]; if (q) out.push([q, a[id], r]); }); }); return out; }
function accBy(runs, keyFn) { // [right, total]; an essay item counts as one, with partial credit for partial points
  const acc = {};
  answeredPairs(runs).forEach(([q, a]) => { const k = keyFn(q); if (k == null) return; acc[k] = acc[k] || [0, 0]; acc[k][1]++; if (a === q.a) acc[k][0]++; });
  runs.forEach(r => Object.keys(r.cr || {}).forEach(id => { const it = CRMAP[id]; if (!it) return; const k = keyFn(it); if (k == null) return;
    acc[k] = acc[k] || [0, 0]; acc[k][1]++; acc[k][0] += Math.min(1, (r.cr[id].p || []).reduce((x, y) => x + y, 0) / itemMax(it)); }));
  Object.values(acc).forEach(v => { v[0] = Math.round(v[0] * 10) / 10; });
  return acc;
}
function band(p) { return p >= 70 ? ['good', '✓', t('good')] : p >= 50 ? ['mid', '!', t('warn')] : ['bad', '✕', t('bad')]; }
function hbars(acc, labelFn, sortWeak, links) {
  let keys = Object.keys(acc);
  if (sortWeak) keys.sort((a, b) => acc[a][0] / acc[a][1] - acc[b][0] / acc[b][1] || acc[b][1] - acc[a][1]);
  if (!keys.length) return `<div class="empty">${esc(t('noAttempts'))}</div>`;
  const rows = keys.map(k => { const [c, n] = acc[k]; const p = Math.round(c / n * 100); const [b, ic, word] = band(p);
    return `<div class="barrow" title="${esc(labelFn(k))}: ${esc(pct(p))} (${esc(num(c))}/${esc(num(n))})"><span class="lbl">${esc(labelFn(k))}</span>
      <span class="track" role="img" aria-label="${esc(pct(p))}"><i class="b-${b}" style="width:${Math.max(p, 2)}%"></i><em class="t70"></em></span>
      <span class="val"><span class="st st-${b}">${ic} ${esc(word)}</span> ${esc(pct(p))} <small>(${esc(num(c))}/${esc(num(n))})</small></span>
      ${links ? links(k) : ''}</div>`; }).join('');
  const table = `<details class="tbl"><summary>${esc(t('rpTable'))}</summary><div class="tablewrap"><table><tr><th>${esc(t('std'))}</th><th>%</th><th>${esc(t('graded'))}</th></tr>${keys.map(k => { const [c, n] = acc[k];
    return `<tr><td>${esc(labelFn(k))}</td><td>${esc(pct(Math.round(c / n * 100)))}</td><td>${esc(num(c))}/${esc(num(n))}</td></tr>`; }).join('')}</table></div></details>`;
  return `<div class="bars">${rows}</div>${table}`;
}
let CHW = 680;
function lineChart(runs) {
  CHW = Math.max(300, Math.min(900, (el.clientWidth || 680) - 40));
  const W = CHW, H = CHW < 500 ? 220 : 250, Lp = 44, R = 14, Tp = 14, Bp = 30, w = W - Lp - R, h = H - Tp - Bp, n = runs.length;
  const px = (i) => Lp + (n > 1 ? i * w / (n - 1) : w / 2), py = (s) => Tp + h - s / 100 * h;
  let g = '';
  [0, 25, 50, 70, 100].forEach(v => { g += `<line x1="${Lp}" x2="${Lp + w}" y1="${py(v)}" y2="${py(v)}" class="${v === 70 ? 'ch-target' : 'ch-grid'}"/><text x="${Lp - 6}" y="${py(v) + 4}" class="ch-ax" text-anchor="end">${esc(pct(v))}</text>`; });
  g += `<text x="${Lp + w}" y="${py(70) - 6}" class="ch-ax" text-anchor="end">${esc(t('rpTarget'))}</text>`;
  const path = runs.map((r, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(r.score).toFixed(1)}`).join(' ');
  g += `<path d="${path}" class="ch-line"/>`;
  runs.forEach((r, i) => { g += `<circle cx="${px(i)}" cy="${py(r.score)}" r="4.5" class="ch-dot"/>`; });
  const ticks = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1].filter((v, k, a) => a.indexOf(v) === k);
  ticks.forEach(i => { g += `<text x="${px(i)}" y="${H - 8}" class="ch-ax" text-anchor="middle">${esc(num(i + 1))}</text>`; });
  return `<div class="chartbox" id="lc"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('rpTrend'))}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;direction:ltr">${g}
    <line id="lcx" class="ch-cross" x1="0" x2="0" y1="${Tp}" y2="${Tp + h}" style="display:none"/><rect x="${Lp}" y="${Tp}" width="${w}" height="${h}" fill="transparent" id="lchit"/></svg>
    <div class="tipbox" id="lctip" hidden></div></div>`;
}
function wireLineChart(runs) {
  const box = document.getElementById('lc'); if (!box) return;
  const svg = box.querySelector('svg'), hit = document.getElementById('lchit'), cross = document.getElementById('lcx'), tip = document.getElementById('lctip');
  const W = CHW, Lp = 44, R = 14, w = W - Lp - R, n = runs.length;
  const show = (ev) => {
    const rect = svg.getBoundingClientRect(); const x = (ev.clientX - rect.left) / rect.width * W;
    const i = n > 1 ? Math.max(0, Math.min(n - 1, Math.round((x - Lp) / w * (n - 1)))) : 0;
    const cx = Lp + (n > 1 ? i * w / (n - 1) : w / 2); const r = runs[i];
    cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.style.display = '';
    const d = new Date(r.date);
    tip.innerHTML = `<b>${esc(runLabel(r))}</b><br>${esc(pct(r.score))} (${esc(num(runPts(r)))}/${esc(num(runMax(r)))} ${esc(t('ptsWord'))})<br>${esc(d.toLocaleDateString(L === 'fa' ? 'fa-IR' : 'en-US'))}`;
    tip.hidden = false; const left = cx / W * rect.width; tip.style.left = Math.min(rect.width - 150, Math.max(0, left - 70)) + 'px';
  };
  hit.addEventListener('pointermove', show); hit.addEventListener('pointerdown', show);
  hit.addEventListener('pointerleave', () => { tip.hidden = true; cross.style.display = 'none'; });
}
function renderReport() {
  const runs = S.runs.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  let h = `<div class="card"><h2>${esc(t('rpTitle'))}</h2>`;
  if (!runs.length) { el.innerHTML = h + `<div class="empty">${esc(t('rpEmpty'))}</div></div>` + (MODE !== 'server' ? backupCard() : ''); wireBackup(); return; }
  const pairs = answeredPairs(runs);
  const nCr = runs.reduce((s, r) => s + Object.keys(r.cr || {}).filter(id => CRMAP[id] && (r.cr[id].v || []).some(v => !blankVal(v))).length, 0);
  const answered = pairs.filter(([q, a]) => a !== undefined).concat(new Array(nCr).fill(0));
  const sumMax = runs.reduce((s, r) => s + runMax(r), 0);
  const overall = sumMax ? Math.round(runs.reduce((s, r) => s + runPts(r), 0) / sumMax * 100) : 0;
  const best = Math.max(...runs.map(r => r.score));
  const last5 = runs.slice(-5); const avg5 = Math.round(last5.reduce((s, r) => s + r.score, 0) / last5.length);
  const totMin = runs.reduce((s, r) => s + (r.mins || 0), 0); const secQ = answered.length ? Math.round(totMin * 60 / answered.length) : 0;
  const mmss = (s) => num(Math.floor(s / 60)) + ':' + num(String(s % 60).padStart(2, '0'));
  h += `<div class="tiles">
    <div class="kpi"><span>${esc(t('rpOverall'))}</span><b class="${cls(overall)}">${esc(pct(overall))}</b></div>
    <div class="kpi"><span>${esc(t('rpLast5'))}</span><b class="${cls(avg5)}">${esc(pct(avg5))}</b></div>
    <div class="kpi"><span>${esc(t('rpBest'))}</span><b>${esc(pct(best))}</b></div>
    <div class="kpi"><span>${esc(t('rpExams'))}</span><b>${esc(num(runs.length))}</b></div>
    <div class="kpi"><span>${esc(t('rpQuestions'))}</span><b>${esc(num(answered.length))}</b></div>
    <div class="kpi"><span>${esc(t('rpTime'))}</span><b>${mmss(secQ)}</b></div></div></div>`;
  h += `<div class="card"><h2>${esc(t('rpTrend'))}</h2>${lineChart(runs)}<div class="tip">${esc(t('rpTrendNote'))}</div></div>`;
  const accStd = accBy(runs, q => (q.std || ['CODE'])[0]);
  const enough = Object.keys(accStd).filter(k => accStd[k][1] >= 3);
  const rate = (k) => accStd[k][0] / accStd[k][1];
  const weak = enough.slice().sort((a, b) => rate(a) - rate(b)).filter(k => rate(k) < 0.7).slice(0, 3);
  const strong = enough.slice().sort((a, b) => rate(b) - rate(a)).filter(k => rate(k) >= 0.7).slice(0, 3);
  const swItem = (k) => { const p = Math.round(rate(k) * 100); const [b, ic] = band(p);
    return `<li><span class="st st-${b}">${ic}</span> <b>${esc(stdLabel(k))}</b> ${esc(pct(p))} <small>(${esc(t('rpN', num(accStd[k][1])))})</small>
      <span class="lnk">${STDNODE[k] ? `<a href="#/learn/${STDNODE[k]}" data-nav>${esc(t('rpLearn'))}</a>` : ''} <button class="linkbtn" data-prac="${esc(k)}">${esc(t('rpPractice'))}</button></span></li>`; };
  h += `<div class="card two"><div><h2>${esc(t('rpStrong'))}</h2>${strong.length ? `<ul class="sw">${strong.map(swItem).join('')}</ul>` : `<div class="tip">${esc(t('rpNeedMore'))}</div>`}</div>
    <div><h2>${esc(t('rpWeak'))}</h2>${weak.length ? `<ul class="sw">${weak.map(swItem).join('')}</ul>` : `<div class="tip">${esc(t('rpNeedMore'))}</div>`}</div></div>`;
  const plan = [];
  if (overall < 50) plan.push(t('rpPlanLow')); else if (overall >= 70) plan.push(t('rpPlanGood'));
  weak.forEach(k => plan.push(t('rpPlanWeak', stdLabel(k))));
  const vAcc = accBy(runs, q => QVERD[q.id]);
  const pn = vAcc.none ? vAcc.none[0] / vAcc.none[1] : null, pv = vAcc.viol ? vAcc.viol[0] / vAcc.viol[1] : null;
  let verdictMsg = '';
  if (pn != null && pv != null && vAcc.none[1] >= 3 && vAcc.viol[1] >= 3) {
    verdictMsg = pn < pv - 0.15 ? t('rpOvercall') : pv < pn - 0.15 ? t('rpUndercall') : t('rpBalanced');
    if (pn < pv - 0.15 || pv < pn - 0.15) plan.push(verdictMsg);
  }
  if (secQ > 160) plan.push(t('rpPlanTime'));
  if (plan.length) h += `<div class="card"><h2>${esc(t('rpPlan'))}</h2><ul class="plan">${plan.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>`;
  h += `<div class="card"><h2>${esc(t('rpByStd'))}</h2>${hbars(accStd, k => stdLabel(k), true, k => STDNODE[k] ? `<a class="minilink" href="#/learn/${STDNODE[k]}" data-nav>${esc(t('rpLearn'))}</a>` : '')}</div>`;
  const accG = accBy(runs, q => groupOf((q.std || ['CODE'])[0]));
  h += `<div class="card"><h2>${esc(t('rpByGroup'))}</h2>${hbars(accG, g => groupLabel(g), true)}</div>`;
  const tl = { viol: t('typeViol'), grid: t('typeGrid'), least: t('typeLeast'), action: t('typeAction'), other: t('typeOther') };
  h += `<div class="card"><h2>${esc(t('rpByType'))}</h2>${hbars(accBy(runs, q => QTYPE[q.id]), k => tl[k], true)}</div>`;
  const vl = { none: t('rpNoViol'), viol: t('rpViol') };
  h += `<div class="card"><h2>${esc(t('rpVerdict'))}</h2>${hbars(vAcc, k => vl[k], false)}${verdictMsg ? `<div class="tip">${esc(verdictMsg)}</div>` : ''}</div>`;
  if (runs.length >= 6) {
    const early = accBy(runs.slice(0, -5), q => (q.std || ['CODE'])[0]), late = accBy(runs.slice(-5), q => (q.std || ['CODE'])[0]);
    const ks = STD_ORDER.filter(k => early[k] && late[k] && early[k][1] >= 2 && late[k][1] >= 2);
    if (ks.length) h += `<div class="card"><h2>${esc(t('rpRecent'))}</h2><div class="tablewrap"><table><tr><th>${esc(t('std'))}</th><th>${esc(t('rpEarlier'))}</th><th>${esc(t('rpLater'))}</th><th>${esc(t('rpChange'))}</th></tr>${ks.map(k => {
      const a = Math.round(early[k][0] / early[k][1] * 100), b = Math.round(late[k][0] / late[k][1] * 100), d = b - a;
      return `<tr><td>${esc(stdLabel(k))}</td><td>${esc(pct(a))}</td><td>${esc(pct(b))}</td><td class="${d > 0 ? 'good' : d < 0 ? 'bad' : ''}">${d > 0 ? '▲ ' : d < 0 ? '▼ ' : ''}${esc(num(Math.abs(d)))}</td></tr>`; }).join('')}</table></div></div>`;
  }
  h += `<div class="card"><h2>${esc(t('history'))}</h2><div class="tablewrap"><table><tr><th>${esc(t('date'))}</th><th>${esc(t('name'))}</th><th>${esc(t('score'))}</th><th>${esc(t('ptsWord'))}</th><th>${esc(t('time'))}</th><th></th></tr>`;
  runs.slice().reverse().forEach(r => {
    const d = new Date(r.date);
    h += `<tr><td>${esc(d.toLocaleDateString(L === 'fa' ? 'fa-IR' : 'en-US'))} ${esc(d.toLocaleTimeString(L === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' }))}</td>
      <td>${esc(runLabel(r))}</td><td class="${cls(r.score)}">${esc(pct(r.score))}</td><td>${esc(num(runPts(r)))}/${esc(num(runMax(r)))}</td>
      <td>${esc(t('mins', num(r.mins)))}</td><td><button class="flag" data-run="${esc(r.id)}">${esc(t('view'))}</button></td></tr>`;
  });
  h += `</table></div><div class="bar"><button class="flag" data-a="clearh">${esc(t('clearHist'))}</button></div></div>`;
  if (MODE !== 'server') h += backupCard();
  el.innerHTML = h;
  wireLineChart(runs);
  el.querySelectorAll('[data-nav]').forEach(a => a.onclick = (e) => { e.preventDefault(); nav(a.getAttribute('href')); });
  el.querySelectorAll('[data-prac]').forEach(b => b.onclick = () => startSet('std', b.dataset.prac));
  el.querySelectorAll('[data-run]').forEach(b => b.onclick = () => { const c = Object.assign({}, UI().rctx || {}); c[b.dataset.run] = 'report'; uiSet('rctx', c); nav('#/result/' + b.dataset.run); });
  el.querySelector('[data-a="clearh"]').onclick = async () => { if (await askConfirm(t('confirmClear'), t('clearHist'), true)) { S.runs = []; save(); clearRuns(); render(); } };
  wireBackup();
}

/* ---------------- backup (export / import) ---------------- */
function backupCard() {
  return `<div class="card"><h2>${esc(t('backup'))}</h2><div class="tip">${esc(MODE === 'server' ? t('serverMode', userName()) : t('localMode'))}</div>
    <div class="bar"><button class="act ghost" data-b="export">${esc(t('exportBtn'))}</button>
    <label class="act ghost filelbl">${esc(t('importBtn'))}<input type="file" accept="application/json,.json" data-b="import" hidden></label></div></div>`;
}
function wireBackup() {
  const ex = el.querySelector('[data-b="export"]');
  if (ex) ex.onclick = () => {
    const blob = new Blob([JSON.stringify({ app: 'cfa-ethics', exported: new Date().toISOString(), state: S }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cfa-ethics-backup.json'; document.body.appendChild(a); a.click(); a.remove();
  };
  const im = el.querySelector('[data-b="import"]');
  if (im) im.onchange = () => {
    const f = im.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { try { const j = JSON.parse(rd.result); if (!j || j.app !== 'cfa-ethics') throw 0; mergeIn(j.state).then(() => { toast(t('importOk')); render(); }); } catch (e) { toast(t('importBad')); } };
    rd.readAsText(f);
  };
}

/* ---------------- sign-in ---------------- */
const IN_APP = /(FBAN|FBAV|Instagram|Telegram|WhatsApp|Line\/|; wv\)|MicroMessenger|Snapchat|musical_ly|TikTok)/i.test(navigator.userAgent);
function loadGsi() {
  return new Promise((ok, no) => {
    if (window.google && window.google.accounts) return ok();
    const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
    const tm = setTimeout(() => no(new Error('timeout')), 8000);
    sc.onload = () => { clearTimeout(tm); ok(); }; sc.onerror = () => { clearTimeout(tm); no(new Error('gsi')); }; document.head.appendChild(sc);
  });
}
async function afterLogin() {
  await loadServer(); applyTheme();
  if (openedBare && S.ui.last) history.replaceState(null, '', S.ui.last);
  rememberRoute(); render(); restoreScroll();
}
function loginErr(e) {
  if (e.message === 'not_member') return t('notMember');
  if (e.message === 'bad_login') return t('badLogin');
  if (e.message === 'too_many_tries' || e.status === 429) return t('tooMany');
  return t('signFail');
}
function renderLogin() {
  el.innerHTML = `<div class="card login"><h2>${esc(t('loginTitle'))}</h2><div class="tip">${esc(t('loginTip'))}</div>
    ${IN_APP ? `<div class="warnbox">${esc(t('inApp'))}<div class="bar"><button class="act ghost" id="cpl">${esc(t('copyLink'))}</button></div></div>` : ''}
    <div id="gbtn" class="gbtn"></div><div class="err" id="gerr" role="alert"></div>
    <h3>${esc(t('orPassword'))}</h3>
    <form class="form" id="pf" autocomplete="on" novalidate>
      <label>${esc(t('email'))}<input name="email" type="email" inputmode="email" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" required dir="ltr"></label>
      <label>${esc(t('password'))}<input name="password" type="password" autocomplete="current-password" required dir="ltr"></label>
      <div class="err" id="perr" role="alert"></div>
      <button class="act" type="submit">${esc(t('signIn'))}</button>
    </form><div class="tip small">${esc(t('homeScreenNote'))}</div></div>`;
  const cpl = document.getElementById('cpl'); if (cpl) cpl.onclick = () => copyText(location.href);
  const pf = document.getElementById('pf');
  pf.querySelectorAll('input').forEach(inp => inp.addEventListener('focus', () => setTimeout(() => inp.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)));
  pf.onsubmit = async (e) => {
    e.preventDefault(); const perr = document.getElementById('perr'); perr.textContent = '';
    try { await api('auth/password', 'POST', { email: toAscii(pf.email.value).trim().toLowerCase(), password: toAscii(pf.password.value) }); await afterLogin(); }
    catch (er) { perr.textContent = loginErr(er); }
  };
  if (IN_APP || !GCID) { document.getElementById('gerr').textContent = IN_APP ? '' : t('googleUnavailable'); return; }
  loadGsi().then(() => {
    google.accounts.id.initialize({ client_id: GCID, callback: async ({ credential }) => {
      const g = document.getElementById('gerr'); if (g) g.textContent = '';
      try { await api('auth/google', 'POST', { credential }); await afterLogin(); }
      catch (er) { const m = document.getElementById('gerr'); if (m) m.textContent = loginErr(er); }
    } });
    google.accounts.id.renderButton(document.getElementById('gbtn'), { theme: 'filled_blue', size: 'large', shape: 'pill', locale: L, text: 'signin_with' });
  }).catch(() => { const m = document.getElementById('gerr'); if (m) m.textContent = t('googleUnavailable'); });
}
function copyText(s) {
  const done = () => toast(t('copied'));
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(done, fallback);
  else fallback();
}

/* ---------------- account ---------------- */
async function renderAccount() {
  const local = loadLocal();
  el.innerHTML = `<div class="card"><h2>${esc(t('account'))}</h2>
    <div class="tip"><bdi>${esc(userName())}</bdi> <bdi dir="ltr">${esc(ME.email)}</bdi></div>
    <div class="bar">${local.runs.length || local.fav.length || local.hard.length ? `<button class="act ghost" data-a="imp">${esc(t('importLocal'))}</button>` : ''}
    ${ME.admin ? `<a class="act ghost" href="/admin">${esc(t('adminLink'))}</a>` : ''}
    <button class="act" data-a="out">${esc(t('logout'))}</button><button class="act ghost" data-a="outall">${esc(t('logoutAll'))}</button></div></div>
    <div class="card"><h2>${esc(ME.hasPassword ? t('changePw') : t('setPw'))}</h2>
      <form class="form" id="cpw" novalidate>
        ${ME.hasPassword ? `<label>${esc(t('curPw'))}<input name="cur" type="password" autocomplete="current-password" dir="ltr"></label>` : ''}
        <label>${esc(t('newPw'))}<input name="nw" type="password" autocomplete="new-password" minlength="8" dir="ltr"></label>
        <div class="err" id="cpwerr" role="alert"></div><button class="act" type="submit">${esc(t('changePw'))}</button></form></div>
    <div class="card"><h2>${esc(t('myReports'))}</h2><div id="myrep"><div class="empty">...</div></div></div>` + backupCard();
  wireBackup();
  const imp = el.querySelector('[data-a="imp"]');
  if (imp) imp.onclick = () => mergeIn(loadLocal()).then(() => { toast(t('imported')); render(); });
  const out = async (p) => { try { await api(p, 'POST', {}); } catch (e) {} flushPrefs(); try { localStorage.removeItem(cacheKey()); } catch (e) {} ME = null; S = blank(); location.replace('#/exams'); render(); };
  el.querySelector('[data-a="out"]').onclick = () => out('auth/logout');
  el.querySelector('[data-a="outall"]').onclick = () => out('auth/logout-all');
  const f = document.getElementById('cpw');
  f.onsubmit = async (e) => {
    e.preventDefault(); const er = document.getElementById('cpwerr'); er.textContent = '';
    const nw = toAscii(f.nw.value); if (nw.length < 8) { er.textContent = t('pwShort'); return; }
    try { await api('me/password', 'POST', { current: f.cur ? toAscii(f.cur.value) : '', password: nw }); ME.hasPassword = true; toast(t('pwSaved')); render(); }
    catch (x) { er.textContent = x.message === 'bad_current' ? t('pwBadCur') : x.status === 429 ? t('tooMany') : t('signFail'); }
  };
  try {
    const j = await api('reports/mine'); const box = document.getElementById('myrep'); if (!box) return;
    const st = { open: t('stOpen'), fixed: t('stFixed'), notbug: t('stNotbug') };
    box.innerHTML = j.reports.length ? j.reports.map(r => `<div class="result-q"><div><span class="pill st-${r.status === 'fixed' ? 'good' : r.status === 'open' ? 'mid' : 'bad'}">${esc(st[r.status] || r.status)}</span>
      <span class="meta">${esc(new Date(r.created_at).toLocaleString(L === 'fa' ? 'fa-IR' : 'en-US'))}</span></div>
      <div class="usertext" dir="auto"></div>${r.admin_note ? `<div class="ref"><b>${esc(t('adminNote'))}:</b> <span class="usertext" dir="auto"></span></div>` : ''}</div>`).join('') : `<div class="empty">${esc(t('noReports'))}</div>`;
    const items = box.querySelectorAll('.result-q');
    j.reports.forEach((r, i) => { const u = items[i].querySelectorAll('.usertext'); u[0].textContent = r.text; if (u[1]) u[1].textContent = r.admin_note; });
  } catch (e) {}
}

/* ---------------- bug reports ---------------- */
function ctxInfo(extra) {
  const r = route();
  const p = r.name === 'quiz' ? liveProg(r.arg) : null;
  return Object.assign({ page: r.name + (r.arg ? '/' + r.arg : ''), test: p ? labelOf(p) : '', qid: p ? p.qids[p.idx] : '',
    version: APP_VERSION, lang: L, ua: navigator.userAgent, screen: `${screen.width}x${screen.height} @${window.devicePixelRatio || 1} view ${window.innerWidth}x${window.innerHeight}`,
    online: navigator.onLine, localTime: new Date().toString(), errors: ERRS.slice(-20) }, extra || {});
}
async function sendReport(body, tries) {
  try { await api('reports', 'POST', body); return true; }
  catch (e) {
    if (e.status === 429) { if (body.kind !== 'auto') toast(t('bugLimit')); return false; }
    if (e.status === 400 || e.status === 401 || e.status === 413) { if (body.kind !== 'auto') toast(t('bugFail')); return false; }
    if ((tries || 0) < 3) { setTimeout(() => sendReport(body, (tries || 0) + 1), 5000 * Math.pow(3, tries || 0)); return null; }
    if (body.kind !== 'auto') toast(t('bugFail')); return false;
  }
}
function autoReport(e) {
  if (MODE !== 'server' || !ME) return;
  const key = String(e.msg).slice(0, 200); const sent = store.get('cfa-auto', {});
  if (sent[key] && Date.now() - sent[key] < 3600e3) return;
  sent[key] = Date.now(); store.set('cfa-auto', sent);
  sendReport(Object.assign(ctxInfo(), { kind: 'auto', text: (e.msg + (e.src ? ` (${e.src}:${e.line}:${e.col})` : '') + (e.stack ? '\n' + e.stack : '')).slice(0, 5000) }));
}
function shrinkImage(file) {
  return new Promise((ok, no) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      let q = 0.8, d = c.toDataURL('image/jpeg', q); while (d.length > 1.3e6 && q > 0.3) { q -= 0.15; d = c.toDataURL('image/jpeg', q); }
      ok(d);
    };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error('img')); }; img.src = url;
  });
}
function openReport(opts) {
  if (MODE !== 'server' || !ME) return;
  const rp = route().name === 'quiz' ? liveProg(route().arg) : null;
  const qid = opts.qid || (rp ? rp.qids[rp.idx] : '');
  const kind = opts.kind || 'bug';
  const ov = document.createElement('div'); ov.className = 'modal'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = `<div class="sheet"><h2>${esc(t('bugTitle'))}</h2>
    ${qid ? `<div class="pill">${esc(t('bugAbout', qid))}</div>` : ''}
    <form class="form" id="bf" novalidate>
      <label>${esc(t('bugType'))}<select name="kind"><option value="bug">${esc(t('bugBug'))}</option><option value="question">${esc(t('bugQuestion'))}</option><option value="idea">${esc(t('bugIdea'))}</option></select></label>
      <label>${esc(t('bugText'))}<textarea name="text" rows="5" maxlength="5000" dir="auto" required></textarea></label>
      <label>${esc(t('bugShot'))}<input name="shot" type="file" accept="image/*"></label>
      <div class="err" id="berr" role="alert"></div>
      <div class="bar"><button class="act" type="submit">${esc(t('bugSend'))}</button><button class="act ghost" type="button" data-x>${esc(t('bugCancel'))}</button></div>
    </form></div>`;
  document.body.appendChild(ov);
  const f = ov.querySelector('#bf'); f.kind.value = kind;
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  ov.querySelector('[data-x]').onclick = close;
  f.text.focus();
  f.onsubmit = async (e) => {
    e.preventDefault(); const text = f.text.value.trim(); const er = ov.querySelector('#berr');
    if (!text) { er.textContent = t('bugNeedText'); return; }
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    let shot = null; const file = f.shot.files[0];
    if (file && /^image\//.test(file.type)) { try { shot = await shrinkImage(file); } catch (x) { shot = null; } }
    const body = Object.assign(ctxInfo({ qid: qid || '' }), { kind: f.kind.value, text, shot });
    close();
    const ok = await sendReport(body);
    if (ok) toast(t('bugSent'));
  };
}

/* ---------------- boot ---------------- */
(async function boot() {
  applyTheme();
  const dl = loadDl();
  if (await detectServer()) { MODE = 'server'; await loadServer(); }
  else { MODE = 'local'; S = loadLocal(); }
  await Promise.race([dl, new Promise(r => setTimeout(r, 1500))]);
  // opened without an address (home screen, bookmark): go back to the last place you were
  if (!location.hash || location.hash === '#' || location.hash === '#/') { openedBare = true; history.replaceState(null, '', S.ui.last || '#/exams'); }
  if (MODE === 'local' || ME) rememberRoute();
  render();
  restoreScroll();
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (route().name === 'report') { const y = window.scrollY; render(); window.scrollTo(0, y); } }, 200); });
})();
})();
