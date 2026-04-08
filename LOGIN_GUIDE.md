# ShareBit Login System - Setup Guide

## ✅ System Status
- **Backend Server**: Running on `http://localhost:8000`
- **Frontend Client**: Running on `http://localhost:5174`
- **Database**: MongoDB (seeded with admin and demo users)

## 🔑 Default Credentials

### Admin Account
- **Email**: `admin@sharebit.com`
- **Password**: `Admin@12345`
- **Role**: SuperAdmin (Full system access)
- **Access**: Admin Panel, Asset Management, User Management, Profit Distribution, Withdrawal Approvals, Audit Logs

### Demo User Account
- **Email**: `user@sharebit.com`
- **Password**: `User@12345`
- **Role**: Investor
- **Access**: View Assets, Purchase Shares, Check Profits, Request Withdrawals

## 🚀 Quick Login Methods

### Method 1: One-Click Demo Login
1. Go to `http://localhost:5174/login`
2. Click **"Admin Login"** button (for admin access)
   - Or click **"User Login"** button (for investor access)
3. You will be automatically logged in and redirected to dashboard

### Method 2: Manual Login
1. Go to `http://localhost:5174/login`
2. Enter email and password manually
3. Click **"Sign in"** button

## 📋 Login Workflow

```
┌─────────────────────────────────────────────┐
│  ShareBit Login Page                        │
│  - Email input field (placeholder shown)    │
│  - Password input field (placeholder shown) │
│  - Manual "Sign in" button                  │
│  - Quick Demo Login buttons:                │
│    • Admin Login (one-click)                │
│    • User Login (one-click)                 │
└─────────────────────────────────────────────┘
                     ↓
         ┌───────────────────────┐
         │  Credentials Verified │
         │  JWT Token Generated  │
         │  User Data Set        │
         └───────────────────────┘
                     ↓
         ┌───────────────────────┐
         │  Redirected to        │
         │  /dashboard           │
         │  (Role-specific views)│
         └───────────────────────┘
```

## 🔧 Technical Details

### Login Flow
1. **Frontend** (LoginPage.jsx)
   - Form with email + password inputs
   - Demo buttons auto-fill credentials
   - Form submits to `/api/v1/auth/login` endpoint

2. **Backend** (authController.js)
   - Validates email format
   - Compares password with hashed value in DB
   - Checks if account is verified
   - Generates JWT access + refresh tokens
   - Sets secure HTTP-only cookies

3. **Response**
   - Returns user object with:
     - id, firstName, lastName, email
     - role (ID), roleName (string)
     - permissions array

### Security Features
- ✅ JWT-based authentication with expiring tokens
- ✅ Secure HTTP-only cookies for token storage
- ✅ Password hashing with bcryptjs (12 salt rounds)
- ✅ Email validation with Zod schema
- ✅ Role-based access control (RBAC)
- ✅ Automatic token refresh on expiry

## 📚 API Endpoints

### Auth Routes
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/verify-otp` - OTP verification
- `POST /api/v1/auth/resend-otp` - Resend OTP
- `POST /api/v1/auth/refresh-token` - Refresh access token

## 🛣️ Post-Login Navigation

### For Admin Users
- `/admin/dashboard` - Overview and stats
- `/admin/assets` - Manage assets
- `/admin/users` - Manage users
- `/admin/withdrawals` - Approve withdrawal requests
- `/admin/profit` - Distribute profits
- `/admin/audit` - View audit logs

### For Investor Users
- `/dashboard` - Portfolio overview
- `/marketplace` - Browse available assets
- `/portfolio` - View owned shares
- `/wallet` - Check balance and transactions
- `/withdrawals` - Request and track withdrawals
- `/profile` - Update profile information

## 🐛 Troubleshooting

### Login Not Working?
1. **Check servers are running**
   ```bash
   # Backend
   cd server && npm run dev
   
   # Frontend
   cd client && npm run dev
   ```

2. **Check database connection**
   - Verify MongoDB is running
   - Check MONGO_URI in server/.env

3. **Verify credentials**
   - Use credentials from above (admin@sharebit.com / Admin@12345)
   - Make sure account is verified (seed script ensures this)

4. **Check browser console**
   - Open DevTools (F12)
   - Check Network tab for API responses
   - Check Console tab for JavaScript errors

5. **Clear local storage**
   ```javascript
   // In browser console
   localStorage.clear();
   // Refresh page
   ```

### Port Already in Use?
```bash
# Kill process using port 8000
taskkill /PID <PID> /F

# Kill process using port 5174
taskkill /PID <PID> /F
```

## ✨ Features Implemented
- ✅ User authentication with JWT
- ✅ Role-based access control with guards
- ✅ One-click demo login buttons
- ✅ Secure password handling
- ✅ Automatic token refresh
- ✅ User profile with role information
- ✅ Audit logging for all auth events

## 📝 Database Seeding

The login system automatically seeds the database with:
1. **Roles**: SuperAdmin, Manager, Investor
2. **Admin User**: admin@sharebit.com
3. **Demo User**: user@sharebit.com
4. **Demo Wallets**: For both users
5. **Sample Asset**: Demo Bus Asset with 100 shares

To reset and reseed:
```bash
cd server
npm run seed
```

---

**Ready to test?** Go to `http://localhost:5174/login` and click "Admin Login" button! 🚀
