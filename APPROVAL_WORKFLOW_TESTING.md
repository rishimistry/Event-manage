# Account Approval Workflow - Testing Guide

## ✅ Implementation Status: COMPLETE

The account approval workflow has been fully implemented with the following components:

### 1. Database Layer (`src/db.js`)
- ✅ `registrationRequests` collection functions
- ✅ `notifications` collection functions
- ✅ `createRegistrationRequest()` - Creates pending request on signup
- ✅ `getRegistrationRequest()` - Fetches request by UID
- ✅ `subscribeToRegistrationRequests()` - Real-time updates
- ✅ `approveRegistrationRequest()` - Creates user profile and updates status
- ✅ `rejectRegistrationRequest()` - Updates status with reason
- ✅ `notifyAdminsOfNewRequest()` - Notifies admins of new requests
- ✅ Activity logging for all approval actions

### 2. Authentication Context (`src/AuthContext.jsx`)
- ✅ Modified `register()` to create requests instead of profiles
- ✅ Added `registrationRequest` state
- ✅ Added `canApproveStaff` permission check
- ✅ Auto-creates admin profile on first login

### 3. Waiting Approval Screen (`src/WaitingApproval.jsx`)
- ✅ Shows pending/rejected status
- ✅ Displays request details (name, email, role, status)
- ✅ Shows rejection reason if applicable
- ✅ Logout button for users to exit

### 4. Main App (`src/App.jsx`)
- ✅ Added `registrationRequests` state
- ✅ Subscription to registration requests (filtered by role)
- ✅ Approval/rejection handlers with toast notifications
- ✅ "Requests" navigation item for admin/manager
- ✅ Complete "Requests" view with pending and processed sections
- ✅ Shows WaitingApproval screen if no profile exists

### 5. Security Rules (`firestore.rules`)
- ✅ `registrationRequests` collection rules
- ✅ `notifications` collection rules
- ✅ Role-based read/write permissions
- ✅ Admin can approve manager and staff requests
- ✅ Manager can only approve staff requests
- ✅ Staff cannot access approval system

### 6. Email Notifications (`functions/index.js`)
- ✅ Cloud Function triggers on approval/rejection
- ✅ Beautiful HTML email templates
- ✅ Sends approval email with account details
- ✅ Sends rejection email with reason
- ✅ Email delivery logging to `emailLogs` collection
- ✅ Support for Gmail, SendGrid, and other services

---

## 🚀 Deployment Steps

### Step 1: Deploy Firestore Security Rules

```bash
cd expense-tracker
firebase deploy --only firestore:rules
```

This will deploy the updated security rules to your Firebase project.

### Step 2: Setup Email Notifications

**Quick Setup (Recommended):**

For Windows:
```bash
setup-email.bat
```

For Mac/Linux:
```bash
chmod +x setup-email.sh
./setup-email.sh
```

**Manual Setup:**

See detailed instructions in `EMAIL_SETUP_GUIDE.md`

Key steps:
1. Install dependencies: `cd functions && npm install && cd ..`
2. Configure email: `firebase functions:config:set email.user="your-email" email.password="your-password"`
3. Deploy functions: `firebase deploy --only functions`

### Step 3: Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Verify the rules include `registrationRequests` and `notifications` sections
5. Navigate to **Functions** tab
6. Verify two functions are deployed:
   - `onRegistrationApproved`
   - `onRegistrationRejected`

---

## 🧪 Testing Workflow

### Test 1: New User Registration (Staff)

1. **Logout** from your current account
2. Click **"Create Account"**
3. Fill in:
   - Name: `Test Staff`
   - Email: `teststaff@example.com`
   - Password: `password123`
   - Role: **Staff**
4. Click **Register**

**Expected Result:**
- User is authenticated but sees "Waiting for Approval" screen
- Screen shows:
  - ⏳ icon
  - "Waiting for Approval" title
  - Request details (name, email, role: STAFF, status: PENDING)
  - Instructions to wait for admin approval
  - Logout button

### Test 2: Admin Approves Staff Request

1. **Logout** from test staff account
2. **Login** as admin
3. Navigate to **"Requests"** in the sidebar
4. You should see the pending request for "Test Staff"
5. Click **"✅ Approve"** button

**Expected Result:**
- Toast notification: "✅ Approved Test Staff's staff request!"
- Request moves to "Processed Requests" section with status "APPROVED"
- Activity log created (visible in Analytics if implemented)
- **Email sent to teststaff@example.com** with:
  - Subject: "🎉 Your EventXpense Account Has Been Approved!"
  - Beautiful HTML email with account details
  - Login button to access the app
- Check `emailLogs` collection in Firestore for delivery confirmation

### Test 3: Staff User Can Now Access System

1. **Logout** from admin account
2. **Login** as `teststaff@example.com` with password `password123`

**Expected Result:**
- User successfully logs in
- User sees the main dashboard (Overview)
- User can add expenses (with name auto-filled)
- User can only see assigned events (none initially)

### Test 4: New User Registration (Manager)

1. **Logout** from current account
2. Click **"Create Account"**
3. Fill in:
   - Name: `Test Manager`
   - Email: `testmanager@example.com`
   - Password: `password123`
   - Role: **Manager**
4. Click **Register**

**Expected Result:**
- User sees "Waiting for Approval" screen
- Request details show role: MANAGER, status: PENDING

### Test 5: Admin Approves Manager Request

1. **Logout** and **login** as admin
2. Navigate to **"Requests"**
3. You should see the pending request for "Test Manager"
4. Click **"✅ Approve"** button

**Expected Result:**
- Toast notification: "✅ Approved Test Manager's manager request!"
- Request moves to "Processed Requests" section

### Test 6: Manager Can Only Approve Staff Requests

1. **Logout** and **login** as `testmanager@example.com`
2. Navigate to **"Requests"** in the sidebar
3. Create a new staff account (logout, register as staff)
4. Login back as manager

**Expected Result:**
- Manager sees "Requests" in navigation
- Manager can see and approve STAFF requests only
- Manager cannot see MANAGER requests (filtered out)

### Test 7: Rejection Workflow

1. **Login** as admin
2. Create a new test account (logout, register as staff with different email)
3. Login back as admin
4. Navigate to **"Requests"**
5. Click **"❌ Reject"** button
6. Enter rejection reason: `Duplicate account`
7. Click OK

**Expected Result:**
- Toast notification: "❌ Rejected [Name]'s request"
- Request moves to "Processed Requests" with status "REJECTED"
- **Email sent to rejected user** with:
  - Subject: "EventXpense Registration Request Update"
  - Rejection reason displayed
  - Instructions to contact administrator
- Check `emailLogs` collection for delivery confirmation

### Test 8: Rejected User Experience

1. **Logout** and **login** with the rejected account

**Expected Result:**
- User sees "Waiting for Approval" screen
- Screen shows:
  - ❌ icon (red)
  - "Request Rejected" title (red)
  - Status: REJECTED (red badge)
  - Rejection reason displayed: "Duplicate account"
  - Instructions to contact administrator

---

## 🔍 Verification Checklist

### Database Collections

Check Firebase Console → Firestore Database:

- [ ] `registrationRequests` collection exists
- [ ] Each request has fields: `uid`, `name`, `email`, `requestedRole`, `status`, `createdAt`
- [ ] Approved requests have: `approvedBy`, `approvedAt`
- [ ] Rejected requests have: `rejectedBy`, `rejectedAt`, `rejectionReason`

### User Profiles

- [ ] `users` collection only contains approved users
- [ ] Each user has: `name`, `email`, `role`, `assignedEvents`, `createdAt`
- [ ] Approved users have: `approvedBy`, `approvedAt`

### Notifications (Optional)

- [ ] `notifications` collection exists
- [ ] Notifications created for approved/rejected users
- [ ] Admin notifications for new requests

### Activity Logs

- [ ] `activityLogs` collection has entries for:
  - `request_approved` actions
  - `request_rejected` actions
  - Includes approver details and target user info

### Email Logs

- [ ] `emailLogs` collection exists
- [ ] Email logs have fields: `to`, `subject`, `type`, `success`, `sentAt`
- [ ] Approval emails logged with type: `registration_approved`
- [ ] Rejection emails logged with type: `registration_rejected`

### Cloud Functions

- [ ] Functions deployed successfully
- [ ] `onRegistrationApproved` function exists
- [ ] `onRegistrationRejected` function exists
- [ ] Function logs show successful email sends
- [ ] No errors in function execution logs

---

## 🐛 Troubleshooting

### Issue: "Permission denied" when creating registration request

**Solution:** Ensure Firestore rules are deployed:
```bash
firebase deploy --only firestore:rules
```

### Issue: User stuck on "Waiting for Approval" after approval

**Solution:** 
1. Check if user profile was created in `users` collection
2. Logout and login again to refresh auth state
3. Check browser console for errors

### Issue: Manager can see manager requests

**Solution:** Check the subscription filter in `App.jsx` line ~350:
```javascript
const filtered = isAdmin 
  ? data // Admin sees all requests
  : data.filter(r => r.requestedRole === "staff"); // Manager sees only staff requests
```

### Issue: "Connecting to database..." screen forever

**Solution:**
1. Check Firebase config in `src/firebase.js`
2. Verify Firestore rules allow read access
3. Check browser console for errors
4. Increase timeout in `App.jsx` (currently 8 seconds)

### Issue: Email not sent after approval

**Solution:**
1. Check if Cloud Functions are deployed: `firebase deploy --only functions`
2. Verify email config: `firebase functions:config:get`
3. Check function logs: `firebase functions:log`
4. Verify `emailLogs` collection for error messages
5. Ensure Firebase project is on Blaze (pay-as-you-go) plan

### Issue: "Firebase requires Blaze plan for Cloud Functions"

**Solution:** 
1. Go to Firebase Console
2. Navigate to "Usage and billing"
3. Upgrade to Blaze plan (has generous free tier)
4. Cloud Functions free tier: 2M invocations/month

### Issue: Gmail authentication failed

**Solution:**
1. Ensure 2-Factor Authentication is enabled on Gmail
2. Generate new App Password (16 characters)
3. Set config again: `firebase functions:config:set email.user="..." email.password="..."`
4. Redeploy functions: `firebase deploy --only functions`

---

## 📊 Expected Behavior Summary

| User Role | Can Register | Needs Approval | Can Approve Staff | Can Approve Manager |
|-----------|--------------|----------------|-------------------|---------------------|
| Admin     | No (pre-made)| No             | ✅ Yes            | ✅ Yes              |
| Manager   | ✅ Yes       | ✅ Yes         | ✅ Yes            | ❌ No               |
| Staff     | ✅ Yes       | ✅ Yes         | ❌ No             | ❌ No               |

---

## 🎯 Next Steps (Optional Enhancements)

1. **Notification Badge**: Add a badge count to "Requests" navigation item showing pending count
2. **Email Notifications**: Integrate with Firebase Cloud Functions to send email notifications
3. **Bulk Actions**: Add "Approve All" or "Reject All" buttons
4. **Request History**: Add detailed history view with timestamps and approver names
5. **Request Filters**: Add filters for pending/approved/rejected requests
6. **Search**: Add search functionality to find specific requests

---

## ✅ Testing Complete

Once all tests pass, the approval workflow is fully functional and ready for production use!

**Key Features:**
- ✅ Secure registration with admin approval
- ✅ Role-based approval permissions
- ✅ Real-time updates for requests
- ✅ Activity logging for audit trail
- ✅ User-friendly waiting screen
- ✅ Rejection with reason support
- ✅ Firestore security rules enforced
- ✅ Automated email notifications
- ✅ Beautiful HTML email templates
- ✅ Email delivery logging

**Files Modified:**
- `src/db.js` - Database functions
- `src/AuthContext.jsx` - Registration flow
- `src/WaitingApproval.jsx` - New component
- `src/App.jsx` - Requests view and handlers
- `firestore.rules` - Security rules

**Files Created:**
- `functions/index.js` - Cloud Functions for email
- `functions/package.json` - Functions dependencies
- `firebase.json` - Firebase configuration
- `.firebaserc` - Project configuration
- `EMAIL_SETUP_GUIDE.md` - Email setup instructions
- `setup-email.sh` - Automated setup script (Mac/Linux)
- `setup-email.bat` - Automated setup script (Windows)

**Collections Added:**
- `registrationRequests` - Pending/approved/rejected requests
- `notifications` - User notifications (optional)
- `emailLogs` - Email delivery logs
