/* docx-export.js - editor DOM -> OOXML WordprocessingML (.docx). */
(function (W) {
  'use strict';
  var esc = W.util.escapeXml, hex = W.util.toHex, U = W.util.U;

  var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

  var REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  var HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  var MIME_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/gif': 'gif', 'image/bmp': 'bmp', 'image/webp': 'webp', 'image/svg+xml': 'svg' };

  /* ------------------------------------------------------------------ context */
  function Ctx(page) {
    this.page = page;
    this.rels = [];
    this.media = [];
    this.comments = [];
    this.cmap = {};
    this.numIds = [];          /* {numId, abstract} */
    this.relSeq = 10;          /* 1..9 reserved for fixed parts */
    this.docPr = 1;
    this.bulletNumId = null;
  }
  Ctx.prototype.rel = function (type, target, mode) {
    var id = 'rId' + (this.relSeq++);
    this.rels.push({ id: id, type: REL + type, target: target, mode: mode });
    return id;
  };
  Ctx.prototype.num = function (abstract) {
    var numId = this.numIds.length + 1;
    this.numIds.push({ numId: numId, abstract: abstract });
    return numId;
  };
  Ctx.prototype.bullet = function () {
    if (this.bulletNumId == null) this.bulletNumId = this.num(0);
    return this.bulletNumId;
  };

  /* ------------------------------------------------------------------ runs */
  function baseFmt() {
    return { b: false, i: false, u: false, strike: false, vert: null, color: null, shd: null, font: null, sz: null, link: null, code: false };
  }

  function fmtFor(node, fmt) {
    var f = {}, k;
    for (k in fmt) f[k] = fmt[k];
    var tag = node.nodeName;

    if (tag === 'B' || tag === 'STRONG') f.b = true;
    if (tag === 'I' || tag === 'EM' || tag === 'CITE') f.i = true;
    if (tag === 'U' || tag === 'INS') f.u = true;
    if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') f.strike = true;
    if (tag === 'SUP') f.vert = 'superscript';
    if (tag === 'SUB') f.vert = 'subscript';
    if (tag === 'CODE' || tag === 'KBD' || tag === 'SAMP' || tag === 'PRE') { f.code = true; f.font = f.font || 'Consolas'; }
    if (tag === 'MARK') f.shd = f.shd || 'FFF3BF';
    if (tag === 'A' && node.getAttribute('href')) f.link = node.getAttribute('href');
    if (tag === 'FONT') {
      if (node.getAttribute('color')) f.color = hex(node.getAttribute('color'));
      if (node.getAttribute('face')) f.font = node.getAttribute('face').split(',')[0].replace(/["']/g, '').trim();
    }

    var s = node.style;
    if (s) {
      if (s.fontWeight) f.b = (s.fontWeight === 'bold' || s.fontWeight === 'bolder' || parseInt(s.fontWeight, 10) >= 600);
      if (s.fontStyle === 'italic' || s.fontStyle === 'oblique') f.i = true;
      if (s.fontStyle === 'normal') f.i = false;
      if (s.textDecorationLine || s.textDecoration) {
        var d = (s.textDecorationLine || s.textDecoration);
        if (d.indexOf('underline') > -1) f.u = true;
        if (d.indexOf('line-through') > -1) f.strike = true;
      }
      if (s.color) { var c = hex(s.color); if (c) f.color = c; }
      if (s.backgroundColor) { var bg = hex(s.backgroundColor); if (bg) f.shd = bg; }
      if (s.fontFamily) f.font = s.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      if (s.fontSize) { var pt = U.cssToPt(s.fontSize, 11); if (pt) f.sz = Math.round(pt * 2); }
      if (s.verticalAlign === 'super') f.vert = 'superscript';
      if (s.verticalAlign === 'sub') f.vert = 'subscript';
    }
    return f;
  }

  function rPr(f) {
    var x = '';
    if (f.font) x += '<w:rFonts w:ascii="' + esc(f.font) + '" w:hAnsi="' + esc(f.font) + '" w:cs="' + esc(f.font) + '"/>';
    if (f.b) x += '<w:b/>';
    if (f.i) x += '<w:i/>';
    if (f.strike) x += '<w:strike/>';
    if (f.color) x += '<w:color w:val="' + f.color + '"/>';
    if (f.sz) x += '<w:sz w:val="' + f.sz + '"/><w:szCs w:val="' + f.sz + '"/>';
    if (f.u) x += '<w:u w:val="single"/>';
    if (f.shd) x += '<w:shd w:val="clear" w:color="auto" w:fill="' + f.shd + '"/>';
    if (f.vert) x += '<w:vertAlign w:val="' + f.vert + '"/>';
    if (f.link) x = '<w:rStyle w:val="Hyperlink"/>' + x;
    return x ? '<w:rPr>' + x + '</w:rPr>' : '';
  }

  function textRuns(text, f) {
    if (!text) return '';
    var parts = String(text).split('\n'), out = '';
    parts.forEach(function (p, i) {
      if (i) out += '<w:r>' + rPr(f) + '<w:br/></w:r>';
      if (p) out += '<w:r>' + rPr(f) + '<w:t xml:space="preserve">' + esc(p) + '</w:t></w:r>';
    });
    return out;
  }

  /* inline content of an element -> run XML */
  function inline(node, f, ctx) {
    var out = '';
    for (var i = 0; i < node.childNodes.length; i++) {
      var c = node.childNodes[i];

      if (c.nodeType === 3) { out += textRuns(c.nodeValue.replace(/ /g, ' '), f); continue; }
      if (c.nodeType !== 1) continue;

      var tag = c.nodeName;
      if (tag === 'BR') { out += '<w:r>' + rPr(f) + '<w:br/></w:r>'; continue; }
      if (tag === 'IMG') { out += drawing(c, ctx); continue; }
      if (tag === 'MARK' && c.classList.contains('find-hit')) { out += inline(c, f, ctx); continue; }

      if (tag === 'SPAN' && c.classList.contains('cmt')) {
        var cid = c.getAttribute('data-cid');
        var id = ctx.cmap[cid];
        if (id == null) { out += inline(c, fmtFor(c, f), ctx); continue; }
        out += '<w:commentRangeStart w:id="' + id + '"/>' + inline(c, f, ctx) +
          '<w:commentRangeEnd w:id="' + id + '"/>' +
          '<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="' + id + '"/></w:r>';
        continue;
      }

      var nf = fmtFor(c, f);
      if (tag === 'A' && nf.link) {
        var rid = ctx.rel('hyperlink', nf.link, 'External');
        out += '<w:hyperlink r:id="' + rid + '">' + inline(c, nf, ctx) + '</w:hyperlink>';
        continue;
      }
      out += inline(c, nf, ctx);
    }
    return out;
  }

  function drawing(img, ctx) {
    var src = img.getAttribute('src') || '';
    var m = src.match(/^data:([^;,]+)(;base64)?,(.*)$/);
    if (!m) return '';                            /* only embedded images travel in the file */
    var mime = m[1].toLowerCase();
    var ext = MIME_EXT[mime] || 'png';
    var bytes = m[2] ? W.zip.fromBase64(m[3]) : new TextEncoder().encode(decodeURIComponent(m[3]));
    var name = 'image' + (ctx.media.length + 1) + '.' + ext;
    ctx.media.push({ name: 'word/media/' + name, data: bytes, ext: ext, mime: mime });
    var rid = ctx.rel('image', 'media/' + name);

    var maxW = U.twipToPx(ctx.page.twips.w - ctx.page.twips.l - ctx.page.twips.r);
    var w = parseFloat(img.getAttribute('width')) || img.naturalWidth || img.width || 400;
    var h = parseFloat(img.getAttribute('height')) || img.naturalHeight || img.height || Math.round(w * 0.75);
    if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
    var cx = U.pxToEmu(w), cy = U.pxToEmu(h), id = ctx.docPr++;
    var alt = esc(img.getAttribute('alt') || '');

    return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
      '<wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/>' +
      '<wp:docPr id="' + id + '" name="Picture ' + id + '" descr="' + alt + '"/>' +
      '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<pic:pic><pic:nvPicPr><pic:cNvPr id="' + id + '" name="' + esc(name) + '" descr="' + alt + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
      '<pic:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>' +
      '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>' +
      '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  }

  /* ------------------------------------------------------------------ paragraphs */
  function pPr(node, opts) {
    opts = opts || {};
    var x = '';
    if (opts.style) x += '<w:pStyle w:val="' + opts.style + '"/>';
    if (opts.numId) x += '<w:numPr><w:ilvl w:val="' + (opts.ilvl || 0) + '"/><w:numId w:val="' + opts.numId + '"/></w:numPr>';
    if (opts.border) x += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="C9CED8"/></w:pBdr>';

    var s = node && node.style ? node.style : null;
    var spacing = '';
    if (s) {
      var before = U.cssToPt(s.marginTop), after = U.cssToPt(s.marginBottom);
      if (before != null && s.marginTop) spacing += ' w:before="' + U.ptToTwip(before) + '"';
      if (after != null && s.marginBottom) spacing += ' w:after="' + U.ptToTwip(after) + '"';
      if (s.lineHeight) {
        var lh = parseFloat(s.lineHeight);
        if (!isNaN(lh)) {
          if (s.lineHeight.indexOf('pt') > -1 || s.lineHeight.indexOf('px') > -1) {
            spacing += ' w:line="' + U.ptToTwip(U.cssToPt(s.lineHeight)) + '" w:lineRule="exact"';
          } else {
            spacing += ' w:line="' + Math.round(lh * 240) + '" w:lineRule="auto"';
          }
        }
      }
    }
    if (opts.spacing) spacing += opts.spacing;
    if (spacing) x += '<w:spacing' + spacing + '/>';

    var ind = '';
    if (s && s.marginLeft) {
      var left = U.cssToPt(s.marginLeft);
      if (left) ind += ' w:left="' + U.ptToTwip(left) + '"';
    }
    if (opts.indLeft) ind += ' w:left="' + opts.indLeft + '"';
    if (opts.hanging) ind += ' w:hanging="' + opts.hanging + '"';
    if (ind) x += '<w:ind' + ind + '/>';

    var align = s && s.textAlign ? s.textAlign : (opts.align || '');
    var JC = { left: 'left', start: 'left', center: 'center', right: 'right', end: 'right', justify: 'both' };
    if (JC[align]) x += '<w:jc w:val="' + JC[align] + '"/>';

    var f = node ? fmtFor(node, baseFmt()) : null;
    var runProps = f ? rPr({ b: f.b, i: f.i, u: f.u, strike: f.strike, color: f.color, font: f.font, sz: f.sz, shd: null, vert: null, link: null }) : '';
    if (runProps) x += runProps;

    return x ? '<w:pPr>' + x + '</w:pPr>' : '';
  }

  function para(node, ctx, opts) {
    var inner = node ? inline(node, blockFmt(node, opts), ctx) : '';
    return '<w:p>' + pPr(node, opts) + inner + '</w:p>';
  }

  /* character formatting that a block element imposes on its runs */
  function blockFmt(node, opts) {
    var f = fmtFor(node, baseFmt());
    if (opts && opts.style === 'Code') f.font = f.font || 'Consolas';
    /* pStyle carries heading looks; don't duplicate them as direct run formatting */
    if (opts && /^Heading/.test(opts.style || '')) { f.color = null; f.sz = null; f.b = false; }
    return f;
  }

  /* ------------------------------------------------------------------ blocks */
  function blocks(parent, ctx, inherit) {
    var out = '';
    for (var i = 0; i < parent.childNodes.length; i++) {
      out += block(parent.childNodes[i], ctx, inherit || {});
    }
    return out;
  }

  function block(n, ctx, inherit) {
    if (n.nodeType === 3) {
      if (!n.nodeValue.trim()) return '';
      return '<w:p>' + textRuns(n.nodeValue, baseFmt()) + '</w:p>';
    }
    if (n.nodeType !== 1) return '';

    var tag = n.nodeName;

    if (tag === 'DIV' && n.classList.contains('pagebreak')) {
      return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    }
    if (tag === 'P' || tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE' || tag === 'HEADER' || tag === 'FOOTER') {
      if (hasBlockChild(n)) return blocks(n, ctx, inherit);
      return para(n, ctx, inherit);
    }
    if (/^H[1-6]$/.test(tag)) {
      var lvl = Math.min(4, +tag[1]);
      return para(n, ctx, { style: 'Heading' + lvl });
    }
    if (tag === 'BLOCKQUOTE') {
      if (hasBlockChild(n)) return blocks(n, ctx, { style: 'Quote' });
      return para(n, ctx, { style: 'Quote' });
    }
    if (tag === 'PRE') return para(n, ctx, { style: 'Code' });
    if (tag === 'HR') return '<w:p>' + pPr(null, { border: true }) + '</w:p>';
    if (tag === 'UL' || tag === 'OL') return list(n, ctx, 0, null);
    if (tag === 'TABLE') return table(n, ctx);
    if (tag === 'IMG') return '<w:p>' + drawing(n, ctx) + '</w:p>';
    if (tag === 'BR') return '<w:p/>';
    if (tag === 'SCRIPT' || tag === 'STYLE') return '';

    /* inline element sitting directly in the body */
    return para(n, ctx, inherit);
  }

  function hasBlockChild(n) {
    return !!n.querySelector && !!n.querySelector('p,div,h1,h2,h3,h4,h5,h6,ul,ol,table,blockquote,pre,hr');
  }

  function list(node, ctx, depth, numId) {
    var ordered = node.nodeName === 'OL';
    if (numId == null) numId = ordered ? ctx.num(1) : ctx.bullet();
    var out = '';
    for (var i = 0; i < node.children.length; i++) {
      var li = node.children[i];
      if (li.nodeName !== 'LI') continue;

      var nested = [];
      for (var j = 0; j < li.children.length; j++) {
        if (li.children[j].nodeName === 'UL' || li.children[j].nodeName === 'OL') nested.push(li.children[j]);
      }
      var clone = li.cloneNode(true);
      Array.prototype.slice.call(clone.querySelectorAll('ul,ol')).forEach(function (x) { x.remove(); });

      out += '<w:p>' + pPr(li, { style: 'ListParagraph', numId: numId, ilvl: depth }) +
        inline(clone, blockFmt(li, {}), ctx) + '</w:p>';

      nested.forEach(function (sub) {
        out += list(sub, ctx, depth + 1, sub.nodeName === 'OL' ? (ordered ? numId : ctx.num(1)) : ctx.bullet());
      });
    }
    return out;
  }

  function table(node, ctx) {
    var rows = Array.prototype.slice.call(node.querySelectorAll('tr'));
    if (!rows.length) return '';
    var cols = 0;
    rows.forEach(function (r) {
      var n = 0;
      Array.prototype.slice.call(r.cells).forEach(function (c) { n += (c.colSpan || 1); });
      cols = Math.max(cols, n);
    });
    var usable = ctx.page.twips.w - ctx.page.twips.l - ctx.page.twips.r;
    var colW = Math.floor(usable / cols);
    var noBorder = node.classList.contains('noborder');

    var x = '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/>';
    x += noBorder
      ? '<w:tblBorders><w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/></w:tblBorders>'
      : '<w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/><w:left w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/><w:right w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/><w:insideH w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/><w:insideV w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/></w:tblBorders>';
    x += '<w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>';
    for (var c = 0; c < cols; c++) x += '<w:gridCol w:w="' + colW + '"/>';
    x += '</w:tblGrid>';

    rows.forEach(function (tr) {
      var isHead = tr.parentNode.nodeName === 'THEAD';
      x += '<w:tr>';
      if (isHead) x += '<w:trPr><w:tblHeader/></w:trPr>';
      Array.prototype.slice.call(tr.cells).forEach(function (cell) {
        var span = cell.colSpan || 1;
        x += '<w:tc><w:tcPr><w:tcW w:w="' + (colW * span) + '" w:type="dxa"/>';
        if (span > 1) x += '<w:gridSpan w:val="' + span + '"/>';
        if (cell.rowSpan > 1) x += '<w:vMerge w:val="restart"/>';
        var fill = hex(cell.style.backgroundColor) || (cell.nodeName === 'TH' ? 'EEF1F6' : null);
        if (fill) x += '<w:shd w:val="clear" w:color="auto" w:fill="' + fill + '"/>';
        x += '</w:tcPr>';
        var body = hasBlockChild(cell) ? blocks(cell, ctx, {}) : para(cell, ctx, { spacing: ' w:before="0" w:after="0"' });
        x += body || '<w:p/>';
        x += '</w:tc>';
      });
      x += '</w:tr>';
    });
    return x + '</w:tbl><w:p/>';
  }

  /* ------------------------------------------------------------------ parts */
  function sectPr(ctx, opts) {
    var t = ctx.page.twips;
    var x = '<w:sectPr>';
    if (opts.headerRel) x += '<w:headerReference w:type="default" r:id="' + opts.headerRel + '"/>';
    if (opts.footerRel) x += '<w:footerReference w:type="default" r:id="' + opts.footerRel + '"/>';
    x += '<w:pgSz w:w="' + t.w + '" w:h="' + t.h + '"' + (ctx.page.orientation === 'landscape' ? ' w:orient="landscape"' : '') + '/>';
    x += '<w:pgMar w:top="' + t.t + '" w:right="' + t.r + '" w:bottom="' + t.b + '" w:left="' + t.l + '" w:header="708" w:footer="708" w:gutter="0"/>';
    x += '<w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>';
    return x;
  }

  function headerFooterXml(text, withNumbers, isFooter) {
    var tag = isFooter ? 'w:ftr' : 'w:hdr';
    var body = '<w:p><w:pPr><w:jc w:val="' + (isFooter ? 'center' : 'right') + '"/><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr></w:pPr>';
    if (text) body += '<w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">' + esc(text) + (withNumbers ? '  ' : '') + '</w:t></w:r>';
    if (withNumbers) {
      body += '<w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">Page </w:t></w:r>' +
        '<w:fldSimple w:instr=" PAGE "><w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>' +
        '<w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve"> of </w:t></w:r>' +
        '<w:fldSimple w:instr=" NUMPAGES "><w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>';
    }
    body += '</w:p>';
    return HEAD + '<' + tag + ' ' + NS + '>' + body + '</' + tag + '>';
  }

  function stylesXml() {
    function heading(n, szHalfPt, color, italic) {
      return '<w:style w:type="paragraph" w:styleId="Heading' + n + '"><w:name w:val="heading ' + n + '"/>' +
        '<w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>' +
        '<w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="' + (n === 1 ? 0 : 360) + '" w:after="120"/><w:outlineLvl w:val="' + (n - 1) + '"/></w:pPr>' +
        '<w:rPr><w:b/>' + (italic ? '<w:i/>' : '') + '<w:color w:val="' + color + '"/><w:sz w:val="' + szHalfPt + '"/><w:szCs w:val="' + szHalfPt + '"/></w:rPr></w:style>';
    }
    return HEAD + '<w:styles ' + NS + '>' +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault>' +
      '<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
      heading(1, 40, '1A3A6B') + heading(2, 32, '1A3A6B') + heading(3, 26, '1A3A6B') + heading(4, 23, '1A3A6B', true) +
      '<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:qFormat/>' +
      '<w:pPr><w:ind w:left="720"/><w:pBdr><w:left w:val="single" w:sz="12" w:space="8" w:color="C8D2E4"/></w:pBdr></w:pPr>' +
      '<w:rPr><w:i/><w:color w:val="444455"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="HTML Preformatted"/><w:basedOn w:val="Normal"/>' +
      '<w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F4F5F7"/><w:spacing w:after="160" w:line="240" w:lineRule="auto"/></w:pPr>' +
      '<w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:qFormat/>' +
      '<w:pPr><w:contextualSpacing/></w:pPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="CommentText"><w:name w:val="annotation text"/><w:basedOn w:val="Normal"/>' +
      '<w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style>' +
      '<w:style w:type="character" w:styleId="CommentReference"><w:name w:val="annotation reference"/><w:rPr><w:sz w:val="16"/></w:rPr></w:style>' +
      '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="1155CC"/><w:u w:val="single"/></w:rPr></w:style>' +
      '<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/>' +
      '<w:tblPr><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/><w:left w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/>' +
      '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/><w:right w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/>' +
      '<w:insideH w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/><w:insideV w:val="single" w:sz="6" w:space="0" w:color="9AA3B2"/></w:tblBorders></w:tblPr></w:style>' +
      '</w:styles>';
  }

  function numberingXml(ctx) {
    var BULLETS = ['\uF0B7', 'o', '\uF0A7'];   /* Symbol dot, letter o, Wingdings square */
    var FONTS = ['Symbol', 'Courier New', 'Wingdings'];
    var lvls = '', i;
    for (i = 0; i < 9; i++) {
      lvls += '<w:lvl w:ilvl="' + i + '"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="' +
        BULLETS[i % 3] + '"/><w:lvlJc w:val="left"/>' +
        '<w:pPr><w:ind w:left="' + (720 * (i + 1)) + '" w:hanging="360"/></w:pPr>' +
        '<w:rPr><w:rFonts w:ascii="' + FONTS[i % 3] + '" w:hAnsi="' + FONTS[i % 3] + '" w:hint="default"/></w:rPr></w:lvl>';
    }
    var decFmt = ['decimal', 'lowerLetter', 'lowerRoman'];
    var decText = ['%1.', '%2.', '%3.', '%4.', '%5.', '%6.', '%7.', '%8.', '%9.'];
    var dec = '';
    for (i = 0; i < 9; i++) {
      dec += '<w:lvl w:ilvl="' + i + '"><w:start w:val="1"/><w:numFmt w:val="' + decFmt[i % 3] + '"/><w:lvlText w:val="' + decText[i] + '"/>' +
        '<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="' + (720 * (i + 1)) + '" w:hanging="360"/></w:pPr></w:lvl>';
    }
    var nums = ctx.numIds.map(function (n) {
      return '<w:num w:numId="' + n.numId + '"><w:abstractNumId w:val="' + n.abstract + '"/></w:num>';
    }).join('');
    return HEAD + '<w:numbering ' + NS + '>' +
      '<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>' + lvls + '</w:abstractNum>' +
      '<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>' + dec + '</w:abstractNum>' +
      nums + '</w:numbering>';
  }

  function commentsXml(list) {
    var x = list.map(function (c, i) {
      return '<w:comment w:id="' + i + '" w:author="' + esc(c.author || 'Author') + '" w:date="' + esc(c.date || W.util.isoDate()) +
        '" w:initials="' + esc((c.author || 'A').slice(0, 2).toUpperCase()) + '">' +
        '<w:p><w:pPr><w:pStyle w:val="CommentText"/></w:pPr>' +
        '<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:annotationRef/></w:r>' +
        '<w:r><w:t xml:space="preserve">' + esc(c.text || '') + '</w:t></w:r></w:p></w:comment>';
    }).join('');
    return HEAD + '<w:comments ' + NS + '>' + x + '</w:comments>';
  }

  function contentTypes(ctx, opts) {
    var exts = {};
    ctx.media.forEach(function (m) { exts[m.ext] = m.mime; });
    var defaults = '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>';
    Object.keys(exts).forEach(function (e) { defaults += '<Default Extension="' + e + '" ContentType="' + exts[e] + '"/>'; });

    var parts = '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>';
    if (ctx.comments.length) parts += '<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>';
    if (opts.headerRel) parts += '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>';
    if (opts.footerRel) parts += '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>';

    return HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' + defaults + parts + '</Types>';
  }

  function docRels(ctx) {
    var fixed =
      '<Relationship Id="rId1" Type="' + REL + 'styles" Target="styles.xml"/>' +
      '<Relationship Id="rId2" Type="' + REL + 'numbering" Target="numbering.xml"/>';
    if (ctx.comments.length) fixed += '<Relationship Id="rId3" Type="' + REL + 'comments" Target="comments.xml"/>';
    var rest = ctx.rels.map(function (r) {
      return '<Relationship Id="' + r.id + '" Type="' + r.type + '" Target="' + esc(r.target) + '"' +
        (r.mode ? ' TargetMode="' + r.mode + '"' : '') + '/>';
    }).join('');
    return HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + fixed + rest + '</Relationships>';
  }

  function coreXml(title, author) {
    var now = W.util.isoDate();
    return HEAD + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
      'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:title>' + esc(title) + '</dc:title><dc:creator>' + esc(author) + '</dc:creator>' +
      '<cp:lastModifiedBy>' + esc(author) + '</cp:lastModifiedBy>' +
      '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created>' +
      '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified></cp:coreProperties>';
  }

  function appXml(stats) {
    return HEAD + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" ' +
      'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
      '<Application>Scribe</Application><Pages>' + (stats.pages || 1) + '</Pages><Words>' + (stats.words || 0) + '</Words>' +
      '<Characters>' + (stats.chars || 0) + '</Characters><Paragraphs>' + (stats.paragraphs || 0) + '</Paragraphs></Properties>';
  }

  /* ------------------------------------------------------------------ entry */
  function cleanClone(node) {
    var clone = node.cloneNode(true);
    Array.prototype.slice.call(clone.querySelectorAll('mark.find-hit')).forEach(function (m) {
      var p = m.parentNode;
      while (m.firstChild) p.insertBefore(m.firstChild, m);
      m.remove();
    });
    Array.prototype.slice.call(clone.querySelectorAll('script,style')).forEach(function (n) { n.remove(); });
    clone.normalize();
    return clone;
  }

  /* opts: {node, title, author, page, comments, header, footer, pageNumbers, stats} */
  async function toBlob(opts) {
    var page = opts.page || W.editor.getPage();
    var ctx = new Ctx(page);
    ctx.comments = (opts.comments || []).slice();
    ctx.comments.forEach(function (c, i) { ctx.cmap[c.id] = i; });

    var root = cleanClone(opts.node);
    var body = blocks(root, ctx, {});

    var hf = {};
    var wantHeader = !!(opts.header && opts.header.trim());
    var wantFooter = !!((opts.footer && opts.footer.trim()) || opts.pageNumbers);
    if (wantHeader) hf.headerRel = ctx.rel('header', 'header1.xml');
    if (wantFooter) hf.footerRel = ctx.rel('footer', 'footer1.xml');

    var documentXml = HEAD + '<w:document ' + NS + '><w:body>' + body + sectPr(ctx, hf) + '</w:body></w:document>';

    var files = [
      { name: '[Content_Types].xml', data: contentTypes(ctx, hf) },
      { name: '_rels/.rels', data: HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="' + REL + 'officeDocument" Target="word/document.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
        '<Relationship Id="rId3" Type="' + REL + 'extended-properties" Target="docProps/app.xml"/></Relationships>' },
      { name: 'word/document.xml', data: documentXml },
      { name: 'word/_rels/document.xml.rels', data: docRels(ctx) },
      { name: 'word/styles.xml', data: stylesXml() },
      { name: 'word/numbering.xml', data: numberingXml(ctx) },
      { name: 'docProps/core.xml', data: coreXml(opts.title || 'Untitled document', opts.author || 'Scribe user') },
      { name: 'docProps/app.xml', data: appXml(opts.stats || {}) }
    ];
    if (ctx.comments.length) files.push({ name: 'word/comments.xml', data: commentsXml(ctx.comments) });
    if (wantHeader) files.push({ name: 'word/header1.xml', data: headerFooterXml(opts.header, false, false) });
    if (wantFooter) files.push({ name: 'word/footer1.xml', data: headerFooterXml(opts.footer, !!opts.pageNumbers, true) });
    ctx.media.forEach(function (m) { files.push({ name: m.name, data: m.data, store: true }); });

    return W.zip.zip(files, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }

  W.docxExport = { toBlob: toBlob, _internal: { blocks: blocks, Ctx: Ctx, stylesXml: stylesXml } };
})(window.W = window.W || {});
