import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { HR_EMAIL } from "../auth/MsalConfig";
import {
  sendHrNotification,
  sendSecondApproverNotification,
  sendHrNotificationFromSecondApprover,
} from "./emailService";

const COLLECTION = "leaveRequests";

/**
 * Submit a new leave request
 */
export async function submitLeaveRequest(formData, user) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...formData,
    staffEmail:           user.email,
    staffName:            user.name,
    status:               "pending_supervisor",
    currentApproverEmail: formData.supervisorEmail,
    approvalChain:        [],
    submittedAt:          serverTimestamp(),
    updatedAt:            serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get all leave requests for a specific staff member
 */
export async function getLeavesByUser(staffEmail) {
  const q = query(
    collection(db, COLLECTION),
    where("staffEmail", "==", staffEmail),
    orderBy("submittedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Get requests currently assigned to a specific approver email
 */
export async function getLeavesByApprover(approverEmail) {
  const q = query(
    collection(db, COLLECTION),
    where("currentApproverEmail", "==", approverEmail),
    where("status", "in", ["pending_supervisor", "pending_second_approver", "pending_hr"]),
    orderBy("submittedAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Get ALL leave requests — admin use
 */
export async function getAllLeaves() {
  const q = query(
    collection(db, COLLECTION),
    orderBy("submittedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Process an approval decision and send the appropriate email notification
 */
export async function updateApproval(docId, decision) {
  const {
    approved,
    by,
    byEmail,
    comment,
    stage,
    requiresFurtherApproval,
    secondApproverEmail,
    resumptionDate,
    adjustedDays,
  } = decision;

  // Fetch the leave document to get form data for emails
  const ref = doc(db, COLLECTION, docId);
  const snap = await getDoc(ref);
  const leave = { id: docId, ...snap.data() };

  // Build chain entry
  const chainEntry = {
    stage,
    approved,
    by,
    byEmail,
    comment: comment || "",
    at: new Date().toISOString(),
  };

  // Determine next status and approver
  let nextStatus;
  let nextApproverEmail;

  if (!approved) {
    nextStatus = "rejected";
    nextApproverEmail = null;
  } else if (stage === "hr") {
    nextStatus = "approved";
    nextApproverEmail = null;
  } else if (requiresFurtherApproval && secondApproverEmail) {
    nextStatus = "pending_second_approver";
    nextApproverEmail = secondApproverEmail;
  } else {
    nextStatus = "pending_hr";
    nextApproverEmail = HR_EMAIL;
  }

  // Build Firestore payload
  const payload = {
    status:               nextStatus,
    currentApproverEmail: nextApproverEmail,
    updatedAt:            serverTimestamp(),
  };

  // HR fields saved on final approval
  if (stage === "hr" && approved) {
    if (resumptionDate) payload.resumptionDate = resumptionDate;
    if (adjustedDays)   payload.adjustedDays   = adjustedDays;
  }

  // Write to Firestore
  await updateDoc(ref, {
    ...payload,
    approvalChain: arrayUnion(chainEntry),
  });

  // ── Send email notifications (non-blocking) ────────────────────────────
  if (approved) {
    if (stage === "hr") {
      // HR final approval — Template B (staff notification) comes later
      // For now just log — will be wired when Template B is set up
      console.info("[Email] HR approved — staff notification pending Template B setup");
    } else if (requiresFurtherApproval && secondApproverEmail) {
      // Forward to second approver
      sendSecondApproverNotification(leave, by, secondApproverEmail)
        .catch(err => console.warn("[EmailJS] 2nd approver notification failed:", err?.text || err));
    } else if (stage === "second_approver") {
      // Second approver approved — notify HR
      sendHrNotificationFromSecondApprover(leave, by)
        .catch(err => console.warn("[EmailJS] HR notification failed:", err?.text || err));
    } else {
      // First approver approved, no forward — notify HR
      sendHrNotification(leave, by)
        .catch(err => console.warn("[EmailJS] HR notification failed:", err?.text || err));
    }
  } else {
    // Rejected at any stage — Template B (staff notification) comes later
    console.info("[Email] Rejected — staff notification pending Template B setup");
  }
}