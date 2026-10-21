/* ============================================
   store.js — data layer
   Firebase (Firestore + Auth) لو الإعدادات متحطة، وإلا localStorage كوضع تجريبي.
   باقي الملفات بتكلم window.Store بس.
   ============================================ */
(function () {
  var cfg = window.FIREBASE_CONFIG || {};
  var configured = !!(cfg.apiKey && cfg.apiKey.indexOf('YOUR_') !== 0 && window.firebase);
  var db = null, auth = null;

  if (configured) {
    firebase.initializeApp(cfg);
    db = firebase.firestore();
    auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;  // مكتبة Auth بتتحمّل في صفحة اللوحة بس
  }

  /* ---------- localStorage helpers (demo mode) ---------- */
  var LS = 'vet_';
  function read(k, d) { try { var v = JSON.parse(localStorage.getItem(LS + k)); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} }
  var localListeners = [];
  function notifyLocal() { var all = read('bookings', []); localListeners.forEach(function (cb) { cb(all); }); }

  var authListeners = [];
  function notifyAuth(v) { authListeners.forEach(function (cb) { cb(v); }); }

  function slotId(date, time) { return date + '_' + time.replace(':', ''); }
  function petIdOf(phone, petName) { return (phone + '_' + petName).replace(/[\/\s.#$\[\]]+/g, '-').toLowerCase(); }
  function uid() { return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  var Store = {
    isFirebase: configured,
    petIdOf: petIdOf,

    /* ---------- Bookings ---------- */
    addBooking: function (b) {
      var sid = slotId(b.date, b.time);
      var data = Object.assign({}, b, { status: 'new', slotId: sid, petId: petIdOf(b.phone, b.petName) });

      if (configured) {
        var batch = db.batch();
        batch.set(db.collection('slots').doc(sid), { date: b.date, time: b.time });
        batch.set(db.collection('bookings').doc(), Object.assign(data, { createdAt: firebase.firestore.FieldValue.serverTimestamp() }));
        return batch.commit().catch(function (e) {
          if (e && e.code === 'permission-denied') throw new Error('SLOT_TAKEN');
          throw e;
        });
      }
      var slots = read('slots', {});
      if (slots[sid]) return Promise.reject(new Error('SLOT_TAKEN'));
      slots[sid] = { date: b.date, time: b.time };
      write('slots', slots);
      var all = read('bookings', []);
      all.push(Object.assign(data, { id: uid(), createdAt: Date.now() }));
      write('bookings', all);
      notifyLocal();
      return Promise.resolve();
    },

    getBookedSlots: function (date) {
      if (configured) {
        return db.collection('slots').where('date', '==', date).get()
          .then(function (snap) { return snap.docs.map(function (d) { return d.data().time; }); })
          .catch(function () { return []; });
      }
      var slots = read('slots', {});
      return Promise.resolve(Object.keys(slots).filter(function (k) { return slots[k].date === date; }).map(function (k) { return slots[k].time; }));
    },

    subscribeBookings: function (cb, onError) {
      if (configured) {
        return db.collection('bookings').orderBy('date', 'desc').onSnapshot(function (snap) {
          cb(snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }));
        }, onError || function () {});
      }
      localListeners.push(cb);
      cb(read('bookings', []));
      return function () { localListeners = localListeners.filter(function (x) { return x !== cb; }); };
    },

    updateBooking: function (id, patch) {
      if (configured) return db.collection('bookings').doc(id).update(patch);
      var all = read('bookings', []);
      all.forEach(function (b) { if (b.id === id) Object.assign(b, patch); });
      write('bookings', all); notifyLocal();
      return Promise.resolve();
    },

    deleteBooking: function (b) {
      if (configured) {
        var batch = db.batch();
        batch.delete(db.collection('bookings').doc(b.id));
        if (b.slotId) batch.delete(db.collection('slots').doc(b.slotId));
        return batch.commit();
      }
      write('bookings', read('bookings', []).filter(function (x) { return x.id !== b.id; }));
      var slots = read('slots', {}); delete slots[b.slotId]; write('slots', slots);
      notifyLocal();
      return Promise.resolve();
    },

    /* ---------- Pet files ---------- */
    getPet: function (id) {
      if (configured) {
        return db.collection('pets').doc(id).get().then(function (d) { return d.exists ? d.data() : { vaccines: [], visits: [] }; });
      }
      return Promise.resolve(read('pets', {})[id] || { vaccines: [], visits: [] });
    },
    savePet: function (id, data) {
      if (configured) return db.collection('pets').doc(id).set(data);
      var pets = read('pets', {}); pets[id] = data; write('pets', pets);
      return Promise.resolve();
    },

    /* ---------- Auth (dashboard) ---------- */
    onAuth: function (cb) {
      if (configured) return auth.onAuthStateChanged(function (u) { cb(!!u); });
      authListeners.push(cb);
      cb(sessionStorage.getItem('vet_admin') === '1');
      return function () { authListeners = authListeners.filter(function (x) { return x !== cb; }); };
    },
    login: function (email, password) {
      if (configured) return auth.signInWithEmailAndPassword(email, password);
      if (password === (read('pw', null) || 'vet2026')) { sessionStorage.setItem('vet_admin', '1'); notifyAuth(true); return Promise.resolve(); }
      return Promise.reject(new Error('BAD_PASSWORD'));
    },
    changePassword: function (oldPw, newPw) {
      if (configured) {
        var u = auth.currentUser;
        if (!u) return Promise.reject(new Error('NO_USER'));
        var cred = firebase.auth.EmailAuthProvider.credential(u.email, oldPw);
        return u.reauthenticateWithCredential(cred).then(function () { return u.updatePassword(newPw); });
      }
      if (oldPw !== (read('pw', null) || 'vet2026')) return Promise.reject(new Error('BAD_PASSWORD'));
      write('pw', newPw); return Promise.resolve();
    },
    resetPassword: function (email) {
      if (configured) return auth.sendPasswordResetEmail(email);
      return Promise.reject(new Error('DEMO'));
    },
    logout: function () {
      if (configured) return auth.signOut();
      sessionStorage.removeItem('vet_admin'); notifyAuth(false); return Promise.resolve();
    }
  };

  window.Store = Store;
})();
