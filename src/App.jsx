import { useState, useEffect, useRef } from "react";
import "./App.css";
import { useAuth } from "./AuthContext";
import AuthPage from "./AuthPage";
import WaitingApproval from "./WaitingApproval";
import { sendApprovalEmail, sendRejectionEmail } from "./emailService";
import {
  subscribeToEvents,
  subscribeToExpenses,
  subscribeToStaff,
  subscribeToUsers,
  subscribeToRegistrationRequests,
  approveRegistrationRequest as dbApproveRequest,
  rejectRegistrationRequest as dbRejectRequest,
  updateUserRole as dbUpdateUserRole,
  updateUserProfile as dbUpdateUserProfile,
  deleteUser as dbDeleteUser,
  assignEventsToUser as dbAssignEventsToUser,
  assignStaffToManager as dbAssignStaffToManager,
  addEvent as dbAddEvent,
  updateEvent as dbUpdateEvent,
  deleteEvent as dbDeleteEvent,
  addExpense as dbAddExpense,
  updateExpenseWithLog as dbUpdateExpense,
  addStaffMember as dbAddStaff,
  deleteExpense as dbDeleteExpense,
  logActivity as dbLogActivity,
  subscribeToActivityLogs,
  deleteAllData as dbDeleteAllData,
} from "./db";

const CATEGORIES = [
  { id: "travel", label: "Travel", icon: "flight-takeoff-line.svg", color: "#9CA3AF" },
  { id: "food", label: "Food & Stay", icon: "restaurant-line.svg", color: "#9CA3AF" },
  { id: "decor", label: "Decor", icon: "decor.svg", color: "#9CA3AF" },
  { id: "labour", label: "Labour", icon: "stack-overflow-line.svg", color: "#9CA3AF" },
  { id: "equipment", label: "Equipment", icon: "file-chart-line.svg", color: "#9CA3AF" },
  { id: "misc", label: "Misc", icon: "menu-line.svg", color: "#9CA3AF" },
];

const PAYMENT_MODES = [
  { id: "cash", label: "Cash", icon: "cash-line.svg", color: "#9CA3AF" },
  { id: "upi", label: "UPI", icon: "upi-icon.svg", color: "#9CA3AF" },
  { id: "card", label: "Card", icon: "bank-card-2-line.svg", color: "#9CA3AF" },
  { id: "bank", label: "Bank Transfer", icon: "bank-card-2-line.svg", color: "#9CA3AF" },
  { id: "wallet", label: "Wallet", icon: "wallet-line.svg", color: "#9CA3AF" },
  { id: "cheque", label: "Cheque", icon: "coupon-4-line.svg", color: "#9CA3AF" },
];

function formatINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

/* ── Icon Helper — renders SVG files or emoji text ───────────────── */
function Icon({ src, size = 20, color, style = {}, inSidebar = false }) {
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  
  if (!src) return null;
  const isSvg = typeof src === "string" && src.endsWith(".svg");
  if (isSvg) {
    const isLightMode = theme === 'light';
    
    // Sidebar icons: always white (inverted)
    // Main content icons in light mode: black (not inverted)
    // Main content icons in dark mode: white (inverted)
    let filter;
    if (inSidebar) {
      filter = "brightness(0) invert(1)"; // Always white
    } else {
      filter = isLightMode ? "brightness(0)" : "brightness(0) invert(1)"; // Black in light, white in dark
    }
    
    return (
      <img
        src={`/${src}`}
        alt=""
        style={{
          width: size, height: size, objectFit: "contain",
          filter: filter,
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
function ExpenseRow({ exp, index, onDelete, onEdit }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[5]; // Default to misc if not found
  const pay = PAYMENT_MODES.find(p => p.id === exp.payMode) || PAYMENT_MODES[0]; // Default to cash if not found
  return (
    <div className="expense-row" style={{
      border: `1px solid ${open ? cat?.color + "55" : "var(--border-default)"}`,
      animation: `fadeSlide 0.3s ease ${index * 0.04}s both`,
    }}>
      <div className="expense-row__header" onClick={() => setOpen(o => !o)}>
        <div className="expense-row__icon" style={{ background: `${cat?.color}22` }}><Icon src={cat?.icon} size={18} color={cat?.color} /></div>
        <div className="expense-row__body">
          <div className="expense-row__desc">{exp.desc}</div>
          <div className="expense-row__meta">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 8, background: `${pay?.color}22`, color: pay?.color, fontSize: 9, fontWeight: 800 }}><Icon src={pay?.icon} size={12} color={pay?.color} /> {pay?.label}</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>· {exp.addedBy} · {exp.date}</span>
          </div>
        </div>
        <div className="expense-row__actions">
          <div style={{ fontSize: 15, fontWeight: 900, color: cat?.color }}>{formatINR(exp.amount)}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}>▼</div>
        </div>
      </div>
      <div style={{ maxHeight: open ? 320 : 0, overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ borderTop: "1px solid var(--border-default)", padding: "12px 14px" }}>
          <div className="expense-row__detail-grid">
            {[
              { label: "Category", value: cat?.label, icon: cat?.icon, color: cat?.color },
              { label: "Payment", value: pay?.label, icon: pay?.icon, color: pay?.color },
              { label: "Amount", value: formatINR(exp.amount), color: "var(--text-primary)" },
              { label: "Date", value: exp.date, color: "var(--text-secondary)" },
              { label: "Logged By", value: exp.addedBy, color: "var(--text-secondary)" },
            ].map(item => (
              <div key={item.label} className="bg-subtle" style={{ borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, display: "flex", alignItems: "center", gap: 4 }}>{item.icon && <Icon src={item.icon} size={14} color={item.color} />}{item.value}</div>
              </div>
            ))}
          </div>
          {exp.note && (
            <div className="bg-subtle" style={{ borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>📝 Note</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{exp.note}</div>
            </div>
          )}
          <div className="expense-row__btn-row">
            <button 
              onClick={e => { e.stopPropagation(); onEdit(exp); }} 
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid var(--border-default)", cursor: "pointer", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700 }}
            >
              ✏️ Edit
            </button>
            <button 
              onClick={e => { e.stopPropagation(); onDelete(exp.id); }} 
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", background: "rgba(239,68,68,0.12)", color: "#EF4444", fontSize: 11, fontWeight: 700 }}
            >
              🗑️ Delete
            </button>
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
            borderTop: "3px solid #4F46E5", borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <div style={{ color: "#888", fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
            Connecting to database...
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ color: "#EF4444", fontSize: 15, fontWeight: 700 }}>
            Firebase Connection Error
          </div>
          <div style={{ color: "#888", fontSize: 12, maxWidth: 320, textAlign: "center" }}>
            {error}
          </div>
          <div style={{ color: "#555", fontSize: 11, marginTop: 8 }}>
            Check your Firebase config in <code style={{ color: "#4F46E5" }}>src/firebase.js</code>
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
  const { user, userProfile, registrationRequest, loading: authLoading, logout, isAdmin, canManageEvents, canManageUsers, canApproveStaff } = useAuth();

  // ── Firebase-synced state ──
  const [events, setEvents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const loadedCount = useRef(0);
  const seedAttempted = useRef(false);

  // ── UI state ──
  const [activeEvent, setActiveEvent] = useState(null);
  const [view, setView] = useState("dashboard");
  const [filter, setFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ category: "travel", payMode: "upi", desc: "", amount: "", addedBy: "", note: "" });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [profileForm, setProfileForm] = useState({ name: "" });
  const [eventForm, setEventForm] = useState({ name: "", location: "", budget: "", date: "" });
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [reportEvent, setReportEvent] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningUser, setAssigningUser] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditExpense, setShowEditExpense] = useState(false);

  const toastTimer = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // Helper: mark one subscription as loaded, stop loading when all 4 are done
  const markLoaded = () => {
    loadedCount.current += 1;
    if (loadedCount.current >= 4) {
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
      if (loadedCount.current < 4) {
        console.warn("Firebase loading timed out after 8s — showing app anyway");
        setLoading(false);
      }
    }, 8000);

    const unsubEvents = subscribeToEvents((data) => {
      console.log("Events loaded:", data.length);
      setEvents(data);
      markLoaded();
    }, handleSubError);

    const unsubExpenses = subscribeToExpenses((data) => {
      console.log("Expenses loaded:", data.length);
      setExpenses(data);
      markLoaded();
    }, handleSubError);

    const unsubStaff = subscribeToStaff((data) => {
      console.log("Staff loaded:", data.length);
      setStaff(data);
      markLoaded();
    }, handleSubError);

    // Subscribe to all user profiles (needed for staff names in expense form)
    const unsubUsers = subscribeToUsers((data) => {
      console.log("Users loaded:", data.length);
      setAllUsers(data);
      markLoaded();
    }, handleSubError);

    // Admin: subscribe to activity logs
    let unsubLogs = () => { };
    if (isAdmin) {
      unsubLogs = subscribeToActivityLogs((data) => setActivityLogs(data), handleSubError);
    }

    // Admin/Manager: subscribe to registration requests
    let unsubRequests = () => { };
    if (isAdmin || canApproveStaff) {
      unsubRequests = subscribeToRegistrationRequests((data) => {
        // Filter based on role
        const filtered = isAdmin 
          ? data // Admin sees all requests
          : data.filter(r => r.requestedRole === "staff"); // Manager sees only staff requests
        setRegistrationRequests(filtered);
      }, handleSubError);
    }

    return () => {
      clearTimeout(timeout);
      unsubEvents();
      unsubExpenses();
      unsubStaff();
      unsubUsers();
      unsubLogs();
      unsubRequests();
    };
  }, [user, isAdmin, canApproveStaff]);



  // ── Auto-select first event when events load ──
  useEffect(() => {
    if (events.length > 0 && !activeEvent) {
      // Select first visible event
      const firstVisible = events.find(event => {
        if (isAdmin) return true;
        if (!userProfile?.assignedEvents) return false;
        return userProfile.assignedEvents.includes(event.id);
      });
      if (firstVisible) {
        setActiveEvent(firstVisible.id);
      }
    }
    if (events.length > 0 && !reportEvent) {
      // Select first visible event for reports
      const firstVisible = events.find(event => {
        if (isAdmin) return true;
        if (!userProfile?.assignedEvents) return false;
        return userProfile.assignedEvents.includes(event.id);
      });
      if (firstVisible) {
        setReportEvent(firstVisible.id);
      }
    }
  }, [events, activeEvent, reportEvent, isAdmin, userProfile?.assignedEvents]);

  // ── Apply theme ──
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setDarkMode(savedTheme === 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [darkMode]);

  // ── Auto-fill staff name in expense form ──
  useEffect(() => {
    if (userProfile?.role === "staff" && userProfile?.name && !form.addedBy) {
      setForm(f => ({ ...f, addedBy: userProfile.name }));
    }
  }, [userProfile, form.addedBy]);

  // ── Auth gating ──
  if (authLoading) return <LoadingScreen />;
  if (!user) return <AuthPage />;
  
  // If user is authenticated but has no profile, check registration request
  if (user && !userProfile) {
    return <WaitingApproval />;
  }

  // ── Show loading screen while connecting ──
  if (loading) {
    return <LoadingScreen error={dbError} />;
  }

  // ── Derived data ──
  const handleEventSwitch = (id) => { setActiveEvent(id); setFilter("all"); setPayFilter("all"); };

  // Filter events based on role and assignments
  const visibleEvents = events.filter(event => {
    if (isAdmin) return true; // Admin sees all
    if (!userProfile?.assignedEvents) return false;
    return userProfile.assignedEvents.includes(event.id);
  });

  // Filter expenses based on role and event access
  const visibleExpenses = expenses.filter(expense => {
    if (isAdmin) return true; // Admin sees all
    const eventIds = userProfile?.assignedEvents || [];
    return eventIds.includes(expense.eventId);
  });

  const currentEvent = visibleEvents.find(e => e.id === activeEvent) || visibleEvents[0] || { name: "No Events", location: "", budget: 1, date: "" };
  const eventExpenses = visibleExpenses.filter(e => e.eventId === activeEvent);
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

  // Staff names for dropdowns - get from users collection with role=staff
  const staffNames = allUsers.filter(u => u.role === "staff").map(u => u.name);

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
      const expenseId = await dbAddExpense({
        eventId: activeEvent,
        category: form.category,
        payMode: form.payMode,
        desc: form.desc.trim(),
        amount: parsedAmount,
        date: new Date().toISOString().split("T")[0],
        addedBy: form.addedBy,
        note: form.note.trim(),
        createdByUid: user.uid,
      });
      
      // Log activity
      await dbLogActivity({
        action: "expense_added",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: userProfile?.role || "staff",
        eventId: activeEvent,
        eventName: currentEvent.name,
        expenseId,
        details: `Added expense: ${form.desc.trim()} - ${formatINR(parsedAmount)}`,
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

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setForm({
      category: expense.category,
      payMode: expense.payMode,
      desc: expense.desc,
      amount: expense.amount.toString(),
      addedBy: expense.addedBy,
      note: expense.note || "",
    });
    setShowEditExpense(true);
  };

  const handleEditExpense = async () => {
    const parsedAmount = parseFloat(form.amount);
    if (!form.desc.trim()) { showToast("Enter a description!", "error"); return; }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { showToast("Enter a valid amount!", "error"); return; }
    if (!form.addedBy) { showToast("Select your name!", "error"); return; }

    setSaving(true);
    try {
      await dbUpdateExpense(
        editingExpense.id,
        {
          category: form.category,
          payMode: form.payMode,
          desc: form.desc.trim(),
          amount: parsedAmount,
          addedBy: form.addedBy,
          note: form.note.trim(),
        },
        userProfile?.name || "Unknown"
      );

      // Log activity
      await dbLogActivity({
        action: "expense_edited",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: userProfile?.role || "staff",
        eventId: editingExpense.eventId,
        expenseId: editingExpense.id,
        details: `Edited expense: ${form.desc.trim()} - ${formatINR(parsedAmount)}`,
      });

      setForm({ category: "travel", payMode: "upi", desc: "", amount: "", addedBy: "", note: "" });
      setShowEditExpense(false);
      setEditingExpense(null);
      showToast("Expense updated! ✅");
    } catch (err) {
      console.error("Error updating expense:", err);
      showToast("Failed to update expense!", "error");
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
        createdBy: user.uid,
        assignedManager: eventForm.assignedManager || null,
      });

      // Log activity
      await dbLogActivity({
        action: "event_created",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: userProfile?.role || "admin",
        eventId: newId,
        eventName: eventForm.name.trim(),
        details: `Created event: ${eventForm.name.trim()} with budget ${formatINR(parseFloat(eventForm.budget))}`,
      });

      setEventForm({ name: "", location: "", budget: "", date: "", assignedManager: "" });
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

  const handleEditEvent = async () => {
    if (!eventForm.name.trim()) { showToast("Event name required!", "error"); return; }
    if (isNaN(parseFloat(eventForm.budget)) || !eventForm.budget) { showToast("Enter a valid budget!", "error"); return; }
    if (!eventForm.date) { showToast("Select a date!", "error"); return; }

    setSaving(true);
    try {
      await dbUpdateEvent(editingEvent.id, {
        name: eventForm.name.trim(),
        location: eventForm.location.trim() || "TBD",
        budget: parseFloat(eventForm.budget),
        date: eventForm.date,
      });

      // Log activity
      await dbLogActivity({
        action: "event_updated",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: "admin",
        eventId: editingEvent.id,
        eventName: eventForm.name.trim(),
        details: `Updated event: ${eventForm.name.trim()}`,
      });

      setEventForm({ name: "", location: "", budget: "", date: "", assignedManager: "" });
      setShowEditEvent(false);
      setEditingEvent(null);
      showToast("Event updated! ✅");
    } catch (err) {
      console.error("Error updating event:", err);
      showToast("Failed to update event!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This will also delete all associated expenses.`)) {
      return;
    }

    setSaving(true);
    try {
      await dbDeleteEvent(eventId, expenses);

      // Log activity
      await dbLogActivity({
        action: "event_deleted",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: "admin",
        eventId: eventId,
        eventName: eventName,
        details: `Deleted event: ${eventName}`,
      });

      showToast("Event deleted! 🗑️");
      
      // Switch to another event if the deleted one was active
      if (activeEvent === eventId) {
        const remainingEvents = events.filter(e => e.id !== eventId);
        if (remainingEvents.length > 0) {
          setActiveEvent(remainingEvents[0].id);
        } else {
          setActiveEvent(null);
        }
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      showToast("Failed to delete event!", "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      location: event.location,
      budget: event.budget.toString(),
      date: event.date,
      assignedManager: event.assignedManager || "",
    });
    setShowEditEvent(true);
  };

  const handleAddStaff = async () => {
    const n = newStaffName.trim();
    if (!n) { showToast("Enter a name!", "error"); return; }
    if (staffNames.map(s => s.toLowerCase()).includes(n.toLowerCase())) {
      showToast("Staff member already exists!", "error"); return;
    }

    setSaving(true);
    try {
      await addStaff(n);
      setNewStaffName("");
      setShowAddStaff(false);
      showToast(`${n} added to team! 🎉`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to add staff", "error");
    } finally {
      setSaving(false);
    }
  };

  // Settings handlers
  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      showToast("Fill all fields!", "error");
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      showToast("Passwords don't match!", "error");
      return;
    }
    if (passwordForm.new.length < 6) {
      showToast("Password must be at least 6 characters!", "error");
      return;
    }

    setSaving(true);
    try {
      // Import required Firebase auth functions
      const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import("firebase/auth");
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, passwordForm.current);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordForm.new);
      
      setPasswordForm({ current: "", new: "", confirm: "" });
      setShowChangePassword(false);
      showToast("Password changed successfully! 🔐", "success");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        showToast("Current password is incorrect!", "error");
      } else {
        showToast("Failed to change password", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    const newName = profileForm.name.trim();
    if (!newName) {
      showToast("Enter a name!", "error");
      return;
    }

    setSaving(true);
    try {
      await dbUpdateUserProfile(user.uid, { name: newName });
      setShowEditProfile(false);
      showToast("Profile updated! ✅", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  // Registration request handlers
  const handleApproveRequest = async (request) => {
    setSaving(true);
    try {
      // Approve in database
      await dbApproveRequest(
        request.id,
        user.uid,
        userProfile?.name || "Unknown",
        userProfile?.role || "admin"
      );
      
      // Send approval email
      try {
        const emailResult = await sendApprovalEmail(
          {
            name: request.name,
            email: request.email,
            requestedRole: request.requestedRole,
          },
          userProfile?.name || "Administrator"
        );
        
        if (emailResult.success) {
          console.log("✅ Approval email sent successfully");
        } else if (emailResult.reason === "not_configured") {
          console.log("ℹ️ Email not configured - user will need to check app");
        }
      } catch (emailError) {
        console.error("Email send error (non-critical):", emailError);
        // Don't fail the approval if email fails
      }
      
      showToast(`✅ Approved ${request.name}'s ${request.requestedRole} request!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to approve request", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRejectRequest = async (request, reason = "") => {
    setSaving(true);
    try {
      // Reject in database
      await dbRejectRequest(
        request.id,
        user.uid,
        userProfile?.name || "Unknown",
        userProfile?.role || "admin",
        reason
      );
      
      // Send rejection email
      try {
        const emailResult = await sendRejectionEmail(
          {
            name: request.name,
            email: request.email,
            requestedRole: request.requestedRole,
          },
          reason
        );
        
        if (emailResult.success) {
          console.log("✅ Rejection email sent successfully");
        } else if (emailResult.reason === "not_configured") {
          console.log("ℹ️ Email not configured - user will need to check app");
        }
      } catch (emailError) {
        console.error("Email send error (non-critical):", emailError);
        // Don't fail the rejection if email fails
      }
      
      showToast(`❌ Rejected ${request.name}'s request`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to reject request", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    // Confirmation dialog
    if (!confirm(`Are you sure you want to delete this expense?\n\n${expense.desc} - ${formatINR(expense.amount)}`)) {
      return;
    }

    // Permission check
    if (!isAdmin && !canManageEvents) {
      // Staff can only delete their own expenses
      if (expense.createdByUid !== user.uid) {
        showToast("You can only delete your own expenses!", "error");
        return;
      }
    }

    try {
      await dbDeleteExpense(id);
      
      // Log activity
      await dbLogActivity({
        action: "expense_deleted",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: userProfile?.role || "staff",
        eventId: expense.eventId,
        expenseId: id,
        details: `Deleted expense: ${expense.desc} - ${formatINR(expense.amount)}`,
      });

      showToast("Expense removed 🗑️");
    } catch (err) {
      console.error("Error deleting expense:", err);
      showToast("Failed to delete expense!", "error");
    }
  };

  /* ── Report helpers ── */
  const repEvent = visibleEvents.find(e => e.id === reportEvent) || visibleEvents[0] || { name: "N/A", location: "", budget: 1, date: "" };
  const repExpenses = visibleExpenses.filter(e => e.eventId === reportEvent);
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
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#222}h1{font-size:20px;margin-bottom:4px}p{color:#666;font-size:13px;margin:0 0 20px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#0A0A0F;color:#fff;padding:10px 12px;text-align:left}td{padding:9px 12px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f9f9f9}.summary{display:flex;gap:30px;margin-bottom:24px;background:#f4f4f4;padding:14px 18px;border-radius:8px}.summary div label{font-size:11px;color:#888;display:block;margin-bottom:2px}.summary div span{font-size:18px;font-weight:800;color:#4F46E5}</style>
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
      
      // Log activity
      const targetUser = allUsers.find(u => u.id === uid);
      await dbLogActivity({
        action: "role_changed",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: "admin",
        targetUserId: uid,
        targetUserName: targetUser?.name || "Unknown",
        details: `Changed ${targetUser?.name}'s role to ${newRole}`,
      });

      showToast(`Role updated to ${newRole}! ✅`);
    } catch (err) {
      console.error("Error updating role:", err);
      showToast("Failed to update role!", "error");
    }
  };

  const handleDeleteUser = async (uid, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setSaving(true);
    try {
      await dbDeleteUser(uid);
      
      // Log activity
      await dbLogActivity({
        action: "user_deleted",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: "admin",
        targetUserId: uid,
        targetUserName: userName,
        details: `Deleted user: ${userName}`,
      });

      showToast(`User "${userName}" deleted successfully! 🗑️`);
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("Failed to delete user!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAllData = async () => {
    const confirmText = "DELETE ALL DATA";
    const userInput = prompt(
      `⚠️ DANGER ZONE ⚠️\n\nThis will permanently delete ALL data from the database:\n• All Events\n• All Expenses\n• All Staff\n• All Activity Logs\n• All Notifications\n\nThis action CANNOT be undone!\n\nType "${confirmText}" to confirm:`
    );

    if (userInput !== confirmText) {
      if (userInput !== null) {
        showToast("Database deletion cancelled", "error");
      }
      return;
    }

    setSaving(true);
    try {
      const collections = [
        "events",
        "expenses",
        "staff",
        "activityLogs",
        "notifications"
      ];

      const totalDeleted = await dbDeleteAllData(collections);

      // Log the deletion
      await dbLogActivity({
        action: "database_cleared",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: "admin",
        details: `Deleted all data from database (${totalDeleted} documents)`,
      });

      showToast(`Database cleared! ${totalDeleted} documents deleted 🗑️`, "success");
      
      // Refresh the page to reload empty data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("Error deleting all data:", err);
      showToast("Failed to delete database!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignEvents = async (uid, eventIds) => {
    try {
      await dbAssignEventsToUser(uid, eventIds);
      
      const targetUser = allUsers.find(u => u.id === uid);
      await dbLogActivity({
        action: "events_assigned",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: userProfile?.role || "admin",
        targetUserId: uid,
        targetUserName: targetUser?.name || "Unknown",
        details: `Assigned ${eventIds.length} event(s) to ${targetUser?.name}`,
      });

      setShowAssignModal(false);
      setAssigningUser(null);
      setSelectedEvents([]);
      showToast("Events assigned successfully! ✅");
    } catch (err) {
      console.error("Error assigning events:", err);
      showToast("Failed to assign events!", "error");
    }
  };

  const openAssignModal = (targetUser) => {
    setAssigningUser(targetUser);
    setSelectedEvents(targetUser.assignedEvents || []);
    setShowAssignModal(true);
  };

  const toggleEventSelection = (eventId) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleAssignStaffToManager = async (staffUid, managerUid) => {
    try {
      await dbAssignStaffToManager(staffUid, managerUid);
      
      const staffUser = allUsers.find(u => u.id === staffUid);
      const managerUser = allUsers.find(u => u.id === managerUid);
      await dbLogActivity({
        action: "staff_assigned",
        userId: user.uid,
        userName: userProfile?.name || "Unknown",
        userRole: "admin",
        details: `Assigned ${staffUser?.name} to manager ${managerUser?.name}`,
      });

      showToast("Staff assigned to manager! ✅");
    } catch (err) {
      console.error("Error assigning staff:", err);
      showToast("Failed to assign staff!", "error");
    }
  };

  const VIEW_LABELS = {
    dashboard: { icon: "report-analytics.svg", label: "Overview" },
    add: { icon: "money-rupee-circle-line.svg", label: "Log Expense" },
    reports: { icon: "file-chart-line.svg", label: "Reports" },
    events: { icon: "file-chart-line.svg", label: "Events" },
    users: { icon: "stack-overflow-line.svg", label: "Users" },
    analytics: { icon: "file-chart-line.svg", label: "Analytics" },
  };
  const NAV_ITEMS = [
    { id: "dashboard", icon: "report-analytics.svg", label: "Overview" },
    { id: "add", icon: "money-rupee-circle-line.svg", label: "Add Expense" },
    { id: "reports", icon: "file-chart-line.svg", label: "Reports" },
    ...(isAdmin || canApproveStaff ? [{ id: "requests", icon: "stack-overflow-line.svg", label: "Requests" }] : []),
    ...(isAdmin ? [{ id: "events", icon: "file-chart-line.svg", label: "Events" }] : []),
    ...(isAdmin ? [{ id: "analytics", icon: "file-chart-line.svg", label: "Analytics" }] : []),
    ...(isAdmin || canManageEvents ? [{ id: "users", icon: "stack-overflow-line.svg", label: isAdmin ? "Users" : "My Team" }] : []),
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
          <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 4, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            {userProfile?.role || "USER"}
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
            <span className="sidebar__nav-icon"><Icon src={item.icon} size={18} inSidebar={true} /></span>
            {item.label}
          </button>
        ))}

        {/* Events List */}
        <div className="sidebar__events-section">
          <div className="sidebar__nav-title">Events ({visibleEvents.length})</div>
          {visibleEvents.map(ev => (
            <button
              key={ev.id}
              className={`sidebar__event-btn ${activeEvent === ev.id ? "sidebar__event-btn--active" : "sidebar__event-btn--inactive"}`}
              onClick={() => handleEventSwitch(ev.id)}
            >
              <span className="sidebar__event-dot" style={{ background: activeEvent === ev.id ? "#4F46E5" : "#444" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: activeEvent === ev.id ? 700 : 500 }}>{ev.name}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{ev.location} · {ev.date}</div>
              </div>
            </button>
          ))}
          {isAdmin && (
            <button className="sidebar__add-event-btn" onClick={() => setShowAddEvent(true)}>
              ＋ New Event
            </button>
          )}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button 
                onClick={() => setShowSettings(true)}
                style={{ 
                  padding: "8px 12px", 
                  borderRadius: 8, 
                  border: "1px solid rgba(255,255,255,0.15)", 
                  background: "rgba(255,255,255,0.05)", 
                  color: "#ddd", 
                  fontSize: 12, 
                  fontWeight: 600, 
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                ⚙️
              </button>
              <button 
                onClick={logout}
                style={{ 
                  padding: "8px 12px", 
                  borderRadius: 8, 
                  border: "1px solid rgba(239,68,68,0.3)", 
                  background: "rgba(239,68,68,0.1)", 
                  color: "#EF4444", 
                  fontSize: 12, 
                  fontWeight: 700, 
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Event Tabs */}
          <div className="event-tabs mobile-only">
            {visibleEvents.map(ev => (
              <button
                key={ev.id}
                className={`event-tab ${activeEvent === ev.id ? "event-tab--active" : "event-tab--inactive"}`}
                onClick={() => handleEventSwitch(ev.id)}
              >
                {ev.name}
              </button>
            ))}
            {isAdmin && (
              <button className="event-tab event-tab--add" onClick={() => setShowAddEvent(true)}>
                ＋ New Event
              </button>
            )}
          </div>

          {/* Desktop Page Title */}
          <div className="desktop-header" style={{ display: "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="desktop-page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon src={VIEW_LABELS[view]?.icon} size={20} /> {VIEW_LABELS[view]?.label}</div>
                <span style={{ fontSize: 12, color: "#555" }}>·</span>
                <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>{currentEvent.name}</span>
                <span style={{ fontSize: 11, color: "#555" }}>{currentEvent.location}</span>
                {saving && <span style={{ fontSize: 10, color: "#4F46E5", fontWeight: 700, animation: "fadeSlide 0.3s ease" }}>💾 Saving...</span>}
              </div>
              
              {/* Profile Section */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white" }}>
                    {userProfile?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{userProfile?.name || "User"}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>{userProfile?.role || "Staff"}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="header-settings-btn"
                  style={{ 
                    padding: "10px 18px", 
                    borderRadius: 10, 
                    border: "1px solid var(--border-default)", 
                    background: "var(--bg-elevated)", 
                    color: "var(--text-primary)", 
                    fontSize: 13, 
                    fontWeight: 600, 
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 40
                  }}
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </button>
                <button 
                  onClick={logout}
                  className="header-logout-btn"
                  style={{ 
                    padding: "10px 18px", 
                    borderRadius: 10, 
                    border: "1px solid rgba(239,68,68,0.3)", 
                    background: "rgba(239,68,68,0.1)", 
                    color: "#EF4444", 
                    fontSize: 13, 
                    fontWeight: 600, 
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 40
                  }}
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
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
              title={item.label}
            >
              <Icon src={item.icon} size={18} />
              <span className="nav-btn__label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ── PAGE CONTENT ── */}
        <div className="page-content">

          {/* ══════ DASHBOARD ══════ */}
          {view === "dashboard" && (
            <div>
              {visibleEvents.length === 0 ? (
                <div className="empty-state" style={{ padding: "60px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    {isAdmin || canManageEvents ? "No Events Yet" : "No Events Assigned"}
                  </div>
                  <div style={{ color: "#666", marginBottom: 16 }}>
                    {isAdmin 
                      ? "Create your first event to start tracking expenses"
                      : "Contact your admin to get assigned to events"}
                  </div>
                  {isAdmin && (
                    <button onClick={() => setShowAddEvent(true)} style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: "#4F46E5", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      ＋ Create First Event
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Budget Card */}
                  <div className="budget-card">
                    <div className="budget-card__header">
                      {currentEvent.name} <span style={{ color: "var(--text-subtle)", fontWeight: 400 }}>· {currentEvent.location}</span>
                    </div>
                    <div className="budget-card__stats">
                      <div>
                        <div className="budget-card__label">Total Spent</div>
                        <div className="budget-card__amount"><AnimatedNumber value={totalSpent} /></div>
                      </div>
                      <div className="budget-card__budget-col" style={{ textAlign: "center" }}>
                        <div className="budget-card__label">Budget</div>
                        <div className="budget-card__amount" style={{ color: "var(--text-secondary)" }}>{formatINR(currentEvent.budget)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="budget-card__label">{remaining >= 0 ? "Remaining" : "Over Budget"}</div>
                        <div className="budget-card__amount" style={{ color: remaining > 0 ? "#22C55E" : "#EF4444" }}><AnimatedNumber value={Math.abs(remaining)} /></div>
                      </div>
                    </div>
                    <div className="budget-progress">
                      <div className="budget-progress__bar-bg">
                        <div className="budget-progress__bar-fill" style={{
                          background: spentPct > 80 ? "#F59E0B" : "#22C55E",
                          width: `${spentPct}%`,
                        }} />
                      </div>
                      <div className="budget-card__budget-mobile">
                        Budget: {formatINR(currentEvent.budget)}
                      </div>
                    </div>
                  </div>

                  {/* Payment Mode Summary */}
                  {payBreakdown.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="section-title">💳 By Payment Mode</div>
                      <div className="category-grid">
                        {payBreakdown.map(pm => {
                          const pmExpenses = eventExpenses.filter(e => e.payMode === pm.id);
                          const isExpanded = expandedPayment === pm.id;
                          return (
                            <div 
                              key={pm.id}
                              className="category-card" 
                              onClick={() => setExpandedPayment(isExpanded ? null : pm.id)}
                              style={{ 
                                border: `1px solid ${isExpanded ? pm.color : 'var(--border-default)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ fontSize: 20 }}><Icon src={pm.icon} size={22} color={pm.color} /></div>
                              <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2, fontWeight: 700 }}>{pm.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)", marginTop: 3 }}>{formatINR(pm.total)}</div>
                              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                                {pmExpenses.length} {isExpanded ? '▲' : '▼'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Expanded Payment Expenses */}
                      {expandedPayment && (
                        <div style={{ marginTop: 12 }}>
                          {eventExpenses.filter(e => e.payMode === expandedPayment).map((exp, i) => (
                            <ExpenseRow key={exp.id} exp={exp} index={i} onDelete={handleDelete} onEdit={openEditExpense} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category Grid */}
                  {categoryBreakdown.some(c => c.total > 0) && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="section-title">📊 By Category</div>
                      <div className="category-grid">
                        {categoryBreakdown.filter(c => c.total > 0).map(cat => {
                          const catExpenses = eventExpenses.filter(e => e.category === cat.id);
                          const isExpanded = expandedCategory === cat.id;
                          return (
                            <div 
                              key={cat.id}
                              className="category-card" 
                              onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                              style={{ 
                                border: `1px solid ${isExpanded ? cat.color : 'var(--border-default)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ fontSize: 20 }}><Icon src={cat.icon} size={22} color={cat.color} /></div>
                              <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{cat.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>{formatINR(cat.total)}</div>
                              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                                {catExpenses.length} {isExpanded ? '▲' : '▼'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Expanded Category Expenses */}
                      {expandedCategory && (
                        <div style={{ marginTop: 12 }}>
                          {eventExpenses.filter(e => e.category === expandedCategory).map((exp, i) => (
                            <ExpenseRow key={exp.id} exp={exp} index={i} onDelete={handleDelete} onEdit={openEditExpense} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expense List - Show all when nothing is expanded */}
                  {!expandedPayment && !expandedCategory && (
                    <>
                      {filteredExpenses.length === 0 ? (
                        <div className="empty-state">
                          {eventExpenses.length === 0 ? "No expenses logged yet." : "No expenses found."}<br />
                          <span style={{ color: "#4F46E5", cursor: "pointer", fontWeight: 700, fontSize: 12 }} onClick={() => setView("add")}>+ Add expense</span>
                        </div>
                      ) : (
                        <>
                          <div className="section-title" style={{ marginBottom: 12 }}>All Expenses</div>
                          {filteredExpenses.map((exp, i) => (
                            <ExpenseRow key={exp.id} exp={exp} index={i} onDelete={handleDelete} onEdit={openEditExpense} />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══════ ADD EXPENSE ══════ */}
          {view === "add" && (
            <div>
              <div className="form-title">Log Expense</div>

              {visibleEvents.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Create an event first!</div>
                  {isAdmin ? (
                    <button onClick={() => setShowAddEvent(true)} style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: "#4F46E5", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      ＋ Create Event
                    </button>
                  ) : (
                    <div style={{ color: "#666" }}>Contact your admin to get assigned to events</div>
                  )}
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
                    <div className="section-title">Payment Mode</div>
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
                        {(isAdmin || canManageEvents) && (
                          <button onClick={() => setShowAddStaff(true)} style={{ fontSize: 10, fontWeight: 700, color: "#4F46E5", background: "rgba(79,70,229,0.15)", border: "none", borderRadius: 8, padding: "3px 10px", cursor: "pointer" }}>+ Add Staff</button>
                        )}
                      </div>
                      
                      {/* Staff: Show read-only input with their name */}
                      {userProfile?.role === "staff" ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          value={userProfile.name} 
                          readOnly 
                          style={{ background: "rgba(255,255,255,0.03)", cursor: "not-allowed", color: "#888" }}
                        />
                      ) : (
                        /* Admin/Manager: Show dropdown to select staff */
                        <StyledSelect value={form.addedBy} onChange={e => setForm(f => ({ ...f, addedBy: e.target.value }))}>
                          <option value="">— Select staff member —</option>
                          {staffNames.map(s => <option key={s} value={s}>{s}</option>)}
                        </StyledSelect>
                      )}
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
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} — {ev.location}</option>)}
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

              {visibleEvents.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>
                  {isAdmin || canManageEvents ? "No events to report on yet." : "No events assigned to you yet."}
                </div>
              ) : (
                <>
                  {/* Event Selector */}
                  <div className="form-field" style={{ marginBottom: 20 }}>
                    <label className="form-label">Select Event</label>
                    <StyledSelect value={reportEvent || ""} onChange={e => setReportEvent(e.target.value)}>
                      {visibleEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name} — {ev.location}</option>)}
                    </StyledSelect>
                  </div>

                  {/* Summary Card */}
                  <div className="report-summary-card">
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{repEvent.name}</div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>{repEvent.location} · {repEvent.date}</div>
                    <div className="report-summary__stats">
                      <div><div style={{ fontSize: 10, color: "#888" }}>Spent</div><div style={{ fontSize: 20, fontWeight: 900, color: "#E5E7EB" }}>{formatINR(repSpent)}</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: "#888" }}>Budget</div><div style={{ fontSize: 20, fontWeight: 900, color: "#aaa" }}>{formatINR(repEvent.budget)}</div></div>
                      <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "#888" }}>{repEvent.budget - repSpent >= 0 ? "Saved" : "Over"}</div><div style={{ fontSize: 20, fontWeight: 900, color: repEvent.budget - repSpent >= 0 ? "#22C55E" : "#EF4444" }}>{formatINR(Math.abs(repEvent.budget - repSpent))}</div></div>
                    </div>
                    <div style={{ marginTop: 10, background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 5 }}>
                      <div style={{ height: 5, borderRadius: 4, background: repPct > 85 ? "#F59E0B" : "#22C55E", width: `${repPct}%`, transition: "width 0.6s ease" }} />
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
                          <div className="category-grid">
                            {repPayBreak.map(pm => (
                              <div key={pm.id} className="category-card" style={{ border: `1px solid ${pm.color}33` }}>
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
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{name[0].toUpperCase()}</div>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{name}</span>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 800, color: "#E5E7EB" }}>{formatINR(total)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Export */}
                      <div className="report-export-row">
                        <button onClick={exportCSV} className="report-export-btn" style={{ background: "rgba(79,70,229,0.15)", color: "#4F46E5" }}>
                          📊 Download CSV
                        </button>
                        <button onClick={exportPDF} className="report-export-btn" style={{ background: "rgba(79,70,229,0.15)", color: "#4F46E5" }}>
                          📑 Export PDF
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══════ REGISTRATION REQUESTS (Admin/Manager) ══════ */}
          {view === "requests" && (isAdmin || canApproveStaff) && (
            <div>
              <div className="form-title">Registration Requests</div>
              <div className="form-subtitle">
                {isAdmin ? "Approve or reject user registration requests" : "Approve or reject staff registration requests"}
              </div>

              {/* Pending Requests */}
              <div style={{ marginBottom: 24 }}>
                <div className="section-title">⏳ Pending Requests</div>
                {registrationRequests.filter(r => r.status === "pending").length === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>No Pending Requests</div>
                    <div style={{ color: "#666" }}>All registration requests have been processed</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {registrationRequests.filter(r => r.status === "pending").map((request, idx) => {
                      const roleColor = request.requestedRole === "manager" ? "#4F46E5" : "#22C55E";
                      const timeStr = request.createdAt?.toDate ? new Date(request.createdAt.toDate()).toLocaleString("en-IN", { 
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                      }) : "Unknown time";

                      return (
                        <div key={request.id} style={{ 
                          background: "rgba(255,255,255,0.04)", 
                          border: "1px solid rgba(255,255,255,0.08)", 
                          borderRadius: 14, 
                          padding: 16,
                          animation: `fadeSlide 0.3s ease ${idx * 0.05}s both`
                        }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                            <div style={{ 
                              width: 48, 
                              height: 48, 
                              borderRadius: "50%", 
                              background: roleColor, 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              fontSize: 20, 
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              {request.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{request.name}</div>
                              <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>{request.email}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div style={{ 
                                  display: "inline-block",
                                  padding: "4px 10px", 
                                  borderRadius: 10, 
                                  background: `${roleColor}22`, 
                                  color: roleColor, 
                                  fontSize: 11, 
                                  fontWeight: 800,
                                  textTransform: "uppercase"
                                }}>
                                  {request.requestedRole}
                                </div>
                                <div style={{ fontSize: 11, color: "#555" }}>· {timeStr}</div>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleApproveRequest(request)}
                              disabled={saving}
                              style={{
                                flex: 1,
                                padding: "10px 16px",
                                borderRadius: 10,
                                border: "none",
                                background: "#22C55E",
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                opacity: saving ? 0.6 : 1,
                                transition: "transform 0.15s"
                              }}
                              onMouseEnter={(e) => !saving && (e.currentTarget.style.transform = "translateY(-1px)")}
                              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt("Rejection reason (optional):");
                                if (reason !== null) {
                                  handleRejectRequest(request, reason);
                                }
                              }}
                              disabled={saving}
                              style={{
                                flex: 1,
                                padding: "10px 16px",
                                borderRadius: 10,
                                border: "1px solid rgba(239,68,68,0.3)",
                                background: "rgba(239,68,68,0.1)",
                                color: "#EF4444",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                opacity: saving ? 0.6 : 1,
                                transition: "all 0.15s"
                              }}
                              onMouseEnter={(e) => !saving && (e.currentTarget.style.background = "rgba(230,57,70,0.15)")}
                              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(230,57,70,0.1)"}
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Processed Requests */}
              {registrationRequests.filter(r => r.status !== "pending").length > 0 && (
                <div>
                  <div className="section-title">📋 Processed Requests</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {registrationRequests.filter(r => r.status !== "pending").slice(0, 10).map((request) => {
                      const isApproved = request.status === "approved";
                      const statusColor = isApproved ? "#22C55E" : "#EF4444";
                      const timeStr = request.createdAt?.toDate ? new Date(request.createdAt.toDate()).toLocaleString("en-IN", { 
                        month: "short", day: "numeric" 
                      }) : "Unknown";

                      return (
                        <div key={request.id} style={{ 
                          background: "rgba(255,255,255,0.02)", 
                          border: `1px solid ${statusColor}22`, 
                          borderRadius: 10, 
                          padding: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 12
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{request.name}</div>
                            <div style={{ fontSize: 11, color: "#666" }}>{request.email} · {request.requestedRole}</div>
                          </div>
                          <div style={{ 
                            padding: "4px 10px", 
                            borderRadius: 8, 
                            background: `${statusColor}22`, 
                            color: statusColor, 
                            fontSize: 10, 
                            fontWeight: 800,
                            textTransform: "uppercase",
                            flexShrink: 0
                          }}>
                            {request.status}
                          </div>
                          <div style={{ fontSize: 10, color: "#555", flexShrink: 0 }}>{timeStr}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════ USERS (Admin/Manager) ══════ */}
          {view === "users" && (isAdmin || canManageEvents) && (
            <div>
              <div className="form-title">User Management</div>
              <div className="form-subtitle">
                {isAdmin ? "Manage team roles and permissions" : "Assign events to your team"}
              </div>
              {allUsers.length === 0 ? (
                <div className="empty-state">No registered users found.</div>
              ) : (
                <div>
                  {allUsers
                    .filter(u => isAdmin || u.role === "staff") // Managers only see staff
                    .map((u) => {
                    const roleColor = u.role === "admin" ? "#EF4444" : u.role === "manager" ? "#4F46E5" : "#22C55E";
                    const assignedEventNames = (u.assignedEvents || [])
                      .map(eid => events.find(e => e.id === eid)?.name)
                      .filter(Boolean);
                    
                    // For managers, only show events they have access to
                    const availableEventsForAssignment = isAdmin ? events : visibleEvents;
                    
                    return (
                      <div key={u.id} style={{
                        background: "rgba(255,255,255,0.04)", borderRadius: 12, marginBottom: 12,
                        border: "1px solid rgba(255,255,255,0.06)", padding: "16px", transition: "background 0.2s",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                            {u.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "Unknown"}</div>
                            <div style={{ fontSize: 11, color: "#555" }}>{u.email}</div>
                          </div>
                          <span style={{ padding: "4px 10px", borderRadius: 12, background: `${roleColor}22`, color: roleColor, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>{u.role}</span>
                        </div>

                        {/* Role Management (Admin only) */}
                        {isAdmin && u.id !== userProfile?.id && (
                          <div style={{ marginBottom: 12 }}>
                            <label className="form-label" style={{ marginBottom: 6 }}>Change Role</label>
                            <StyledSelect value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value)}>
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="staff">Staff</option>
                            </StyledSelect>
                          </div>
                        )}

                        {/* Event Assignment (Admin can assign to anyone, Manager can assign to staff) */}
                        {((isAdmin && (u.role === "manager" || u.role === "staff")) || 
                          (canManageEvents && u.role === "staff")) && (
                          <div>
                            <label className="form-label" style={{ marginBottom: 6 }}>Assigned Events ({assignedEventNames.length})</label>
                            {assignedEventNames.length > 0 ? (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                                {assignedEventNames.map(name => (
                                  <span key={name} style={{ padding: "4px 10px", borderRadius: 12, background: "rgba(79,70,229,0.15)", color: "#4F46E5", fontSize: 10, fontWeight: 700 }}>{name}</span>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>No events assigned</div>
                            )}
                            <div style={{ display: "flex", gap: 8 }}>
                              <button 
                                onClick={() => openAssignModal(u)}
                                style={{ flex: 1, padding: "8px 16px", borderRadius: 10, border: "none", background: "rgba(79,70,229,0.15)", color: "#4F46E5", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                              >
                                📋 Manage Event Access
                              </button>
                              {/* Delete User (Admin only, cannot delete self) */}
                              {isAdmin && u.id !== userProfile?.id && (
                                <button 
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  disabled={saving}
                                  style={{ 
                                    flex: 1,
                                    padding: "8px 16px", 
                                    borderRadius: 10, 
                                    border: "none", 
                                    background: "rgba(239,68,68,0.15)", 
                                    color: "#EF4444", 
                                    fontSize: 12, 
                                    fontWeight: 700, 
                                    cursor: saving ? "not-allowed" : "pointer", 
                                    fontFamily: "inherit", 
                                    transition: "all 0.2s",
                                    opacity: saving ? 0.5 : 1
                                  }}
                                >
                                  🗑️ Delete User
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 16, padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>
                      <strong style={{ color: "#EF4444" }}>Admin</strong> — Full access + user management<br />
                      <strong style={{ color: "#4F46E5" }}>Manager</strong> — Create events, manage team & expenses<br />
                      <strong style={{ color: "#22C55E" }}>Staff</strong> — Log expenses & view reports
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════ EVENTS (Admin Only) ══════ */}
          {view === "events" && isAdmin && (
            <div>
              <div className="form-title">Event Management</div>
              <div className="form-subtitle">Create, edit, and manage all events</div>

              <button 
                onClick={() => setShowAddEvent(true)}
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  borderRadius: 12, 
                  border: "none", 
                  background: "#4F46E5", 
                  color: "#fff", 
                  fontSize: 14, 
                  fontWeight: 800, 
                  cursor: "pointer", 
                  fontFamily: "inherit",
                  marginBottom: 20
                }}
              >
                ＋ Create New Event
              </button>

              {events.length === 0 ? (
                <div className="empty-state">No events created yet.</div>
              ) : (
                <div>
                  {events.map((event, idx) => {
                    const eventExpenses = expenses.filter(e => e.eventId === event.id);
                    const spent = eventExpenses.reduce((s, e) => s + e.amount, 0);
                    const pct = event.budget > 0 ? Math.min(100, (spent / event.budget) * 100) : 0;
                    const assignedUsers = allUsers.filter(u => u.assignedEvents?.includes(event.id));
                    
                    return (
                      <div 
                        key={event.id} 
                        className="bg-subtle"
                        style={{
                          borderRadius: 14, 
                          padding: "18px", 
                          marginBottom: 12,
                          border: "1px solid var(--border-default)",
                          animation: `fadeSlide 0.3s ease ${idx * 0.05}s both`
                        }}
                      >
                        {/* Event Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: "var(--text-primary)" }}>{event.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                              <span>📍 {event.location}</span>
                              <span>📅 {event.date}</span>
                              <span>💰 Budget: {formatINR(event.budget)}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button 
                              onClick={() => openEditEvent(event)}
                              style={{ 
                                padding: "6px 12px", 
                                borderRadius: 8, 
                                border: "1px solid var(--border-default)", 
                                background: "var(--bg-elevated)", 
                                color: "var(--text-secondary)", 
                                fontSize: 11, 
                                fontWeight: 700, 
                                cursor: "pointer",
                                fontFamily: "inherit"
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event.id, event.name)}
                              style={{ 
                                padding: "6px 12px", 
                                borderRadius: 8, 
                                border: "1px solid rgba(239,68,68,0.3)", 
                                background: "rgba(239,68,68,0.15)", 
                                color: "#EF4444", 
                                fontSize: 11, 
                                fontWeight: 700, 
                                cursor: "pointer",
                                fontFamily: "inherit"
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>

                        {/* Budget Progress */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Spent: {formatINR(spent)}</span>
                            <span style={{ fontSize: 11, color: pct > 85 ? "#F59E0B" : "#22C55E", fontWeight: 700 }}>{pct.toFixed(1)}%</span>
                          </div>
                          <div style={{ background: "var(--bg-elevated)", borderRadius: 4, height: 6 }}>
                            <div style={{ 
                              height: 6, 
                              borderRadius: 4, 
                              background: pct > 85 ? "#F59E0B" : "#22C55E", 
                              width: `${pct}%`, 
                              transition: "width 0.6s ease" 
                            }} />
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                          <div style={{ flex: 1, background: "var(--bg-elevated)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Expenses</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{eventExpenses.length}</div>
                          </div>
                          <div style={{ flex: 1, background: "var(--bg-elevated)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Assigned Users</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{assignedUsers.length}</div>
                          </div>
                          <div style={{ flex: 1, background: "var(--bg-elevated)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Remaining</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: event.budget - spent >= 0 ? "#22C55E" : "#EF4444" }}>
                              {formatINR(Math.abs(event.budget - spent))}
                            </div>
                          </div>
                        </div>

                        {/* Assigned Users */}
                        {assignedUsers.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Assigned To</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {assignedUsers.map(u => (
                                <span 
                                  key={u.id} 
                                  style={{ 
                                    padding: "4px 10px", 
                                    borderRadius: 12, 
                                    background: u.role === "manager" ? "rgba(79,70,229,0.15)" : "rgba(34,197,94,0.15)", 
                                    color: u.role === "manager" ? "#4F46E5" : "#22C55E", 
                                    fontSize: 10, 
                                    fontWeight: 700 
                                  }}
                                >
                                  {u.name} ({u.role})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════ ANALYTICS (Admin Only) ══════ */}
          {view === "analytics" && isAdmin && (
            <div>
              <div className="form-title">Admin Analytics</div>
              <div className="form-subtitle">System-wide insights and activity logs</div>

              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Total Events</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)" }}>{events.length}</div>
                </div>
                <div style={{ background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Total Expenses</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)" }}>{expenses.length}</div>
                </div>
                <div style={{ background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Total Users</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)" }}>{allUsers.length}</div>
                </div>
                <div style={{ background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Total Spent</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)" }}>{formatINR(expenses.reduce((s, e) => s + e.amount, 0))}</div>
                </div>
              </div>

              {/* Event Performance */}
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">📊 Event Performance</div>
                {events.map(event => {
                  const eventExpenses = expenses.filter(e => e.eventId === event.id);
                  const spent = eventExpenses.reduce((s, e) => s + e.amount, 0);
                  const pct = event.budget > 0 ? Math.min(100, (spent / event.budget) * 100) : 0;
                  return (
                    <div key={event.id} className="bg-subtle" style={{ borderRadius: 12, padding: 14, marginBottom: 8, border: "1px solid var(--border-default)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{event.name}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{event.location} · {event.date}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{formatINR(spent)}</div>
                          <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>of {formatINR(event.budget)}</div>
                        </div>
                      </div>
                      <div style={{ background: "var(--bg-elevated)", borderRadius: 4, height: 6 }}>
                        <div style={{ height: 6, borderRadius: 4, background: pct > 85 ? "#F59E0B" : "#22C55E", width: `${pct}%`, transition: "width 0.6s ease" }} />
                      </div>
                      <div style={{ fontSize: 10, color: pct > 85 ? "#F59E0B" : "#22C55E", marginTop: 4, fontWeight: 700 }}>{pct.toFixed(1)}% used · {eventExpenses.length} expenses</div>
                    </div>
                  );
                })}
              </div>

              {/* User Activity */}
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">👥 User Breakdown</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                  {["admin", "manager", "staff"].map(role => {
                    const count = allUsers.filter(u => u.role === role).length;
                    const color = role === "admin" ? "#EF4444" : role === "manager" ? "#4F46E5" : "#22C55E";
                    return (
                      <div key={role} style={{ background: `${color}15`, border: `1px solid ${color}33`, borderRadius: 10, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{role}s</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color }}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Logs */}
              <div>
                <div className="section-title">📝 Recent Activity (Last 20)</div>
                {activityLogs.length === 0 ? (
                  <div className="empty-state">No activity logs yet</div>
                ) : (
                  <div>
                    {activityLogs.slice(0, 20).map((log, idx) => {
                      const actionColors = {
                        expense_added: "#22C55E",
                        expense_edited: "#9CA3AF",
                        expense_deleted: "#EF4444",
                        event_created: "#4F46E5",
                        role_changed: "#9CA3AF",
                        events_assigned: "#4F46E5",
                        staff_assigned: "#22C55E",
                      };
                      const color = actionColors[log.action] || "#888";
                      const timeStr = log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString("en-IN", { 
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                      }) : "Unknown time";

                      return (
                        <div key={log.id || idx} className="bg-subtle" style={{ 
                          borderRadius: 10, padding: "10px 12px", 
                          marginBottom: 6, border: `1px solid ${color}22`, display: "flex", alignItems: "center", gap: 10,
                          animation: `fadeSlide 0.3s ease ${idx * 0.02}s both`
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{log.details}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                              {log.userName} ({log.userRole}) · {timeStr}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
          <button onClick={handleAddEvent} disabled={saving} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#4F46E5", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", marginTop: 4, fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
            {saving ? "💾 Creating..." : "🎉 Create Event"}
          </button>
        </Modal>
      )}

      {/* ── EDIT EVENT MODAL ── */}
      {showEditEvent && editingEvent && (
        <Modal title="✏️ Edit Event" onClose={() => { setShowEditEvent(false); setEditingEvent(null); setEventForm({ name: "", location: "", budget: "", date: "", assignedManager: "" }); }}>
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
          <button onClick={handleEditEvent} disabled={saving} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#4F46E5", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", marginTop: 4, fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
            {saving ? "💾 Updating..." : "✅ Update Event"}
          </button>
        </Modal>
      )}

      {/* ── EDIT EXPENSE MODAL ── */}
      {showEditExpense && editingExpense && (
        <Modal title="✏️ Edit Expense" onClose={() => { setShowEditExpense(false); setEditingExpense(null); setForm({ category: "travel", payMode: "upi", desc: "", amount: "", addedBy: "", note: "" }); }}>
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
            <div className="section-title">Payment Mode</div>
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
              <label className="form-label">Logged By *</label>
              {userProfile?.role === "staff" ? (
                <input 
                  type="text" 
                  className="form-input" 
                  value={userProfile.name} 
                  readOnly 
                  style={{ background: "rgba(255,255,255,0.03)", cursor: "not-allowed", color: "#888" }}
                />
              ) : (
                <StyledSelect value={form.addedBy} onChange={e => setForm(f => ({ ...f, addedBy: e.target.value }))}>
                  <option value="">— Select staff member —</option>
                  {staffNames.map(s => <option key={s} value={s}>{s}</option>)}
                </StyledSelect>
              )}
            </div>
            <div className="form-field">
              <label className="form-label">Note (optional)</label>
              <input type="text" className="form-input" placeholder="e.g. Vendor bill no. 211" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
          </div>

          <button onClick={handleEditExpense} disabled={saving} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#4F46E5", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", marginTop: 4, fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
            {saving ? "💾 Updating..." : "✅ Update Expense"}
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
          <button onClick={handleAddStaff} disabled={saving} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#4F46E5", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
            {saving ? "💾 Adding..." : "✅ Add to Team"}
          </button>
        </Modal>
      )}

      {/* ── ASSIGN EVENTS MODAL ── */}
      {showAssignModal && assigningUser && (
        <Modal title={`📋 Assign Events to ${assigningUser.name}`} onClose={() => { setShowAssignModal(false); setAssigningUser(null); setSelectedEvents([]); }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
              Select which events {assigningUser.name} can access. {isAdmin ? "As admin, you can assign any event." : "As manager, you can assign your events."}
            </div>
            
            {/* Available events based on role */}
            {(isAdmin ? events : visibleEvents).length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 0" }}>
                {isAdmin ? "No events created yet." : "You don't have any events to assign."}
              </div>
            ) : (
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {(isAdmin ? events : visibleEvents).map(event => {
                  const isSelected = selectedEvents.includes(event.id);
                  return (
                    <div 
                      key={event.id}
                      onClick={() => toggleEventSelection(event.id)}
                      style={{
                        padding: "12px 14px",
                        marginBottom: 8,
                        borderRadius: 10,
                        background: isSelected ? "rgba(79,70,229,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${isSelected ? "#4F46E5" : "rgba(255,255,255,0.08)"}`,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                      }}
                    >
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: `2px solid ${isSelected ? "#4F46E5" : "#555"}`,
                        background: isSelected ? "#4F46E5" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s"
                      }}>
                        {isSelected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#4F46E5" : "#ddd" }}>
                          {event.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                          {event.location} · {event.date} · Budget: {formatINR(event.budget)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button 
              onClick={() => { setShowAssignModal(false); setAssigningUser(null); setSelectedEvents([]); }}
              style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#aaa", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancel
            </button>
            <button 
              onClick={() => handleAssignEvents(assigningUser.id, selectedEvents)}
              disabled={saving}
              style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "#4F46E5", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "💾 Saving..." : `✅ Assign ${selectedEvents.length} Event${selectedEvents.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </Modal>
      )}

      {/* ── SETTINGS MODAL ── */}
      {showSettings && (
        <Modal title="⚙️ Settings" onClose={() => setShowSettings(false)}>
          <div style={{ marginBottom: 16 }}>
            {/* Profile Section */}
            <div style={{ marginBottom: 20, padding: "16px", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="section-title" style={{ marginBottom: 10 }}>Profile Information</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
                  {userProfile?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userProfile?.name || "User"}</div>
                  <div style={{ fontSize: 11, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userProfile?.email || ""}</div>
                  <div style={{ 
                    display: "inline-block",
                    marginTop: 4,
                    padding: "3px 8px", 
                    borderRadius: 10, 
                    background: userProfile?.role === "admin" ? "rgba(239,68,68,0.2)" : userProfile?.role === "manager" ? "rgba(79,70,229,0.2)" : "rgba(34,197,94,0.2)", 
                    color: userProfile?.role === "admin" ? "#EF4444" : userProfile?.role === "manager" ? "#4F46E5" : "#22C55E", 
                    fontSize: 9, 
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.5
                  }}>
                    {userProfile?.role || "Staff"}
                  </div>
                </div>
              </div>
            </div>

            {/* App Settings */}
            <div style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 10 }}>App Preferences</div>
              
              <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>🌙 Dark Mode</div>
                  <div style={{ fontSize: 10, color: "#666" }}>Switch between dark and light theme</div>
                </div>
                <div 
                  onClick={() => {
                    setDarkMode(!darkMode);
                    showToast(darkMode ? "Light mode enabled ☀️" : "Dark mode enabled 🌙", "success");
                  }}
                  className={`toggle-switch ${darkMode ? "toggle-switch--active" : ""}`}
                >
                  <div className="toggle-switch__slider"></div>
                </div>
              </div>

              <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>🔔 Notifications</div>
                  <div style={{ fontSize: 10, color: "#666" }}>Get updates on expenses</div>
                </div>
                <div 
                  onClick={() => {
                    setNotifications(!notifications);
                    showToast(notifications ? "Notifications disabled 🔕" : "Notifications enabled 🔔", "success");
                  }}
                  className={`toggle-switch ${notifications ? "toggle-switch--active" : ""}`}
                >
                  <div className="toggle-switch__slider"></div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div>
              <div className="section-title" style={{ marginBottom: 10 }}>Account</div>
              
              <button 
                onClick={() => {
                  setShowSettings(false);
                  setShowChangePassword(true);
                  setPasswordForm({ current: "", new: "", confirm: "" });
                }}
                style={{ 
                  width: "100%", 
                  padding: "11px 14px", 
                  borderRadius: 10, 
                  border: "1px solid rgba(255,255,255,0.1)", 
                  background: "rgba(255,255,255,0.05)", 
                  color: "#ddd", 
                  fontSize: 13, 
                  fontWeight: 600, 
                  cursor: "pointer", 
                  fontFamily: "inherit",
                  marginBottom: 8,
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                <span style={{ fontSize: 16 }}>🔐</span>
                <span>Change Password</span>
              </button>

              <button 
                onClick={() => {
                  setShowSettings(false);
                  setShowEditProfile(true);
                  setProfileForm({ name: userProfile?.name || "" });
                }}
                style={{ 
                  width: "100%", 
                  padding: "11px 14px", 
                  borderRadius: 10, 
                  border: "1px solid rgba(255,255,255,0.1)", 
                  background: "rgba(255,255,255,0.05)", 
                  color: "#ddd", 
                  fontSize: 13, 
                  fontWeight: 600, 
                  cursor: "pointer", 
                  fontFamily: "inherit",
                  marginBottom: 8,
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                <span style={{ fontSize: 16 }}>✏️</span>
                <span>Edit Profile</span>
              </button>

              <button 
                onClick={() => {
                  setShowSettings(false);
                  logout();
                }}
                style={{ 
                  width: "100%", 
                  padding: "11px 14px", 
                  borderRadius: 10, 
                  border: "1px solid rgba(239,68,68,0.3)", 
                  background: "rgba(239,68,68,0.1)", 
                  color: "#EF4444", 
                  fontSize: 13, 
                  fontWeight: 700, 
                  cursor: "pointer", 
                  fontFamily: "inherit",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
              >
                <span style={{ fontSize: 16 }}>🚪</span>
                <span>Logout</span>
              </button>
            </div>

            {/* Danger Zone (Admin Only) */}
            {isAdmin && (
              <div style={{ marginTop: 20, padding: 14, background: "rgba(239,68,68,0.08)", borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)" }}>
                <div className="section-title" style={{ marginBottom: 8, color: "#EF4444" }}>⚠️ Danger Zone</div>
                <div style={{ fontSize: 10, color: "#999", marginBottom: 10, lineHeight: 1.5 }}>
                  These actions are irreversible. Use with extreme caution.
                </div>
                
                <button 
                  onClick={handleDeleteAllData}
                  disabled={saving}
                  style={{ 
                    width: "100%", 
                    padding: "12px 16px", 
                    borderRadius: 10, 
                    border: "1px solid rgba(239,68,68,0.5)", 
                    background: "rgba(239,68,68,0.15)", 
                    color: "#EF4444", 
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: saving ? "not-allowed" : "pointer", 
                    fontFamily: "inherit",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transition: "all 0.2s",
                    opacity: saving ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => !saving && (e.currentTarget.style.background = "rgba(239,68,68,0.25)")}
                  onMouseLeave={(e) => !saving && (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                >
                  <span style={{ fontSize: 16 }}>🗑️</span>
                  <span>Delete All Database Data</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>EventXpense v2.2</div>
            <div style={{ fontSize: 10, color: "#555" }}>Team Expense Management System</div>
          </div>
        </Modal>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showChangePassword && (
        <Modal title="🔐 Change Password" onClose={() => setShowChangePassword(false)}>
          <div className="form-field">
            <label className="form-label">Current Password *</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter current password" 
              value={passwordForm.current} 
              onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))} 
              style={{ colorScheme: "dark" }}
            />
          </div>
          <div className="form-field">
            <label className="form-label">New Password *</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="At least 6 characters" 
              value={passwordForm.new} 
              onChange={e => setPasswordForm(f => ({ ...f, new: e.target.value }))} 
              style={{ colorScheme: "dark" }}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Confirm New Password *</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Re-enter new password" 
              value={passwordForm.confirm} 
              onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} 
              style={{ colorScheme: "dark" }}
            />
          </div>
          <button 
            onClick={handleChangePassword} 
            disabled={saving} 
            style={{ 
              width: "100%", 
              padding: "14px", 
              borderRadius: 12, 
              border: "none", 
              background: "#4F46E5", 
              color: "#fff", 
              fontSize: 14, 
              fontWeight: 800, 
              cursor: "pointer", 
              marginTop: 4, 
              fontFamily: "inherit", 
              opacity: saving ? 0.6 : 1 
            }}
          >
            {saving ? "💾 Updating..." : "✅ Change Password"}
          </button>
        </Modal>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditProfile && (
        <Modal title="✏️ Edit Profile" onClose={() => setShowEditProfile(false)}>
          <div className="form-field">
            <label className="form-label">Full Name *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter your name" 
              value={profileForm.name} 
              onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} 
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 16, padding: 12, background: "rgba(79,70,229,0.1)", borderRadius: 10, border: "1px solid rgba(79,70,229,0.2)" }}>
            <div style={{ fontSize: 11, color: "#4F46E5", fontWeight: 700, marginBottom: 4 }}>📧 Email: {userProfile?.email}</div>
            <div style={{ fontSize: 10, color: "#888" }}>Email cannot be changed</div>
          </div>
          <button 
            onClick={handleUpdateProfile} 
            disabled={saving} 
            style={{ 
              width: "100%", 
              padding: "14px", 
              borderRadius: 12, 
              border: "none", 
              background: "#4F46E5", 
              color: "#fff", 
              fontSize: 14, 
              fontWeight: 800, 
              cursor: "pointer", 
              fontFamily: "inherit", 
              opacity: saving ? 0.6 : 1 
            }}
          >
            {saving ? "💾 Saving..." : "✅ Update Profile"}
          </button>
        </Modal>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="toast" style={{
          background: toast.type === "error" ? "#EF4444" : "#1A2E1A",
          border: `1px solid ${toast.type === "error" ? "#EF4444" : "#22C55E"}`,
          color: "#fff",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}