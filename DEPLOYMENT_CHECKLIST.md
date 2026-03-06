# Deployment Checklist

## Pre-Deployment

### 1. Firebase Project Setup
- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Enable Authentication → Email/Password provider
- [ ] Create Firestore database (Start in production mode)
- [ ] Note down project configuration

### 2. Code Configuration
- [ ] Update `src/firebase.js` with your Firebase config
- [ ] Set `ADMIN_EMAIL` in `src/firebase.js`
- [ ] Review and update any hardcoded values
- [ ] Remove any console.log statements (optional)

### 3. Security Rules
- [ ] Review `firestore.rules` file
- [ ] Customize rules if needed
- [ ] Test rules in Firebase Console Rules Playground

### 4. Build & Test
- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Run `npm run lint` to check for code issues
- [ ] Run `npm run build` to test production build
- [ ] Test build locally with `npm run preview`

## Deployment Steps

### Step 1: Deploy Firestore Rules
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Select:
# - Firestore
# - Use existing project
# - Accept default firestore.rules location

# Deploy rules
firebase deploy --only firestore:rules
```

### Step 2: Create Admin Account
1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter the email you set as `ADMIN_EMAIL`
4. Set a strong password
5. Save

### Step 3: Deploy Application

#### Option A: Firebase Hosting
```bash
# Initialize hosting (if not done)
firebase init hosting

# Build the app
npm run build

# Deploy
firebase deploy --only hosting
```

#### Option B: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
```

#### Option C: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Step 4: Data Migration (If Upgrading)
If you have existing data, run this migration:

```javascript
// Run in Firebase Console → Firestore → Rules → Playground
// Or create a Cloud Function

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function migrateData() {
  const batch = db.batch();
  
  // Migrate users
  const usersSnapshot = await db.collection('users').get();
  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (!data.assignedEvents) {
      batch.update(doc.ref, {
        assignedEvents: [],
        assignedTo: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
  
  // Migrate events
  const eventsSnapshot = await db.collection('events').get();
  eventsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (!data.createdBy) {
      batch.update(doc.ref, {
        createdBy: null,
        assignedManager: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
  
  // Migrate expenses
  const expensesSnapshot = await db.collection('expenses').get();
  expensesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (!data.createdByUid) {
      batch.update(doc.ref, {
        createdByUid: null,
        lastEditedBy: null,
        lastEditedAt: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
  
  await batch.commit();
  console.log('✅ Migration completed successfully!');
}

migrateData().catch(console.error);
```

### Step 5: Initial Configuration
1. **Login as Admin**
   - Use the admin email and password
   - Verify admin role is auto-assigned
   - Check that all features are accessible

2. **Create Test Event**
   - Click "＋ New Event"
   - Fill in test data
   - Verify event appears in sidebar

3. **Create Test Expense**
   - Navigate to "Add Expense"
   - Log a test expense
   - Verify it appears in dashboard

4. **Check Analytics**
   - Navigate to "Analytics" tab
   - Verify metrics are showing
   - Check activity log is working

## Post-Deployment

### Verification Checklist
- [ ] Admin can login successfully
- [ ] Admin role is auto-assigned
- [ ] Events can be created
- [ ] Expenses can be added
- [ ] Analytics dashboard loads
- [ ] Activity logs are recording
- [ ] Firestore rules are enforced
- [ ] Mobile view works correctly
- [ ] Desktop view works correctly
- [ ] CSV export works
- [ ] PDF export works

### Security Verification
- [ ] Try accessing admin features as non-admin (should fail)
- [ ] Try viewing unassigned events (should not appear)
- [ ] Try editing others' expenses as staff (should fail)
- [ ] Check Firestore rules in Firebase Console
- [ ] Verify activity logs are immutable
- [ ] Test permission boundaries

### Performance Check
- [ ] Page load time < 3 seconds
- [ ] Real-time updates working
- [ ] No console errors
- [ ] Animations smooth
- [ ] Mobile performance acceptable

## User Onboarding

### Step 1: Create User Accounts
Have team members register:
1. Share app URL
2. Click "Create Account"
3. Fill in:
   - Full name
   - Email
   - Password
   - Role (Manager or Staff)
4. Submit

### Step 2: Assign Events (Admin)
1. Login as admin
2. Navigate to "Users" tab
3. For each user:
   - Click "✏️ Assign Events"
   - Enter event IDs (comma-separated)
   - Confirm

### Step 3: Verify Access (Users)
1. Users login
2. Should see assigned events only
3. Can add expenses
4. Can view reports

### Step 4: Training
- [ ] Share `USER_GUIDE.md` with team
- [ ] Conduct training session
- [ ] Demo key features
- [ ] Answer questions
- [ ] Provide support contact

## Monitoring

### Daily
- [ ] Check activity logs for unusual activity
- [ ] Monitor error rates
- [ ] Review new expenses
- [ ] Check budget alerts

### Weekly
- [ ] Review user assignments
- [ ] Check for permission issues
- [ ] Export backup reports
- [ ] Review analytics trends

### Monthly
- [ ] Audit user roles
- [ ] Review event assignments
- [ ] Check Firestore usage
- [ ] Update documentation if needed

## Backup Strategy

### Automated Backups
Set up Firebase automatic backups:
1. Go to Firebase Console
2. Navigate to Firestore
3. Enable automatic backups
4. Set retention period

### Manual Exports
```bash
# Export Firestore data
gcloud firestore export gs://[BUCKET_NAME]

# Schedule monthly exports
# Use Cloud Scheduler + Cloud Functions
```

### Report Archives
- [ ] Export monthly CSV reports
- [ ] Store in secure location
- [ ] Keep for required retention period

## Rollback Plan

### If Issues Occur
1. **Revert Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   # Use previous version from git
   ```

2. **Revert Application**
   ```bash
   # Firebase Hosting
   firebase hosting:rollback
   
   # Vercel
   vercel rollback
   
   # Netlify
   # Use Netlify dashboard to rollback
   ```

3. **Restore Data**
   ```bash
   # From backup
   gcloud firestore import gs://[BUCKET_NAME]/[EXPORT_FOLDER]
   ```

## Troubleshooting

### Common Issues

#### "Permission Denied" Errors
**Cause**: Firestore rules not deployed or incorrect
**Fix**: 
```bash
firebase deploy --only firestore:rules
```

#### Admin Role Not Assigned
**Cause**: Email mismatch or profile not created
**Fix**:
1. Check `ADMIN_EMAIL` in `firebase.js`
2. Verify email in Firebase Auth
3. Delete user profile in Firestore
4. Login again

#### Events Not Showing
**Cause**: User not assigned to events
**Fix**:
1. Login as admin
2. Go to Users tab
3. Assign events to user

#### Activity Logs Not Recording
**Cause**: Permission issue or function not called
**Fix**:
1. Check Firestore rules for activityLogs
2. Verify `logActivity()` is called
3. Check browser console for errors

#### Real-time Updates Not Working
**Cause**: Firestore subscriptions failing
**Fix**:
1. Check internet connection
2. Verify Firestore rules
3. Check browser console
4. Refresh page

## Environment Variables (Optional)

For production security, use environment variables:

### Create `.env` file
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_ADMIN_EMAIL=admin@company.com
```

### Update `firebase.js`
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
```

### Set in Hosting Platform
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment
- **Firebase**: Use Cloud Functions config

## Success Criteria

Deployment is successful when:
- ✅ Application loads without errors
- ✅ Admin can login and access all features
- ✅ Firestore rules are enforced
- ✅ Real-time updates work
- ✅ Activity logs are recording
- ✅ Users can be assigned to events
- ✅ Reports can be exported
- ✅ Mobile view works correctly
- ✅ No console errors
- ✅ Performance is acceptable

## Support Contacts

- **Firebase Issues**: Firebase Support
- **Application Issues**: Development Team
- **User Training**: Admin/Manager
- **Security Concerns**: Security Team

## Documentation Links

- [Firebase Console](https://console.firebase.google.com)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Watch for errors
   - Check user feedback
   - Monitor performance

2. **Gather Feedback**
   - Survey users
   - Note pain points
   - Collect feature requests

3. **Plan Improvements**
   - Prioritize features
   - Schedule updates
   - Document changes

4. **Regular Maintenance**
   - Update dependencies
   - Review security
   - Optimize performance

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Version**: 2.0.0

**Status**: ☐ Success ☐ Issues ☐ Rolled Back

**Notes**: _____________________________________________
