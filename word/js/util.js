/* util.js - small shared helpers. */
(function (W) {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);
  }

  function escapeXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  /* CSS colour -> 6 digit uppercase hex, or null when not resolvable. */
  function toHex(color) {
    if (!color) return null;
    var c = String(color).trim();
    if (!c || c === 'transparent' || c === 'initial' || c === 'inherit') return null;
    var m = c.match(/^#([0-9a-f]{3})$/i);
    if (m) return (m[1][0] + m[1][0] + m[1][1] + m[1][1] + m[1][2] + m[1][2]).toUpperCase();
    m = c.match(/^#([0-9a-f]{6})$/i);
    if (m) return m[1].toUpperCase();
    m = c.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i);
    if (m) {
      if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
      return [m[1], m[2], m[3]].map(function (v) {
        return ('0' + Math.max(0, Math.min(255, Math.round(parseFloat(v)))).toString(16)).slice(-2);
      }).join('').toUpperCase();
    }
    var probe = document.createElement('span');
    probe.style.color = '';
    probe.style.color = c;
    if (!probe.style.color) return null;
    document.body.appendChild(probe);
    var resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved === c ? null : toHex(resolved);
  }

  /* Numbers used by OOXML. 1pt = 20 twips, 1px = 0.75pt, 1pt = 12700 EMU. */
  var U = {
    pxToPt: function (px) { return px * 0.75; },
    ptToTwip: function (pt) { return Math.round(pt * 20); },
    pxToTwip: function (px) { return Math.round(px * 15); },
    pxToEmu: function (px) { return Math.round(px * 9525); },
    emuToPx: function (emu) { return Math.round(emu / 9525); },
    twipToPx: function (tw) { return tw / 15; },
    /* '12pt' | '16px' | '1.2em' -> pt */
    cssToPt: function (v, basePt) {
      if (!v) return null;
      var s = String(v).trim(), n = parseFloat(s);
      if (isNaN(n)) return null;
      if (s.indexOf('pt') > -1) return n;
      if (s.indexOf('px') > -1) return n * 0.75;
      if (s.indexOf('rem') > -1 || s.indexOf('em') > -1) return n * (basePt || 11);
      if (s.indexOf('%') > -1) return (n / 100) * (basePt || 11);
      return n * 0.75;
    }
  };

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function isoDate(d) {
    d = d || new Date();
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
  }

  W.util = { $: $, $$: $$, el: el, debounce: debounce, uid: uid, escapeXml: escapeXml, toHex: toHex, U: U, download: download, isoDate: isoDate };
})(window.W = window.W || {});
