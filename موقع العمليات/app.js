import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// ===============================
// إعدادات أساسية
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json({ limit: "20mb" }));
app.use(express.static(__dirname)); // يسمح بعرض HTML/CSS/JS

// ===============================
// تخزين مؤقت (بدون قاعدة بيانات)
// ===============================
let violations = [];

// ===============================
// Unity ➜ إرسال مخالفة
// ===============================
app.post("/api/violation/send", (req, res) => {
  const { playerId, violation, imageBase64 } = req.body;

  if (!playerId || !violation) {
    return res.status(400).json({ success: false });
  }

  violations.push({
    id: Date.now(),
    playerId,
    violation,
    imageBase64,
    status: "pending"
  });

  console.log("🚨 مخالفة جديدة:", violation);
  res.json({ success: true });
});

// ===============================
// جلب جميع المخالفات للموقع
// ===============================
app.get("/api/violations", (req, res) => {
  res.json(violations);
});

// ===============================
// قبول مخالفة
// ===============================
app.post("/api/violation/accept", (req, res) => {
  const { id } = req.body;

  const v = violations.find(x => x.id === id);
  if (v) v.status = "accepted";

  res.json({ result: "accepted", points: 5 });
});

// ===============================
// رفض مخالفة
// ===============================
app.post("/api/violation/reject", (req, res) => {
  const { id } = req.body;

  const v = violations.find(x => x.id === id);
  if (v) v.status = "rejected";

  res.json({ result: "rejected", points: -5 });
});

// ===============================
// صفحات الموقع
// ===============================
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.get("/violations", (req, res) => {
  res.sendFile(path.join(__dirname, "violations.html"));
});

// ===============================
// تشغيل السيرفر
// ===============================
app.listen(PORT, () => {
  console.log(`✅ Server running:
http://192.168.100.8:${PORT}/dashboard
http://192.168.100.8:${PORT}/violations`);
});
