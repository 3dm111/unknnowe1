document.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("violations");
  const backBtn = document.getElementById("backBtn");

  /* زر الرجوع */
  backBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });

  /* تحميل المخالفات */
  async function loadViolations() {
    try {
      const res = await fetch("/api/violations");
      const data = await res.json();

      container.innerHTML = "";

      data.forEach(v => {
        const card = document.createElement("div");
        card.className = "violation-card";

        card.innerHTML = `
          <img src="data:image/png;base64,${v.imageBase64}" />
          <h3>${v.violation}</h3>

          <div class="actions">
            <button class="accept">قبول</button>
            <button class="reject">رفض</button>
          </div>
        `;

        card.querySelector(".accept").onclick = () =>
          handleDecision(v.id, "accept");

        card.querySelector(".reject").onclick = () =>
          handleDecision(v.id, "reject");

        container.appendChild(card);
      });

    } catch (err) {
      console.error("فشل تحميل المخالفات", err);
      container.innerHTML = "<p>تعذر تحميل المخالفات</p>";
    }
  }

  async function handleDecision(id, type) {
    await fetch(`/api/violation/${type}/${id}`, {
      method: "POST"
    });
    loadViolations();
  }

  loadViolations();
});
