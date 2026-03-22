// ══════════════════════════════════════════════════════════════
//  Firebase Configuration & Initialization
//  ──────────────────────────────────────────────────────────────
//  Project credentials from the Firebase Console.
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBIe2dGojhn6N5zbvRyFcJz97zZagFT43g",
  authDomain: "event-manage-55e5d.firebaseapp.com",
  projectId: "event-manage-55e5d",
  storageBucket: "event-manage-55e5d.firebasestorage.app",
  messagingSenderId: "340893337809",
  appId: "1:340893337809:web:b03e47378a1bbbcbcf1df0",
  measurementId: "G-R4SD9DZYQL"
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
