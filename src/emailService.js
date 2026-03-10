// ══════════════════════════════════════════════════════════════
//  Email Service (EmailJS Integration)
//  ──────────────────────────────────────────────────────────────
//  Sends emails using EmailJS (works with Firebase free plan)
// ══════════════════════════════════════════════════════════════

import { EMAILJS_CONFIG } from "./firebase";

// Check if EmailJS is configured
const isConfigured = () => {
  return (
    EMAILJS_CONFIG.publicKey !== "YOUR_EMAILJS_PUBLIC_KEY" &&
    EMAILJS_CONFIG.serviceId !== "YOUR_SERVICE_ID"
  );
};

/**
 * Send approval email to user
 */
export async function sendApprovalEmail(userData, approverName) {
  if (!isConfigured()) {
    console.log("📧 EmailJS not configured. Skipping email.");
    console.log("To enable emails, follow setup guide in EMAIL_FREE_PLAN.md");
    return { success: false, reason: "not_configured" };
  }

  try {
    // Dynamically import EmailJS only if configured
    const emailjs = await import("@emailjs/browser");

    const templateParams = {
      user_name: userData.name,
      user_email: userData.email,
      user_role: userData.requestedRole.toUpperCase(),
      approver_name: approverName,
      app_url: EMAILJS_CONFIG.appUrl,
      to_email: userData.email, // EmailJS will use this
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.approvalTemplateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log("✅ Approval email sent:", response.status);
    return { success: true, messageId: response.text };
  } catch (error) {
    console.error("❌ Failed to send approval email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send rejection email to user
 */
export async function sendRejectionEmail(userData, rejectionReason = "") {
  if (!isConfigured()) {
    console.log("📧 EmailJS not configured. Skipping email.");
    return { success: false, reason: "not_configured" };
  }

  try {
    // Dynamically import EmailJS only if configured
    const emailjs = await import("@emailjs/browser");

    const templateParams = {
      user_name: userData.name,
      user_email: userData.email,
      user_role: userData.requestedRole.toUpperCase(),
      rejection_reason: rejectionReason || "No reason provided",
      to_email: userData.email, // EmailJS will use this
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.rejectionTemplateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log("✅ Rejection email sent:", response.status);
    return { success: true, messageId: response.text };
  } catch (error) {
    console.error("❌ Failed to send rejection email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Log email delivery to Firestore
 */
export function logEmailDelivery(type, to, success, error = null) {
  // This will be called from App.jsx after sending email
  return {
    type,
    to,
    success,
    error,
    sentAt: new Date().toISOString(),
  };
}
