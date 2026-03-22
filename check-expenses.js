// Check what categories exist in expenses
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7t55824Sc_ribsad4m0n8CmqDktQBCWo",
  authDomain: "event-manage-12bad.firebaseapp.com",
  projectId: "event-manage-12bad",
  storageBucket: "event-manage-12bad.firebasestorage.app",
  messagingSenderId: "575157601043",
  appId: "1:575157601043:web:863655b7ac51d479b690e6",
  measurementId: "G-589L8L6HCV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkExpenses() {
  const expensesSnapshot = await getDocs(collection(db, "expenses"));
  const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const categories = {};
  expenses.forEach(exp => {
    if (!categories[exp.category]) {
      categories[exp.category] = 0;
    }
    categories[exp.category]++;
  });
  
  console.log("Categories found in expenses:");
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} expenses`);
  });
  
  process.exit(0);
}

checkExpenses();
