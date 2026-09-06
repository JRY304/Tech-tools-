/* docx-import.js - OOXML WordprocessingML (.docx) -> editor HTML. */
(function (W) {
  'use strict';
  var esc = W.util.escapeXml, U = W.util.U;

  function kids(node, name) {
    var out = [];
    for (var i = 0; i < node.childNodes.length; i++) {
      var c = node.childNodes[i];
      if (c.nodeType === 1 && (!name || c.localName === name)) out.push(c);
    }
    return out;
  }
  function first(node, name) { return kids(node, name)[0] || null; }
  function attr(node, name) {
    if (!node) return null;
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      if (a.localName === name || a.name === name) return a.value;
    }
    return null;
  }
  function val(node) { return node ? attr(node, 'val') : null; }
  function has(node, name) {
    var c = first(node, name);
    if (!c) return false;
    var v = val(c);
    return v === null || (v !== '0' && v !== 'false' && v !== 'none');
  }
  function deep(node, name) {
    return node.getElementsByTagName ? Array.prototype.slice.call(node.getElementsByTagName('*')).filter(function (e) { return e.localName === name; }) : [];
  }

  var MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', svg: 'image/svg+xml', webp: 'image/webp', emf: 'image/x-emf', wmf: 'image/x-wmf' };

  /* --------------------------------------------------------------- runs */
  function runStyle(rPr) {
    if (!rPr) return { css: '', tags: [] };
    var css = [], tags = [];
    if (has(rPr, 'b')) tags.push('strong');
    if (has(rPr, 'i')) tags.push('em');
    if (has(rPr, 'strike') || has(rPr, 'dstrike')) tags.push('s');
    var u = first(rPr, 'u');
    if (u && val(u) !== 'none') tags.push('u');
    var va = val(first(rPr, 'vertAlign'));
    if (va === 'superscript') tags.push('sup');
    if (va === 'subscript') tags.push('sub');

    var color = val(first(rPr, 'color'));
    if (color && color !== 'auto') css.push('color:#' + color);
    var sz = val(first(rPr, 'sz'));
    if (sz) css.push('font-size:' + (parseInt(sz, 10) / 2) + 'pt');
    var fonts = first(rPr, 'rFonts');
    var face = fonts && (attr(fonts, 'ascii') || attr(fonts, 'hAnsi'));
    if (face) css.push("font-family:'" + face.replace(/'/g, '') + "'");
    var hl = val(first(rPr, 'highlight'));
    var shd = first(rPr, 'shd');
    var fill = shd ? attr(shd, 'fill') : null;
    if (hl && hl !== 'none') css.push('background-color:' + hl);
    else if (fill && fill !== 'auto') css.push('background-color:#' + fill);

    return { css: css.join(';'), tags: tags };
  }

  function runHtml(r) {
    var rPr = first(r, 'rPr');
    var s = runStyle(rPr);
    var inner = '';

    kids(r).forEach(function (c) {
      switch (c.localName) {
        case 't': inner += esc(c.textContent).replace(/  /g, ' &nbsp;'); break;
        case 'br': inner += '<br>'; break;
        case 'tab': inner += '&nbsp;&nbsp;&nbsp;&nbsp;'; break;
        case 'noBreakHyphen': inner += '&#8209;'; break;
        case 'softHyphen': break;
        case 'sym': inner += '&#x' + (attr(c, 'char') || '25AA') + ';'; break;
        case 'drawing': case 'pict': case 'object': inner += imageHtml(c); break;
      }
    });
    if (!inner) return '';

    var html = inner;
    s.tags.forEach(function (t) { html = '<' + t + '>' + html + '</' + t + '>'; });
    if (s.css) html = '<span style="' + s.css + '">' + html + '</span>';
    return html;
  }

  var CTX = null;   /* {rels, media} while a conversion runs */

  function imageHtml(node) {
    var blip = deep(node, 'blip')[0] || deep(node, 'imagedata')[0];
    if (!blip) return '';
    var rid = attr(blip, 'embed') || attr(blip, 'id') || attr(blip, 'link');
    var target = rid && CTX.rels[rid];
    if (!target) return '';
    var path = target.indexOf('/') === 0 ? target.slice(1) : 'word/' + target.replace(/^\.\//, '');
    var bytes = CTX.media[path];
    if (!bytes) return '';
    var ext = (path.split('.').pop() || 'png').toLowerCase();
    var src = 'data:' + (MIME[ext] || 'image/png') + ';base64,' + W.zip.base64(bytes);

    var ext2 = deep(node, 'extent')[0];
    var wAttr = ext2 ? parseInt(attr(ext2, 'cx'), 10) : 0;
    var hAttr = ext2 ? parseInt(attr(ext2, 'cy'), 10) : 0;
    var w = wAttr ? U.emuToPx(wAttr) : null, h = hAttr ? U.emuToPx(hAttr) : null;
    return '<img src="' + src + '"' + (w ? ' width="' + w + '"' : '') + (h ? ' height="' + h + '"' : '') + ' alt="">';
  }

  function inlineHtml(container) {
    var out = '';
    kids(container).forEach(function (c) {
      switch (c.localName) {
        case 'r': out += runHtml(c); break;
        case 'hyperlink':
          var rid = attr(c, 'id');
          var href = rid && CTX.rels[rid] ? CTX.rels[rid] : (attr(c, 'anchor') ? '#' + attr(c, 'anchor') : '#');
          var body = inlineHtml(c);
          out += body ? '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + body + '</a>' : '';
          break;
        case 'commentRangeStart':
          out += '<span class="cmt" data-cid="dc-' + attr(c, 'id') + '">';
          break;
        case 'commentRangeEnd':
          out += '</span>';
          break;
        case 'ins': case 'smartTag': case 'sdt': case 'sdtContent': case 'bookmarkStart':
          out += inlineHtml(c); break;
        case 'del': break;
        case 'fldSimple': out += inlineHtml(c); break;
      }
    });
    return out;
  }

  /* --------------------------------------------------------------- paragraphs */
  var STYLE_MAP = {
    heading1: 'h1', heading2: 'h2', heading3: 'h3', heading4: 'h4', heading5: 'h4', heading6: 'h4',
    title: 'h1', subtitle: 'h2', quote: 'blockquote', intensequote: 'blockquote',
    htmlpreformatted: 'pre', code: 'pre', sourcecode: 'pre'
  };

  function paraInfo(p) {
    var pPr = first(p, 'pPr');
    var info = { tag: 'p', css: [], numId: null, ilvl: 0, html: inlineHtml(p) };
    if (deep(p, 'br').some(function (b) { return attr(b, 'type') === 'page'; })) {
      info.pageBreak = true;
      if (!/[^\s]/.test(info.html.replace(/<br>/g, ''))) info.empty = true;
    }
    if (!pPr) return info;

    var style = (val(first(pPr, 'pStyle')) || '').toLowerCase().replace(/[\s-]/g, '');
    if (STYLE_MAP[style]) info.tag = STYLE_MAP[style];

    var numPr = first(pPr, 'numPr');
    if (numPr) {
      var n = val(first(numPr, 'numId'));
      if (n && n !== '0') {
        info.numId = n;
        info.ilvl = parseInt(val(first(numPr, 'ilvl')) || '0', 10);
      }
    }

    var jc = val(first(pPr, 'jc'));
    var JC = { left: 'left', start: 'left', center: 'center', right: 'right', end: 'right', both: 'justify', distribute: 'justify' };
    if (JC[jc]) info.css.push('text-align:' + JC[jc]);

    var sp = first(pPr, 'spacing');
    if (sp) {
      var before = attr(sp, 'before'), after = attr(sp, 'after'), line = attr(sp, 'line'), rule = attr(sp, 'lineRule');
      if (before) info.css.push('margin-top:' + (parseInt(before, 10) / 20) + 'pt');
      if (after) info.css.push('margin-bottom:' + (parseInt(after, 10) / 20) + 'pt');
      if (line && rule !== 'exact' && rule !== 'atLeast') info.css.push('line-height:' + Math.round((parseInt(line, 10) / 240) * 100) / 100);
      else if (line) info.css.push('line-height:' + (parseInt(line, 10) / 20) + 'pt');
    }
    var ind = first(pPr, 'ind');
    if (ind && !info.numId) {
      var left = attr(ind, 'left') || attr(ind, 'start');
      if (left && parseInt(left, 10) > 0) info.css.push('margin-left:' + Math.round(U.twipToPx(parseInt(left, 10))) + 'px');
    }
    if (first(pPr, 'pageBreakBefore') && has(pPr, 'pageBreakBefore')) info.pageBreakBefore = true;
    return info;
  }

  function tableHtml(tbl) {
    var borders = deep(first(tbl, 'tblPr') || tbl, 'tblBorders')[0];
    var noBorder = false;
    if (borders) {
      var top = first(borders, 'top');
      if (top && (val(top) === 'none' || val(top) === 'nil')) noBorder = true;
    }
    var rows = kids(tbl, 'tr');
    if (!rows.length) return '';
    var headed = !!deep(first(rows[0], 'trPr') || rows[0], 'tblHeader')[0] || allBold(rows[0]);

    var out = '<table' + (noBorder ? ' class="noborder"' : '') + '>';
    if (headed) out += '<thead>' + rowHtml(rows[0], true) + '</thead>';
    out += '<tbody>';
    rows.slice(headed ? 1 : 0).forEach(function (tr) { out += rowHtml(tr, false); });
    return out + '</tbody></table>';
  }

  function rowHtml(tr, isHead) {
    var html = '<tr>';
    kids(tr, 'tc').forEach(function (tc) {
      var tcPr = first(tc, 'tcPr');
      var span = tcPr ? val(first(tcPr, 'gridSpan')) : null;
      var shd = tcPr ? first(tcPr, 'shd') : null;
      var fill = shd ? attr(shd, 'fill') : null;
      var tag = isHead ? 'th' : 'td';
      var style = (fill && fill !== 'auto' && fill.toUpperCase() !== 'EEF1F6') ? ' style="background-color:#' + fill + '"' : '';
      var inner = kids(tc).map(function (c) {
        if (c.localName === 'p') { return paraInfo(c).html || ''; }
        if (c.localName === 'tbl') return tableHtml(c);
        return '';
      }).filter(Boolean).join('<br>');
      html += '<' + tag + (span && +span > 1 ? ' colspan="' + span + '"' : '') + style + '>' + (inner || '<br>') + '</' + tag + '>';
    });
    return html + '</tr>';
  }

  function allBold(tr) {
    var cells = kids(tr, 'tc');
    if (!cells.length) return false;
    return cells.every(function (tc) {
      var runs = deep(tc, 'r');
      if (!runs.length) return false;
      return runs.every(function (r) { var rPr = first(r, 'rPr'); return rPr && has(rPr, 'b'); });
    });
  }

  /* --------------------------------------------------------------- lists */
  function flushList(items, numFmt) {
    /* items: [{ilvl, html}] all from one numId */
    var ordered = numFmt !== 'bullet';
    var out = '', stack = [];
    items.forEach(function (it) {
      while (stack.length > it.ilvl + 1) { out += '</li></' + stack.pop() + '>'; }
      if (stack.length === it.ilvl + 1) out += '</li>';
      while (stack.length < it.ilvl + 1) {
        var tag = ordered ? 'ol' : 'ul';
        out += '<' + tag + '>';
        stack.push(tag);
      }
      out += '<li>' + (it.html || '<br>');
    });
    while (stack.length) { out += '</li></' + stack.pop() + '>'; }
    return out;
  }

  /* --------------------------------------------------------------- page setup */
  function pageFromSect(sect) {
    if (!sect) return null;
    var sz = first(sect, 'pgSz');
    if (!sz) return null;
    var w = parseInt(attr(sz, 'w'), 10), h = parseInt(attr(sz, 'h'), 10);
    var orientation = (attr(sz, 'orient') === 'landscape' || w > h) ? 'landscape' : 'portrait';
    var lw = Math.min(w, h), lh = Math.max(w, h);
    var best = 'a4', bestDelta = Infinity;
    Object.keys(W.editor.PAGES).forEach(function (k) {
      var p = W.editor.PAGES[k];
      var d = Math.abs(p.tw[0] - lw) + Math.abs(p.tw[1] - lh);
      if (d < bestDelta) { bestDelta = d; best = k; }
    });
    var mar = first(sect, 'pgMar');
    var margins = 'normal';
    if (mar) {
      var left = parseInt(attr(mar, 'left') || '1440', 10);
      var presets = { narrow: 720, moderate: 1080, normal: 1440, wide: 2160 };
      var bd = Infinity;
      Object.keys(presets).forEach(function (k) {
        var d = Math.abs(presets[k] - left);
        if (d < bd) { bd = d; margins = k; }
      });
    }
    return { size: best, orientation: orientation, margins: margins };
  }

  /* --------------------------------------------------------------- entry */
  async function fromArrayBuffer(buf) {
    var parts = await W.zip.unzip(buf);
    var docPath = parts['word/document.xml'] ? 'word/document.xml' : Object.keys(parts).filter(function (k) { return /document\d*\.xml$/.test(k); })[0];
    if (!docPath) throw new Error('This file is not a Word document (word/document.xml is missing).');

    var parser = new DOMParser();
    var doc = parser.parseFromString(W.zip.text(parts[docPath]), 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('The document XML inside this .docx is malformed.');

    /* relationships */
    var rels = {};
    if (parts['word/_rels/document.xml.rels']) {
      var rdoc = parser.parseFromString(W.zip.text(parts['word/_rels/document.xml.rels']), 'application/xml');
      Array.prototype.slice.call(rdoc.getElementsByTagName('*')).forEach(function (r) {
        if (r.localName === 'Relationship') rels[attr(r, 'Id')] = attr(r, 'Target');
      });
    }

    /* numbering: numId -> format of level 0 */
    var numFmt = {};
    if (parts['word/numbering.xml']) {
      var ndoc = parser.parseFromString(W.zip.text(parts['word/numbering.xml']), 'application/xml');
      var abstracts = {};
      Array.prototype.slice.call(ndoc.getElementsByTagName('*')).forEach(function (n) {
        if (n.localName === 'abstractNum') {
          var id = attr(n, 'abstractNumId');
          var lvl0 = kids(n, 'lvl').filter(function (l) { return attr(l, 'ilvl') === '0'; })[0] || first(n, 'lvl');
          abstracts[id] = lvl0 ? (val(first(lvl0, 'numFmt')) || 'decimal') : 'decimal';
        }
      });
      Array.prototype.slice.call(ndoc.getElementsByTagName('*')).forEach(function (n) {
        if (n.localName === 'num') {
          var aid = val(first(n, 'abstractNumId'));
          numFmt[attr(n, 'numId')] = abstracts[aid] || 'decimal';
        }
      });
    }

    /* comments */
    var comments = {};
    if (parts['word/comments.xml']) {
      var cdoc = parser.parseFromString(W.zip.text(parts['word/comments.xml']), 'application/xml');
      Array.prototype.slice.call(cdoc.getElementsByTagName('*')).forEach(function (c) {
        if (c.localName !== 'comment') return;
        var id = 'dc-' + attr(c, 'id');
        comments[id] = {
          id: id,
          author: attr(c, 'author') || 'Author',
          date: attr(c, 'date') || new Date().toISOString(),
          text: Array.prototype.slice.call(c.getElementsByTagName('*')).filter(function (t) { return t.localName === 't'; })
            .map(function (t) { return t.textContent; }).join(''),
          quote: ''
        };
      });
    }

    CTX = { rels: rels, media: parts };

    var body = null;
    Array.prototype.slice.call(doc.getElementsByTagName('*')).some(function (n) {
      if (n.localName === 'body') { body = n; return true; }
      return false;
    });
    if (!body) throw new Error('The document has no body.');

    var html = '', pending = null, pendingNum = null;

    function flush() {
      if (pending && pending.length) html += flushList(pending, numFmt[pendingNum] || 'decimal');
      pending = null;
      pendingNum = null;
    }

    kids(body).forEach(function (node) {
      if (node.localName === 'p') {
        var info = paraInfo(node);
        if (info.numId) {
          if (pendingNum !== info.numId) { flush(); pending = []; pendingNum = info.numId; }
          pending.push(info);
          return;
        }
        flush();
        if (info.pageBreak || info.pageBreakBefore) html += '<div class="pagebreak" contenteditable="false"></div>';
        if (info.empty) return;
        var style = info.css.length ? ' style="' + info.css.join(';') + '"' : '';
        var inner = info.html || '<br>';
        if (info.tag === 'pre') html += '<pre' + style + '>' + inner + '</pre>';
        else html += '<' + info.tag + style + '>' + inner + '</' + info.tag + '>';
        return;
      }
      if (node.localName === 'tbl') { flush(); html += tableHtml(node); return; }
      if (node.localName === 'sdt') {
        var content = first(node, 'sdtContent');
        if (content) kids(content).forEach(function (c) { if (c.localName === 'p') html += '<p>' + (paraInfo(c).html || '<br>') + '</p>'; });
      }
    });
    flush();

    /* fill comment quotes from the produced markup */
    var probe = document.createElement('div');
    probe.innerHTML = html;
    Object.keys(comments).forEach(function (cid) {
      var span = probe.querySelector('.cmt[data-cid="' + cid + '"]');
      comments[cid].quote = span ? span.textContent.slice(0, 120) : '';
    });

    var page = pageFromSect(first(body, 'sectPr'));
    CTX = null;

    return { html: html || '<p><br></p>', comments: comments, page: page };
  }

  W.docxImport = { fromArrayBuffer: fromArrayBuffer };
})(window.W = window.W || {});
