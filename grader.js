/* Essay answer checker for the CFA Ethics app (shared by the app and the build tools).
   Capital and small letters do not matter; small typos, both languages and Persian digits are accepted. */
(function (root) {
'use strict';
const toAscii = (s) => String(s || '').replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x06F0).replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x0660);
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
const AR_DIAC = /[ً-ٰٟۖ-ۭ]/g;
function nrm(s) {
  s = toAscii(String(s == null ? '' : s)).toLowerCase().replace(/[’‘`´]/g, "'")
    .replace(/\bwon't\b/g, 'will not').replace(/\bcan't\b/g, 'can not').replace(/\bshan't\b/g, 'shall not').replace(/n't\b/g, ' not')
    .replace(/ي/g, 'ی').replace(/ى/g, 'ی').replace(/ك/g, 'ک').replace(/[ۀة]/g, 'ه').replace(/[أإٱآ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ی')
    .replace(AR_DIAC, '').replace(/‌/g, ' ').replace(/[‎‏ـ]/g, '');
  return s.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
function lev(a, b, max) { // edit distance; swapping two neighbouring letters counts as one typo
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let pp = null, prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let best = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, pp[j - 2] + 1);
      cur[j] = v; best = Math.min(best, v);
    }
    if (best > max) return max + 1; pp = prev; prev = cur;
  }
  return prev[b.length];
}
const NEG = ['in', 'un', 'non', 'im', 'ir', 'il', 'dis', 'mis', 'غیر', 'نا'];
function tokMatch(w, tok) { // w: expected word, tok: typed word
  if (w === tok) return true;
  // "incorrect" is not "correct", "unsuitable" is not "suitable"
  const lo = w.length > tok.length ? w : tok, sh = w.length > tok.length ? tok : w;
  if (lo.endsWith(sh) && NEG.includes(lo.slice(0, lo.length - sh.length))) return false;
  if (sh.length >= 4 && NEG.some(p => lo.startsWith(p) && lev(lo.slice(p.length), sh, 1) <= 1) && !NEG.some(p => sh.startsWith(p))) return false;
  const ml = Math.max(w.length, tok.length), sl = Math.min(w.length, tok.length);
  if (sl >= 4 && (tok.startsWith(w) || w.startsWith(tok)) && ml - sl <= 3) return true; // proportional / proportionally, plural endings
  const allow = ml >= 9 ? 2 : ml >= 5 ? 1 : 0;
  return allow > 0 && lev(w, tok, allow) <= allow;
}
const STOP = new Set(['of', 'and', 'the', 'to', 'with', 'in', 'for', 'a', 'an', 'on', 'standard', 'std', 'cfa', 'institute', 'و', 'از', 'به', 'با', 'در', 'برای', 'استاندارد', 'یا']);
const KEEP = new Set(['cfa', 'institute', 'standard']); // ignored when naming a standard, but they matter inside a justification
const words = (s) => nrm(s).split(' ').filter(Boolean);
function phraseIn(ph, text, toks) { // a synonym phrase is found in the typed text
  const p = nrm(ph); if (!p) return false;
  if ((' ' + text + ' ').includes(' ' + p + ' ')) return true;
  const ps = p.replace(/ /g, ''); // "pro rata" written as "prorata" or the other way round, but never inside a longer word
  for (let i = 0; i < toks.length; i++) { let j = ''; for (let k = i; k < Math.min(toks.length, i + 3); k++) { j += toks[k]; if ((k > i) !== (ps !== p)) { if (j === ps || (ps.length >= 7 && lev(ps, j, 1) <= 1)) return true; } } }
  const pw = p.split(' ').filter(w => !STOP.has(w) || KEEP.has(w)); if (!pw.length) return false;
  return pw.every(w => toks.some(tk => tokMatch(w, tk)));
}
// standard names and short names people use, in both languages
const STD_ALIAS = {
  'I(A)': ['knowledge of the law', 'knowledge law'], 'I(B)': ['independence and objectivity', 'independence', 'objectivity', 'استقلال', 'بی طرفی'],
  'I(C)': ['misrepresentation', 'plagiarism', 'ارائه نادرست', 'سرقت ادبی'], 'I(D)': ['misconduct', 'رفتار نادرست'], 'I(E)': ['competence', 'صلاحیت'],
  'II(A)': ['material nonpublic information', 'material non public information', 'material nonpublic info', 'material non public info', 'nonpublic information', 'insider trading', 'trading on inside information', 'mnpi', 'اطلاعات مهم غیر عمومی', 'اطلاعات غیر عمومی', 'insider information', 'inside information', 'اطلاعات نهانی', 'اطلاعات محرمانه مهم'],
  'II(B)': ['market manipulation', 'manipulation', 'دستکاری'], 'III(A)': ['loyalty prudence and care', 'prudence and care', 'duty to clients', 'loyalty to clients', 'وفاداری به مشتری'],
  'III(B)': ['fair dealing', 'رفتار منصفانه', 'برخورد منصفانه'], 'III(C)': ['suitability', 'تناسب', 'مناسب بودن'],
  'III(D)': ['performance presentation', 'ارائه عملکرد'], 'III(E)': ['preservation of confidentiality', 'confidentiality', 'محرمانگی', 'حفظ اسرار'],
  'IV(A)': ['loyalty', 'loyalty to employer', 'duty to employer', 'وفاداری به کارفرما'], 'IV(B)': ['additional compensation arrangements', 'additional compensation', 'جبران خدمت اضافی', 'درآمد اضافی'],
  'IV(C)': ['responsibilities of supervisors', 'supervisor responsibilities', 'supervision', 'سرپرستان', 'مسئولیت سرپرست'],
  'V(A)': ['diligence and reasonable basis', 'reasonable basis', 'diligence', 'مبنای معقول', 'سخت کوشی'],
  'V(B)': ['communication with clients', 'communication', 'ارتباط با مشتریان'], 'V(C)': ['record retention', 'records', 'نگهداری سوابق', 'سوابق'],
  'VI(A)': ['disclosure of conflicts', 'avoid or disclose conflicts', 'conflicts of interest', 'conflict', 'تضاد منافع', 'افشای تضاد منافع'],
  'VI(B)': ['priority of transactions', 'اولویت معاملات'], 'VI(C)': ['referral fees', 'referral fee', 'کارمزد معرفی'],
  'VII(A)': ['conduct as participants in cfa institute programs', 'conduct as participants', 'exam conduct', 'رفتار شرکت کننده'],
  'VII(B)': ['reference to cfa institute the cfa designation and the cfa program', 'reference to the cfa designation', 'cfa designation', 'designation', 'اشاره به عنوان'],
  'AMC': ['asset manager code', 'asset manager code of professional conduct', 'amc', 'کد مدیران دارایی', 'ای ام سی'], 'CODE': ['code of ethics', 'کد اخلاق']
};
const RN = { i: 'I', ii: 'II', iii: 'III', iv: 'IV', v: 'V', vi: 'VI', vii: 'VII', 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII',
  'یک': 'I', 'دو': 'II', 'سه': 'III', 'چهار': 'IV', 'پنج': 'V', 'شش': 'VI', 'هفت': 'VII' };
const FA_L = { 'ا': 'A', 'الف': 'A', 'بی': 'B', 'ب': 'B', 'سی': 'C', 'س': 'C', 'دی': 'D', 'د': 'D', 'ای': 'E' };
function parseStd(raw) { // returns the set of standard codes the typed text names
  const s = nrm(raw); const found = new Set(); if (!s) return found;
  const add = (r, l) => { const c = RN[r] + '(' + l + ')'; if (STD[c]) found.add(c); };
  let m; const re = /(?:^|\s)(vii|vi|iv|iii|ii|i|v|[1-7])\s?([a-e])(?=\s|$)/g;
  while ((m = re.exec(s))) add(m[1], m[2].toUpperCase());
  const ref = /(?:^|\s)([1-7]|یک|دو|سه|چهار|پنج|شش|هفت)\s?(الف|ا|بی|ب|سی|س|دی|د|ای)(?=\s|$)/g;
  while ((m = ref.exec(s))) add(m[1], FA_L[m[2]]);
  if (found.size) return found;
  const toks = s.split(' ');
  let best = 0; let bestC = [];
  STD_ORDER.forEach(c => {
    const names = [STD[c][0], STD[c][1]].concat(STD_ALIAS[c] || []);
    names.forEach(nm => {
      const nw = words(nm).filter(w => !STOP.has(w)); if (!nw.length) return;
      const hit = nw.filter(w => toks.some(tk => tokMatch(w, tk))).length; const sc = hit / nw.length + (hit >= 2 ? 0.01 * hit : 0);
      if (hit && sc >= 0.75) { if (sc > best + 1e-9) { best = sc; bestC = [c]; } else if (Math.abs(sc - best) < 1e-9 && !bestC.includes(c)) bestC.push(c); }
    });
  });
  bestC.forEach(c => found.add(c));
  return found;
}
const NUMW = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100,
  'صفر': 0, 'یک': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5, 'شش': 6, 'هفت': 7, 'هشت': 8, 'نه': 9, 'ده': 10, 'یازده': 11, 'دوازده': 12, 'سیزده': 13, 'چهارده': 14, 'پانزده': 15, 'شانزده': 16, 'هفده': 17, 'هجده': 18, 'نوزده': 19, 'بیست': 20, 'سی': 30, 'چهل': 40, 'پنجاه': 50, 'صد': 100 };
function parseNum(raw) {
  const s = toAscii(String(raw || '')).replace(/٫/g, '.').replace(/[,٬،']/g, '').replace(/(\d)\s+(?=\d{3}\b)/g, '$1');
  const m = s.match(/-?\d+(?:\.\d+)?/); if (m) return parseFloat(m[0]);
  const w = words(raw).find(x => x in NUMW); return w != null ? NUMW[w] : null;
}
const blankVal = (v) => v == null || (typeof v === 'string' && !v.trim());
function gradePart(p, v) { // -> {got, max, ok: 1 right, 0.5 partial, 0 wrong, hit: matched keyword groups}
  const max = p.pts; const r = { got: 0, max, ok: 0 };
  if (blankVal(v)) return r;
  if (p.type === 'yesno') { r.ok = v === p.answer ? 1 : 0; }
  else if (p.type === 'choice') { r.ok = +v === p.answer ? 1 : 0; }
  else if (p.type === 'number') { const n = parseNum(v); r.ok = n != null && Math.abs(n - p.answer) <= (p.tol || 0) + 1e-9 ? 1 : 0; }
  else if (p.type === 'std') {
    const got = parseStd(v); const want = p.answer.includes('CODE') ? p.answer : p.answer;
    r.ok = got.size > 0 && [...got].every(c => want.includes(c)) ? 1 : 0;
    if (!r.ok && got.size > 1 && [...got].some(c => want.includes(c))) r.amb = true;
  } else if (p.type === 'keywords') {
    const text = nrm(v); const toks = text.split(' ');
    r.hit = p.groups.map((g, gi) => (g.en.concat(g.fa).some(ph => phraseIn(ph, text, toks)) ? gi : -1)).filter(x => x >= 0);
    const need = p.need || p.groups.length; const frac = Math.min(1, r.hit.length / need);
    r.got = Math.round(max * frac * 2) / 2; r.ok = frac >= 1 ? 1 : frac > 0 ? 0.5 : 0; return r;
  }
  r.got = r.ok ? max : 0; return r;
}

root.CFAG = { STD, STD_ORDER, nrm, parseStd, parseNum, gradePart, blankVal, toAscii };
})(typeof window !== 'undefined' ? window : globalThis);
