const API_BASE = "https://unknnowe1.onrender.com";

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let ID_TOKEN = null;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("violations");
  if (!container) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    ID_TOKEN = await user.getIdToken(true);

    // ✅ اختبار سريع يثبت إن التوكن شغال
    const me = await fetch(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${ID_TOKEN}` },
    });
    console.log("ME STATUS:", me.status, await me.text());

    loadViolations(container);
  });
});

async function loadViolations(container) {
  try {
    const res = await fetch(`${API_BASE}/api/violations`, {
      headers: { Authorization: `Bearer ${ID_TOKEN}` },
    });

    const txt = await res.text();
    console.log("VIOLATIONS STATUS:", res.status, txt);

    if (!res.ok) {
      container.innerHTML = `<p>فشل تحميل المخالفات: ${txt}</p>`;
      return;
    }

    const data = JSON.parse(txt);
    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = "<p>لا توجد مخالفات</p>";
      return;
    }

    data.forEach((v) => {
      const card = document.createElement("div");
      card.className = "violation-card";

      const img = document.createElement("img");
      const base64 = v.imageBase64 || "";
      if (base64) img.src = `data:image/png;base64,${base64}`;
      else img.style.display = "none";

      const title = document.createElement("h3");
      title.textContent = v.violation || "مخالفة بدون اسم";

      const actions = document.createElement("div");
      actions.className = "actions";

      const acceptBtn = document.createElement("button");
      acceptBtn.className = "accept";
      acceptBtn.textContent = "قبول";
      acceptBtn.onclick = () => updateStatus(v.id, "acceptCount");

      const rejectBtn = document.createElement("button");
      rejectBtn.className = "reject";
      rejectBtn.textContent = "رفض";
      rejectBtn.onclick = () => updateStatus(v.id, "rejectCount");

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
    if (!ID_TOKEN) return alert("التوكن غير جاهز");
    const res = await fetch(`${API_BASE}/api/violation/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ID_TOKEN}`,
      },
      body: JSON.stringify({ id }),
    });

    const txt = await res.text();
    console.log("DECIDE STATUS:", res.status, txt);

    if (!res.ok) return alert("فشل: " + txt);

    location.reload();
  } catch (e) {
    console.error(e);
    alert("خطأ بالشبكة");
  }
}
