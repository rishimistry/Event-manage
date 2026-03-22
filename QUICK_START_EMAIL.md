# Quick Start: Email Notifications

## 🚀 5-Minute Setup

### Prerequisites
- Firebase project on Blaze plan (pay-as-you-go)
- Gmail account with 2FA enabled

### Step 1: Run Setup Script

**Windows:**
```bash
cd expense-tracker
setup-email.bat
```

**Mac/Linux:**
```bash
cd expense-tracker
chmod +x setup-email.sh
./setup-email.sh
```

### Step 2: Follow Prompts

1. Enter Firebase Project ID
2. Choose Gmail (option 1)
3. Enter Gmail address
4. Enter App Password ([Get it here](https://myaccount.google.com/apppasswords))
5. Deploy when prompted

### Step 3: Test

1. Register a new test account
2. Login as admin
3. Approve the request
4. Check test account's email inbox

**Done!** 🎉

---

## Manual Setup (Alternative)

```bash
# 1. Install dependencies
cd functions
npm install
cd ..

# 2. Set email config
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"

# 3. Deploy
firebase deploy --only functions
```

---

## Verify Setup

Check Firebase Console → Functions:
- ✅ `onRegistrationApproved` deployed
- ✅ `onRegistrationRejected` deployed

Check Firestore → Collections:
- ✅ `emailLogs` collection created after first email

---

## Troubleshooting

**Email not sent?**
```bash
# Check logs
firebase functions:log

# Verify config
firebase functions:config:get

# Redeploy
firebase deploy --only functions
```

**Need Blaze plan?**
- Go to Firebase Console → Usage and billing → Upgrade
- Free tier: 2M function calls/month (plenty for most apps)

---

## Email Templates

Emails are automatically sent with:
- ✅ Beautiful HTML design
- ✅ Account details
- ✅ Login button
- ✅ Rejection reason (if rejected)

Customize templates in `functions/index.js`

---

## Support

Full documentation: `EMAIL_SETUP_GUIDE.md`

Common issues:
- Gmail auth failed → Regenerate App Password
- Function not triggered → Check Firestore rules deployed
- Email in spam → Mark as "Not spam" once

---

**That's it!** Users now receive professional emails when approved/rejected.
