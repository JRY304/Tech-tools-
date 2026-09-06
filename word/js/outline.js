/* outline.js - navigation pane and the live counters in the status bar. */
(function (W) {
  'use strict';
  var $ = W.util.$, $$ = W.util.$$, el = W.util.el, debounce = W.util.debounce, ed;

  function init() {
    ed = W.editor;
    var refresh = debounce(function () { build(); counters(); }, 220);
    ed.on(function (kind) {
      if (kind === 'selection') return counters();
      refresh();
    });
    build();
    counters();
  }

  function build() {
    var box = $('#outline');
    if (!box) return;
    var heads = $$('h1,h2,h3,h4', ed.node);
    box.innerHTML = '';
    if (!heads.length) {
      box.appendChild(el('div', { class: 'empty', text: 'No headings yet. Apply Heading 1–4 and they show up here.' }));
      return;
    }
    heads.forEach(function (h, i) {
      if (!h.id) h.id = 'h-' + i + '-' + Math.random().toString(36).slice(2, 6);
      var lvl = +h.nodeName[1];
      var a = el('a', {
        href: '#' + h.id, class: 'lvl' + lvl,
        text: h.textContent.trim() || '(untitled heading)',
        onclick: function (e) {
          e.preventDefault();
          h.scrollIntoView({ behavior: 'smooth', block: 'center' });
          ed.selectNodeContentsEnd(h);
        }
      });
      box.appendChild(a);
    });
  }

  function counters() {
    var s = ed.stats();
    $('#st-words').textContent = s.words + (s.words === 1 ? ' word' : ' words');
    $('#st-chars').textContent = s.chars + ' characters';
    $('#st-pages').textContent = 'Page ' + currentPage(s.pages) + ' of ' + s.pages;
    $('#st-sel').textContent = s.selChars ? (s.selWords + ' words selected') : '';
  }

  function currentPage(total) {
    var r = ed.range();
    if (!r || total < 2) return 1;
    var g = ed.getPage();
    var contentH = g.px.h - g.px.t - g.px.b;
    var rect = r.getBoundingClientRect ? r.getBoundingClientRect() : null;
    if (!rect || (!rect.top && !rect.height)) return 1;
    var top = rect.top - ed.node.getBoundingClientRect().top;
    return Math.max(1, Math.min(total, Math.floor(top / contentH) + 1));
  }

  W.outline = { init: init, build: build, counters: counters };
})(window.W = window.W || {});
