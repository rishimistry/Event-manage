// ══════════════════════════════════════════════════════════════
//  Waiting for Approval Screen
//  ──────────────────────────────────────────────────────────────
//  Shown to users whose registration request is pending
// ══════════════════════════════════════════════════════════════

import { useAuth } from "./AuthContext";

export default function WaitingApproval() {
  const { registrationRequest, logout } = useAuth();

  if (!registrationRequest) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-primary)", padding: 20 }}>
        <div style={{ textAlign: "center", maxWidth: 500 }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>⏳</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Loading...</h1>
        </div>
      </div>
    );
  }

  const isRejected = registrationRequest.status === "rejected";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-primary)", padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 500 }}>
        {/* Icon */}
        <div style={{ fontSize: 80, marginBottom: 24 }}>
          {isRejected ? "❌" : "⏳"}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: isRejected ? "#E63946" : "var(--text-primary)" }}>
          {isRejected ? "Request Rejected" : "Waiting for Approval"}
        </h1>

        {/* Message */}
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.6 }}>
          {isRejected 
            ? "Your registration request has been rejected by an administrator."
            : "Your registration request is pending approval from an administrator."
          }
        </p>

        {/* Details Card */}
        <div style={{ 
          marginTop: 32, 
          padding: 24, 
          background: "var(--bg-card)", 
          border: "1px solid var(--border-light)", 
          borderRadius: 16,
          textAlign: "left"
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Name</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{registrationRequest.name}</div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Email</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{registrationRequest.email}</div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Requested Role</div>
            <div style={{ 
              display: "inline-block",
              padding: "6px 12px", 
              borderRadius: 12, 
              background: registrationRequest.requestedRole === "manager" ? "rgba(155,114,207,0.2)" : "rgba(78,205,196,0.2)", 
              color: registrationRequest.requestedRole === "manager" ? "#9B72CF" : "#4ECDC4", 
              fontSize: 12, 
              fontWeight: 800,
              textTransform: "uppercase"
            }}>
              {registrationRequest.requestedRole}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Status</div>
            <div style={{ 
              display: "inline-block",
              padding: "6px 12px", 
              borderRadius: 12, 
              background: isRejected ? "rgba(230,57,70,0.2)" : "rgba(255,107,53,0.2)", 
              color: isRejected ? "#E63946" : "#FF6B35", 
              fontSize: 12, 
              fontWeight: 800,
              textTransform: "uppercase"
            }}>
              {registrationRequest.status}
            </div>
          </div>

          {isRejected && registrationRequest.rejectionReason && (
            <div style={{ marginTop: 16, padding: 12, background: "rgba(230,57,70,0.1)", borderRadius: 10, border: "1px solid rgba(230,57,70,0.2)" }}>
              <div style={{ fontSize: 11, color: "#E63946", fontWeight: 700, marginBottom: 4 }}>Reason</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{registrationRequest.rejectionReason}</div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ marginTop: 24, padding: 16, background: "rgba(255,107,53,0.1)", borderRadius: 12, border: "1px solid rgba(255,107,53,0.2)" }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            {isRejected 
              ? "Please contact your administrator for more information or create a new account."
              : "You'll receive an email notification once your request is reviewed. Please check back later or contact your administrator."
            }
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          style={{
            marginTop: 32,
            padding: "14px 32px",
            borderRadius: 12,
            border: "1px solid rgba(230,57,70,0.3)",
            background: "rgba(230,57,70,0.1)",
            color: "#E63946",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(230,57,70,0.2)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(230,57,70,0.1)"}
        >
          🚪 Logout
        </button>

        {/* Footer */}
        <div style={{ marginTop: 40, fontSize: 11, color: "var(--text-muted)" }}>
          EventXpense • Team Expense Hub
        </div>
      </div>
    </div>
  );
}
