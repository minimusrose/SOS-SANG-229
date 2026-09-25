// Compatible/Incompatible/unknown badge — separate signal from StatusBadge,
// text always carries the meaning (never color alone).
const META = {
  compatible: {
    label: "Compatible",
    className: "bg-success text-white",
  },
  incompatible: {
    label: "Incompatible",
    className: "bg-accent/15 text-secondary",
  },
  unknown: {
    label: "Compatibilité inconnue",
    className: "border border-accent/40 bg-white text-muted",
  },
};

export default function CompatibilityBadge({ state }) {
  const meta = META[state] ?? META.unknown;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
