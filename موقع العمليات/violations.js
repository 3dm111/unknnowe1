const container = document.getElementById("violations");

async function loadViolations() {
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
}

async function handleDecision(id, type) {
  await fetch(`/api/violation/${type}/${id}`, {
    method: "POST"
  });

  loadViolations(); // تحديث القائمة
}

loadViolations();
