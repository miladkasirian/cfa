#!/usr/bin/env python3
"""Build the learning tree (docs/data/learn.js) from the bilingual study notes in notes/.

The tree goes from a few top categories down to the smallest section:
  category -> (group) -> topic -> section
Every node has a bilingual title and an optional bilingual Markdown body.
English and Persian files are paired heading by heading (they share the same structure).

usage: python3 tools/build_learn.py notes docs/data/learn.js [outline.md]
"""
import json, re, sys, os

FA_DIG = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')

def sections(path):
    """Return list of (level, title, body) for every heading; body = text until next heading."""
    out, cur = [], None
    pre = []
    for line in open(path, encoding='utf-8').read().split('\n'):
        m = re.match(r'^(#{1,4})\s+(.*)$', line)
        if m:
            if cur: out.append(cur)
            cur = [len(m.group(1)), m.group(2).strip(), []]
        elif cur:
            cur[2].append(line)
        else:
            pre.append(line)
    if cur: out.append(cur)
    return [(l, t, '\n'.join(b).strip().strip('-').strip()) for l, t, b in out]

def clean_title(t):
    t = re.sub(r'^\s*(\d+(\.\d+)*|[۰-۹]+([.٫][۰-۹]+)*)\s+', '', t)  # leading section numbers
    t = re.sub(r'\s*\((curriculum|کتاب)[^)]*\)\s*$', '', t)            # trailing line tags
    return t.strip()

def pair(en_path, fa_path):
    e, f = sections(en_path), sections(fa_path)
    if len(e) != len(f):
        raise SystemExit(f'heading mismatch {en_path} {len(e)} vs {fa_path} {len(f)}')
    out = []
    for (le, te, be), (lf, tf, bf) in zip(e, f):
        if le != lf:
            raise SystemExit(f'level mismatch in {en_path}: {te} / {tf}')
        out.append({'lvl': le, 't': {'en': clean_title(te), 'fa': clean_title(tf)}, 'b': {'en': be, 'fa': bf}, 'raw': te})
    return out

def nest(items, base_level):
    """Turn a flat heading list into a tree; items deeper than base_level become children."""
    root = []; stack = []
    for it in items:
        node = {'t': it['t'], 'b': it['b'], 'c': [], 'raw': it['raw'], 'lvl': it['lvl']}
        while stack and stack[-1]['lvl'] >= it['lvl']:
            stack.pop()
        (stack[-1]['c'] if stack else root).append(node)
        stack.append(node)
    return root

STD_RE = re.compile(r'\b(I|II|III|IV|V|VI|VII)\(([A-E])\)')
GROUPS = [
    ('I', 'Standard I: Professionalism', 'استاندارد ۱: حرفه‌ای‌گری'),
    ('II', 'Standard II: Integrity of Capital Markets', 'استاندارد ۲: یکپارچگی بازارهای سرمایه'),
    ('III', 'Standard III: Duties to Clients', 'استاندارد ۳: وظایف در برابر مشتریان'),
    ('IV', 'Standard IV: Duties to Employers', 'استاندارد ۴: وظایف در برابر کارفرما'),
    ('V', 'Standard V: Investment Analysis, Recommendations, and Actions', 'استاندارد ۵: تحلیل سرمایه‌گذاری، توصیه‌ها و اقدامات'),
    ('VI', 'Standard VI: Conflicts of Interest', 'استاندارد ۶: تضاد منافع'),
    ('VII', 'Standard VII: Responsibilities as a CFA Institute Member or CFA Candidate', 'استاندارد ۷: مسئولیت‌ها به عنوان عضو مؤسسه سی اف ای یا داوطلب سی اف ای'),
]

def main():
    src, out = sys.argv[1], sys.argv[2]
    outline = sys.argv[3] if len(sys.argv) > 3 else None
    P = lambda n: (os.path.join(src, f'EN_part{n}.md'), os.path.join(src, f'FA_part{n}.md'))
    parts = {n: pair(*P(n)) for n in ['1', '2', '3a', '3b', '4', '5', '6']}

    def part_tree(n):
        items = parts[n]
        top = items[0]
        return top, nest(items[1:], 2)

    tree = []
    # 1. exam and question models
    t1, c1 = part_tree('1')
    tree.append({'t': {'en': 'The exam, question models and strategy', 'fa': 'امتحان، مدل‌های سوال و راهبرد'}, 'b': t1['b'], 'c': c1})
    # 2. foundations (Part 2 sections before the first sub-standard)
    t2, c2 = part_tree('2')
    found = [n for n in c2 if not STD_RE.search(n['raw'])]
    stds2 = [n for n in c2 if STD_RE.search(n['raw'])]
    tree.append({'t': {'en': 'Foundations: the Code of Ethics and the Standards', 'fa': 'پایه‌ها: کد اخلاق و استانداردها'}, 'b': t2['b'], 'c': found})
    # 3. the standards, grouped I to VII
    _, c3a = part_tree('3a')
    c3b = nest(parts['3b'], 2)
    stdnodes = stds2 + [n for n in c3a + c3b if STD_RE.search(n['raw'])]
    extra = [n for n in c3a + c3b if not STD_RE.search(n['raw'])]
    groups = []
    for g, en, fa in GROUPS:
        kids = []
        for n in stdnodes:
            m = STD_RE.search(n['raw'])
            if m.group(1) == g:
                n['std'] = f'{m.group(1)}({m.group(2)})'
                if not n['t']['en'].startswith('Standard'): n['t']['en'] = 'Standard ' + n['t']['en']
                kids.append(n)
        groups.append({'t': {'en': en, 'fa': fa}, 'b': {'en': '', 'fa': ''}, 'c': kids})
    groups += extra
    tree.append({'t': {'en': 'Standards of Professional Conduct I to VII', 'fa': 'استانداردهای رفتار حرفه‌ای ۱ تا ۷'},
                 'b': {'en': '', 'fa': ''}, 'c': groups})
    # 4. L3 cases, 5. AMC, 6. traps
    t4, c4 = part_tree('4')
    tree.append({'t': {'en': 'Level III application cases', 'fa': 'موردهای کاربردی سطح سه'}, 'b': t4['b'], 'c': c4})
    t5, c5 = part_tree('5')
    tree.append({'t': {'en': 'Asset Manager Code of Professional Conduct', 'fa': 'کد رفتار حرفه‌ای مدیران دارایی'}, 'b': t5['b'], 'c': c5, 'std': 'AMC'})
    t6, c6 = part_tree('6')
    tree.append({'t': {'en': 'Traps and fine distinctions', 'fa': 'دام‌ها و تفاوت‌های ظریف'}, 'b': t6['b'], 'c': c6})

    # ids, cleanup
    count = [0]
    def fin(node, pid):
        count[0] += 1
        node['id'] = pid
        for k in ('raw', 'lvl'):
            node.pop(k, None)
        if not node['c']:
            del node['c']
        else:
            for i, ch in enumerate(node['c']):
                fin(ch, f'{pid}.{i + 1}')
        if not (node['b']['en'] or node['b']['fa']):
            del node['b']
    for i, n in enumerate(tree):
        fin(n, str(i + 1))

    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write('/* Learning tree: generated by tools/build_learn.py from notes/. */\nwindow.LEARN=')
        json.dump(tree, fh, ensure_ascii=False, separators=(',', ':'))
        fh.write(';\n')
    print('nodes', count[0], 'bytes', os.path.getsize(out))

    if outline:
        lines = ['# CFA Level III Ethics: how everything is classified', '',
                 'From a few top categories down to the smallest topic. The same tree is in the app under "Learn".', '']
        def walk(n, d):
            lines.append('  ' * d + f"- {n['t']['en']}  /  {n['t']['fa']}")
            for ch in n.get('c', []):
                walk(ch, d + 1)
        for n in tree:
            walk(n, 0)
        open(outline, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
        print('outline lines', len(lines))

if __name__ == '__main__':
    main()
