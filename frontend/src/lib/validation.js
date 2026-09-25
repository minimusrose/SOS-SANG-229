export const PHONE_ERROR = "Le numéro de téléphone entré est incorrect.";

/** Accepts an optional leading + then 8 to 15 digits (spaces are ignored). */
export function isValidPhone(value) {
  const cleaned = String(value || "").replace(/[\s.-]/g, "");
  return /^\+?\d{8,15}$/.test(cleaned);
}

export const PHONE_FORMAT_ERROR =
  "Le numéro doit contenir 10 chiffres et commencer par 01 (ex. 0196258475).";

/** Removes every whitespace character, wherever it appears — used to keep the
 * phone field's value space-free as the account-creation forms are typed. */
export function stripPhoneSpaces(value) {
  return String(value || "").replace(/\s+/g, "");
}

/**
 * Strict format required at account creation: "+229" followed by exactly 10
 * digits starting with "01" (e.g. "+2290196258475"). Expects a value already
 * run through stripPhoneSpaces (or strips it defensively itself).
 */
export function isValidBeninPhone(value) {
  const cleaned = stripPhoneSpaces(value);
  if (!cleaned.startsWith("+229")) return false;
  return /^01\d{8}$/.test(cleaned.slice(4));
}
