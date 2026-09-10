import { useEffect, useState } from "react";
import { ApiError, api } from "../api/client.js";
import { formatDateTime } from "../lib/status.js";
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
 */
export default function RequestDetail({ publicRef, onClose }) {
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
    <section className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-mono text-lg font-extrabold text-secondary">
          {publicRef}
        </p>
        <div className="flex items-center gap-3">
          {detail ? <StatusBadge status={detail.status} /> : null}
          {onClose ? (
            <button
              type="button"
              className="text-sm font-semibold text-muted hover:text-secondary"
              onClick={onClose}
            >
              Fermer
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
}
