import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { RevealGroup } from "../components/Reveal.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDateTime } from "../lib/status.js";

export default function CompatibleRequests({ onToast }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading");
  const [confirmingId, setConfirmingId] = useState(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await api.myMatches();
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

  async function handleConfirm(item) {
    if (confirmingId) return;
    setConfirmingId(item.id);
    try {
      await api.confirmDonation({ urgency_request_id: item.id });
      setRows((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, i_confirmed: true } : row,
        ),
      );
      onToast("Don confirmé. Merci pour votre réactivité.");
      load();
    } catch (error) {
      onToast(error.message);
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <PageFrame wide>
      <div className="space-y-8">
        <PageHeader kicker="Donneur" title="Demandes" highlight="en cours">
          Les urgences pour lesquelles votre profil est compatible. Confirmez
          votre don après être passé à l’établissement.
        </PageHeader>

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
            {user?.has_donor_profile ? (
              <>
                <p className="text-lg font-extrabold text-secondary">
                  Aucune demande compatible
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Vous serez prévenu dès qu’une urgence correspondra à votre
                  groupe et à votre zone.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-extrabold text-secondary">
                  Vous n’êtes pas encore donneur
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Enregistrez votre groupe sanguin et votre zone pour recevoir
                  des demandes.
                </p>
                <Link to="/donneur/inscription" className="btn-primary mt-5">
                  Devenir donneur
                </Link>
              </>
            )}
          </div>
        ) : (
          <RevealGroup as="ul" className="grid gap-4 md:grid-cols-2">
            {rows.map((item) => {
              const closed =
                item.status === "fulfilled" || item.status === "cancelled";
              return (
                <li key={item.id} className="card space-y-4">
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
                      <dd className="mt-0.5 text-secondary">
                        {item.hospital_name} · {item.hospital_city}
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
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                        Créée
                      </dt>
                      <dd className="mt-0.5 text-secondary">
                        {formatDateTime(item.created_at)}
                      </dd>
                    </div>
                  </dl>
                  {item.i_confirmed ? (
                    <p className="text-sm font-semibold text-success">
                      Don confirmé ✓
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary w-full"
                      disabled={Boolean(confirmingId) || closed}
                      onClick={() => handleConfirm(item)}
                    >
                      {confirmingId === item.id
                        ? "Confirmation…"
                        : closed
                          ? "Demande clôturée"
                          : "Confirmer mon don"}
                    </button>
                  )}
                </li>
              );
            })}
          </RevealGroup>
        )}
      </div>
    </PageFrame>
  );
}
