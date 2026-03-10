@echo off
REM ══════════════════════════════════════════════════════════════
REM  Email Notifications Setup Script (Windows)
REM  ──────────────────────────────────────────────────────────────
REM  Automates the setup of Firebase Cloud Functions for emails
REM ══════════════════════════════════════════════════════════════

echo.
echo ========================================
echo EventXpense Email Notifications Setup
echo ========================================
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Firebase CLI not found!
    echo Installing Firebase CLI...
    npm install -g firebase-tools
)

echo Firebase CLI found
echo.

REM Check if logged in
echo Checking Firebase authentication...
firebase login:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Please login to Firebase...
    firebase login
)

echo Authenticated
echo.

REM Get project ID
set /p PROJECT_ID="Enter your Firebase Project ID: "

if "%PROJECT_ID%"=="" (
    echo Project ID is required!
    exit /b 1
)

REM Update .firebaserc
echo Updating .firebaserc...
(
echo {
echo   "projects": {
echo     "default": "%PROJECT_ID%"
echo   }
echo }
) > .firebaserc

echo Project ID set to: %PROJECT_ID%
echo.

REM Install functions dependencies
echo Installing Cloud Functions dependencies...
cd functions
call npm install
cd ..

echo Dependencies installed
echo.

REM Configure email
echo ========================================
echo Email Service Configuration
echo ========================================
echo Choose your email service:
echo 1^) Gmail ^(easiest for testing^)
echo 2^) SendGrid ^(recommended for production^)
echo 3^) Skip ^(configure later^)
echo.
set /p EMAIL_CHOICE="Choice (1-3): "

if "%EMAIL_CHOICE%"=="1" (
    echo.
    echo ========================================
    echo Gmail Setup
    echo ========================================
    echo Before continuing, make sure you have:
    echo 1. Enabled 2-Factor Authentication on your Gmail account
    echo 2. Generated an App Password ^(16 characters^)
    echo.
    echo Generate App Password here:
    echo https://myaccount.google.com/apppasswords
    echo.
    set /p GMAIL_USER="Gmail address: "
    set /p GMAIL_PASS="App Password (16 chars): "
    
    firebase functions:config:set email.user="%GMAIL_USER%" email.password="%GMAIL_PASS%"
    
    echo Gmail configured
    echo.
) else if "%EMAIL_CHOICE%"=="2" (
    echo.
    echo ========================================
    echo SendGrid Setup
    echo ========================================
    echo Get your API key from: https://app.sendgrid.com/settings/api_keys
    echo.
    set /p SENDGRID_KEY="SendGrid API Key: "
    
    firebase functions:config:set email.user="apikey" email.password="%SENDGRID_KEY%"
    
    echo SendGrid configured
    echo.
    echo WARNING: Don't forget to update functions/index.js with SendGrid SMTP settings!
    echo.
) else (
    echo Skipping email configuration
    echo.
)

REM Deploy functions
echo ========================================
echo Ready to deploy Cloud Functions?
echo This will deploy email notification triggers to Firebase.
echo ========================================
set /p DEPLOY_CHOICE="Deploy now? (y/n): "

if /i "%DEPLOY_CHOICE%"=="y" (
    echo.
    echo Deploying Cloud Functions...
    firebase deploy --only functions
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo Deployment successful!
        echo ========================================
        echo.
        echo Email notifications are now active!
        echo.
        echo Next steps:
        echo 1. Test by approving a registration request
        echo 2. Check email inbox for notification
        echo 3. View logs: firebase functions:log
        echo 4. Check emailLogs collection in Firestore
        echo.
    ) else (
        echo.
        echo Deployment failed!
        echo Check the error messages above and try again.
        exit /b 1
    )
) else (
    echo.
    echo Skipping deployment
    echo.
    echo To deploy later, run:
    echo   firebase deploy --only functions
    echo.
)

echo ========================================
echo For detailed setup instructions, see:
echo   EMAIL_SETUP_GUIDE.md
echo ========================================
echo.
echo Setup complete!
echo.
pause
