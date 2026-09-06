/* ui.js - toasts, modals, prompts. */
(function (W) {
  'use strict';
  var $ = W.util.$, el = W.util.el;
  var toastTimer = null;

  function toast(msg, ms) {
    var t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, ms || 2600);
  }

  function closeModal() {
    $('#modal').hidden = true;
    $('#modal-body').innerHTML = '';
    $('#modal-foot').innerHTML = '';
  }

  /* opts: {title, body(HTMLElement|string), buttons:[{label, primary, onClick(close)}], onOpen(box)} */
  function modal(opts) {
    var box = $('#modal');
    $('#modal-title').textContent = opts.title || '';
    var body = $('#modal-body');
    body.innerHTML = '';
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);

    var foot = $('#modal-foot');
    foot.innerHTML = '';
    (opts.buttons || [{ label: 'Close' }]).forEach(function (b) {
      foot.appendChild(el('button', {
        class: 'tbtn' + (b.primary ? ' btn-primary' : ''),
        text: b.label,
        onclick: function () { if (b.onClick) b.onClick(closeModal); else closeModal(); }
      }));
    });
    box.hidden = false;
    if (opts.onOpen) opts.onOpen(body);
    return body;
  }

  /* opts: {title, label, value, multiline, ok, placeholder} -> cb(value|null) */
  function prompt(opts, cb) {
    var input = opts.multiline
      ? el('textarea', { placeholder: opts.placeholder || '' })
      : el('input', { type: 'text', placeholder: opts.placeholder || '' });
    input.value = opts.value || '';
    var body = el('div', {}, [el('label', { text: opts.label || '' }), input]);

    modal({
      title: opts.title || 'Input',
      body: body,
      buttons: [
        { label: 'Cancel', onClick: function (close) { close(); cb(null); } },
        { label: opts.ok || 'OK', primary: true, onClick: function (close) { var v = input.value; close(); cb(v); } }
      ],
      onOpen: function () { input.focus(); input.select(); }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (!opts.multiline || e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        var v = input.value;
        closeModal();
        cb(v);
      }
      if (e.key === 'Escape') { closeModal(); cb(null); }
    });
  }

  function confirm(opts, cb) {
    modal({
      title: opts.title || 'Confirm',
      body: '<p>' + W.util.escapeXml(opts.message || '') + '</p>',
      buttons: [
        { label: 'Cancel', onClick: function (close) { close(); cb(false); } },
        { label: opts.ok || 'OK', primary: true, onClick: function (close) { close(); cb(true); } }
      ]
    });
  }

  function init() {
    $('[data-act="modal-close"]').addEventListener('click', closeModal);
    $('#modal').addEventListener('mousedown', function (e) { if (e.target.id === 'modal') closeModal(); });
  }

  W.ui = { init: init, toast: toast, modal: modal, prompt: prompt, confirm: confirm, closeModal: closeModal };
})(window.W = window.W || {});
