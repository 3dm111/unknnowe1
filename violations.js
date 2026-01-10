const API_BASE = "https://unknnowe1.onrender.com";

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let ID_TOKEN = null;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("violations");

  if (!container) {
    console.error("❌ عنصر violations غير موجود في الصفحة");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    ID_TOKEN = await user.getIdToken(true);
    loadViolations(container);
  });
});

async function loadViolations(container) {
  try {
    const res = await fetch(`${API_BASE}/api/violations`, {
      headers: { Authorization: `Bearer ${ID_TOKEN}` },
    });

    if (!res.ok) {
      const t = await res.text();
      container.innerHTML = `<p>فشل تحميل المخالفات: ${t}</p>`;
      return;
    }

    const data = await res.json();
    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = "<p>لا توجد مخالفات</p>";
      return;
    }

    data.forEach((v) => {
      const card = document.createElement("div");
      card.className = "violation-card";

      const img = document.createElement("img");
      const base64 = v.imageBase64 || v.image || "";
      if (base64 && base64.length > 0) {
        img.src = `data:image/png;base64,${base64}`;
      } else {
        img.style.display = "none";
      }

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
  } catch (err) {
    console.error("❌ خطأ في جلب المخالفات:", err);
    container.innerHTML = "<p>فشل تحميل المخالفات</p>";
  }
}

async function updateStatus(id, type) {
  try {
    if (!ID_TOKEN) return alert("التوكن غير جاهز");
    if (!id) return alert("ID المخالفة فاضي");

    const url = `${API_BASE}/api/violation/${type}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ID_TOKEN}`,
      },
      body: JSON.stringify({ id }),
    });

    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);

    if (!res.ok) {
      alert("فشل: " + text);
      return;
    }

    location.reload();
  } catch (err) {
    console.error("❌ خطأ في تحديث المخالفة:", err);
    alert("صار خطأ بالشبكة");
  }
}
