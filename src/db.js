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
} from "firebase/firestore";
import { db } from "./firebase";

// ── Collection References ─────────────────────────────────────
const eventsCol = collection(db, "events");
const expensesCol = collection(db, "expenses");
const staffCol = collection(db, "staff");

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