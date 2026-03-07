// ══════════════════════════════════════════════════════════════
//  Fix Script - Update Expense Categories to Match App
//  ──────────────────────────────────────────────────────────────
//  This script updates existing expenses to use correct categories
//  Usage: node fix-categories.js
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

// Category mapping from old to new
const categoryMapping = {
  "travel": "travel",
  "food": "food",
  "logistics": "equipment",
  "accommodation": "food",
  "entertainment": "misc",
  "miscellaneous": "misc"
};

async function fixCategories() {
  console.log("🔧 Starting to fix expense categories...\n");
  
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
      const oldCategory = expense.category;
      const newCategory = categoryMapping[oldCategory];
      
      if (!newCategory) {
        console.log(`⚠️  Unknown category: ${oldCategory} for expense: ${expense.desc}`);
        skipped++;
        continue;
      }
      
      if (oldCategory !== newCategory) {
        // Update the expense
        const expenseRef = doc(db, "expenses", expense.id);
        await updateDoc(expenseRef, {
          category: newCategory
        });
        
        console.log(`✅ Updated: ${expense.desc} (${oldCategory} → ${newCategory})`);
        updated++;
      } else {
        skipped++;
      }
    }
    
    console.log(`\n🎉 Done!`);
    console.log(`   Updated: ${updated} expenses`);
    console.log(`   Skipped: ${skipped} expenses (already correct)`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing categories:", error);
    process.exit(1);
  }
}

fixCategories();
