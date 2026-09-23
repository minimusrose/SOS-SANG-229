import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import RequestDetail from "../components/RequestDetail.jsx";
import { RevealGroup } from "../components/Reveal.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import StatusFilter from "../components/StatusFilter.jsx";
import {
  countByDisplayStatus,
  displayStatus,
  formatDateTime,
  STATUS_EMPTY_LABEL,
} from "../lib/status.js";

export default function MyRequests({ onToast }) {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading");
  const [selectedRef, setSelectedRef] = useState(null);
  const [filter, setFilter] = useState("all");
  const detailRef = useRef(null);
  const lastTriggerRef = useRef(null);

  const counts = useMemo(() => countByDisplayStatus(rows), [rows]);
  const filteredRows = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => displayStatus(row) === filter)),
    [rows, filter],
  );

  useEffect(() => {
    if (selectedRef) detailRef.current?.focus();
  }, [selectedRef]);

  function openDetail(publicRef, triggerEl) {
    lastTriggerRef.current = triggerEl;
    setSelectedRef(publicRef);
  }

  function closeDetail() {
    setSelectedRef(null);
    lastTriggerRef.current?.focus();
  }

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
            ref={detailRef}
            publicRef={selectedRef}
            onClose={closeDetail}
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
          <div className="space-y-6">
            <StatusFilter value={filter} onChange={setFilter} counts={counts} />
            <p aria-live="polite" className="sr-only">
              {filteredRows.length} demande{filteredRows.length > 1 ? "s" : ""}{" "}
              affichée{filteredRows.length > 1 ? "s" : ""}.
            </p>

            {filteredRows.length === 0 ? (
              <div className="card text-center">
                <p className="text-sm leading-6 text-muted">
                  Aucune demande {STATUS_EMPTY_LABEL[filter]} pour le moment.
                </p>
              </div>
            ) : (
              <RevealGroup as="ul" className="grid gap-4 md:grid-cols-2">
                {filteredRows.map((item) => (
                  <li key={item.public_ref}>
                    <div className="card space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-mono text-sm font-bold text-secondary">
                          {item.public_ref}
                        </p>
                        <StatusBadge status={displayStatus(item)} />
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
                          <dd className="mt-0.5 text-secondary">
                            {item.hospital_name}
                          </dd>
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
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted">
                          Créée {formatDateTime(item.created_at)}
                        </p>
                        <button
                          type="button"
                          onClick={(event) =>
                            openDetail(item.public_ref, event.currentTarget)
                          }
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm font-bold text-primary transition-colors duration-micro ease-soft-out hover:text-primary-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          Voir plus
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </RevealGroup>
            )}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
