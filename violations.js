import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("violations");

  if (!container) {
    console.error("❌ عنصر violations غير موجود في الصفحة");
    return;
  }

  // تأكد المشرف مسجل دخول
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // تحميل المخالفات
    loadViolations(container, user.uid);
  });
});

async function loadViolations(container, adminUid) {
  try {
    const res = await fetch("/api/violations");
    const data = await res.json();

    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = "<p>لا توجد مخالفات</p>";
      return;
    }

    data.forEach(v => {
      const card = document.createElement("div");
      card.className = "violation-card";

      const img = document.createElement("img");
      if (v.imageBase64 && v.imageBase64.length > 0) {
        img.src = `data:image/png;base64,${v.imageBase64}`;
      } else {
        img.style.display = "none";
      }

      // لا تضيف portrait ولا أي تعديل
      img.onload = null;

      const title = document.createElement("h3");
      title.textContent = v.violation || "مخالفة بدون اسم";

      const actions = document.createElement("div");
      actions.className = "actions";

      const acceptBtn = document.createElement("button");
      acceptBtn.className = "accept";
      acceptBtn.textContent = "قبول";
      acceptBtn.onclick = () => updateStatus(v.id, "accept", adminUid);

      const rejectBtn = document.createElement("button");
      rejectBtn.className = "reject";
      rejectBtn.textContent = "رفض";
      rejectBtn.onclick = () => updateStatus(v.id, "reject", adminUid);

      actions.appendChild(acceptBtn);
      actions.appendChild(rejectBtn);

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(actions);

      container.appendChild(card);
    });
  } catch (err) {
    console.error("❌ خطأ في جلب المخالفات:", err);
    container.innerHTML = "<p>فشل تحميل المخالفات</p>";
  }
}

async function updateStatus(id, type, adminUid) {
  try {
    // 1) تحديث حالة المخالفة في السيرفر
    const res = await fetch(`https://unknnowe1.onrender.com/api/violation/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    if (!res.ok) throw new Error("فشل التحديث في السيرفر");

    // 2) تحديث نقاط المشرف في Firestore
    // عدّل النقاط هنا على مزاجك:
    const ACCEPT_POINTS = 10;
    const REJECT_POINTS = 5;

    const pointsToAdd = (type === "accept") ? ACCEPT_POINTS : REJECT_POINTS;

    const statsRef = doc(db, "admins", adminUid);

    // إذا الوثيقة غير موجودة، ننشئها أول مرة
    const snap = await getDoc(statsRef);
    if (!snap.exists()) {
      await setDoc(statsRef, {
        accept: 0,
        reject: 0,
        points: 0
      });
    }

    // تحديث عداد + مجموع نقاط
    await updateDoc(statsRef, {
      accept: type === "accept" ? increment(1) : increment(0),
      reject: type === "reject" ? increment(1) : increment(0),
      points: increment(pointsToAdd)
    });

    // 3) تحديث الصفحة
    location.reload();
  } catch (err) {
    console.error("❌ خطأ:", err);
    alert("صار خطأ، راجع الكونسل");
  }
}
