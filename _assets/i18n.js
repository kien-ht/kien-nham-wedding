/* ──────────────────────────────────────────────────────────────
   Dịch nội dung trang sang tiếng Anh
   ?locale=vietnamese | english   (mặc định tiếng Việt)

   Chữ trong trang do Canva dựng sẵn, không sửa được lúc build, nên
   ta dò theo chính câu tiếng Việt rồi thay chữ vào. Khoá trong bảng
   là câu tiếng Việt đã gom khoảng trắng và hạ chữ thường.

   Canva dựng từng phần khi khách cuộn tới, nên có MutationObserver
   canh để dịch tiếp phần mới hiện ra.
   ────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var DICT = {
    /* Bản của chú rể: lời lẽ trang trọng hơn bản gốc (vốn viết đùa
       theo kiểu chốt đơn) và đổi lại ngôi xưng cho đúng.
       Khoá là câu tiếng Việt GỐC trong trang Canva, đừng sửa. */
    vietnamese: {
      'kiên & na': 'Kiên & Nhâm',
      'lễ chốt đơn': 'Lễ Thành Hôn',
      'khởi nghiệp thành công': 'Chúng em kết hôn',
      'em khởi nghiệp thành công rồi , mọi người nhớ tới làm chứng không chú rể chạy mất':
        'Chúng em sắp về chung một nhà, kính mong anh/chị đến chung vui cùng gia đình.',
      'mừng em có anh ấy': 'Trân trọng cảm ơn',
      'chúng em đón khách từ 18:00 tại sảnh 3.':
        'Chúng em kính đón quý khách từ 18:00 tại sảnh 3.',
      'hẹn gặp anh/chị ở lễ thành hôn của chúng em!':
        'Kính mời anh/chị đến dự Lễ Thành Hôn của chúng em',
      'có những cột mốc trong đời, niềm vui chỉ thật sự trọn vẹn khi có những người mình trân quý chứng kiến.':
        'Có những cột mốc trong đời, niềm vui chỉ thật sự trọn vẹn khi có những người thân yêu cùng chứng kiến.',
    },
    english: {
      'kiên & na': 'Kiên & Nhâm',
      'lễ chốt đơn': 'Wedding Ceremony',
      'khởi nghiệp thành công': 'We are getting married',
      'em khởi nghiệp thành công rồi , mọi người nhớ tới làm chứng không chú rể chạy mất':
        'We are soon to be married, and would be honoured to have you celebrate with our families.',
      'mừng em có anh ấy': 'With heartfelt thanks',
      'đường đến ngày vui': 'Finding Your Way',
      'trung tâm hội nghị tiệc cưới forevermark': 'Forevermark Wedding & Conference Centre',
      'tầng 3, toà nhà the zei, số 8 lê đức thọ, hà nội.':
        '3rd Floor, The Zei Tower, 8 Le Duc Tho, Hanoi.',
      'chúng em đón khách từ 18:00 tại sảnh 3.':
        'We will welcome our guests from 18:00 in Hall 3.',
      'hẹn gặp anh/chị ở lễ thành hôn của chúng em!':
        'We warmly invite you to our wedding ceremony',
      'có những cột mốc trong đời, niềm vui chỉ thật sự trọn vẹn khi có những người mình trân quý chứng kiến.':
        'Some moments in life feel complete only when the people dearest to us are there to share them.',
      'mọi lời chúc và tình cảm của anh/chị, dù dưới hình thức nào, chúng em đều trân trọng':
        'Every wish and kindness you send us, in whatever form, means a great deal to us',
      'địa điểm:': 'Venue:',
      'thời gian:': 'Date & Time:',
      'ngày 26/09/2026 (dương lịch)': '26 September 2026',
      'lúc 18:00': 'at 18:00',
      'tầng 3, forevermark': '3rd Floor, Forevermark',
      'số 8 lê đức thọ, hà nội': '8 Le Duc Tho, Hanoi',
    },
  };

  // gọi tắt cũng nhận: vi/vn, en/eng
  var ALIAS = { vi: 'vietnamese', vn: 'vietnamese', en: 'english', eng: 'english' };
  var LANG = { vietnamese: 'vi', english: 'en' };

  function pick() {
    var q;
    try { q = (new URLSearchParams(location.search).get('locale') || '').trim().toLowerCase(); }
    catch (e) { return null; }
    return DICT[q] ? q : (DICT[ALIAS[q]] ? ALIAS[q] : null);
  }

  /* Canva cắt mỗi đoạn văn thành hàng chục <span>, mỗi chữ một thẻ, và
     chỗ xuống dòng KHÔNG có ký tự trắng nào. Ghép lại thì thành
     "...mọi ngườinhớ tới..." — dính chữ. Vì vậy khi so khớp ta bỏ sạch
     khoảng trắng ở cả hai phía, chứ không chỉ gom lại. */
  function compact(s) {
    return s.replace(/\s+/g, '').toLowerCase();
  }

  function translate(lookup, root) {
    var els = root.querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.hasAttribute('data-wed-t')) continue;

      var key = compact(el.textContent);
      var val = lookup[key];
      if (!val) continue;

      // Thay ở phần tử NHỎ NHẤT chứa đúng câu đó, để không xoá mất
      // cấu trúc bên trong của khối cha.
      var inner = el.querySelectorAll('*');
      var deeper = false;
      for (var j = 0; j < inner.length; j++) {
        if (compact(inner[j].textContent) === key) { deeper = true; break; }
      }
      if (deeper) continue;

      el.setAttribute('data-wed-t', '1');
      el.textContent = val;
    }
  }

  var locale = pick() || 'vietnamese';
  var dict = DICT[locale];
  if (!dict) return;
  document.documentElement.lang = LANG[locale];

  // bảng tra dùng khoá đã bỏ hết khoảng trắng, để bảng ở trên vẫn dễ đọc
  var lookup = {};
  Object.keys(dict).forEach(function (k) { lookup[compact(k)] = dict[k]; });

  function run() {
    var root = document.getElementById('root');
    if (root) translate(lookup, root);
  }

  var queued = false;
  new MutationObserver(function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; run(); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  run();
})();
