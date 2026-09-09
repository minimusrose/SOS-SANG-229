import { useMemo, useState } from "react";
import DemoBanner from "../components/DemoBanner.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { DEMO_REQUESTS, STATUS_META } from "../data/demo.js";

const FILTERS = ["toutes", ...Object.keys(STATUS_META)];

export default function LiveTracking({ onToast }) {
  const [filter, setFilter] = useState("toutes");
  const [emptyMode, setEmptyMode] = useState(false);

  const rows = useMemo(() => {
    if (emptyMode) return [];
    if (filter === "toutes") return DEMO_REQUESTS;
    return DEMO_REQUESTS.filter((item) => item.status === filter);
  }, [filter, emptyMode]);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Suivi" title="Demandes en cours">
        Liste fictive pour valider le statut visuel. Identifiants préfixés
        REQ-DEMO-*, zones et patients clairement démo.
      </PageHeader>

      <DemoBanner>
        Aucune donnée réelle de donneur, de patient ou d’établissement. Le
        rafraîchissement est volontairement factice.
      </DemoBanner>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((key) => {
          const label = key === "toutes" ? "Toutes" : STATUS_META[key].label;
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setEmptyMode(false);
                setFilter(key);
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${
                active
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-stone-700 ring-stone-200 hover:bg-sand-100"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            onToast(
              "Actualisation simulée. Les lignes démo n’ont pas changé — aucun serveur interrogé.",
            )
          }
        >
          Actualiser (désactivé / démo)
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setEmptyMode(true)}
        >
          Voir l’état vide
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center">
          <p className="text-base font-semibold text-stone-900">
            Aucune demande pour ce filtre
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Dans le produit, cet état apparaîtra s’il n’y a pas d’alerte ouverte
            dans la zone. Ici, c’est un état de maquette.
          </p>
          <button
            type="button"
            className="btn-primary mt-4"
            onClick={() => {
              setEmptyMode(false);
              setFilter("toutes");
            }}
          >
            Réafficher les lignes démo
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((item) => (
            <li key={item.id} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-stone-900">
                  {item.id}
                </p>
                <StatusBadge status={item.status} />
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Groupe
                  </dt>
                  <dd className="mt-0.5 font-semibold text-brand-700">{item.group}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Zone
                  </dt>
                  <dd className="mt-0.5 text-stone-800">{item.zone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Établissement
                  </dt>
                  <dd className="mt-0.5 text-stone-800">{item.hospital}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Patient
                  </dt>
                  <dd className="mt-0.5 text-stone-800">{item.patient}</dd>
                </div>
              </dl>
              <p className="text-xs text-stone-500">Mis à jour {item.updated}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
