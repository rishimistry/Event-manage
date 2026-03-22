# Email Notifications Setup Guide

## 📧 Overview

This guide will help you set up automated email notifications that are sent when registration requests are approved or rejected.

---

## 🏗️ Architecture

The email system uses **Firebase Cloud Functions** with **Nodemailer**:

1. User registration request is approved/rejected in Firestore
2. Cloud Function is triggered automatically
3. Function sends email via configured email service
4. Email delivery is logged to `emailLogs` collection

---

## 📋 Prerequisites

- Firebase project with Blaze (Pay as you go) plan
- Email service credentials (Gmail, SendGrid, etc.)
- Firebase CLI installed: `npm install -g firebase-tools`

---

## 🚀 Setup Steps

### Step 1: Update Firebase Project ID

Edit `.firebaserc` and replace `your-project-id` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### Step 2: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### Step 3: Login to Firebase

```bash
firebase login
```

### Step 4: Install Cloud Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### Step 5: Configure Email Service

You have two options:

#### Option A: Gmail (Easiest for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "2-Step Verification"
   - Scroll down to "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Set Firebase Config**:

```bash
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"
```

#### Option B: SendGrid (Recommended for Production)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Update `functions/index.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: functions.config().email?.password || process.env.EMAIL_PASSWORD,
  },
});
```

4. Set config:

```bash
firebase functions:config:set email.user="apikey" email.password="your-sendgrid-api-key"
```

### Step 6: Update App URL in Email Template

Edit `functions/index.js` and replace the login button URL:

```javascript
<a href="https://your-app-url.web.app" ...>
```

Replace `https://your-app-url.web.app` with your actual app URL.

### Step 7: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This will deploy two functions:
- `onRegistrationApproved` - Sends email when request is approved
- `onRegistrationRejected` - Sends email when request is rejected

### Step 8: Deploy Firestore Rules (if not done already)

```bash
firebase deploy --only firestore:rules
```

---

## 🧪 Testing

### Test Approval Email

1. Create a new user account (register as staff/manager)
2. Login as admin
3. Navigate to "Requests"
4. Approve the pending request
5. Check the user's email inbox

**Expected Email:**
- Subject: "🎉 Your EventXpense Account Has Been Approved!"
- Beautiful HTML email with account details
- Login button

### Test Rejection Email

1. Create another test account
2. Login as admin
3. Reject the request with a reason
4. Check the user's email inbox

**Expected Email:**
- Subject: "EventXpense Registration Request Update"
- HTML email with rejection reason
- Contact administrator message

### Check Email Logs

View sent emails in Firebase Console:
1. Go to Firestore Database
2. Open `emailLogs` collection
3. Each document shows:
   - `to`: Recipient email
   - `subject`: Email subject
   - `type`: "registration_approved" or "registration_rejected"
   - `success`: true/false
   - `sentAt`: Timestamp

---

## 🔍 Troubleshooting

### Issue: "Firebase requires Blaze plan"

**Solution:** Upgrade to Blaze plan (pay-as-you-go):
```bash
firebase open
```
Go to "Usage and billing" → "Upgrade project"

Note: Cloud Functions have a generous free tier (2M invocations/month)

### Issue: "Email not sent" or "Authentication failed"

**Solution:**
1. Verify email config:
```bash
firebase functions:config:get
```

2. Check Gmail App Password is correct (16 characters, no spaces)
3. Ensure 2FA is enabled on Gmail account

### Issue: "Function deployment failed"

**Solution:**
1. Check Node.js version (should be 18):
```bash
node --version
```

2. Reinstall dependencies:
```bash
cd functions
rm -rf node_modules package-lock.json
npm install
cd ..
```

3. Deploy again:
```bash
firebase deploy --only functions
```

### Issue: Email goes to spam

**Solution:**
1. For Gmail: Mark as "Not spam" once
2. For production: Use SendGrid or AWS SES with verified domain
3. Add SPF/DKIM records to your domain

### Issue: "Cannot read property 'user' of undefined"

**Solution:** Email config not set. Run:
```bash
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"
firebase deploy --only functions
```

---

## 📊 Monitoring

### View Function Logs

```bash
firebase functions:log
```

Or in Firebase Console:
1. Go to Functions
2. Click on function name
3. View "Logs" tab

### Check Email Delivery

Query `emailLogs` collection in Firestore:
```javascript
db.collection("emailLogs")
  .orderBy("sentAt", "desc")
  .limit(10)
  .get()
```

---

## 🎨 Customizing Email Templates

Edit `functions/index.js` to customize:

1. **Email Subject**: Change the `subject` variable
2. **Email Body**: Modify the HTML template
3. **Sender Name**: Update `from` field in `mailOptions`
4. **Colors**: Change inline styles in HTML
5. **Logo**: Add `<img>` tag in header section

Example - Add Logo:
```html
<tr>
  <td style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 40px 30px; text-align: center;">
    <img src="https://your-domain.com/logo.png" alt="Logo" style="width: 120px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">Account Approved!</h1>
  </td>
</tr>
```

---

## 💰 Cost Estimation

Firebase Cloud Functions pricing (Blaze plan):

- **Free Tier**: 2M invocations/month
- **After Free Tier**: $0.40 per million invocations
- **Outbound Networking**: $0.12 per GB

**Example:**
- 100 approvals/month = 100 function invocations
- Cost: $0.00 (within free tier)

Email service costs:
- **Gmail**: Free (with limits)
- **SendGrid**: Free tier (100 emails/day)
- **AWS SES**: $0.10 per 1,000 emails

---

## 🔐 Security Best Practices

1. **Never commit email credentials** to Git
2. Use Firebase Functions config or environment variables
3. For production, use SendGrid/AWS SES with API keys
4. Rotate email passwords regularly
5. Monitor `emailLogs` for suspicious activity
6. Set up email rate limiting if needed

---

## 📝 Email Service Alternatives

### SendGrid (Recommended for Production)
- Free tier: 100 emails/day
- Easy setup with API key
- Better deliverability than Gmail
- [Setup Guide](https://sendgrid.com/docs/for-developers/sending-email/integrating-with-the-smtp-api/)

### AWS SES
- Very cheap ($0.10 per 1,000 emails)
- Requires domain verification
- Best for high volume
- [Setup Guide](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)

### Mailgun
- Free tier: 5,000 emails/month
- Good for transactional emails
- [Setup Guide](https://documentation.mailgun.com/en/latest/quickstart-sending.html)

---

## ✅ Deployment Checklist

- [ ] Firebase project upgraded to Blaze plan
- [ ] `.firebaserc` updated with correct project ID
- [ ] Functions dependencies installed (`cd functions && npm install`)
- [ ] Email service configured (Gmail App Password or SendGrid API key)
- [ ] Firebase config set (`firebase functions:config:set`)
- [ ] App URL updated in email template
- [ ] Functions deployed (`firebase deploy --only functions`)
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Test approval email sent successfully
- [ ] Test rejection email sent successfully
- [ ] Email logs visible in Firestore
- [ ] Function logs checked for errors

---

## 🎯 Next Steps

Once email notifications are working:

1. **Add Welcome Email**: Send welcome email with getting started guide
2. **Event Assignment Notifications**: Notify staff when assigned to events
3. **Expense Approval Emails**: Notify managers of pending expense approvals
4. **Weekly Reports**: Send weekly expense summaries via email
5. **Password Reset**: Implement custom password reset emails

---

## 📞 Support

If you encounter issues:

1. Check Firebase Functions logs: `firebase functions:log`
2. Verify email config: `firebase functions:config:get`
3. Check `emailLogs` collection in Firestore
4. Review function deployment status in Firebase Console
5. Test email service credentials separately

---

## 🎉 Success!

Once deployed, users will automatically receive professional HTML emails when their registration requests are approved or rejected. The system logs all email deliveries for monitoring and debugging.

**Email Features:**
- ✅ Beautiful HTML design matching app theme
- ✅ Responsive layout for mobile devices
- ✅ Account details and role information
- ✅ Direct login button
- ✅ Rejection reason (if applicable)
- ✅ Automatic delivery logging
- ✅ Error handling and fallbacks
