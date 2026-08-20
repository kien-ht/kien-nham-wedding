/* ──────────────────────────────────────────────────────────────
   Đếm ngược tới giờ đón khách: 18:00 ngày 26/09/2026

   Mốc thời gian ghi kèm múi giờ +07:00, nên khách ở Nhật hay Hàn
   mở thiệp vẫn thấy đúng số thời gian còn lại, không lệch múi giờ.

   Thanh đếm nằm nổi ở đáy màn hình — trang Canva cắt (overflow:hidden)
   gần như mọi khối bên trong, nên chèn vào giữa trang là bị xén mất.
   ────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var TARGET = new Date('2026-09-26T18:00:00+07:00').getTime();
  var GRACE = 6 * 60 * 60 * 1000;   // qua giờ rồi thì còn hiện thêm 6 tiếng

  var TEXT = {
    vietnamese: { d: 'Ngày', h: 'Giờ', m: 'Phút', s: 'Giây', now: 'Hôm nay là ngày vui!' },
    japanese:   { d: '日', h: '時間', m: '分', s: '秒', now: '本日が結婚式です！' },
    korean:     { d: '일', h: '시간', m: '분', s: '초', now: '오늘이 바로 그날입니다!' },
  };

  var ALIAS = { vi: 'vietnamese', vn: 'vietnamese', ja: 'japanese', jp: 'japanese', ko: 'korean', kr: 'korean' };

  function locale() {
    var q;
    try { q = (new URLSearchParams(location.search).get('locale') || '').trim().toLowerCase(); }
    catch (e) { return TEXT.vietnamese; }
    return TEXT[q] || TEXT[ALIAS[q]] || TEXT.vietnamese;
  }

  var T = locale();

  function two(n) { return n < 10 ? '0' + n : String(n); }

  function init() {
    if (window.__countdownLoaded) return;   // tránh khởi tạo hai lần
    window.__countdownLoaded = true;

    if (Date.now() - TARGET > GRACE) return;   // cưới xong lâu rồi thì thôi

    var box = document.createElement('div');
    box.className = 'wed-countdown';
    box.setAttribute('role', 'timer');
    box.setAttribute('aria-live', 'off');
    box.innerHTML =
      ['d', 'h', 'm', 's'].map(function (k) {
        return '<span class="wed-cd__cell">' +
                 '<span class="wed-cd__num" data-k="' + k + '">--</span>' +
                 '<span class="wed-cd__lab">' + T[k] + '</span>' +
               '</span>';
      }).join('');

    document.body.appendChild(box);

    var cells = {};
    ['d', 'h', 'm', 's'].forEach(function (k) {
      cells[k] = box.querySelector('[data-k="' + k + '"]');
    });

    function tick() {
      if (document.hidden) return;             // tab đang ẩn thì khỏi tính

      var diff = TARGET - Date.now();

      if (diff <= 0) {
        if (Date.now() - TARGET > GRACE) {     // hết giờ ân hạn thì dọn đi
          clearInterval(timer);
          if (box.parentNode) box.parentNode.removeChild(box);
          return;
        }
        if (!box.classList.contains('is-now')) {
          box.classList.add('is-now');
          box.textContent = T.now;
        }
        return;
      }

      var s = Math.floor(diff / 1000);
      cells.d.textContent = String(Math.floor(s / 86400));
      cells.h.textContent = two(Math.floor(s / 3600) % 24);
      cells.m.textContent = two(Math.floor(s / 60) % 60);
      cells.s.textContent = two(s % 60);
    }

    var timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    tick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
