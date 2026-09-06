/* files.js - open, save, export, print. */
(function (W) {
  'use strict';
  var $ = W.util.$, $$ = W.util.$$, el = W.util.el, ed;

  function init() {
    ed = W.editor;
    $('#file-input').addEventListener('change', function () {
      if (this.files && this.files[0]) openFile(this.files[0]);
      this.value = '';
    });
    $('#image-input').addEventListener('change', function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { W.format.insertImage(reader.result); };
      reader.readAsDataURL(f);
    });
    ed.node.addEventListener('paste', onPaste);
    ed.node.addEventListener('dragover', function (e) { e.preventDefault(); });
    ed.node.addEventListener('drop', onDrop);
  }

  function safeName(ext) {
    var name = ($('#doc-title').value || 'document').replace(/[\\/:*?"<>|]+/g, '-').trim();
    return (name || 'document') + '.' + ext;
  }

  /* ---------------------------------------------------------------- export */
  async function saveDocx() {
    try {
      W.ui.toast('Building .docx…');
      var blob = await W.docxExport.toBlob({
        node: ed.node,
        title: $('#doc-title').value,
        author: W.comments.author(),
        page: ed.getPage(),
        comments: W.comments.all(),
        header: $('#header-text').value,
        footer: $('#footer-text').value,
        pageNumbers: $('#page-numbers').checked,
        stats: ed.stats()
      });
      W.util.download(blob, safeName('docx'));
      W.ui.toast('Downloaded ' + safeName('docx'));
    } catch (e) {
      W.ui.toast('Export failed: ' + e.message, 5000);
      throw e;
    }
  }

  function standaloneHtml() {
    var css = [
      'body{margin:0;background:#f2f3f5;font:11pt/1.15 Calibri,Carlito,sans-serif;color:#111}',
      '.page{max-width:794px;margin:24px auto;background:#fff;padding:96px;box-shadow:0 1px 4px rgba(0,0,0,.15)}',
      'h1,h2,h3,h4{color:#1a3a6b;line-height:1.2;margin:18pt 0 6pt}h1{font-size:20pt;margin-top:0}h2{font-size:16pt}h3{font-size:13pt}h4{font-size:11.5pt;font-style:italic}',
      'p{margin:0 0 8pt}ul,ol{margin:0 0 8pt;padding-left:28px}',
      'blockquote{margin:8pt 0 8pt 18pt;padding-left:12pt;border-left:3px solid #c8d2e4;color:#445;font-style:italic}',
      'pre{background:#f4f5f7;border:1px solid #e2e4e9;border-radius:4px;padding:8pt 10pt;font:10pt/1.4 Consolas,monospace;white-space:pre-wrap}',
      'table{border-collapse:collapse;width:100%;margin:8pt 0}td,th{border:1px solid #9aa3b2;padding:4pt 6pt;vertical-align:top}th{background:#eef1f6;text-align:left}',
      'table.noborder td,table.noborder th{border-color:transparent}',
      'img{max-width:100%;height:auto}hr{border:0;border-top:1px solid #c9ced8;margin:12pt 0}',
      '.cmt{background:#fff3bf;border-bottom:2px solid #f0b429}.pagebreak{border-top:1px dashed #98a2b3;margin:14pt 0;page-break-after:always}',
      '@media print{body{background:#fff}.page{margin:0;padding:0;box-shadow:none;max-width:none}}'
    ].join('\n');

    return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
      '<title>' + W.util.escapeXml($('#doc-title').value) + '</title>\n<style>\n' + css + '\n</style>\n</head>\n<body>\n' +
      '<div class="page" id="scribe-doc">' + ed.getHTML() + '</div>\n' +
      '<script type="application/json" id="scribe-meta">' +
      JSON.stringify({ comments: W.comments.map(), page: ed.getPage(), header: $('#header-text').value, footer: $('#footer-text').value, pageNumbers: $('#page-numbers').checked }).replace(/</g, '\\u003c') +
      '</' + 'script>\n</body>\n</html>\n';
  }

  function saveHtml() {
    W.util.download(new Blob([standaloneHtml()], { type: 'text/html;charset=utf-8' }), safeName('html'));
  }

  function saveTxt() {
    W.util.download(new Blob([ed.getText()], { type: 'text/plain;charset=utf-8' }), safeName('txt'));
  }

  function toMarkdown() {
    var out = [];
    function inline(node) {
      var s = '';
      node.childNodes.forEach ? null : null;
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) { s += c.nodeValue; return; }
        if (c.nodeType !== 1) return;
        var t = c.nodeName, inner = inline(c);
        if (t === 'B' || t === 'STRONG') s += '**' + inner + '**';
        else if (t === 'I' || t === 'EM') s += '*' + inner + '*';
        else if (t === 'S' || t === 'DEL') s += '~~' + inner + '~~';
        else if (t === 'CODE') s += '`' + inner + '`';
        else if (t === 'A') s += '[' + inner + '](' + (c.getAttribute('href') || '') + ')';
        else if (t === 'BR') s += '  \n';
        else if (t === 'IMG') s += '![' + (c.getAttribute('alt') || 'image') + '](' + (/^data:/.test(c.src) ? 'embedded-image' : c.getAttribute('src')) + ')';
        else s += inner;
      });
      return s;
    }
    function walk(parent, listPrefix) {
      Array.prototype.slice.call(parent.children).forEach(function (n) {
        var t = n.nodeName;
        if (/^H[1-6]$/.test(t)) out.push('#'.repeat(+t[1]) + ' ' + inline(n), '');
        else if (t === 'P') out.push(inline(n), '');
        else if (t === 'BLOCKQUOTE') out.push('> ' + inline(n), '');
        else if (t === 'PRE') out.push('```', n.textContent, '```', '');
        else if (t === 'HR') out.push('---', '');
        else if (t === 'UL' || t === 'OL') {
          Array.prototype.slice.call(n.children).forEach(function (li, i) {
            if (li.nodeName !== 'LI') return;
            var clone = li.cloneNode(true);
            Array.prototype.slice.call(clone.querySelectorAll('ul,ol')).forEach(function (x) { x.remove(); });
            out.push((listPrefix || '') + (t === 'OL' ? (i + 1) + '. ' : '- ') + inline(clone));
            Array.prototype.slice.call(li.children).forEach(function (sub) {
              if (sub.nodeName === 'UL' || sub.nodeName === 'OL') {
                var holder = document.createElement('div');
                holder.appendChild(sub.cloneNode(true));
                walk(holder, (listPrefix || '') + '  ');
              }
            });
          });
          out.push('');
        } else if (t === 'TABLE') {
          var rows = Array.prototype.slice.call(n.querySelectorAll('tr'));
          rows.forEach(function (tr, ri) {
            var cells = Array.prototype.slice.call(tr.cells).map(function (c) { return inline(c).replace(/\|/g, '\\|').trim(); });
            out.push('| ' + cells.join(' | ') + ' |');
            if (ri === 0) out.push('| ' + cells.map(function () { return '---'; }).join(' | ') + ' |');
          });
          out.push('');
        } else if (t === 'DIV' && n.classList.contains('pagebreak')) out.push('---', '');
        else if (n.children.length) walk(n, listPrefix);
        else out.push(inline(n), '');
      });
    }
    walk(ed.node, '');
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  function saveMd() {
    W.util.download(new Blob([toMarkdown()], { type: 'text/markdown;charset=utf-8' }), safeName('md'));
  }

  function print() {
    W.find.clear();
    setTimeout(function () { window.print(); }, 60);
  }

  /* ---------------------------------------------------------------- import */
  function openPicker() { $('#file-input').click(); }

  async function openFile(file) {
    var name = file.name.replace(/\.[^.]+$/, '');
    try {
      if (/\.docx$/i.test(file.name)) {
        W.ui.toast('Reading ' + file.name + '…');
        var buf = await file.arrayBuffer();
        var doc = await W.docxImport.fromArrayBuffer(buf);
        W.store.replaceContent({
          name: name, html: doc.html, comments: doc.comments,
          page: doc.page || { size: 'a4', orientation: 'portrait', margins: 'normal' }
        });
        W.ui.toast('Opened ' + file.name);
        return;
      }
      var text = await file.text();
      if (/\.html?$/i.test(file.name)) {
        var parsed = new DOMParser().parseFromString(text, 'text/html');
        var holder = parsed.querySelector('#scribe-doc') || parsed.body;
        var metaTag = parsed.querySelector('#scribe-meta');
        var meta = {};
        if (metaTag) { try { meta = JSON.parse(metaTag.textContent); } catch (e) {} }
        Array.prototype.slice.call(holder.querySelectorAll('script,style,link')).forEach(function (n) { n.remove(); });
        W.store.replaceContent({
          name: name, html: holder.innerHTML, comments: meta.comments || {},
          page: meta.page, header: meta.header, footer: meta.footer, pageNumbers: meta.pageNumbers
        });
      } else if (/\.md$/i.test(file.name)) {
        W.store.replaceContent({ name: name, html: fromMarkdown(text) });
      } else {
        var html = text.split(/\n{2,}/).map(function (p) {
          return '<p>' + W.util.escapeXml(p).replace(/\n/g, '<br>') + '</p>';
        }).join('');
        W.store.replaceContent({ name: name, html: html || '<p><br></p>' });
      }
      W.ui.toast('Opened ' + file.name);
    } catch (e) {
      W.ui.toast('Could not open that file: ' + e.message, 5000);
    }
  }

  /* deliberately small markdown subset: headings, lists, quotes, fences, emphasis, links */
  function fromMarkdown(text) {
    var lines = text.replace(/\r\n?/g, '\n').split('\n');
    var out = [], listStack = [], inFence = false, fence = [];

    function closeLists() { while (listStack.length) out.push('</' + listStack.pop() + '>'); }
    function span(s) {
      return W.util.escapeXml(s)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|\W)\*([^*]+)\*/g, '$1<em>$2</em>')
        .replace(/~~([^~]+)~~/g, '<s>$1</s>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }

    lines.forEach(function (line) {
      if (/^```/.test(line)) {
        if (inFence) { out.push('<pre>' + W.util.escapeXml(fence.join('\n')) + '</pre>'); fence = []; inFence = false; }
        else { closeLists(); inFence = true; }
        return;
      }
      if (inFence) { fence.push(line); return; }

      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { closeLists(); out.push('<h' + Math.min(4, h[1].length) + '>' + span(h[2]) + '</h' + Math.min(4, h[1].length) + '>'); return; }
      if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { closeLists(); out.push('<hr>'); return; }

      var ul = line.match(/^(\s*)[-*+]\s+(.*)$/);
      var ol = line.match(/^(\s*)\d+[.)]\s+(.*)$/);
      if (ul || ol) {
        var want = ul ? 'ul' : 'ol';
        if (!listStack.length || listStack[listStack.length - 1] !== want) { closeLists(); out.push('<' + want + '>'); listStack.push(want); }
        out.push('<li>' + span((ul || ol)[2]) + '</li>');
        return;
      }
      var q = line.match(/^>\s?(.*)$/);
      if (q) { closeLists(); out.push('<blockquote>' + span(q[1]) + '</blockquote>'); return; }
      if (!line.trim()) { closeLists(); return; }
      closeLists();
      out.push('<p>' + span(line) + '</p>');
    });
    closeLists();
    if (inFence && fence.length) out.push('<pre>' + W.util.escapeXml(fence.join('\n')) + '</pre>');
    return out.join('') || '<p><br></p>';
  }

  function onPaste(e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (items) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') === 0) {
          e.preventDefault();
          var blob = items[i].getAsFile();
          var reader = new FileReader();
          reader.onload = function () { W.format.insertImage(reader.result); };
          reader.readAsDataURL(blob);
          return;
        }
      }
    }
    var html = e.clipboardData && e.clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();
      var doc = new DOMParser().parseFromString(html, 'text/html');
      Array.prototype.slice.call(doc.querySelectorAll('script,style,meta,link')).forEach(function (n) { n.remove(); });
      Array.prototype.slice.call(doc.querySelectorAll('*')).forEach(function (n) {
        n.removeAttribute('class');
        n.removeAttribute('id');
        if (n.style) {
          var keep = ['fontWeight', 'fontStyle', 'textDecoration', 'textDecorationLine', 'color', 'backgroundColor', 'textAlign', 'fontSize', 'fontFamily'];
          var saved = {};
          keep.forEach(function (k) { if (n.style[k]) saved[k] = n.style[k]; });
          n.removeAttribute('style');
          Object.keys(saved).forEach(function (k) { n.style[k] = saved[k]; });
        }
      });
      ed.insertHTML(doc.body.innerHTML);
    }
  }

  function onDrop(e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    e.preventDefault();
    if (/^image\//.test(f.type)) {
      var reader = new FileReader();
      reader.onload = function () { W.format.insertImage(reader.result); };
      reader.readAsDataURL(f);
    } else openFile(f);
  }

  /* ---------------------------------------------------------------- dialogs */
  function docsDialog() {
    var docs = W.store.list();
    var table = el('table', { class: 'doclist' });
    table.appendChild(el('tr', {}, [el('th', { text: 'Document' }), el('th', { text: 'Last saved' }), el('th', { text: '' })]));
    docs.forEach(function (d) {
      var row = el('tr', {}, [
        el('td', {}, [el('a', {
          href: '#', text: d.name, onclick: function (e) {
            e.preventDefault();
            W.store.save(true);
            W.store.load(d.id);
            W.ui.closeModal();
          }
        })]),
        el('td', { text: new Date(d.updated).toLocaleString() }),
        el('td', {}, [
          el('button', { class: 'tbtn', text: 'Copy', onclick: function () { W.store.duplicate(d.id); W.ui.closeModal(); docsDialog(); } }),
          el('button', {
            class: 'tbtn', text: 'Delete', onclick: function () {
              W.ui.confirm({ title: 'Delete document', message: 'Delete "' + d.name + '"? This cannot be undone.', ok: 'Delete' }, function (yes) {
                if (yes) { W.store.remove(d.id); docsDialog(); }
              });
            }
          })
        ])
      ]);
      table.appendChild(row);
    });
    W.ui.modal({
      title: 'Saved documents (' + docs.length + ')',
      body: docs.length ? table : '<p>No saved documents yet.</p>',
      buttons: [{ label: 'New document', onClick: function (close) { W.store.save(true); W.store.create(); close(); } }, { label: 'Close', primary: true }]
    });
  }

  function propsDialog() {
    var s = ed.stats();
    var body = el('div');
    body.innerHTML = '<table class="wc-table">' +
      '<tr><td>Words</td><td>' + s.words + '</td></tr>' +
      '<tr><td>Characters (no spaces)</td><td>' + s.chars + '</td></tr>' +
      '<tr><td>Characters (with spaces)</td><td>' + s.charsWithSpaces + '</td></tr>' +
      '<tr><td>Paragraphs</td><td>' + s.paragraphs + '</td></tr>' +
      '<tr><td>Pages (estimated)</td><td>' + s.pages + '</td></tr>' +
      '<tr><td>Comments</td><td>' + W.comments.all().length + '</td></tr>' +
      '<tr><td>Page setup</td><td>' + ed.getPage().size.toUpperCase() + ' ' + ed.getPage().orientation + '</td></tr>' +
      '</table>';
    var input = el('input', { type: 'text', value: W.comments.author() });
    body.appendChild(el('label', { text: 'Author name (used for comments and file properties)' }));
    body.appendChild(input);
    W.ui.modal({
      title: 'Document properties',
      body: body,
      buttons: [{ label: 'Save', primary: true, onClick: function (close) { W.comments.setAuthor(input.value); W.comments.render(); close(); } }]
    });
  }

  function wordCountDialog() { propsDialog(); }

  W.files = {
    init: init, openPicker: openPicker, openFile: openFile,
    saveDocx: saveDocx, saveHtml: saveHtml, saveTxt: saveTxt, saveMd: saveMd, print: print,
    docsDialog: docsDialog, propsDialog: propsDialog, wordCountDialog: wordCountDialog,
    toMarkdown: toMarkdown, fromMarkdown: fromMarkdown, standaloneHtml: standaloneHtml
  };
})(window.W = window.W || {});
