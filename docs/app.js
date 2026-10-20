/* CFA Level III Ethics Practice
   Works in two modes:
   - local: everything is stored in this browser (GitHub Pages, or opening index.html directly)
   - server: when served by server/server.js, data is stored on the server per user account
*/
(function () {
'use strict';

const B = window.BANK;
const QMAP = {}; B.qs.forEach(q => { QMAP[q.id] = q; });
const LS_KEY = 'cfa-ethics-v1';
const LS_PREF = 'cfa-ethics-prefs';

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

/* ---------------- UI strings ---------------- */
const T = {
  en: {
    title: 'CFA Level III Ethics Practice',
    sub: (n, e) => `Ethical and Professional Standards · ${n} questions · ${e} exams`,
    tabHome: 'Exams', tabReview: 'Review', tabProgress: 'Progress', tabAccount: 'Account',
    exams: 'Practice exams',
    examsMeta: (e) => `${e} exams · each built in the official Level III item-set format (case vignettes, three options per question) · unlimited retries`,
    exam: 'Exam', notTaken: 'not attempted', taken: (k, b) => `taken ${k}× · best ${b}%`,
    qs: (n) => `${n} questions`, sets: (n) => `${n} vignettes`,
    targeted: 'Targeted practice', fav: '★ Favorites', hard: '⚑ Hard questions', missed: 'Missed questions',
    saved: (n) => `${n} saved`, flagged: (n) => `${n} flagged`, toRedo: (n) => `${n} to redo`,
    byStd: 'Practice by standard', resume: 'Continue where you left off', resumeBtn: 'Continue', discard: 'Discard',
    qOf: (i, n) => `Question ${i} of ${n}`, answered: (n) => `${n} answered`,
    finish: 'Finish and score', vignette: 'Case (vignette)', showVig: 'Show / hide case',
    reveal: 'Show answer', favOn: '★ Favorite', favOff: '☆ Favorite', hardOn: '⚑ Marked hard', hardOff: '⚑ Mark hard',
    prev: '← Previous', next: 'Next →', last: 'Last question',
    answer: 'Correct answer', why: 'Explanation', ref: 'Reference in the official curriculum',
    yourAns: 'Your answer', none: 'not answered', correct: 'correct', wrong: 'wrong',
    result: 'Result', score: 'score', right: 'correct', attempted: 'answered', duration: 'time',
    scoreNote: 'Score = correct answers ÷ all questions in the exam (unanswered questions count as wrong, as on the real exam).',
    back: 'Back to exams', redo: 'Redo missed questions', seeProg: 'See progress', details: 'Question by question',
    reviewEmpty: 'Nothing here yet. Use the buttons while taking an exam.', practice: 'Practice these', clear: 'Clear all',
    progress: 'Progress', attempts: 'attempts', avg: 'average', best: 'best', total: 'total time',
    noAttempts: 'No attempts recorded yet.', history: 'History', date: 'Date', name: 'Exam', graded: 'Correct',
    time: 'Time', view: 'View', clearHist: 'Clear history', confirmClear: 'Erase all attempt history?',
    byStdAcc: 'Accuracy by standard (all attempts)', weakest: 'Weakest first',
    nothing: 'Nothing in that set yet.', min: 'm', confirmFinishPart: (k) => `${k} questions are unanswered and will count as wrong. Finish anyway?`,
    backup: 'Backup and transfer', exportBtn: 'Export my data', importBtn: 'Import data', importOk: 'Data imported.',
    importBad: 'This file is not a valid backup.', localMode: 'Your results are saved in this browser.',
    serverMode: (u) => `Signed in as ${u}. Your results are saved on the server.`,
    login: 'Sign in', register: 'Create account', logout: 'Sign out', user: 'Username', pass: 'Password',
    invite: 'Invitation code', loginTitle: 'Sign in to save your results on the server',
    loginTip: 'Use the same account on any device to see your results.',
    importLocal: 'Copy results saved in this browser into my account', imported: 'Copied.',
    std: 'Standard', standardWord: 'Standard', setLbl: 'Case', ofTotal: (c, t) => `${c} of ${t}`,
    lang: 'Language', mins: (m) => `${m} min`
  },
  fa: {
    title: 'تمرین اخلاق حرفه‌ای سی اف ای، سطح سه',
    sub: (n, e) => `استانداردهای اخلاقی و حرفه‌ای، ${n} سوال، ${e} امتحان`,
    tabHome: 'امتحان‌ها', tabReview: 'مرور', tabProgress: 'پیشرفت', tabAccount: 'حساب کاربری',
    exams: 'امتحان‌های تمرینی',
    examsMeta: (e) => `${e} امتحان، هر امتحان در قالب رسمی سطح سه (متن مورد با چند سوال، هر سوال سه گزینه)، تکرار نامحدود`,
    exam: 'امتحان', notTaken: 'هنوز انجام نشده', taken: (k, b) => `${k} بار انجام شده، بهترین ${b}٪`,
    qs: (n) => `${n} سوال`, sets: (n) => `${n} متن مورد`,
    targeted: 'تمرین هدفمند', fav: '★ نشان‌شده‌ها', hard: '⚑ سوال‌های سخت', missed: 'سوال‌های غلط',
    saved: (n) => `${n} مورد`, flagged: (n) => `${n} مورد`, toRedo: (n) => `${n} سوال برای تکرار`,
    byStd: 'تمرین بر اساس استاندارد', resume: 'ادامه از جایی که ماندی', resumeBtn: 'ادامه', discard: 'حذف',
    qOf: (i, n) => `سوال ${i} از ${n}`, answered: (n) => `${n} پاسخ داده شده`,
    finish: 'پایان و نمره', vignette: 'متن مورد', showVig: 'نمایش یا پنهان کردن متن مورد',
    reveal: 'دیدن جواب', favOn: '★ نشان‌شده', favOff: '☆ نشان کردن', hardOn: '⚑ سخت علامت خورده', hardOff: '⚑ علامت سخت',
    prev: '→ قبلی', next: 'بعدی ←', last: 'سوال آخر',
    answer: 'جواب درست', why: 'توضیح', ref: 'مرجع در کتاب رسمی',
    yourAns: 'جواب تو', none: 'بی‌پاسخ', correct: 'درست', wrong: 'غلط',
    result: 'نتیجه', score: 'نمره', right: 'درست', attempted: 'پاسخ داده شده', duration: 'زمان',
    scoreNote: 'نمره برابر است با تعداد جواب‌های درست تقسیم بر همه سوال‌های امتحان (سوال بی‌پاسخ، مثل امتحان واقعی، غلط حساب می‌شود).',
    back: 'بازگشت به امتحان‌ها', redo: 'تکرار سوال‌های غلط', seeProg: 'دیدن پیشرفت', details: 'سوال به سوال',
    reviewEmpty: 'هنوز چیزی اینجا نیست. هنگام امتحان از دکمه‌ها استفاده کن.', practice: 'تمرین همین‌ها', clear: 'پاک کردن همه',
    progress: 'پیشرفت', attempts: 'دفعه', avg: 'میانگین', best: 'بهترین', total: 'کل زمان',
    noAttempts: 'هنوز امتحانی ثبت نشده است.', history: 'سابقه', date: 'تاریخ', name: 'امتحان', graded: 'درست',
    time: 'زمان', view: 'دیدن', clearHist: 'پاک کردن سابقه', confirmClear: 'همه سابقه امتحان‌ها پاک شود؟',
    byStdAcc: 'درصد درستی بر اساس استاندارد (همه دفعه‌ها)', weakest: 'ضعیف‌ترین‌ها اول',
    nothing: 'هنوز سوالی در این دسته نیست.', min: 'دقیقه', confirmFinishPart: (k) => `${k} سوال بی‌پاسخ است و غلط حساب می‌شود. پایان داده شود؟`,
    backup: 'پشتیبان و انتقال', exportBtn: 'گرفتن خروجی از اطلاعات من', importBtn: 'وارد کردن اطلاعات', importOk: 'اطلاعات وارد شد.',
    importBad: 'این فایل پشتیبان معتبر نیست.', localMode: 'نتیجه‌ها در همین مرورگر ذخیره می‌شود.',
    serverMode: (u) => `با نام ${u} وارد شده‌ای. نتیجه‌ها روی سرور ذخیره می‌شود.`,
    login: 'ورود', register: 'ساخت حساب', logout: 'خروج', user: 'نام کاربری', pass: 'رمز',
    invite: 'کد دعوت', loginTitle: 'برای ذخیره نتیجه‌ها روی سرور وارد شو',
    loginTip: 'با همین حساب از هر دستگاهی نتیجه‌هایت را می‌بینی.',
    importLocal: 'انتقال نتیجه‌های ذخیره‌شده در این مرورگر به حساب من', imported: 'منتقل شد.',
    std: 'استاندارد', standardWord: 'استاندارد', setLbl: 'متن مورد', ofTotal: (c, t) => `${c} از ${t}`,
    lang: 'زبان', mins: (m) => `${m} دقیقه`
  }
};

/* ---------------- prefs (per browser) ---------------- */
let PREF = { lang: 'en', theme: '' };
try { Object.assign(PREF, JSON.parse(localStorage.getItem(LS_PREF) || '{}')); } catch (e) {}
const savePref = () => { try { localStorage.setItem(LS_PREF, JSON.stringify(PREF)); } catch (e) {} };
let L = PREF.lang === 'fa' ? 'fa' : 'en';
const pct = (x) => L === 'fa' ? num(x) + '٪' : x + '%';
const SEP = () => L === 'fa' ? '، ' : ' · ';
const t = (k, ...a) => { const v = T[L][k]; return typeof v === 'function' ? v(...a) : v; };

const FA_DIG = '۰۱۲۳۴۵۶۷۸۹';
const num = (x) => L === 'fa' ? String(x).replace(/[0-9]/g, d => FA_DIG[d]) : String(x);
const tx = (o) => (o && (o[L] || o.en)) || '';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function stdCode(code) {
  if (L !== 'fa') return code === 'AMC' ? 'AMC' : code === 'CODE' ? 'Code' : code;
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
const LETTERS = { en: ['A', 'B', 'C'], fa: ['الف', 'ب', 'ج'] };

/* ---------------- storage ---------------- */
const blank = () => ({ v: 1, fav: [], hard: [], runs: [], cur: null });
let S = blank();
let MODE = 'local', USER = null, INVITE = false;
let saveTimer = null;

function normalize(s) {
  const o = blank();
  if (s && typeof s === 'object') {
    o.fav = Array.isArray(s.fav) ? s.fav.filter(id => QMAP[id]) : [];
    o.hard = Array.isArray(s.hard) ? s.hard.filter(id => QMAP[id]) : [];
    o.runs = Array.isArray(s.runs) ? s.runs : [];
    o.cur = s.cur && Array.isArray(s.cur.qids) ? s.cur : null;
  }
  return o;
}
function loadLocal() { try { return normalize(JSON.parse(localStorage.getItem(LS_KEY) || 'null')); } catch (e) { return blank(); } }
function saveLocal(state) { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }

function save() {
  if (MODE === 'local') { saveLocal(S); return; }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushServer, 400);
}
async function pushServer() {
  try {
    const r = await fetch('api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(S) });
    if (r.status === 401) { USER = null; render(); }
  } catch (e) { toast(L === 'fa' ? 'ذخیره روی سرور انجام نشد. دوباره تلاش می‌شود.' : 'Could not save to the server. Will retry.'); clearTimeout(saveTimer); saveTimer = setTimeout(pushServer, 5000); }
}
async function detectServer() {
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch('api/health', { cache: 'no-store', signal: ctl.signal, credentials: 'same-origin' });
    clearTimeout(tm);
    if (!r.ok) return false;
    const j = await r.json();
    if (!j || j.app !== 'cfa-ethics') return false;
    INVITE = !!j.invite;
    return true;
  } catch (e) { return false; }
}
async function loadServer() {
  const r = await fetch('api/me', { credentials: 'same-origin', cache: 'no-store' });
  if (!r.ok) { USER = null; return; }
  const j = await r.json(); USER = j.user;
  const s = await fetch('api/state', { credentials: 'same-origin', cache: 'no-store' });
  S = normalize(s.ok ? await s.json() : null);
}

/* ---------------- deterministic exam build ---------------- */
function examQids(n) {
  const ex = B.exams.find(e => e.n === n); if (!ex) return [];
  return ex.sets.flatMap(sid => B.qs.filter(q => q.set === sid).map(q => q.id));
}
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// keep questions of the same vignette together, shuffle the order of vignettes
function groupBySet(ids, r) {
  const groups = {}; const order = [];
  ids.forEach(id => { const s = QMAP[id].set; if (!groups[s]) { groups[s] = []; order.push(s); } groups[s].push(id); });
  return shuffle(order, r).flatMap(s => groups[s].sort((a, b) => QMAP[a].k - QMAP[b].k));
}

/* ---------------- helpers on runs ---------------- */
function lastOutcome() { // qid -> true/false based on most recent answer
  const m = {};
  S.runs.forEach(r => { const a = r.ans || {}; Object.keys(a).forEach(id => { if (QMAP[id]) m[id] = a[id] === QMAP[id].a; }); });
  return m;
}
function missedIds() { const m = lastOutcome(); return Object.keys(m).filter(id => m[id] === false); }
function stdAcc() {
  const acc = {};
  S.runs.forEach(r => { const a = r.ans || {}; Object.keys(a).forEach(id => {
    const q = QMAP[id]; if (!q) return;
    (q.std || []).slice(0, 1).forEach(s => { acc[s] = acc[s] || [0, 0]; acc[s][1]++; if (a[id] === q.a) acc[s][0]++; });
  }); });
  return acc;
}
const cls = (p) => p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad';

/* ---------------- view state ---------------- */
let view = 'home', vigOpen = true, viewRun = null;
const el = document.getElementById('app');

function toast(msg) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.appendChild(d);
  setTimeout(() => d.remove(), 2600);
}

function applyLang() {
  document.documentElement.lang = L; document.documentElement.dir = L === 'fa' ? 'rtl' : 'ltr';
  document.title = t('title');
  document.getElementById('t-title').textContent = t('title');
  document.getElementById('t-sub').textContent = t('sub', num(B.qs.length), num(B.exams.length));
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === L));
  const tabs = [['home', t('tabHome')], ['review', t('tabReview')], ['progress', t('tabProgress')]];
  if (MODE === 'server' && USER) tabs.push(['account', t('tabAccount')]);
  document.getElementById('tabs').innerHTML = tabs.map(([v, n]) => `<button type="button" data-v="${v}" class="${view === v && !S.cur?.active ? 'on' : ''}">${esc(n)}</button>`).join('');
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { if (S.cur) S.cur.active = false; view = b.dataset.v; viewRun = null; render(); });
}
function applyTheme() { if (PREF.theme) document.documentElement.dataset.theme = PREF.theme; else delete document.documentElement.dataset.theme; }

document.querySelectorAll('.lang button').forEach(b => b.onclick = () => { L = b.dataset.lang; PREF.lang = L; savePref(); render(); });
document.getElementById('themeBtn').onclick = () => {
  const dark = PREF.theme ? PREF.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  PREF.theme = dark ? 'light' : 'dark'; savePref(); applyTheme();
};

/* ---------------- render ---------------- */
function render() {
  applyLang();
  if (MODE === 'server' && !USER) return renderLogin();
  if (S.cur && S.cur.active) return renderQuiz();
  if (viewRun !== null) return renderResult(S.runs[viewRun], viewRun);
  if (view === 'review') return renderReview();
  if (view === 'progress') return renderProgress();
  if (view === 'account') return renderAccount();
  return renderHome();
}

function renderHome() {
  const done = {}; S.runs.forEach(r => { if (typeof r.exam === 'number') (done[r.exam] = done[r.exam] || []).push(r.score); });
  let h = '';
  if (S.cur) {
    const c = S.cur;
    h += `<div class="card"><h2>${esc(t('resume'))}</h2><div class="meta">${esc(labelOf(c))}${SEP()}${esc(t('answered', num(Object.keys(c.ans).length)))} / ${esc(num(c.qids.length))}</div>
      <div class="bar"><button class="act" data-a="resume">${esc(t('resumeBtn'))}</button><button class="flag" data-a="discard">${esc(t('discard'))}</button></div></div>`;
  }
  h += `<div class="card"><h2>${esc(t('exams'))}</h2><div class="meta" style="margin-bottom:.7rem">${esc(t('examsMeta', num(B.exams.length)))}</div><div class="grid">`;
  B.exams.forEach(ex => {
    const sc = done[ex.n]; const best = sc ? Math.max(...sc) : null;
    const nq = examQids(ex.n).length;
    h += `<button class="tile" data-a="exam" data-n="${ex.n}"><b>${esc(t('exam'))} ${esc(num(ex.n))}</b>
      <span>${esc(t('sets', num(ex.sets.length)))}${SEP()}${esc(t('qs', num(nq)))}</span>
      <span class="${sc ? 'score-' + cls(best).replace('good', 'good') : ''}">${sc ? esc(t('taken', num(sc.length), num(best))) : esc(t('notTaken'))}</span></button>`;
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
    if (a === 'resume') { S.cur.active = true; render(); }
    if (a === 'discard') { S.cur = null; save(); render(); }
  });
}

function labelOf(c) {
  if (c.kind === 'exam') return t('exam') + ' ' + num(c.arg);
  if (c.kind === 'fav') return t('fav');
  if (c.kind === 'hard') return t('hard');
  if (c.kind === 'missed') return t('missed');
  if (c.kind === 'std') return stdLabel(c.arg);
  return '';
}
function startExam(n) {
  S.cur = { kind: 'exam', arg: n, qids: examQids(n), idx: 0, ans: {}, rev: {}, t0: Date.now(), active: true };
  window.scrollTo(0, 0); save(); render();
}
function startSet(kind, arg) {
  let ids = [];
  if (kind === 'fav') ids = S.fav.slice();
  if (kind === 'hard') ids = S.hard.slice();
  if (kind === 'missed') ids = missedIds();
  if (kind === 'std') ids = B.qs.filter(q => (q.std || []).includes(arg)).map(q => q.id);
  ids = ids.filter(id => QMAP[id]);
  if (!ids.length) { toast(t('nothing')); return; }
  ids = groupBySet(ids, rng(Date.now() % 99991));
  S.cur = { kind, arg: arg || null, qids: ids, idx: 0, ans: {}, rev: {}, t0: Date.now(), active: true };
  window.scrollTo(0, 0); save(); render();
}

function optLetter(i) { return LETTERS[L][i]; }

function renderQuiz() {
  const c = S.cur; const n = c.qids.length; const q = QMAP[c.qids[c.idx]]; const set = B.sets[q.set];
  const nAns = Object.keys(c.ans).length;
  const firstOfSet = c.idx === 0 || QMAP[c.qids[c.idx - 1]].set !== q.set;
  const setQs = c.qids.filter(id => QMAP[id].set === q.set);
  const posInSet = setQs.indexOf(q.id) + 1;
  let h = `<div class="card"><div class="bar" style="margin-top:0">
      <div style="min-width:0;flex:1 1 12rem"><h2 style="margin:0">${esc(labelOf(c))}</h2>
      <div class="meta">${esc(t('qOf', num(c.idx + 1), num(n)))}${SEP()}${esc(t('answered', num(nAns)))}</div></div>
      <button class="act ghost" data-a="finish">${esc(t('finish'))}</button></div>
      <div class="prog"><i style="width:${(nAns / n * 100).toFixed(1)}%"></i></div>
      <div class="qnav">${c.qids.map((id, i) => {
        let k = ''; if (c.rev[id]) k = c.ans[id] === QMAP[id].a ? 'ok' : 'no'; else if (c.ans[id] !== undefined) k = 'ans-d';
        return `<button data-go="${i}" class="${k} ${i === c.idx ? 'cur' : ''}">${esc(num(i + 1))}</button>`; }).join('')}</div></div>`;
  h += `<div class="card">
    <div><span class="pill">${esc(t('setLbl'))}: ${esc(tx(set.title))}</span><span class="pill">${esc(t('ofTotal', num(posInSet), num(setQs.length)))}</span></div>
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
    <span class="spacer"></span>
    <button class="act ghost" data-a="prev" ${c.idx === 0 ? 'disabled' : ''}>${esc(t('prev'))}</button>
    <button class="act" data-a="next" ${c.idx === n - 1 ? 'disabled' : ''}>${esc(c.idx === n - 1 ? t('last') : t('next'))}</button>
  </div></div>`;
  el.innerHTML = h;
  const det = el.querySelector('details.vig'); if (det) det.addEventListener('toggle', () => { vigOpen = det.open; });
  el.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { if (c.rev[q.id]) return; c.ans[q.id] = +b.dataset.pick; save(); renderQuiz(); });
  el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { c.idx = +b.dataset.go; save(); renderQuiz(); window.scrollTo(0, 0); });
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'reveal') { c.rev[q.id] = true; save(); renderQuiz(); }
    if (a === 'fav') { toggle('fav', q.id); renderQuiz(); }
    if (a === 'hard') { toggle('hard', q.id); renderQuiz(); }
    if (a === 'prev') { c.idx = Math.max(0, c.idx - 1); save(); renderQuiz(); window.scrollTo(0, 0); }
    if (a === 'next') { c.idx = Math.min(n - 1, c.idx + 1); save(); renderQuiz(); window.scrollTo(0, 0); }
    if (a === 'finish') finish();
  });
}
function toggle(list, id) { const i = S[list].indexOf(id); if (i < 0) S[list].push(id); else S[list].splice(i, 1); save(); }

function explainBlock(q) {
  return `<div class="ans"><b>${esc(t('answer'))}: ${esc(optLetter(q.a))}.</b> ${esc(tx(q.o[q.a]))}\n\n<b>${esc(t('why'))}:</b> ${esc(tx(q.why))}</div>
    <div class="ref"><b>${esc(t('ref'))}:</b> ${esc(tx(q.ref))}\n${(q.std || []).map(s => `<span class="pill">${esc(stdLabel(s))}</span>`).join(' ')}</div>`;
}

function finish() {
  const c = S.cur; const n = c.qids.length; const nAns = Object.keys(c.ans).length;
  if (nAns < n && !confirm(t('confirmFinishPart', num(n - nAns)))) return;
  const correct = c.qids.filter(id => c.ans[id] === QMAP[id].a).length;
  const run = { exam: c.kind === 'exam' ? c.arg : null, kind: c.kind, arg: c.arg, date: new Date().toISOString(),
    mins: Math.max(1, Math.round((Date.now() - c.t0) / 60000)), total: n, answered: nAns, correct,
    score: Math.round(correct / n * 100), qids: c.qids, ans: c.ans };
  S.runs.push(run); S.cur = null; save();
  viewRun = S.runs.length - 1; window.scrollTo(0, 0); render();
}

function runLabel(r) { return labelOf({ kind: r.kind || 'exam', arg: r.kind ? r.arg : r.exam }); }

function renderResult(r, i) {
  if (!r) { viewRun = null; return render(); }
  let h = `<div class="card"><h2>${esc(runLabel(r))}: ${esc(t('result'))}</h2>
    <div class="stats"><span class="stat"><b class="${cls(r.score)}">${esc(pct(r.score))}</b><span>${esc(t('score'))}</span></span>
    <span class="stat"><b>${esc(num(r.correct))}/${esc(num(r.total))}</b><span>${esc(t('right'))}</span></span>
    <span class="stat"><b>${esc(num(r.answered))}/${esc(num(r.total))}</b><span>${esc(t('attempted'))}</span></span>
    <span class="stat"><b>${esc(t('mins', num(r.mins)))}</b><span>${esc(t('duration'))}</span></span></div>
    <div class="tip">${esc(t('scoreNote'))}</div>
    <div class="bar"><button class="act" data-a="home">${esc(t('back'))}</button>
    <button class="act ghost" data-a="redo">${esc(t('redo'))}</button>
    <button class="act ghost" data-a="prog">${esc(t('seeProg'))}</button></div></div>`;
  // per standard in this run
  const acc = {};
  (r.qids || []).forEach(id => { const q = QMAP[id]; if (!q) return; const s = (q.std || ['CODE'])[0]; acc[s] = acc[s] || [0, 0]; acc[s][1]++; if ((r.ans || {})[id] === q.a) acc[s][0]++; });
  h += `<div class="card"><h2>${esc(t('byStdAcc').split('(')[0])}</h2>${stdBars(acc)}</div>`;
  h += `<div class="card"><h2>${esc(t('details'))}</h2>`;
  (r.qids || []).forEach((id, k) => {
    const q = QMAP[id]; if (!q) return; const a = (r.ans || {})[id]; const ok = a === q.a;
    h += `<div class="result-q"><div><span class="pill">${esc(num(k + 1))}</span><span class="pill ${ok ? 'good' : 'bad'}">${esc(ok ? t('correct') : t('wrong'))}</span>
      <span class="pill">${esc(t('setLbl'))}: ${esc(tx(B.sets[q.set].title))}</span></div>
      <details><summary class="qtext" style="cursor:pointer">${esc(tx(q.q))}</summary>
      <details class="vig"><summary>${esc(t('vignette'))}</summary><div class="vignette">${esc(tx(B.sets[q.set].vig))}</div></details>
      ${q.o.map((o, j) => `<div class="opt ${j === q.a ? 'right' : (j === a ? 'wrong' : '')}"><span class="lt">${esc(optLetter(j))}.</span><span class="tx">${esc(tx(o))}</span></div>`).join('')}
      <div class="meta">${esc(t('yourAns'))}: ${a === undefined ? esc(t('none')) : esc(optLetter(a))}</div>
      ${explainBlock(q)}</details></div>`;
  });
  h += `</div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const a = b.dataset.a; viewRun = null;
    if (a === 'home') { view = 'home'; render(); }
    if (a === 'prog') { view = 'progress'; render(); }
    if (a === 'redo') { const w = (r.qids || []).filter(id => (r.ans || {})[id] !== QMAP[id]?.a && QMAP[id]); if (!w.length) { toast(t('nothing')); render(); return; }
      S.cur = { kind: 'missed', arg: null, qids: groupBySet(w, rng(Date.now() % 99991)), idx: 0, ans: {}, rev: {}, t0: Date.now(), active: true }; save(); render(); }
  });
}

function stdBars(acc, sortWeak) {
  let keys = STD_ORDER.filter(k => acc[k]);
  if (sortWeak) keys.sort((a, b) => acc[a][0] / acc[a][1] - acc[b][0] / acc[b][1]);
  if (!keys.length) return `<div class="empty">${esc(t('noAttempts'))}</div>`;
  return keys.map(k => { const [c, n] = acc[k]; const p = Math.round(c / n * 100);
    const col = p >= 70 ? 'var(--green)' : p >= 50 ? 'var(--amber)' : 'var(--red)';
    return `<div class="barrow"><span class="lbl">${esc(stdLabel(k))}</span><span class="track"><i style="width:${p}%;background:${col}"></i></span>
      <span class="val">${esc(pct(p))} (${esc(num(c))}/${esc(num(n))})</span></div>`; }).join('');
}

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

function renderProgress() {
  const runs = S.runs;
  let h = `<div class="card"><h2>${esc(t('progress'))}</h2>`;
  if (!runs.length) h += `<div class="empty">${esc(t('noAttempts'))}</div>`;
  else {
    const avg = Math.round(runs.reduce((a, r) => a + r.score, 0) / runs.length);
    const best = Math.max(...runs.map(r => r.score));
    const tot = runs.reduce((a, r) => a + (r.mins || 0), 0);
    h += `<div class="stats"><span class="stat"><b>${esc(num(runs.length))}</b><span>${esc(t('attempts'))}</span></span>
      <span class="stat"><b class="${cls(avg)}">${esc(pct(avg))}</b><span>${esc(t('avg'))}</span></span>
      <span class="stat"><b class="${cls(best)}">${esc(pct(best))}</b><span>${esc(t('best'))}</span></span>
      <span class="stat"><b>${esc(t('mins', num(tot)))}</b><span>${esc(t('total'))}</span></span></div>
      <canvas id="ch" height="200" style="width:100%;height:200px"></canvas>`;
  }
  h += `</div>`;
  if (runs.length) {
    h += `<div class="card"><h2>${esc(t('byStdAcc'))}</h2><div class="meta" style="margin-bottom:.4rem">${esc(t('weakest'))}</div>${stdBars(stdAcc(), true)}</div>`;
    h += `<div class="card"><h2>${esc(t('history'))}</h2><div class="tablewrap"><table><tr><th>${esc(t('date'))}</th><th>${esc(t('name'))}</th><th>${esc(t('score'))}</th><th>${esc(t('graded'))}</th><th>${esc(t('time'))}</th><th></th></tr>`;
    runs.map((r, i) => [r, i]).reverse().forEach(([r, i]) => {
      const d = new Date(r.date);
      h += `<tr><td>${esc(d.toLocaleDateString(L === 'fa' ? 'fa-IR' : 'en-US'))} ${esc(d.toLocaleTimeString(L === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' }))}</td>
        <td>${esc(runLabel(r))}</td><td class="${cls(r.score)}">${esc(pct(r.score))}</td><td>${esc(num(r.correct))}/${esc(num(r.total))}</td>
        <td>${esc(t('mins', num(r.mins)))}</td><td><button class="flag" data-run="${i}">${esc(t('view'))}</button></td></tr>`;
    });
    h += `</table></div><div class="bar"><button class="flag" data-a="clearh">${esc(t('clearHist'))}</button></div></div>`;
  }
  h += backupCard();
  el.innerHTML = h;
  el.querySelectorAll('[data-run]').forEach(b => b.onclick = () => { viewRun = +b.dataset.run; window.scrollTo(0, 0); render(); });
  const ch = el.querySelector('[data-a="clearh"]'); if (ch) ch.onclick = () => { if (confirm(t('confirmClear'))) { S.runs = []; save(); render(); } };
  wireBackup();
  drawChart(runs);
}

function backupCard() {
  return `<div class="card"><h2>${esc(t('backup'))}</h2><div class="tip">${esc(MODE === 'server' ? t('serverMode', USER) : t('localMode'))}</div>
    <div class="bar"><button class="act ghost" data-b="export">${esc(t('exportBtn'))}</button>
    <label class="act ghost" style="display:inline-block">${esc(t('importBtn'))}<input type="file" accept="application/json,.json" data-b="import" hidden></label></div></div>`;
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
    rd.onload = () => { try { const j = JSON.parse(rd.result); if (!j || j.app !== 'cfa-ethics') throw 0; S = normalize(j.state); save(); toast(t('importOk')); render(); } catch (e) { toast(t('importBad')); } };
    rd.readAsText(f);
  };
}

function drawChart(runs) {
  const c = document.getElementById('ch'); if (!c || !runs.length) return;
  const dpr = window.devicePixelRatio || 1, W = c.clientWidth, H = 200;
  c.width = W * dpr; c.height = H * dpr; const x = c.getContext('2d'); x.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const line = css.getPropertyValue('--line').trim(), mut = css.getPropertyValue('--mut').trim(), nav = css.getPropertyValue('--navy-2').trim();
  const Lp = 40, R = 12, Tp = 12, Bp = 24, w = W - Lp - R, h = H - Tp - Bp;
  x.font = '11px ' + (L === 'fa' ? 'Vazirmatn, Tahoma, sans-serif' : 'sans-serif');
  [0, 25, 50, 70, 100].forEach(v => { const y = Tp + h - (v / 100) * h; x.strokeStyle = v === 70 ? nav : line; x.setLineDash(v === 70 ? [4, 4] : []);
    x.beginPath(); x.moveTo(Lp, y); x.lineTo(Lp + w, y); x.stroke(); x.fillStyle = mut; x.fillText(pct(v), 4, y + 4); });
  x.setLineDash([]);
  const n = runs.length, dx = n > 1 ? w / (n - 1) : 0;
  const px = i => Lp + (n > 1 ? i * dx : w / 2), py = s => Tp + h - (s / 100) * h;
  x.strokeStyle = nav; x.lineWidth = 2; x.beginPath(); runs.forEach((r, i) => { i ? x.lineTo(px(i), py(r.score)) : x.moveTo(px(i), py(r.score)); }); x.stroke();
  runs.forEach((r, i) => { x.fillStyle = nav; x.beginPath(); x.arc(px(i), py(r.score), 3.5, 0, 7); x.fill(); });
  x.fillStyle = mut; x.fillText(num(1), Lp - 3, H - 6); if (n > 1) x.fillText(num(n), Lp + w - 8, H - 6);
}

/* ---------------- server account views ---------------- */
function renderLogin() {
  el.innerHTML = `<div class="card"><h2>${esc(t('loginTitle'))}</h2><div class="tip" style="margin-bottom:.7rem">${esc(t('loginTip'))}</div>
    <form class="form" id="lf" autocomplete="on">
      <input name="u" autocomplete="username" placeholder="${esc(t('user'))}" required minlength="3" maxlength="40">
      <input name="p" type="password" autocomplete="current-password" placeholder="${esc(t('pass'))}" required minlength="6" maxlength="200">
      ${INVITE ? `<input name="i" placeholder="${esc(t('invite'))}" maxlength="100">` : ''}
      <div class="err" id="lerr"></div>
      <div class="bar" style="margin-top:0"><button class="act" type="submit" data-m="login">${esc(t('login'))}</button>
      <button class="act ghost" type="submit" data-m="register">${esc(t('register'))}</button></div></form></div>`;
  const f = document.getElementById('lf'); let m = 'login';
  f.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { m = b.dataset.m; });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const body = { username: f.u.value.trim(), password: f.p.value, invite: f.i ? f.i.value.trim() : '' };
    const r = await fetch('api/' + m, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { document.getElementById('lerr').textContent = (j.error && (j.error[L] || j.error.en)) || 'Error'; return; }
    await loadServer(); view = 'home'; render();
  };
}
function renderAccount() {
  const local = loadLocal();
  el.innerHTML = `<div class="card"><h2>${esc(t('tabAccount'))}</h2><div class="tip">${esc(t('serverMode', USER))}</div>
    <div class="bar">${local.runs.length || local.fav.length || local.hard.length ? `<button class="act ghost" data-a="imp">${esc(t('importLocal'))}</button>` : ''}
    <button class="act" data-a="out">${esc(t('logout'))}</button></div></div>` + backupCard();
  wireBackup();
  const imp = el.querySelector('[data-a="imp"]');
  if (imp) imp.onclick = () => { const lo = loadLocal(); S.runs = S.runs.concat(lo.runs); S.fav = [...new Set(S.fav.concat(lo.fav))]; S.hard = [...new Set(S.hard.concat(lo.hard))]; save(); toast(t('imported')); render(); };
  el.querySelector('[data-a="out"]').onclick = async () => { await fetch('api/logout', { method: 'POST', credentials: 'same-origin' }); USER = null; S = blank(); render(); };
}

/* ---------------- boot ---------------- */
(async function boot() {
  applyTheme();
  if (await detectServer()) { MODE = 'server'; await loadServer(); }
  else { MODE = 'local'; S = loadLocal(); }
  if (S.cur) S.cur.active = false;
  render();
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (view === 'progress' && !S.cur?.active && viewRun === null) drawChart(S.runs); }, 150); });
})();
})();
