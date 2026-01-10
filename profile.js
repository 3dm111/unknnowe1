import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailEl  = document.getElementById("email");
  const acceptEl = document.getElementById("accept");  // ✅ مطابق للـ HTML
  const rejectEl = document.getElementById("reject");  // ✅ مطابق للـ HTML
  const pointsEl = document.getElementById("points");  // ✅ مطابق للـ HTML
  const backBtn  = document.getElementById("backBtn");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    if (emailEl) emailEl.textContent = user.email;

    // ✅ نخزن ونقرأ من users
    const ref = doc(db, "users", user.uid);

    // ✅ ضمان وجود الحقول (merge)
    await setDoc(
      ref,
      { email: user.email, accept: 0, reject: 0, points: 0 },
      { merge: true }
    );

    // ✅ قراءة لحظية
    onSnapshot(ref, (snap) => {
      const d = snap.data() || {};
      console.log("USER DOC:", d);

      if (acceptEl) acceptEl.textContent = String(d.accept ?? 0);
      if (rejectEl) rejectEl.textContent = String(d.reject ?? 0);
      if (pointsEl) pointsEl.textContent = String(d.points ?? 0);
    });
  });

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }
});
