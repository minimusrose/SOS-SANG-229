import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client.js";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { RevealGroup } from "../components/Reveal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { STATUS_FILTERS, STATUS_META, formatDateTime } from "../lib/status.js";

export default function LiveTracking({ onToast }) {
  const { publicRef: routeRef } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("toutes");
  const [rows, setRows] = useState([]);
  const [listState, setListState] = useState("loading");
  const [lookup, setLookup] = useState(routeRef || "");
  const [detail, setDetail] = useState(null);
  const [detailState, setDetailState] = useState(routeRef ? "loading" : "idle");
  const [confirmingId, setConfirmingId] = useState(null);

  const loadList = useCallback(async () => {
    setListState("loading");
    try {
      const data = await api.listRequests();
      setRows(Array.isArray(data) ? data : []);
      setListState("ready");
    } catch (error) {
      setRows([]);
      setListState("error");
      onToast(error.message);
    }
  }, [onToast]);

  const loadDetail = useCallback(
    async (ref) => {
      if (!ref) {
        setDetail(null);
        setDetailState("idle");
        return;
      }
      setDetailState("loading");
      try {
        const data = await api.getRequest(ref);
        setDetail(data);
        setDetailState("ready");
      } catch (error) {
        setDetail(null);
        setDetailState(error instanceof ApiError && error.status === 404 ? "missing" : "error");
        onToast(
          error instanceof ApiError && error.status === 404
            ? `Aucune demande ${ref}.`
            : error.message,
        );
      }
    },
    [onToast],
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    setLookup(routeRef || "");
    loadDetail(routeRef);
  }, [routeRef, loadDetail]);

  const visibleRows = useMemo(() => {
    if (filter === "toutes") return rows;
    return rows.filter((item) => item.status === filter);
  }, [filter, rows]);

  function handleLookup(event) {
    event.preventDefault();
    const ref = lookup.trim();
    if (!ref) return;
    navigate(`/suivi/${encodeURIComponent(ref)}`);
  }

  async function handleConfirm(donorId) {
    if (!detail?.id || confirmingId) return;
    setConfirmingId(donorId);
    try {
      await api.confirmDonation({
        donor_id: donorId,
        urgency_request_id: detail.id,
      });
      onToast("Don confirmé. Aucun numéro de téléphone n’est affiché.");
      await Promise.all([loadDetail(detail.public_ref), loadList()]);
    } catch (error) {
      onToast(error.message);
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <PageFrame wide>
      <div className="space-y-8">
        <PageHeader kicker="Suivi" title="Demandes" highlight="en cours">
          Liste chargée depuis l’API. Recherchez une référence publique pour
          le détail.
        </PageHeader>

        <DemoBanner>
          Aucune donnée réelle de donneur, de patient ou d’établissement. Les
          listes n’exposent pas les numéros de téléphone.
        </DemoBanner>

        <form className="card space-y-3" onSubmit={handleLookup}>
          <label htmlFor="publicRef" className="field-label">
            Référence publique
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="publicRef"
              className="field-input"
              value={lookup}
              onChange={(event) => setLookup(event.target.value)}
              placeholder="REQ-XXXXXXXX"
              autoComplete="off"
            />
            <button type="submit" className="btn-primary sm:w-auto">
              Ouvrir
            </button>
          </div>
        </form>

        {routeRef ? (
          <section className="card space-y-4">
            {detailState === "loading" ? (
              <p className="text-sm text-muted">Chargement de {routeRef}…</p>
            ) : null}
            {detailState === "missing" || detailState === "error" ? (
              <p className="text-sm text-muted">
                Impossible d’afficher cette demande. Vérifiez la référence ou
                l’API.
              </p>
            ) : null}
            {detail ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-mono text-lg font-extrabold text-secondary">
                    {detail.public_ref}
                  </p>
                  <StatusBadge status={detail.status} />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm md:grid-cols-3">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                      Groupe
                    </dt>
                    <dd className="mt-0.5 font-bold text-primary-strong">
                      {detail.blood_group_needed}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                      Patient
                    </dt>
                    <dd className="mt-0.5 text-secondary">{detail.patient_display_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                      Établissement
                    </dt>
                    <dd className="mt-0.5 text-secondary">
                      {detail.hospital_name} · {detail.hospital_city}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                      Zone
                    </dt>
                    <dd className="mt-0.5 text-secondary">{detail.zone_label || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                      Alertés
                    </dt>
                    <dd className="mt-0.5 font-bold text-secondary">
                      {detail.alerted_donors_count}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                      Confirmés
                    </dt>
                    <dd className="mt-0.5 font-bold text-secondary">
                      {detail.confirmed_donations_count} / {detail.units_needed}
                    </dd>
                  </div>
                </dl>
                {detail.matched_donors?.length ? (
                  <ul className="space-y-2">
                    {detail.matched_donors.map((candidate) => (
                      <li
                        key={candidate.donor_id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-light px-4 py-3"
                      >
                        <span className="text-sm text-secondary">
                          <strong className="font-semibold">{candidate.display_name}</strong>
                          {" · "}
                          {candidate.city}
                        </span>
                        <button
                          type="button"
                          className="btn-secondary px-4 py-2 text-sm"
                          disabled={
                            Boolean(confirmingId) ||
                            !detail.id ||
                            detail.status === "fulfilled" ||
                            detail.status === "cancelled"
                          }
                          onClick={() => handleConfirm(candidate.donor_id)}
                        >
                          {confirmingId === candidate.donor_id
                            ? "Confirmation…"
                            : "Confirmer le don"}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Aucun donneur matché pour cette alerte.</p>
                )}
                <p className="text-xs text-muted">
                  Mise à jour {formatDateTime(detail.updated_at)}
                </p>
              </>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((key) => {
            const label = key === "toutes" ? "Toutes" : STATUS_META[key].label;
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-micro ease-soft-out ${
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
            onClick={loadList}
            disabled={listState === "loading"}
          >
            {listState === "loading" ? "Actualisation…" : "Actualiser"}
          </button>
          {routeRef ? (
            <Link to="/suivi" className="btn-secondary w-full sm:w-auto">
              Voir toute la liste
            </Link>
          ) : null}
        </div>

        {listState === "error" ? (
          <div className="card text-center">
            <p className="text-lg font-extrabold text-secondary">API indisponible</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Lancez uvicorn puis actualisez. Aucune ligne démo n’est affichée
              à la place.
            </p>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="card text-center">
            <p className="text-lg font-extrabold text-secondary">
              Aucune demande pour ce filtre
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Créez une alerte ou inscrivez un donneur fictif, puis actualisez.
            </p>
            <Link to="/alerte" className="btn-primary mt-5">
              Créer une alerte
            </Link>
          </div>
        ) : (
          <RevealGroup as="ul" className="grid gap-4 md:grid-cols-2">
            {visibleRows.map((item) => (
              <li key={item.public_ref}>
                <Link
                  to={`/suivi/${encodeURIComponent(item.public_ref)}`}
                  className="card block space-y-4 transition duration-micro ease-soft-out hover:-translate-y-0.5 hover:shadow-soft"
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
                        Établissement
                      </dt>
                      <dd className="mt-0.5 text-secondary">{item.hospital_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                        Zone
                      </dt>
                      <dd className="mt-0.5 text-secondary">
                        {item.zone_label || item.hospital_city}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                        Alertés
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
                </Link>
              </li>
            ))}
          </RevealGroup>
        )}
      </div>
    </PageFrame>
  );
}
