// Filter keys match the exact statuses already computed by
// lib/status.js::displayStatus() (source of truth reused here, not
// recomputed) — "cancelled" is intentionally excluded, only the three
// categories asked for plus "Toutes".
const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "open", label: "Ouvertes" },
  { key: "alerting", label: "En cours" },
  { key: "fulfilled", label: "Pourvues" },
];

export default function StatusFilter({ value, onChange, counts }) {
  return (
    <div
      role="group"
      aria-label="Filtrer par statut"
      className="flex flex-wrap gap-2"
    >
      {FILTERS.map((filter) => {
        const active = value === filter.key;
        const count = counts[filter.key] ?? 0;
        return (
          <button
            key={filter.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition duration-micro ease-soft-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active
                ? "bg-primary-dark text-white"
                : "bg-light text-secondary hover:bg-light/70"
            }`}
          >
            {filter.label}
            <span className={active ? "text-white/80" : "text-muted"}>
              ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
