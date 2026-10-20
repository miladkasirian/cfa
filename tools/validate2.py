#!/usr/bin/env python3
"""Validate question-bank part files (item sets and constructed-response sets) and build docs/data/bank.js.

usage: python3 tools/validate2.py <dir-with-part-files> [more dirs...] [--build docs/data/bank.js]
Part files: E*.json (main exams) and I*.json (important exams). Each has "exams", "sets", "qs" and optionally "cr".
"""
import json, re, sys, os, glob, collections

STDS = {'I(A)', 'I(B)', 'I(C)', 'I(D)', 'I(E)', 'II(A)', 'II(B)', 'III(A)', 'III(B)', 'III(C)', 'III(D)', 'III(E)',
        'IV(A)', 'IV(B)', 'IV(C)', 'V(A)', 'V(B)', 'V(C)', 'VI(A)', 'VI(B)', 'VI(C)', 'VII(A)', 'VII(B)', 'AMC', 'CODE'}
LATIN = re.compile(r'[A-Za-z]')
WDIG = re.compile(r'[0-9]')
DASH = re.compile('[—–]')
PUNCT = re.compile(r'[^\w\s؀-ۿ‌]')

def norm(s):
    s = s.lower().replace('‌', ' ').replace('ي', 'ی').replace('ك', 'ک')
    return re.sub(r'\s+', ' ', PUNCT.sub(' ', s)).strip()

def check_bi(o, where, errs, warn, latin_ok=False):
    if not isinstance(o, dict) or not isinstance(o.get('en'), str) or not isinstance(o.get('fa'), str):
        errs.append(f'{where}: needs {{en,fa}} strings'); return
    if not o['en'].strip() or not o['fa'].strip():
        errs.append(f'{where}: empty text')
    if not latin_ok:
        m = LATIN.findall(o['fa'])
        if m: errs.append(f'{where}: Latin letters in fa: ' + ''.join(m)[:40] + ' | ' + o['fa'][:80])
    if WDIG.search(o['fa']): warn.append(f'{where}: western digits in fa')
    if DASH.search(o['en']) or DASH.search(o['fa']): errs.append(f'{where}: em/en dash')

def main():
    args = sys.argv[1:]
    build = None
    if '--build' in args:
        i = args.index('--build'); build = args[i + 1]; args = args[:i] + args[i + 2:]
    exams, sets, qs, cr = [], {}, [], {}
    errs, warn = [], []
    for d in args:
        for f in sorted(glob.glob(os.path.join(d, '[EI]*.json'))):
            try:
                j = json.load(open(f, encoding='utf-8'))
            except Exception as e:
                errs.append(f'{f}: bad json {e}'); continue
            exams += j.get('exams', []); sets.update(j.get('sets', {})); qs += j.get('qs', []); cr.update(j.get('cr', {}))
    ids = collections.Counter(q.get('id') for q in qs)
    for k, v in ids.items():
        if v > 1: errs.append(f'duplicate id {k}')
    letters = collections.Counter(); stdc = collections.Counter(); per_set = collections.Counter()
    for sid, s in sets.items():
        check_bi(s.get('title'), sid + '.title', errs, warn); check_bi(s.get('vig'), sid + '.vig', errs, warn)
    for q in qs:
        w = q.get('id', '?')
        if q.get('set') not in sets: errs.append(f'{w}: unknown set {q.get("set")}')
        per_set[q.get('set')] += 1
        for k in ('q', 'why', 'ref'): check_bi(q.get(k), f'{w}.{k}', errs, warn)
        o = q.get('o')
        if not isinstance(o, list) or len(o) != 3: errs.append(f'{w}: needs exactly 3 options')
        else:
            for i, x in enumerate(o): check_bi(x, f'{w}.o{i}', errs, warn)
        if q.get('a') not in (0, 1, 2): errs.append(f'{w}: bad answer index')
        else: letters['ABC'[q['a']]] += 1
        st = q.get('std')
        if not isinstance(st, list) or not st or any(s not in STDS for s in st): errs.append(f'{w}: bad std {st}')
        else: stdc[st[0]] += 1
        if not isinstance(q.get('k'), int): errs.append(f'{w}: k must be int')
    ncr_items = 0
    for cid, c in cr.items():
        check_bi(c.get('title'), cid + '.title', errs, warn); check_bi(c.get('vig'), cid + '.vig', errs, warn)
        items = c.get('items') or []
        if not 2 <= len(items) <= 4: errs.append(f'{cid}: needs 2 to 4 items')
        tot = 0
        for it in items:
            w = it.get('id', cid + '?'); ncr_items += 1
            for k in ('q', 'model', 'why', 'ref'): check_bi(it.get(k), f'{w}.{k}', errs, warn)
            st = it.get('std')
            if not isinstance(st, list) or not st or any(s not in STDS for s in st): errs.append(f'{w}: bad std {st}')
            parts = it.get('parts') or []
            if not parts: errs.append(f'{w}: no parts')
            for pi, p in enumerate(parts):
                pw = f'{w}.p{pi}'; t = p.get('type')
                check_bi(p.get('label'), pw + '.label', errs, warn)
                if not isinstance(p.get('pts'), int) or p['pts'] < 1: errs.append(f'{pw}: pts must be int >= 1')
                else: tot += p['pts']
                if t == 'yesno':
                    if p.get('answer') not in ('yes', 'no'): errs.append(f'{pw}: yesno answer')
                elif t == 'std':
                    a = p.get('answer')
                    if not isinstance(a, list) or not a or any(x not in STDS for x in a): errs.append(f'{pw}: std answer {a}')
                elif t == 'choice':
                    op = p.get('options')
                    if not isinstance(op, list) or not 2 <= len(op) <= 5: errs.append(f'{pw}: choice needs 2-5 options')
                    else:
                        for i, x in enumerate(op): check_bi(x, f'{pw}.o{i}', errs, warn)
                        if not isinstance(p.get('answer'), int) or not 0 <= p['answer'] < len(op): errs.append(f'{pw}: choice answer')
                elif t == 'number':
                    if not isinstance(p.get('answer'), (int, float)): errs.append(f'{pw}: number answer')
                elif t == 'keywords':
                    g = p.get('groups')
                    if not isinstance(g, list) or not g: errs.append(f'{pw}: groups'); continue
                    for gi, grp in enumerate(g):
                        if not isinstance(grp, dict) or not grp.get('en') or not grp.get('fa'): errs.append(f'{pw}.g{gi}: needs en and fa lists'); continue
                        for x in grp['fa']:
                            if LATIN.search(x): errs.append(f'{pw}.g{gi}: Latin in fa synonym {x}')
                    need = p.get('need')
                    if not isinstance(need, int) or not 1 <= need <= len(g): errs.append(f'{pw}: need')
                else:
                    errs.append(f'{pw}: unknown type {t}')
        if tot != 12: errs.append(f'{cid}: points add to {tot}, not 12')
    seen = set()
    for e in exams:
        key = (e.get('group', 'main'), e.get('n'))
        if key in seen: errs.append(f'duplicate exam {key}')
        seen.add(key)
        for sid in e.get('sets', []):
            if sid not in sets: errs.append(f'exam {key}: unknown set {sid}')
        for cid in e.get('cr', []):
            if cid not in cr: errs.append(f'exam {key}: unknown essay set {cid}')
    for sid in sets:
        if per_set[sid] < 4: warn.append(f'{sid}: only {per_set[sid]} questions')
    print(f'exams {len(exams)}  item sets {len(sets)}  questions {len(qs)}  essay sets {len(cr)}  essay items {ncr_items}')
    print('answer letters', dict(letters))
    print('primary standard counts', dict(sorted(stdc.items())))
    for x in warn[:40]: print('WARN', x)
    for x in errs[:200]: print('ERR', x)
    print(f'{len(errs)} errors, {len(warn)} warnings')
    if build and not errs:
        exams.sort(key=lambda e: (e.get('group', 'main') != 'main', e['n']))
        qs.sort(key=lambda q: (q['set'], q['k']))
        out = {'version': 2, 'exams': exams, 'sets': sets, 'qs': qs, 'cr': cr}
        os.makedirs(os.path.dirname(build), exist_ok=True)
        with open(build, 'w', encoding='utf-8') as fh:
            fh.write('/* Question bank: generated by tools/validate2.py. */\nwindow.BANK=')
            json.dump(out, fh, ensure_ascii=False, separators=(',', ':'))
            fh.write(';\n')
        print('built', build, os.path.getsize(build), 'bytes')
    sys.exit(1 if errs else 0)

if __name__ == '__main__':
    main()
