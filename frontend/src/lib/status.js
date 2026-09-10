/** Statuts d'une demande → libellés affichés. */

export const STATUS_META = {
  open: {
    label: "Ouverte",
    className: "bg-primary/10 text-primary-strong",
  },
  alerting: {
    label: "En cours",
    className: "bg-light text-muted",
  },
  fulfilled: {
    label: "Pourvue",
    className: "bg-success/10 text-success",
  },
  cancelled: {
    label: "Annulée",
    className: "bg-light text-muted",
  },
};

export const STATUS_FILTERS = ["toutes", ...Object.keys(STATUS_META)];

export function formatDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
