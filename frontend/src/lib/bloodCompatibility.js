/**
 * Donor/recipient compatibility for the "Testez votre compatibilité" modal.
 *
 * The verdict (`isCompatible`) always comes from `bloodCompatibility.generated.json`,
 * a static export of the same `_COMPATIBLE_DONORS` table backend/app/matching.py
 * uses for urgency matching (see backend/scripts/export_blood_compatibility.py —
 * re-run it and commit the JSON if that table ever changes; a backend test
 * fails if the two drift apart). Never hand-edit the JSON or add a second
 * compatibility rule here.
 */
import generated from "../data/bloodCompatibility.generated.json";

const LOOKUP = new Map(
  generated.pairs.map((pair) => [`${pair.donor}>${pair.recipient}`, pair.compatible]),
);

export function isCompatible(donorGroup, recipientGroup) {
  return LOOKUP.get(`${donorGroup}>${recipientGroup}`) ?? false;
}

// Presentational only — explains an already-known "incompatible" verdict, it
// never decides compatibility itself (that's always isCompatible() above).
// A recipient's plasma carries an antibody against any ABO antigen their own
// cells lack; a reaction happens when the donor's cells carry that antigen.
function parseGroup(group) {
  const abo = group.slice(0, -1); // "O" | "A" | "B" | "AB"
  return { abo, rh: group.slice(-1), hasA: abo.includes("A"), hasB: abo.includes("B") };
}

export function explainIncompatibility(donorGroup, recipientGroup) {
  const donor = parseGroup(donorGroup);
  const recipient = parseGroup(recipientGroup);

  if (donor.hasA && !recipient.hasA) return "à l’antigène A";
  if (donor.hasB && !recipient.hasB) return "à l’antigène B";
  if (donor.rh === "+" && recipient.rh === "-") return "au facteur Rhésus";
  return "au groupe sanguin";
}
