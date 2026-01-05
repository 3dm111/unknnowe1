import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

  // ❌ لو مو مسجل دخول
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // ✅ مرجع المستخدم
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  // ✅ إنشاء البيانات تلقائيًا
  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      points: 0,
      acceptCount: 0,
      rejectCount: 0,
      createdAt: new Date()
    });
  }

});
