import { initializeApp } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* 🔥 إعداد Firebase */
const firebaseConfig = {
  apiKey: "PUT_YOUR_API_KEY",
  authDomain: "PUT_YOUR_PROJECT.firebaseapp.com",
  projectId: "PUT_YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {

  const emailEl = document.getElementById("email");
  const acceptEl = document.getElementById("accept");
  const rejectEl = document.getElementById("reject");
  const pointsEl = document.getElementById("points");
  const backBtn = document.getElementById("backBtn");

  /* زر الرجوع */
  backBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });

  /* التحقق من تسجيل الدخول */
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    /* عرض الإيميل */
    emailEl.textContent = user.email;

    /* جلب البيانات */
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      acceptEl.textContent = data.accept || 0;
      rejectEl.textContent = data.reject || 0;
      pointsEl.textContent = data.points || 0;
    }
  });

});
