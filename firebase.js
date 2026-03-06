// ══════════════════════════════════════════════════════════════
//  Firebase Configuration & Initialization
//  ──────────────────────────────────────────────────────────────
//  Replace the placeholder values below with your actual
//  Firebase project credentials from the Firebase Console:
//    → https://console.firebase.google.com
//    → Project Settings → General → Your apps → Web app
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA6zTycdMSBvXDP_WREGKYJ9C-c6ew6rqg",
    authDomain: "event-manage-40cad.firebaseapp.com",
    projectId: "event-manage-40cad",
    storageBucket: "event-manage-40cad.firebasestorage.app",
    messagingSenderId: "255778710355",
    appId: "1:255778710355:web:db7e99ebae908852eff7a6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { app, db };
