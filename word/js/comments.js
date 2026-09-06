/* comments.js - margin comments anchored to a text range. */
(function (W) {
  'use strict';
  var $ = W.util.$, $$ = W.util.$$, el = W.util.el, ed;
  var store = {};   /* cid -> {id, author, text, date, quote} */

  function author() {
    return localStorage.getItem('scribe.author') || 'You';
  }
  function setAuthor(name) { localStorage.setItem('scribe.author', name || 'You'); }

  function init() {
    ed = W.editor;
    ed.on(function (kind) { if (kind === 'load') { prune(); render(); } });
    ed.node.addEventListener('click', function (e) {
      var span = e.target.closest && e.target.closest('.cmt');
      if (span) activate(span.getAttribute('data-cid'));
    });
  }

  function add() {
    var r = ed.range();
    if (!r || r.collapsed) return W.ui.toast('Select the text you want to comment on first');
    var quote = r.toString().slice(0, 120);
    W.ui.prompt({
      title: 'New comment',
      label: 'Comment on "' + quote.slice(0, 60) + (quote.length > 60 ? '…' : '') + '"',
      multiline: true,
      ok: 'Add comment'
    }, function (text) {
      if (!text) return;
      var cid = W.util.uid('c');
      var span = el('span', { class: 'cmt', 'data-cid': cid });
      try { r.surroundContents(span); }
      catch (err) { span.appendChild(r.extractContents()); r.insertNode(span); }
      store[cid] = { id: cid, author: author(), text: text, date: new Date().toISOString(), quote: quote };
      ed.emit('input');
      $('#comments-pane').hidden = false;
      render();
      activate(cid);
    });
  }

  function remove(cid) {
    var span = $('.cmt[data-cid="' + cid + '"]', ed.node);
    if (span) {
      var parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      span.remove();
      parent.normalize();
    }
    delete store[cid];
    ed.emit('input');
    render();
  }

  function activate(cid) {
    $$('.cmt', ed.node).forEach(function (s) { s.classList.toggle('active', s.getAttribute('data-cid') === cid); });
    $$('.comment-card').forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-cid') === cid); });
    var span = $('.cmt[data-cid="' + cid + '"]', ed.node);
    if (span) span.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function prune() {
    Object.keys(store).forEach(function (cid) {
      if (!$('.cmt[data-cid="' + cid + '"]', ed.node)) delete store[cid];
    });
    $$('.cmt', ed.node).forEach(function (s) {
      var cid = s.getAttribute('data-cid');
      if (!store[cid]) store[cid] = { id: cid, author: 'Unknown', text: '(comment text not found)', date: new Date().toISOString(), quote: s.textContent.slice(0, 120) };
    });
  }

  function ordered() {
    var order = $$('.cmt', ed.node).map(function (s) { return s.getAttribute('data-cid'); });
    return order.filter(function (c) { return store[c]; }).map(function (c) { return store[c]; });
  }

  function render() {
    var box = $('#comments');
    if (!box) return;
    prune();
    var list = ordered();
    box.innerHTML = '';
    if (!list.length) {
      box.appendChild(el('div', { class: 'empty', text: 'No comments. Select text and use Review → New comment.' }));
      return;
    }
    list.forEach(function (c) {
      var card = el('div', { class: 'comment-card', 'data-cid': c.id, onclick: function () { activate(c.id); } }, [
        el('div', { class: 'who', text: c.author }),
        el('div', { class: 'when', text: new Date(c.date).toLocaleString() }),
        el('div', { class: 'quote', text: '“' + c.quote + '”' }),
        el('div', { class: 'body', text: c.text }),
        el('div', { class: 'acts' }, [
          el('button', { class: 'tbtn', text: 'Edit', onclick: function (e) { e.stopPropagation(); edit(c.id); } }),
          el('button', { class: 'tbtn', text: 'Resolve', onclick: function (e) { e.stopPropagation(); remove(c.id); } })
        ])
      ]);
      box.appendChild(card);
    });
  }

  function edit(cid) {
    var c = store[cid];
    if (!c) return;
    W.ui.prompt({ title: 'Edit comment', label: 'Comment', multiline: true, value: c.text, ok: 'Save' }, function (text) {
      if (text == null) return;
      c.text = text;
      c.date = new Date().toISOString();
      ed.emit('input');
      render();
    });
  }

  W.comments = {
    init: init, add: add, remove: remove, render: render, activate: activate,
    all: ordered,
    map: function () { return store; },
    setAll: function (obj) { store = obj || {}; render(); },
    author: author, setAuthor: setAuthor
  };
})(window.W = window.W || {});
