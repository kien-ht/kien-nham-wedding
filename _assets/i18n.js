/* ──────────────────────────────────────────────────────────────
   Dịch nội dung trang sang tiếng Nhật / tiếng Hàn
   ?locale=vietnamese | japanese | korean   (mặc định tiếng Việt)

   Chữ trong trang do Canva dựng sẵn, không sửa được lúc build, nên
   ta dò theo chính câu tiếng Việt rồi thay chữ vào. Khoá trong bảng
   là câu tiếng Việt đã gom khoảng trắng và hạ chữ thường.

   Canva dựng từng phần khi khách cuộn tới, nên có MutationObserver
   canh để dịch tiếp phần mới hiện ra.
   ────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var DICT = {
    japanese: {
      'lễ chốt đơn': '成約セレモニー',
      'khởi nghiệp thành công': '起業、成功しました',
      'mừng em có anh ấy': '彼をゲットしました',
      'em khởi nghiệp thành công rồi , mọi người nhớ tới làm chứng không chú rể chạy mất':
        '起業に成功しました。新郎が逃げないよう、皆さん証人になりに来てくださいね',
      'đường đến ngày vui': '会場へのご案内',
      'trung tâm hội nghị tiệc cưới forevermark': 'フォーエバーマーク ウエディング・コンベンションセンター',
      'tầng 3, toà nhà the zei, số 8 lê đức thọ, hà nội.':
        'ハノイ市レ・ドゥック・ト通り8番地 The Zeiビル 3階',
      'chúng em đón khách từ 18:00 tại sảnh 3.': '18:00より3番ホールにてお迎えいたします。',
      'hẹn gặp anh/chị ở lễ thành hôn của chúng em!': '結婚式でお会いできるのを楽しみにしております！',
      'có những cột mốc trong đời, niềm vui chỉ thật sự trọn vẹn khi có những người mình trân quý chứng kiến.':
        '人生の節目の喜びは、大切な方に見守っていただいてこそ本当に満ちるものです。',
      'mọi lời chúc và tình cảm của anh/chị, dù dưới hình thức nào, chúng em đều trân trọng':
        '皆さまからのお祝いのお気持ちは、どのような形であれ心より大切にいたします',
      'địa điểm:': '場所：',
      'thời gian:': '日時：',
      'ngày 26/09/2026 (dương lịch)': '2026年9月26日（新暦）',
      'lúc 18:00': '18:00より',
      'tầng 3, forevermark': 'フォーエバーマーク 3階',
      'số 8 lê đức thọ, hà nội': 'ハノイ市レ・ドゥック・ト通り8番地',
    },
    korean: {
      'lễ chốt đơn': '계약 성사식',
      'khởi nghiệp thành công': '창업 성공',
      'mừng em có anh ấy': '드디어 그를 얻었어요',
      'em khởi nghiệp thành công rồi , mọi người nhớ tới làm chứng không chú rể chạy mất':
        '창업에 성공했어요. 신랑이 도망가지 않도록 모두 증인이 되어 주세요',
      'đường đến ngày vui': '오시는 길',
      'trung tâm hội nghị tiệc cưới forevermark': '포에버마크 웨딩 컨벤션 센터',
      'tầng 3, toà nhà the zei, số 8 lê đức thọ, hà nội.':
        '하노이 레득토 8번지 The Zei 빌딩 3층',
      'chúng em đón khách từ 18:00 tại sảnh 3.': '18:00부터 3홀에서 하객을 맞이합니다.',
      'hẹn gặp anh/chị ở lễ thành hôn của chúng em!': '저희 결혼식에서 뵙겠습니다!',
      'có những cột mốc trong đời, niềm vui chỉ thật sự trọn vẹn khi có những người mình trân quý chứng kiến.':
        '인생의 중요한 순간의 기쁨은 소중한 분들이 함께 지켜봐 주실 때 비로소 온전해집니다.',
      'mọi lời chúc và tình cảm của anh/chị, dù dưới hình thức nào, chúng em đều trân trọng':
        '어떤 형태로든 보내주시는 축하와 마음을 소중히 간직하겠습니다',
      'địa điểm:': '장소:',
      'thời gian:': '일시:',
      'ngày 26/09/2026 (dương lịch)': '2026년 9월 26일 (양력)',
      'lúc 18:00': '18:00',
      'tầng 3, forevermark': '포에버마크 3층',
      'số 8 lê đức thọ, hà nội': '하노이 레득토 8번지',
    },
  };

  var ALIAS = { vi: 'vietnamese', vn: 'vietnamese', ja: 'japanese', jp: 'japanese', ko: 'korean', kr: 'korean' };
  var LANG = { japanese: 'ja', korean: 'ko', vietnamese: 'vi' };

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

  var locale = pick();
  if (!locale || locale === 'vietnamese') return;   // tiếng Việt thì để nguyên

  var dict = DICT[locale];
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
