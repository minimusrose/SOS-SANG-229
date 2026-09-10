/** HTTP client for the FastAPI backend. Never logs phone, GPS, or blood group. */

const DEFAULT_BASE = "http://127.0.0.1:8000";

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;
  return String(raw).replace(/\/$/, "");
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
  const { headers: extraHeaders, body, ...rest } = options;
  const headers = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...extraHeaders,
  };

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...rest,
      headers,
      body,
    });
  } catch {
    throw new ApiError(
      "API injoignable. Lancez uvicorn (127.0.0.1:8000) puis réessayez.",
      0,
    );
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(messageFromDetail(data), response.status);
  }
  return data;
}

export const api = {
  getHealth: () => apiRequest("/health"),
  listRecognizedHospitals: () => apiRequest("/hospitals/recognized"),
  createDonor: (payload) =>
    apiRequest("/donors", { method: "POST", body: JSON.stringify(payload) }),
  createAlert: (payload) =>
    apiRequest("/alerts", { method: "POST", body: JSON.stringify(payload) }),
  listRequests: () => apiRequest("/requests"),
  getRequest: (publicRef) =>
    apiRequest(`/requests/${encodeURIComponent(publicRef)}`),
  confirmDonation: (payload) =>
    apiRequest("/donations", { method: "POST", body: JSON.stringify(payload) }),
};
