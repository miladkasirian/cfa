// Try the app's essay checker on a typed answer, or check every keyword part of a file against its model answers.
// usage: node tools/grade_try.js <file.json> <itemId> <partIndex> "<typed answer>"
//        node tools/grade_try.js <file.json> --models      (each keywords part must get full credit from both model answers)
require(require('path').join(__dirname, '..', 'docs', 'grader.js'));
const G = globalThis.CFAG; const fs = require('fs');
const [file, a1, a2, a3] = process.argv.slice(2);
const j = JSON.parse(fs.readFileSync(file, 'utf8')); const items = {};
Object.values(j.cr || {}).forEach(c => c.items.forEach(it => { items[it.id] = it; }));
if (a1 === '--models') {
  let bad = 0;
  for (const it of Object.values(items)) it.parts.forEach((p, i) => {
    if (p.type !== 'keywords') return;
    for (const l of ['en', 'fa']) { const r = G.gradePart(p, it.model[l]); if (r.ok !== 1) { bad++; console.log(`${it.id} part ${i} ${l}: model answer matches ${r.hit.length} of ${p.need} groups`); } }
  });
  console.log(bad ? `${bad} problems` : 'all keyword parts are matched by the model answers'); process.exit(bad ? 1 : 0);
}
const it = items[a1]; if (!it) { console.log('no such item'); process.exit(1); }
const p = it.parts[+a2]; const r = G.gradePart(p, a3);
console.log(JSON.stringify({ type: p.type, result: r, std_detected: p.type === 'std' ? [...G.parseStd(a3)] : undefined }));
