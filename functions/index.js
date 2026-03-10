// ══════════════════════════════════════════════════════════════
//  Firebase Cloud Functions for EventXpense
//  ──────────────────────────────────────────────────────────────
//  Handles email notifications for registration approvals
// ══════════════════════════════════════════════════════════════

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// ══════════════════════════════════════════════════════════════
//  EMAIL CONFIGURATION
// ══════════════════════════════════════════════════════════════

// Configure your email service here
// Option 1: Gmail (requires App Password)
// Option 2: SendGrid, Mailgun, AWS SES, etc.

const transporter = nodemailer.createTransport({
  service: "gmail", // Change to your email service
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER,
    pass: functions.config().email?.password || process.env.EMAIL_PASSWORD,
  },
});

// Fallback: If no email config, log to console
const sendEmail = async (to, subject, html) => {
  try {
    if (!functions.config().email?.user && !process.env.EMAIL_USER) {
      console.log("⚠️ Email not configured. Would send email:");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html}`);
      return { success: true, mode: "console" };
    }

    const mailOptions = {
      from: `EventXpense <${functions.config().email?.user || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email send error:", error);
    return { success: false, error: error.message };
  }
};

// ══════════════════════════════════════════════════════════════
//  TRIGGER: Registration Request Approved
// ══════════════════════════════════════════════════════════════

exports.onRegistrationApproved = functions.firestore
  .document("registrationRequests/{requestId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger when status changes from pending to approved
    if (before.status !== "approved" && after.status === "approved") {
      const { name, email, requestedRole, approvedBy } = after;

      // Get approver details
      let approverName = "Administrator";
      try {
        const approverDoc = await admin.firestore().collection("users").doc(approvedBy).get();
        if (approverDoc.exists) {
          approverName = approverDoc.data().name || "Administrator";
        }
      } catch (err) {
        console.error("Error fetching approver:", err);
      }

      // Email subject
      const subject = "🎉 Your EventXpense Account Has Been Approved!";

      // Email HTML body
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0A0A0F; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0F; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">Account Approved!</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0; margin: 0 0 20px 0;">
                Hi <strong style="color: #FF6B35;">${name}</strong>,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0; margin: 0 0 20px 0;">
                Great news! Your registration request for <strong style="color: #4ECDC4;">${requestedRole.toUpperCase()}</strong> access has been approved by ${approverName}.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0; margin: 0 0 30px 0;">
                You can now log in to EventXpense and start managing event expenses with your team.
              </p>
              
              <!-- Account Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Email</td>
                        <td style="font-size: 14px; color: #e0e0e0; font-weight: 600; text-align: right;">${email}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);">Role</td>
                        <td style="font-size: 14px; color: #4ECDC4; font-weight: 700; text-align: right; text-transform: uppercase; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);">${requestedRole}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);">Approved By</td>
                        <td style="font-size: 14px; color: #e0e0e0; font-weight: 600; text-align: right; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);">${approverName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <a href="https://your-app-url.web.app" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #4ECDC4 0%, #457B9D 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 12px rgba(78,205,196,0.3);">
                      Login to EventXpense →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; line-height: 1.6; color: #888; margin: 0;">
                If you have any questions or need assistance, please contact your administrator.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: rgba(255,255,255,0.02); padding: 24px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="margin: 0; font-size: 12px; color: #666;">
                EventXpense • Team Expense Hub
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #555;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      // Send email
      const result = await sendEmail(email, subject, html);

      // Log result to Firestore
      await admin.firestore().collection("emailLogs").add({
        to: email,
        subject,
        type: "registration_approved",
        requestId: context.params.requestId,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        success: result.success,
        error: result.error || null,
      });

      console.log(`📧 Approval email sent to ${email} (${result.success ? "success" : "failed"})`);
    }
  });

// ══════════════════════════════════════════════════════════════
//  TRIGGER: Registration Request Rejected
// ══════════════════════════════════════════════════════════════

exports.onRegistrationRejected = functions.firestore
  .document("registrationRequests/{requestId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger when status changes from pending to rejected
    if (before.status !== "rejected" && after.status === "rejected") {
      const { name, email, requestedRole, rejectionReason } = after;

      // Email subject
      const subject = "EventXpense Registration Request Update";

      // Email HTML body
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0A0A0F; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0F; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #E63946 0%, #C1121F 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">Registration Update</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0; margin: 0 0 20px 0;">
                Hi <strong style="color: #FF6B35;">${name}</strong>,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0; margin: 0 0 20px 0;">
                We regret to inform you that your registration request for <strong>${requestedRole.toUpperCase()}</strong> access has not been approved at this time.
              </p>
              
              ${rejectionReason ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(230,57,70,0.1); border-radius: 12px; border: 1px solid rgba(230,57,70,0.2); margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #E63946; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Reason</p>
                    <p style="margin: 0; font-size: 14px; color: #e0e0e0; line-height: 1.6;">${rejectionReason}</p>
                  </td>
                </tr>
              </table>
              ` : ""}
              
              <p style="font-size: 14px; line-height: 1.6; color: #888; margin: 0;">
                If you believe this is an error or would like to discuss this decision, please contact your administrator for more information.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: rgba(255,255,255,0.02); padding: 24px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="margin: 0; font-size: 12px; color: #666;">
                EventXpense • Team Expense Hub
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #555;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      // Send email
      const result = await sendEmail(email, subject, html);

      // Log result to Firestore
      await admin.firestore().collection("emailLogs").add({
        to: email,
        subject,
        type: "registration_rejected",
        requestId: context.params.requestId,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        success: result.success,
        error: result.error || null,
      });

      console.log(`📧 Rejection email sent to ${email} (${result.success ? "success" : "failed"})`);
    }
  });
