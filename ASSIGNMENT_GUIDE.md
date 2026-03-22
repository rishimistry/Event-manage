# Event Assignment Guide

## How to Assign Events to Team Members

### For Admins

#### Step 1: Navigate to Users Tab
1. Click "Users" in the sidebar or bottom navigation
2. You'll see all registered users (admins, managers, and staff)

#### Step 2: Find the User
Scroll through the user list to find the person you want to assign events to.

Each user card shows:
- Avatar with first letter
- Full name
- Email address
- Current role badge
- Currently assigned events (if any)

#### Step 3: Click "Manage Event Access"
Click the "📋 Manage Event Access" button on the user's card.

#### Step 4: Select Events
A modal will open showing all available events.

**Event Card Layout:**
```
☐ Event Name
  Location · Date · Budget: ₹50,000
```

**To Select/Deselect:**
- Click anywhere on the event card
- Selected events show:
  - ✓ Checkmark in checkbox
  - Orange highlight
  - Orange text

**Visual Feedback:**
- Unselected: Gray background, gray checkbox
- Selected: Orange background, orange checkbox with ✓

#### Step 5: Save Assignment
1. Review your selections
2. Button shows count: "✅ Assign 3 Events"
3. Click the button to save
4. Success toast appears
5. Modal closes automatically
6. User card updates to show new assignments

### For Managers

#### Step 1: Navigate to My Team Tab
1. Click "My Team" in the sidebar or bottom navigation
2. You'll see only staff members (not other managers or admins)

#### Step 2: Find Your Staff Member
Scroll through the staff list.

#### Step 3: Click "Manage Event Access"
Click the "📋 Manage Event Access" button.

#### Step 4: Select Your Events
**Important**: You can only assign events that are assigned to you!

The modal shows only your events, not all system events.

Select events the same way as admins (click to toggle).

#### Step 5: Save Assignment
Click "✅ Assign X Events" to save.

## Visual Guide

### User Card (Before Assignment)
```
┌─────────────────────────────────────────────┐
│  👤  Rahul Sharma                          │
│      rahul@company.com                     │
│                                    [STAFF]  │
├─────────────────────────────────────────────┤
│ Assigned Events (0)                         │
│ No events assigned                          │
│                                             │
│ [📋 Manage Event Access]                   │
└─────────────────────────────────────────────┘
```

### Assignment Modal
```
┌──────────────────────────────────────────────────┐
│ 📋 Assign Events to Rahul Sharma                │
│ ✕                                                │
├──────────────────────────────────────────────────┤
│ Select which events Rahul Sharma can access.    │
│ As admin, you can assign any event.             │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ ☑ Sharma Wedding                         │   │
│ │   Mumbai · 2026-03-15 · Budget: ₹85,000 │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ ☐ TechCorp Annual Meet                   │   │
│ │   Pune · 2026-03-22 · Budget: ₹120,000  │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ ☑ Gupta Reception                        │   │
│ │   Delhi · 2026-04-05 · Budget: ₹60,000  │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ [Cancel]          [✅ Assign 2 Events]          │
└──────────────────────────────────────────────────┘
```

### User Card (After Assignment)
```
┌─────────────────────────────────────────────┐
│  👤  Rahul Sharma                          │
│      rahul@company.com                     │
│                                    [STAFF]  │
├─────────────────────────────────────────────┤
│ Assigned Events (2)                         │
│ [Sharma Wedding] [Gupta Reception]          │
│                                             │
│ [📋 Manage Event Access]                   │
└─────────────────────────────────────────────┘
```

## Tips & Best Practices

### For Admins
✅ **Do:**
- Assign events immediately after creating them
- Assign managers to events they'll oversee
- Assign staff to events they'll work on
- Review assignments regularly
- Use activity logs to track changes

❌ **Don't:**
- Forget to assign events to new users
- Assign too many events to one person
- Remove assignments without communication

### For Managers
✅ **Do:**
- Assign your events to your team members
- Communicate with staff about assignments
- Review who has access to what
- Update assignments as needed

❌ **Don't:**
- Try to assign events you don't have access to (won't appear)
- Forget to assign new staff members
- Remove access without telling the staff member

### For Staff
ℹ️ **Note:**
- You cannot assign events (read-only access)
- Contact your manager or admin for event access
- You'll only see events assigned to you

## Keyboard Shortcuts

- **Click**: Select/deselect event
- **Escape**: Close modal (cancel)
- **Enter**: Save assignment (when button focused)

## Mobile Usage

### Touch Interactions
- **Tap event card**: Select/deselect
- **Tap outside modal**: Close (cancel)
- **Scroll**: View more events

### Mobile Layout
- Modal takes full screen on mobile
- Events stack vertically
- Buttons stack on small screens
- Checkboxes are touch-friendly (larger hit area)

## Troubleshooting

### "No events to assign"
**Manager**: You don't have any events assigned to you yet. Contact your admin.

**Admin**: Create events first before assigning them.

### "Cannot see staff member"
**Manager**: Make sure the user is registered as "Staff" role.

**Admin**: Check that the user exists and has the correct role.

### "Assignment not saving"
**Possible causes:**
1. No internet connection
2. Firestore rules not deployed
3. Insufficient permissions

**Solutions:**
1. Check internet connection
2. Redeploy Firestore rules: `firebase deploy --only firestore:rules`
3. Verify your role (admin or manager)

### "Events not showing in modal"
**Manager**: You can only assign events you have access to. If you see no events, you haven't been assigned any yet.

**Admin**: If no events show, create events first.

### "Staff can still see unassigned events"
**Issue**: Reports section showing all events

**Fix**: This was fixed in v2.1. Make sure you're running the latest version.

## Activity Logging

Every assignment is logged with:
- Who made the assignment (admin or manager)
- Who was assigned (target user)
- How many events were assigned
- Timestamp

View logs in Analytics dashboard (admin only).

## Permissions Summary

| Action | Admin | Manager | Staff |
|--------|-------|---------|-------|
| Open assignment modal | ✅ | ✅ | ❌ |
| Assign any event | ✅ | ❌ | ❌ |
| Assign own events | ✅ | ✅ | ❌ |
| See all users | ✅ | ❌ | ❌ |
| See staff only | ✅ | ✅ | ❌ |
| Change roles | ✅ | ❌ | ❌ |

## Examples

### Example 1: Admin Assigns Manager to Events
1. Admin creates 3 events: Wedding A, Wedding B, Conference C
2. Manager "Priya" registers
3. Admin goes to Users tab
4. Clicks "📋 Manage Event Access" on Priya's card
5. Selects Wedding A and Wedding B
6. Clicks "✅ Assign 2 Events"
7. Priya can now see and manage Wedding A and Wedding B

### Example 2: Manager Assigns Staff to Event
1. Manager "Priya" has access to Wedding A and Wedding B
2. Staff "Rahul" registers
3. Priya goes to My Team tab
4. Clicks "📋 Manage Event Access" on Rahul's card
5. Sees only Wedding A and Wedding B (her events)
6. Selects Wedding A
7. Clicks "✅ Assign 1 Event"
8. Rahul can now log expenses for Wedding A

### Example 3: Updating Assignments
1. Staff "Rahul" is assigned to Wedding A
2. Manager wants to add Wedding B
3. Manager clicks "📋 Manage Event Access" on Rahul
4. Wedding A is already checked ✓
5. Manager clicks Wedding B to select it
6. Both are now checked
7. Clicks "✅ Assign 2 Events"
8. Rahul now has access to both events

### Example 4: Removing Access
1. Staff "Rahul" has access to Wedding A and Wedding B
2. Wedding A is completed
3. Manager clicks "📋 Manage Event Access"
4. Both events are checked
5. Manager clicks Wedding A to uncheck it
6. Only Wedding B remains checked
7. Clicks "✅ Assign 1 Event"
8. Rahul now only has access to Wedding B

## FAQ

**Q: Can I assign multiple users at once?**
A: Not yet. This is a planned feature for future versions.

**Q: Can staff see who else is assigned to an event?**
A: No, staff only see their own assignments.

**Q: Can managers assign other managers?**
A: No, only admins can assign managers.

**Q: What happens if I remove all assignments?**
A: The user will see "No events assigned" and cannot access any event data.

**Q: Can I assign events to admins?**
A: Admins automatically have access to all events, no assignment needed.

**Q: How do I know if assignment was successful?**
A: You'll see a green success toast, and the user card updates immediately.

**Q: Can I cancel after selecting events?**
A: Yes, click "Cancel" or click outside the modal.

**Q: Are changes saved automatically?**
A: No, you must click "✅ Assign X Events" to save.

**Q: Can I see assignment history?**
A: Yes, admins can view activity logs in the Analytics dashboard.

---

**Need Help?** Contact your system administrator or refer to the User Guide.
