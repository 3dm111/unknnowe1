import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("✅ profile.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOMContentLoaded");

  const emailEl  = document.getElementById("email");
  const acceptEl = document.getElementById("accept");
  const rejectEl = document.getElementById("reject");
  const pointsEl = document.getElementById("points");

  console.log("Elements:", { emailEl, acceptEl, rejectEl, pointsEl });

  onAuthStateChanged(auth, async (user) => {
    console.log("onAuthStateChanged user:", user);

    if (!user) {
      console.log("❌ no user (redirect?)");
      return;
    }

    if (emailEl) emailEl.textContent = user.email;

    const ref = doc(db, "users", user.uid);

    await setDoc(
      ref,
      { email: user.email, accept: 0, reject: 0, points: 0 },
      { merge: true }
    );

    console.log("✅ ensured users doc exists:", user.uid);

    onSnapshot(ref, (snap) => {
      const d = snap.data() || {};
      console.log("🔥 SNAP:", d);

      if (acceptEl) acceptEl.textContent = String(d.accept ?? 0);
      if (rejectEl) rejectEl.textContent = String(d.reject ?? 0);
      if (pointsEl) pointsEl.textContent = String(d.points ?? 0);
    });
  });
});
