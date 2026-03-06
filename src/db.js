// ══════════════════════════════════════════════════════════════
//  Firestore Database Service Layer
//  ──────────────────────────────────────────────────────────────
//  All Firestore CRUD operations for Events, Expenses, and Staff.
//  Uses real-time listeners (onSnapshot) for live data sync.
// ══════════════════════════════════════════════════════════════

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    writeBatch,
    setDoc,
    getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Collection References ─────────────────────────────────────
const eventsCol = collection(db, "events");
const expensesCol = collection(db, "expenses");
const staffCol = collection(db, "staff");
const usersCol = collection(db, "users");

// ══════════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════════

/**
 * Subscribe to real-time events updates.
 * @param {Function} onData - receives array of event objects
 * @param {Function} onError - called on error
 * @returns {Function} unsubscribe function
 */
export function subscribeToEvents(onData, onError) {
    return onSnapshot(eventsCol, (snapshot) => {
        const events = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));
        onData(events);
    }, (error) => {
        console.error("Error subscribing to events:", error);
        if (onError) onError(error);
    });
}

/**
 * Add a new event to Firestore.
 */
export async function addEvent(eventData) {
    const docRef = await addDoc(eventsCol, {
        ...eventData,
        budget: Number(eventData.budget),
        createdBy: eventData.createdBy || null,
        assignedManager: eventData.assignedManager || null,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Update an existing event.
 */
export async function updateEvent(eventId, updates) {
    const docRef = doc(db, "events", eventId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete an event and all its associated expenses.
 */
export async function deleteEvent(eventId, expenses = []) {
    const batch = writeBatch(db);
    const relatedExpenses = expenses.filter((e) => e.eventId === eventId);
    relatedExpenses.forEach((exp) => {
        batch.delete(doc(db, "expenses", exp.id));
    });
    batch.delete(doc(db, "events", eventId));
    await batch.commit();
}

// ══════════════════════════════════════════════════════════════
//  EXPENSES
// ══════════════════════════════════════════════════════════════

/**
 * Subscribe to real-time expenses updates.
 */
export function subscribeToExpenses(onData, onError) {
    return onSnapshot(expensesCol, (snapshot) => {
        const expenses = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));
        onData(expenses);
    }, (error) => {
        console.error("Error subscribing to expenses:", error);
        if (onError) onError(error);
    });
}

/**
 * Add a new expense.
 */
export async function addExpense(expenseData) {
    const docRef = await addDoc(expensesCol, {
        ...expenseData,
        amount: Number(expenseData.amount),
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Update an existing expense.
 */
export async function updateExpense(expenseId, updates) {
    const docRef = doc(db, "expenses", expenseId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Update expense with edit tracking.
 */
export async function updateExpenseWithLog(expenseId, updates, editedBy) {
    const docRef = doc(db, "expenses", expenseId);
    await updateDoc(docRef, {
        ...updates,
        lastEditedBy: editedBy,
        lastEditedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete a single expense.
 */
export async function deleteExpense(expenseId) {
    const docRef = doc(db, "expenses", expenseId);
    await deleteDoc(docRef);
}

// ══════════════════════════════════════════════════════════════
//  STAFF
// ══════════════════════════════════════════════════════════════

/**
 * Subscribe to real-time staff updates.
 */
export function subscribeToStaff(onData, onError) {
    return onSnapshot(staffCol, (snapshot) => {
        const staff = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));
        onData(staff);
    }, (error) => {
        console.error("Error subscribing to staff:", error);
        if (onError) onError(error);
    });
}

/**
 * Add a new staff member.
 */
export async function addStaffMember(name) {
    const docRef = await addDoc(staffCol, {
        name,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Delete a staff member.
 */
export async function deleteStaffMember(staffId) {
    const docRef = doc(db, "staff", staffId);
    await deleteDoc(docRef);
}

// ══════════════════════════════════════════════════════════════
//  SEED DATA — One-time data population
// ══════════════════════════════════════════════════════════════

/**
 * Seeds the database with initial sample data if the collections are empty.
 */
export async function seedInitialData(existingEvents, existingExpenses, existingStaff) {
    if (existingEvents.length > 0 || existingExpenses.length > 0 || existingStaff.length > 0) {
        return false;
    }

    const batch = writeBatch(db);

    const ev1Ref = doc(eventsCol);
    const ev2Ref = doc(eventsCol);
    const ev3Ref = doc(eventsCol);

    batch.set(ev1Ref, { name: "Sharma Wedding", location: "Mumbai", budget: 85000, date: "2026-03-15", createdAt: new Date("2026-03-01") });
    batch.set(ev2Ref, { name: "TechCorp Annual Meet", location: "Pune", budget: 120000, date: "2026-03-22", createdAt: new Date("2026-03-02") });
    batch.set(ev3Ref, { name: "Gupta Reception", location: "Delhi", budget: 60000, date: "2026-04-05", createdAt: new Date("2026-03-03") });

    const expensesData = [
        { eventId: ev1Ref.id, category: "travel", payMode: "card", desc: "Mumbai flight x4", amount: 18400, date: "2026-03-14", addedBy: "Rahul", note: "IndiGo booking ref #IND2234", createdAt: new Date("2026-03-14T10:00:00") },
        { eventId: ev1Ref.id, category: "food", payMode: "upi", desc: "Team hotel 2 nights", amount: 9800, date: "2026-03-14", addedBy: "Priya", note: "Paid via Priya PhonePe", createdAt: new Date("2026-03-14T11:00:00") },
        { eventId: ev1Ref.id, category: "decor", payMode: "cash", desc: "Flower arrangements", amount: 22000, date: "2026-03-15", addedBy: "Rahul", note: "Local vendor, no GST bill", createdAt: new Date("2026-03-15T09:00:00") },
        { eventId: ev2Ref.id, category: "equipment", payMode: "bank", desc: "AV rental", amount: 35000, date: "2026-03-21", addedBy: "Amit", note: "NEFT to SoundPro Pvt Ltd", createdAt: new Date("2026-03-21T10:00:00") },
        { eventId: ev2Ref.id, category: "labour", payMode: "cash", desc: "Setup crew x8", amount: 16000, date: "2026-03-22", addedBy: "Priya", note: "Daily wages paid on site", createdAt: new Date("2026-03-22T08:00:00") },
    ];

    expensesData.forEach((exp) => {
        const expRef = doc(expensesCol);
        batch.set(expRef, exp);
    });

    const staffNames = ["Rahul", "Priya", "Amit"];
    staffNames.forEach((name, i) => {
        const staffRef = doc(staffCol);
        batch.set(staffRef, { name, createdAt: new Date(`2026-01-0${i + 1}`) });
    });

    await batch.commit();
    return true;
}

// ══════════════════════════════════════════════════════════════
//  USER PROFILES
// ══════════════════════════════════════════════════════════════

/**
 * Create a user profile document (keyed by Firebase Auth UID).
 */
export async function createUserProfile(uid, userData) {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
        ...userData,
        assignedEvents: [], // Events assigned to this user
        assignedTo: null, // For staff: manager UID they report to
        createdAt: serverTimestamp(),
    });
}

/**
 * Get a single user profile by UID.
 */
export async function getUserProfile(uid) {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
}

/**
 * Subscribe to real-time updates of all user profiles.
 */
export function subscribeToUsers(onData, onError) {
    return onSnapshot(usersCol, (snapshot) => {
        const users = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));
        onData(users);
    }, (error) => {
        console.error("Error subscribing to users:", error);
        if (onError) onError(error);
    });
}

/**
 * Update a user's role (admin only).
 */
export async function updateUserRole(uid, role) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { role, updatedAt: serverTimestamp() });
}

/**
 * Assign events to a manager or staff member (admin only).
 */
export async function assignEventsToUser(uid, eventIds) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { 
        assignedEvents: eventIds,
        updatedAt: serverTimestamp() 
    });
}

/**
 * Assign staff to a manager (admin only).
 */
export async function assignStaffToManager(staffUid, managerUid) {
    const staffRef = doc(db, "users", staffUid);
    await updateDoc(staffRef, { 
        assignedTo: managerUid,
        updatedAt: serverTimestamp() 
    });
}

/**
 * Update event with creator and assigned manager.
 */
export async function updateEventAssignment(eventId, updates) {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

// ══════════════════════════════════════════════════════════════
//  ACTIVITY LOGS
// ══════════════════════════════════════════════════════════════

const activityLogsCol = collection(db, "activityLogs");

/**
 * Log an activity (expense added, edited, deleted, etc.)
 */
export async function logActivity(activityData) {
    await addDoc(activityLogsCol, {
        ...activityData,
        timestamp: serverTimestamp(),
    });
}

/**
 * Subscribe to activity logs (admin only, with optional filters)
 */
export function subscribeToActivityLogs(onData, onError, limit = 50) {
    return onSnapshot(activityLogsCol, (snapshot) => {
        const logs = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
                const aTime = a.timestamp?.toMillis() || 0;
                const bTime = b.timestamp?.toMillis() || 0;
                return bTime - aTime;
            })
            .slice(0, limit);
        onData(logs);
    }, (error) => {
        console.error("Error subscribing to activity logs:", error);
        if (onError) onError(error);
    });
}