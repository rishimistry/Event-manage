// ══════════════════════════════════════════════════════════════
//  Firebase Configuration & Initialization
//  ──────────────────────────────────────────────────────────────
//  Project credentials from the Firebase Console.
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA6zTycdMSBvXDP_WREGKYJ9C-c6ew6rqg",
    authDomain: "event-manage-40cad.firebaseapp.com",
    projectId: "event-manage-40cad",
    storageBucket: "event-manage-40cad.firebasestorage.app",
    messagingSenderId: "255778710355",
    appId: "1:255778710355:web:db7e99ebae908852eff7a6",
};

// ── Admin Email ───────────────────────────────────────────────
// Set this to the email of the pre-created admin account.
// Create this account in Firebase Console → Authentication → Users.
// When this email logs in, their profile auto-receives "admin" role.
export const ADMIN_EMAIL = "admin@eventexpense.com";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

export { app, db, auth };
