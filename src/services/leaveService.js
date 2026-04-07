import {
  collection, addDoc, getDocs, query, where,
  orderBy, serverTimestamp, doc, updateDoc,
  arrayUnion, getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { HR_EMAIL } from "../auth/MsalConfig";
import {
  sendHrNotification,
  sendSecondApproverNotification,
  sendHrNotificationFromSecondApprover,
  sendStaffApprovedEmail,
  sendStaffRejectedEmail,
  sendMdAllowanceRequest,
  sendHrAllowanceDecision,
} from "./emailService";

const COLLECTION = "leaveRequests";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function tokenExpiry() {
  const d = new Date();
  d.setHours(d.getHours() + 72);
  return d.toISOString();
}

// ── Core CRUD ─────────────────────────────────────────────────────────────────

export async function submitLeaveRequest(formData, user) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...formData,
    staffEmail:           user.email,
    staffName:            user.name,
    status:               "pending_supervisor",
    currentApproverEmail: formData.supervisorEmail,
    approvalChain:        [],
    // Allowance fields
    allowanceRequested:   formData.requestAllowance || false,
    allowanceStatus:      null,
    submittedAt:          serverTimestamp(),
    updatedAt:            serverTimestamp(),
  });
  return docRef.id;
}

export async function getLeavesByUser(staffEmail) {
  const q = query(
    collection(db, COLLECTION),
    where("staffEmail", "==", staffEmail),
    orderBy("submittedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

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

export async function getAllLeaves() {
  const q = query(collection(db, COLLECTION), orderBy("submittedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Get leave by allowance token (used by public MD review page) ──────────────

export async function getLeaveByAllowanceToken(token) {
  // Search by the single review token
  const q = query(
    collection(db, COLLECTION),
    where("allowanceToken", "==", token)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() };
}

// ── Main approval handler ─────────────────────────────────────────────────────

export async function updateApproval(docId, decision) {
  const {
    approved, by, byEmail, comment, stage,
    requiresFurtherApproval, secondApproverEmail,
    resumptionDate, adjustedDays,
  } = decision;

  const ref  = doc(db, COLLECTION, docId);
  const snap = await getDoc(ref);
  const leave = { id: docId, ...snap.data() };

  const chainEntry = {
    stage, approved, by, byEmail,
    comment: comment || "",
    at: new Date().toISOString(),
  };

  // Determine next status
  let nextStatus;
  let nextApproverEmail;

  if (!approved) {
    nextStatus = "rejected";
    nextApproverEmail = null;
  } else if (stage === "hr") {
    // If allowance was requested → generate tokens and notify MD
    // Otherwise → fully approved
    nextStatus = leave.allowanceRequested ? "approved_pending_allowance" : "approved";
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
    updatedAt:            serverTimestamp(),
  };

  if (stage === "hr" && approved) {
    if (resumptionDate) payload.resumptionDate = resumptionDate;
    if (adjustedDays)   payload.adjustedDays   = adjustedDays;
  }

  // Generate allowance token if needed — single token for review page
  let approveToken;
  if (stage === "hr" && approved && leave.allowanceRequested) {
    approveToken = generateToken();
    payload.allowanceToken       = approveToken;
    payload.allowanceTokenExpiry = tokenExpiry();
    payload.allowanceStatus      = "pending_md";
  }

  await updateDoc(ref, {
    ...payload,
    approvalChain: arrayUnion(chainEntry),
  });

  // Build updated leave object for email functions
  const updatedLeave = { ...leave, ...payload, approvalChain: [...(leave.approvalChain || []), chainEntry] };

  // ── Email notifications ────────────────────────────────────────────────────
  if (approved) {
    if (stage === "hr") {
      // Notify staff — leave approved
      sendStaffApprovedEmail(updatedLeave)
        .catch(err => console.warn("[EmailJS] Staff approved email failed:", err?.text || err));

      // If allowance requested — notify MD with token links
      if (leave.allowanceRequested) {
        sendMdAllowanceRequest(updatedLeave, approveToken)
          .catch(err => console.warn("[EmailJS] MD allowance email failed:", err?.text || err));
      }
    } else if (requiresFurtherApproval && secondApproverEmail) {
      sendSecondApproverNotification(leave, by, secondApproverEmail)
        .catch(err => console.warn("[EmailJS] 2nd approver notification failed:", err?.text || err));
    } else if (stage === "second_approver") {
      sendHrNotificationFromSecondApprover(leave, by)
        .catch(err => console.warn("[EmailJS] HR notification failed:", err?.text || err));
    } else {
      sendHrNotification(leave, by)
        .catch(err => console.warn("[EmailJS] HR notification failed:", err?.text || err));
    }
  } else {
    // Rejected at any stage — notify staff
    sendStaffRejectedEmail(leave)
      .catch(err => console.warn("[EmailJS] Staff rejected email failed:", err?.text || err));
  }
}

// ── MD Allowance Decision (called from public review page) ───────────────────

export async function processMdAllowanceDecision(token, approved) {
  // Find the leave by token
  const leave = await getLeaveByAllowanceToken(token);

  if (!leave) throw new Error("Invalid or expired token.");

  // Check token expiry
  if (leave.allowanceTokenExpiry && new Date() > new Date(leave.allowanceTokenExpiry)) {
    throw new Error("This approval link has expired.");
  }

  // Check token hasn't already been used
  if (leave.allowanceStatus !== "pending_md") {
    throw new Error("This request has already been actioned.");
  }

  const ref = doc(db, COLLECTION, leave.id);
  await updateDoc(ref, {
    // Fix Bug 2 — update main status to "approved" once MD decides
    // regardless of allowance outcome, leave is always fully approved
    status:           "approved",
    allowanceStatus:  approved ? "approved" : "rejected",
    allowanceToken:   null,   // invalidate token after use
    allowanceDecidedAt: serverTimestamp(),
    updatedAt:        serverTimestamp(),
  });

  // Notify HR of MD's decision
  sendHrAllowanceDecision(leave, approved)
    .catch(err => console.warn("[EmailJS] HR allowance decision email failed:", err?.text || err));

  return { approved, staffName: leave.staffName };
}
