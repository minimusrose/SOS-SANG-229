import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { PHONE_ERROR, isValidPhone } from "../lib/validation.js";
import BloodGroupSelect from "../components/BloodGroupSelect.jsx";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Skeleton from "../components/Skeleton.jsx";
import SubmitButton from "../components/SubmitButton.jsx";
import UrgencyBadge from "../components/UrgencyBadge.jsx";

const INITIAL = {
  requesterName: "",
  phone: "",
  password: "",
  bloodGroup: "",
  patientName: "",
  hospitalId: "",
  unitsNeeded: "1",
};

export default function EmergencyAlert({ onToast }) {
  const { user, register } = useAuth();
  const needsAccount = !user;

  const [form, setForm] = useState(INITIAL);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsState, setHospitalsState] = useState("loading");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const selectedHospital = hospitals.find((item) => item.id === form.hospitalId);
  const canSubmit = Boolean(
    form.bloodGroup &&
      form.patientName.trim() &&
      selectedHospital?.is_recognized &&
      Number(form.unitsNeeded) >= 1 &&
      (!needsAccount ||
        (form.requesterName.trim() &&
          form.phone.trim() &&
          form.password.length >= 8)),
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

    if (needsAccount && !isValidPhone(form.phone)) {
      onToast(PHONE_ERROR);
      return;
    }

    setSubmitting(true);
    try {
      if (needsAccount) {
        await register({
          phone: form.phone.trim(),
          password: form.password,
          display_name: form.requesterName.trim(),
        });
      }
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
      onToast(
        `Alerte ${created.public_ref} envoyée. ${count} donneur${count > 1 ? "s" : ""} prévenu${count > 1 ? "s" : ""}.`,
      );
    } catch (error) {
      onToast(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageFrame>
      <div className="space-y-8">
        <PageHeader kicker="Urgence" title="Alerte" highlight="don de sang">
          Signalez un besoin de sang si vous vous trouvez dans un établissement
          de santé reconnu. Les donneurs compatibles à proximité seront prévenus
          immédiatement.
        </PageHeader>

        {result ? (
          <AlertConfirmation result={result} onReset={() => setResult(null)} />
        ) : (
          <>
            <UrgencyBadge>Donneurs alertés en temps réel</UrgencyBadge>

            <DemoBanner title="Établissements reconnus">
              Seuls les établissements de santé officiellement reconnus peuvent
              recevoir une alerte, pour garantir que le don arrive au bon
              endroit.
            </DemoBanner>

            <form
              className="card space-y-6"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              <div className="rounded-2xl bg-primary/5 px-5 py-4 text-sm leading-6 text-secondary">
                L’alerte prévient les donneurs compatibles dans un rayon
                d’environ 15 km, ou à défaut dans la même ville.
              </div>

              {needsAccount ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="requesterName" className="field-label">
                      Votre nom{" "}
                      <span className="font-normal text-primary-strong">(requis)</span>
                    </label>
                    <input
                      id="requesterName"
                      className="field-input"
                      value={form.requesterName}
                      onChange={update("requesterName")}
                      placeholder="Ex. Awa K."
                      autoComplete="name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="field-label">
                      Téléphone{" "}
                      <span className="font-normal text-primary-strong">(requis)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      className="field-input"
                      value={form.phone}
                      onChange={update("phone")}
                      placeholder="+229 XX XX XX XX XX"
                      autoComplete="username"
                      required
                    />
                    <p className="field-hint">
                      Sert d’identifiant de connexion pour suivre vos demandes.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="field-label">
                      Mot de passe{" "}
                      <span className="font-normal text-primary-strong">
                        (8 caractères min.)
                      </span>
                    </label>
                    <input
                      id="password"
                      type="password"
                      className="field-input"
                      value={form.password}
                      onChange={update("password")}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>
                </>
              ) : null}

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
                  Nom du patient{" "}
                  <span className="font-normal text-primary-strong">(requis)</span>
                </label>
                <input
                  id="patientName"
                  className="field-input"
                  value={form.patientName}
                  onChange={update("patientName")}
                  placeholder="Ex. Awa Koffi"
                  autoComplete="off"
                  required
                />
                <p className="field-hint">
                  Nom complet du patient : le donneur doit savoir au nom de qui
                  le don est fait.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="hospital" className="field-label">
                  Établissement de santé{" "}
                  <span className="font-normal text-primary-strong">(requis)</span>
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
                      {hospitals.length === 0 && hospitalsState !== "error"
                        ? "Aucun établissement disponible pour le moment"
                        : "Choisir un établissement"}
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
                  {needsAccount
                    ? "Créer mon compte et envoyer l’alerte"
                    : "Envoyer l’alerte"}
                </SubmitButton>
                {!canSubmit ? (
                  <p className="field-hint">
                    Renseignez le groupe sanguin, le patient et l’établissement
                    pour envoyer l’alerte.
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
 * Orchestrated confirmation for a created alert: a circled check pops in, the
 * public reference follows ~560ms later, then the compatible donors cascade in
 * 110ms apart. Reduced-motion collapses every delay via the scoped CSS on
 * `.reveal-in`. Read-only — donors confirm from their own "Demandes en cours".
 */
function AlertConfirmation({ result, onReset }) {
  const candidates = result.matching?.candidates ?? [];

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
            Messages envoyés
          </dt>
          <dd className="mt-0.5 text-2xl font-extrabold text-secondary">
            {result.notification?.simulated_count ?? 0}
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
        Les donneurs compatibles ont été prévenus par SMS. Aucun numéro n’est
        affiché ni partagé.
      </p>

      {candidates.length ? (
        <ul className="space-y-2">
          {candidates.map((candidate, index) => (
            <li
              key={candidate.donor_id}
              className="reveal-in rounded-2xl bg-light px-4 py-3 text-sm text-secondary"
              style={{ animationDelay: `${900 + index * 110}ms` }}
            >
              <strong className="font-semibold">{candidate.display_name}</strong>
              {" · "}
              {candidate.city}
              {" · "}
              {candidate.match_method === "gps" ? "à proximité" : "même ville"}
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="reveal-in text-sm text-muted"
          style={{ animationDelay: "900ms" }}
        >
          Aucun donneur compatible n’est disponible pour le moment. L’alerte
          reste ouverte : de nouveaux donneurs peuvent encore répondre.
        </p>
      )}

      <div
        className="reveal-in flex flex-col gap-3 sm:flex-row"
        style={{ animationDelay: `${900 + candidates.length * 110 + 120}ms` }}
      >
        <Link to="/mes-demandes" className="btn-primary">
          Voir mes demandes
        </Link>
        <button type="button" className="btn-secondary" onClick={onReset}>
          Nouvelle alerte
        </button>
      </div>
    </div>
  );
}
