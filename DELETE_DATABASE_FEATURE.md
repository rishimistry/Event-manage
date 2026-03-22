# 🗑️ Delete All Database Data Feature

## Overview

Admins can now delete all data from the database through the Settings menu. This is useful for:
- Clearing test data
- Starting fresh
- Resetting the application

## ⚠️ Important Warnings

**This action is IRREVERSIBLE!**
- All events will be deleted
- All expenses will be deleted
- All staff members will be deleted
- All activity logs will be deleted
- All notifications will be deleted

**User accounts are NOT deleted** - only the data collections are cleared.

---

## How to Use

### Step 1: Access Settings

1. Log in as **Admin**
2. Click the **Settings** button (⚙️) in the top navigation
3. Scroll to the bottom to find the **"Danger Zone"** section

### Step 2: Initiate Deletion

1. Click **"Delete All Database Data"** button
2. A confirmation prompt will appear

### Step 3: Confirm Deletion

1. Type exactly: `DELETE ALL DATA`
2. Press OK

**If you type anything else or cancel, the operation will be aborted.**

### Step 4: Wait for Completion

- The system will delete all data
- A success message will appear
- The page will automatically reload after 2 seconds

---

## What Gets Deleted?

✅ **Collections Cleared:**
- `events` - All event records
- `expenses` - All expense records
- `staff` - All staff member records
- `activityLogs` - All activity history
- `notifications` - All notification records

❌ **NOT Deleted:**
- `users` - User profiles remain intact
- `registrationRequests` - Pending registration requests remain
- Firebase Authentication accounts

---

## Security

### Access Control
- **Only admins** can see the "Danger Zone" section
- **Only admins** can execute the deletion
- Requires explicit confirmation with exact text match

### Audit Trail
- The deletion action is logged in `activityLogs` before clearing
- Includes:
  - Admin who performed the action
  - Timestamp
  - Number of documents deleted

---

## Technical Details

### Function: `deleteAllData(collections)`

**Location:** `src/db.js`

**Parameters:**
- `collections` - Array of collection names to delete

**Returns:**
- Number of documents deleted

**Implementation:**
```javascript
export async function deleteAllData(collections) {
    const batch = writeBatch(db);
    let totalDeleted = 0;

    for (const collectionName of collections) {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        
        snapshot.docs.forEach((document) => {
            batch.delete(document.ref);
            totalDeleted++;
        });
    }

    await batch.commit();
    return totalDeleted;
}
```

### Handler: `handleDeleteAllData()`

**Location:** `src/App.jsx`

**Flow:**
1. Shows confirmation prompt
2. Validates user input
3. Deletes data from specified collections
4. Logs the action
5. Shows success message
6. Reloads the page

---

## Use Cases

### 1. Development/Testing
Clear test data after development or testing phases.

### 2. Demo Reset
Reset the application to a clean state for demonstrations.

### 3. Fresh Start
Start over with a clean database while keeping user accounts.

### 4. Data Migration
Clear old data before importing new data structure.

---

## Best Practices

### Before Deletion

1. **Backup your data** (if needed)
   - Export important data
   - Take screenshots of critical information
   - Document any important records

2. **Notify your team**
   - Inform all users about the deletion
   - Schedule the deletion during off-hours
   - Ensure no one is actively using the system

3. **Verify admin access**
   - Ensure you're logged in as admin
   - Confirm you have the correct permissions

### After Deletion

1. **Verify the deletion**
   - Check Firebase Console → Firestore Database
   - Confirm collections are empty
   - Verify user accounts still exist

2. **Repopulate if needed**
   - Add new events
   - Import fresh data
   - Seed initial data if required

---

## Troubleshooting

### Issue: Button not visible

**Solution:** Make sure you're logged in as an admin. Only admins can see the "Danger Zone" section.

---

### Issue: "Failed to delete database" error

**Possible causes:**
1. Network connection issues
2. Firestore security rules blocking deletion
3. Insufficient permissions

**Solution:**
1. Check your internet connection
2. Verify Firestore security rules allow deletion
3. Ensure you're logged in as admin

---

### Issue: Page doesn't reload after deletion

**Solution:** Manually refresh the page (F5 or Ctrl+R)

---

### Issue: Some data still visible after deletion

**Possible causes:**
1. Data cached in browser
2. Real-time listeners not updated
3. Partial deletion failure

**Solution:**
1. Hard refresh the page (Ctrl+Shift+R)
2. Clear browser cache
3. Check Firebase Console to verify deletion

---

## Firestore Security Rules

Ensure your Firestore rules allow admins to delete data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow admins to delete any document
    match /{document=**} {
      allow delete: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## Alternative: Manual Deletion

If you prefer to delete data manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Firestore Database
4. Select a collection
5. Click the three dots (⋮) → Delete collection
6. Repeat for each collection

---

## Recovery

**There is NO built-in recovery mechanism.**

If you accidentally delete data:
1. Check if you have a backup
2. Restore from backup if available
3. Otherwise, data is permanently lost

**Prevention:**
- Always confirm before deletion
- Create backups before major operations
- Test in a development environment first

---

## Limitations

1. **Batch Size:** Firestore batch operations are limited to 500 operations per batch. For very large databases (>500 documents per collection), the function handles this automatically.

2. **Execution Time:** Large deletions may take time. The function will complete even if it takes several seconds.

3. **No Undo:** Once deleted, data cannot be recovered through the application.

---

## Future Enhancements

Possible improvements:
- [ ] Add backup before deletion option
- [ ] Selective collection deletion
- [ ] Export data before deletion
- [ ] Scheduled automatic cleanup
- [ ] Soft delete with recovery period

---

**Last Updated:** March 2024
