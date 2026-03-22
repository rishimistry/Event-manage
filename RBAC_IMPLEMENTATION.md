# Role-Based Access Control (RBAC) Implementation Guide

## Overview
This document outlines the RBAC enhancements made to the EventXpense application to meet the three-tier role hierarchy requirements.

## Role Hierarchy

### 1. Admin (Highest Authority)
**Capabilities Implemented:**
- ✅ View all events and expenses across the system
- ✅ Create, edit, and delete events
- ✅ Manage user accounts (create, edit roles)
- ✅ Assign events to managers and staff
- ✅ Assign staff to managers
- ✅ Access global analytics dashboard
- ✅ View activity logs
- ✅ Export reports (CSV/PDF)
- ✅ Edit/delete any expense record

**New Features Added:**
- Analytics dashboard with system-wide metrics
- Activity log viewer (last 20 activities)
- Event performance tracking
- User breakdown by role
- Enhanced user management with event assignments

### 2. Manager (Mid-Level Authority)
**Capabilities Implemented:**
- ✅ View only assigned events
- ✅ Add expenses for assigned events
- ✅ View reports for assigned events only
- ✅ Edit expenses created by their assigned staff
- ✅ Export reports (CSV/PDF) for their events

**Restrictions Enforced:**
- ❌ Cannot create new events (Admin only)
- ❌ Cannot change user roles (Admin only)
- ❌ Cannot view events not assigned to them
- ❌ Cannot access system analytics

### 3. Staff (Operational Role)
**Capabilities Implemented:**
- ✅ View only assigned events
- ✅ Add expense entries for assigned events
- ✅ View reports for assigned events
- ✅ Download PDF reports

**Restrictions Enforced:**
- ❌ Cannot edit expenses created by others
- ❌ Can only delete their own expenses
- ❌ Cannot create events
- ❌ Cannot assign users
- ❌ Cannot export CSV (PDF only)
- ❌ Cannot access analytics

## Database Schema Updates

### Users Collection
```javascript
{
  id: uid,
  name: string,
  email: string,
  role: "admin" | "manager" | "staff",
  assignedEvents: [eventId1, eventId2, ...],  // NEW
  assignedTo: managerUid | null,              // NEW (for staff)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Events Collection
```javascript
{
  id: string,
  name: string,
  date: string,
  location: string,
  budget: number,
  createdBy: uid,                              // NEW
  assignedManager: uid | null,                 // NEW
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Expenses Collection
```javascript
{
  id: string,
  eventId: string,
  createdByUid: uid,                           // NEW
  amount: number,
  category: string,
  description: string,
  payMode: string,
  addedBy: string,
  note: string,
  lastEditedBy: string | null,                 // NEW
  lastEditedAt: timestamp | null,              // NEW
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Activity Logs Collection (NEW)
```javascript
{
  id: string,
  action: "expense_added" | "expense_edited" | "expense_deleted" | 
          "event_created" | "role_changed" | "events_assigned" | "staff_assigned",
  userId: uid,
  userName: string,
  userRole: string,
  eventId: string | null,
  eventName: string | null,
  expenseId: string | null,
  targetUserId: string | null,
  targetUserName: string | null,
  details: string,
  timestamp: timestamp
}
```

## New Database Functions

### db.js Additions
```javascript
// User Management
- assignEventsToUser(uid, eventIds)
- assignStaffToManager(staffUid, managerUid)
- updateEventAssignment(eventId, updates)

// Expense Tracking
- updateExpenseWithLog(expenseId, updates, editedBy)

// Activity Logging
- logActivity(activityData)
- subscribeToActivityLogs(onData, onError, limit)
```

## Permission Enforcement

### Data Filtering
```javascript
// Events - filtered by role and assignments
const visibleEvents = events.filter(event => {
  if (isAdmin) return true;
  if (!userProfile?.assignedEvents) return false;
  return userProfile.assignedEvents.includes(event.id);
});

// Expenses - filtered by accessible events
const visibleExpenses = expenses.filter(expense => {
  if (isAdmin) return true;
  const eventIds = userProfile?.assignedEvents || [];
  return eventIds.includes(expense.eventId);
});
```

### Delete Permission Check
```javascript
if (!isAdmin && !canManageEvents) {
  // Staff can only delete their own expenses
  if (expense.createdByUid !== user.uid) {
    showToast("You can only delete your own expenses!", "error");
    return;
  }
}
```

## UI Changes

### Navigation Updates
- Added "Analytics" view for admins
- Conditional rendering of "New Event" button (Admin/Manager only)
- Role-based navigation items

### User Management Page
- Enhanced with event assignment interface
- Visual display of assigned events per user
- Inline role changing
- Event assignment button with prompt

### Analytics Dashboard (Admin Only)
- System-wide metrics cards
- Event performance breakdown
- User role distribution
- Recent activity log (last 20 entries)

### Expense Row Component
- Conditional edit/delete buttons based on permissions
- "Last edited by" indicator
- Permission-aware button rendering

## Activity Logging

All major actions are now logged:
- Expense added/edited/deleted
- Event created
- Role changed
- Events assigned to user
- Staff assigned to manager

Each log entry includes:
- Action type
- User who performed the action
- User's role
- Timestamp
- Relevant IDs (event, expense, target user)
- Human-readable details

## Security Recommendations

### Firestore Security Rules (To Be Implemented)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return isSignedIn() && getUserData().role == 'admin';
    }
    
    function isManager() {
      return isSignedIn() && getUserData().role == 'manager';
    }
    
    function isStaff() {
      return isSignedIn() && getUserData().role == 'staff';
    }
    
    function canAccessEvent(eventId) {
      return isAdmin() || 
             eventId in getUserData().assignedEvents;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isAdmin() || request.auth.uid == userId;
      allow delete: if isAdmin();
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if canAccessEvent(eventId);
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Expenses collection
    match /expenses/{expenseId} {
      allow read: if canAccessEvent(resource.data.eventId);
      allow create: if isSignedIn() && canAccessEvent(request.resource.data.eventId);
      allow update: if isAdmin() || 
                      (isManager() && canAccessEvent(resource.data.eventId)) ||
                      (isStaff() && request.auth.uid == resource.data.createdByUid);
      allow delete: if isAdmin() || 
                      (isManager() && canAccessEvent(resource.data.eventId)) ||
                      (isStaff() && request.auth.uid == resource.data.createdByUid);
    }
    
    // Activity Logs collection
    match /activityLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isSignedIn();
      allow update, delete: if false;
    }
    
    // Staff collection
    match /staff/{staffId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin() || isManager();
    }
  }
}
```

## Testing Checklist

### Admin Tests
- [ ] Can view all events
- [ ] Can create new events
- [ ] Can assign events to managers
- [ ] Can assign events to staff
- [ ] Can change user roles
- [ ] Can view analytics dashboard
- [ ] Can view activity logs
- [ ] Can edit any expense
- [ ] Can delete any expense

### Manager Tests
- [ ] Can only see assigned events
- [ ] Cannot create events
- [ ] Cannot change roles
- [ ] Can add expenses to assigned events
- [ ] Can edit staff expenses in their events
- [ ] Cannot see other managers' events
- [ ] Can export CSV/PDF for their events

### Staff Tests
- [ ] Can only see assigned events
- [ ] Cannot create events
- [ ] Can add expenses to assigned events
- [ ] Can only delete own expenses
- [ ] Cannot edit others' expenses
- [ ] Can view PDF reports
- [ ] Cannot export CSV
- [ ] Cannot access analytics

## Migration Steps

### For Existing Users
1. Run a migration script to add `assignedEvents: []` to all existing users
2. Admin users should manually assign events to managers and staff
3. Add `createdByUid` to existing expenses (can default to null or admin UID)

### Migration Script Example
```javascript
// Run this once in Firebase Console or Cloud Functions
const migrateUsers = async () => {
  const usersSnapshot = await db.collection('users').get();
  const batch = db.batch();
  
  usersSnapshot.docs.forEach(doc => {
    if (!doc.data().assignedEvents) {
      batch.update(doc.ref, { 
        assignedEvents: [],
        assignedTo: null 
      });
    }
  });
  
  await batch.commit();
  console.log('Migration complete');
};
```

## Future Enhancements

### Recommended Features
1. **Receipt Upload**: Add file upload for expense receipts using Firebase Storage
2. **Event Archiving**: Allow admins to archive completed events
3. **Bulk Assignment**: UI for bulk event assignment to multiple users
4. **Advanced Filters**: Filter activity logs by date range, user, action type
5. **Email Notifications**: Notify users when assigned to events
6. **Expense Approval Workflow**: Require manager approval for large expenses
7. **Budget Alerts**: Automatic notifications when budget threshold reached
8. **Export Scheduling**: Schedule automatic report generation
9. **Audit Trail**: Complete audit trail for compliance
10. **Mobile App**: React Native app with offline support

## Support & Documentation

For questions or issues:
1. Check the activity logs for debugging
2. Verify user assignments in User Management
3. Ensure Firestore security rules are deployed
4. Check browser console for permission errors

## Version History

- **v2.0.0** (Current) - Full RBAC implementation with activity logging
- **v1.0.0** - Basic expense tracking with simple roles
