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
// ✅ Body parsing (لا ترفعها 5000mb)
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

    if (!token) {
      return res.status(401).json({ success: false, message: "Missing token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    console.error("AUTH ERROR:", e);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// ===============================
// ✅ Health endpoint (Ping خفيف)
// ===============================
app.get("/api/health", (req, res) => res.status(200).send("OK"));

// ===============================
// ✅ Debug endpoint: يوريك بياناتك في users (للأدمن فقط)
// ===============================
app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();

    res.json({
      uid,
      emailFromToken: req.user.email || null,
      usersDocExists: snap.exists,
      usersDocData: snap.exists ? snap.data() : null,
    });
  } catch (e) {
    console.error("ME ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===============================
// ✅ إرسال مخالفة -> Firestore (بدون Auth عشان Unity يشتغل)
// body: { playerId, violation, imageBase64? }
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

    console.log("🚨 SEND =>", { id: docRef.id, playerId, violation });
    res.json({ success: true, id: docRef.id });
  } catch (e) {
    console.error("SEND ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===============================
// ✅ Batch send (بدون Auth)
// body: { items: [{playerId, violation, imageBase64?, clientTimeMs?}, ...] }
// ===============================
app.post("/api/violation/send-batch", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "items required" });
    }

    const batch = db.batch();
    const col = db.collection("violations");

    items.slice(0, 20).forEach((it) => {
      const ref = col.doc();
      batch.set(ref, {
        playerId: it.playerId || "UNKNOWN",
        violation: it.violation || "UNKNOWN",
        imageBase64: it.imageBase64 || "",
        status: "pending",
        clientTimeMs: it.clientTimeMs || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    res.json({ success: true, count: Math.min(items.length, 20) });
  } catch (e) {
    console.error("BATCH SEND ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===============================
// ✅ جلب المخالفات (للأدمن فقط)
// ===============================
app.get("/api/violations", requireAuth, async (req, res) => {
  try {
    const snap = await db
      .collection("violations")
      .where("status", "==", "pending")
      .get();

    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    console.error("GET VIOLATIONS ERROR:", e);
    res.status(500).json({ success: false, message: "Failed to load violations" });
  }
});

// ===============================
// ✅ قبول/رفض (للأدمن) + عدادات صحيحة
// ===============================
app.post("/api/violation/:type", requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { id } = req.body;

    if (!id) return res.status(400).json({ success: false, message: "Missing violation id" });
    if (type !== "accept" && type !== "reject") {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    const uid = req.user.uid;
    const email = req.user.email || null;

    const violationRef = db.collection("violations").doc(String(id));
    const userRef = db.collection("users").doc(uid);

    await db.runTransaction(async (t) => {
      const vSnap = await t.get(violationRef);
      if (!vSnap.exists) throw new Error("مخالفة غير موجودة");

      const uSnap = await t.get(userRef);

      if (!uSnap.exists) {
        t.set(userRef, { email, acceptCount: 0, rejectCount: 0, points: 0 }, { merge: true });
      } else {
        t.set(userRef, { email }, { merge: true });
      }

      const inc =
        type === "accept"
          ? { acceptCount: admin.firestore.FieldValue.increment(1) }
          : { rejectCount: admin.firestore.FieldValue.increment(1) };

      const pointsInc =
        type === "accept"
          ? admin.firestore.FieldValue.increment(1)
          : admin.firestore.FieldValue.increment(0);

      t.set(
        userRef,
        {
          ...inc,
          points: pointsInc,
          lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      t.delete(violationRef);
    });

    res.json({ success: true, result: type });
  } catch (e) {
    console.error("DECIDE ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// صفحات
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
