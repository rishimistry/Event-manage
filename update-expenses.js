// ══════════════════════════════════════════════════════════════
//  Update Script - Link Expenses to Real Staff Accounts
//  ──────────────────────────────────────────────────────────────
//  This script updates existing expenses to use real staff UIDs
//  Usage: node update-expenses.js
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

async function updateExpenses() {
  console.log("🔄 Starting to update expenses with real staff accounts...\n");
  
  try {
    // Get all staff users from users collection
    const usersSnapshot = await getDocs(collection(db, "users"));
    const staffUsers = usersSnapshot.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter(user => user.role === "staff");
    
    if (staffUsers.length === 0) {
      console.log("❌ No staff users found. Please create staff accounts first.");
      process.exit(1);
    }
    
    console.log(`👥 Found ${staffUsers.length} staff members:`);
    staffUsers.forEach(staff => {
      console.log(`   - ${staff.name} (${staff.email})`);
    });
    console.log("");
    
    // Get all expenses
    const expensesSnapshot = await getDocs(collection(db, "expenses"));
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (expenses.length === 0) {
      console.log("❌ No expenses found. Please run seed:expenses first.");
      process.exit(1);
    }
    
    console.log(`📝 Found ${expenses.length} expenses to update\n`);
    
    let updated = 0;
    
    // Update each expense with a random staff member
    for (const expense of expenses) {
      // Pick a random staff member
      const randomStaff = staffUsers[Math.floor(Math.random() * staffUsers.length)];
      
      // Update the expense
      const expenseRef = doc(db, "expenses", expense.id);
      await updateDoc(expenseRef, {
        addedBy: randomStaff.name,
        createdBy: randomStaff.email,
        createdByUid: randomStaff.uid
      });
      
      console.log(`✅ Updated: ${expense.desc} → ${randomStaff.name}`);
      updated++;
    }
    
    console.log(`\n🎉 Successfully updated ${updated} expenses!`);
    console.log(`📊 All expenses now linked to real staff accounts`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating expenses:", error);
    process.exit(1);
  }
}

updateExpenses();
