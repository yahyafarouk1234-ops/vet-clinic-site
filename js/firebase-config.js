/* ============================================
   firebase-config.js
   حط بيانات مشروعك هنا (Firebase Console → Project settings → Your apps → Web app).
   طول ما القيم لسه "YOUR_..." الموقع بيشتغل في وضع تجريبي (البيانات بتتحفظ في المتصفح بس).
   ============================================ */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBYDPzhJYJS_jmL7_ge6wokG-vhMGwf4XI",
  authDomain: "vet-clinic-mohamed.firebaseapp.com",
  projectId: "vet-clinic-mohamed",
  storageBucket: "vet-clinic-mohamed.firebasestorage.app",
  messagingSenderId: "192471504006",
  appId: "1:192471504006:web:62ea08917b23c91e76ed07"
};

/* بيانات العيادة — مكان واحد للتعديل */
window.CLINIC = {
  name: "عيادة الحياة البيطرية",
  doctor: "د. محمد الزيات",
  whatsapp: "201286740702",
  phoneDisplay: "01286740702",
  city: "طنطا، الغربية",
  hours: "يوميًا من 10 صباحًا حتى 10 مساءً",
  openHour: 10,
  closeHour: 22
};
