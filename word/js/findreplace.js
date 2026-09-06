/* findreplace.js - find, find next/prev, replace, replace all. */
(function (W) {
  'use strict';
  var $ = W.util.$, $$ = W.util.$$, ed;
  var hits = [], current = -1, lastQuery = null;

  function init() {
    ed = W.editor;
    $('#find-input').addEventListener('input', W.util.debounce(search, 180));
    $('#find-case').addEventListener('change', search);
    $('#find-word').addEventListener('change', search);
    $('#find-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? prev() : next(); }
      if (e.key === 'Escape') close();
    });
    $('#replace-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); replaceOne(); }
      if (e.key === 'Escape') close();
    });
    var acts = { 'find-next': next, 'find-prev': prev, 'replace-one': replaceOne, 'replace-all': replaceAll, 'find-close': close };
    Object.keys(acts).forEach(function (k) { $('[data-act="' + k + '"]').addEventListener('click', acts[k]); });
  }

  function open() {
    $('#findbar').hidden = false;
    var sel = document.getSelection();
    if (ed.isInside(sel) && sel.toString().trim()) $('#find-input').value = sel.toString().trim();
    $('#find-input').focus();
    $('#find-input').select();
    search();
  }

  function close() {
    clear();
    $('#findbar').hidden = true;
    ed.focus();
  }

  function clear() {
    $$('mark.find-hit', ed.node).forEach(function (m) {
      var parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      m.remove();
      parent.normalize();
    });
    hits = [];
    current = -1;
    $('#find-count').textContent = '0 / 0';
  }

  function pattern(q) {
    var flags = $('#find-case').checked ? 'g' : 'gi';
    var body = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if ($('#find-word').checked) body = '\\b' + body + '\\b';
    return new RegExp(body, flags);
  }

  function search() {
    clear();
    var q = $('#find-input').value;
    lastQuery = q;
    if (!q) return;
    var re = pattern(q);

    var walker = document.createTreeWalker(ed.node, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (n.parentNode.closest('mark.find-hit')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var texts = [], n;
    while ((n = walker.nextNode())) texts.push(n);

    texts.forEach(function (node) {
      var value = node.nodeValue, m, ranges = [];
      re.lastIndex = 0;
      while ((m = re.exec(value))) {
        ranges.push([m.index, m.index + m[0].length]);
        if (m[0].length === 0) re.lastIndex++;
      }
      for (var i = ranges.length - 1; i >= 0; i--) {
        var r = document.createRange();
        r.setStart(node, ranges[i][0]);
        r.setEnd(node, ranges[i][1]);
        var mark = document.createElement('mark');
        mark.className = 'find-hit';
        try { r.surroundContents(mark); hits.unshift(mark); } catch (e) {}
      }
    });

    hits = $$('mark.find-hit', ed.node);
    if (hits.length) { current = 0; show(); }
    count();
  }

  function count() { $('#find-count').textContent = (hits.length ? current + 1 : 0) + ' / ' + hits.length; }

  function show() {
    hits.forEach(function (h, i) { h.classList.toggle('current', i === current); });
    if (hits[current]) hits[current].scrollIntoView({ block: 'center', behavior: 'smooth' });
    count();
  }

  function next() { if (!hits.length) return search(); current = (current + 1) % hits.length; show(); }
  function prev() { if (!hits.length) return search(); current = (current - 1 + hits.length) % hits.length; show(); }

  function replaceOne() {
    if (!hits.length) { search(); if (!hits.length) return; }
    var mark = hits[current];
    if (!mark) return;
    var text = document.createTextNode($('#replace-input').value);
    mark.parentNode.replaceChild(text, mark);
    hits.splice(current, 1);
    if (current >= hits.length) current = 0;
    ed.emit('input');
    if (hits.length) show(); else count();
  }

  function replaceAll() {
    if (!hits.length) search();
    var n = hits.length, value = $('#replace-input').value;
    hits.forEach(function (mark) { mark.parentNode.replaceChild(document.createTextNode(value), mark); });
    hits = [];
    current = -1;
    ed.node.normalize();
    ed.emit('input');
    count();
    W.ui.toast(n + (n === 1 ? ' replacement' : ' replacements') + ' made');
  }

  W.find = { init: init, open: open, close: close, clear: clear, next: next, prev: prev };
})(window.W = window.W || {});
