// ══════════════════════════════════════════════════════════════
//  Fix Script - Add Dates to Expenses
//  ──────────────────────────────────────────────────────────────
//  This script adds dates to expenses that are missing them
//  Usage: node add-dates.js
// ══════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

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

// Generate random dates in November 2024
function getRandomDate() {
  const start = new Date('2024-11-01');
  const end = new Date('2024-11-30');
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const randomDate = new Date(randomTime);
  return randomDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

async function addDates() {
  console.log("📅 Starting to add dates to expenses...\n");
  
  try {
    // Get all expenses
    const expensesSnapshot = await getDocs(collection(db, "expenses"));
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (expenses.length === 0) {
      console.log("❌ No expenses found.");
      process.exit(1);
    }
    
    console.log(`📝 Found ${expenses.length} expenses to check\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const expense of expenses) {
      if (!expense.date) {
        // Add a random date
        const randomDate = getRandomDate();
        const expenseRef = doc(db, "expenses", expense.id);
        await updateDoc(expenseRef, {
          date: randomDate
        });
        
        console.log(`✅ Added date ${randomDate} to: ${expense.desc}`);
        updated++;
      } else {
        skipped++;
      }
    }
    
    console.log(`\n🎉 Done!`);
    console.log(`   Updated: ${updated} expenses`);
    console.log(`   Skipped: ${skipped} expenses (already have dates)`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding dates:", error);
    process.exit(1);
  }
}

addDates();
