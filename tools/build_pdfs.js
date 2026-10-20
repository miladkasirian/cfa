// Make the downloadable PDF files (answers under every question) and zip them per tab and language.
// usage: node tools/build_pdfs.js <docs dir>   (needs playwright; serves the docs folder on a local port)
const path = require('path'), fs = require('fs'), http = require('http'), { execFileSync } = require('child_process');
const { chromium } = require(process.env.PW || 'playwright');
const DOCS = path.resolve(process.argv[2] || 'docs');
const OUT = path.join(DOCS, 'downloads');
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'cfa-pdf-'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  const p = path.join(DOCS, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!p.startsWith(DOCS) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
const FA = '۰۱۲۳۴۵۶۷۸۹';
const faNum = (s) => String(s).replace(/[0-9]/g, (d) => FA[d]);
const safe = (s) => s.replace(/[\/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);

(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/index.html`;
  global.window = {}; eval(fs.readFileSync(path.join(DOCS, 'data/bank.js'), 'utf8')); eval(fs.readFileSync(path.join(DOCS, 'data/learn.js'), 'utf8'));
  const B = window.BANK, LEARN = window.LEARN;
  const ex = (g) => B.exams.filter((e) => (e.group || 'main') === g).sort((a, b) => a.n - b.n);
  const stds = [...new Set(B.qs.flatMap((q) => q.std || []).concat(Object.values(B.cr || {}).flatMap((c) => c.items.flatMap((i) => i.std || []))))];
  const ORDER = ['I(A)', 'I(B)', 'I(C)', 'I(D)', 'I(E)', 'II(A)', 'II(B)', 'III(A)', 'III(B)', 'III(C)', 'III(D)', 'III(E)', 'IV(A)', 'IV(B)', 'IV(C)', 'V(A)', 'V(B)', 'V(C)', 'VI(A)', 'VI(B)', 'VI(C)', 'VII(A)', 'VII(B)', 'AMC', 'CODE'];
  stds.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const jobs = { exams: ex('main').map((e) => ['exam:' + e.n, String(e.n).padStart(3, '0')]),
    imp: ex('imp').map((e) => ['imp:' + e.n, String(e.n).padStart(2, '0')]),
    practice: stds.map((s, i) => ['std:' + s, String(i + 1).padStart(2, '0')]),
    learn: LEARN.map((n, i) => ['learn:' + n.id, String(i + 1)]) };
  const browser = await chromium.launch();
  const manifest = {};
  for (const lang of ['en', 'fa']) {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 } });
    await ctx.addInitScript((l) => { try { localStorage.setItem('cfa-ethics-prefs', JSON.stringify({ lang: l, theme: 'light' })); } catch (e) {} }, lang);
    const page = await ctx.newPage();
    await page.goto(base + '#/exams'); await page.waitForSelector('#tabs button');
    for (const [tab, list] of Object.entries(jobs)) {
      if (!list.length) continue;
      const dir = path.join(TMP, lang, tab); fs.mkdirSync(dir, { recursive: true });
      for (const [arg, idx] of list) {
        await page.evaluate((a) => { delete document.body.dataset.printReady; location.hash = '#/print/' + encodeURIComponent(a); }, arg);
        await page.waitForSelector('body[data-print-ready="1"]');
        await page.evaluate(() => document.fonts.ready);
        const title = await page.title();
        const name = safe((lang === 'fa' ? faNum(idx) : idx) + ' ' + title) + '.pdf';
        await page.pdf({ path: path.join(dir, name), format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
          displayHeaderFooter: true, headerTemplate: '<span></span>',
          footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#888"><span class="pageNumber"></span> / <span class="totalPages"></span></div>` });
      }
      const zipName = `${tab}-${lang}.zip`; const zp = path.join(TMP, zipName);
      execFileSync('python3', ['-c', `import zipfile,os,sys
d,z=sys.argv[1],sys.argv[2]
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as f:
  for n in sorted(os.listdir(d)): f.write(os.path.join(d,n),n)`, dir, zp]);
      fs.mkdirSync(OUT, { recursive: true }); fs.copyFileSync(zp, path.join(OUT, zipName));
      (manifest[tab] = manifest[tab] || {})[lang] = { file: zipName, bytes: fs.statSync(zp).size, count: list.length };
      console.log(lang, tab, list.length, 'files', fs.statSync(zp).size, 'bytes');
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  await browser.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
