import { forwardRef, useEffect, useState } from "react";
import { ApiError, api } from "../api/client.js";
import { displayStatus, formatDateTime } from "../lib/status.js";
import Skeleton from "./Skeleton.jsx";
import StatusBadge from "./StatusBadge.jsx";

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-secondary">{children}</dd>
    </div>
  );
}

/**
 * Read-only detail of one request, fetched by public reference.
 * Used from "Mes demandes". Access is enforced by the API (requester or
 * matched donor only).
 *
 * Forwards its ref to the root <section> (focused by the caller when the
 * panel opens, per the "move focus to the panel" accessibility requirement).
 */
const RequestDetail = forwardRef(function RequestDetail(
  { publicRef, onClose },
  ref,
) {
  const [detail, setDetail] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setDetail(null);
    api
      .getRequest(publicRef)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setState(
          error instanceof ApiError && error.status === 404 ? "missing" : "error",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [publicRef]);

  return (
    <section
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={`Détail de la demande ${publicRef}`}
      className="card space-y-4 focus:outline-none"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-mono text-lg font-extrabold text-secondary">
          {publicRef}
        </p>
        <div className="flex items-center gap-3">
          {detail ? <StatusBadge status={displayStatus(detail)} /> : null}
          {onClose ? (
            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition duration-micro ease-soft-out hover:bg-light hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {state === "loading" ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : null}

      {state === "missing" || state === "error" ? (
        <p className="text-sm text-muted">
          Impossible d’afficher cette demande pour le moment.
        </p>
      ) : null}

      {detail ? (
        <>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm md:grid-cols-3">
            <Field label="Groupe">
              <span className="font-bold text-primary-strong">
                {detail.blood_group_needed}
              </span>
            </Field>
            <Field label="Patient">{detail.patient_display_name}</Field>
            <Field label="Établissement">
              {detail.hospital_name} · {detail.hospital_city}
            </Field>
            <Field label="Zone">{detail.zone_label || "—"}</Field>
            <Field label="Donneurs contactés">
              <span className="font-bold text-secondary">
                {detail.alerted_donors_count}
              </span>
            </Field>
            <Field label="Dons confirmés">
              <span className="font-bold text-secondary">
                {detail.confirmed_donations_count} / {detail.units_needed}
              </span>
            </Field>
          </dl>

          <p className="rounded-2xl bg-light px-4 py-3 text-sm leading-6 text-muted">
            {detail.alerted_donors_count > 0
              ? `${detail.alerted_donors_count} donneur${detail.alerted_donors_count > 1 ? "s" : ""} compatible${detail.alerted_donors_count > 1 ? "s" : ""} ${detail.alerted_donors_count > 1 ? "ont" : "a"} été contacté${detail.alerted_donors_count > 1 ? "s" : ""}. L’identité des donneurs n’est pas communiquée.`
              : "Aucun donneur compatible n’a encore été trouvé. La demande reste ouverte."}
          </p>

          <p className="text-xs text-muted">
            Mise à jour {formatDateTime(detail.updated_at)}
          </p>
        </>
      ) : null}
    </section>
  );
});

export default RequestDetail;
