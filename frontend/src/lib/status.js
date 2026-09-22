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

/**
 * Badge shown on a request card/detail, derived from confirmed donations
 * rather than the raw backend status (open vs alerting — whether a donor
 * has been notified — is no longer distinguished here):
 *   - "cancelled" stays as-is if the backend ever reports it.
 *   - 0 confirmed donation  → "open"      (Ouverte)
 *   - 1..N-1 confirmed      → "alerting"  (En cours — partiellement pourvue)
 *   - all confirmed         → "fulfilled" (Pourvue)
 */
export function displayStatus({ status, confirmed_donations_count, units_needed }) {
  if (status === "cancelled") return "cancelled";
  const confirmed = confirmed_donations_count ?? 0;
  const needed = units_needed ?? 1;
  if (confirmed <= 0) return "open";
  if (confirmed < needed) return "alerting";
  return "fulfilled";
}

// Singular, feminine-agreeing form of each status, for the "Aucune demande
// ... pour le moment." empty-filter message (STATUS_META.label is used on
// the badge itself, e.g. "En cours", which already reads correctly there).
export const STATUS_EMPTY_LABEL = {
  open: "ouverte",
  alerting: "en cours",
  fulfilled: "pourvue",
};

/** Tally of rows per displayStatus(), for the filter chips' counts. */
export function countByDisplayStatus(rows) {
  const counts = { all: rows.length, open: 0, alerting: 0, fulfilled: 0 };
  for (const row of rows) {
    const status = displayStatus(row);
    if (status in counts) counts[status] += 1;
  }
  return counts;
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
