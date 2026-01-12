import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailEl  = document.getElementById("email");
  const acceptEl = document.getElementById("accept");
  const rejectEl = document.getElementById("reject");
  const pointsEl = document.getElementById("points");
  const backBtn  = document.getElementById("backBtn");

  // زر الرجوع
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // الإيميل من Auth
    if (emailEl) emailEl.textContent = user.email || "";

    // بيانات من Firestore
    const userRef = doc(db, "users", user.uid);

    try {
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        console.warn("⚠️ لا توجد وثيقة للمستخدم داخل users بهذا UID:", user.uid);
        // عرض أصفار بدل ما يعلق
        if (acceptEl) acceptEl.textContent = "0";
        if (rejectEl) rejectEl.textContent = "0";
        if (pointsEl) pointsEl.textContent = "0";
        return;
      }

      const data = snap.data();
      console.log("✅ بيانات المستخدم من Firestore:", data);

      // ✅ النقاط (يدعم أكثر من اسم لو كنت مستخدم اسم مختلف)
      const points =
        (typeof data.points === "number" ? data.points : null) ??
        (typeof data.point === "number" ? data.point : null) ??
        (typeof data.Points === "number" ? data.Points : null) ??
        0;

      const acceptCount =
        (typeof data.acceptCount === "number" ? data.acceptCount : null) ??
        (typeof data.accept === "number" ? data.accept : null) ??
        0;

      const rejectCount =
        (typeof data.rejectCount === "number" ? data.rejectCount : null) ??
        (typeof data.reject === "number" ? data.reject : null) ??
        0;

      if (acceptEl) acceptEl.textContent = String(acceptCount);
      if (rejectEl) rejectEl.textContent = String(rejectCount);
      if (pointsEl) pointsEl.textContent = String(points);

      // تحذير لو الاسم غلط
      if (data.points === undefined && data.point === undefined && data.Points === undefined) {
        console.warn("⚠️ ما لقيت حقل نقاط. لازم يكون اسمه points (Number) داخل users/{uid}");
      }

    } catch (e) {
      console.error("❌ خطأ قراءة Firestore:", e);
      if (acceptEl) acceptEl.textContent = "0";
      if (rejectEl) rejectEl.textContent = "0";
      if (pointsEl) pointsEl.textContent = "0";
    }
  });
});
