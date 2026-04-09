import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

// ── Dev Bypass Flag ───────────────────────────────────────────────────────────
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true";

// ── HR & MD Config ────────────────────────────────────────────────────────────
export const HR_EMAIL = import.meta.env.VITE_HR_EMAIL || "hr@finopay.com";
export const MD_EMAIL = import.meta.env.VITE_MD_EMAIL || "md@finopay.com";

// ── Azure AD Group IDs ────────────────────────────────────────────────────────
export const INITIATORS_GROUP_ID = import.meta.env.VITE_INITIATORS_GROUP_ID;
export const APPROVERS_GROUP_ID  = import.meta.env.VITE_APPROVERS_GROUP_ID;

// ── SharePoint Config ─────────────────────────────────────────────────────────
export const SP_SITE_ID       = import.meta.env.VITE_SHAREPOINT_SITE_ID;
export const SP_LEAVE_LIST_ID = import.meta.env.VITE_SHAREPOINT_LEAVE_LIST_ID;
export const SP_BANDS_LIST_ID = import.meta.env.VITE_SHAREPOINT_BANDS_LIST_ID;

// ── MSAL Configuration ────────────────────────────────────────────────────────
export const msalConfig = {
  auth: {
    clientId:              import.meta.env.VITE_MSAL_CLIENT_ID || "00000000-0000-0000-0000-000000000000",
    authority:             `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID || "common"}`,
    redirectUri:           window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation:       "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii || !import.meta.env.DEV) return;
        if (level === 0) console.error(message);
        if (level === 1) console.warn(message);
      },
    },
  },
};

// ── Login scopes ──────────────────────────────────────────────────────────────
// User.Read       — read profile (name, email, department)
// Sites.ReadWrite.All — read/write SharePoint Lists
// GroupMember.Read.All — check group memberships for role assignment
export const loginRequest = {
  scopes: [
    "User.Read",
    "Sites.ReadWrite.All",
    "GroupMember.Read.All",
  ],
};

// ── Graph API token request (used for API calls after login) ──────────────────
export const graphRequest = {
  scopes: [
    "https://graph.microsoft.com/User.Read",
    "https://graph.microsoft.com/Sites.ReadWrite.All",
    "https://graph.microsoft.com/GroupMember.Read.All",
  ],
};

export const msalInstance = new PublicClientApplication(msalConfig);