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

// ══════════════════════════════════════════════════════════════
//  EmailJS Configuration (Free Plan - No Blaze Required)
//  ──────────────────────────────────────────────────────────────
//  Get these values from https://www.emailjs.com/
//  1. Sign up for free account
//  2. Add email service (Gmail recommended)
//  3. Create email templates
//  4. Copy IDs below
// ══════════════════════════════════════════════════════════════

export const EMAILJS_CONFIG = {
  publicKey: "ucMp4ALBFynD_O5id",        // From Account tab
  serviceId: "service_njlj9ub",                 // From Email Services tab
  approvalTemplateId: "template_6vtaioa", // Template for approval emails
  rejectionTemplateId: "template_fnggdbg", // Template for rejection emails
  appUrl: window.location.origin,               // Your app URL for login button
};

// To enable email notifications:
// 1. Follow setup guide in EMAIL_FREE_PLAN.md
// 2. Replace the values above with your EmailJS credentials
// 3. Install EmailJS: npm install @emailjs/browser
// 4. Emails will be sent automatically on approve/reject

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

export { app, db, auth };
