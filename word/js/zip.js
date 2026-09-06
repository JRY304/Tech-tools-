/* zip.js - minimal ZIP reader/writer used for .docx (OPC) packages.
   No dependencies: deflate comes from the platform's CompressionStream. */
(function (W) {
  'use strict';

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256), c, n, k;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  var enc = new TextEncoder();
  var dec = new TextDecoder();

  function toBytes(x) { return typeof x === 'string' ? enc.encode(x) : new Uint8Array(x); }

  var HAS_CS = typeof CompressionStream === 'function';
  var HAS_DS = typeof DecompressionStream === 'function';

  async function deflateRaw(bytes) {
    if (!HAS_CS) return null;
    var s = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }

  async function inflateRaw(bytes) {
    if (!HAS_DS) throw new Error('This browser cannot decompress .docx files (no DecompressionStream).');
    var s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }

  function dosDate(d) {
    var time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31);
    var date = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
    return { time: time, date: date };
  }

  function Writer() { this.parts = []; this.len = 0; }
  Writer.prototype.push = function (bytes) { this.parts.push(bytes); this.len += bytes.length; };
  Writer.prototype.u16 = function (v) { var b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, v, true); this.push(b); };
  Writer.prototype.u32 = function (v) { var b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, v >>> 0, true); this.push(b); };
  Writer.prototype.blob = function (type) { return new Blob(this.parts, { type: type || 'application/octet-stream' }); };

  /* files: [{name, data: string|Uint8Array, store?: bool}] */
  async function zip(files, mime) {
    var w = new Writer(), central = [], stamp = dosDate(new Date()), i;

    for (i = 0; i < files.length; i++) {
      var f = files[i];
      var raw = toBytes(f.data);
      var nameBytes = enc.encode(f.name);
      var crc = crc32(raw);
      var comp = f.store ? null : await deflateRaw(raw);
      var method = comp ? 8 : 0;
      var body = comp || raw;
      var offset = w.len;

      w.u32(0x04034b50); w.u16(20); w.u16(0x0800); w.u16(method);
      w.u16(stamp.time); w.u16(stamp.date);
      w.u32(crc); w.u32(body.length); w.u32(raw.length);
      w.u16(nameBytes.length); w.u16(0);
      w.push(nameBytes); w.push(body);

      central.push({ name: nameBytes, crc: crc, csize: body.length, size: raw.length, method: method, offset: offset });
    }

    var cdStart = w.len;
    for (i = 0; i < central.length; i++) {
      var c = central[i];
      w.u32(0x02014b50); w.u16(20); w.u16(20); w.u16(0x0800); w.u16(c.method);
      w.u16(stamp.time); w.u16(stamp.date);
      w.u32(c.crc); w.u32(c.csize); w.u32(c.size);
      w.u16(c.name.length); w.u16(0); w.u16(0); w.u16(0); w.u16(0); w.u32(0); w.u32(c.offset);
      w.push(c.name);
    }
    var cdSize = w.len - cdStart;
    w.u32(0x06054b50); w.u16(0); w.u16(0); w.u16(central.length); w.u16(central.length);
    w.u32(cdSize); w.u32(cdStart); w.u16(0);

    return w.blob(mime);
  }

  /* Returns { 'path': Uint8Array } */
  async function unzip(arrayBuffer) {
    var buf = new Uint8Array(arrayBuffer);
    var dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    var eocd = -1;
    for (var p = buf.length - 22; p >= 0 && p > buf.length - 65558; p--) {
      if (dv.getUint32(p, true) === 0x06054b50) { eocd = p; break; }
    }
    if (eocd < 0) throw new Error('Not a ZIP archive (no end-of-central-directory record).');

    var count = dv.getUint16(eocd + 10, true);
    var cd = dv.getUint32(eocd + 16, true);
    var out = {};

    for (var i = 0, off = cd; i < count; i++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      var method = dv.getUint16(off + 10, true);
      var csize = dv.getUint32(off + 20, true);
      var nameLen = dv.getUint16(off + 28, true);
      var extraLen = dv.getUint16(off + 30, true);
      var cmtLen = dv.getUint16(off + 32, true);
      var lho = dv.getUint32(off + 42, true);
      var name = dec.decode(buf.subarray(off + 46, off + 46 + nameLen));

      var lNameLen = dv.getUint16(lho + 26, true);
      var lExtraLen = dv.getUint16(lho + 28, true);
      var start = lho + 30 + lNameLen + lExtraLen;
      var slice = buf.subarray(start, start + csize);
      out[name] = method === 0 ? slice : await inflateRaw(slice);

      off += 46 + nameLen + extraLen + cmtLen;
    }
    return out;
  }

  function text(bytes) { return dec.decode(bytes); }

  function base64(bytes) {
    var s = '', chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(s);
  }

  function fromBase64(b64) {
    var bin = atob(b64), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  W.zip = { zip: zip, unzip: unzip, text: text, crc32: crc32, base64: base64, fromBase64: fromBase64 };
})(window.W = window.W || {});
