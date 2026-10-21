/* ============================================
   booking.js — فورم الحجز + اختيار الموعد + التحقق + الحفظ
   ============================================ */
(function () {
  var C = window.CLINIC;
  var form = document.getElementById('bookingForm');
  if (!form) return;

  var dateInput = document.getElementById('date');
  var slotsWrap = document.getElementById('slots');
  var slotsHint = document.getElementById('slotsHint');
  var timeInput = document.getElementById('time');
  var photoInput = document.getElementById('photo');
  var preview = document.getElementById('photoPreview');
  var alertBox = document.getElementById('formAlert');
  var submitBtn = document.getElementById('submitBtn');
  var photoData = '';

  if (!Store.isFirebase) document.getElementById('demoNote').hidden = false;

  /* ---------- Date: today → +60 days ---------- */
  function iso(d) { var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day; }
  var today = new Date();
  dateInput.min = iso(today);
  var max = new Date(); max.setDate(max.getDate() + 60);
  dateInput.max = iso(max);

  /* ---------- Slots ---------- */
  function allSlots() {
    var out = [];
    for (var h = C.openHour; h < C.closeHour; h++) { out.push(pad(h) + ':00'); out.push(pad(h) + ':30'); }
    return out;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function label(t) {
    var h = parseInt(t.slice(0, 2), 10), m = t.slice(3);
    var suffix = h >= 12 ? 'م' : 'ص';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + m + ' ' + suffix;
  }

  function renderSlots(date) {
    timeInput.value = '';
    clearError('time');
    if (!date) { slotsWrap.innerHTML = ''; slotsHint.textContent = 'اختار التاريخ الأول عشان تظهرلك المواعيد المتاحة.'; return; }
    slotsHint.textContent = 'بنحمّل المواعيد...';
    Store.getBookedSlots(date).then(function (booked) {
      var now = new Date();
      var isToday = date === iso(now);
      var nowMin = now.getHours() * 60 + now.getMinutes();
      var html = '', free = 0;
      allSlots().forEach(function (t) {
        var mins = parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3), 10);
        var disabled = booked.indexOf(t) !== -1 || (isToday && mins <= nowMin + 30);
        if (!disabled) free++;
        html += '<button type="button" class="slot" data-time="' + t + '"' + (disabled ? ' disabled' : '') + '>' + label(t) + '</button>';
      });
      slotsWrap.innerHTML = html;
      slotsHint.textContent = free ? 'اختار الميعاد المناسب (المواعيد المشطوبة محجوزة).' : 'مفيش مواعيد متاحة في اليوم ده، جرّب يوم تاني.';
    });
  }

  dateInput.addEventListener('change', function () { clearError('date'); renderSlots(dateInput.value); });
  slotsWrap.addEventListener('click', function (e) {
    var btn = e.target.closest('.slot');
    if (!btn || btn.disabled) return;
    slotsWrap.querySelectorAll('.slot').forEach(function (s) { s.classList.remove('selected'); });
    btn.classList.add('selected');
    timeInput.value = btn.getAttribute('data-time');
    clearError('time');
  });
  renderSlots('');

  /* ---------- Photo: compress to small JPEG data-url ---------- */
  photoInput.addEventListener('change', function () {
    var f = photoInput.files && photoInput.files[0];
    photoData = ''; preview.innerHTML = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) { photoInput.value = ''; return; }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var size = 480, scale = Math.min(1, size / Math.max(img.width, img.height));
        var cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        photoData = cv.toDataURL('image/jpeg', 0.7);
        preview.innerHTML = '<img src="' + photoData + '" alt="صورة الحيوان">';
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  });

  /* ---------- Validation ---------- */
  var rules = {
    ownerName: function (v) { return v.trim().length >= 3 || 'اكتب الاسم (3 حروف على الأقل)'; },
    phone: function (v) { return /^01[0125]\d{8}$/.test(v.replace(/\s/g, '')) || 'اكتب رقم موبايل مصري صحيح (11 رقم)'; },
    petName: function (v) { return v.trim().length >= 2 || 'اكتب اسم الحيوان'; },
    petType: function (v) { return !!v || 'اختار النوع'; },
    petAge: function (v) { return v.trim().length >= 1 || 'اكتب العمر'; },
    problem: function (v) { return v.trim().length >= 5 || 'اكتب وصف مختصر للحالة'; },
    date: function (v) { return !!v || 'اختار التاريخ'; },
    time: function (v) { return !!v || 'اختار الميعاد'; }
  };

  function rowOf(name) { var el = document.getElementById(name); return el ? el.closest('.form-row') : null; }
  function setError(name, msg) {
    var row = rowOf(name) || document.getElementById('slotsRow');
    if (!row) return;
    row.classList.add('invalid');
    var err = row.querySelector('.field-error'); if (err) err.textContent = msg;
  }
  function clearError(name) {
    var row = rowOf(name) || document.getElementById('slotsRow');
    if (row) row.classList.remove('invalid');
  }
  Object.keys(rules).forEach(function (name) {
    var el = document.getElementById(name);
    if (el && name !== 'time') el.addEventListener('input', function () { clearError(name); });
  });

  function validate() {
    var ok = true, first = null;
    Object.keys(rules).forEach(function (name) {
      var el = document.getElementById(name);
      var res = rules[name](el.value);
      if (res !== true) { ok = false; setError(name, res); if (!first) first = name === 'time' ? slotsWrap : el; }
    });
    if (first && first.scrollIntoView) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return ok;
  }

  /* ---------- Submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    alertBox.hidden = true;
    if (!validate()) return;

    var data = {
      ownerName: form.ownerName.value.trim(),
      phone: form.phone.value.replace(/\s/g, ''),
      petName: form.petName.value.trim(),
      petType: form.petType.value,
      petAge: form.petAge.value.trim(),
      problem: form.problem.value.trim(),
      date: form.date.value,
      time: form.time.value,
      photo: photoData
    };

    submitBtn.disabled = true; submitBtn.textContent = 'جاري الحجز...';
    Store.addBooking(data).then(function () {
      document.getElementById('sumName').textContent = data.ownerName + ' — ' + data.petName + ' (' + data.petType + ')';
      document.getElementById('sumWhen').textContent = data.date + ' — ' + label(data.time);
      var msg = 'أهلاً، أنا ' + data.ownerName + '، حجزت ميعاد ل' + data.petName + ' يوم ' + data.date + ' الساعة ' + label(data.time);
      document.getElementById('waConfirm').href = 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(msg);
      form.hidden = true;
      var conf = document.getElementById('confirmation'); conf.hidden = false;
      conf.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function (err) {
      submitBtn.disabled = false; submitBtn.textContent = 'تأكيد الحجز';
      if (err && err.message === 'SLOT_TAKEN') {
        alertBox.textContent = 'الميعاد ده اتحجز لحظة فاتت، اختار ميعاد تاني.';
        renderSlots(dateInput.value);
      } else {
        alertBox.textContent = 'حصلت مشكلة أثناء الحجز، جرّب تاني أو كلمنا على واتساب.';
      }
      alertBox.hidden = false;
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();
