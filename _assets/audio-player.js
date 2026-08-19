/* ──────────────────────────────────────────────────────────────
   Nhạc nền cho trang thiệp cưới
   · Tự phát ở thao tác đầu tiên của khách.
   · Nút bật/tắt góc trái dưới để khách tắt tiếng khi cần.

   Lưu ý: trình duyệt chỉ cho phát tiếng sau "user activation", mà
   chỉ chạm/bấm/gõ phím mới tính. Cuộn chuột (wheel/scroll) KHÔNG
   tính, nên ta cứ nghe tiếp cho tới khi phát được thật sự — chứ
   không gỡ listener ngay ở lần thử đầu.
   Trên điện thoại, cuộn luôn kèm touchstart nên vẫn chạy như ý.
   ────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var CONFIG = {
    src: '_assets/audio/canon-in-d.mp3',
    volume: 0.35, // 0 – 1
    loop: true,
    label: 'Bật/tắt nhạc nền',
    startOn: [
      'pointerdown', // chuột / bút / chạm  → có activation
      'touchstart',  // điện thoại          → có activation
      'touchend',
      'keydown',     // bàn phím            → có activation
      'click',
      'wheel',       // cuộn — thường bị chặn, nhưng vẫn thử
      'scroll',
    ],
  };

  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path class="bgm-speaker" d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z"/>' +
      '<g class="bgm-waves">' +
        '<path d="M15.6 9.2a4 4 0 0 1 0 5.6"/>' +
        '<path d="M18 6.8a7.4 7.4 0 0 1 0 10.4"/>' +
      '</g>' +
      '<path class="bgm-slash" d="M4.5 4.5l15 15"/>' +
    '</svg>';

  function init() {
    if (window.__bgmLoaded) return; // tránh khởi tạo hai lần
    window.__bgmLoaded = true;

    var audio = document.createElement('audio');
    audio.src = CONFIG.src;
    audio.loop = CONFIG.loop;
    audio.preload = 'auto';
    audio.volume = CONFIG.volume;

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'bgm-toggle';
    toggle.innerHTML = ICON;
    toggle.setAttribute('aria-label', CONFIG.label);
    toggle.setAttribute('data-text', 'Nhạc nền');
    toggle.setAttribute('aria-pressed', 'false');

    document.body.appendChild(audio);
    document.body.appendChild(toggle);

    function sync() {
      toggle.setAttribute('aria-pressed', audio.paused ? 'false' : 'true');
    }
    audio.addEventListener('play', function () {
      sync();
      toggle.classList.remove('is-armed');
    });
    audio.addEventListener('pause', sync);

    /* ── tự phát ở thao tác đầu tiên ───────────────────────── */

    // Khi khách đã tự bấm nút thì tôn trọng lựa chọn đó,
    // không tự phát đè lên nữa.
    var userDecided = false;

    function listen(on) {
      CONFIG.startOn.forEach(function (evt) {
        if (on) {
          document.addEventListener(evt, tryStart, { capture: true, passive: true });
        } else {
          document.removeEventListener(evt, tryStart, true);
        }
      });
    }

    // Chỉ gỡ listener khi đã thật sự phát được.
    function tryStart() {
      if (userDecided) return listen(false);
      audio.play().then(function () { listen(false); }, noop);
    }

    // Thử phát ngay khi tải trang; nếu bị chặn thì chờ khách thao tác.
    audio.play().then(sync, function () {
      toggle.classList.add('is-armed');
      listen(true);
    });

    /* ── nút bật/tắt ───────────────────────────────────────── */

    toggle.addEventListener('click', function () {
      userDecided = true;
      listen(false);
      toggle.classList.remove('is-armed');
      if (audio.paused) audio.play().catch(noop);
      else audio.pause();
    });

    sync();
  }

  function noop() {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
