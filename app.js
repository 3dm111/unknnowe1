import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// ✅ CORS + OPTIONS
// ===============================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ===============================
// ✅ Body parsing
// ===============================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===============================
// ✅ Static site
// ===============================
app.use(express.static(__dirname));

// ===============================
// ✅ Firebase Admin Init
// ===============================
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_JSON env var");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ===============================
// ✅ Auth Middleware (Bearer Token)
// ===============================
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ success: false, message: "Missing token" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // { uid, email, ... }
    next();
  } catch (e) {
    console.error("AUTH ERROR:", e);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// ===============================
// ✅ إرسال مخالفة (Unity/Web) -> Firestore
// ===============================
app.post("/api/violation/send", async (req, res) => {
  try {
    const { playerId, violation, imageBase64 } = req.body;

    if (!playerId || !violation) {
      return res.status(400).json({ success: false, message: "بيانات ناقصة" });
    }

    const docRef = await db.collection("violations").add({
      playerId,
      violation,
      imageBase64: imageBase64 || "",
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("🚨 SEND =>", {
      id: docRef.id,
      playerId,
      violation,
      imgLen: (imageBase64 || "").length,
    });

    res.json({ success: true, id: docRef.id });
  } catch (e) {
    console.error("SEND ERROR:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ===============================
// ✅ جلب المخالفات (لازم مشرف مسجل دخول)
// ===============================
app.get("/api/violations", requireAuth, async (req, res) => {
  try {
    const snap = await db
      .collection("violations")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();

    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    console.error("GET VIOLATIONS ERROR:", e);
    res.status(500).json({ success: false, message: "Failed to load violations" });
  }
});

// ===============================
// ✅ قبول/رفض = نقطة + حذف المخالفة
// تحديث النقاط في admins/{uid} بنفس حقول موقعك: accept/reject/points
// ===============================
app.post("/api/violation/:type", requireAuth, async (req, res) => {
  try {
    const { type } = req.params; // accept | reject
    const { id } = req.body;

    if (!id) return res.status(400).json({ success: false, message: "Missing violation id" });
    if (type !== "accept" && type !== "reject") {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    const adminUid = req.user.uid;

    const violationRef = db.collection("violations").doc(String(id));
    const adminRef = db.collection("admins").doc(adminUid);

    await db.runTransaction(async (t) => {
      const vSnap = await t.get(violationRef);
      if (!vSnap.exists) throw new Error("مخالفة غير موجودة");

      // ✅ ضمان وجود وثيقة الأدمن
      t.set(adminRef, { accept: 0, reject: 0, points: 0 }, { merge: true });

      // ✅ قرار: قبول أو رفض (كلهم +1 نقطة حسب كلامك)
      if (type === "accept") {
        t.set(
          adminRef,
          {
            accept: admin.firestore.FieldValue.increment(1),
            points: admin.firestore.FieldValue.increment(1),
            lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        t.set(
          adminRef,
          {
            reject: admin.firestore.FieldValue.increment(1),
            points: admin.firestore.FieldValue.increment(1),
            lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      // ✅ حذف المخالفة بعد احتساب النقطة
      t.delete(violationRef);
    });

    res.json({ success: true, result: type });
  } catch (e) {
    console.error("DECIDE ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===============================
// صفحات
// ===============================
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
