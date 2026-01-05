import { getAuth } 
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { getFirestore, doc, getDoc }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

const emailEl = document.getElementById("email");
const acceptEl = document.getElementById("accept");
const rejectEl = document.getElementById("reject");
const pointsEl = document.getElementById("points");

auth.onAuthStateChanged(async user => {
  if (!user) return;

  emailEl.textContent = user.email;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const d = snap.data();
    acceptEl.textContent = d.acceptCount || 0;
    rejectEl.textContent = d.rejectCount || 0;
    pointsEl.textContent = d.points || 0;
  }
});

window.goBack = () => {
  window.location.href = "dashboard.html";
};
