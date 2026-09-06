/* editor.js - document surface: geometry, selection, change notification, stats. */
(function (W) {
  'use strict';
  var $ = W.util.$, el = W.util.el, debounce = W.util.debounce;

  var PAGES = {                        /* px at 96dpi */
    a4:     { w: 794, h: 1123, label: 'A4',     tw: [11906, 16838] },
    letter: { w: 816, h: 1056, label: 'Letter', tw: [12240, 15840] },
    legal:  { w: 816, h: 1344, label: 'Legal',  tw: [12240, 20160] },
    a5:     { w: 559, h: 794,  label: 'A5',     tw: [8391, 11906] }
  };
  var MARGINS = {
    normal:   { t: 96, r: 96, b: 96, l: 96 },
    narrow:   { t: 48, r: 48, b: 48, l: 48 },
    moderate: { t: 96, r: 72, b: 96, l: 72 },
    wide:     { t: 96, r: 144, b: 96, l: 144 }
  };

  var listeners = [];
  var node, sheet, lines, savedRange = null;

  var page = { size: 'a4', orientation: 'portrait', margins: 'normal' };

  function init() {
    node = $('#editor');
    sheet = $('#sheet');
    lines = $('#pagelines');

    document.execCommand('defaultParagraphSeparator', false, 'p');
    try { document.execCommand('styleWithCSS', false, true); } catch (e) {}

    node.addEventListener('input', function () { emit('input'); });
    node.addEventListener('keyup', remember);
    node.addEventListener('mouseup', remember);
    node.addEventListener('blur', remember);
    document.addEventListener('selectionchange', function () {
      if (isInside(document.getSelection())) { remember(); emit('selection'); }
    });

    applyPage();
    on(debounce(paginate, 180));
    setTimeout(paginate, 60);
    window.addEventListener('resize', debounce(paginate, 200));
  }

  function on(fn) { listeners.push(fn); }
  function emit(kind) { listeners.forEach(function (fn) { fn(kind || 'input'); }); }

  /* ---------- selection ---------- */
  function isInside(sel) {
    return !!(sel && sel.rangeCount && node && node.contains(sel.getRangeAt(0).commonAncestorContainer));
  }
  function remember() {
    var sel = document.getSelection();
    if (isInside(sel)) savedRange = sel.getRangeAt(0).cloneRange();
  }
  function range() {
    var sel = document.getSelection();
    if (isInside(sel)) return sel.getRangeAt(0);
    return savedRange;
  }
  function restore() {
    if (!savedRange) return false;
    var sel = document.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  }
  function focus() {
    node.focus();
    if (!isInside(document.getSelection())) restore();
  }
  function setRange(r) {
    var sel = document.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    savedRange = r.cloneRange();
  }
  function selectNodeContentsEnd(n) {
    var r = document.createRange();
    r.selectNodeContents(n);
    r.collapse(false);
    setRange(r);
  }

  /* nearest block-level ancestor of the caret, inside the editor */
  var BLOCKS = 'P,H1,H2,H3,H4,H5,H6,LI,BLOCKQUOTE,PRE,TD,TH,DIV';
  function currentBlock() {
    var r = range();
    if (!r) return null;
    var n = r.startContainer;
    if (n.nodeType === 3) n = n.parentNode;
    while (n && n !== node) {
      if (BLOCKS.indexOf(n.nodeName) > -1) return n;
      n = n.parentNode;
    }
    return null;
  }

  /* every block that the selection touches */
  function selectedBlocks() {
    var r = range();
    if (!r) return [];
    var all = W.util.$$(BLOCKS.split(',').join(','), node);
    var hit = all.filter(function (b) {
      if (b.querySelector && b.querySelector(BLOCKS.split(',').join(','))) {
        /* container blocks only count when fully inside the selection */
        if (!r.collapsed && !(r.intersectsNode(b) && rangeContains(r, b))) return false;
      }
      return r.intersectsNode ? r.intersectsNode(b) : false;
    });
    if (!hit.length) {
      var cb = currentBlock();
      if (cb) hit = [cb];
    }
    return hit;
  }
  function rangeContains(r, n) {
    var nr = document.createRange();
    nr.selectNode(n);
    return r.compareBoundaryPoints(Range.START_TO_START, nr) <= 0 &&
           r.compareBoundaryPoints(Range.END_TO_END, nr) >= 0;
  }

  function insertHTML(html) {
    focus();
    document.execCommand('insertHTML', false, html);
    emit('input');
  }
  function insertNode(n) {
    focus();
    var r = range();
    if (!r) { node.appendChild(n); }
    else { r.deleteContents(); r.insertNode(n); }
    var after = document.createRange();
    after.setStartAfter(n);
    after.collapse(true);
    setRange(after);
    emit('input');
  }

  /* ---------- page geometry ---------- */
  function applyPage() {
    var p = PAGES[page.size] || PAGES.a4;
    var m = MARGINS[page.margins] || MARGINS.normal;
    var w = page.orientation === 'landscape' ? p.h : p.w;
    var h = page.orientation === 'landscape' ? p.w : p.h;
    var s = document.documentElement.style;
    s.setProperty('--page-w', w + 'px');
    s.setProperty('--page-h', h + 'px');
    s.setProperty('--mar-t', m.t + 'px');
    s.setProperty('--mar-r', m.r + 'px');
    s.setProperty('--mar-b', m.b + 'px');
    s.setProperty('--mar-l', m.l + 'px');
    var st = $('#st-size');
    if (st) st.textContent = p.label + ' ' + page.orientation;
    paginate();
  }

  function setPage(patch) {
    Object.keys(patch || {}).forEach(function (k) { page[k] = patch[k]; });
    applyPage();
    emit('page');
  }
  function getPage() {
    var p = PAGES[page.size] || PAGES.a4;
    var m = MARGINS[page.margins] || MARGINS.normal;
    return {
      size: page.size, orientation: page.orientation, margins: page.margins,
      px: {
        w: page.orientation === 'landscape' ? p.h : p.w,
        h: page.orientation === 'landscape' ? p.w : p.h,
        t: m.t, r: m.r, b: m.b, l: m.l
      },
      twips: {
        w: page.orientation === 'landscape' ? p.tw[1] : p.tw[0],
        h: page.orientation === 'landscape' ? p.tw[0] : p.tw[1],
        t: W.util.U.pxToTwip(m.t), r: W.util.U.pxToTwip(m.r),
        b: W.util.U.pxToTwip(m.b), l: W.util.U.pxToTwip(m.l)
      }
    };
  }

  /* Draws indicative page boundaries and reports the page count.
     Real pagination for print is done by the browser; explicit page breaks are honoured here. */
  function paginate() {
    if (!node || !lines) return 1;
    var g = getPage();
    var contentH = g.px.h - g.px.t - g.px.b;
    if (contentH <= 0) return 1;

    var breaks = [];
    W.util.$$('.pagebreak', node).forEach(function (b) {
      breaks.push(b.offsetTop - node.offsetTop);
    });

    var total = node.scrollHeight - g.px.t - g.px.b;
    var marks = [], pageStart = 0, pages = 1, guard = 0;

    while (guard++ < 400) {
      var forced = null;
      for (var i = 0; i < breaks.length; i++) {
        if (breaks[i] > pageStart + 2 && breaks[i] <= pageStart + contentH) { forced = breaks[i]; break; }
      }
      var end = forced != null ? forced : pageStart + contentH;
      if (end >= total) break;
      marks.push(end);
      pageStart = end;
      pages++;
    }

    lines.innerHTML = '';
    marks.forEach(function (y, i) {
      lines.appendChild(el('i', { style: 'top:' + (y + g.px.t) + 'px', 'data-label': 'Page ' + (i + 2) }));
    });
    sheet.style.minHeight = Math.max(g.px.h, node.scrollHeight) + 'px';
    return pages;
  }

  /* ---------- stats ---------- */
  function stats() {
    var text = node.innerText || '';
    var words = text.trim() ? text.trim().replace(/\s+/g, ' ').split(' ').length : 0;
    var sel = document.getSelection();
    var selText = isInside(sel) ? sel.toString() : '';
    return {
      words: words,
      chars: text.replace(/\n/g, '').length,
      charsWithSpaces: text.length,
      paragraphs: W.util.$$('p,h1,h2,h3,h4,li,blockquote,pre', node).filter(function (p) { return p.innerText.trim(); }).length,
      selWords: selText.trim() ? selText.trim().replace(/\s+/g, ' ').split(' ').length : 0,
      selChars: selText.length,
      pages: paginate()
    };
  }

  function getHTML() { return node.innerHTML; }
  function setHTML(html) {
    node.innerHTML = html || '<p><br></p>';
    if (!node.firstChild) node.appendChild(el('p', { html: '<br>' }));
    emit('load');
    setTimeout(paginate, 30);
  }
  function getText() { return node.innerText; }

  W.editor = {
    init: init, on: on, emit: emit,
    get node() { return node; },
    focus: focus, range: range, setRange: setRange, restore: restore, remember: remember,
    isInside: isInside, currentBlock: currentBlock, selectedBlocks: selectedBlocks,
    insertHTML: insertHTML, insertNode: insertNode, selectNodeContentsEnd: selectNodeContentsEnd,
    setPage: setPage, getPage: getPage, paginate: paginate, stats: stats,
    getHTML: getHTML, setHTML: setHTML, getText: getText,
    PAGES: PAGES, MARGINS: MARGINS
  };
})(window.W = window.W || {});
