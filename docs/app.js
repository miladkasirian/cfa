/* CFA Level III Ethics Practice
   Two modes:
   - local: results stored in this browser (GitHub Pages, or index.html opened directly)
   - server: cfa.ringmk.com; sign-in (Google or e-mail + password), results stored on the server per member
*/
(function () {
'use strict';
const APP_VERSION = '2026.10.21-3';

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
const STD = {
  'I(A)':  ['Knowledge of the Law', 'آگاهی از قانون'],
  'I(B)':  ['Independence and Objectivity', 'استقلال و بی‌طرفی'],
  'I(C)':  ['Misrepresentation', 'ارائه نادرست'],
  'I(D)':  ['Misconduct', 'رفتار نادرست'],
  'I(E)':  ['Competence', 'صلاحیت حرفه‌ای'],
  'II(A)': ['Material Nonpublic Information', 'اطلاعات مهم غیرعمومی'],
  'II(B)': ['Market Manipulation', 'دستکاری بازار'],
  'III(A)':['Loyalty, Prudence, and Care', 'وفاداری، احتیاط و مراقبت'],
  'III(B)':['Fair Dealing', 'رفتار منصفانه'],
  'III(C)':['Suitability', 'تناسب'],
  'III(D)':['Performance Presentation', 'ارائه عملکرد'],
  'III(E)':['Preservation of Confidentiality', 'حفظ محرمانگی'],
  'IV(A)': ['Loyalty (to employer)', 'وفاداری به کارفرما'],
  'IV(B)': ['Additional Compensation Arrangements', 'ترتیبات جبران خدمت اضافی'],
  'IV(C)': ['Responsibilities of Supervisors', 'مسئولیت‌های سرپرستان'],
  'V(A)':  ['Diligence and Reasonable Basis', 'سخت‌کوشی و مبنای معقول'],
  'V(B)':  ['Communication with Clients and Prospective Clients', 'ارتباط با مشتریان و مشتریان بالقوه'],
  'V(C)':  ['Record Retention', 'نگهداری سوابق'],
  'VI(A)': ['Avoid or Disclose Conflicts', 'اجتناب از تضاد منافع یا افشای آن'],
  'VI(B)': ['Priority of Transactions', 'اولویت معاملات'],
  'VI(C)': ['Referral Fees', 'کارمزد معرفی'],
  'VII(A)':['Conduct as Participants in CFA Institute Programs', 'رفتار به عنوان شرکت‌کننده در برنامه‌های مؤسسه سی اف ای'],
  'VII(B)':['Reference to CFA Institute, the CFA Designation, and the CFA Program', 'اشاره به مؤسسه سی اف ای، عنوان سی اف ای و برنامه سی اف ای'],
  'AMC':   ['Asset Manager Code of Professional Conduct', 'کد رفتار حرفه‌ای مدیران دارایی'],
  'CODE':  ['Code of Ethics (general principles)', 'کد اخلاق (اصول کلی)']
};
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
const LETTERS = { en: ['A', 'B', 'C'], fa: ['الف', 'ب', 'ج'] };
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

/* ---------------- state and storage ---------------- */
const blank = () => ({ v: 1, fav: [], hard: [], runs: [], cur: null });
let S = blank();
let MODE = 'local', ME = null, GCID = '';
let saveTimer = null;
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

function normalize(s) {
  const o = blank();
  if (s && typeof s === 'object') {
    o.fav = Array.isArray(s.fav) ? s.fav.filter(id => QMAP[id]) : [];
    o.hard = Array.isArray(s.hard) ? s.hard.filter(id => QMAP[id]) : [];
    o.runs = Array.isArray(s.runs) ? s.runs.filter(r => r && typeof r === 'object') : [];
    o.runs.forEach(r => { if (!r.id) r.id = rid(); });
    o.cur = s.cur && Array.isArray(s.cur.qids) ? s.cur : null;
  }
  return o;
}
const loadLocal = () => normalize(store.get(LS_KEY, null));
const saveLocal = (st) => store.set(LS_KEY, st);

async function api(path, method, body, opts) {
  const r = await fetch('/api/' + path, Object.assign({ method: method || 'GET', credentials: 'same-origin', cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }, opts || {}));
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && MODE === 'server' && path !== 'auth/password') { ME = null; render(); }
  if (!r.ok) { const e = new Error(j.error || String(r.status)); e.status = r.status; throw e; }
  return j;
}

function save() {
  if (S.cur) { S.cur.ts = Date.now(); store.set('cfa-cur', S.cur, true); } else store.set('cfa-cur', null, true);
  if (MODE === 'local') { saveLocal(S); return; }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushPrefs, 500);
}
function prefsBody() { return { fav: S.fav, hard: S.hard, cur: S.cur }; }
async function pushPrefs() {
  clearTimeout(saveTimer); saveTimer = null;
  try { await api('state', 'PUT', prefsBody()); }
  catch (e) { if (e.status !== 401) { toast(t('saveFail')); saveTimer = setTimeout(pushPrefs, 5000); } }
}
// leaving or hiding the page: flush the pending save so a refresh comes back to the same place
function flushPrefs() {
  if (MODE !== 'server' || !ME || !saveTimer) return;
  clearTimeout(saveTimer); saveTimer = null;
  try { fetch('/api/state', { method: 'PUT', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prefsBody()) }); } catch (e) {}
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
      const local = store.get('cfa-cur', null, true); // newer exam-in-progress from this tab (saved just before a refresh)
      if (local && Array.isArray(local.qids) && (!S.cur || (local.ts || 0) > (S.cur.ts || 0))) S.cur = local;
    }
  } catch (e) { ME = null; }
}
const userName = () => ME ? (ME.name || ME.email) : '';

/* ---------------- exams ---------------- */
function examQids(n) {
  const ex = B.exams.find(e => e.n === n); if (!ex) return [];
  return ex.sets.flatMap(sid => B.qs.filter(q => q.set === sid).sort((a, b) => a.k - b.k).map(q => q.id));
}
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function groupBySet(ids, r) { // keep questions of the same case together, shuffle the order of cases
  const groups = {}; const order = [];
  ids.forEach(id => { const s = QMAP[id].set; if (!groups[s]) { groups[s] = []; order.push(s); } groups[s].push(id); });
  return shuffle(order, r).flatMap(s => groups[s].sort((a, b) => QMAP[a].k - QMAP[b].k));
}
function lastOutcome() {
  const m = {};
  S.runs.forEach(r => { const a = r.ans || {}; Object.keys(a).forEach(id => { if (QMAP[id]) m[id] = a[id] === QMAP[id].a; }); });
  return m;
}
const missedIds = () => { const m = lastOutcome(); return Object.keys(m).filter(id => m[id] === false); };
const cls = (p) => p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad';

function labelOf(c) {
  if (c.kind === 'exam') return t('exam') + ' ' + num(c.arg);
  if (c.kind === 'fav') return t('fav');
  if (c.kind === 'hard') return t('hard');
  if (c.kind === 'missed') return t('missed');
  if (c.kind === 'std') return stdLabel(c.arg);
  return '';
}
const runLabel = (r) => labelOf({ kind: r.kind || 'exam', arg: r.kind ? r.arg : r.exam });

/* ---------------- router (hash) and scroll restore ---------------- */
const el = document.getElementById('app');
let navByApp = false, restoring = true;
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [a, ...rest] = h.split('/');
  return { name: a || 'exams', arg: rest.join('/') };
}
function nav(hash) {
  navByApp = true;
  if (location.hash === hash) { render(); window.scrollTo(0, 0); navByApp = false; return; }
  location.hash = hash;
}
function scrollKey() { const r = route(); return r.name === 'quiz' && S.cur ? 'quiz:' + S.cur.idx : r.name + '/' + r.arg; }
let scrollT = null;
window.addEventListener('scroll', () => {
  if (restoring) return;
  clearTimeout(scrollT);
  scrollT = setTimeout(() => { const m = store.get('cfa-scroll', {}, true); m[scrollKey()] = Math.round(window.scrollY); store.set('cfa-scroll', m, true); }, 150);
}, { passive: true });
function restoreScroll() {
  const y = (store.get('cfa-scroll', {}, true))[scrollKey()] || 0;
  restoring = true;
  const go = (n) => { window.scrollTo(0, y); if (n > 0 && Math.abs(window.scrollY - y) > 2 && document.body.scrollHeight > y) setTimeout(() => go(n - 1), 60); else restoring = false; };
  requestAnimationFrame(() => go(10));
  setTimeout(() => { restoring = false; }, 1200);
}
window.addEventListener('hashchange', () => {
  const byApp = navByApp; navByApp = false;
  render();
  if (byApp) { window.scrollTo(0, 0); } else restoreScroll();
});
function setScrollTop() { const m = store.get('cfa-scroll', {}, true); m[scrollKey()] = 0; store.set('cfa-scroll', m, true); window.scrollTo(0, 0); }

/* ---------------- shell: header, tabs, language, theme ---------------- */
function toast(msg) {
  const d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = msg; document.body.appendChild(d);
  setTimeout(() => d.remove(), 3200);
}
function applyLang() {
  document.documentElement.lang = L; document.documentElement.dir = L === 'fa' ? 'rtl' : 'ltr';
  document.title = t('title');
  document.getElementById('t-title').textContent = t('title');
  document.getElementById('t-sub').textContent = t('sub', num(B.qs.length), num(B.exams.length));
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === L));
  const bug = document.getElementById('bugBtn');
  bug.hidden = !(MODE === 'server' && ME); bug.title = t('bugTitle'); bug.setAttribute('aria-label', t('bugTitle'));
  const r = route().name;
  const tabs = [['exams', t('tabHome')], ['learn', t('tabLearn')], ['review', t('tabReview')], ['report', t('tabReport')]];
  if (MODE === 'server' && ME) tabs.push(['account', t('tabAccount')]);
  const on = r === 'quiz' || r === 'result' ? (r === 'result' ? 'report' : 'exams') : r;
  document.getElementById('tabs').innerHTML = (MODE === 'server' && !ME) ? '' : tabs.map(([v, n]) => `<button type="button" data-v="${v}" class="${on === v ? 'on' : ''}">${esc(n)}</button>`).join('');
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => nav('#/' + b.dataset.v));
  document.getElementById('foot').textContent = (L === 'fa' ? 'نسخه ' : 'Version ') + num(APP_VERSION);
}
function applyTheme() { if (PREF.theme) document.documentElement.dataset.theme = PREF.theme; else delete document.documentElement.dataset.theme; }
document.querySelectorAll('.lang button').forEach(b => b.onclick = () => {
  L = b.dataset.lang; PREF.lang = L; savePref(); render();
  if (MODE === 'server' && ME) api('me/lang', 'PUT', { lang: L }).catch(() => {});
});
document.getElementById('themeBtn').onclick = () => {
  const dark = PREF.theme ? PREF.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  PREF.theme = dark ? 'light' : 'dark'; savePref(); applyTheme(); if (route().name === 'report') render();
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
  if (r.name === 'quiz') { if (S.cur) return renderQuiz(); location.replace('#/exams'); return; }
  if (r.name === 'result') return renderResult(S.runs.find(x => x.id === r.arg));
  if (r.name === 'learn') return r.arg ? renderLesson(r.arg) : renderTree();
  if (r.name === 'review') return renderReview();
  if (r.name === 'report') return renderReport();
  if (r.name === 'account') return MODE === 'server' ? renderAccount() : renderReport();
  return renderHome();
}

/* ---------------- exams home ---------------- */
function renderHome() {
  const done = {}; S.runs.forEach(r => { if (typeof r.exam === 'number' && (r.kind || 'exam') === 'exam') (done[r.exam] = done[r.exam] || []).push(r.score); });
  let h = '';
  if (S.cur) {
    const c = S.cur;
    h += `<div class="card"><h2>${esc(t('resume'))}</h2><div class="meta">${esc(labelOf(c))}${SEP()}${esc(t('answered', num(Object.keys(c.ans).length)))} / ${esc(num(c.qids.length))}</div>
      <div class="bar"><button class="act" data-a="resume">${esc(t('resumeBtn'))}</button><button class="flag" data-a="discard">${esc(t('discard'))}</button></div></div>`;
  }
  h += `<div class="card"><h2>${esc(t('exams'))}</h2><div class="meta" style="margin-bottom:.7rem">${esc(t('examsMeta', num(B.exams.length)))}</div><div class="grid">`;
  B.exams.forEach(ex => {
    const sc = done[ex.n]; const best = sc ? Math.max(...sc) : null;
    h += `<button class="tile" data-a="exam" data-n="${ex.n}"><b>${esc(t('exam'))} ${esc(num(ex.n))}</b>
      <span>${esc(t('sets', num(ex.sets.length)))}${SEP()}${esc(t('qs', num(examQids(ex.n).length)))}</span>
      <span class="${sc ? 'score-' + cls(best) : ''}">${sc ? esc(t('taken', num(sc.length), pct(best))) : esc(t('notTaken'))}</span></button>`;
  });
  h += `</div></div>`;
  const miss = missedIds();
  h += `<div class="card"><h2>${esc(t('targeted'))}</h2><div class="grid">
    <button class="tile" data-a="set" data-k="fav"><b>${esc(t('fav'))}</b><span>${esc(t('saved', num(S.fav.length)))}</span></button>
    <button class="tile" data-a="set" data-k="hard"><b>${esc(t('hard'))}</b><span>${esc(t('flagged', num(S.hard.length)))}</span></button>
    <button class="tile" data-a="set" data-k="missed"><b>${esc(t('missed'))}</b><span>${esc(t('toRedo', num(miss.length)))}</span></button>
   </div><h3>${esc(t('byStd'))}</h3><div class="grid">`;
  STD_ORDER.forEach(code => {
    const n = B.qs.filter(q => (q.std || []).includes(code)).length; if (!n) return;
    h += `<button class="tile" data-a="set" data-k="std" data-s="${esc(code)}"><b>${esc(stdCode(code))}</b><span>${esc(STD[code][L === 'fa' ? 1 : 0])}</span><span>${esc(t('qs', num(n)))}</span></button>`;
  });
  h += `</div></div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'exam') startExam(+b.dataset.n);
    if (a === 'set') startSet(b.dataset.k, b.dataset.s);
    if (a === 'resume') nav('#/quiz');
    if (a === 'discard') { S.cur = null; save(); render(); }
  });
}
function startExam(n) {
  S.cur = { kind: 'exam', arg: n, qids: examQids(n), idx: 0, ans: {}, rev: {}, t0: Date.now() };
  save(); setScrollTop(); nav('#/quiz');
}
function startSet(kind, arg) {
  let ids = [];
  if (kind === 'fav') ids = S.fav.slice();
  if (kind === 'hard') ids = S.hard.slice();
  if (kind === 'missed') ids = missedIds();
  if (kind === 'std') ids = B.qs.filter(q => (q.std || []).includes(arg)).map(q => q.id);
  ids = ids.filter(id => QMAP[id]);
  if (!ids.length) { toast(t('nothing')); return; }
  S.cur = { kind, arg: arg || null, qids: groupBySet(ids, rng(Date.now() % 99991)), idx: 0, ans: {}, rev: {}, t0: Date.now() };
  save(); setScrollTop(); nav('#/quiz');
}

/* ---------------- quiz ---------------- */
let vigOpen = store.get('cfa-vig', true, true);
function renderQuiz() {
  const c = S.cur; const n = c.qids.length; c.idx = Math.max(0, Math.min(n - 1, c.idx || 0));
  const q = QMAP[c.qids[c.idx]]; const set = B.sets[q.set];
  const nAns = Object.keys(c.ans).length;
  const firstOfSet = c.idx === 0 || QMAP[c.qids[c.idx - 1]].set !== q.set;
  const setQs = c.qids.filter(id => QMAP[id].set === q.set);
  let h = `<div class="card"><div class="bar" style="margin-top:0">
      <div style="min-width:0;flex:1 1 12rem"><h2 style="margin:0">${esc(labelOf(c))}</h2>
      <div class="meta">${esc(t('qOf', num(c.idx + 1), num(n)))}${SEP()}${esc(t('answered', num(nAns)))}</div></div>
      <button class="act ghost" data-a="finish">${esc(t('finish'))}</button></div>
      <div class="prog"><i style="width:${(nAns / n * 100).toFixed(1)}%"></i></div>
      <div class="qnav">${c.qids.map((id, i) => {
        let k = ''; if (c.rev[id]) k = c.ans[id] === QMAP[id].a ? 'ok' : 'no'; else if (c.ans[id] !== undefined) k = 'ans-d';
        return `<button data-go="${i}" class="${k} ${i === c.idx ? 'cur' : ''}" aria-label="${esc(t('qOf', num(i + 1), num(n)))}">${esc(num(i + 1))}</button>`; }).join('')}</div></div>`;
  h += `<div class="card">
    <div><span class="pill">${esc(t('setId'))}: ${esc(tx(set.title))}</span><span class="pill">${esc(t('ofTotal', num(setQs.indexOf(q.id) + 1), num(setQs.length)))}</span></div>
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
  h += `<div class="bar">
    ${c.rev[q.id] ? '' : `<button class="act" data-a="reveal">${esc(t('reveal'))}</button>`}
    <button class="flag ${S.fav.includes(q.id) ? 'on' : ''}" data-a="fav">${esc(S.fav.includes(q.id) ? t('favOn') : t('favOff'))}</button>
    <button class="flag hard ${S.hard.includes(q.id) ? 'on' : ''}" data-a="hard">${esc(S.hard.includes(q.id) ? t('hardOn') : t('hardOff'))}</button>
    ${MODE === 'server' ? `<button class="flag" data-a="repq">⚐ ${esc(t('reportQ'))}</button>` : ''}
    <span class="spacer"></span>
    <button class="act ghost" data-a="prev" ${c.idx === 0 ? 'disabled' : ''}>${esc(t('prev'))}</button>
    <button class="act" data-a="next" ${c.idx === n - 1 ? 'disabled' : ''}>${esc(c.idx === n - 1 ? t('last') : t('next'))}</button>
  </div></div>`;
  el.innerHTML = h;
  const det = el.querySelector('details.vig'); if (det) det.addEventListener('toggle', () => { vigOpen = det.open; store.set('cfa-vig', vigOpen, true); });
  const go = (i) => { c.idx = i; save(); renderQuiz(); setScrollTop(); };
  el.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { if (c.rev[q.id]) return; c.ans[q.id] = +b.dataset.pick; save(); renderQuiz(); });
  el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(+b.dataset.go));
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'reveal') { c.rev[q.id] = true; save(); renderQuiz(); }
    if (a === 'fav') { toggle('fav', q.id); renderQuiz(); }
    if (a === 'hard') { toggle('hard', q.id); renderQuiz(); }
    if (a === 'repq') openReport({ kind: 'question', qid: q.id });
    if (a === 'prev') go(Math.max(0, c.idx - 1));
    if (a === 'next') go(Math.min(n - 1, c.idx + 1));
    if (a === 'finish') finish();
  });
}
function toggle(list, id) { const i = S[list].indexOf(id); if (i < 0) S[list].push(id); else S[list].splice(i, 1); save(); }
function lessonFmt(h) { return h.replace(/\s*(Lesson:|درس:)\s*/, '\n\n<b>$1</b> '); }
function explainBlock(q) {
  return `<div class="ans"><b>${esc(t('answer'))}: ${esc(optLetter(q.a))}.</b> ${esc(tx(q.o[q.a]))}\n\n<b>${esc(t('why'))}:</b> ${lessonFmt(esc(tx(q.why)))}</div>
    <div class="ref"><b>${esc(t('ref'))}:</b> ${esc(tx(q.ref))}\n${(q.std || []).map(s => `<span class="pill">${esc(stdLabel(s))}</span>`).join(' ')}</div>`;
}
async function finish() {
  const c = S.cur; const n = c.qids.length; const nAns = Object.keys(c.ans).length;
  if (nAns < n && !(await askConfirm(t('confirmFinishPart', num(n - nAns)), t('finish')))) return;
  const correct = c.qids.filter(id => c.ans[id] === QMAP[id].a).length;
  const run = { exam: c.kind === 'exam' ? c.arg : null, kind: c.kind, arg: c.arg, date: new Date().toISOString(),
    mins: Math.max(1, Math.round((Date.now() - c.t0) / 60000)), total: n, answered: nAns, correct,
    score: Math.round(correct / n * 100), qids: c.qids, ans: c.ans, id: rid() };
  S.runs.push(run); S.cur = null; save(); pushRun(run);
  setScrollTop(); nav('#/result/' + run.id);
}

/* ---------------- result of one attempt ---------------- */
function renderResult(r) {
  if (!r) { location.replace('#/report'); return; }
  let h = `<div class="card"><h2>${esc(runLabel(r))}: ${esc(t('result'))}</h2>
    <div class="stats"><span class="stat"><b class="${cls(r.score)}">${esc(pct(r.score))}</b><span>${esc(t('score'))}</span></span>
    <span class="stat"><b>${esc(num(r.correct))}/${esc(num(r.total))}</b><span>${esc(t('right'))}</span></span>
    <span class="stat"><b>${esc(num(r.answered))}/${esc(num(r.total))}</b><span>${esc(t('attempted'))}</span></span>
    <span class="stat"><b>${esc(t('mins', num(r.mins)))}</b><span>${esc(t('duration'))}</span></span></div>
    <div class="tip">${esc(t('scoreNote'))}</div>
    <div class="bar"><button class="act" data-a="home">${esc(t('back'))}</button>
    <button class="act ghost" data-a="redo">${esc(t('redo'))}</button>
    <button class="act ghost" data-a="rep">${esc(t('seeReport'))}</button></div></div>`;
  const acc = accBy([r], q => (q.std || ['CODE'])[0]);
  h += `<div class="card"><h2>${esc(t('rpByStd'))}</h2>${hbars(acc, k => stdLabel(k), true)}</div>`;
  h += `<div class="card"><h2>${esc(t('details'))}</h2>`;
  (r.qids || []).forEach((id, k) => {
    const q = QMAP[id]; if (!q) return; const a = (r.ans || {})[id]; const ok = a === q.a;
    h += `<div class="result-q"><div><span class="pill">${esc(num(k + 1))}</span><span class="pill ${ok ? 'good' : 'bad'}">${esc(ok ? t('correct') : t('wrong'))}</span>
      <span class="pill">${esc(t('setId'))}: ${esc(tx(B.sets[q.set].title))}</span></div>
      <details><summary class="qtext" style="cursor:pointer">${esc(tx(q.q))}</summary>
      <details class="vig"><summary>${esc(t('vignette'))}</summary><div class="vignette">${esc(tx(B.sets[q.set].vig))}</div></details>
      ${q.o.map((o, j) => `<div class="opt ${j === q.a ? 'right' : (j === a ? 'wrong' : '')}"><span class="lt">${esc(optLetter(j))}.</span><span class="tx">${esc(tx(o))}</span></div>`).join('')}
      <div class="meta">${esc(t('yourAns'))}: ${a === undefined ? esc(t('none')) : esc(optLetter(a))}</div>
      ${explainBlock(q)}</details></div>`;
  });
  h += `</div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'home') nav('#/exams');
    if (a === 'rep') nav('#/report');
    if (a === 'redo') { const w = (r.qids || []).filter(id => QMAP[id] && (r.ans || {})[id] !== QMAP[id].a); if (!w.length) { toast(t('nothing')); return; }
      S.cur = { kind: 'missed', arg: null, qids: groupBySet(w, rng(Date.now() % 99991)), idx: 0, ans: {}, rev: {}, t0: Date.now() }; save(); setScrollTop(); nav('#/quiz'); }
  });
}

/* ---------------- review (favorites, hard) ---------------- */
function renderReview() {
  let h = '';
  [['fav', t('fav')], ['hard', t('hard')]].forEach(([k, title]) => {
    const qs = S[k].map(id => QMAP[id]).filter(Boolean);
    h += `<div class="card"><h2>${esc(title)} <span class="meta">(${esc(num(qs.length))})</span></h2>`;
    if (!qs.length) h += `<div class="empty">${esc(t('reviewEmpty'))}</div>`;
    else {
      h += `<div class="bar" style="margin-top:0"><button class="act" data-a="practice" data-k="${k}">${esc(t('practice'))}</button><button class="flag" data-a="clear" data-k="${k}">${esc(t('clear'))}</button></div>`;
      qs.forEach(q => {
        h += `<div class="result-q"><div>${(q.std || []).slice(0, 1).map(s => `<span class="pill">${esc(stdLabel(s))}</span>`).join('')}</div>
          <details><summary class="qtext" style="cursor:pointer">${esc(tx(q.q))}</summary>
          <details class="vig"><summary>${esc(t('vignette'))}</summary><div class="vignette">${esc(tx(B.sets[q.set].vig))}</div></details>
          ${q.o.map((o, j) => `<div class="opt ${j === q.a ? 'right' : ''}"><span class="lt">${esc(optLetter(j))}.</span><span class="tx">${esc(tx(o))}</span></div>`).join('')}
          ${explainBlock(q)}</details></div>`;
      });
    }
    h += `</div>`;
  });
  el.innerHTML = h;
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    if (b.dataset.a === 'practice') startSet(b.dataset.k);
    if (b.dataset.a === 'clear') { S[b.dataset.k] = []; save(); render(); }
  });
}

/* ================= LEARN: topic tree ================= */
const NODE = {}; const PARENT = {}; const STDNODE = {};
(function index(nodes, parent) { nodes.forEach(n => { NODE[n.id] = n; PARENT[n.id] = parent; if (n.std && !STDNODE[n.std]) STDNODE[n.std] = n.id; if (n.c) index(n.c, n.id); }); })(LEARN, null);
let openSet = new Set(store.get('cfa-tree', [], true));
const saveOpen = () => store.set('cfa-tree', [...openSet], true);
let learnQuery = store.get('cfa-tree-q', '', true);

function nodeStd(id) { let x = id; while (x) { if (NODE[x].std) return NODE[x].std; x = PARENT[x]; } return null; }
function renderTree() {
  const q = learnQuery.trim().toLowerCase();
  let match = null;
  if (q) { match = new Set(); Object.values(NODE).forEach(n => { if ((tx(n.t) + ' ' + n.t.en).toLowerCase().includes(q)) { let x = n.id; while (x) { match.add(x); x = PARENT[x]; } } }); }
  const cur = store.get('cfa-tree-cur', '', true);
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
  el.querySelectorAll('[data-tog]').forEach(b => b.onclick = () => { const id = b.dataset.tog; store.set('cfa-tree-cur', id, true); openSet.has(id) ? openSet.delete(id) : openSet.add(id); saveOpen(); renderTree(); });
  el.querySelectorAll('[data-open]').forEach(b => b.onclick = () => nav('#/learn/' + b.dataset.open));
  const lq = document.getElementById('lq');
  lq.oninput = () => { learnQuery = lq.value; store.set('cfa-tree-q', learnQuery, true); const pos = lq.selectionStart; renderTree(); const n = document.getElementById('lq'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} };
  el.querySelector('[data-a="openall"]').onclick = () => { Object.values(NODE).forEach(n => { if (n.c) openSet.add(n.id); }); saveOpen(); renderTree(); };
  el.querySelector('[data-a="closeall"]').onclick = () => { openSet.clear(); saveOpen(); renderTree(); };
}
function siblings(id) { const p = PARENT[id]; return p ? NODE[p].c : LEARN; }
function renderLesson(id) {
  const n = NODE[id]; if (!n) { location.replace('#/learn'); return; }
  // keep the tree open down to this lesson, so "back" shows where you were
  let x = PARENT[id]; while (x) { openSet.add(x); x = PARENT[x]; } saveOpen(); store.set('cfa-tree-cur', id, true);
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
    if (a === 'tree') nav('#/learn');
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
function accBy(runs, keyFn) {
  const acc = {};
  answeredPairs(runs).forEach(([q, a]) => { const k = keyFn(q); if (k == null) return; acc[k] = acc[k] || [0, 0]; acc[k][1]++; if (a === q.a) acc[k][0]++; });
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
    tip.innerHTML = `<b>${esc(runLabel(r))}</b><br>${esc(pct(r.score))} (${esc(num(r.correct))}/${esc(num(r.total))})<br>${esc(d.toLocaleDateString(L === 'fa' ? 'fa-IR' : 'en-US'))}`;
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
  const answered = pairs.filter(([q, a]) => a !== undefined);
  const corr = pairs.filter(([q, a]) => a === q.a).length;
  const overall = pairs.length ? Math.round(corr / pairs.length * 100) : 0;
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
  h += `<div class="card"><h2>${esc(t('history'))}</h2><div class="tablewrap"><table><tr><th>${esc(t('date'))}</th><th>${esc(t('name'))}</th><th>${esc(t('score'))}</th><th>${esc(t('graded'))}</th><th>${esc(t('time'))}</th><th></th></tr>`;
  runs.slice().reverse().forEach(r => {
    const d = new Date(r.date);
    h += `<tr><td>${esc(d.toLocaleDateString(L === 'fa' ? 'fa-IR' : 'en-US'))} ${esc(d.toLocaleTimeString(L === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' }))}</td>
      <td>${esc(runLabel(r))}</td><td class="${cls(r.score)}">${esc(pct(r.score))}</td><td>${esc(num(r.correct))}/${esc(num(r.total))}</td>
      <td>${esc(t('mins', num(r.mins)))}</td><td><button class="flag" data-run="${esc(r.id)}">${esc(t('view'))}</button></td></tr>`;
  });
  h += `</table></div><div class="bar"><button class="flag" data-a="clearh">${esc(t('clearHist'))}</button></div></div>`;
  if (MODE !== 'server') h += backupCard();
  el.innerHTML = h;
  wireLineChart(runs);
  el.querySelectorAll('[data-nav]').forEach(a => a.onclick = (e) => { e.preventDefault(); nav(a.getAttribute('href')); });
  el.querySelectorAll('[data-prac]').forEach(b => b.onclick = () => startSet('std', b.dataset.prac));
  el.querySelectorAll('[data-run]').forEach(b => b.onclick = () => nav('#/result/' + b.dataset.run));
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
async function afterLogin() { await loadServer(); applyTheme(); render(); restoreScroll(); }
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
  const out = async (p) => { try { await api(p, 'POST', {}); } catch (e) {} ME = null; S = blank(); store.set('cfa-cur', null, true); location.replace('#/exams'); render(); };
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
  return Object.assign({ page: r.name + (r.arg ? '/' + r.arg : ''), test: S.cur ? labelOf(S.cur) : '', qid: r.name === 'quiz' && S.cur ? S.cur.qids[S.cur.idx] : '',
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
  const qid = opts.qid || (route().name === 'quiz' && S.cur ? S.cur.qids[S.cur.idx] : '');
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
  if (await detectServer()) { MODE = 'server'; await loadServer(); }
  else { MODE = 'local'; S = loadLocal(); }
  if (!location.hash) history.replaceState(null, '', '#/exams');
  render();
  restoreScroll();
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (route().name === 'report') { const y = window.scrollY; render(); window.scrollTo(0, y); } }, 200); });
})();
})();
