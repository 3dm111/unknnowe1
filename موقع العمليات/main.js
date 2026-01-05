import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBgkXYq3vcM5npz86AVnOZjjLD_BuDF1hk",
  authDomain: "sz70-f4c2b.firebaseapp.com",
  projectId: "sz70-f4c2b",
  storageBucket: "sz70-f4c2b.firebasestorage.app",
  messagingSenderId: "252057294534",
  appId: "1:252057294534:web:ddfb69446a598de65be9c7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// حماية الصفحة
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// الذهاب للوحة المخالفات
document.getElementById("violationsBtn").onclick = () => {
  window.location.href = "violations.html";
};

// تسجيل خروج
document.getElementById("logoutBtn").onclick = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};
