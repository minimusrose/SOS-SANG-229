import { useState } from "react";
import BloodGroupSelect from "../components/BloodGroupSelect.jsx";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import UrgencyBadge from "../components/UrgencyBadge.jsx";
import { DEMO_HOSPITALS } from "../data/demo.js";

const INITIAL = {
  bloodGroup: "",
  patientName: "",
  hospital: "",
};

export default function EmergencyAlert({ onToast }) {
  const [form, setForm] = useState(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = Boolean(
    form.bloodGroup && form.patientName.trim() && form.hospital,
  );

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
    onToast(
      "Alerte simulée. Aucun SMS, aucun hôpital réel, aucune donnée patient n’a quitté cet appareil.",
    );
    setForm(INITIAL);
  }

  return (
    <PageFrame>
      <div className="space-y-8">
        <PageHeader kicker="Urgence" title="Alerte" highlight="don de sang">
          Déclarez un besoin fictif. L’urgence est claire, le ton reste
          rassurant.
        </PageHeader>

        <UrgencyBadge>Alerte simulée · aucun envoi</UrgencyBadge>

        <DemoBanner>
          Utilisez uniquement un nom de patient démo et un établissement fictif.
          Exemple : Patient Demo, Hôpital Demo Nord.
        </DemoBanner>

        <form className="card space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div className="rounded-2xl bg-primary/5 px-5 py-4 text-sm leading-6 text-secondary">
            Cette action représentera plus tard un appel aux donneurs
            compatibles. Aujourd’hui, elle n’envoie rien.
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
            />
            <p className="field-hint">
              Interdit : nom d’un vrai patient ou d’un proche identifiable.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="hospital" className="field-label">
              Hôpital / établissement{" "}
              <span className="font-normal text-accent">(requis)</span>
            </label>
            <select
              id="hospital"
              className="field-input"
              value={form.hospital}
              onChange={update("hospital")}
              required
            >
              <option value="">Choisir un établissement démo</option>
              {DEMO_HOSPITALS.map((hospital) => (
                <option key={hospital} value={hospital}>
                  {hospital}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <button type="submit" className="btn-primary w-full" disabled={!canSubmit}>
              Envoyer l’alerte (démo)
            </button>
            {!canSubmit ? (
              <p className="field-hint">
                Renseignez le groupe, un nom démo et un hôpital fictif pour
                activer l’envoi simulé.
              </p>
            ) : null}
            {submitted ? (
              <p className="text-sm font-semibold text-success">
                Dernière action : alerte locale uniquement. Formulaire vidé, rien
                n’est stocké.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </PageFrame>
  );
}
