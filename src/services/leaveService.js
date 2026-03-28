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
} from "firebase/firestore";
import { db } from "./firebase";
import { HR_EMAIL } from "../auth/MsalConfig";

const COLLECTION = "leaveRequests";

/**
 * Submit a new leave request.
 * Initial status is always pending_supervisor — routed to the
 * supervisorEmail the staff specified in the form.
 */
export async function submitLeaveRequest(formData, user) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...formData,
    staffEmail:  user.email,
    staffName:   user.name,
    status:      "pending_supervisor",
    currentApproverEmail: formData.supervisorEmail,
    approvalChain: [],          // will be populated as approvals happen
    submittedAt:  serverTimestamp(),
    updatedAt:    serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get all leave requests for a specific staff member.
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
 * Get requests currently assigned to a specific approver email.
 * Used by both approver and HR views.
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
 * Get ALL leave requests — for admin/reporting use.
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
 * Process an approval decision.
 *
 * For approvers (non-HR):
 *   - requiresFurtherApproval=true  → status becomes pending_second_approver,
 *                                     currentApproverEmail = secondApproverEmail
 *   - requiresFurtherApproval=false → status becomes pending_hr,
 *                                     currentApproverEmail = HR_EMAIL
 *
 * For HR:
 *   - approved=true  → status becomes "approved"
 *   - approved=false → status becomes "rejected"
 *
 * Rejection at any stage → status becomes "rejected" immediately.
 */
export async function updateApproval(docId, decision) {
  const {
    approved,
    by,
    byEmail,
    comment,
    stage,                  // "supervisor" | "second_approver" | "hr"
    requiresFurtherApproval,
    secondApproverEmail,
    resumptionDate,
    adjustedDays,
  } = decision;

  const ref = doc(db, COLLECTION, docId);

  // Build the chain entry for this approval
  const chainEntry = {
    stage,
    approved,
    by,
    byEmail,
    comment: comment || "",
    at: new Date().toISOString(), // client timestamp for chain readability
  };

  // Determine next status and next approver
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

  const payload = {
    status:               nextStatus,
    currentApproverEmail: nextApproverEmail,
    approvalChain:        [], // will use arrayUnion below
    updatedAt:            serverTimestamp(),
  };

  // HR fields
  if (stage === "hr" && approved) {
    if (resumptionDate) payload.resumptionDate = resumptionDate;
    if (adjustedDays)   payload.adjustedDays   = adjustedDays;
  }

  // Use arrayUnion to safely append to the chain
  const { arrayUnion } = await import("firebase/firestore");
  await updateDoc(ref, {
    ...payload,
    approvalChain: arrayUnion(chainEntry),
  });
}
