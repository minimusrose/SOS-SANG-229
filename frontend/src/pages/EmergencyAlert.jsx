import { useState } from "react";
import BloodGroupSelect from "../components/BloodGroupSelect.jsx";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import UrgencyBadge from "../components/UrgencyBadge.jsx";
import { RECOGNIZED_HOSPITALS } from "../data/demo.js";

const INITIAL = {
  bloodGroup: "",
  patientName: "",
  hospital: "",
};

export default function EmergencyAlert({ onToast }) {
  const [form, setForm] = useState(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  const hospitalIsRecognized = RECOGNIZED_HOSPITALS.some(
    (item) => item.is_recognized && item.name === form.hospital,
  );
  const canSubmit = Boolean(
    form.bloodGroup && form.patientName.trim() && hospitalIsRecognized,
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
          Patient démo uniquement. L’établissement doit figurer sur la liste
          officielle de démonstration (structures reconnues). Exemple : Patient
          Demo, Hôpital Demo Reconnu — Cotonou Nord.
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
              Hôpital reconnu{" "}
              <span className="font-normal text-accent">
                (liste officielle, requis)
              </span>
            </label>
            <select
              id="hospital"
              className="field-input"
              value={form.hospital}
              onChange={update("hospital")}
              required
            >
              <option value="">Choisir un établissement reconnu</option>
              {RECOGNIZED_HOSPITALS.filter((item) => item.is_recognized).map(
                (hospital) => (
                  <option key={hospital.id} value={hospital.name}>
                    {hospital.name}
                  </option>
                ),
              )}
            </select>
            <p className="field-hint">
              Seules les structures reconnues par l’État peuvent être choisies —
              pour que le don arrive au bon endroit. La saisie libre d’un
              centre non listé n’est pas autorisée.
            </p>
          </div>

          <div className="space-y-2">
            <button type="submit" className="btn-primary w-full" disabled={!canSubmit}>
              Envoyer l’alerte (démo)
            </button>
            {!canSubmit ? (
              <p className="field-hint">
                Renseignez le groupe, un nom démo et un hôpital reconnu de la
                liste pour activer l’envoi simulé.
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
