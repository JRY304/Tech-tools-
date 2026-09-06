/* End-to-end checks for the Scribe word processor.
   Runs the real app in Chromium, exercises editing, then round-trips a .docx.
   Usage: node tests/e2e.mjs   (Playwright + Chromium come from the image) */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const here = dirname(fileURLToPath(import.meta.url));
const appUrl = 'file://' + join(here, '..', 'word', 'index.html');
const outDir = join(here, '..', '.test-out');
mkdirSync(outDir, { recursive: true });

let failures = 0;
const ok = (name, cond, extra = '') => {
  if (cond) console.log('  PASS  ' + name);
  else { failures++; console.log('  FAIL  ' + name + (extra ? ' :: ' + extra : '')); }
};

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8Dwn4EIwDiqcFQhAFXsBv6XKGyIAAAAAElFTkSuQmCC';

const SAMPLE = `
<h1>Quarterly report</h1>
<p style="text-align:center"><span style="font-size:14pt;color:#B22222"><strong>Bold red 14pt</strong></span> and <em>italic</em> and <u>underline</u> and <s>struck</s> and x<sup>2</sup>.</p>
<h2>Findings</h2>
<ul><li>First bullet</li><li>Second bullet<ul><li>Nested bullet</li></ul></li></ul>
<ol><li>Step one</li><li>Step two</li></ol>
<blockquote>A quotation that should carry the Quote style.</blockquote>
<pre>const x = 1;</pre>
<p>A <a href="https://example.com/report">link to the source</a> and a <span class="cmt" data-cid="c-1">commented phrase</span>.</p>
<table><thead><tr><th>Region</th><th>Revenue</th></tr></thead><tbody><tr><td>APAC</td><td>1,200</td></tr><tr><td>EMEA</td><td>980</td></tr></tbody></table>
<div class="pagebreak" contenteditable="false"></div>
<p>Text after the page break with an image: <img src="${PNG}" width="10" height="10" alt="dot"></p>
<hr>
<p style="margin-left:48px;line-height:2">Indented, double spaced.</p>
`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
const consoleErrors = [];
page.on('pageerror', e => consoleErrors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

await page.goto(appUrl);
await page.waitForFunction(() => window.W && window.W.editor && window.W.editor.node);

console.log('\n1. Boot');
ok('app loads with no page errors', consoleErrors.length === 0, consoleErrors.join(' | '));
ok('all modules registered', await page.evaluate(() =>
  ['util', 'zip', 'ui', 'editor', 'format', 'tables', 'outline', 'find', 'comments', 'docxExport', 'docxImport', 'store', 'files']
    .every(k => !!window.W[k])));

console.log('\n2. Editing and formatting');
await page.evaluate(() => {
  W.editor.setHTML('<p>hello world</p>');
  const p = W.editor.node.querySelector('p');
  const r = document.createRange();
  r.setStart(p.firstChild, 0); r.setEnd(p.firstChild, 5);
  W.editor.setRange(r);
  W.format.exec('bold');
});
ok('bold applies to a selection', await page.evaluate(() => /<(b|strong)>hello<\/(b|strong)>/i.test(W.editor.node.innerHTML)
  || /font-weight:\s*bold/i.test(W.editor.node.innerHTML)), await page.evaluate(() => W.editor.node.innerHTML));

await page.evaluate(() => {
  W.editor.setHTML('<p>size me</p>');
  const p = W.editor.node.querySelector('p');
  const r = document.createRange();
  r.selectNodeContents(p);
  W.editor.setRange(r);
  W.format.setFontSize(24);
});
ok('font size writes a pt span', await page.evaluate(() => /font-size:\s*24pt/.test(W.editor.node.innerHTML)),
  await page.evaluate(() => W.editor.node.innerHTML));

await page.evaluate(() => { W.editor.setHTML('<p>x</p>'); W.editor.selectNodeContentsEnd(W.editor.node.querySelector('p')); W.tables.insert(3, 4); });
ok('table insert makes 3x4 with a header row', await page.evaluate(() => {
  const t = W.editor.node.querySelector('table');
  return !!t && t.querySelectorAll('tr').length === 3 && t.querySelectorAll('tr')[0].cells.length === 4 && !!t.tHead;
}));
ok('add column extends every row', await page.evaluate(() => {
  const cell = W.editor.node.querySelector('td');
  W.editor.selectNodeContentsEnd(cell);
  W.tables.currentCell();
  document.querySelector('[data-act="col-right"]').click();
  const t = W.editor.node.querySelector('table');
  return Array.from(t.querySelectorAll('tr')).every(r => r.cells.length === 5);
}));

console.log('\n3. Find and replace');
await page.evaluate(() => {
  W.editor.setHTML('<p>alpha beta alpha</p><p>ALPHA</p>');
  document.querySelector('#findbar').hidden = false;
  document.querySelector('#find-input').value = 'alpha';
  document.querySelector('#find-case').checked = false;
  document.querySelector('#find-input').dispatchEvent(new Event('input'));
});
await page.waitForTimeout(300);
ok('finds 3 case-insensitive hits', await page.evaluate(() => document.querySelectorAll('.find-hit').length === 3),
  await page.evaluate(() => document.querySelectorAll('.find-hit').length + ' hits'));
await page.evaluate(() => {
  document.querySelector('#replace-input').value = 'omega';
  document.querySelector('[data-act="replace-all"]').click();
});
ok('replace all rewrites every hit', await page.evaluate(() =>
  !/alpha/i.test(W.editor.node.innerText) && (W.editor.node.innerText.match(/omega/gi) || []).length === 3),
  await page.evaluate(() => W.editor.node.innerText));

console.log('\n4. Counters and outline');
await page.evaluate(() => W.editor.setHTML('<h1>Title</h1><h2>Sub</h2><p>one two three four five</p>'));
await page.waitForTimeout(400);
ok('word count is right', await page.evaluate(() => document.querySelector('#st-words').textContent.startsWith('7 words')),
  await page.evaluate(() => document.querySelector('#st-words').textContent));
ok('outline lists both headings', await page.evaluate(() => {
  W.outline.build();
  return document.querySelectorAll('#outline a').length === 2;
}));

console.log('\n5. DOCX export');
const built = await page.evaluate(async (sample) => {
  W.editor.setHTML(sample);
  W.comments.setAll({ 'c-1': { id: 'c-1', author: 'Reviewer', text: 'Please check this figure.', date: new Date().toISOString(), quote: 'commented phrase' } });
  const blob = await W.docxExport.toBlob({
    node: W.editor.node, title: 'Quarterly report', author: 'Reviewer',
    page: W.editor.getPage(), comments: W.comments.all(),
    header: 'Acme internal', footer: 'Confidential', pageNumbers: true, stats: W.editor.stats()
  });
  const buf = await blob.arrayBuffer();
  const parts = await W.zip.unzip(buf);
  const names = Object.keys(parts).sort();
  const xmlErrors = [];
  names.filter(n => /\.(xml|rels)$/.test(n)).forEach(n => {
    const doc = new DOMParser().parseFromString(W.zip.text(parts[n]), 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) xmlErrors.push(n);
  });
  return {
    b64: W.zip.base64(new Uint8Array(buf)),
    names,
    xmlErrors,
    documentXml: W.zip.text(parts['word/document.xml']),
    relsXml: W.zip.text(parts['word/_rels/document.xml.rels']),
    commentsXml: parts['word/comments.xml'] ? W.zip.text(parts['word/comments.xml']) : '',
    footerXml: parts['word/footer1.xml'] ? W.zip.text(parts['word/footer1.xml']) : '',
    numberingXml: W.zip.text(parts['word/numbering.xml'])
  };
}, SAMPLE);

writeFileSync(join(outDir, 'sample.docx'), Buffer.from(built.b64, 'base64'));
console.log('  wrote ' + join(outDir, 'sample.docx'));

const need = ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/_rels/document.xml.rels',
  'word/styles.xml', 'word/numbering.xml', 'word/comments.xml', 'word/header1.xml', 'word/footer1.xml',
  'docProps/core.xml', 'docProps/app.xml'];
ok('package holds every required part', need.every(n => built.names.includes(n)), built.names.join(', '));
ok('an image part is embedded', built.names.some(n => n.startsWith('word/media/image')), built.names.join(', '));
ok('every XML part parses', built.xmlErrors.length === 0, built.xmlErrors.join(', '));

const d = built.documentXml;
ok('heading uses pStyle', d.includes('<w:pStyle w:val="Heading1"/>'));
ok('bold run present', d.includes('<w:b/>'));
ok('colour + size carried', d.includes('<w:color w:val="B22222"/>') && d.includes('<w:sz w:val="28"/>'));
ok('centre alignment carried', d.includes('<w:jc w:val="center"/>'));
ok('superscript carried', d.includes('<w:vertAlign w:val="superscript"/>'));
ok('bullets and numbering emitted', (d.match(/<w:numPr>/g) || []).length >= 5);
ok('two distinct numbering ids used', new Set((d.match(/<w:numId w:val="(\d+)"\/>/g) || [])).size >= 2);
ok('quote style carried', d.includes('<w:pStyle w:val="Quote"/>'));
ok('code style carried', d.includes('<w:pStyle w:val="Code"/>'));
ok('table with header row', d.includes('<w:tbl>') && d.includes('<w:tblHeader/>'));
ok('page break as w:br type=page', d.includes('<w:br w:type="page"/>'));
ok('image drawing emitted', d.includes('<w:drawing>') && d.includes('<a:blip r:embed='));
ok('hyperlink relationship linked', d.includes('<w:hyperlink r:id=') && built.relsXml.includes('example.com/report'));
ok('comment anchors emitted', d.includes('<w:commentRangeStart w:id="0"/>') && d.includes('<w:commentReference w:id="0"/>'));
ok('comment text stored', built.commentsXml.includes('Please check this figure.'));
ok('footer carries PAGE field', built.footerXml.includes('w:instr=" PAGE "'));
ok('section size is A4 twips', d.includes('<w:pgSz w:w="11906" w:h="16838"'));
ok('indent + line spacing carried', d.includes('<w:ind w:left="720"/>') && d.includes('w:line="480"'));
ok('numbering defines both bullet and decimal', built.numberingXml.includes('w:numFmt w:val="bullet"') && built.numberingXml.includes('w:numFmt w:val="decimal"'));

console.log('\n6. DOCX round trip (import what we exported)');
const back = await page.evaluate(async (b64) => {
  const bytes = W.zip.fromBase64(b64);
  const doc = await W.docxImport.fromArrayBuffer(bytes.buffer);
  return { html: doc.html, comments: doc.comments, page: doc.page };
}, built.b64);

ok('heading survives', /<h1[^>]*>Quarterly report<\/h1>/.test(back.html), back.html.slice(0, 200));
ok('bold survives', /<strong>/.test(back.html));
ok('colour survives', /color:#B22222/i.test(back.html));
ok('font size survives', /font-size:14pt/.test(back.html));
ok('bullet list survives', /<ul><li>First bullet<\/li>/.test(back.html), (back.html.match(/<ul>.{0,80}/) || [''])[0]);
ok('nested list survives', /<ul>[\s\S]*<ul>/.test(back.html));
ok('ordered list survives', /<ol><li>Step one/.test(back.html), (back.html.match(/<ol>.{0,60}/) || [''])[0]);
ok('quote survives', /<blockquote/.test(back.html));
ok('code block survives', /<pre/.test(back.html));
ok('table survives with header', /<table><thead><tr><th>Region<\/th>/.test(back.html), (back.html.match(/<table>.{0,90}/) || [''])[0]);
ok('link survives', /<a href="https:\/\/example.com\/report"/.test(back.html));
ok('image survives as data URI', /<img src="data:image\/png;base64,/.test(back.html));
ok('page break survives', /class="pagebreak"/.test(back.html));
ok('comment anchor + text survive', /class="cmt"/.test(back.html) && Object.values(back.comments).some(c => c.text.includes('Please check')));
ok('page setup detected as A4 portrait', back.page && back.page.size === 'a4' && back.page.orientation === 'portrait', JSON.stringify(back.page));

console.log('\n7. Import a real-world style .docx (no styles.xml niceties)');
const minimal = await page.evaluate(async () => {
  const H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const NSD = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const docXml = H + '<w:document ' + NSD + '><w:body>' +
    '<w:p><w:pPr><w:pStyle w:val="Heading 1"/></w:pPr><w:r><w:t>Legacy heading</w:t></w:r></w:p>' +
    '<w:p><w:r><w:rPr><w:b/><w:i/></w:rPr><w:t xml:space="preserve">bold italic </w:t></w:r><w:r><w:t>plain</w:t></w:r></w:p>' +
    '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>A1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B1</w:t></w:r></w:p></w:tc></w:tr></w:tbl>' +
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>' +
    '</w:body></w:document>';
  const blob = await W.zip.zip([
    { name: '[Content_Types].xml', data: H + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
    { name: '_rels/.rels', data: H + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { name: 'word/document.xml', data: docXml }
  ]);
  const doc = await W.docxImport.fromArrayBuffer(await blob.arrayBuffer());
  return doc;
});
ok('style name with a space maps to h1', /<h1>Legacy heading<\/h1>/.test(minimal.html), minimal.html);
ok('run formatting maps to tags', /<strong><em>bold italic <\/em><\/strong>|<em><strong>/.test(minimal.html), minimal.html);
ok('table without thead still imports', /<table><tbody><tr><td>A1/.test(minimal.html), minimal.html);
ok('letter + narrow margins detected', minimal.page.size === 'letter' && minimal.page.margins === 'narrow', JSON.stringify(minimal.page));

console.log('\n8. Persistence');
ok('document saves and reloads from storage', await page.evaluate(() => {
  W.editor.setHTML('<p>persist me</p>');
  W.store.save(true);
  const id = W.store.current.id;
  W.editor.setHTML('<p>scratch</p>');
  W.store.load(id);
  return W.editor.node.innerText.includes('persist me');
}));
ok('markdown export shapes the document', await page.evaluate(() => {
  W.editor.setHTML('<h1>T</h1><p>a <strong>b</strong></p><ul><li>x</li></ul>');
  const md = W.files.toMarkdown();
  return md.includes('# T') && md.includes('a **b**') && md.includes('- x');
}), await page.evaluate(() => { W.editor.setHTML('<h1>T</h1><p>a <strong>b</strong></p><ul><li>x</li></ul>'); return W.files.toMarkdown(); }));
ok('html export is self contained', await page.evaluate(() => {
  const html = W.files.standaloneHtml();
  return html.startsWith('<!doctype html>') && html.includes('scribe-doc') && html.includes('scribe-meta');
}));

console.log('\n9. Real typing and the File menu');
await page.evaluate(() => { W.editor.setHTML('<p><br></p>'); W.editor.focus(); });
await page.click('#editor');
await page.keyboard.type('Typed by a human. ');
await page.keyboard.press('Control+b');
await page.keyboard.type('Now bold.');
await page.keyboard.press('Enter');
await page.keyboard.type('Second paragraph.');
ok('typing produces paragraphs', await page.evaluate(() => W.editor.node.querySelectorAll('p').length >= 2),
  await page.evaluate(() => W.editor.node.innerHTML));
ok('Ctrl+B while typing bolds the new text', await page.evaluate(() =>
  /(<b>|<strong>|font-weight:\s*bold)/i.test(W.editor.node.innerHTML) && W.editor.node.innerText.includes('Now bold.')),
  await page.evaluate(() => W.editor.node.innerHTML));

const download = await Promise.all([
  page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
  page.click('.mbtn[data-menu="file"]').then(() => page.click('[data-act="save-docx"]'))
]).then(r => r[0]);
ok('File menu downloads a .docx', !!download && /\.docx$/.test(download.suggestedFilename()),
  download ? download.suggestedFilename() : 'no download event');

console.log('\n10. No errors accumulated during the run');
ok('console clean', consoleErrors.length === 0, consoleErrors.join(' | '));

await browser.close();
console.log('\n' + (failures ? failures + ' CHECK(S) FAILED' : 'ALL CHECKS PASSED'));
process.exit(failures ? 1 : 0);
