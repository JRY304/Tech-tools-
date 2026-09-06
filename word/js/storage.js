/* storage.js - documents kept in localStorage, plus autosave. */
(function (W) {
  'use strict';
  var $ = W.util.$;
  var KEY = 'scribe.docs.v1', CUR = 'scribe.current.v1';
  var current = null, dirty = false, ed;

  function readAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function writeAll(map) {
    try { localStorage.setItem(KEY, JSON.stringify(map)); return true; }
    catch (e) { W.ui.toast('Browser storage is full — download the document instead'); return false; }
  }

  function init() {
    ed = W.editor;
    var id = localStorage.getItem(CUR);
    var all = readAll();
    if (id && all[id]) load(id);
    else create();

    ed.on(function (kind) { if (kind !== 'selection') mark(); });
    $('#doc-title').addEventListener('input', function () { current.name = this.value; mark(); });
    setInterval(function () { if (dirty) save(true); }, 4000);
    window.addEventListener('beforeunload', function () { if (dirty) save(true); });
  }

  function mark() {
    dirty = true;
    $('#save-state').textContent = 'unsaved changes';
  }

  function meta() {
    return {
      header: $('#header-text').value,
      footer: $('#footer-text').value,
      pageNumbers: $('#page-numbers').checked
    };
  }

  function create(name) {
    current = {
      id: W.util.uid('doc'),
      name: name || 'Untitled document',
      html: '<h1>Untitled document</h1><p>Start typing, or open a .docx from File → Open.</p>',
      comments: {},
      page: { size: 'a4', orientation: 'portrait', margins: 'normal' },
      header: '', footer: '', pageNumbers: false,
      created: Date.now(), updated: Date.now()
    };
    apply();
    save(true);
    return current;
  }

  function apply() {
    $('#doc-title').value = current.name;
    ed.setHTML(current.html);
    W.comments.setAll(current.comments || {});
    ed.setPage(current.page || {});
    $('#page-size').value = (current.page && current.page.size) || 'a4';
    $('#orientation').value = (current.page && current.page.orientation) || 'portrait';
    $('#margins').value = (current.page && current.page.margins) || 'normal';
    $('#header-text').value = current.header || '';
    $('#footer-text').value = current.footer || '';
    $('#page-numbers').checked = !!current.pageNumbers;
    W.outline.build();
    W.outline.counters();
  }

  function save(silent) {
    if (!current) return;
    var m = meta();
    current.html = ed.getHTML();
    current.comments = W.comments.map();
    current.page = ed.getPage();
    current.page = { size: current.page.size, orientation: current.page.orientation, margins: current.page.margins };
    current.header = m.header;
    current.footer = m.footer;
    current.pageNumbers = m.pageNumbers;
    current.name = $('#doc-title').value || 'Untitled document';
    current.updated = Date.now();

    var all = readAll();
    all[current.id] = current;
    if (writeAll(all)) {
      localStorage.setItem(CUR, current.id);
      dirty = false;
      $('#save-state').textContent = 'saved ' + new Date().toLocaleTimeString();
      if (!silent) W.ui.toast('Saved to this browser');
    }
  }

  function load(id) {
    var all = readAll();
    if (!all[id]) return false;
    current = all[id];
    localStorage.setItem(CUR, id);
    apply();
    dirty = false;
    $('#save-state').textContent = 'saved';
    return true;
  }

  function replaceContent(doc) {
    /* doc: {name, html, comments, page, header, footer, pageNumbers} */
    current = {
      id: W.util.uid('doc'),
      name: doc.name || 'Untitled document',
      html: doc.html || '<p><br></p>',
      comments: doc.comments || {},
      page: doc.page || { size: 'a4', orientation: 'portrait', margins: 'normal' },
      header: doc.header || '', footer: doc.footer || '', pageNumbers: !!doc.pageNumbers,
      created: Date.now(), updated: Date.now()
    };
    apply();
    save(true);
  }

  function list() {
    var all = readAll();
    return Object.keys(all).map(function (k) { return all[k]; })
      .sort(function (a, b) { return b.updated - a.updated; });
  }

  function remove(id) {
    var all = readAll();
    delete all[id];
    writeAll(all);
    if (current && current.id === id) {
      var rest = list();
      if (rest.length) load(rest[0].id); else create();
    }
  }

  function duplicate(id) {
    var all = readAll();
    if (!all[id]) return;
    var copy = JSON.parse(JSON.stringify(all[id]));
    copy.id = W.util.uid('doc');
    copy.name = all[id].name + ' (copy)';
    copy.created = copy.updated = Date.now();
    all[copy.id] = copy;
    writeAll(all);
    return copy.id;
  }

  W.store = {
    init: init, save: save, load: load, list: list, remove: remove, duplicate: duplicate,
    create: create, replaceContent: replaceContent, mark: mark,
    get current() { return current; },
    meta: meta
  };
})(window.W = window.W || {});
