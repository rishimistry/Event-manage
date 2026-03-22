# EventXpense User Guide

## Quick Start

### First Time Setup (Admin)
1. **Login** with the admin email configured in the system
2. **Create Events** from the sidebar "＋ New Event" button
3. **Add Team Members** by having them register through the login page
4. **Assign Roles** in the "Users" tab
5. **Assign Events** to managers and staff in the "Users" tab
6. **Start Tracking** expenses!

## Role-Specific Guides

### 👑 Admin Guide

#### Dashboard Overview
- View all events in the system
- See budget vs. spent for each event
- Access all expenses across events
- Monitor team activity

#### Creating Events
1. Click "＋ New Event" in sidebar or mobile tabs
2. Fill in:
   - Event Name (required)
   - Location (optional)
   - Budget in ₹ (required)
   - Event Date (required)
3. Click "🎉 Create Event"

#### Managing Users
1. Navigate to "Users" tab
2. **Change Roles**: Use dropdown next to user
3. **Assign Events**: 
   - Click "✏️ Assign Events" button
   - Enter event IDs (comma-separated)
   - Available events are listed in the prompt
4. **View Assignments**: See assigned events as colored badges

#### Analytics Dashboard
1. Navigate to "Analytics" tab
2. View:
   - Total events, expenses, users, spending
   - Event performance bars
   - User role breakdown
   - Recent activity log (last 20 actions)

#### Activity Monitoring
- Color-coded activity types:
  - 🟢 Teal: Expense added, Staff assigned
  - 🟠 Orange: Expense edited
  - 🔴 Red: Expense deleted
  - 🟣 Purple: Event created, Events assigned, Role changed

### 👔 Manager Guide

#### Viewing Assigned Events
- Only events assigned to you appear in sidebar
- Switch between events using sidebar buttons
- Mobile: Use horizontal tabs at top

#### Adding Expenses
1. Click "Add Expense" tab or FAB button
2. Select:
   - Category (Travel, Food, Decor, etc.)
   - Payment Mode (Cash, UPI, Card, etc.)
3. Enter:
   - Description (required)
   - Amount in ₹ (required)
   - Your Name (required)
   - Note (optional)
4. Click "⚡ LOG EXPENSE NOW"

#### Managing Team Expenses
- View all expenses in your events
- Edit expenses created by your staff
- Delete expenses if needed
- Cannot edit/delete expenses from other managers

#### Generating Reports
1. Navigate to "Reports" tab
2. Select event from dropdown
3. View:
   - Budget summary
   - Category breakdown
   - Payment mode distribution
   - Team contribution
4. Export:
   - 📊 Download CSV (for Excel)
   - 📑 Export PDF (for printing)

### 👷 Staff Guide

#### Viewing Your Events
- See only events assigned to you
- Switch between events in sidebar
- Mobile: Swipe through event tabs

#### Logging Expenses
1. Click "Add Expense" tab
2. Choose category and payment mode
3. Fill in details:
   - What you spent on (description)
   - How much (amount)
   - Your name
   - Any notes (receipt number, vendor, etc.)
4. Submit

#### Viewing Reports
1. Go to "Reports" tab
2. Select your event
3. View expense breakdown
4. Download PDF report (📑 Export PDF)
5. Note: CSV export not available for staff

#### Managing Your Expenses
- View all your logged expenses
- Edit your own expenses only
- Delete your own expenses only
- Cannot modify others' expenses

## Common Tasks

### Adding an Expense
**Time: ~10 seconds**
1. Click "Add Expense" or FAB (+) button
2. Pick category icon
3. Pick payment mode icon
4. Type description and amount
5. Select your name
6. Click submit

### Filtering Expenses
1. On Dashboard, scroll to filters
2. **By Category**: Click category chips
3. **By Payment**: Click payment mode chips
4. **Clear**: Click "All" or "↩ Clear filters"

### Viewing Expense Details
1. Click any expense row
2. Expands to show:
   - Full details
   - Category and payment info
   - Date and logged by
   - Notes (if any)
   - Edit history (if edited)
3. Click again to collapse

### Exporting Reports
**CSV (Admin/Manager only):**
- Contains all expense data
- Opens in Excel/Google Sheets
- Good for analysis and accounting

**PDF (All roles):**
- Formatted report
- Good for printing
- Includes summary and expense table

### Adding Team Members
**Admin only:**
1. Share registration link with team
2. They register with:
   - Full name
   - Email
   - Password
   - Role (Manager or Staff)
3. You assign events to them in "Users" tab

## Tips & Tricks

### For Admins
- ✅ Assign events immediately after creating them
- ✅ Review activity logs regularly
- ✅ Use Analytics to spot budget overruns
- ✅ Archive completed events (coming soon)
- ✅ Export reports before month-end

### For Managers
- ✅ Log expenses daily, not weekly
- ✅ Add notes with receipt numbers
- ✅ Review team expenses regularly
- ✅ Export reports for your records
- ✅ Monitor budget progress

### For Staff
- ✅ Log expenses immediately after spending
- ✅ Take photos of receipts (upload coming soon)
- ✅ Add detailed notes
- ✅ Double-check amounts before submitting
- ✅ Use correct payment mode

## Keyboard Shortcuts

- **Enter** in forms: Submit
- **Escape** in modals: Close
- **Click outside modal**: Close modal
- **Click expense row**: Expand/collapse

## Mobile Usage

### Navigation
- **Bottom tabs**: Switch between views
- **Horizontal scroll**: Event tabs
- **Swipe**: Scroll through lists
- **Tap**: Expand expense details

### Best Practices
- Use landscape for better view
- Scroll horizontally for all categories
- Tap and hold for tooltips (coming soon)

## Troubleshooting

### "No Events Assigned"
**Solution**: Contact your admin to assign events to you

### "You can only delete your own expenses"
**Reason**: Staff can only delete their own expenses
**Solution**: Ask your manager to delete if needed

### "Failed to save expense"
**Possible causes**:
- No internet connection
- Firestore rules not deployed
- Not assigned to this event
**Solution**: Check connection, refresh page, contact admin

### "Cannot create event"
**Reason**: Only admins can create events
**Solution**: Contact your admin

### Expense not appearing
**Possible causes**:
- Not assigned to that event
- Filters active
**Solution**: Clear filters, check event assignment

### Cannot see Analytics tab
**Reason**: Only admins have access
**Solution**: This is expected for managers and staff

## Data & Privacy

### What's Stored
- User profiles (name, email, role)
- Event details (name, location, budget, date)
- Expenses (amount, category, payment, notes)
- Activity logs (who did what, when)

### Who Can See What
- **Admins**: Everything
- **Managers**: Only their assigned events
- **Staff**: Only their assigned events

### Data Security
- Encrypted in transit (HTTPS)
- Encrypted at rest (Firebase)
- Role-based access control
- Activity logging for audit
- Firestore security rules

## Support

### Getting Help
1. Check this guide first
2. Ask your admin
3. Check activity logs (admin only)
4. Review browser console for errors

### Reporting Issues
Include:
- Your role
- What you were trying to do
- Error message (if any)
- Screenshot (if helpful)

### Feature Requests
Contact your admin with:
- What feature you need
- Why it would be helpful
- How you'd use it

## Best Practices

### Expense Logging
- ✅ Log immediately after spending
- ✅ Use descriptive names
- ✅ Add receipt numbers in notes
- ✅ Select correct category
- ✅ Choose accurate payment mode
- ❌ Don't wait until end of day
- ❌ Don't use vague descriptions
- ❌ Don't forget to add notes

### Budget Management
- ✅ Check budget regularly
- ✅ Alert team when 80% used
- ✅ Plan for contingencies
- ✅ Export reports monthly
- ❌ Don't exceed budget without approval
- ❌ Don't ignore warnings

### Team Collaboration
- ✅ Communicate with team
- ✅ Review expenses together
- ✅ Share reports with stakeholders
- ✅ Log expenses promptly
- ❌ Don't duplicate entries
- ❌ Don't delete others' expenses

## Glossary

**Event**: A project or occasion being tracked (wedding, conference, etc.)

**Expense**: A single spending entry with amount, category, and details

**Category**: Type of expense (Travel, Food, Decor, Labour, Equipment, Misc)

**Payment Mode**: How expense was paid (Cash, UPI, Card, Bank, Wallet, Cheque)

**Budget**: Total allocated amount for an event

**Spent**: Total of all expenses logged

**Remaining**: Budget minus spent

**Assignment**: Linking users to events they can access

**Activity Log**: Record of all actions in the system

**Role**: User's permission level (Admin, Manager, Staff)

**FAB**: Floating Action Button (+ button in corner)

## Updates & Changelog

### Version 2.0.0 (Current)
- ✨ Full RBAC implementation
- ✨ Activity logging
- ✨ Analytics dashboard
- ✨ Event assignments
- ✨ Enhanced user management
- ✨ Permission-based UI

### Version 1.0.0
- Basic expense tracking
- Simple role system
- Event management
- CSV/PDF export

## Coming Soon

- 📸 Receipt upload
- 📧 Email notifications
- 📦 Event archiving
- 🔔 Budget alerts
- 📱 Mobile app
- 🔄 Offline support
- ✅ Expense approval workflow
- 📊 Advanced analytics

---

**Need help?** Contact your system administrator or refer to the technical documentation in `RBAC_IMPLEMENTATION.md`.
