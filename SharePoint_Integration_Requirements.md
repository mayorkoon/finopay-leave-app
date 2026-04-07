# Finopay Leave App — SharePoint Integration Requirements

**Document Purpose:** Outlines what SharePoint and Azure AD must provide for the Leave App to work end-to-end without manual data entry.

---

## 1. User Profile Attributes (Microsoft Graph API)

These fields are currently filled in manually by staff on every leave request form. They should be read automatically from the user's SharePoint/Azure AD profile at login.

| Field | SharePoint Attribute | Used For |
|---|---|---|
| Staff Number | `employeeId` | Leave record identification |
| Department / Unit | `department` | Leave record, email notifications |
| Grade / Level | Custom attribute (e.g. `extension_grade`) | Band calculation for leave entitlement |
| Confirmation Status | Custom attribute (e.g. `extension_confirmationStatus`) | Leave entitlement lookup (Confirmed / Contract / Not Confirmed) |
| Date of Employment | Custom attribute (e.g. `extension_dateOfEmployment`) | Leave record |

**Note:** `name`, `email`, and `localAccountId` are already provided by Azure AD via MSAL and are wired up in the app.

---

## 2. Grade-to-Band Mapping (Privacy Design)

The app is designed so that raw grade values are **never stored in Firestore or SharePoint**. The grade-to-band mapping lives entirely in the app's front-end code (`src/constants/leaveEntitlements.js`).

| Band | Grades | Annual Leave (Confirmed) |
|---|---|---|
| Band 1 | Analyst, Senior Analyst, Associate, Senior Associate, Expert | 20 days |
| Band 2 | Senior Expert, Team Lead, Manager, Senior Manager | 25 days |
| Band 3 | Director, Senior Director/VP, Senior VP, CEO | 30 days |

Contract and Not Confirmed staff across all grades: **10 days annual, 5 days sick, 5 days casual.**

SharePoint only needs to store the grade label (e.g. "Manager") — the app handles the rest privately.

---

## 3. Supervisor Lookup (People Picker)

Staff currently type their supervisor's name and email manually, which is error-prone. SharePoint's Azure AD directory should power a searchable people picker so staff can select their supervisor directly.

**Required:**
- Query Azure AD users by name or email via Microsoft Graph (`/v1.0/users?$search=...`)
- Return `displayName` and `mail` fields to auto-fill `supervisorName` and `supervisorEmail` on the form

---

## 4. Leave Balance — Dashboard Improvement

Currently, the leave balance on the dashboard only appears after a staff member submits their **first** leave request (because `band` and `confirmationStatus` are stored on the leave document in Firestore).

If profile attributes (grade + confirmationStatus) are pulled from SharePoint at login, the balance can be displayed immediately — even for new staff who have never submitted a leave request.

---

## 5. HR Email Configuration

The HR recipient email is currently set via the `VITE_HR_EMAIL` environment variable in `.env`. This can remain as-is or be driven by an Azure AD group or SharePoint list if HR personnel changes frequently.

---

## 6. Implementation Steps (Suggested)

1. **Register custom attributes** in Azure AD for `grade`, `confirmationStatus`, and `dateOfEmployment` via the Azure Portal (App Registrations → Manifest or B2C custom attributes)
2. **Populate attributes** for all staff via SharePoint Admin or a bulk import from HR records
3. **Update `AuthProvider.jsx`** (`src/auth/AuthProvider.jsx`) to call Microsoft Graph at login and map the attributes to the user object
4. **Update `LeaveForm.jsx`** to pre-fill and lock the fields that come from the profile (staff can still edit if needed)
5. **Implement supervisor search** using the Microsoft Graph `/users` endpoint with a typeahead input on the leave form
6. **Test** with a pilot group before full rollout

---

## 7. Scope Summary

| Item | Owner | Priority |
|---|---|---|
| Custom profile attributes in Azure AD | IT / SharePoint Admin | High |
| Populate staff profile data | HR + IT | High |
| Graph API integration in app | Developer | High |
| Supervisor people picker | Developer | Medium |
| Leave balance from profile (no first-submission dependency) | Developer | Medium |
| HR email from Azure AD group | IT / Developer | Low |

---

*Prepared for Finopay internal use — Leave Management System v0.1*
