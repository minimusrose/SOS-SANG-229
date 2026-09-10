/** HTTP client for the FastAPI backend. Never logs phone, GPS, or blood group. */

const DEFAULT_BASE = "http://127.0.0.1:8000";
export const TOKEN_STORAGE_KEY = "sosang.token";

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;
  return String(raw).replace(/\/$/, "");
}

let authToken = null;
try {
  authToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
} catch {
  authToken = null;
}

let onUnauthorized = null;

/** Register a callback fired once when the API rejects our token (401). */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function setAuthToken(token) {
  authToken = token || null;
  try {
    if (authToken) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    /* private mode / storage disabled — keep the in-memory token */
  }
}

export function getAuthToken() {
  return authToken;
}

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function messageFromDetail(data) {
  if (!data || data.detail == null) {
    return "Une erreur est survenue. Réessayez.";
  }
  const { detail } = data;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item.msg === "string" ? item.msg : null))
      .filter(Boolean);
    return messages.join(" ") || "Requête invalide.";
  }
  return "Une erreur est survenue. Réessayez.";
}

export async function apiRequest(path, options = {}) {
  const { headers: extraHeaders, body, auth = true, ...rest } = options;
  const headers = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(auth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...extraHeaders,
  };

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { ...rest, headers, body });
  } catch {
    throw new ApiError("Service indisponible. Réessayez dans un instant.", 0);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && auth && authToken) {
      setAuthToken(null);
      if (onUnauthorized) onUnauthorized();
    }
    throw new ApiError(messageFromDetail(data), response.status);
  }
  return data;
}

export const api = {
  getHealth: () => apiRequest("/health", { auth: false }),
  register: (payload) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    }),
  login: (payload) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    }),
  me: () => apiRequest("/auth/me"),
  listRecognizedHospitals: () =>
    apiRequest("/hospitals/recognized", { auth: false }),
  createDonor: (payload) =>
    apiRequest("/donors", { method: "POST", body: JSON.stringify(payload) }),
  createAlert: (payload) =>
    apiRequest("/alerts", { method: "POST", body: JSON.stringify(payload) }),
  myRequests: () => apiRequest("/me/requests"),
  myMatches: () => apiRequest("/me/matches"),
  getDonorProfile: () => apiRequest("/me/donor-profile"),
  updateDonorProfile: (payload) =>
    apiRequest("/me/donor-profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getRequest: (publicRef) =>
    apiRequest(`/requests/${encodeURIComponent(publicRef)}`),
  confirmDonation: (payload) =>
    apiRequest("/donations", { method: "POST", body: JSON.stringify(payload) }),
};
