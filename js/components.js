/* ============================================
   components.js — الهيدر والفوتر المشتركين (بيتعدلوا من هنا مرة واحدة لكل الصفحات)
   ============================================ */
(function () {
  var C = window.CLINIC || {};
  var page = document.body.getAttribute('data-page') || '';

  var links = [
    { id: 'home', href: 'index.html', label: 'الرئيسية' },
    { id: 'about', href: 'about.html', label: 'عن الدكتور' },
    { id: 'services', href: 'services.html', label: 'الخدمات' },
    { id: 'booking', href: 'booking.html', label: 'الحجز والتواصل' }
  ];

  var header = document.getElementById('site-header');
  if (header) {
    header.className = 'site-header';
    header.innerHTML =
      '<nav class="navbar navbar-expand-lg site-nav"><div class="container">' +
      '<a class="navbar-brand brand" href="index.html"><span class="brand-mark">🐾</span><span>' + C.name + '</span></a>' +
      '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="فتح القائمة"><span class="navbar-toggler-icon"></span></button>' +
      '<div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav">' +
      links.map(function (l) {
        return '<li class="nav-item"><a class="nav-link' + (l.id === page ? ' active' : '') + '" href="' + l.href + '"' + (l.id === page ? ' aria-current="page"' : '') + '>' + l.label + '</a></li>';
      }).join('') +
      '</ul><a href="booking.html" class="vbtn vbtn-primary nav-cta">احجز موعد</a></div>' +
      '</div></nav>';
  }

  var footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="container"><div class="row g-4">' +
      '<div class="col-md-5"><h4>🐾 ' + C.name + '</h4><p>' + C.doctor + ' — كشف، تطعيمات، متابعة علاج وملف طبي لكل حيوان.</p></div>' +
      '<div class="col-6 col-md-3"><h4>الصفحات</h4><ul>' +
      links.map(function (l) { return '<li><a href="' + l.href + '">' + l.label + '</a></li>'; }).join('') +
      '</ul></div>' +
      '<div class="col-6 col-md-4"><h4>تواصل</h4><ul>' +
      '<li>📍 ' + C.city + '</li>' +
      '<li>💬 <a href="https://wa.me/' + C.whatsapp + '" target="_blank" rel="noopener">' + C.phoneDisplay + '</a></li>' +
      '<li>🕒 ' + C.hours + '</li></ul></div>' +
      '</div><div class="footer-bottom">© ' + new Date().getFullYear() + ' ' + C.name + ' — ' + C.doctor + '</div></div>';
  }

  /* أزرار عائمة: واتساب + رجوع للأعلى */
  if (page !== 'dashboard') {
    var wa = document.createElement('a');
    wa.className = 'fab-wa'; wa.href = 'https://wa.me/' + C.whatsapp; wa.target = '_blank'; wa.rel = 'noopener';
    wa.setAttribute('aria-label', 'واتساب'); wa.textContent = '💬';
    document.body.appendChild(wa);
  }
  var top = document.createElement('button');
  top.className = 'fab-top'; top.setAttribute('aria-label', 'للأعلى'); top.textContent = '↑';
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  document.body.appendChild(top);
  window.addEventListener('scroll', function () { top.classList.toggle('show', window.scrollY > 500); }, { passive: true });
})();
