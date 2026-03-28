import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

// ── Dev Bypass Flag ───────────────────────────────────────
// Set VITE_USE_MOCK_AUTH=true in .env to skip Microsoft login
// Remove or set to false when Azure AD credentials are ready
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true";

/**
 * MSAL Configuration
 * Replace VITE_MSAL_CLIENT_ID and VITE_MSAL_TENANT_ID in your .env file
 *
 * Azure Portal setup steps:
 * 1. Go to Azure Portal → Azure Active Directory → App Registrations
 * 2. Click "New Registration"
 * 3. Name: "Finopay Leave App"
 * 4. Supported account types: "Accounts in this organizational directory only"
 * 5. Redirect URI: Single-page application → http://localhost:5173 (dev)
 *    Add production URL when deploying
 * 6. After creation, copy Application (client) ID and Directory (tenant) ID
 */
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || "00000000-0000-0000-0000-000000000000",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID || "common"}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", // Use sessionStorage for security
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (import.meta.env.DEV) {
          switch (level) {
            case LogLevel.Error: console.error(message); break;
            case LogLevel.Warning: console.warn(message); break;
            case LogLevel.Info: console.info(message); break;
          }
        }
      },
    },
  },
};

// Scopes for Microsoft Graph (to read user profile)
export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
};

export const msalInstance = new PublicClientApplication(msalConfig);

// ── HR Config ─────────────────────────────────────────────
// Fixed HR email — all approved requests route here for final approval
export const HR_EMAIL = import.meta.env.VITE_HR_EMAIL || "hr@finopay.com";
