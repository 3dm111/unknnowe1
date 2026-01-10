import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// لازم تحط FIREBASE_SERVICE_ACCOUNT_JSON في Render ENV
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).send("Missing token");

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // uid
    next();
  } catch (e) {
    console.error("AUTH ERROR:", e);
    return res.status(401).send("Invalid token");
  }
}

// ✅ جلب المخالفات
app.get("/api/violations", requireAuth, async (req, res) => {
  try {
    const snap = await db.collection("violations").get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) {
    console.error("GET VIOLATIONS ERROR:", e);
    res.status(500).send("Failed to load violations");
  }
});

// ✅ قبول/رفض = نقطة + حذف
app.post("/api/violation/:type", requireAuth, async (req, res) => {
  try {
    const { type } = req.params; // accept | reject
    const { id } = req.body;

    if (!id) return res.status(400).send("Missing violation id");
    if (type !== "accept" && type !== "reject") return res.status(400).send("Invalid type");

    const adminUid = req.user.uid;

    const violationRef = db.collection("violations").doc(id);
    const adminRef = db.collection("users").doc(adminUid);

    await db.runTransaction(async (t) => {
      const vSnap = await t.get(violationRef);
      if (!vSnap.exists) throw new Error("Violation not found");

      const update =
        type === "accept"
          ? { points: admin.firestore.FieldValue.increment(1),
              acceptCount: admin.firestore.FieldValue.increment(1) }
          : { points: admin.firestore.FieldValue.increment(1),
              rejectCount: admin.firestore.FieldValue.increment(1) };

      // ✅ ينشئ ملف المستخدم لو ما كان موجود
      t.set(
        adminRef,
        {
          uid: adminUid,
          email: req.user.email || null,
          ...update,
          lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // ✅ احذف المخالفة
      t.delete(violationRef);
    });

    res.json({ success: true });
  } catch (e) {
    console.error("DECIDE ERROR:", e);
    res.status(500).send(e.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ running on", PORT));
