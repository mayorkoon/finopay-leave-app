import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance, USE_MOCK_AUTH } from "./auth/MsalConfig";
import App from "./App";

const tree = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

if (USE_MOCK_AUTH) {
  ReactDOM.createRoot(document.getElementById("root")).render(tree);
} else {
  // Initialize MSAL before rendering and pin the active account from the
  // redirect result. This ensures getActiveAccount() is always reliable.
  msalInstance.initialize().then(async () => {
    try {
      const result = await msalInstance.handleRedirectPromise();
      if (result?.account) {
        msalInstance.setActiveAccount(result.account);
      } else {
        const cached = msalInstance.getAllAccounts();
        if (cached.length === 1) {
          msalInstance.setActiveAccount(cached[0]);
        }
        // Multiple cached accounts with no active one: leave MSAL to resolve
        // naturally — do NOT clear cache as that would log users out unexpectedly.
      }
    } catch (e) {
      console.error("[MSAL] Redirect handling error:", e);
    }
    ReactDOM.createRoot(document.getElementById("root")).render(
      <MsalProvider instance={msalInstance}>{tree}</MsalProvider>
    );
  });
}
