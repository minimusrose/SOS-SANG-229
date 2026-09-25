import SearchableSelect from "./SearchableSelect.jsx";

// Same status keys/labels as StatusFilter.jsx (lib/status.js::displayStatus
// is the single source of truth — reused here, not recomputed).
const STATUS_OPTIONS = [
  { key: "all", label: "Toutes" },
  { key: "open", label: "Ouvertes" },
  { key: "alerting", label: "En cours" },
  { key: "fulfilled", label: "Pourvues" },
];

const COMPAT_OPTIONS = [
  { key: "all", label: "Toutes" },
  { key: "compatible", label: "Compatible" },
  { key: "incompatible", label: "Incompatible" },
];

const EMPTY_FILTERS = {
  status: "all",
  city: "",
  compat: "all",
  hospital: "",
  reference: "",
};

export { EMPTY_FILTERS };

export default function RequestFilters({
  filters,
  onChange,
  cities,
  hospitals,
}) {
  const isDefault =
    filters.status === "all" &&
    !filters.city &&
    filters.compat === "all" &&
    !filters.hospital &&
    !filters.reference;

  function set(field) {
    return (value) => onChange({ ...filters, [field]: value });
  }

  return (
    <div
      role="group"
      aria-label="Filtrer les demandes"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(5,1fr)_auto] xl:items-end"
    >
      <div className="space-y-2">
        <label className="field-label" htmlFor="filter-status">
          Statut
        </label>
        <select
          id="filter-status"
          className="field-input"
          value={filters.status}
          onChange={(event) => set("status")(event.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <SearchableSelect
        label="Ville"
        value={filters.city}
        onChange={set("city")}
        options={cities}
        allLabel="Toutes les villes"
      />

      <div className="space-y-2">
        <label className="field-label" htmlFor="filter-compat">
          Compatibilité
        </label>
        <select
          id="filter-compat"
          className="field-input"
          value={filters.compat}
          onChange={(event) => set("compat")(event.target.value)}
        >
          {COMPAT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <SearchableSelect
        label="Établissement hospitalier"
        value={filters.hospital}
        onChange={set("hospital")}
        options={hospitals}
        allLabel="Tous les établissements"
      />

      <div className="space-y-2">
        <label className="field-label" htmlFor="filter-reference">
          Identifiant
        </label>
        <input
          id="filter-reference"
          type="text"
          className="field-input"
          value={filters.reference}
          onChange={(event) => set("reference")(event.target.value)}
          placeholder="Ex. REQ-DA50D9E6"
          autoComplete="off"
        />
      </div>

      <button
        type="button"
        className="btn-secondary h-11 w-full px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 xl:col-span-1 xl:w-auto"
        onClick={() => onChange(EMPTY_FILTERS)}
        disabled={isDefault}
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
