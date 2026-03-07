// ══════════════════════════════════════════════════════════════
//  Firebase Configuration & Initialization
//  ──────────────────────────────────────────────────────────────
//  Project credentials from the Firebase Console.
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC7t55824Sc_ribsad4m0n8CmqDktQBCWo",
  authDomain: "event-manage-12bad.firebaseapp.com",
  projectId: "event-manage-12bad",
  storageBucket: "event-manage-12bad.firebasestorage.app",
  messagingSenderId: "575157601043",
  appId: "1:575157601043:web:863655b7ac51d479b690e6",
  measurementId: "G-589L8L6HCV"
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
