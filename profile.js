import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailEl  = document.getElementById("email");
  const acceptEl = document.getElementById("accept");
  const rejectEl = document.getElementById("reject");
  const pointsEl = document.getElementById("points");

  // ✅ لو ما لقى العناصر راح يطبع غلط واضح
  if (!acceptEl || !rejectEl || !pointsEl) {
    console.error("❌ IDs غلط في HTML. لازم: accept/reject/points");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    if (emailEl) emailEl.textContent = user.email;

    // ✅ نقرأ من users/{uid}
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // لو ما فيه وثيقة users فهذا يفسر ليه النقاط 0
      console.error("❌ ما فيه وثيقة للمستخدم داخل users بهذا uid:", user.uid);
      acceptEl.textContent = "0";
      rejectEl.textContent = "0";
      pointsEl.textContent = "0";
      return;
    }

    const d = snap.data() || {};
    acceptEl.textContent = String(d.accept ?? 0);
    rejectEl.textContent = String(d.reject ?? 0);
    pointsEl.textContent = String(d.points ?? 0);
  });
});
