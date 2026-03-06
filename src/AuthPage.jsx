// ══════════════════════════════════════════════════════════════
//  Auth Page — Login & Register
//  ──────────────────────────────────────────────────────────────
//  Premium dark-themed auth page with role selection
// ══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function AuthPage() {
    const { login, register } = useAuth();
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({
        name: "", email: "", password: "", confirmPassword: "", role: "staff",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPw, setShowPw] = useState(false);

    const set = (key, val) => { setForm((f) => ({ ...f, [key]: val })); if (error) setError(""); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (mode === "login") {
                if (!form.email || !form.password) throw new Error("Please fill in all fields");
                await login(form.email.trim(), form.password);
            } else {
                if (!form.name.trim()) throw new Error("Full name is required");
                if (!form.email.trim()) throw new Error("Email is required");
                if (form.password.length < 6) throw new Error("Password must be at least 6 characters");
                if (form.password !== form.confirmPassword) throw new Error("Passwords do not match");
                await register(form.name.trim(), form.email.trim(), form.password, form.role);
            }
        } catch (err) {
            let m = err.message || "Something went wrong";
            if (m.includes("auth/invalid-credential") || m.includes("auth/user-not-found")) m = "Invalid email or password";
            else if (m.includes("auth/email-already-in-use")) m = "This email is already registered";
            else if (m.includes("auth/weak-password")) m = "Password should be at least 6 characters";
            else if (m.includes("auth/invalid-email")) m = "Please enter a valid email address";
            else if (m.includes("auth/too-many-requests")) m = "Too many attempts. Try again later";
            setError(m);
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (m) => { setMode(m); setError(""); };

    // ── Inline style helpers ──
    const label = {
        fontSize: 11, fontWeight: 700, color: "#888",
        letterSpacing: 1.5, textTransform: "uppercase",
        display: "block", marginBottom: 6,
    };
    const fieldWrap = { marginBottom: 16 };
    const roleBtn = (active, color) => ({
        padding: "16px 12px", borderRadius: 14, cursor: "pointer", textAlign: "center",
        background: active ? `${color}1A` : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
        transition: "all 0.2s", fontFamily: "inherit",
    });

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "#0A0A0F", position: "relative", overflow: "hidden", padding: 20,
        }}>
            {/* Orbs */}
            <div style={{ position: "fixed", top: -120, right: -100, width: 350, height: 350, background: "radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ position: "fixed", bottom: -80, left: -80, width: 300, height: 300, background: "radial-gradient(circle, rgba(155,114,207,0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ position: "fixed", top: "40%", left: "50%", width: 200, height: 200, background: "radial-gradient(circle, rgba(78,205,196,0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none", transform: "translate(-50%,-50%)" }} />

            <div style={{ width: "100%", maxWidth: 440, zIndex: 1, animation: "fadeSlide 0.5s ease" }}>
                {/* Brand */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 20,
                        background: "linear-gradient(135deg, rgba(255,107,53,0.3), rgba(155,114,207,0.3))",
                        border: "1px solid rgba(255,107,53,0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28, margin: "0 auto 16px",
                        animation: "authFloat 3s ease-in-out infinite",
                        backdropFilter: "blur(10px)",
                    }}>💰</div>
                    <div style={{ fontSize: 11, letterSpacing: 4, color: "#FF6B35", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>EventXpense</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#E8E8F0" }}>Team Expense Hub</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
                        {mode === "login" ? "Welcome back! Sign in to continue." : "Create your account to get started."}
                    </div>
                </div>

                {/* Card */}
                <div style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 20, padding: "28px 24px", backdropFilter: "blur(20px)",
                }}>
                    {/* Tabs */}
                    <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
                        {[{ id: "login", label: "🔐 Sign In" }, { id: "register", label: "✨ Create Account" }].map((t) => (
                            <button key={t.id} onClick={() => switchMode(t.id)} style={{
                                flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
                                background: mode === t.id ? "linear-gradient(135deg, rgba(255,107,53,0.25), rgba(230,57,70,0.2))" : "transparent",
                                color: mode === t.id ? "#FF6B35" : "#666",
                                fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all 0.25s",
                                boxShadow: mode === t.id ? "0 2px 12px rgba(255,107,53,0.15)" : "none",
                            }}>{t.label}</button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {mode === "register" && (
                            <div style={{ ...fieldWrap, animation: "fadeSlide 0.3s ease" }}>
                                <label style={label}>Full Name</label>
                                <input type="text" placeholder="e.g. Rahul Sharma" value={form.name}
                                    onChange={(e) => set("name", e.target.value)} className="form-input" autoComplete="name" />
                            </div>
                        )}

                        <div style={fieldWrap}>
                            <label style={label}>Email Address</label>
                            <input type="email" placeholder="you@company.com" value={form.email}
                                onChange={(e) => set("email", e.target.value)} className="form-input" autoComplete="email" />
                        </div>

                        <div style={{ ...fieldWrap, position: "relative" }}>
                            <label style={label}>Password</label>
                            <input type={showPw ? "text" : "password"} placeholder="••••••••" value={form.password}
                                onChange={(e) => set("password", e.target.value)} className="form-input"
                                autoComplete={mode === "login" ? "current-password" : "new-password"} />
                            <button type="button" onClick={() => setShowPw(!showPw)} style={{
                                position: "absolute", right: 12, top: 34, background: "none",
                                border: "none", color: "#666", cursor: "pointer", fontSize: 16, padding: 4,
                            }}>{showPw ? "🙈" : "👁️"}</button>
                        </div>

                        {mode === "register" && (
                            <>
                                <div style={{ ...fieldWrap, animation: "fadeSlide 0.3s ease" }}>
                                    <label style={label}>Confirm Password</label>
                                    <input type="password" placeholder="••••••••" value={form.confirmPassword}
                                        onChange={(e) => set("confirmPassword", e.target.value)} className="form-input" autoComplete="new-password" />
                                </div>

                                <div style={{ marginBottom: 20, animation: "fadeSlide 0.3s ease 0.1s both" }}>
                                    <label style={label}>Select Your Role</label>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                        {[
                                            { id: "manager", icon: "🏢", lbl: "Manager", desc: "Create events & manage team", color: "#9B72CF" },
                                            { id: "staff", icon: "👷", lbl: "Staff", desc: "Log expenses & track spending", color: "#4ECDC4" },
                                        ].map((r) => (
                                            <button key={r.id} type="button" onClick={() => set("role", r.id)} style={roleBtn(form.role === r.id, r.color)}>
                                                <div style={{ fontSize: 28, marginBottom: 6 }}>{r.icon}</div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: form.role === r.id ? r.color : "#aaa", marginBottom: 4 }}>{r.lbl}</div>
                                                <div style={{ fontSize: 10, color: "#555", lineHeight: 1.3 }}>{r.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {error && (
                            <div style={{
                                padding: "10px 14px", borderRadius: 10, marginBottom: 16,
                                background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.3)",
                                color: "#E63946", fontSize: 12, fontWeight: 600, animation: "fadeSlide 0.2s ease",
                                display: "flex", alignItems: "center", gap: 8,
                            }}>⚠️ {error}</div>
                        )}

                        <button type="submit" disabled={loading} style={{
                            width: "100%", padding: 16, borderRadius: 12, border: "none",
                            background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #FF6B35, #E63946)",
                            color: "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                            letterSpacing: 1, fontFamily: "inherit", transition: "all 0.2s",
                            opacity: loading ? 0.7 : 1,
                            boxShadow: loading ? "none" : "0 4px 20px rgba(255,107,53,0.3)",
                        }}>
                            {loading ? "⏳ Please wait..." : mode === "login" ? "🔓 SIGN IN" : "🚀 CREATE ACCOUNT"}
                        </button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#555" }}>
                        {mode === "login" ? (
                            <>Don't have an account?{" "}<span onClick={() => switchMode("register")} style={{ color: "#FF6B35", cursor: "pointer", fontWeight: 700 }}>Create one</span></>
                        ) : (
                            <>Already have an account?{" "}<span onClick={() => switchMode("login")} style={{ color: "#FF6B35", cursor: "pointer", fontWeight: 700 }}>Sign in</span></>
                        )}
                    </div>
                </div>

                <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: "#333" }}>
                    Secured by Firebase Authentication 🔒
                </div>
            </div>

            <style>{`@keyframes authFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
        </div>
    );
}
