import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import BloodGroupSelect from "../components/BloodGroupSelect.jsx";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Skeleton from "../components/Skeleton.jsx";
import SubmitButton from "../components/SubmitButton.jsx";
import UrgencyBadge from "../components/UrgencyBadge.jsx";

const INITIAL = {
  bloodGroup: "",
  patientName: "",
  hospitalId: "",
  unitsNeeded: "1",
};

export default function EmergencyAlert({ onToast }) {
  const [form, setForm] = useState(INITIAL);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsState, setHospitalsState] = useState("loading");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const selectedHospital = hospitals.find((item) => item.id === form.hospitalId);
  const canSubmit = Boolean(
    form.bloodGroup &&
      form.patientName.trim() &&
      selectedHospital?.is_recognized &&
      Number(form.unitsNeeded) >= 1,
  );

  const loadHospitals = useCallback(async () => {
    setHospitalsState("loading");
    try {
      const rows = await api.listRecognizedHospitals();
      setHospitals(
        Array.isArray(rows) ? rows.filter((row) => row.is_recognized) : [],
      );
      setHospitalsState("ready");
    } catch (error) {
      setHospitals([]);
      setHospitalsState("error");
      onToast(error.message);
    }
  }, [onToast]);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const created = await api.createAlert({
        blood_group_needed: form.bloodGroup,
        patient_display_name: form.patientName.trim(),
        hospital_id: form.hospitalId,
        units_needed: Number(form.unitsNeeded) || 1,
        zone_label: selectedHospital?.city || undefined,
      });
      setResult(created);
      setForm(INITIAL);
      const count = created.alerted_donors_count ?? 0;
      const simulated = created.notification?.simulated_count ?? 0;
      onToast(
        `Alerte ${created.public_ref} créée. ${count} donneur${count > 1 ? "s" : ""} matché${count > 1 ? "s" : ""}, ${simulated} SMS simulé${simulated > 1 ? "s" : ""} (aucun envoi réel).`,
      );
    } catch (error) {
      onToast(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(donorId) {
    if (!result?.id || confirmingId) return;
    setConfirmingId(donorId);
    try {
      await api.confirmDonation({
        donor_id: donorId,
        urgency_request_id: result.id,
      });
      setResult((current) => {
        if (!current) return current;
        const nextCount = (current.confirmed_donations_count || 0) + 1;
        return {
          ...current,
          confirmed_donations_count: nextCount,
          status:
            nextCount >= (current.units_needed || 1) ? "fulfilled" : current.status,
        };
      });
      onToast("Don confirmé. Aucun numéro de téléphone n’est affiché.");
    } catch (error) {
      onToast(error.message);
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <PageFrame>
      <div className="space-y-8">
        <PageHeader kicker="Urgence" title="Alerte" highlight="don de sang">
          Déclarez un besoin fictif auprès d’un hôpital reconnu. Le matching
          s’exécute côté API, puis un SMS est simulé pour chaque donneur
          (aucun envoi réel).
        </PageHeader>

        {result ? (
          <AlertConfirmation
            result={result}
            confirmingId={confirmingId}
            onConfirm={handleConfirm}
            onReset={() => setResult(null)}
          />
        ) : (
          <>
            <UrgencyBadge>Matching local · SMS simulé</UrgencyBadge>

            <DemoBanner>
              Patient démo uniquement. L’établissement doit figurer sur la liste
              officielle (structures reconnues). Exemple : Patient Demo, hôpital
              reconnu chargé depuis l’API.
            </DemoBanner>

            <form
              className="card space-y-6"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              <div className="rounded-2xl bg-primary/5 px-5 py-4 text-sm leading-6 text-secondary">
                Cette action crée une urgence, rapproche les donneurs compatibles
                (rayon 15 km ou même ville), puis simule un SMS par candidat.
                Aucun SMS réel n’est envoyé (mode simulate).
              </div>

              <div className="space-y-2">
                <label htmlFor="neededGroup" className="field-label">
                  Groupe demandé{" "}
                  <span className="font-normal text-primary-strong">(requis)</span>
                </label>
                <BloodGroupSelect
                  id="neededGroup"
                  value={form.bloodGroup}
                  onChange={update("bloodGroup")}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="patientName" className="field-label">
                  Nom du patient (démo){" "}
                  <span className="font-normal text-primary-strong">(requis)</span>
                </label>
                <input
                  id="patientName"
                  className="field-input"
                  value={form.patientName}
                  onChange={update("patientName")}
                  placeholder="Patient Demo"
                  autoComplete="off"
                  required
                />
                <p className="field-hint">
                  Interdit : nom d’un vrai patient ou d’un proche identifiable.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="hospital" className="field-label">
                  Hôpital reconnu{" "}
                  <span className="font-normal text-primary-strong">
                    (liste officielle, requis)
                  </span>
                </label>
                {hospitalsState === "loading" ? (
                  <Skeleton className="h-[54px] w-full" />
                ) : (
                  <select
                    id="hospital"
                    className="field-input"
                    value={form.hospitalId}
                    onChange={update("hospitalId")}
                    required
                  >
                    <option value="">
                      {hospitals.length === 0
                        ? hospitalsState === "error"
                          ? "Choisir un établissement reconnu"
                          : "Aucun hôpital reconnu (lancez le seed)"
                        : "Choisir un établissement reconnu"}
                    </option>
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name} — {hospital.city}
                      </option>
                    ))}
                  </select>
                )}
                {hospitalsState === "error" ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="btn-secondary px-4 py-2 text-sm"
                      onClick={loadHospitals}
                    >
                      Recharger la liste
                    </button>
                    <span className="text-sm text-muted">
                      La liste n’a pas pu être chargée.
                    </span>
                  </div>
                ) : null}
                <p className="field-hint">
                  Seules les structures reconnues par l’État peuvent être choisies
                  — pour que le don arrive au bon endroit. La saisie libre d’un
                  centre non listé n’est pas autorisée.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="unitsNeeded" className="field-label">
                  Unités demandées
                </label>
                <input
                  id="unitsNeeded"
                  type="number"
                  min="1"
                  className="field-input"
                  value={form.unitsNeeded}
                  onChange={update("unitsNeeded")}
                />
              </div>

              <div className="space-y-2">
                <SubmitButton
                  pending={submitting}
                  disabled={!canSubmit}
                  className="w-full"
                >
                  Envoyer l’alerte
                </SubmitButton>
                {!canSubmit ? (
                  <p className="field-hint">
                    Renseignez le groupe, un nom démo et un hôpital reconnu de la
                    liste pour activer l’envoi.
                  </p>
                ) : null}
              </div>
            </form>
          </>
        )}
      </div>
    </PageFrame>
  );
}

/**
 * Orchestrated confirmation for a created alert (plan lot 2, #7):
 * a circled check pops in, the public reference follows ~560ms later, then the
 * compatible donors cascade in 110ms apart. Reduced-motion collapses every
 * delay to zero via the scoped CSS on `.reveal-in`.
 */
function AlertConfirmation({ result, confirmingId, onConfirm, onReset }) {
  const candidates = result.matching?.candidates ?? [];
  const fulfilled = result.status === "fulfilled";

  return (
    <div className="card space-y-5 border-primary/20">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-success/15 text-success">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 6 9 17l-5-5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: "draw-check 420ms cubic-bezier(.22,1,.36,1) 120ms forwards",
              }}
            />
          </svg>
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">
          Alerte créée
        </p>
      </div>

      <p
        className="reveal-in text-center font-mono text-xl font-extrabold text-secondary"
        style={{ animationDelay: "560ms" }}
      >
        {result.public_ref}
      </p>

      <dl
        className="reveal-in grid grid-cols-2 gap-3 text-sm"
        style={{ animationDelay: "720ms" }}
      >
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">
            Donneurs alertés
          </dt>
          <dd className="mt-0.5 text-2xl font-extrabold text-primary">
            {result.alerted_donors_count ?? 0}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">
            Confirmations
          </dt>
          <dd className="mt-0.5 text-2xl font-extrabold text-secondary">
            {result.confirmed_donations_count ?? 0}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">
            SMS simulés
          </dt>
          <dd className="mt-0.5 text-2xl font-extrabold text-secondary">
            {result.notification?.simulated_count ?? 0}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">
            Canal
          </dt>
          <dd className="mt-0.5 font-mono text-sm text-secondary">
            {result.notification?.channel ?? "sms_simulate"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">
            Établissement
          </dt>
          <dd className="mt-0.5 text-secondary">
            {result.hospital_name} · {result.hospital_city}
          </dd>
        </div>
      </dl>

      <p
        className="reveal-in rounded-2xl bg-primary/5 px-4 py-3 text-sm leading-6 text-secondary"
        style={{ animationDelay: "820ms" }}
      >
        Couche SMS active en mode{" "}
        <strong className="font-semibold">
          {result.notification?.mode ?? "simulate"}
        </strong>
        . Aucun appel Twilio, aucun numéro affiché.
      </p>

      {candidates.length ? (
        <ul className="space-y-2">
          {candidates.map((candidate, index) => (
            <li
              key={candidate.donor_id}
              className="reveal-in flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-light px-4 py-3"
              style={{ animationDelay: `${900 + index * 110}ms` }}
            >
              <span className="text-sm text-secondary">
                <strong className="font-semibold">{candidate.display_name}</strong>
                {" · "}
                {candidate.city}
                {" · "}
                {candidate.match_method === "gps" ? "GPS" : "ville"}
              </span>
              <button
                type="button"
                className="btn-secondary px-4 py-2 text-sm"
                disabled={Boolean(confirmingId) || fulfilled}
                onClick={() => onConfirm(candidate.donor_id)}
              >
                {confirmingId === candidate.donor_id
                  ? "Confirmation…"
                  : "Confirmer le don"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="reveal-in text-sm text-muted"
          style={{ animationDelay: "900ms" }}
        >
          Aucun donneur compatible pour l’instant. Inscrivez un profil fictif
          dans la même zone, puis relancez une alerte.
        </p>
      )}

      <div
        className="reveal-in flex flex-col gap-3 sm:flex-row"
        style={{ animationDelay: `${900 + candidates.length * 110 + 120}ms` }}
      >
        <Link to={`/suivi/${result.public_ref}`} className="btn-primary">
          Voir le suivi
        </Link>
        <button type="button" className="btn-secondary" onClick={onReset}>
          Nouvelle alerte
        </button>
      </div>
    </div>
  );
}
