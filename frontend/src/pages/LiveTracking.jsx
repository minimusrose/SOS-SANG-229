import { useMemo, useState } from "react";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
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
    <PageFrame wide>
      <div className="space-y-8">
        <PageHeader kicker="Suivi" title="Demandes" highlight="en cours">
          Liste fictive pour valider les statuts. Identifiants REQ-DEMO-*, zones
          et patients clairement démo.
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
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-white"
                    : "bg-light text-secondary hover:bg-primary/10"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto"
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
            className="btn-secondary w-full sm:w-auto"
            onClick={() => setEmptyMode(true)}
          >
            Voir l’état vide
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="card text-center">
            <p className="text-lg font-extrabold text-secondary">
              Aucune demande pour ce filtre
            </p>
            <p className="mt-2 text-sm leading-6 text-accent">
              Dans le produit, cet état apparaîtra s’il n’y a pas d’alerte
              ouverte dans la zone. Ici, c’est un état de maquette.
            </p>
            <button
              type="button"
              className="btn-primary mt-5"
              onClick={() => {
                setEmptyMode(false);
                setFilter("toutes");
              }}
            >
              Réafficher les lignes démo
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {rows.map((item) => (
              <li key={item.id} className="card space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-mono text-sm font-bold text-secondary">{item.id}</p>
                  <StatusBadge status={item.status} />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-accent">
                      Groupe
                    </dt>
                    <dd className="mt-0.5 font-bold text-primary">{item.group}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-accent">
                      Zone
                    </dt>
                    <dd className="mt-0.5 text-secondary">{item.zone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-accent">
                      Établissement
                    </dt>
                    <dd className="mt-0.5 text-secondary">{item.hospital}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-accent">
                      Patient
                    </dt>
                    <dd className="mt-0.5 text-secondary">{item.patient}</dd>
                  </div>
                </dl>
                <p className="text-xs text-accent">Mis à jour {item.updated}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageFrame>
  );
}
