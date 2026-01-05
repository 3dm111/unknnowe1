import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// تأكد إن العناصر موجودة في HTML
const loginBtn = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    // 1️⃣ تسجيل الدخول
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    console.log("تم تسجيل الدخول:", user.uid);

    // 2️⃣ مرجع المستخدم
    const userRef = doc(db, "users", user.uid);

    // 3️⃣ فحص هل له بيانات
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      console.log("إنشاء بيانات جديدة للمستخدم");

      await setDoc(userRef, {
        email: user.email,
        points: 0,
        acceptCount: 0,
        rejectCount: 0,
        createdAt: new Date()
      });
    } else {
      console.log("البيانات موجودة مسبقًا");
    }

    // 4️⃣ تحويل
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("خطأ Firebase:", error);
    alert("بيانات الدخول غير صحيحة أو مشكلة اتصال");
  }
});
