/** Données clairement fictives — ne pas remplacer par des informations réelles. */

export const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export const DEMO_CITIES = [
  "Zone Demo — Cotonou",
  "Zone Demo — Porto-Novo",
  "Zone Demo — Parakou",
  "Ville Demo",
];

export const DEMO_HOSPITALS = [
  "Hôpital Demo Nord",
  "Clinique Demo Centre",
  "Centre Demo Transfusion",
];

export const DEMO_REQUESTS = [
  {
    id: "REQ-DEMO-001",
    status: "ouverte",
    group: "O+",
    zone: "Zone Demo A",
    hospital: "Hôpital Demo Nord",
    patient: "Patient Demo A",
    updated: "Il y a 8 min",
  },
  {
    id: "REQ-DEMO-002",
    status: "en matching",
    group: "A+",
    zone: "Zone Demo B",
    hospital: "Clinique Demo Centre",
    patient: "Patient Demo B",
    updated: "Il y a 22 min",
  },
  {
    id: "REQ-DEMO-003",
    status: "pourvue",
    group: "B+",
    zone: "Zone Demo C",
    hospital: "Centre Demo Transfusion",
    patient: "Patient Demo C",
    updated: "Il y a 1 h",
  },
];

export const STATUS_META = {
  ouverte: {
    label: "Ouverte",
    className: "bg-amber-50 text-amber-900 ring-amber-200",
  },
  "en matching": {
    label: "En matching",
    className: "bg-sky-50 text-sky-900 ring-sky-200",
  },
  pourvue: {
    label: "Pourvue",
    className: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  },
};
