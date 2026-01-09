document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("violations");

  if (!container) {
    console.error("❌ عنصر violations غير موجود في الصفحة");
    return;
  }

  fetch("/api/violations")
    .then(res => res.json())
    .then(data => {
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

     img.onload = null;

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
    })
    .catch(err => {
      console.error("❌ خطأ في جلب المخالفات:", err);
      container.innerHTML = "<p>فشل تحميل المخالفات</p>";
    });
});

function updateStatus(id, type) {
  fetch(`/api/violation/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  })
    .then(res => {
      if (!res.ok) throw new Error("فشل التحديث");
      location.reload();
    })
    .catch(err => {
      console.error("❌ خطأ في تحديث المخالفة:", err);
    });
