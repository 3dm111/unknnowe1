import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const API_BASE = "https://unknnowe1.onrender.com";
let ADMIN_UID = null;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("violations");
  if (!container) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    ADMIN_UID = user.uid;
    await ensureAdminDoc(ADMIN_UID);
    loadViolations(container);
  });
});

async function ensureAdminDoc(uid) {
  const ref = doc(db, "admins", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { accept: 0, reject: 0, points: 0 });
  }
}

async function loadViolations(container) {
  try {
    const res = await fetch(`${API_BASE}/api/violations`);
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
      const base64 = v.imageBase64 || v.image || "";
      if (base64.length > 0) img.src = `data:image/png;base64,${base64}`;
      else img.style.display = "none";

      const title = document.createElement("h3");
      title.textContent = v.violation || "مخالفة بدون اسم";

      const actions = document.createElement("div");
      actions.className = "actions";

      const acceptBtn = document.createElement("button");
      acceptBtn.className = "accept";
      acceptBtn.textContent = "قبول";
      acceptBtn.onclick = () => updateStatus(v.id, "accept");

      const rejectBtn = document.createElement("button");
      rejectBtn.className = "reject";
      rejectBtn.textContent = "رفض";
      rejectBtn.onclick = () => updateStatus(v.id, "reject");

      actions.appendChild(acceptBtn);
      actions.appendChild(rejectBtn);

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(actions);

      container.appendChild(card);
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = "<p>فشل تحميل المخالفات</p>";
  }
}

async function updateStatus(id, type) {
  try {
    // 1) تحديث بالسيرفر
    const res = await fetch(`${API_BASE}/api/violation/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      alert("فشل: " + (json?.message || res.status));
      return;
    }

    // 2) تسجيل النقاط للمشرف في Firestore
    // السيرفر يرجّع points (حسب app.js عندك)
    const points = Number(json?.points ?? 0);

    const ref = doc(db, "admins", ADMIN_UID);

    await updateDoc(ref, {
      accept: type === "accept" ? increment(1) : increment(0),
      reject: type === "reject" ? increment(1) : increment(0),
      points: increment(points)
    });

    // 3) تحديث الصفحة
    location.reload();
  } catch (err) {
    console.error(err);
    alert("صار خطأ راجع الكونسول");
  }
}
