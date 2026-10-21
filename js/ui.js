/* ============================================
   ui.js — تفاعلات عامة: ظهور تدريجي، عدّادات، بدائل الصور
   ============================================ */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll reveal */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Counters: <strong data-count="350" data-prefix="+"> */
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    if (reduce) { el.textContent = prefix + target; return; }
    var start = null, dur = 1200;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else { counters.forEach(runCounter); }

  /* Image fallback: <img data-fallback="🐱"> لو الصورة مش موجودة */
  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    function swap() {
      var ph = document.createElement('div');
      ph.className = 'img-placeholder';
      ph.setAttribute('role', 'img'); ph.setAttribute('aria-label', img.alt || '');
      ph.textContent = img.getAttribute('data-fallback');
      if (img.parentNode) img.parentNode.replaceChild(ph, img);
    }
    img.addEventListener('error', swap);
    if (img.complete && img.naturalWidth === 0) swap();
  });
})();
