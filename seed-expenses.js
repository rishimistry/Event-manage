// ══════════════════════════════════════════════════════════════
//  Seed Script - Add Sample Expenses to Firebase
//  ──────────────────────────────────────────────────────────────
//  Run this script to populate your Firebase with sample expenses
//  Usage: node seed-expenses.js
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";

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

// Sample Staff Names
const staffMembers = [
  "Rahul Sharma",
  "Priya Patel",
  "Amit Kumar",
  "Sneha Reddy",
  "Vikram Singh"
];

// Expense categories and their typical items
const expenseTemplates = {
  travel: [
    { desc: "Flight tickets for team", amount: 45000, payMode: "card" },
    { desc: "Cab fare to venue", amount: 1200, payMode: "upi" },
    { desc: "Train tickets", amount: 8500, payMode: "card" },
    { desc: "Airport parking", amount: 600, payMode: "cash" },
    { desc: "Fuel for company vehicle", amount: 3500, payMode: "card" }
  ],
  food: [
    { desc: "Team lunch at restaurant", amount: 4500, payMode: "card" },
    { desc: "Breakfast catering", amount: 2800, payMode: "upi" },
    { desc: "Dinner for guests", amount: 12000, payMode: "card" },
    { desc: "Coffee and snacks", amount: 1500, payMode: "cash" },
    { desc: "Buffet arrangement", amount: 25000, payMode: "card" }
  ],
  logistics: [
    { desc: "Equipment rental", amount: 15000, payMode: "card" },
    { desc: "Stage setup materials", amount: 8000, payMode: "upi" },
    { desc: "Transportation of goods", amount: 5500, payMode: "card" },
    { desc: "Packaging supplies", amount: 2200, payMode: "cash" },
    { desc: "Venue decoration items", amount: 18000, payMode: "card" }
  ],
  accommodation: [
    { desc: "Hotel booking for team", amount: 35000, payMode: "card" },
    { desc: "Guest house rental", amount: 12000, payMode: "upi" },
    { desc: "Accommodation for speakers", amount: 28000, payMode: "card" },
    { desc: "Room service charges", amount: 3500, payMode: "card" }
  ],
  entertainment: [
    { desc: "DJ and music system", amount: 22000, payMode: "card" },
    { desc: "Photography services", amount: 18000, payMode: "upi" },
    { desc: "Videography team", amount: 25000, payMode: "card" },
    { desc: "Entertainment performers", amount: 30000, payMode: "card" }
  ],
  miscellaneous: [
    { desc: "Printing and stationery", amount: 4500, payMode: "upi" },
    { desc: "Gift items for guests", amount: 8000, payMode: "card" },
    { desc: "Emergency supplies", amount: 2000, payMode: "cash" },
    { desc: "Miscellaneous purchases", amount: 3200, payMode: "upi" }
  ]
};

// Function to get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to get random expenses for a category
function getRandomExpense(category) {
  const templates = expenseTemplates[category];
  return getRandomItem(templates);
}

async function seedExpenses() {
  console.log("🌱 Starting to seed expenses...\n");
  
  try {
    // Get all events
    const eventsSnapshot = await getDocs(collection(db, "events"));
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (events.length === 0) {
      console.log("❌ No events found. Please run seed-events.js first.");
      process.exit(1);
    }
    
    console.log(`📋 Found ${events.length} events\n`);
    
    const expensesCol = collection(db, "expenses");
    let totalExpenses = 0;
    
    // Add 5-8 expenses per event
    for (const event of events) {
      const numExpenses = Math.floor(Math.random() * 4) + 5; // 5-8 expenses
      console.log(`📝 Adding ${numExpenses} expenses for: ${event.name}`);
      
      for (let i = 0; i < numExpenses; i++) {
        const categories = Object.keys(expenseTemplates);
        const category = getRandomItem(categories);
        const expense = getRandomExpense(category);
        const staff = getRandomItem(staffMembers);
        
        const expenseData = {
          eventId: event.id,
          category: category,
          desc: expense.desc,
          amount: expense.amount,
          payMode: expense.payMode,
          addedBy: staff,
          createdBy: staff,
          createdByUid: `staff_${staff.toLowerCase().replace(/\s+/g, '_')}`,
          note: "",
          createdAt: serverTimestamp()
        };
        
        await addDoc(expensesCol, expenseData);
        console.log(`   ✅ ${staff}: ${expense.desc} - ₹${expense.amount}`);
        totalExpenses++;
      }
      console.log("");
    }
    
    console.log(`🎉 Successfully added ${totalExpenses} sample expenses!`);
    console.log(`📊 Expenses distributed across ${events.length} events`);
    console.log(`👥 Created by ${staffMembers.length} different staff members`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding expenses:", error);
    process.exit(1);
  }
}

seedExpenses();
