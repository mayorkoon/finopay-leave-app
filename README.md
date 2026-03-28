# Finopay Leave Request App

Staff leave management system built with React, Firebase, MSAL (Microsoft Auth), and EmailJS.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Auth | Microsoft MSAL (Azure AD) |
| Database | Firebase Firestore |
| Email | EmailJS |
| Hosting | Firebase Hosting |

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd finopay-leave-app
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in all values in `.env` — see sections below for where to get each one.

### 3. Run Locally

```bash
npm run dev
```

---

## Setup Guide

### A. Azure AD (Microsoft Auth)

1. Go to [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App Registrations**
2. Click **New Registration**
   - Name: `Finopay Leave App`
   - Supported account types: `Accounts in this organizational directory only`
   - Redirect URI: `Single-page application` → `http://localhost:5173`
3. After creation, copy:
   - **Application (client) ID** → `VITE_MSAL_CLIENT_ID`
   - **Directory (tenant) ID** → `VITE_MSAL_TENANT_ID`
4. Under **Authentication**, add your production URL as an additional redirect URI when deploying

### B. Firebase (Firestore)

1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. Add a **Web App** → copy the config object values into `.env`
3. Enable **Firestore Database** in Native mode
4. Deploy security rules:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore
   firebase deploy --only firestore:rules
   ```

### C. EmailJS (Supervisor Notification)

1. Create a free account at [emailjs.com](https://www.emailjs.com)
2. Connect your email service (Gmail or Outlook)
3. Create an email template using these variables:
   - `{{supervisor_name}}`, `{{supervisor_email}}`
   - `{{staff_name}}`, `{{staff_email}}`
   - `{{department}}`, `{{leave_types}}`
   - `{{start_date}}`, `{{end_date}}`, `{{total_days}}`
   - `{{reliever_name}}`, `{{contact_address}}`
   - `{{mobile_number}}`, `{{submitted_at}}`
4. Copy **Service ID**, **Template ID**, and **Public Key** into `.env`

---

## Deployment (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

Add your production URL to Azure AD redirect URIs after deploying.

---

## Project Structure

```
src/
├── auth/             # MSAL config + AuthProvider
├── components/
│   ├── ui/           # InputField, CheckboxField, SectionHeader, StatusBadge
│   ├── layout/       # Navbar, ProtectedRoute
│   └── leave/        # LeaveForm, LeaveSuccess
├── pages/            # LoginPage, DashboardPage, LeaveRequestPage
├── services/         # firebase.js, leaveService.js, emailService.js
├── hooks/            # useLeaveForm.js
├── utils/            # calculateLeaveDays.js, validators.js
└── constants/        # leaveTypes.js
```

---

## Leave Request Lifecycle

```
Staff submits form
      ↓
Saved to Firestore (status: pending_supervisor)
      ↓
Email sent to supervisor
      ↓
Supervisor approves → status: pending_hod
      ↓
HOD approves → status: pending_hr
      ↓
HR approves → status: approved
      (or rejected at any stage)
```

---

## Environment Variables Reference

```env
VITE_MSAL_CLIENT_ID=
VITE_MSAL_TENANT_ID=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```
