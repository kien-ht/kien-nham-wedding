/* ──────────────────────────────────────────────────────────────
   Hoa giấy cho trang thiệp cưới
   · Một tràng chúc mừng khi khách vừa mở thiệp.
   · Chạm/bấm vào đâu cũng bung thêm một chùm nhỏ ở chỗ đó.

   Cách làm: một thẻ <canvas> phủ toàn màn hình, pointer-events:none
   nên không đụng gì tới nội dung Canva bên dưới. Vòng lặp vẽ chỉ
   chạy khi còn cánh hoa trên màn hình, hết thì tự dừng — không tốn
   pin của khách khi họ đang ngồi đọc.

   Gọi thủ công nếu cần:
     weddingConfetti.burst(x, y, soLuong)   // bung tại một điểm
     weddingConfetti.celebrate()            // tràng chúc mừng
   ────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var CONFIG = {
    maxParticles: 320,   // trần an toàn, tránh máy yếu bị giật
    tapCount: 14,        // số cánh mỗi lần khách chạm
    tapCooldown: 110,    // ms — chạm liên tục thì bỏ bớt
    gravity: 0.13,
    drag: 0.985,
    openDelay: 550,      // ms — chờ Canva vẽ xong rồi mới chúc mừng
  };

  // hồng phấn · hồng nhạt · hồng đất · be · vàng đồng · xanh lá nhạt
  var PETAL_COLORS = ['#E8A9A0', '#F3C9C0', '#D98C86', '#EADCC8', '#C9857E'];
  var HEART_COLORS = ['#E8A9A0', '#D98C86', '#F3C9C0'];
  var FLECK_COLORS = ['#D9B26A', '#EADCC8', '#C9A227'];

  var PETAL = 0, HEART = 1, FLECK = 2;

  var canvas, ctx, dpr = 1, W = 0, H = 0;
  var parts = [];
  var rafId = 0, last = 0, lastTap = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  /* ── khung vẽ ──────────────────────────────────────────────── */

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── một cánh hoa ──────────────────────────────────────────── */

  function spawn(x, y, vx, vy, shape) {
    // tới trần thì bỏ cánh cũ nhất, khỏi phình vô hạn
    if (parts.length >= CONFIG.maxParticles) parts.shift();

    var size = shape === FLECK ? rand(3, 6.5) : rand(8, 15);
    parts.push({
      x: x, y: y, vx: vx, vy: vy,
      shape: shape,
      size: size,
      color: shape === PETAL ? pick(PETAL_COLORS)
           : shape === HEART ? pick(HEART_COLORS)
           : pick(FLECK_COLORS),
      rot: rand(0, Math.PI * 2),
      vrot: rand(-0.09, 0.09),
      spin: rand(0, Math.PI * 2),      // pha lật mặt, cho giống lá rơi
      vspin: rand(0.03, 0.11),
      sway: shape === FLECK ? rand(0.01, 0.03) : rand(0.03, 0.08),
      swayPhase: rand(0, Math.PI * 2),
      swaySpeed: rand(0.02, 0.05),
      vyMax: shape === FLECK ? rand(3.4, 4.6) : rand(1.9, 3.1),
      alpha: 1,
    });
  }

  function randomShape() {
    var r = Math.random();
    return r < 0.62 ? PETAL : r < 0.82 ? HEART : FLECK;
  }

  /* ── vẽ từng hình ──────────────────────────────────────────── */

  function drawPetal(c, w) {
    var h = w * 1.7;
    c.beginPath();
    c.moveTo(0, -h / 2);
    c.bezierCurveTo(w / 2, -h / 4, w / 2, h / 4, 0, h / 2);
    c.bezierCurveTo(-w / 2, h / 4, -w / 2, -h / 4, 0, -h / 2);
    c.fill();
  }

  function drawHeart(c, s) {
    var k = s / 2;
    c.beginPath();
    c.moveTo(0, 0.55 * k);
    c.bezierCurveTo(-1.1 * k, -0.25 * k, -0.55 * k, -1.1 * k, 0, -0.45 * k);
    c.bezierCurveTo(0.55 * k, -1.1 * k, 1.1 * k, -0.25 * k, 0, 0.55 * k);
    c.fill();
  }

  function drawFleck(c, s) {
    c.fillRect(-s / 2, -s / 6, s, s / 3);
  }

  /* ── vòng lặp ──────────────────────────────────────────────── */

  function frame(now) {
    rafId = 0;
    var dt = now - last;
    last = now;
    if (dt > 100) dt = 100;        // quay lại tab sau khi ẩn — đừng nhảy cóc
    var k = dt / 16.667;

    ctx.clearRect(0, 0, W, H);

    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];

      p.swayPhase += p.swaySpeed * k;
      p.vx += Math.sin(p.swayPhase) * p.sway * k;
      p.vx *= Math.pow(CONFIG.drag, k);
      p.vy += CONFIG.gravity * k;
      if (p.vy > p.vyMax) p.vy = p.vy + (p.vyMax - p.vy) * 0.08 * k;

      p.x += p.vx * k;
      p.y += p.vy * k;
      p.rot += p.vrot * k;
      p.spin += p.vspin * k;

      // rơi khỏi màn hình / bay ngang ra ngoài thì bỏ
      if (p.y > H + 40 || p.x < -80 || p.x > W + 80) {
        parts[i] = parts[parts.length - 1];
        parts.pop();
        continue;
      }

      // mờ dần ở mép dưới cho êm mắt
      var fade = (H - p.y) / 90;
      p.alpha = fade < 1 ? Math.max(fade, 0) : 1;

      var sx = Math.cos(p.spin);
      if (Math.abs(sx) < 0.05) continue;  // đang quay nghiêng, gần như vô hình

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(sx, 1);
      ctx.globalAlpha = p.alpha * (0.65 + Math.abs(sx) * 0.35);
      ctx.fillStyle = p.color;
      if (p.shape === PETAL) drawPetal(ctx, p.size);
      else if (p.shape === HEART) drawHeart(ctx, p.size);
      else drawFleck(ctx, p.size);
      ctx.restore();
    }

    if (parts.length) rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (!rafId) {
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  }

  /* ── các kiểu bung ─────────────────────────────────────────── */

  // chùm nhỏ toả tròn tại một điểm — dùng khi khách chạm
  function burst(x, y, count) {
    count = count || CONFIG.tapCount;
    for (var i = 0; i < count; i++) {
      var a = rand(-Math.PI, 0);            // ưu tiên bung lên trên
      var v = rand(3, 9);
      spawn(x, y, Math.cos(a) * v, Math.sin(a) * v * 0.9, randomShape());
    }
    start();
  }

  // pháo giấy từ một góc dưới màn hình
  function cannon(x, y, angle, count) {
    for (var i = 0; i < count; i++) {
      var a = angle + rand(-0.36, 0.36);
      var v = rand(8, 14);   // vừa đủ cao để cánh hoa luôn nằm trong tầm mắt
      spawn(x, y, Math.cos(a) * v, Math.sin(a) * v, randomShape());
    }
  }

  // mưa cánh hoa từ mép trên
  function rain(count) {
    for (var i = 0; i < count; i++) {
      spawn(rand(0, W), rand(-140, -20), rand(-0.8, 0.8), rand(1, 3), randomShape());
    }
  }

  // tràng chúc mừng lúc mở thiệp
  function celebrate() {
    var small = W < 600;
    cannon(0, H, -Math.PI / 3, small ? 26 : 40);
    cannon(W, H, -Math.PI * 2 / 3, small ? 26 : 40);
    rain(small ? 26 : 44);
    start();
  }

  /* ── khởi tạo ──────────────────────────────────────────────── */

  function init() {
    if (window.__confettiLoaded) return;         // tránh khởi tạo hai lần
    window.__confettiLoaded = true;

    // tôn trọng lựa chọn "giảm chuyển động" của khách
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    canvas = document.createElement('canvas');
    canvas.className = 'confetti-layer';
    canvas.setAttribute('aria-hidden', 'true');
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    document.body.appendChild(canvas);
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('orientationchange', resize, { passive: true });

    // chạm/bấm vào đâu cũng có hoa
    document.addEventListener('pointerdown', function (e) {
      var now = performance.now();
      if (now - lastTap < CONFIG.tapCooldown) return;
      lastTap = now;
      burst(e.clientX, e.clientY);
    }, { capture: true, passive: true });

    window.weddingConfetti = { burst: burst, rain: rain, celebrate: celebrate, count: function () { return parts.length; } };

    // chúc mừng khi khách vừa mở thiệp — chờ Canva vẽ xong, và nếu
    // tab đang ẩn thì để dành tới lúc khách quay lại.
    function greet() {
      if (document.hidden) {
        document.addEventListener('visibilitychange', function once() {
          if (document.hidden) return;
          document.removeEventListener('visibilitychange', once);
          setTimeout(celebrate, 300);
        });
        return;
      }
      setTimeout(celebrate, CONFIG.openDelay);
    }

    if (document.readyState === 'complete') greet();
    else window.addEventListener('load', greet, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
