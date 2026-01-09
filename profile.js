import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailEl = document.getElementById("profileEmail");
  const avatarEl = document.getElementById("profileAvatar");
  const logoutBtn = document.getElementById("logoutBtn");

  // أرقام تجريبية (تقدر تربطها لاحقًا بالسيرفر)
  const acceptedEl = document.getElementById("acceptedCount");
  const rejectedEl = document.getElementById("rejectedCount");

  onAuthStateChanged(auth, user => {
    if (!user) {
      // إذا ما هو مسجل دخول يرجعه للّوقن
      window.location.href = "index.html";
      return;
    }

    // عرض الإيميل
    if (emailEl) emailEl.textContent = user.email;

    // أول حرف من الإيميل للأفاتار
    if (avatarEl) avatarEl.textContent = user.email[0].toUpperCase();

    // قيم افتراضية (غيّرها لاحقًا من API)
    if (acceptedEl) acceptedEl.textContent = "0";
    if (rejectedEl) rejectedEl.textContent = "0";
  });

  // تسجيل خروج
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "index.html";
    });
  }
});
