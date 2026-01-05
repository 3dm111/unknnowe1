import { getAuth, signOut } 
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const auth = getAuth();

/* تسجيل خروج */
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.onclick = () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

/* دخول صفحة المخالفات */
window.goViolations = () => {
  window.location.href = "violations.html";
};

/* دخول صفحة الملف الشخصي */
window.goProfile = () => {
  window.location.href = "profile.html";
};
