import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

  // عناصر الصفحة (نفس IDs الموجودة عندك)
  const emailEl   = document.getElementById("email");
  const avatarEl  = document.querySelector(".avatar");
  const acceptEl  = document.getElementById("accept");
  const rejectEl  = document.getElementById("reject");
  const pointsEl  = document.getElementById("points");
  const backBtn   = document.getElementById("backBtn");

  // تحقق من تسجيل الدخول
  onAuthStateChanged(auth, user => {
    if (!user) {
      // لو مو مسجل دخول
      window.location.href = "index.html";
      return;
    }

    // الإيميل
    if (emailEl)
      emailEl.textContent = user.email;

    // أول حرف من الإيميل للأفاتار
    if (avatarEl)
      avatarEl.textContent = user.email.charAt(0).toUpperCase();

    // قيم افتراضية (تقدر تربطها من السيرفر لاحقًا)
    if (acceptEl) acceptEl.textContent = "0";
    if (rejectEl) rejectEl.textContent = "0";
    if (pointsEl) pointsEl.textContent = "0";
  });

  // زر الرجوع
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

});
