/* ──────────────────────────────────────────────────────────────
   Phong bì mở thiệp
   · Khách chạm vào phong bì → nắp bật, thiệp trượt lên, trang hiện ra.
   · Cú chạm đó cũng là "user activation" — nhờ vậy nhạc nền chạy
     được ngay, không còn phải chờ khách vô tình chạm vào đâu đó.
   · Mở xong thì bắn hoa giấy (_assets/confetti.js).

   Trang Canva tự tải lại sau mỗi ít phút, nên ta ghi nhớ bằng
   sessionStorage: đã mở rồi thì lần tải sau vào thẳng nội dung,
   khỏi bắt khách mở đi mở lại.
   ────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var CONFIG = {
    key: 'wed-env',      // cờ nhớ trong sessionStorage
    maxName: 60,         // cắt bớt tên quá dài cho khỏi vỡ khung
  };

  /* ── Chữ nghĩa theo ngôn ngữ ────────────────────────────────
     ?locale=vietnamese | japanese | korean   (mặc định tiếng Việt)
     ?name=Anh%20Tuan   → hiện một dòng chào riêng phía trên phong bì

     Lưu ý: chỉ màn phong bì là đa ngữ. Nội dung thiệp bên trong do
     Canva dựng sẵn nên vẫn giữ nguyên tiếng Việt.
     {name} là chỗ thay tên khách.
     ────────────────────────────────────────────────────────── */
  var I18N = {
    vietnamese: {
      lang: 'vi',
      guest: 'Thân mời {name}',
      hint: 'Chạm để mở thiệp',
      label: 'Chạm để mở thiệp cưới',
      names: 'Kiên & Na',
      date: '26 . 09 . 2026',
    },
    japanese: {
      lang: 'ja',
      guest: '{name} 様',
      hint: 'タップして招待状を開く',
      label: 'タップして結婚式の招待状を開きます',
      names: 'Kiên & Na',
      date: '2026 . 09 . 26',
    },
    korean: {
      lang: 'ko',
      guest: '{name} 님께',
      hint: '탭하여 청첩장 열기',
      label: '탭하여 청첩장을 엽니다',
      names: 'Kiên & Na',
      date: '2026 . 09 . 26',
    },
  };

  // gọi tắt cũng nhận: vi/vn, ja/jp, ko/kr
  var ALIAS = { vi: 'vietnamese', vn: 'vietnamese', ja: 'japanese', jp: 'japanese', ko: 'korean', kr: 'korean' };

  function query(key) {
    try { return new URLSearchParams(location.search).get(key); } catch (e) { return null; }
  }

  function pickLocale() {
    var q = (query('locale') || '').trim().toLowerCase();
    return I18N[q] || I18N[ALIAS[q]] || I18N.vietnamese;
  }

  function guestName() {
    var n = (query('name') || '').trim().replace(/\s+/g, ' ');
    return n.slice(0, CONFIG.maxName);
  }

  // Mốc thời gian của màn mở (ms)
  var T_REVEAL = 520;   // thiệp bắt đầu trượt lên
  var T_LEAVE  = 1150;  // phủ mờ dần, trang hiện ra, hoa giấy bay
  var T_DONE   = 1850;  // dọn phong bì khỏi DOM

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seen() {
    try { return sessionStorage.getItem(CONFIG.key) === '1'; } catch (e) { return false; }
  }

  function remember() {
    try { sessionStorage.setItem(CONFIG.key, '1'); } catch (e) {}
  }

  function unseal() {
    document.documentElement.classList.remove('envelope-sealed');
  }

  function init() {
    if (window.__envelopeLoaded) return;   // tránh khởi tạo hai lần
    window.__envelopeLoaded = true;

    // đã mở trong phiên này rồi → vào thẳng nội dung
    if (seen()) { unseal(); return; }

    // báo cho confetti.js đừng tự bắn lúc tải trang — để dành cho lúc mở
    window.__weddingIntroPending = true;

    var t = pickLocale();
    var guest = guestName();

    var overlay = document.createElement('div');
    overlay.className = 'wed-env-overlay';
    overlay.lang = t.lang;                     // để trình duyệt chọn đúng font CJK
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', t.label);
    overlay.innerHTML =
      '<div class="wed-env-stack">' +
        (guest ? '<p class="wed-env-guest"></p>' : '') +
        '<button class="wed-env-btn" type="button" aria-label="' + t.label + '">' +
          '<span class="wed-env">' +
            '<span class="wed-env__back"></span>' +
            '<span class="wed-env__card">' +
              '<span class="wed-env__names">' + t.names + '</span>' +
              '<span class="wed-env__date">' + t.date + '</span>' +
            '</span>' +
            '<span class="wed-env__front"></span>' +
            '<span class="wed-env__flap"></span>' +
          '</span>' +
        '</button>' +
        '<p class="wed-env-hint">' + t.hint + '</p>' +
      '</div>';

    // Tên khách lấy từ URL nên KHÔNG ghép vào innerHTML — gán bằng
    // textContent, để không ai chèn được mã qua đường link.
    if (guest) {
      overlay.querySelector('.wed-env-guest').textContent = t.guest.replace('{name}', guest);
    }

    document.body.appendChild(overlay);
    document.documentElement.classList.add('envelope-sealed');
    window.__envelopeReady = true;

    var btn = overlay.querySelector('.wed-env-btn');

    /* ── mở thiệp ──────────────────────────────────────────── */

    var opened = false;

    function open(e) {
      if (opened) return;
      if (e && e.isTrusted === false) return;   // chạm thật mới tính
      opened = true;
      remember();

      // Chú ý: KHÔNG chặn sự kiện — audio-player.js đang nghe
      // pointerdown ở document, chính cú chạm này cho phép phát nhạc.

      if (reduced) {
        unseal();
        overlay.classList.add('is-leaving');
        setTimeout(finish, 260);
        return;
      }

      overlay.classList.add('is-opening');
      setTimeout(function () { overlay.classList.add('is-revealing'); }, T_REVEAL);
      setTimeout(function () {
        unseal();                       // trang hiện ra sau lớp phủ đang mờ dần
        overlay.classList.add('is-leaving');
        if (window.weddingConfetti) window.weddingConfetti.celebrate();
      }, T_LEAVE);
      setTimeout(finish, T_DONE);
    }

    function finish() {
      unseal();
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    btn.addEventListener('click', open);
    overlay.addEventListener('click', open);      // chạm chỗ nào cũng mở được
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') open(e);
    });

    // Phao cứu sinh: có trục trặc gì thì cũng không để khách kẹt ngoài thiệp.
    setTimeout(function () { if (!opened) unseal(); }, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
