/** Optional, best-effort browser geolocation. Never blocks a flow. */

export function isGeolocationAvailable() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/**
 * Resolves { latitude, longitude } or rejects with an Error whose `code` is
 * "unsupported" | "denied" | "unavailable" | "timeout". Requires a secure
 * context (https, or http on localhost / 127.0.0.1).
 */
export function requestPosition() {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      const err = new Error("Geolocation not supported");
      err.code = "unsupported";
      reject(err);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (posError) => {
        const map = {
          1: "denied",
          2: "unavailable",
          3: "timeout",
        };
        const err = new Error("Geolocation failed");
        err.code = map[posError?.code] || "unavailable";
        reject(err);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  });
}
