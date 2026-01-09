document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("violations");
  if (!container) {
    console.error("❌ عنصر violations غير موجود في الصفحة");
    return;
  }

  loadViolations(container);
});

async function loadViolations(container) {
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
      card.dataset.id = v.id;

      const img = document.createElement("img");
      if (v.imageBase64 && v.imageBase64.length > 0) {
        img.src = `data:image/png;base64,${v.imageBase64}`;
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
    // إذا تستخدم Firebase Auth في الصفحة:
    const user = window.auth?.currentUser; // حسب اسم auth عندك
    const token = user ? await user.getIdToken() : null;

    const res = await fetch(`/api/violation/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ id })
    });

    if (!res.ok) throw new Error("فشل التحديث");

    // احذف البطاقة بدون ريفرش
    const card = document.querySelector(`.violation-card[data-id="${id}"]`);
    if (card) card.remove();
  } catch (err) {
    console.error("❌ خطأ في تحديث المخالفة:", err);
  }
}
