import express from "express";
import admin from "firebase-admin";
import { requireAuth } from "./requireAuth.js"; // إذا عندك توكن (مستحسن)

const router = express.Router();
const db = admin.firestore();

/**
 * ✅ قرار المشرف: accept / reject
 * - يزيد عدادات المشرف + score
 * - يسجل العملية في users/{uid}/actions مع رقم actionNo
 * - يحذف المخالفة من violations
 */
async function decideViolation(req, res, decision) {
  try {
    // uid حق المشرف من التوكن
    const staffUid = req.user?.uid;
    if (!staffUid) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.body; // violationId
    if (!id) return res.status(400).json({ error: "Missing id" });

    const staffRef = db.collection("users").doc(staffUid);
    const violationRef = db.collection("violations").doc(id);

    await db.runTransaction(async (tx) => {
      // 1) تأكد من وجود المشرف
      const staffSnap = await tx.get(staffRef);
      if (!staffSnap.exists) throw new Error("Staff user not found");
      const staffData = staffSnap.data() || {};

      // (اختياري للأمان) لازم يكون عنده role
      // إذا ما عندك role للحين، علّق هذا الشرط
      // if (staffData.role !== "staff" && staffData.role !== "admin") {
      //   throw new Error("Not allowed (not staff)");
      // }

      // 2) جيب المخالفة
      const vSnap = await tx.get(violationRef);
      if (!vSnap.exists) throw new Error("Violation not found");
      const vData = vSnap.data() || {};

      // 3) احسب رقم العملية (أول/ثاني/ثالث...)
      const acceptCount = Number(staffData.acceptCount || 0);
      const rejectCount = Number(staffData.rejectCount || 0);
      const nextActionNo = acceptCount + rejectCount + 1;

      // 4) حدّث عدادات المشرف
      const update =
        decision === "accept"
          ? {
              acceptCount: admin.firestore.FieldValue.increment(1),
              score: admin.firestore.FieldValue.increment(1),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          : {
              rejectCount: admin.firestore.FieldValue.increment(1),
              score: admin.firestore.FieldValue.increment(1),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

      tx.set(staffRef, update, { merge: true });

      // 5) سجل العملية في actions (مع رقم actionNo)
      const actionRef = staffRef.collection("actions").doc();
      tx.set(actionRef, {
        actionNo: nextActionNo,          // ✅ هذا اللي يخليها أول/ثاني/ثالث
        violationId: id,
        action: decision,               // accept / reject
        at: admin.firestore.FieldValue.serverTimestamp(),
        snapshot: vData,                // لقطة من بيانات المخالفة قبل الحذف
      });

      // 6) احذف المخالفة من الانتظار
      tx.delete(violationRef);
    });

    return res.json({ ok: true, decision });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}

// نفس روابط الفرونت عندك 👇
router.post("/api/violation/accept", requireAuth, (req, res) =>
  decideViolation(req, res, "accept")
);

router.post("/api/violation/reject", requireAuth, (req, res) =>
  decideViolation(req, res, "reject")
);

export default router;
