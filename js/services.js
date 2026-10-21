/* ============================================
   services.js — فلترة الخدمات حسب التصنيف
   ============================================ */
(function () {
  var chips = document.querySelectorAll('.chip');
  var items = document.querySelectorAll('.service-item');
  var count = document.getElementById('servicesCount');

  function apply(cat) {
    var shown = 0;
    items.forEach(function (it) {
      var match = cat === 'all' || it.getAttribute('data-cat') === cat;
      it.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    if (count) count.textContent = shown + ' خدمة';
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('active'); chip.setAttribute('aria-pressed', 'true');
      apply(chip.getAttribute('data-filter'));
    });
  });
  apply('all');
})();
