import { useState, useEffect, useRef } from "react";
import "./App.css";
import { useAuth } from "./AuthContext";
import AuthPage from "./AuthPage";
import {
  subscribeToEvents,
  subscribeToExpenses,
  subscribeToStaff,
  subscribeToUsers,
  updateUserRole as dbUpdateUserRole,
  addEvent as dbAddEvent,
  addExpense as dbAddExpense,
  addStaffMember as dbAddStaff,
  deleteExpense as dbDeleteExpense,
  seedInitialData,
} from "./db";

const CATEGORIES = [
  { id: "travel", label: "Travel", icon: "flight-takeoff-line.svg", color: "#FF6B35" },
  { id: "food", label: "Food & Stay", icon: "restaurant-line.svg", color: "#F7C59F" },
  { id: "decor", label: "Decor", icon: "decor.svg", color: "#A8DADC" },
  { id: "labour", label: "Labour", icon: "stack-overflow-line.svg", color: "#457B9D" },
  { id: "equipment", label: "Equipment", icon: "file-chart-line.svg", color: "#E63946" },
  { id: "misc", label: "Misc", icon: "menu-line.svg", color: "#9B72CF" },
];

const PAYMENT_MODES = [
  { id: "cash", label: "Cash", icon: "cash-line.svg", color: "#4ECDC4" },
  { id: "upi", label: "UPI", icon: "upi-icon.svg", color: "#FF6B35" },
  { id: "card", label: "Card", icon: "bank-card-2-line.svg", color: "#9B72CF" },
  { id: "bank", label: "Bank Transfer", icon: "bank-card-2-line.svg", color: "#457B9D" },
  { id: "wallet", label: "Wallet", icon: "wallet-line.svg", color: "#F7C59F" },
  { id: "cheque", label: "Cheque", icon: "coupon-4-line.svg", color: "#A8DADC" },
];

function formatINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

/* ── Icon Helper — renders SVG files or emoji text ───────────────── */
function Icon({ src, size = 20, color, style = {} }) {
  if (!src) return null;
  const isSvg = typeof src === "string" && src.endsWith(".svg");
  if (isSvg) {
    return (
      <img
        src={`/${src}`}
        alt=""
        style={{
          width: size, height: size, objectFit: "contain",
          filter: "brightness(0) invert(1)",
          ...style,
        }}
      />
    );
  }
  return <span style={{ fontSize: size, lineHeight: 1, ...style }}>{src}</span>;
}

/* ── Animated Number ─────────────────────────────────────────────── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    prevRef.current = value;
    if (start === end) return;
    const startTime = performance.now();
    let raf;
    const animate = (now) => {
      const p = Math.min((now - startTime) / 600, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * e));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{formatINR(display)}</>;
}

/* ── Styled Select ───────────────────────────────────────────────── */
function StyledSelect({ value, onChange, children, style = {} }) {
  return (
    <div style={{ position: "relative", ...style }}>
      <select value={value} onChange={onChange} className="form-input" style={{
        padding: "12px 36px 12px 14px",
        appearance: "none", WebkitAppearance: "none", cursor: "pointer",
        fontSize: 13,
      }}>
        {children}
      </select>
      <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#888", fontSize: 11 }}>▼</div>
    </div>
  );
}

/* ── Expense Row ─────────────────────────────────────────────────── */
function ExpenseRow({ exp, index, onDelete }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORIES.find(c => c.id === exp.category);
  const pay = PAYMENT_MODES.find(p => p.id === exp.payMode);
  return (
    <div className="expense-row" style={{
      border: `1px solid ${open ? cat?.color + "55" : "rgba(255,255,255,0.06)"}`,
      background: open ? `${cat?.color}0D` : "rgba(255,255,255,0.04)",
      animation: `fadeSlide 0.3s ease ${index * 0.04}s both`,
    }}>
      <div className="expense-row__header" onClick={() => setOpen(o => !o)}>
        <div className="expense-row__icon" style={{ background: `${cat?.color}22` }}><Icon src={cat?.icon} size={18} color={cat?.color} /></div>
        <div className="expense-row__body">
          <div className="expense-row__desc">{exp.desc}</div>
          <div className="expense-row__meta">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 8, background: `${pay?.color}22`, color: pay?.color, fontSize: 9, fontWeight: 800 }}><Icon src={pay?.icon} size={12} color={pay?.color} /> {pay?.label}</span>
            <span style={{ fontSize: 10, color: "#555" }}>· {exp.addedBy} · {exp.date}</span>
          </div>
        </div>
        <div className="expense-row__actions">
          <div style={{ fontSize: 15, fontWeight: 900, color: cat?.color }}>{formatINR(exp.amount)}</div>
          <div style={{ fontSize: 10, color: "#555", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}>▼</div>
        </div>
      </div>
      <div style={{ maxHeight: open ? 320 : 0, overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px" }}>
          <div className="expense-row__detail-grid">
            {[
              { label: "Category", value: cat?.label, icon: cat?.icon, color: cat?.color },
              { label: "Payment", value: pay?.label, icon: pay?.icon, color: pay?.color },
              { label: "Amount", value: formatINR(exp.amount), color: "#fff" },
              { label: "Date", value: exp.date, color: "#aaa" },
              { label: "Logged By", value: exp.addedBy, color: "#aaa" },
            ].map(item => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 9, color: "#555", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, display: "flex", alignItems: "center", gap: 4 }}>{item.icon && <Icon src={item.icon} size={14} color={item.color} />}{item.value}</div>
              </div>
            ))}
          </div>
          {exp.note && (
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#555", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>📝 Note</div>
              <div style={{ fontSize: 12, color: "#bbb" }}>{exp.note}</div>
            </div>
          )}
          <div className="expense-row__btn-row">
            <button style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(255,107,53,0.12)", color: "#FF6B35", fontSize: 11, fontWeight: 700 }}>✏️ Edit</button>
            <button onClick={e => { e.stopPropagation(); onDelete(exp.id); }} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(230,57,70,0.12)", color: "#E63946", fontSize: 11, fontWeight: 700 }}>🗑️ Delete</button>
            <button style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(78,205,196,0.12)", color: "#4ECDC4", fontSize: 11, fontWeight: 700 }}>📤 Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Loading Spinner ─────────────────────────────────────────────── */
function LoadingScreen({ error }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#0A0A0F",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 500, gap: 16,
    }}>
      {!error ? (
        <>
          <div style={{
            width: 48, height: 48, border: "3px solid rgba(255,255,255,0.1)",
            borderTop: "3px solid #FF6B35", borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <div style={{ color: "#888", fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
            Connecting to database...
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ color: "#E63946", fontSize: 15, fontWeight: 700 }}>
            Firebase Connection Error
          </div>
          <div style={{ color: "#888", fontSize: 12, maxWidth: 320, textAlign: "center" }}>
            {error}
          </div>
          <div style={{ color: "#555", fontSize: 11, marginTop: 8 }}>
            Check your Firebase config in <code style={{ color: "#FF6B35" }}>src/firebase.js</code>
          </div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
     MAIN APP COMPONENT — Powered by Firebase Firestore
   ══════════════════════════════════════════════════════════════════ */
export default function EventXpense() {
  // ── Auth ──
  const { user, userProfile, loading: authLoading, logout, isAdmin, canManageEvents, canManageUsers } = useAuth();

  // ── Firebase-synced state ──
  const [events, setEvents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const loadedCount = useRef(0);
  const seedAttempted = useRef(false);

  // ── UI state ──
  const [activeEvent, setActiveEvent] = useState(null);
  const [view, setView] = useState("dashboard");
  const [filter, setFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ category: "travel", payMode: "upi", desc: "", amount: "", addedBy: "", note: "" });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventForm, setEventForm] = useState({ name: "", location: "", budget: "", date: "" });
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [reportEvent, setReportEvent] = useState(null);

  const toastTimer = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // Helper: mark one subscription as loaded, stop loading when all 3 are done
  const markLoaded = () => {
    loadedCount.current += 1;
    if (loadedCount.current >= 3) {
      setLoading(false);
    }
  };

  // Helper: handle subscription error — stop loading immediately
  const handleSubError = (error) => {
    console.error("Firebase subscription error:", error);
    setDbError(error.message || "Connection failed");
    setLoading(false);
  };

  // ══════════════════════════════════════════════════════════════
  //  REAL-TIME FIRESTORE SUBSCRIPTIONS
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    // Timeout fallback — never stay on loading screen forever
    const timeout = setTimeout(() => {
      if (loadedCount.current < 3) {
        console.warn("Firebase loading timed out after 8s — showing app anyway");
        setLoading(false);
      }
    }, 8000);

    const unsubEvents = subscribeToEvents((data) => {
      setEvents(data);
      markLoaded();
    }, handleSubError);

    const unsubExpenses = subscribeToExpenses((data) => {
      setExpenses(data);
      markLoaded();
    }, handleSubError);

    const unsubStaff = subscribeToStaff((data) => {
      setStaff(data);
      markLoaded();
    }, handleSubError);

    // Admin: subscribe to all user profiles
    let unsubUsers = () => { };
    if (canManageUsers) {
      unsubUsers = subscribeToUsers((data) => setAllUsers(data), handleSubError);
    }

    return () => {
      clearTimeout(timeout);
      unsubEvents();
      unsubExpenses();
      unsubStaff();
      unsubUsers();
    };
  }, [user, canManageUsers]);

  // ── Seed initial data if DB is empty (runs once after loading stops) ──
  useEffect(() => {
    if (loading || seedAttempted.current) return;
    seedAttempted.current = true;

    const tryToSeed = async () => {
      try {
        const seeded = await seedInitialData(events, expenses, staff);
        if (seeded) {
          showToast("Sample data loaded! 🎉");
        }
      } catch (err) {
        console.error("Seed error:", err);
      }
    };
    tryToSeed();
  }, [loading]);

  // ── Auto-select first event when events load ──
  useEffect(() => {
    if (events.length > 0 && !activeEvent) {
      setActiveEvent(events[0].id);
    }
    if (events.length > 0 && !reportEvent) {
      setReportEvent(events[0].id);
    }
  }, [events]);

  // ── Auth gating ──
  if (authLoading) return <LoadingScreen />;
  if (!user) return <AuthPage />;

  // ── Show loading screen while connecting ──
  if (loading) {
    return <LoadingScreen error={dbError} />;
  }

  // ── Derived data ──
  const handleEventSwitch = (id) => { setActiveEvent(id); setFilter("all"); setPayFilter("all"); };

  const currentEvent = events.find(e => e.id === activeEvent) || events[0] || { name: "No Events", location: "", budget: 1, date: "" };
  const eventExpenses = expenses.filter(e => e.eventId === activeEvent);
  const filteredExpenses = eventExpenses
    .filter(e => filter === "all" || e.category === filter)
    .filter(e => payFilter === "all" || e.payMode === payFilter);

  const totalSpent = eventExpenses.reduce((s, e) => s + e.amount, 0);
  const remaining = currentEvent.budget - totalSpent;
  const spentPct = currentEvent.budget > 0 ? Math.min(100, (totalSpent / currentEvent.budget) * 100) : 0;

  const categoryBreakdown = CATEGORIES.map(cat => ({
    ...cat, total: eventExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
  }));

  const payBreakdown = PAYMENT_MODES.map(pm => ({
    ...pm, total: eventExpenses.filter(e => e.payMode === pm.id).reduce((s, e) => s + e.amount, 0),
  })).filter(p => p.total > 0);

  // Staff names for dropdowns (extract .name from Firestore objects)
  const staffNames = staff.map(s => s.name || s);

  /* ══════════════════════════════════════════════════════════════
     HANDLERS — All writes go to Firestore
     ══════════════════════════════════════════════════════════════ */
  const handleAddExpense = async () => {
    const parsedAmount = parseFloat(form.amount);
    if (!form.desc.trim()) { showToast("Enter a description!", "error"); return; }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { showToast("Enter a valid amount!", "error"); return; }
    if (!form.addedBy) { showToast("Select your name!", "error"); return; }
    if (!activeEvent) { showToast("Select an event first!", "error"); return; }

    setSaving(true);
    try {
      await dbAddExpense({
        eventId: activeEvent,
        category: form.category,
        payMode: form.payMode,
        desc: form.desc.trim(),
        amount: parsedAmount,
        date: new Date().toISOString().split("T")[0],
        addedBy: form.addedBy,
        note: form.note.trim(),
      });
      setForm({ category: "travel", payMode: "upi", desc: "", amount: "", addedBy: "", note: "" });
      showToast("Expense logged! ✅");
      setView("dashboard");
    } catch (err) {
      console.error("Error adding expense:", err);
      showToast("Failed to save expense!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvent = async () => {
    if (!eventForm.name.trim()) { showToast("Event name required!", "error"); return; }
    if (isNaN(parseFloat(eventForm.budget)) || !eventForm.budget) { showToast("Enter a valid budget!", "error"); return; }
    if (!eventForm.date) { showToast("Select a date!", "error"); return; }

    setSaving(true);
    try {
      const newId = await dbAddEvent({
        name: eventForm.name.trim(),
        location: eventForm.location.trim() || "TBD",
        budget: parseFloat(eventForm.budget),
        date: eventForm.date,
      });
      setEventForm({ name: "", location: "", budget: "", date: "" });
      setShowAddEvent(false);
      handleEventSwitch(newId);
      showToast(`"${eventForm.name.trim()}" added! 🎉`);
    } catch (err) {
      console.error("Error adding event:", err);
      showToast("Failed to create event!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStaff = async () => {
    const n = newStaffName.trim();
    if (!n) { showToast("Enter a name!", "error"); return; }
    if (staffNames.map(s => s.toLowerCase()).includes(n.toLowerCase())) {
      showToast("Staff member already exists!", "error"); return;
    }

    setSaving(true);
    try {
      await dbAddStaff(n);
      setNewStaffName("");
      setShowAddStaff(false);
      showToast(`${n} added to team! 👤`);
    } catch (err) {
      console.error("Error adding staff:", err);
      showToast("Failed to add staff member!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dbDeleteExpense(id);
      showToast("Expense removed 🗑️");
    } catch (err) {
      console.error("Error deleting expense:", err);
      showToast("Failed to delete expense!", "error");
    }
  };

  /* ── Report helpers ── */
  const repEvent = events.find(e => e.id === reportEvent) || events[0] || { name: "N/A", location: "", budget: 1, date: "" };
  const repExpenses = expenses.filter(e => e.eventId === reportEvent);
  const repSpent = repExpenses.reduce((s, e) => s + e.amount, 0);
  const repPct = repEvent.budget > 0 ? Math.min(100, (repSpent / repEvent.budget) * 100) : 0;
  const repCatBreak = CATEGORIES.map(c => ({ ...c, total: repExpenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0) })).filter(c => c.total > 0);
  const repPayBreak = PAYMENT_MODES.map(p => ({ ...p, total: repExpenses.filter(e => e.payMode === p.id).reduce((s, e) => s + e.amount, 0) })).filter(p => p.total > 0);
  const repTeam = [...new Set(repExpenses.map(e => e.addedBy))].map(name => ({ name, total: repExpenses.filter(e => e.addedBy === name).reduce((s, e) => s + e.amount, 0) })).sort((a, b) => b.total - a.total);

  const exportCSV = () => {
    const rows = [["Description", "Category", "Payment Mode", "Amount", "Date", "By", "Note"], ...repExpenses.map(e => [e.desc, e.category, e.payMode, e.amount, e.date, e.addedBy, e.note])];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${repEvent.name}_expenses.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast("CSV downloaded! 📊");
  };

  const exportPDF = () => {
    const win = window.open("", "_blank");
    const rows = repExpenses.map(e => `<tr><td>${e.desc}</td><td>${e.category}</td><td>${e.payMode}</td><td style="text-align:right">₹${e.amount.toLocaleString("en-IN")}</td><td>${e.date}</td><td>${e.addedBy}</td></tr>`).join("");
    win.document.write(`
      <html><head><title>${repEvent.name} — Expense Report</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#222}h1{font-size:20px;margin-bottom:4px}p{color:#666;font-size:13px;margin:0 0 20px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#0A0A0F;color:#fff;padding:10px 12px;text-align:left}td{padding:9px 12px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f9f9f9}.summary{display:flex;gap:30px;margin-bottom:24px;background:#f4f4f4;padding:14px 18px;border-radius:8px}.summary div label{font-size:11px;color:#888;display:block;margin-bottom:2px}.summary div span{font-size:18px;font-weight:800;color:#FF6B35}</style>
      </head><body>
      <h1>${repEvent.name}</h1><p>${repEvent.location} · ${repEvent.date}</p>
      <div class="summary">
        <div><label>Total Spent</label><span>₹${repSpent.toLocaleString("en-IN")}</span></div>
        <div><label>Budget</label><span>₹${repEvent.budget.toLocaleString("en-IN")}</span></div>
        <div><label>Saved</label><span>₹${Math.abs(repEvent.budget - repSpent).toLocaleString("en-IN")}</span></div>
      </div>
      <table><thead><tr><th>Description</th><th>Category</th><th>Payment</th><th style="text-align:right">Amount</th><th>Date</th><th>By</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="margin-top:20px;font-size:11px;color:#aaa">Generated by EventXpense · ${new Date().toLocaleDateString("en-IN")}</p>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    showToast("PDF print dialog opened! 📑");
  };

  /* ── Helper style factories ── */
  const filterBtn = (active, color) => ({
    padding: "5px 10px", borderRadius: 16, cursor: "pointer",
    background: active ? `${color}22` : "rgba(255,255,255,0.05)",
    color: active ? color : "#888", fontSize: 10, fontWeight: 700,
    whiteSpace: "nowrap", borderWidth: 1, borderStyle: "solid",
    borderColor: active ? color : "transparent", transition: "all 0.15s",
    fontFamily: "inherit",
  });
  const gridPickBtn = (active, color) => ({
    padding: "10px 6px", borderRadius: 12, cursor: "pointer",
    background: active ? `${color}33` : "rgba(255,255,255,0.04)",
    borderWidth: 1.5, borderStyle: "solid",
    borderColor: active ? color : "transparent",
    textAlign: "center", transition: "all 0.15s",
  });

  const handleChangeRole = async (uid, newRole) => {
    try {
      await dbUpdateUserRole(uid, newRole);
      showToast(`Role updated to ${newRole}! ✅`);
    } catch (err) {
      console.error("Error updating role:", err);
      showToast("Failed to update role!", "error");
    }
  };

  const VIEW_LABELS = {
    dashboard: { icon: "report-analytics.svg", label: "Overview" },
    add: { icon: "money-rupee-circle-line.svg", label: "Log Expense" },
    reports: { icon: "file-chart-line.svg", label: "Reports" },
    users: { icon: "stack-overflow-line.svg", label: "Users" },
  };
  const NAV_ITEMS = [
    { id: "dashboard", icon: "report-analytics.svg", label: "Overview" },
    { id: "add", icon: "money-rupee-circle-line.svg", label: "Add Expense" },
    { id: "reports", icon: "file-chart-line.svg", label: "Reports" },
    ...(canManageUsers ? [{ id: "users", icon: "stack-overflow-line.svg", label: "Users" }] : []),
  ];

  return (
    <div className="app-shell">
      {/* Background Orbs */}
      <div className="bg-orb bg-orb--orange" />
      <div className="bg-orb bg-orb--purple" />

      {/* ══════════════════════════════════════════════════════════
          SIDEBAR — Desktop Only (hidden via CSS on mobile)
         ══════════════════════════════════════════════════════════ */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__brand-label">EventXpense</div>
          <div className="sidebar__brand-title">Team Expense Hub</div>
          <div style={{ fontSize: 9, color: "#4ECDC4", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ECDC4", display: "inline-block" }} />
            {userProfile?.role?.toUpperCase() || "USER"} · Online
          </div>
        </div>

        {/* Navigation */}
        <div className="sidebar__nav-title">Navigation</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`sidebar__nav-btn ${view === item.id ? "sidebar__nav-btn--active" : "sidebar__nav-btn--inactive"}`}
            onClick={() => setView(item.id)}
          >
            <span className="sidebar__nav-icon"><Icon src={item.icon} size={18} /></span>
            {item.label}
          </button>
        ))}

        {/* Events List */}
        <div className="sidebar__events-section">
          <div className="sidebar__nav-title">Events ({events.length})</div>
          {events.map(ev => (
            <button
              key={ev.id}
              className={`sidebar__event-btn ${activeEvent === ev.id ? "sidebar__event-btn--active" : "sidebar__event-btn--inactive"}`}
              onClick={() => handleEventSwitch(ev.id)}
            >
              <span className="sidebar__event-dot" style={{ background: activeEvent === ev.id ? "#FF6B35" : "#444" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: activeEvent === ev.id ? 700 : 500 }}>{ev.name}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{ev.location} · {ev.date}</div>
              </div>
            </button>
          ))}
          <button className="sidebar__add-event-btn" onClick={() => setShowAddEvent(true)}>
            ＋ New Event
          </button>
        </div>

        {/* Avatar */}
        <div className="sidebar__avatar-section">
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#FF6B35,#9B72CF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{userProfile?.name?.[0]?.toUpperCase() || "U"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userProfile?.name || "User"}</div>
            <div style={{ fontSize: 10, color: "#555", textTransform: "capitalize" }}>{userProfile?.role || "Staff"}</div>
          </div>
          <button onClick={logout} title="Sign out" style={{ background: "rgba(230,57,70,0.15)", border: "none", color: "#E63946", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, flexShrink: 0, fontFamily: "inherit" }}>Logout</button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT AREA
         ══════════════════════════════════════════════════════════ */}
      <div className="main-content">

        {/* ── MOBILE HEADER (hidden on desktop) ── */}
        <div className="app-header">
          <div className="header-row mobile-only">
            <div>
              <div className="header-brand-label">EventXpense</div>
              <div className="header-title">Team Expense Hub</div>
            </div>
            <div className="header-avatar" onClick={logout} style={{ cursor: "pointer" }} title="Sign out">{userProfile?.name?.[0]?.toUpperCase() || "U"}</div>
          </div>

          {/* Mobile Event Tabs */}
          <div className="event-tabs mobile-only">
            {events.map(ev => (
              <button
                key={ev.id}
                className={`event-tab ${activeEvent === ev.id ? "event-tab--active" : "event-tab--inactive"}`}
                onClick={() => handleEventSwitch(ev.id)}
              >
                {ev.name}
              </button>
            ))}
            <button className="event-tab event-tab--add" onClick={() => setShowAddEvent(true)}>
              ＋ New Event
            </button>
          </div>

          {/* Desktop Page Title */}
          <div className="desktop-header" style={{ display: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="desktop-page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon src={VIEW_LABELS[view]?.icon} size={20} /> {VIEW_LABELS[view]?.label}</div>
              <span style={{ fontSize: 12, color: "#555" }}>·</span>
              <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>{currentEvent.name}</span>
              <span style={{ fontSize: 11, color: "#555" }}>{currentEvent.location}</span>
              {saving && <span style={{ fontSize: 10, color: "#FF6B35", fontWeight: 700, animation: "fadeSlide 0.3s ease" }}>💾 Saving...</span>}
            </div>
          </div>
        </div>

        {/* ── MOBILE NAV BAR (hidden on desktop) ── */}
        <div className="nav-bar">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${view === item.id ? "nav-btn--active" : "nav-btn--inactive"}`}
              onClick={() => setView(item.id)}
            >
              <Icon src={item.icon} size={14} /> {item.label}
            </button>
          ))}
        </div>

        {/* ── PAGE CONTENT ── */}
        <div className="page-content">

          {/* ══════ DASHBOARD ══════ */}
          {view === "dashboard" && (
            <div>
              {events.length === 0 ? (
                <div className="empty-state" style={{ padding: "60px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>No Events Yet</div>
                  <div style={{ color: "#666", marginBottom: 16 }}>Create your first event to start tracking expenses</div>
                  <button onClick={() => setShowAddEvent(true)} style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: "linear-gradient(135deg,#FF6B35,#E63946)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    ＋ Create First Event
                  </button>
                </div>
              ) : (
                <>
                  {/* Budget Card */}
                  <div className="budget-card">
                    <div className="budget-card__header">
                      {currentEvent.name} <span style={{ color: "#555", fontWeight: 400 }}>· {currentEvent.location}</span>
                    </div>
                    <div className="budget-card__stats">
                      <div>
                        <div className="budget-card__label">Total Spent</div>
                        <div className="budget-card__amount" style={{ color: "#FF6B35" }}><AnimatedNumber value={totalSpent} /></div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="budget-card__label">{remaining >= 0 ? "Remaining" : "Over Budget"}</div>
                        <div className="budget-card__amount" style={{ color: remaining > 0 ? "#4ECDC4" : "#E63946" }}><AnimatedNumber value={Math.abs(remaining)} /></div>
                      </div>
                    </div>
                    <div className="budget-progress">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: "#888" }}>Budget Used</span>
                        <span style={{ fontSize: 10, color: spentPct > 80 ? "#E63946" : "#4ECDC4", fontWeight: 700 }}>{spentPct.toFixed(1)}%</span>
                      </div>
                      <div className="budget-progress__bar-bg">
                        <div className="budget-progress__bar-fill" style={{
                          background: spentPct > 80 ? "linear-gradient(90deg,#FF6B35,#E63946)" : "linear-gradient(90deg,#4ECDC4,#FF6B35)",
                          width: `${spentPct}%`,
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>Budget: {formatINR(currentEvent.budget)}</div>
                    </div>
                  </div>

                  {/* Payment Mode Summary */}
                  {payBreakdown.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="section-title">💳 By Payment Mode</div>
                      <div className="payment-strip">
                        {payBreakdown.map(pm => (
                          <div key={pm.id} className="payment-card" style={{ background: `${pm.color}18`, border: `1px solid ${pm.color}44` }}>
                            <div style={{ fontSize: 20 }}><Icon src={pm.icon} size={22} color={pm.color} /></div>
                            <div style={{ fontSize: 9, color: "#888", marginTop: 2, fontWeight: 700 }}>{pm.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: pm.color, marginTop: 3 }}>{formatINR(pm.total)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Grid */}
                  {categoryBreakdown.some(c => c.total > 0) && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="section-title">By Category</div>
                      <div className="category-grid">
                        {categoryBreakdown.filter(c => c.total > 0).map(cat => (
                          <div key={cat.id} className="category-card" style={{ border: `1px solid ${cat.color}33` }}>
                            <div style={{ fontSize: 20 }}><Icon src={cat.icon} size={22} color={cat.color} /></div>
                            <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{cat.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: cat.color, marginTop: 4 }}>{formatINR(cat.total)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filters */}
                  <div className="filter-section">
                    <div className="filter-label">Filter by Category</div>
                    <div className="filter-chips">
                      {[{ id: "all", label: "All", icon: "🔍", color: "#FF6B35" }, ...CATEGORIES].map(c => (
                        <button key={c.id} onClick={() => setFilter(c.id)} style={{ ...filterBtn(filter === c.id, c.color), display: "inline-flex", alignItems: "center", gap: 4 }}><Icon src={c.icon} size={12} color={c.color} /> {c.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="filter-section" style={{ marginBottom: 16 }}>
                    <div className="filter-label">Filter by Payment</div>
                    <div className="filter-chips">
                      {[{ id: "all", label: "All", icon: "💰", color: "#FF6B35" }, ...PAYMENT_MODES].map(p => (
                        <button key={p.id} onClick={() => setPayFilter(p.id)} style={{ ...filterBtn(payFilter === p.id, p.color), display: "inline-flex", alignItems: "center", gap: 4 }}><Icon src={p.icon} size={12} color={p.color} /> {p.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Expense List */}
                  {filteredExpenses.length === 0 ? (
                    <div className="empty-state">
                      {eventExpenses.length === 0 ? "No expenses logged yet." : "No expenses match this filter."}<br />
                      {(filter !== "all" || payFilter !== "all") && <span style={{ color: "#9B72CF", cursor: "pointer", fontWeight: 700, fontSize: 12 }} onClick={() => { setFilter("all"); setPayFilter("all"); }}>↩ Clear filters  </span>}
                      <span style={{ color: "#FF6B35", cursor: "pointer", fontWeight: 700, fontSize: 12 }} onClick={() => setView("add")}>+ Add expense</span>
                    </div>
                  ) : filteredExpenses.map((exp, i) => (
                    <ExpenseRow key={exp.id} exp={exp} index={i} onDelete={handleDelete} />
                  ))}
                </>
              )}
            </div>
          )}

          {/* ══════ ADD EXPENSE ══════ */}
          {view === "add" && (
            <div>
              <div className="form-title">Log Expense</div>
              <div className="form-subtitle">Takes less than 10 seconds ⚡</div>

              {events.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Create an event first!</div>
                  <button onClick={() => setShowAddEvent(true)} style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: "linear-gradient(135deg,#FF6B35,#E63946)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    ＋ Create Event
                  </button>
                </div>
              ) : (
                <>
                  {/* Category */}
                  <div className="form-section">
                    <div className="section-title">Category</div>
                    <div className="form-grid-categories">
                      {CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))} style={gridPickBtn(form.category === cat.id, cat.color)}>
                          <div style={{ fontSize: 22 }}><Icon src={cat.icon} size={26} color={cat.color} /></div>
                          <div style={{ fontSize: 9, color: form.category === cat.id ? cat.color : "#888", fontWeight: 700, marginTop: 3 }}>{cat.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="form-section">
                    <div className="section-title">💳 Payment Mode</div>
                    <div className="form-grid-categories">
                      {PAYMENT_MODES.map(pm => (
                        <button key={pm.id} onClick={() => setForm(f => ({ ...f, payMode: pm.id }))} style={gridPickBtn(form.payMode === pm.id, pm.color)}>
                          <div style={{ fontSize: 20 }}><Icon src={pm.icon} size={24} color={pm.color} /></div>
                          <div style={{ fontSize: 9, color: form.payMode === pm.id ? pm.color : "#888", fontWeight: 700, marginTop: 3, lineHeight: 1.2 }}>{pm.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description + Amount */}
                  <div className="form-2col">
                    <div className="form-field">
                      <label className="form-label">Description *</label>
                      <input type="text" className="form-input" placeholder="e.g. Hotel stay 2 nights" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Amount (₹) *</label>
                      <input type="number" className="form-input" placeholder="e.g. 12000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                  </div>

                  {/* Staff + Note */}
                  <div className="form-2col">
                    <div className="form-field">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Your Name *</label>
                        <button onClick={() => setShowAddStaff(true)} style={{ fontSize: 10, fontWeight: 700, color: "#9B72CF", background: "rgba(155,114,207,0.15)", border: "none", borderRadius: 8, padding: "3px 10px", cursor: "pointer" }}>+ Add Staff</button>
                      </div>
                      <StyledSelect value={form.addedBy} onChange={e => setForm(f => ({ ...f, addedBy: e.target.value }))}>
                        <option value="" style={{ background: "#141418" }}>— Select staff member —</option>
                        {staffNames.map(s => <option key={s} value={s} style={{ background: "#141418" }}>{s}</option>)}
                      </StyledSelect>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Note (optional)</label>
                      <input type="text" className="form-input" placeholder="e.g. Vendor bill no. 211" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                    </div>
                  </div>

                  {/* Event */}
                  <div className="form-field" style={{ marginBottom: 22 }}>
                    <label className="form-label">Event</label>
                    <StyledSelect value={activeEvent || ""} onChange={e => setActiveEvent(e.target.value)}>
                      {events.map(ev => <option key={ev.id} value={ev.id} style={{ background: "#141418" }}>{ev.name} — {ev.location}</option>)}
                    </StyledSelect>
                  </div>

                  <button onClick={handleAddExpense} className="form-submit-btn" disabled={saving}>
                    {saving ? "💾 Saving..." : "⚡ LOG EXPENSE NOW"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ══════ REPORTS ══════ */}
          {view === "reports" && (
            <div>
              <div className="form-title">Reports & Export</div>
              <div className="form-subtitle">Select an event to view its full report</div>

              {events.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>No events to report on yet.</div>
              ) : (
                <>
                  {/* Event Selector */}
                  <div className="form-field" style={{ marginBottom: 20 }}>
                    <label className="form-label">Select Event</label>
                    <StyledSelect value={reportEvent || ""} onChange={e => setReportEvent(e.target.value)}>
                      {events.map(ev => <option key={ev.id} value={ev.id} style={{ background: "#141418" }}>{ev.name} — {ev.location}</option>)}
                    </StyledSelect>
                  </div>

                  {/* Summary Card */}
                  <div className="report-summary-card">
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{repEvent.name}</div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>{repEvent.location} · {repEvent.date}</div>
                    <div className="report-summary__stats">
                      <div><div style={{ fontSize: 10, color: "#888" }}>Spent</div><div style={{ fontSize: 20, fontWeight: 900, color: "#FF6B35" }}>{formatINR(repSpent)}</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: "#888" }}>Budget</div><div style={{ fontSize: 20, fontWeight: 900, color: "#aaa" }}>{formatINR(repEvent.budget)}</div></div>
                      <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "#888" }}>{repEvent.budget - repSpent >= 0 ? "Saved" : "Over"}</div><div style={{ fontSize: 20, fontWeight: 900, color: repEvent.budget - repSpent >= 0 ? "#4ECDC4" : "#E63946" }}>{formatINR(Math.abs(repEvent.budget - repSpent))}</div></div>
                    </div>
                    <div style={{ marginTop: 10, background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 5 }}>
                      <div style={{ height: 5, borderRadius: 4, background: repPct > 85 ? "#E63946" : "linear-gradient(90deg,#4ECDC4,#FF6B35)", width: `${repPct}%`, transition: "width 0.6s ease" }} />
                    </div>
                  </div>

                  {repExpenses.length === 0 ? (
                    <div className="empty-state">No expenses logged for this event yet.</div>
                  ) : (
                    <>
                      {/* Category Breakdown */}
                      {repCatBreak.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div className="section-title">By Category</div>
                          <div className="category-grid">
                            {repCatBreak.map(cat => (
                              <div key={cat.id} className="category-card" style={{ border: `1px solid ${cat.color}33` }}>
                                <div style={{ fontSize: 18 }}><Icon src={cat.icon} size={20} color={cat.color} /></div>
                                <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{cat.label}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: cat.color, marginTop: 3 }}>{formatINR(cat.total)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Payment Breakdown */}
                      {repPayBreak.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div className="section-title">💳 Payment Modes Used</div>
                          <div className="payment-strip">
                            {repPayBreak.map(pm => (
                              <div key={pm.id} className="payment-card" style={{ background: `${pm.color}18`, border: `1px solid ${pm.color}44` }}>
                                <div style={{ fontSize: 20 }}><Icon src={pm.icon} size={22} color={pm.color} /></div>
                                <div style={{ fontSize: 9, color: "#888", marginTop: 2, fontWeight: 700 }}>{pm.label}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: pm.color, marginTop: 3 }}>{formatINR(pm.total)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Team Contribution */}
                      {repTeam.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div className="section-title">👥 Team Contribution</div>
                          {repTeam.map(({ name, total }) => (
                            <div key={name} className="report-team-row">
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#FF6B35,#9B72CF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{name[0].toUpperCase()}</div>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{name}</span>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 800, color: "#FF6B35" }}>{formatINR(total)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Export */}
                      <div className="report-export-row">
                        <button onClick={exportCSV} className="report-export-btn" style={{ background: "linear-gradient(135deg,rgba(78,205,196,0.25),rgba(78,205,196,0.1))", color: "#4ECDC4" }}>
                          📊 Download CSV
                        </button>
                        <button onClick={exportPDF} className="report-export-btn" style={{ background: "linear-gradient(135deg,rgba(155,114,207,0.25),rgba(155,114,207,0.1))", color: "#9B72CF" }}>
                          📑 Export PDF
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══════ USERS (Admin Only) ══════ */}
          {view === "users" && canManageUsers && (
            <div>
              <div className="form-title">User Management</div>
              <div className="form-subtitle">Manage team roles and permissions</div>
              {allUsers.length === 0 ? (
                <div className="empty-state">No registered users found.</div>
              ) : (
                <div>
                  {allUsers.map((u) => {
                    const roleColor = u.role === "admin" ? "#E63946" : u.role === "manager" ? "#9B72CF" : "#4ECDC4";
                    return (
                      <div key={u.id} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                        background: "rgba(255,255,255,0.04)", borderRadius: 12, marginBottom: 8,
                        border: "1px solid rgba(255,255,255,0.06)", transition: "background 0.2s",
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                          {u.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "Unknown"}</div>
                          <div style={{ fontSize: 11, color: "#555" }}>{u.email}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ padding: "4px 10px", borderRadius: 12, background: `${roleColor}22`, color: roleColor, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>{u.role}</span>
                          {u.id !== userProfile?.id && (
                            <StyledSelect value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value)} style={{ width: 120 }}>
                              <option value="admin" style={{ background: "#141418" }}>Admin</option>
                              <option value="manager" style={{ background: "#141418" }}>Manager</option>
                              <option value="staff" style={{ background: "#141418" }}>Staff</option>
                            </StyledSelect>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 16, padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>
                      <strong style={{ color: "#E63946" }}>Admin</strong> — Full access + user management<br />
                      <strong style={{ color: "#9B72CF" }}>Manager</strong> — Create events, manage team & expenses<br />
                      <strong style={{ color: "#4ECDC4" }}>Staff</strong> — Log expenses & view reports
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Floating Add Button ── */}
        {view !== "add" && events.length > 0 && (
          <button className="fab" onClick={() => setView("add")}>+</button>
        )}
      </div>

      {/* ── ADD EVENT MODAL ── */}
      {showAddEvent && (
        <Modal title="➕ Add New Event" onClose={() => setShowAddEvent(false)}>
          {[
            { key: "name", label: "Event Name *", placeholder: "e.g. Kapoor Wedding", type: "text" },
            { key: "location", label: "City / Location", placeholder: "e.g. Hyderabad", type: "text" },
            { key: "budget", label: "Budget (₹) *", placeholder: "e.g. 75000", type: "number" },
            { key: "date", label: "Event Date *", placeholder: "", type: "date" },
          ].map(f => (
            <div key={f.key} className="form-field">
              <label className="form-label">{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={eventForm[f.key]} onChange={e => setEventForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="form-input" style={{ colorScheme: "dark" }} />
            </div>
          ))}
          <button onClick={handleAddEvent} disabled={saving} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#9B72CF,#457B9D)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", marginTop: 4, fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
            {saving ? "💾 Creating..." : "🎉 Create Event"}
          </button>
        </Modal>
      )}

      {/* ── ADD STAFF MODAL ── */}
      {showAddStaff && (
        <Modal title="👤 Add Staff Member" onClose={() => setShowAddStaff(false)}>
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label className="form-label">Full Name *</label>
            <input type="text" placeholder="e.g. Sneha Sharma" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddStaff()} className="form-input" autoFocus />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="section-title">Current Team</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {staffNames.map(s => (
                <span key={s} style={{ padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 600, color: "#ccc", border: "1px solid rgba(255,255,255,0.1)" }}>{s}</span>
              ))}
            </div>
          </div>
          <button onClick={handleAddStaff} disabled={saving} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#9B72CF,#FF6B35)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
            {saving ? "💾 Adding..." : "✅ Add to Team"}
          </button>
        </Modal>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="toast" style={{
          background: toast.type === "error" ? "#E63946" : "#1A2E1A",
          border: `1px solid ${toast.type === "error" ? "#E63946" : "#4ECDC4"}`,
          color: "#fff",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}