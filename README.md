# عيادة الحياة البيطرية

موقع ثابت: HTML + CSS + JS + Bootstrap 5 (RTL) + Firebase (Firestore/Auth).

## تشغيل محلي
`npm run dev` (أو أي سيرفر ثابت على الفولدر).

## ربط Firebase
1. Firebase Console → Build → Firestore Database (Create) و Authentication → Email/Password → أضف حساب الدكتور.
2. Project settings → Your apps → Web → انسخ الـ config في `js/firebase-config.js`.
3. ارفع القواعد: `firebase deploy --only firestore:rules` (ملف `firestore.rules`).
4. Authentication → Settings → Authorized domains → أضف دومين Vercel.

## النشر على Vercel
ارفع الفولدر على GitHub ثم Import في Vercel: Framework = Other، بدون Build command، Output = الجذر.

## الصور
حط `images/doctor.png` و `images/cat1.jpg … cat5.jpg` (لو مش موجودة بيظهر بديل تلقائي).
