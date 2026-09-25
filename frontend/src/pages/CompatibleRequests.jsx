import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { isCompatible } from "../lib/bloodCompatibility.js";
import CompatibilityBadge from "../components/CompatibilityBadge.jsx";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import RequestFilters, { EMPTY_FILTERS } from "../components/RequestFilters.jsx";
import { RevealGroup } from "../components/Reveal.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { displayStatus, formatDateTime } from "../lib/status.js";

// Derives the badge state from the current donor's own blood group. Only
// isCompatible() (the single compatibility source of truth) decides the
// compatible/incompatible verdict — "unknown" is purely a display fallback
// for accounts with no blood group on file.
function compatibilityState(myBloodGroup, neededGroup) {
  if (!myBloodGroup) return "unknown";
  return isCompatible(myBloodGroup, neededGroup) ? "compatible" : "incompatible";
}

export default function CompatibleRequests({ onToast }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading");
  const [confirmingId, setConfirmingId] = useState(null);
  const [myBloodGroup, setMyBloodGroup] = useState(null);
  const [hospitalNames, setHospitalNames] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

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

  useEffect(() => {
    let cancelled = false;
    if (!user?.has_donor_profile) {
      setMyBloodGroup(null);
      return undefined;
    }
    api
      .getDonorProfile()
      .then((profile) => {
        if (!cancelled) setMyBloodGroup(profile.blood_group);
      })
      .catch(() => {
        if (!cancelled) setMyBloodGroup(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.has_donor_profile]);

  useEffect(() => {
    let cancelled = false;
    api
      .listRecognizedHospitals()
      .then((list) => {
        if (cancelled) return;
        const names = Array.from(
          new Set((Array.isArray(list) ? list : []).map((h) => h.name).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b, "fr"));
        setHospitalNames(names);
      })
      .catch(() => {
        if (!cancelled) setHospitalNames([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cityOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.hospital_city).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "fr"),
      ),
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (filters.status !== "all" && displayStatus(row) !== filters.status) {
          return false;
        }
        if (filters.city && row.hospital_city !== filters.city) return false;
        if (filters.hospital && row.hospital_name !== filters.hospital) return false;
        if (filters.compat !== "all") {
          if (compatibilityState(myBloodGroup, row.blood_group_needed) !== filters.compat) {
            return false;
          }
        }
        if (filters.reference) {
          const needle = filters.reference.trim().toLowerCase();
          if (needle && !row.public_ref.toLowerCase().includes(needle)) return false;
        }
        return true;
      }),
    [rows, filters, myBloodGroup],
  );

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
          Toutes les demandes de sang actives sur la plateforme, hors les
          vôtres. Votre compatibilité est indiquée sur chaque carte.
        </PageHeader>

        {!user?.has_donor_profile ? (
          <DemoBanner title="Compatibilité">
            Enregistrez votre groupe sanguin pour voir votre compatibilité
            avec chaque demande.{" "}
            <Link to="/donneur/inscription" className="font-bold underline">
              Devenir donneur
            </Link>
          </DemoBanner>
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
              Aucune demande pour le moment
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Il n’y a aucune demande active sur la plateforme en ce moment.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <RequestFilters
              filters={filters}
              onChange={setFilters}
              cities={cityOptions}
              hospitals={hospitalNames}
            />
            <p aria-live="polite" className="sr-only">
              {filteredRows.length} demande{filteredRows.length > 1 ? "s" : ""}{" "}
              affichée{filteredRows.length > 1 ? "s" : ""}.
            </p>

            {filteredRows.length === 0 ? (
              <div className="card text-center">
                <p className="text-sm leading-6 text-muted">
                  Aucune demande ne correspond à ces critères.
                </p>
              </div>
            ) : (
              <RevealGroup as="ul" className="grid gap-4 md:grid-cols-2">
                {filteredRows.map((item) => {
                  const closed =
                    item.status === "fulfilled" || item.status === "cancelled";
                  const compat = compatibilityState(myBloodGroup, item.blood_group_needed);
                  return (
                    <li key={item.id} className="card space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-mono text-sm font-bold text-secondary">
                          {item.public_ref}
                        </p>
                        <div className="flex flex-col items-end gap-1.5">
                          <StatusBadge status={displayStatus(item)} />
                          <CompatibilityBadge state={compat} />
                        </div>
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
                      ) : item.is_matched ? (
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
                      ) : null}
                    </li>
                  );
                })}
              </RevealGroup>
            )}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
