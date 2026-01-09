import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ✅ CORS + OPTIONS */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ✅ Body parsing */
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

/* ✅ Static site */
app.use(express.static(__dirname));

/* ✅ Storage (RAM) */
let violations = [];

/* إرسال مخالفة */
app.post("/api/violation/send", (req, res) => {
  const { playerId, violation, imageBase64 } = req.body;

  if (!playerId || !violation) {
    return res.status(400).json({ success: false, message: "بيانات ناقصة" });
  }

  const item = {
    id: Date.now(),
    playerId,
    violation,
    imageBase64: imageBase64 || "",
    status: "pending",
    createdAt: new Date()
  };

  violations.push(item);

  console.log("🚨 SEND =>", { id: item.id, playerId, violation, imgLen: item.imageBase64.length });
  res.json({ success: true, id: item.id });
});

/* جلب المخالفات */
app.get("/api/violations", (req, res) => {
  res.json(violations);
});

/* ✅ قبول */
app.post("/api/violation/accept", (req, res) => {
  const id = Number(req.body.id);

  console.log("✅ ACCEPT req =>", { id, type: typeof req.body.id, total: violations.length });

  const v = violations.find(x => x.id === id);
  if (!v) {
    console.log("❌ ACCEPT not found =>", id);
    return res.status(404).json({ success: false, message: "مخالفة غير موجودة" });
  }

  v.status = "accepted";
  console.log("✅ ACCEPT ok =>", { id: v.id, status: v.status });

  res.json({ success: true, result: "accepted", points: 5 });
});

/* ✅ رفض */
app.post("/api/violation/reject", (req, res) => {
  const id = Number(req.body.id);

  console.log("⛔ REJECT req =>", { id, type: typeof req.body.id, total: violations.length });

  const v = violations.find(x => x.id === id);
  if (!v) {
    console.log("❌ REJECT not found =>", id);
    return res.status(404).json({ success: false, message: "مخالفة غير موجودة" });
  }

  v.status = "rejected";
  console.log("⛔ REJECT ok =>", { id: v.id, status: v.status });

  res.json({ success: true, result: "rejected", points: -5 });
});

/* صفحات */
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.get("/violations", (req, res) => {
  res.sendFile(path.join(__dirname, "violations.html"));
});

app.listen(PORT, () => {
  console.log("✅ Server running");
  console.log("🌍 PORT:", PORT);
});
