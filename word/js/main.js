/* main.js - wiring: tabs, menus, actions, shortcuts, view options. */
(function (W) {
  'use strict';
  var $ = W.util.$, $$ = W.util.$$, el = W.util.el;

  var SYMBOLS = ('© ® ™ § ¶ † ‡ • … – — ‘ ’ “ ” « » ° ± × ÷ ≠ ≤ ≥ ≈ ∞ √ ∑ ∏ ∫ µ π Ω α β γ δ θ λ φ ' +
    '€ £ ¥ ¢ ₹ ₽ ½ ¼ ¾ ⅓ → ← ↑ ↓ ↔ ⇒ ⇔ ✓ ✗ ★ ☆ ☐ ☑ ♦ ♣ ♥ ♠ ← ⟶ ⌘ ⌥ ⇧ ⌫ ¿ ¡ ª º').split(' ');

  function init() {
    W.ui.init();
    W.editor.init();
    W.format.init();
    W.tables.init();
    W.outline.init();
    W.find.init();
    W.comments.init();
    W.files.init();
    W.store.init();

    tabs();
    menus();
    actions();
    viewOptions();
    pageOptions();
    symbols();
    shortcuts();

    if (localStorage.getItem('scribe.theme') === 'dark') document.body.classList.add('dark');
    document.body.classList.add('pageview');
    W.format.sync();
  }

  function tabs() {
    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.tab').forEach(function (x) { x.classList.remove('is-active'); });
        $$('.panel').forEach(function (p) { p.classList.remove('is-active'); });
        t.classList.add('is-active');
        $('.panel[data-panel="' + t.getAttribute('data-tab') + '"]').classList.add('is-active');
      });
    });
  }

  function menus() {
    $$('[data-menu]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var parent = btn.closest('.menu');
        var open = parent.classList.contains('open');
        $$('.menu').forEach(function (m) { m.classList.remove('open'); });
        parent.classList.toggle('open', !open);
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.menu')) $$('.menu').forEach(function (m) { m.classList.remove('open'); });
    });
  }

  var ACTS = {
    'new': function () { W.store.save(true); W.store.create(); W.ui.toast('New document'); },
    'open': function () { W.files.openPicker(); },
    'docs': function () { W.files.docsDialog(); },
    'save': function () { W.store.save(false); },
    'save-docx': function () { W.files.saveDocx(); },
    'save-html': function () { W.files.saveHtml(); },
    'save-txt': function () { W.files.saveTxt(); },
    'save-md': function () { W.files.saveMd(); },
    'print': function () { W.files.print(); },
    'props': function () { W.files.propsDialog(); },
    'word-count': function () { W.files.wordCountDialog(); },
    'find': function () { W.find.open(); },
    'add-comment': function () { W.comments.add(); },
    'insert-image': function () { $('#image-input').click(); },
    'insert-link': linkDialog,
    'insert-pagebreak': function () { W.format.insertPageBreak(); },
    'insert-date': function () { W.format.insertDate(); },
    'toggle-outline': function () { var p = $('#outline-pane'); p.hidden = !p.hidden; if (!p.hidden) W.outline.build(); },
    'toggle-comments': function () { var p = $('#comments-pane'); p.hidden = !p.hidden; if (!p.hidden) W.comments.render(); },
    'toggle-theme': function () {
      document.body.classList.toggle('dark');
      localStorage.setItem('scribe.theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    },
    'zoom-in': function () { setZoom(+$('#zoom').value + 10); },
    'zoom-out': function () { setZoom(+$('#zoom').value - 10); },
    'zoom-reset': function () { setZoom(100); }
  };

  function actions() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-act]');
      if (!t) return;
      var act = t.getAttribute('data-act');
      if (!ACTS[act]) return;
      e.preventDefault();
      $$('.menu').forEach(function (m) { m.classList.remove('open'); });
      ACTS[act]();
    });
  }

  function linkDialog() {
    var r = W.editor.range();
    var selected = r && !r.collapsed ? r.toString() : '';
    var url = el('input', { type: 'text', placeholder: 'https://example.com' });
    var text = el('input', { type: 'text', value: selected, placeholder: 'Text to show' });
    var body = el('div', {}, [el('label', { text: 'Address' }), url]);
    if (!selected) { body.appendChild(el('label', { text: 'Text to display' })); body.appendChild(text); }

    W.ui.modal({
      title: 'Insert link',
      body: body,
      buttons: [
        { label: 'Cancel' },
        { label: 'Insert', primary: true, onClick: function (close) {
          var u = url.value.trim();
          close();
          if (u) W.format.insertLink(u, selected || text.value.trim() || u);
        } }
      ],
      onOpen: function () { url.focus(); }
    });
  }

  function symbols() {
    var box = $('#symbols');
    SYMBOLS.forEach(function (s) {
      box.appendChild(el('button', {
        class: 'tbtn', text: s,
        onclick: function () { W.editor.insertHTML(W.util.escapeXml(s)); }
      }));
    });
  }

  function setZoom(z) {
    z = Math.max(50, Math.min(200, z));
    $('#zoom').value = z;
    $('#stage').style.zoom = (z / 100);
    $('#st-zoom').textContent = z + '%';
  }

  function viewOptions() {
    $('#zoom').addEventListener('input', function () { setZoom(+this.value); });
    $('#spellcheck').addEventListener('change', function () { W.editor.node.setAttribute('spellcheck', this.checked ? 'true' : 'false'); });
    $('#show-marks').addEventListener('change', function () { document.body.classList.toggle('marks', this.checked); });
    $('#readonly').addEventListener('change', function () {
      W.editor.node.setAttribute('contenteditable', this.checked ? 'false' : 'true');
      W.ui.toast(this.checked ? 'Read only' : 'Editing enabled');
    });
    $('#page-view').addEventListener('change', function () { document.body.classList.toggle('pageview', this.checked); W.editor.paginate(); });
    $('#focus-mode').addEventListener('change', function () { document.body.classList.toggle('focus', this.checked); });
    $('#ruler-on').addEventListener('change', function () { $('#ruler').hidden = !this.checked; });
    setZoom(100);
  }

  function pageOptions() {
    function push() {
      W.editor.setPage({
        size: $('#page-size').value,
        orientation: $('#orientation').value,
        margins: $('#margins').value
      });
      W.store.mark();
    }
    ['#page-size', '#orientation', '#margins'].forEach(function (sel) {
      $(sel).addEventListener('change', push);
    });
    ['#header-text', '#footer-text', '#page-numbers'].forEach(function (sel) {
      $(sel).addEventListener('change', function () { W.store.mark(); });
    });
  }

  function shortcuts() {
    document.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (!mod) {
        if (e.key === 'Escape' && !$('#findbar').hidden) W.find.close();
        return;
      }
      var k = e.key.toLowerCase();

      if (e.altKey && k === 'n') { e.preventDefault(); return ACTS['new'](); }
      if (e.altKey && '01234'.indexOf(k) > -1) {
        e.preventDefault();
        return W.format.setBlock(k === '0' ? 'p' : 'h' + k);
      }
      if (e.shiftKey && k === 's') { e.preventDefault(); return W.files.saveDocx(); }
      if (e.shiftKey && k === 'c') { e.preventDefault(); return W.comments.add(); }
      if (e.shiftKey && k === '&') { e.preventDefault(); return W.format.exec('insertOrderedList'); }
      if (e.shiftKey && k === '*') { e.preventDefault(); return W.format.exec('insertUnorderedList'); }

      switch (k) {
        case 's': e.preventDefault(); return W.store.save(false);
        case 'o': e.preventDefault(); return W.files.openPicker();
        case 'f': e.preventDefault(); return W.find.open();
        case 'h': e.preventDefault(); W.find.open(); return $('#replace-input').focus();
        case 'k': e.preventDefault(); return linkDialog();
        case 'enter': e.preventDefault(); return W.format.insertPageBreak();
        case 'b': case 'i': case 'u': return;   /* native execCommand handles these */
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.W = window.W || {});
