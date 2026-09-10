/* ──────────────────────────────────────────────────────────────
   Nút sao chép số tài khoản, đặt ngay phía trên thẻ QR VietQR.

   Chèn thẳng làm CON của thẻ QR (id LBslv9VB2KbfszSy) thay vì làm
   anh em (sibling) rồi tự tính toạ độ: thẻ QR đã là position:
   absolute + có transform riêng (Canva trượt/mờ dần nó vào khi
   khách cuộn tới lần đầu), nên mọi phần tử con đặt position:
   absolute bên trong sẽ tự động "ăn theo" transform/animation đó
   — khỏi cần tự đọc lại transform hay rình MutationObserver.
   overflow của chính thẻ QR là visible nên đặt nhô lên trên
   (bottom:100%) không bị cắt mất.

   Canva dựng phần này khi khách cuộn tới chứ không có sẵn lúc tải
   trang, nên cần MutationObserver canh, giống map-embed.js.
   ────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var QR_ID = 'LBslv9VB2KbfszSy';
  var NUMBER = '041218883';

  var LABELS = {
    vietnamese: { copy: 'Sao chép', copied: 'Đã sao chép!' },
    japanese: { copy: 'コピー', copied: 'コピーしました！' },
    korean: { copy: '복사', copied: '복사되었습니다!' },
  };
  var ALIAS = { vi: 'vietnamese', vn: 'vietnamese', ja: 'japanese', jp: 'japanese', ko: 'korean', kr: 'korean' };

  function locale() {
    var q;
    try { q = (new URLSearchParams(location.search).get('locale') || '').trim().toLowerCase(); }
    catch (e) { return LABELS.vietnamese; }
    return LABELS[q] || LABELS[ALIAS[q]] || LABELS.vietnamese;
  }

  var T = locale();

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function build() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wed-copy';
    btn.setAttribute('aria-label', T.copy + ' ' + NUMBER);
    btn.innerHTML =
      '<svg class="wed-copy__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="9" y="9" width="12" height="12" rx="2"/>' +
        '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
      '</svg>' +
      '<span class="wed-copy__num">' + NUMBER + '</span>';

    var numEl = btn.querySelector('.wed-copy__num');
    var resetTimer;

    btn.addEventListener('click', function () {
      copyText(NUMBER).then(function () {
        clearTimeout(resetTimer);
        btn.classList.add('is-copied');
        numEl.textContent = T.copied;
        resetTimer = setTimeout(function () {
          btn.classList.remove('is-copied');
          numEl.textContent = NUMBER;
        }, 1600);
      });
    });

    return btn;
  }

  function insert() {
    if (window.__copyButtonInserted) return true;
    var qr = document.getElementById(QR_ID);
    if (!qr) return false;

    qr.appendChild(build());
    window.__copyButtonInserted = true;
    return true;
  }

  if (insert()) return;

  var mo = new MutationObserver(function () {
    if (insert()) mo.disconnect();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
