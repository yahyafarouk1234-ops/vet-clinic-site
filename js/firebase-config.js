/* ============================================
   firebase-config.js
   حط بيانات مشروعك هنا (Firebase Console → Project settings → Your apps → Web app).
   طول ما القيم لسه "YOUR_..." الموقع بيشتغل في وضع تجريبي (البيانات بتتحفظ في المتصفح بس).
   ============================================ */
window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "vet-clinic-mohamed.firebaseapp.com",
  projectId: "vet-clinic-mohamed",
  storageBucket: "vet-clinic-mohamed.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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
