import useCountUp from "../hooks/useCountUp.js";

function Stat({ target, label }) {
  const value = useCountUp(target);
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-xl font-extrabold text-secondary">{value}</span>
      <span className="text-xs font-medium text-muted">{label}</span>
    </span>
  );
}

export default function ImpactStats({ className = "" }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-light bg-white/70 px-5 py-3.5 shadow-soft ${className}`.trim()}
    >
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary-strong">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"
            data-decorative
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Réseau actif
      </span>
      <Stat target={7} label="établissements reconnus" />
      <Stat target={7} label="villes desservies" />
      <span className="flex items-baseline gap-1.5">
        <span className="text-xl font-extrabold text-secondary">&lt; 15&nbsp;min</span>
        <span className="text-xs font-medium text-muted">réponse visée</span>
      </span>
    </div>
  );
}
