/* ──────────────────────────────────────────────────────────────
   Thay ảnh chụp bản đồ bằng bản đồ Google nhúng (kéo/zoom được)

   Đổi thẳng thẻ <img> thành <iframe>, giữ nguyên class và style của
   ảnh cũ nên iframe nằm đúng khung mà Canva đã tính — không cần tự
   đo đạc hay canh lại khi đổi cỡ màn hình.

   Chỉ cần một MutationObserver, vì Canva dựng phần bản đồ khi khách
   cuộn tới chứ không có sẵn lúc tải trang.
   ────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // Canva xuất ra hai bản ảnh bản đồ gần giống nhau; bản d8e3e5... là
  // bản đang hiển thị, bản kia để dự phòng.
  var HASHES = ['d8e3e58e949580a952e200b2f209eb26', '0403d7a18edab16f89ee71a720a3f590'];

  var SRC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6758.586749930642!2d105.76758681400466!3d21.034883129728616!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313455b102793301%3A0x9997e3c91b8f1654!2zRm9yZXZlcm1hcmsgTMOqIMSQ4bupYyBUaOG7jQ!5e0!3m2!1sen!2s!4v1787168534869!5m2!1sen!2s';

  function swap(img) {
    var frame = document.createElement('iframe');
    frame.className = 'wed-map ' + img.className;
    frame.style.cssText = img.style.cssText;
    frame.src = SRC;
    frame.title = 'Bản đồ tới Trung tâm Hội nghị Tiệc cưới Forevermark, Lê Đức Thọ';
    frame.loading = 'lazy';
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    img.parentNode.replaceChild(frame, img);
  }

  function scan() {
    for (var i = 0; i < HASHES.length; i++) {
      var imgs = document.querySelectorAll('img[src*="' + HASHES[i] + '"]');
      for (var j = 0; j < imgs.length; j++) swap(imgs[j]);
    }
  }

  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
