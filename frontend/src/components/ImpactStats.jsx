import { RevealGroup } from "./Reveal.jsx";
import useCountUp from "../hooks/useCountUp.js";

// Isolé pour rester facile à modifier (étape 5).
export const IMPACT_TITLE = "Un réseau actif, prêt à répondre";

// Chiffres codés en dur pour l'instant : s'ils doivent un jour venir d'une
// API ou d'une config, c'est ici — un seul endroit — qu'il faudra brancher
// la source de données, sans toucher au reste du composant.
const STATS = [
  { target: 200, label: "établissements desservis" },
  { target: 70, label: "communes impactées" },
];

const RESPONSE_TIME_STAT = {
  value: "20 min",
  label: "temps d’attente moyen entre une alerte et une réponse",
};

function StatColumn({ target, value, label }) {
  // Toujours appelé (règle des hooks) ; ignoré pour la colonne "20 min", qui
  // n'est pas un compteur numérique animable.
  const animated = useCountUp(target ?? 0);
  const display = target != null ? animated : value;
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <span className="text-[44px] font-extrabold leading-none text-highlight sm:text-6xl lg:text-7xl">
        {display}
      </span>
      <span className="max-w-[15rem] text-base font-medium text-white sm:text-lg">
        {label}
      </span>
    </div>
  );
}

export default function ImpactStats() {
  return (
    <section className="relative isolate bg-secondary py-16 lg:py-24">
      {/* Bord supérieur courbe : ce bloc déborde au-dessus de la section
          (bottom-full) et peint par-dessus la fin de la section précédente,
          quelle que soit sa couleur — jonction toujours sans trait ni
          interstice, y compris si l'ordre des sections change à l'étape 7. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-full z-10 h-10 overflow-hidden sm:h-14 lg:h-20"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="block h-full w-full"
        >
          <path
            d="M0,20 Q600,150 1200,20 L1200,120 L0,120 Z"
            className="fill-secondary"
          />
        </svg>
      </div>

      <RevealGroup className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        {/* text-primary (utilisé par le kicker "Comment ça marche") ne tient
            qu'environ 3.2:1 sur ce fond bleu nuit — insuffisant pour du texte
            de 12px (seuil AA 4.5:1). text-highlight, déjà utilisé pour les
            chiffres, tient ≈4.9:1 tout en restant dans les rouges de la
            charte. */}
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-highlight">
          Notre impact
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          {IMPACT_TITLE}
        </h2>

        <div className="mt-16 grid gap-16 sm:grid-cols-3 lg:gap-24">
          {STATS.map((stat) => (
            <StatColumn key={stat.label} target={stat.target} label={stat.label} />
          ))}
          <StatColumn value={RESPONSE_TIME_STAT.value} label={RESPONSE_TIME_STAT.label} />
        </div>
      </RevealGroup>
    </section>
  );
}
