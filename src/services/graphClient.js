import { msalInstance, graphRequest } from "../auth/MsalConfig";

const GRAPH = "https://graph.microsoft.com/v1.0";

/**
 * Get a valid Graph API access token silently.
 * Falls back to interaction if silent acquisition fails.
 */
async function getToken() {
  const accounts = msalInstance.getAllAccounts();
  if (!accounts.length) throw new Error("No authenticated account found.");

  try {
    const result = await msalInstance.acquireTokenSilent({
      ...graphRequest,
      account: accounts[0],
    });
    return result.accessToken;
  } catch (err) {
    // Silent failed — prompt interaction
    const result = await msalInstance.acquireTokenPopup(graphRequest);
    return result.accessToken;
  }
}

/**
 * Make an authenticated Graph API request
 */
async function graph(method, path, body = null) {
  const token = await getToken();
  const res = await fetch(`${GRAPH}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type":  "application/json",
      Accept:          "application/json",
      // Allow filtering on non-indexed columns during development
      // Remove this header once SharePoint columns are properly indexed
      "Prefer": "HonorNonIndexedQueriesWarningMayFailRandomly",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Graph API error: ${res.status}`);
  }

  // 204 No Content — no body to parse
  if (res.status === 204) return null;
  return res.json();
}

export const graphGet    = (path)         => graph("GET",    path);
export const graphPost   = (path, body)   => graph("POST",   path, body);
export const graphPatch  = (path, body)   => graph("PATCH",  path, body);
export const graphDelete = (path)         => graph("DELETE", path);
