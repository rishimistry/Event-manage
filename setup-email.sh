#!/bin/bash

# ══════════════════════════════════════════════════════════════
#  Email Notifications Setup Script
#  ──────────────────────────────────────────────────────────────
#  Automates the setup of Firebase Cloud Functions for emails
# ══════════════════════════════════════════════════════════════

echo "🚀 EventXpense Email Notifications Setup"
echo "=========================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

echo "✅ Firebase CLI found"
echo ""

# Check if logged in
echo "🔐 Checking Firebase authentication..."
firebase login:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔑 Please login to Firebase..."
    firebase login
fi

echo "✅ Authenticated"
echo ""

# Get project ID
echo "📋 Enter your Firebase Project ID:"
read -p "Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID is required!"
    exit 1
fi

# Update .firebaserc
echo "📝 Updating .firebaserc..."
cat > .firebaserc << EOF
{
  "projects": {
    "default": "$PROJECT_ID"
  }
}
EOF

echo "✅ Project ID set to: $PROJECT_ID"
echo ""

# Install functions dependencies
echo "📦 Installing Cloud Functions dependencies..."
cd functions
npm install
cd ..

echo "✅ Dependencies installed"
echo ""

# Configure email
echo "📧 Email Service Configuration"
echo "------------------------------"
echo "Choose your email service:"
echo "1) Gmail (easiest for testing)"
echo "2) SendGrid (recommended for production)"
echo "3) Skip (configure later)"
read -p "Choice (1-3): " EMAIL_CHOICE

if [ "$EMAIL_CHOICE" = "1" ]; then
    echo ""
    echo "📧 Gmail Setup"
    echo "-------------"
    echo "Before continuing, make sure you have:"
    echo "1. Enabled 2-Factor Authentication on your Gmail account"
    echo "2. Generated an App Password (16 characters)"
    echo ""
    echo "Generate App Password here:"
    echo "https://myaccount.google.com/apppasswords"
    echo ""
    read -p "Gmail address: " GMAIL_USER
    read -sp "App Password (16 chars): " GMAIL_PASS
    echo ""
    
    firebase functions:config:set email.user="$GMAIL_USER" email.password="$GMAIL_PASS"
    
    echo "✅ Gmail configured"
    
elif [ "$EMAIL_CHOICE" = "2" ]; then
    echo ""
    echo "📧 SendGrid Setup"
    echo "----------------"
    echo "Get your API key from: https://app.sendgrid.com/settings/api_keys"
    echo ""
    read -p "SendGrid API Key: " SENDGRID_KEY
    
    firebase functions:config:set email.user="apikey" email.password="$SENDGRID_KEY"
    
    echo "✅ SendGrid configured"
    echo ""
    echo "⚠️  Don't forget to update functions/index.js with SendGrid SMTP settings!"
else
    echo "⏭️  Skipping email configuration"
fi

echo ""

# Deploy functions
echo "🚀 Ready to deploy Cloud Functions?"
echo "This will deploy email notification triggers to Firebase."
read -p "Deploy now? (y/n): " DEPLOY_CHOICE

if [ "$DEPLOY_CHOICE" = "y" ] || [ "$DEPLOY_CHOICE" = "Y" ]; then
    echo "🚀 Deploying Cloud Functions..."
    firebase deploy --only functions
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment successful!"
        echo ""
        echo "🎉 Email notifications are now active!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Test by approving a registration request"
        echo "2. Check email inbox for notification"
        echo "3. View logs: firebase functions:log"
        echo "4. Check emailLogs collection in Firestore"
    else
        echo ""
        echo "❌ Deployment failed!"
        echo "Check the error messages above and try again."
        exit 1
    fi
else
    echo "⏭️  Skipping deployment"
    echo ""
    echo "To deploy later, run:"
    echo "  firebase deploy --only functions"
fi

echo ""
echo "📚 For detailed setup instructions, see:"
echo "  EMAIL_SETUP_GUIDE.md"
echo ""
echo "✨ Setup complete!"
