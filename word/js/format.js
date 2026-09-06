/* format.js - character and paragraph formatting, plus toolbar state sync. */
(function (W) {
  'use strict';
  var $ = W.util.$, $$ = W.util.$$, el = W.util.el, ed = null;

  var STATE_CMDS = ['bold', 'italic', 'underline', 'strikeThrough', 'superscript', 'subscript',
                    'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
                    'insertUnorderedList', 'insertOrderedList'];

  function init() {
    ed = W.editor;

    $$('[data-cmd]').forEach(function (b) {
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () { run(b.getAttribute('data-cmd')); });
    });

    $('#style-select').addEventListener('change', function () { setBlock(this.value); });
    $('#font-select').addEventListener('change', function () { setFontFamily(this.value); });
    $('#size-select').addEventListener('change', function () { setFontSize(parseFloat(this.value)); });
    $('#line-height').addEventListener('change', function () { setLineHeight(this.value); });
    $('#fore-color').addEventListener('input', function () { exec('foreColor', this.value); });
    $('#back-color').addEventListener('input', function () { exec('hiliteColor', this.value); });
    $('#space-before').addEventListener('change', function () { setBlockCss('marginTop', this.value + 'pt'); });
    $('#space-after').addEventListener('change', function () { setBlockCss('marginBottom', this.value + 'pt'); });
    $('#indent-left').addEventListener('change', function () { setBlockCss('marginLeft', this.value + 'px'); });

    ed.on(function (kind) { if (kind === 'selection' || kind === 'input' || kind === 'load') sync(); });
  }

  function exec(cmd, value) {
    ed.focus();
    document.execCommand(cmd, false, value === undefined ? null : value);
    ed.emit('input');
    sync();
  }

  function run(cmd) {
    switch (cmd) {
      case 'grow': return bumpSize(+1);
      case 'shrink': return bumpSize(-1);
      case 'undo': case 'redo': return exec(cmd);
      default: return exec(cmd);
    }
  }

  /* ---------- character ---------- */
  function withCssOff(fn) {
    try { document.execCommand('styleWithCSS', false, false); } catch (e) {}
    fn();
    try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
  }

  function setFontSize(pt) {
    if (!pt) return;
    ed.focus();
    var r = ed.range();
    if (r && r.collapsed) {           /* nothing selected: apply to the whole block */
      ed.selectedBlocks().forEach(function (b) { b.style.fontSize = pt + 'pt'; });
      ed.emit('input');
      return sync();
    }
    withCssOff(function () { document.execCommand('fontSize', false, '7'); });
    $$('font[size="7"]', ed.node).forEach(function (f) {
      var s = el('span', { style: 'font-size:' + pt + 'pt' });
      while (f.firstChild) s.appendChild(f.firstChild);
      f.parentNode.replaceChild(s, f);
    });
    ed.emit('input');
    sync();
  }

  function currentSizePt() {
    var b = ed.currentBlock() || ed.node;
    var r = ed.range();
    var probe = r && r.startContainer.nodeType === 3 ? r.startContainer.parentNode : b;
    return Math.round(parseFloat(getComputedStyle(probe).fontSize) * 0.75 * 10) / 10;
  }

  function bumpSize(dir) {
    var opts = $$('#size-select option').map(function (o) { return parseFloat(o.value || o.textContent); });
    var cur = currentSizePt();
    var i = 0;
    while (i < opts.length && opts[i] < cur - 0.01) i++;
    var next = opts[Math.max(0, Math.min(opts.length - 1, i + dir))];
    if (next === cur) next = opts[Math.max(0, Math.min(opts.length - 1, i + dir + dir))];
    setFontSize(next);
  }

  function setFontFamily(family) {
    ed.focus();
    var r = ed.range();
    if (r && r.collapsed) {
      ed.selectedBlocks().forEach(function (b) { b.style.fontFamily = family; });
      ed.emit('input');
      return sync();
    }
    exec('fontName', family);
  }

  /* ---------- paragraph ---------- */
  function setBlock(tag) {
    ed.focus();
    document.execCommand('formatBlock', false, tag === 'p' ? 'p' : tag);
    ed.emit('input');
    sync();
  }

  function setBlockCss(prop, value) {
    ed.focus();
    ed.selectedBlocks().forEach(function (b) {
      if (b.nodeName === 'TD' || b.nodeName === 'TH') return;
      b.style[prop] = value;
    });
    ed.emit('input');
  }

  function setLineHeight(v) { setBlockCss('lineHeight', v); }

  /* ---------- inserts ---------- */
  function insertPageBreak() {
    var hr = el('div', { class: 'pagebreak', contenteditable: 'false' });
    var p = el('p', { html: '<br>' });
    ed.focus();
    var r = ed.range();
    if (r) {
      r.deleteContents();
      r.insertNode(p);
      p.parentNode.insertBefore(hr, p);
    } else {
      ed.node.appendChild(hr);
      ed.node.appendChild(p);
    }
    ed.selectNodeContentsEnd(p);
    ed.emit('input');
  }

  function insertDate() {
    var d = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    ed.insertHTML(d);
  }

  function insertLink(url, text) {
    if (!/^[a-z][a-z0-9+.-]*:|^\/|^#/i.test(url)) url = 'https://' + url;
    var r = ed.range();
    if (r && !r.collapsed) {
      ed.focus();
      document.execCommand('createLink', false, url);
      $$('a[href="' + url.replace(/"/g, '\\"') + '"]', ed.node).forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
    } else {
      ed.insertHTML('<a href="' + W.util.escapeXml(url) + '" target="_blank" rel="noopener">' +
        W.util.escapeXml(text || url) + '</a>&nbsp;');
    }
    ed.emit('input');
  }

  function insertImage(dataUrl, maxWidthPx) {
    var img = new Image();
    img.onload = function () {
      var limit = maxWidthPx || (ed.getPage().px.w - ed.getPage().px.l - ed.getPage().px.r);
      var w = Math.min(img.naturalWidth, limit);
      var h = Math.round(img.naturalHeight * (w / img.naturalWidth));
      var node = el('img', { src: dataUrl, width: Math.round(w), height: h, alt: '' });
      ed.insertNode(node);
    };
    img.src = dataUrl;
  }

  /* ---------- toolbar state ---------- */
  function sync() {
    if (!ed.node) return;
    STATE_CMDS.forEach(function (c) {
      var btn = $('[data-cmd="' + c + '"]');
      if (!btn) return;
      var on = false;
      try { on = document.queryCommandState(c); } catch (e) {}
      btn.classList.toggle('is-on', !!on);
    });

    var b = ed.currentBlock();
    var sel = $('#style-select');
    if (b && sel) {
      var name = b.nodeName.toLowerCase();
      if (name === 'li') {
        var lp = b.closest('ul,ol');
        name = 'p';
        if (lp) name = 'p';
      }
      if (name === 'td' || name === 'th' || name === 'div') name = 'p';
      sel.value = ['p', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre'].indexOf(name) > -1 ? name : 'p';
    }

    var probe = b || ed.node;
    var r = ed.range();
    if (r && r.startContainer.nodeType === 3) probe = r.startContainer.parentNode;
    var cs = getComputedStyle(probe);

    var sizeSel = $('#size-select');
    var pt = String(Math.round(parseFloat(cs.fontSize) * 0.75 * 10) / 10).replace(/\.0$/, '');
    if (sizeSel) {
      var found = $$('#size-select option').some(function (o) { return (o.value || o.textContent) === pt; });
      if (found) sizeSel.value = pt;
      else sizeSel.selectedIndex = -1;
    }

    var fontSel = $('#font-select');
    if (fontSel) {
      var fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      var match = $$('#font-select option').filter(function (o) {
        return o.textContent.toLowerCase() === fam;
      })[0];
      if (match) fontSel.value = match.value; else fontSel.selectedIndex = -1;
    }

    var lh = $('#line-height');
    if (lh && b) {
      var ratio = Math.round((parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)) * 100) / 100;
      var opt = $$('#line-height option').filter(function (o) { return Math.abs(parseFloat(o.value) - ratio) < 0.06; })[0];
      if (opt) lh.value = opt.value; else lh.selectedIndex = -1;
    }

    var inTable = !!(b && b.closest && b.closest('table'));
    $('#table-tools').classList.toggle('on', inTable);
  }

  W.format = {
    init: init, exec: exec, run: run, sync: sync,
    setBlock: setBlock, setFontSize: setFontSize, setFontFamily: setFontFamily,
    setLineHeight: setLineHeight, setBlockCss: setBlockCss,
    insertPageBreak: insertPageBreak, insertDate: insertDate,
    insertLink: insertLink, insertImage: insertImage
  };
})(window.W = window.W || {});
