# 🌱 Seed Sample Data Guide

## Overview

This project includes scripts to populate your database with sample data for testing and demonstration purposes.

---

## 📦 What Gets Added?

### Events (5 sample events)
- Sharma Wedding (Mumbai) - ₹5,00,000
- Tech Conference 2024 (Bangalore) - ₹7,50,000
- Annual Corporate Retreat (Goa) - ₹12,00,000
- Product Launch Event (Delhi) - ₹3,50,000
- Diwali Celebration (Hyderabad) - ₹2,00,000

### Expenses (5-8 per event)
- Random expenses across all categories:
  - Travel (flights, cabs, trains)
  - Food & Stay (catering, meals)
  - Decor (decorations, lighting)
  - Labour (staff wages, crew)
  - Equipment (rentals, setup)
  - Misc (printing, gifts, photography)
- Created by 5 different staff members
- Various payment modes (Cash, UPI, Card, Bank, Wallet, Cheque)

---

## 🚀 How to Use

### Step 1: Add Sample Events

```bash
npm run seed
```

This will add 5 sample events to your database.

**Output:**
```
🌱 Starting to seed events...

✅ Added: Sharma Wedding (ID: abc123)
✅ Added: Tech Conference 2024 (ID: def456)
✅ Added: Annual Corporate Retreat (ID: ghi789)
✅ Added: Product Launch Event (ID: jkl012)
✅ Added: Diwali Celebration (ID: mno345)

🎉 Successfully added 5 sample events!
```

---

### Step 2: Add Sample Expenses

```bash
npm run seed:expenses
```

This will add 5-8 random expenses for each event.

**Output:**
```
🌱 Starting to seed expenses...

📋 Found 5 events

📝 Adding 7 expenses for: Sharma Wedding
   ✅ Rahul Sharma: Flight tickets for team - ₹45000
   ✅ Priya Patel: Team lunch at restaurant - ₹4500
   ...

🎉 Successfully added 35 sample expenses!
📊 Expenses distributed across 5 events
👥 Created by 5 different staff members
```

---

## 🔄 Running Both at Once

You can run both commands sequentially:

```bash
npm run seed && npm run seed:expenses
```

---

## 🗑️ Clearing Sample Data

To remove all sample data, use the "Delete All Database Data" option in Settings (Admin only):

1. Login as admin
2. Go to Settings (⚙️)
3. Scroll to "Danger Zone"
4. Click "Delete All Database Data"
5. Type "DELETE ALL DATA" to confirm

---

## 📝 Sample Staff Members

The seed script creates expenses from these staff members:
- Rahul Sharma
- Priya Patel
- Amit Kumar
- Sneha Reddy
- Vikram Singh

**Note:** These are just names in the expenses, not actual user accounts.

---

## ⚙️ Customizing Sample Data

### Modify Events

Edit `seed-events.js` to change:
- Event names
- Locations
- Budgets
- Dates

```javascript
const sampleEvents = [
  {
    name: "Your Event Name",
    location: "Your Location",
    budget: 100000,
    date: "2024-12-31",
    // ...
  }
];
```

### Modify Expenses

Edit `seed-expenses.js` to change:
- Expense categories
- Descriptions
- Amounts
- Payment modes
- Staff names

```javascript
const expenseTemplates = {
  travel: [
    { desc: "Your expense", amount: 5000, payMode: "upi" },
    // ...
  ]
};
```

---

## 🔧 Troubleshooting

### Issue: "No events found" when seeding expenses

**Solution:** Run `npm run seed` first to add events, then run `npm run seed:expenses`.

---

### Issue: Firebase connection error

**Solution:** 
1. Check your internet connection
2. Verify Firebase config in the seed files matches your project
3. Ensure Firestore is enabled in Firebase Console

---

### Issue: Permission denied

**Solution:** 
1. Check Firestore security rules
2. Temporarily use test mode for seeding:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ Only for seeding!
    }
  }
}
```

**Remember to restore proper security rules after seeding!**

---

## 📊 Verifying Seeded Data

After seeding, verify in:

1. **Your App:**
   - Login and check Events page
   - View expenses in Dashboard
   - Check Reports

2. **Firebase Console:**
   - Go to Firestore Database
   - Check `events` collection
   - Check `expenses` collection

---

## 🎯 Use Cases

### Development
Quickly populate database for testing features.

### Demo/Presentation
Show the app with realistic data.

### Testing
Test reports, filters, and calculations with varied data.

### Training
Help new team members understand the system.

---

## 📚 Additional Scripts

### Update Expenses
```bash
npm run update:expenses
```
Updates existing expenses (check script for details).

### Fix Categories
```bash
npm run fix:categories
```
Fixes category names in existing expenses.

### Add Dates
```bash
npm run add:dates
```
Adds date fields to expenses that don't have them.

---

## ⚠️ Important Notes

1. **Run in Development:** Only use seed scripts in development/testing environments.

2. **Not for Production:** Don't seed data in production databases.

3. **Duplicate Data:** Running seed scripts multiple times will create duplicate data.

4. **Clean Before Seeding:** For best results, clear existing data before seeding.

5. **Firebase Config:** Seed scripts use the Firebase config from your current project.

---

## 🔐 Security

The seed scripts:
- Don't create user accounts (only expense names)
- Don't modify authentication
- Only add data to Firestore collections
- Can be safely run multiple times

---

**Last Updated:** March 2024
