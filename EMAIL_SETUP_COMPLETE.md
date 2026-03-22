# 📧 Email Notifications - Complete Setup Guide

## Choose Your Solution

### Option 1: EmailJS (FREE - Recommended) ⭐
- ✅ Works with Firebase FREE Spark plan
- ✅ 200 emails/month free
- ✅ 5-minute setup
- ✅ No credit card required
- ✅ Perfect for small teams

### Option 2: Cloud Functions (Paid)
- ⚠️ Requires Firebase Blaze plan
- ✅ Unlimited emails
- ✅ More control
- ✅ Better for large teams

---

## 🆓 Option 1: EmailJS Setup (Recommended)

### Step 1: Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up (free, no credit card)
3. Verify your email

### Step 2: Connect Email Service

1. Click **Email Services** → **Add New Service**
2. Choose **Gmail**
3. Click **Connect Account** and authorize
4. Copy your **Service ID** (looks like `service_abc123`)

### Step 3: Create Approval Email Template

1. Go to **Email Templates** → **Create New Template**
2. **Template Name**: `Approval Email`
3. **Subject**: `🎉 Your EventXpense Account Has Been Approved!`
4. **Content**: Paste this HTML:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Account Approved!</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; color: #333;">Hi <strong>{{user_name}}</strong>,</p>
    
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      Great news! Your registration request for <strong style="color: #4ECDC4;">{{user_role}}</strong> access has been approved by {{approver_name}}.
    </p>
    
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      You can now log in to EventXpense and start managing event expenses with your team.
    </p>
    
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px; color: #666; font-size: 12px;">Email</td>
          <td style="padding: 8px; color: #333; font-weight: bold; text-align: right;">{{user_email}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666; font-size: 12px; border-top: 1px solid #ddd;">Role</td>
          <td style="padding: 8px; color: #4ECDC4; font-weight: bold; text-align: right; border-top: 1px solid #ddd;">{{user_role}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666; font-size: 12px; border-top: 1px solid #ddd;">Approved By</td>
          <td style="padding: 8px; color: #333; font-weight: bold; text-align: right; border-top: 1px solid #ddd;">{{approver_name}}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{app_url}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #4ECDC4 0%, #457B9D 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Login to EventXpense →
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      If you have any questions, please contact your administrator.
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    EventXpense • Team Expense Hub
  </div>
</div>
```

5. Click **Save**
6. Copy the **Template ID** (looks like `template_xyz789`)

### Step 4: Create Rejection Email Template

1. Create another template: **Email Templates** → **Create New Template**
2. **Template Name**: `Rejection Email`
3. **Subject**: `EventXpense Registration Request Update`
4. **Content**: Paste this HTML:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
  <div style="background: linear-gradient(135deg, #E63946 0%, #C1121F 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📋 Registration Update</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; color: #333;">Hi <strong>{{user_name}}</strong>,</p>
    
    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      We regret to inform you that your registration request for <strong>{{user_role}}</strong> access has not been approved at this time.
    </p>
    
    <div style="background: rgba(230,57,70,0.1); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E63946;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #E63946; font-weight: bold;">REASON</p>
      <p style="margin: 0; font-size: 14px; color: #333;">{{rejection_reason}}</p>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      If you believe this is an error or would like to discuss this decision, please contact your administrator.
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    EventXpense • Team Expense Hub
  </div>
</div>
```

5. Click **Save**
6. Copy the **Template ID**

### Step 5: Get Your Public Key

1. Go to **Account** tab
2. Copy your **Public Key** (looks like `abc123XYZ`)

### Step 6: Install EmailJS Package

```bash
cd expense-tracker
npm install @emailjs/browser
```

### Step 7: Configure Your App

Edit `src/firebase.js` and update the `EMAILJS_CONFIG` section:

```javascript
export const EMAILJS_CONFIG = {
  publicKey: "YOUR_PUBLIC_KEY_HERE",           // From step 5
  serviceId: "service_abc123",                  // From step 2
  approvalTemplateId: "template_xyz789",        // From step 3
  rejectionTemplateId: "template_abc456",       // From step 4
  appUrl: window.location.origin,
};
```

### Step 8: Test It!

1. Register a new test account
2. Login as admin
3. Approve the request
4. Check the test user's email inbox
5. You should receive a beautiful approval email! 🎉

---

## 💰 Option 2: Cloud Functions (Blaze Plan)

If you prefer Cloud Functions, follow the guide in `EMAIL_SETUP_GUIDE.md`.

**Requirements:**
- Firebase Blaze plan (pay-as-you-go)
- More complex setup
- Better for high-volume usage

---

## 🧪 Testing Checklist

- [ ] EmailJS account created
- [ ] Gmail service connected
- [ ] Approval template created and ID copied
- [ ] Rejection template created and ID copied
- [ ] Public key copied
- [ ] `@emailjs/browser` package installed
- [ ] `firebase.js` updated with all IDs
- [ ] Test approval email sent successfully
- [ ] Test rejection email sent successfully
- [ ] Emails look good on mobile and desktop

---

## 🔍 Troubleshooting

### Email not sent?

**Check browser console:**
```
✅ Approval email sent: 200
```

If you see:
```
📧 EmailJS not configured. Skipping email.
```

**Solution:** Update `EMAILJS_CONFIG` in `src/firebase.js` with your actual IDs.

### "Failed to send email"

**Common causes:**
1. Wrong Service ID or Template ID
2. EmailJS account not verified
3. Gmail service not connected
4. Template variables don't match

**Solution:** Double-check all IDs in EmailJS dashboard.

### Email goes to spam

**Solution:**
1. Mark as "Not spam" once
2. In EmailJS, verify your email domain
3. Ask users to add your email to contacts

### Hit 200 email limit

**Solutions:**
1. Upgrade EmailJS plan ($15/month for 1000 emails)
2. Switch to Cloud Functions (unlimited)
3. Use multiple EmailJS accounts (not recommended)

---

## 📊 Email Limits Comparison

| Service | Free Tier | Paid Tier | Best For |
|---------|-----------|-----------|----------|
| EmailJS | 200/month | 1000/month ($15) | Small teams |
| Cloud Functions | N/A | Unlimited (Blaze) | Large teams |
| SendGrid | 100/day | 40k/month ($15) | High volume |

---

## 🎨 Customizing Email Templates

Edit templates in EmailJS dashboard:

1. Go to **Email Templates**
2. Click on template name
3. Modify HTML/CSS
4. Click **Save**
5. Changes apply immediately (no redeployment needed!)

**Available variables:**
- `{{user_name}}` - User's name
- `{{user_email}}` - User's email
- `{{user_role}}` - Requested role (STAFF/MANAGER)
- `{{approver_name}}` - Who approved
- `{{app_url}}` - Your app URL
- `{{rejection_reason}}` - Why rejected

---

## ✅ Success!

Once configured, emails are sent automatically when you approve/reject requests. Users receive professional HTML emails instantly!

**What happens:**
1. Admin clicks "Approve" or "Reject"
2. Database updated
3. Email sent via EmailJS
4. User receives notification
5. Console logs success/failure

**No Blaze plan needed!** 🎉

---

## 🆘 Need Help?

**EmailJS not working?**
- Check console for error messages
- Verify all IDs are correct
- Test templates in EmailJS dashboard
- Check EmailJS account is verified

**Want Cloud Functions instead?**
- See `EMAIL_SETUP_GUIDE.md`
- Requires Firebase Blaze plan
- More setup but unlimited emails

**Questions?**
- EmailJS docs: https://www.emailjs.com/docs/
- Firebase docs: https://firebase.google.com/docs
