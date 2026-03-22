# EventXpense - Event Expense Manager

A comprehensive event expense management system with role-based access control (RBAC), built with React, Firebase, and Vite.

## 🎯 Features

### Core Functionality
- **Multi-Event Management**: Track expenses across multiple events simultaneously
- **Real-time Collaboration**: Live updates using Firestore subscriptions
- **Role-Based Access Control**: Three-tier hierarchy (Admin → Manager → Staff)
- **Expense Tracking**: Categorized expenses with multiple payment modes
- **Budget Monitoring**: Real-time budget vs. spent visualization
- **Reports & Analytics**: Export to CSV/PDF, system-wide analytics
- **Activity Logging**: Complete audit trail of all system actions
- **Responsive Design**: Mobile-first with desktop optimization

### Role Hierarchy

#### 👑 Admin (Highest Authority)
- View all events and expenses across the system
- Create, edit, and delete events
- Manage user accounts and roles
- Assign events to managers and staff
- Assign staff to managers
- Access global analytics dashboard
- View complete activity logs
- Edit/delete any expense record
- Export reports (CSV/PDF)

#### 👔 Manager (Mid-Level Authority)
- View only assigned events
- Add and manage expenses for assigned events
- View reports for assigned events only
- Edit expenses created by assigned staff
- Export reports (CSV/PDF)
- **Cannot**: Create events, change roles, view unassigned events

#### 👷 Staff (Operational Role)
- View only assigned events
- Add expense entries for assigned events
- View and download PDF reports
- Edit/delete only their own expenses
- **Cannot**: Edit others' expenses, create events, export CSV, access analytics

## 🏗️ Tech Stack

- **Frontend**: React 19.2.0 with Hooks
- **Build Tool**: Vite 7.3.1
- **Backend**: Firebase (Firestore + Authentication)
- **Styling**: Custom CSS with responsive design
- **State Management**: React Context API + Local State

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd expense-tracker

# Install dependencies
npm install

# Configure Firebase
# Update src/firebase.js with your Firebase config

# Set admin email
# Update ADMIN_EMAIL in src/firebase.js

# Run development server
npm run dev

# Build for production
npm run build
```

## 🔧 Configuration

### 1. Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Copy your Firebase config to `src/firebase.js`

### 2. Admin Setup
1. Set `ADMIN_EMAIL` in `src/firebase.js` to your admin email
2. Create this account in Firebase Console → Authentication
3. Login with this account - admin role will be auto-assigned

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Data Migration (For Existing Installations)
See `IMPLEMENTATION_SUMMARY.md` for migration script

## 📊 Database Schema

### Collections
- **users**: User profiles with roles and assignments
- **events**: Event details with budget and assignments
- **expenses**: Expense records with tracking
- **staff**: Staff member names for dropdowns
- **activityLogs**: Immutable audit trail

See `RBAC_IMPLEMENTATION.md` for detailed schema

## 🚀 Usage

### For Admins
1. Login with admin account
2. Create events from sidebar or dashboard
3. Navigate to "Users" to manage team
4. Assign events to managers/staff
5. View "Analytics" for system-wide insights
6. Monitor activity logs for audit trail

### For Managers
1. Login and view assigned events
2. Switch between events using sidebar
3. Add expenses for your events
4. View reports and export data
5. Monitor team expenses

### For Staff
1. Login and view assigned events
2. Add expenses with details
3. View reports for your events
4. Download PDF reports

## 📁 Project Structure

```
expense-tracker/
├── src/
│   ├── App.jsx              # Main application component
│   ├── App.css              # Responsive layout styles
│   ├── index.css            # Global styles
│   ├── main.jsx             # React entry point
│   ├── AuthContext.jsx      # Authentication context
│   ├── AuthPage.jsx         # Login/Register UI
│   ├── db.js                # Firestore service layer
│   └── firebase.js          # Firebase configuration
├── public/                  # Static assets (SVG icons)
├── firestore.rules          # Firestore security rules
├── RBAC_IMPLEMENTATION.md   # Detailed RBAC documentation
├── IMPLEMENTATION_SUMMARY.md # Deployment guide
└── package.json
```

## 🔒 Security

- **Firestore Rules**: Server-side permission enforcement
- **Client-side Checks**: UI-level access control
- **Activity Logging**: Complete audit trail
- **Role Validation**: Enforced at database level
- **Immutable Logs**: Activity logs cannot be modified

## 🧪 Testing

See `IMPLEMENTATION_SUMMARY.md` for comprehensive testing guide covering:
- Admin role testing
- Manager role testing
- Staff role testing
- Permission boundary testing

## 📈 Analytics Dashboard

Admin-only dashboard featuring:
- Total events, expenses, users, and spending
- Event performance with budget tracking
- User role distribution
- Recent activity feed (last 20 actions)
- Color-coded activity types

## 🎨 UI Features

- **Dark Theme**: Professional dark mode design
- **Gradient Accents**: Orange, purple, and teal highlights
- **Smooth Animations**: Fade, slide, and pulse effects
- **Responsive Layout**: Mobile (< 768px), Tablet/Desktop (768px+), Large Desktop (1200px+)
- **Interactive Components**: Expandable expense rows, modals, toasts
- **Real-time Updates**: Live data synchronization

## 🔄 Activity Logging

All major actions are logged:
- Expense added/edited/deleted
- Event created
- Role changed
- Events assigned
- Staff assigned to manager

Each log includes:
- Action type and timestamp
- User details (ID, name, role)
- Related entities (event, expense, target user)
- Human-readable description

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🛠️ Future Enhancements

- [ ] Receipt upload with Firebase Storage
- [ ] Event archiving
- [ ] Bulk event assignment UI
- [ ] Email notifications
- [ ] Expense approval workflow
- [ ] Budget alerts
- [ ] Mobile app (React Native)
- [ ] Offline support
- [ ] Advanced analytics
- [ ] Export scheduling

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📞 Support

For issues:
1. Check activity logs in Analytics dashboard
2. Verify Firestore rules are deployed
3. Review user assignments in User Management
4. Check browser console for errors
5. Ensure correct role assignment

## 🎉 Acknowledgments

- Firebase for backend infrastructure
- React team for the framework
- Vite for blazing-fast build tool
- Remix Icon for SVG icons
