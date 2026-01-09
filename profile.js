import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  const emailEl = document.getElementById("email");
  const acceptEl = document.getElementById("accept");
  const rejectEl = document.getElementById("reject");
  const pointsEl = document.getElementById("points");
  const backBtn = document.getElementById("backBtn");

  // تأكيد إن العناصر موجودة
  if (!emailEl || !backBtn) {
    console.error("❌ عناصر HTML غير موجودة");
    return;
  }

  onAuthStateChanged(auth, async (user) => {

    // ❌ لو مو مسجل دخول
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // ✅ عرض الإيميل
    emailEl.textContent = user.email;

    // ✅ جلب بيانات المستخدم
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      acceptEl.textContent = data.acceptCount ?? 0;
      rejectEl.textContent = data.rejectCount ?? 0;
      pointsEl.textContent = data.points ?? 0;
    } else {
      // لو ما فيه بيانات
      acceptEl.textContent = 0;
      rejectEl.textContent = 0;
      pointsEl.textContent = 0;
    }
  });

  // ✅ زر الرجوع
  backBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });

});
