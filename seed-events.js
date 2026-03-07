// ══════════════════════════════════════════════════════════════
//  Seed Script - Add Sample Events to Firebase
//  ──────────────────────────────────────────────────────────────
//  Run this script to populate your Firebase with 5 sample events
//  Usage: node seed-events.js
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7t55824Sc_ribsad4m0n8CmqDktQBCWo",
  authDomain: "event-manage-12bad.firebaseapp.com",
  projectId: "event-manage-12bad",
  storageBucket: "event-manage-12bad.firebasestorage.app",
  messagingSenderId: "575157601043",
  appId: "1:575157601043:web:863655b7ac51d479b690e6",
  measurementId: "G-589L8L6HCV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample Events Data
const sampleEvents = [
  {
    name: "Sharma Wedding",
    location: "Mumbai",
    budget: 500000,
    date: "2024-12-15",
    createdBy: "admin@eventexpense.com",
    createdByUid: "admin",
    assignedManager: null,
    assignedTo: []
  },
  {
    name: "Tech Conference 2024",
    location: "Bangalore",
    budget: 750000,
    date: "2024-11-20",
    createdBy: "admin@eventexpense.com",
    createdByUid: "admin",
    assignedManager: null,
    assignedTo: []
  },
  {
    name: "Annual Corporate Retreat",
    location: "Goa",
    budget: 1200000,
    date: "2024-12-01",
    createdBy: "admin@eventexpense.com",
    createdByUid: "admin",
    assignedManager: null,
    assignedTo: []
  },
  {
    name: "Product Launch Event",
    location: "Delhi",
    budget: 350000,
    date: "2024-11-25",
    createdBy: "admin@eventexpense.com",
    createdByUid: "admin",
    assignedManager: null,
    assignedTo: []
  },
  {
    name: "Diwali Celebration",
    location: "Hyderabad",
    budget: 200000,
    date: "2024-11-12",
    createdBy: "admin@eventexpense.com",
    createdByUid: "admin",
    assignedManager: null,
    assignedTo: []
  }
];

async function seedEvents() {
  console.log("🌱 Starting to seed events...\n");
  
  try {
    const eventsCol = collection(db, "events");
    
    for (const event of sampleEvents) {
      const docRef = await addDoc(eventsCol, {
        ...event,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ Added: ${event.name} (ID: ${docRef.id})`);
    }
    
    console.log("\n🎉 Successfully added 5 sample events!");
    console.log("You can now view them in your app.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding events:", error);
    process.exit(1);
  }
}

seedEvents();
