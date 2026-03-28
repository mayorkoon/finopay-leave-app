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

// Only wrap with MsalProvider when using real Microsoft auth.
// In mock mode, MsalProvider is skipped entirely to avoid
// MSAL initialization errors from missing Azure AD credentials.
ReactDOM.createRoot(document.getElementById("root")).render(
  USE_MOCK_AUTH
    ? tree
    : <MsalProvider instance={msalInstance}>{tree}</MsalProvider>
);
