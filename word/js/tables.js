/* tables.js - insert and edit tables. */
(function (W) {
  'use strict';
  var $ = W.util.$, $$ = W.util.$$, el = W.util.el, ed;

  function init() {
    ed = W.editor;
    buildPicker();

    var acts = {
      'row-above': function () { addRow(-1); }, 'row-below': function () { addRow(1); },
      'col-left': function () { addCol(-1); }, 'col-right': function () { addCol(1); },
      'del-row': delRow, 'del-col': delCol, 'del-table': delTable,
      'toggle-header': toggleHeader, 'toggle-borders': toggleBorders
    };
    Object.keys(acts).forEach(function (k) {
      var b = $('[data-act="' + k + '"]');
      if (b) b.addEventListener('click', acts[k]);
    });

    ed.node.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var cell = currentCell();
      if (!cell) return;
      e.preventDefault();
      var cells = $$('td,th', cell.closest('table'));
      var i = cells.indexOf(cell) + (e.shiftKey ? -1 : 1);
      if (i >= 0 && i < cells.length) ed.selectNodeContentsEnd(cells[i]);
      else if (!e.shiftKey) { addRow(1); var rows = cell.closest('table').rows; ed.selectNodeContentsEnd(rows[rows.length - 1].cells[0]); }
    });
  }

  function buildPicker() {
    var wrap = $('#grid-picker'), label = $('#grid-label');
    if (!wrap) return;
    var ROWS = 8, COLS = 10;
    for (var r = 1; r <= ROWS; r++) {
      for (var c = 1; c <= COLS; c++) {
        var cell = el('i', { 'data-r': r, 'data-c': c });
        wrap.appendChild(cell);
      }
    }
    wrap.addEventListener('mouseover', function (e) {
      if (e.target.tagName !== 'I') return;
      var r = +e.target.getAttribute('data-r'), c = +e.target.getAttribute('data-c');
      $$('i', wrap).forEach(function (n) {
        n.classList.toggle('on', +n.getAttribute('data-r') <= r && +n.getAttribute('data-c') <= c);
      });
      label.textContent = r + ' × ' + c + ' table';
    });
    wrap.addEventListener('click', function (e) {
      if (e.target.tagName !== 'I') return;
      insert(+e.target.getAttribute('data-r'), +e.target.getAttribute('data-c'));
      document.querySelectorAll('.menu.open').forEach(function (m) { m.classList.remove('open'); });
    });
  }

  function insert(rows, cols) {
    var html = '<table><thead><tr>';
    var i, j;
    for (j = 0; j < cols; j++) html += '<th><br></th>';
    html += '</tr></thead><tbody>';
    for (i = 1; i < rows; i++) {
      html += '<tr>';
      for (j = 0; j < cols; j++) html += '<td><br></td>';
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    ed.insertHTML(html);
  }

  function currentCell() {
    var b = ed.currentBlock();
    if (!b) return null;
    return b.closest ? b.closest('td,th') : null;
  }

  function addRow(dir) {
    var cell = currentCell();
    if (!cell) return;
    var tr = cell.parentNode, table = cell.closest('table');
    var cols = Math.max.apply(null, $$('tr', table).map(function (r) { return r.cells.length; }));
    var nr = el('tr');
    for (var i = 0; i < cols; i++) nr.appendChild(el('td', { html: '<br>' }));
    var body = table.tBodies[0] || table;
    if (tr.parentNode.tagName === 'THEAD' && dir > 0) body.insertBefore(nr, body.firstChild);
    else tr.parentNode.insertBefore(nr, dir > 0 ? tr.nextSibling : tr);
    ed.selectNodeContentsEnd(nr.cells[0]);
    ed.emit('input');
  }

  function addCol(dir) {
    var cell = currentCell();
    if (!cell) return;
    var index = Array.prototype.indexOf.call(cell.parentNode.cells, cell);
    var table = cell.closest('table');
    $$('tr', table).forEach(function (tr) {
      var isHead = tr.parentNode.tagName === 'THEAD';
      var nc = el(isHead ? 'th' : 'td', { html: '<br>' });
      var ref = tr.cells[index];
      if (!ref) tr.appendChild(nc);
      else tr.insertBefore(nc, dir > 0 ? ref.nextSibling : ref);
    });
    ed.emit('input');
  }

  function delRow() {
    var cell = currentCell();
    if (!cell) return;
    var tr = cell.parentNode, table = cell.closest('table');
    if ($$('tr', table).length <= 1) return delTable();
    tr.remove();
    ed.emit('input');
  }

  function delCol() {
    var cell = currentCell();
    if (!cell) return;
    var index = Array.prototype.indexOf.call(cell.parentNode.cells, cell);
    var table = cell.closest('table');
    if (Math.max.apply(null, $$('tr', table).map(function (r) { return r.cells.length; })) <= 1) return delTable();
    $$('tr', table).forEach(function (tr) { if (tr.cells[index]) tr.cells[index].remove(); });
    ed.emit('input');
  }

  function delTable() {
    var cell = currentCell();
    if (!cell) return;
    var table = cell.closest('table');
    var p = el('p', { html: '<br>' });
    table.parentNode.replaceChild(p, table);
    ed.selectNodeContentsEnd(p);
    ed.emit('input');
  }

  function toggleHeader() {
    var cell = currentCell();
    if (!cell) return;
    var table = cell.closest('table');
    if (table.tHead) {
      var head = table.tHead, body = table.tBodies[0] || table.appendChild(el('tbody'));
      $$('tr', head).forEach(function (tr) {
        $$('th', tr).forEach(function (th) {
          var td = el('td');
          while (th.firstChild) td.appendChild(th.firstChild);
          th.parentNode.replaceChild(td, th);
        });
        body.insertBefore(tr, body.firstChild);
      });
      head.remove();
    } else {
      var first = table.rows[0];
      if (!first) return;
      var thead = el('thead');
      $$('td', first).forEach(function (td) {
        var th = el('th');
        while (td.firstChild) th.appendChild(td.firstChild);
        td.parentNode.replaceChild(th, td);
      });
      thead.appendChild(first);
      table.insertBefore(thead, table.firstChild);
    }
    ed.emit('input');
  }

  function toggleBorders() {
    var cell = currentCell();
    if (!cell) return;
    cell.closest('table').classList.toggle('noborder');
    ed.emit('input');
  }

  W.tables = { init: init, insert: insert, currentCell: currentCell };
})(window.W = window.W || {});
