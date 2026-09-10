import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import RequestDetail from "../components/RequestDetail.jsx";
import { RevealGroup } from "../components/Reveal.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDateTime } from "../lib/status.js";

export default function MyRequests({ onToast }) {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading");
  const [selectedRef, setSelectedRef] = useState(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await api.myRequests();
      setRows(Array.isArray(data) ? data : []);
      setState("ready");
    } catch (error) {
      setRows([]);
      setState("error");
      onToast(error.message);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageFrame wide>
      <div className="space-y-8">
        <PageHeader kicker="Suivi" title="Mes" highlight="demandes">
          Les urgences que vous avez signalées et leur avancement.
        </PageHeader>

        {selectedRef ? (
          <RequestDetail
            publicRef={selectedRef}
            onClose={() => setSelectedRef(null)}
          />
        ) : null}

        {state === "loading" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : state === "error" ? (
          <div className="card text-center">
            <p className="text-lg font-extrabold text-secondary">
              Service indisponible
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Réessayez dans un instant.
            </p>
            <button type="button" className="btn-secondary mt-5" onClick={load}>
              Réessayer
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="card text-center">
            <p className="text-lg font-extrabold text-secondary">
              Aucune demande pour l’instant
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Signalez une urgence pour mobiliser les donneurs compatibles.
            </p>
            <Link to="/alerte" className="btn-primary mt-5">
              Signaler une urgence
            </Link>
          </div>
        ) : (
          <RevealGroup as="ul" className="grid gap-4 md:grid-cols-2">
            {rows.map((item) => (
              <li key={item.public_ref}>
                <button
                  type="button"
                  onClick={() => setSelectedRef(item.public_ref)}
                  className="card block w-full space-y-4 text-left transition duration-micro ease-soft-out hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-mono text-sm font-bold text-secondary">
                      {item.public_ref}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                        Groupe
                      </dt>
                      <dd className="mt-0.5 font-bold text-primary-strong">
                        {item.blood_group_needed}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                        Établissement
                      </dt>
                      <dd className="mt-0.5 text-secondary">{item.hospital_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                        Donneurs prévenus
                      </dt>
                      <dd className="mt-0.5 font-bold text-secondary">
                        {item.alerted_donors_count}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                        Confirmés
                      </dt>
                      <dd className="mt-0.5 font-bold text-secondary">
                        {item.confirmed_donations_count} / {item.units_needed}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-xs text-muted">
                    Créée {formatDateTime(item.created_at)}
                  </p>
                </button>
              </li>
            ))}
          </RevealGroup>
        )}
      </div>
    </PageFrame>
  );
}
