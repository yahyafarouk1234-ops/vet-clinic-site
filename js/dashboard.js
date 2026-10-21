/* ============================================
   dashboard.js — لوحة الدكتور: دخول، إحصائيات، فلترة، حالة الحجز، ملف الحيوان
   ============================================ */
(function () {
  var gate = document.getElementById('gate');
  var dash = document.getElementById('dashboard');
  var gateForm = document.getElementById('gateForm');
  var gateEmailRow = document.getElementById('gateEmailRow');
  var gateError = document.getElementById('gateError');
  var gateHint = document.getElementById('gateHint');
  var body = document.getElementById('bookingsBody');
  var empty = document.getElementById('noBookings');
  var unsub = null, bookings = [];
  var modal = null, currentBooking = null, currentPet = null;

  var STATUS = { 'new': 'جديد', confirmed: 'مؤكد', done: 'تم الكشف', cancelled: 'ملغي' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function waLink(phone, text) {
    var p = String(phone || '').replace(/\D/g, '').replace(/^0/, '20');
    return 'https://wa.me/' + p + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  /* ---------- Auth ---------- */
  if (Store.isFirebase) {
    gateHint.textContent = 'سجّل دخول بالحساب اللي عملته في Firebase Authentication.';
  } else {
    gateEmailRow.hidden = true;
    gateHint.textContent = 'وضع تجريبي: كلمة المرور vet2026 (البيانات محفوظة في المتصفح بس). فعّل Firebase للأمان الحقيقي.';
  }

  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    gateError.hidden = true;
    var btn = gateForm.querySelector('button'); btn.disabled = true;
    Store.login(document.getElementById('gateEmail').value.trim(), document.getElementById('gatePassword').value)
      .then(function () { document.getElementById('gatePassword').value = ''; })
      .catch(function () { gateError.hidden = false; })
      .then(function () { btn.disabled = false; });
  });

  document.getElementById('logoutBtn').addEventListener('click', function () { Store.logout(); });

  /* ---------- Forgot password (Firebase only) ---------- */
  var forgotBtn = document.getElementById('forgotBtn'), forgotMsg = document.getElementById('forgotMsg');
  if (Store.isFirebase) forgotBtn.hidden = false;
  forgotBtn.addEventListener('click', function () {
    var email = document.getElementById('gateEmail').value.trim();
    forgotMsg.hidden = false;
    if (!email) { forgotMsg.textContent = 'اكتب الإيميل فوق الأول وبعدين دوس على "نسيت كلمة المرور".'; return; }
    Store.resetPassword(email).then(function () { forgotMsg.textContent = 'بعتنالك رابط تغيير كلمة المرور على الإيميل.'; })
      .catch(function () { forgotMsg.textContent = 'مقدرناش نبعت الرابط، اتأكد من الإيميل.'; });
  });

  /* ---------- Change password ---------- */
  var pwModal = null, pwForm = document.getElementById('pwForm'), pwMsg = document.getElementById('pwMsg');
  document.getElementById('pwBtn').addEventListener('click', function () {
    pwForm.reset(); pwMsg.hidden = true;
    if (!pwModal) pwModal = new bootstrap.Modal(document.getElementById('pwModal'));
    pwModal.show();
  });
  function pwSay(t, ok) { pwMsg.hidden = false; pwMsg.textContent = t; pwMsg.style.color = ok ? 'var(--primary)' : 'var(--danger)'; }
  pwForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var o = document.getElementById('pwOld').value, n = document.getElementById('pwNew').value, n2 = document.getElementById('pwNew2').value;
    if (n.length < 6) return pwSay('كلمة المرور الجديدة لازم تكون 6 حروف على الأقل.');
    if (n !== n2) return pwSay('كلمتين المرور الجديدتين مش متطابقتين.');
    if (n === o) return pwSay('الجديدة لازم تختلف عن الحالية.');
    Store.changePassword(o, n).then(function () {
      pwSay('تم تغيير كلمة المرور ✓', true);
      setTimeout(function () { pwModal.hide(); }, 1200);
    }).catch(function (err) {
      var c = err && err.code;
      pwSay(c === 'auth/weak-password' ? 'كلمة المرور ضعيفة.' : 'كلمة المرور الحالية غلط.');
    });
  });

  Store.onAuth(function (loggedIn) {
    gate.hidden = loggedIn; dash.hidden = !loggedIn;
    if (loggedIn && !unsub) {
      unsub = Store.subscribeBookings(function (list) { bookings = list; render(); }, function () {
        empty.hidden = false; empty.textContent = 'مفيش صلاحية لقراءة الحجوزات. راجع قواعد Firestore.';
      });
    }
    if (!loggedIn && unsub) { unsub(); unsub = null; bookings = []; }
  });

  /* ---------- Render ---------- */
  var fSearch = document.getElementById('fSearch'), fStatus = document.getElementById('fStatus'), fDate = document.getElementById('fDate');
  [fSearch, fStatus, fDate].forEach(function (el) { el.addEventListener('input', render); });
  document.getElementById('fToday').addEventListener('click', function () { fDate.value = todayIso(); render(); });
  document.getElementById('fReset').addEventListener('click', function () { fSearch.value = ''; fStatus.value = ''; fDate.value = ''; render(); });

  function filtered() {
    var q = fSearch.value.trim().toLowerCase();
    return bookings.filter(function (b) {
      if (fStatus.value && b.status !== fStatus.value) return false;
      if (fDate.value && b.date !== fDate.value) return false;
      if (q && (b.ownerName + ' ' + b.petName + ' ' + b.phone).toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
  }

  function render() {
    var t = todayIso();
    document.getElementById('stToday').textContent = bookings.filter(function (b) { return b.date === t && b.status !== 'cancelled'; }).length;
    document.getElementById('stNew').textContent = bookings.filter(function (b) { return b.status === 'new'; }).length;
    document.getElementById('stUpcoming').textContent = bookings.filter(function (b) { return b.date >= t && b.status !== 'cancelled' && b.status !== 'done'; }).length;
    document.getElementById('stTotal').textContent = bookings.length;

    var list = filtered();
    empty.hidden = list.length > 0;
    empty.textContent = bookings.length ? 'مفيش حجوزات بتطابق الفلتر.' : 'لا يوجد حجوزات لسه.';
    body.innerHTML = list.map(function (b) {
      return '<tr>' +
        '<td data-label="التاريخ">' + esc(b.date) + '</td>' +
        '<td data-label="الوقت">' + esc(b.time) + '</td>' +
        '<td data-label="صاحب الحيوان">' + esc(b.ownerName) + '<br><a href="' + waLink(b.phone) + '" target="_blank" rel="noopener" class="text-decoration-underline small">' + esc(b.phone) + '</a></td>' +
        '<td data-label="الحيوان">' + esc(b.petName) + ' <small>(' + esc(b.petType) + ')</small></td>' +
        '<td data-label="المشكلة">' + esc(b.problem) + '</td>' +
        '<td data-label="الحالة"><span class="badge-status st-' + esc(b.status) + '">' + esc(STATUS[b.status] || b.status) + '</span></td>' +
        '<td data-label=""><div class="row-actions">' +
        '<button class="vbtn vbtn-outline vbtn-sm" data-act="file" data-id="' + esc(b.id) + '">ملف الحيوان</button>' +
        '</div></td></tr>';
    }).join('');
  }

  body.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act="file"]');
    if (btn) openFile(btn.getAttribute('data-id'));
  });

  /* ---------- Pet file modal ---------- */
  var modalEl = document.getElementById('petModal');
  var content = document.getElementById('petModalContent');

  function openFile(id) {
    currentBooking = bookings.filter(function (b) { return b.id === id; })[0];
    if (!currentBooking) return;
    if (!modal) modal = new bootstrap.Modal(modalEl);
    content.innerHTML = '<p class="text-center">جاري التحميل...</p>';
    modal.show();
    Store.getPet(currentBooking.petId || Store.petIdOf(currentBooking.phone, currentBooking.petName)).then(function (pet) {
      currentPet = { vaccines: pet.vaccines || [], visits: pet.visits || [] };
      drawFile();
    }).catch(function () { content.innerHTML = '<p>تعذر تحميل الملف.</p>'; });
  }

  function persistPet() {
    return Store.savePet(currentBooking.petId || Store.petIdOf(currentBooking.phone, currentBooking.petName), currentPet);
  }

  function drawFile() {
    var b = currentBooking;
    var photo = b.photo && /^data:image\//.test(b.photo)
      ? '<img class="pet-file-photo" src="' + esc(b.photo) + '" alt="">'
      : '<div class="pet-file-photo pet-file-photo-placeholder">🐾</div>';
    content.innerHTML =
      '<div class="pet-file-header">' + photo +
      '<div><h2 class="mb-1">' + esc(b.petName) + '</h2><p class="mb-0">' + esc(b.petType) + ' — ' + esc(b.petAge) + '<br>المالك: ' + esc(b.ownerName) + ' — <a href="' + waLink(b.phone) + '" target="_blank" rel="noopener">' + esc(b.phone) + '</a></p></div></div>' +

      '<div class="pet-file-section"><h3>حالة الحجز</h3>' +
      '<div class="inline-form"><select id="statusSel" aria-label="حالة الحجز">' +
      Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (b.status === k ? ' selected' : '') + '>' + STATUS[k] + '</option>'; }).join('') +
      '</select><button class="vbtn vbtn-primary vbtn-sm" id="saveStatus">حفظ</button>' +
      '<a class="vbtn vbtn-outline vbtn-sm" target="_blank" rel="noopener" href="' + waLink(b.phone, 'أهلاً ' + b.ownerName + '، بخصوص ميعاد ' + b.petName + ' يوم ' + b.date + ' الساعة ' + b.time) + '">واتساب</a>' +
      '<button class="vbtn vbtn-danger vbtn-sm" id="delBooking">حذف الحجز</button></div></div>' +

      '<div class="pet-file-section"><h3>سبب الزيارة</h3><p>' + esc(b.problem) + '</p></div>' +

      '<div class="pet-file-section"><h3>💉 التطعيمات</h3><ul class="record-list" id="vaccList">' +
      (currentPet.vaccines.length ? currentPet.vaccines.map(function (v) { return '<li>' + esc(v.name) + ' — ' + esc(v.date) + '</li>'; }).join('') : '<li class="muted-item">لا يوجد تطعيمات مسجلة.</li>') +
      '</ul><div class="inline-form"><input id="vName" placeholder="اسم التطعيم"><input id="vDate" type="date" aria-label="تاريخ التطعيم"><button class="vbtn vbtn-accent vbtn-sm" id="addVacc">إضافة</button></div></div>' +

      '<div class="pet-file-section"><h3>🩺 تاريخ الزيارات</h3><ul class="record-list" id="visitList">' +
      (currentPet.visits.length ? currentPet.visits.map(function (v) { return '<li><strong>' + esc(v.date) + '</strong> — ' + esc(v.note) + '</li>'; }).join('') : '<li class="muted-item">لا يوجد زيارات مسجلة.</li>') +
      '</ul><div class="inline-form"><input id="nNote" placeholder="التشخيص / الملاحظة"><button class="vbtn vbtn-accent vbtn-sm" id="addVisit">إضافة</button></div></div>';

    document.getElementById('saveStatus').onclick = function () {
      var s = document.getElementById('statusSel').value;
      Store.updateBooking(b.id, { status: s }).then(function () { b.status = s; });
    };
    document.getElementById('delBooking').onclick = function () {
      if (!confirm('متأكد إنك عاوز تمسح الحجز ده؟ الميعاد هيرجع متاح.')) return;
      Store.deleteBooking(b).then(function () { modal.hide(); });
    };
    document.getElementById('addVacc').onclick = function () {
      var n = document.getElementById('vName').value.trim(), d = document.getElementById('vDate').value || todayIso();
      if (!n) return;
      currentPet.vaccines.push({ name: n, date: d });
      persistPet().then(drawFile);
    };
    document.getElementById('addVisit').onclick = function () {
      var n = document.getElementById('nNote').value.trim();
      if (!n) return;
      currentPet.visits.push({ date: todayIso(), note: n });
      persistPet().then(drawFile);
    };
  }
})();
