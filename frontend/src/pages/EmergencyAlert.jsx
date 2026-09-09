import { useState } from "react";
import BloodGroupSelect from "../components/BloodGroupSelect.jsx";
import DemoBanner from "../components/DemoBanner.jsx";
import PageHeader from "../components/PageHeader.jsx";
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
    <div className="space-y-6">
      <PageHeader kicker="Urgence" title="Alerte don de sang">
        Déclarez un besoin fictif. Le ton est volontairement calme : l’urgence est
        claire, sans mise en scène alarmiste.
      </PageHeader>

      <DemoBanner>
        Utilisez uniquement un nom de patient démo et un établissement fictif.
        Exemple : Patient Demo, Hôpital Demo Nord.
      </DemoBanner>

      <form className="card space-y-5" onSubmit={handleSubmit} autoComplete="off">
        <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-6 text-brand-800">
          Cette action représentera plus tard un appel aux donneurs compatibles.
          Aujourd’hui, elle n’envoie rien.
        </div>

        <div className="space-y-1.5">
          <label htmlFor="neededGroup" className="field-label">
            Groupe demandé <span className="font-normal text-stone-500">(requis)</span>
          </label>
          <BloodGroupSelect
            id="neededGroup"
            value={form.bloodGroup}
            onChange={update("bloodGroup")}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="patientName" className="field-label">
            Nom du patient (démo){" "}
            <span className="font-normal text-stone-500">(requis)</span>
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

        <div className="space-y-1.5">
          <label htmlFor="hospital" className="field-label">
            Hôpital / établissement{" "}
            <span className="font-normal text-stone-500">(requis)</span>
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
          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            Envoyer l’alerte (démo)
          </button>
          {!canSubmit ? (
            <p className="field-hint">
              Renseignez le groupe, un nom démo et un hôpital fictif pour activer
              l’envoi simulé.
            </p>
          ) : null}
          {submitted ? (
            <p className="text-xs font-medium text-emerald-800">
              Dernière action : alerte locale uniquement. Formulaire vidé, rien n’est
              stocké.
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
