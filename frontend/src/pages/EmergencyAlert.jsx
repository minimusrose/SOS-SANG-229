import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import BloodGroupSelect from "../components/BloodGroupSelect.jsx";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
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

  useEffect(() => {
    let cancelled = false;
    async function loadHospitals() {
      setHospitalsState("loading");
      try {
        const rows = await api.listRecognizedHospitals();
        if (cancelled) return;
        setHospitals(Array.isArray(rows) ? rows.filter((row) => row.is_recognized) : []);
        setHospitalsState("ready");
      } catch (error) {
        if (cancelled) return;
        setHospitals([]);
        setHospitalsState("error");
        onToast(error.message);
      }
    }
    loadHospitals();
    return () => {
      cancelled = true;
    };
  }, [onToast]);

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
      onToast(
        `Alerte ${created.public_ref} créée. ${count} donneur${count > 1 ? "s" : ""} alerté${count > 1 ? "s" : ""} (SMS stub, pas d’envoi réel).`,
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
          s’exécute côté API ; aucun SMS réel n’est envoyé.
        </PageHeader>

        <UrgencyBadge>Matching local · SMS stub</UrgencyBadge>

        <DemoBanner>
          Patient démo uniquement. L’établissement doit figurer sur la liste
          officielle (structures reconnues). Exemple : Patient Demo, hôpital
          reconnu chargé depuis l’API.
        </DemoBanner>

        {result ? (
          <div className="card space-y-4 border-primary/20">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Alerte créée
            </p>
            <p className="font-mono text-lg font-extrabold text-secondary">
              {result.public_ref}
            </p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-accent">
                  Donneurs alertés
                </dt>
                <dd className="mt-0.5 text-2xl font-extrabold text-primary">
                  {result.alerted_donors_count ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-accent">
                  Confirmations
                </dt>
                <dd className="mt-0.5 text-2xl font-extrabold text-secondary">
                  {result.confirmed_donations_count ?? 0}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-accent">
                  Établissement
                </dt>
                <dd className="mt-0.5 text-secondary">
                  {result.hospital_name} · {result.hospital_city}
                </dd>
              </div>
            </dl>
            {result.matching?.candidates?.length ? (
              <ul className="space-y-2">
                {result.matching.candidates.map((candidate) => (
                  <li
                    key={candidate.donor_id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-light px-4 py-3"
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
                      disabled={Boolean(confirmingId) || result.status === "fulfilled"}
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
              <p className="text-sm text-accent">
                Aucun donneur compatible pour l’instant. Inscrivez un profil
                fictif dans la même zone, puis relancez une alerte.
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to={`/suivi/${result.public_ref}`} className="btn-primary">
                Voir le suivi
              </Link>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setResult(null)}
              >
                Nouvelle alerte
              </button>
            </div>
          </div>
        ) : null}

        <form className="card space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div className="rounded-2xl bg-primary/5 px-5 py-4 text-sm leading-6 text-secondary">
            Cette action crée une urgence et rapproche les donneurs compatibles
            (rayon 15 km ou même ville). Twilio n’est pas appelé.
          </div>

          <div className="space-y-2">
            <label htmlFor="neededGroup" className="field-label">
              Groupe demandé <span className="font-normal text-accent">(requis)</span>
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
              <span className="font-normal text-accent">(requis)</span>
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
              <span className="font-normal text-accent">
                (liste officielle, requis)
              </span>
            </label>
            <select
              id="hospital"
              className="field-input"
              value={form.hospitalId}
              onChange={update("hospitalId")}
              required
              disabled={hospitalsState !== "ready" || hospitals.length === 0}
            >
              <option value="">
                {hospitalsState === "loading"
                  ? "Chargement des établissements…"
                  : hospitalsState === "error"
                    ? "API indisponible — relancez uvicorn"
                    : hospitals.length === 0
                      ? "Aucun hôpital reconnu (lancez le seed)"
                      : "Choisir un établissement reconnu"}
              </option>
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name} — {hospital.city}
                </option>
              ))}
            </select>
            <p className="field-hint">
              Seules les structures reconnues par l’État peuvent être choisies —
              pour que le don arrive au bon endroit. La saisie libre d’un
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
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={!canSubmit || submitting}
            >
              {submitting ? "Envoi de l’alerte…" : "Envoyer l’alerte"}
            </button>
            {!canSubmit ? (
              <p className="field-hint">
                Renseignez le groupe, un nom démo et un hôpital reconnu de la
                liste pour activer l’envoi.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </PageFrame>
  );
}
