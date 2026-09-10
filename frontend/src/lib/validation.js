export const PHONE_ERROR = "Le numéro de téléphone entré est incorrect.";

/** Accepts an optional leading + then 8 to 15 digits (spaces are ignored). */
export function isValidPhone(value) {
  const cleaned = String(value || "").replace(/[\s.-]/g, "");
  return /^\+?\d{8,15}$/.test(cleaned);
}
