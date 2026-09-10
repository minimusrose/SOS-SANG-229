import { useState } from "react";
import { ApiError, api } from "../api/client.js";
import BloodGroupSelect from "../components/BloodGroupSelect.jsx";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SubmitButton from "../components/SubmitButton.jsx";
import { DEMO_CITIES } from "../data/demo.js";

const INITIAL = {
  displayName: "",
  bloodGroup: "",
  phone: "",
  city: "",
  gpsConsent: false,
};

export default function DonorRegistration({ onToast }) {
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [justOk, setJustOk] = useState(false);
  const [result, setResult] = useState(null);

  const canSubmit = Boolean(
    form.displayName.trim() && form.bloodGroup && form.phone.trim() && form.city,
  );

  function update(field) {
    return (event) => {
      const value =
        event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setForm((current) => ({ ...current, [field]: value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setJustOk(false);
    setSubmitting(true);
    try {
      const created = await api.createDonor({
        display_name: form.displayName.trim(),
        blood_group: form.bloodGroup,
        phone: form.phone.trim(),
        city: form.city,
        is_available: true,
      });
      setResult(created);
      setForm(INITIAL);
      setJustOk(true);
      onToast(
        `Profil enregistré pour ${created.display_name}. Vous serez prévenu en cas d’urgence compatible.`,
      );
    } catch (error) {
      const conflict =
        error instanceof ApiError && error.status === 409
          ? "Ce numéro est déjà associé à un profil."
          : error.message;
      onToast(conflict);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageFrame>
      <div className="space-y-8">
        <PageHeader kicker="Volontaire" title="Inscription" highlight="donneur">
          Enregistrez votre groupe sanguin et votre zone. Vous serez prévenu
          uniquement lorsqu’un don compatible est nécessaire près de chez vous.
        </PageHeader>

        <DemoBanner>
          Votre numéro sert uniquement à vous joindre en cas d’urgence. Il n’est
          jamais affiché publiquement ni transmis à d’autres donneurs.
        </DemoBanner>

        <form className="card space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div className="space-y-2">
            <label htmlFor="displayName" className="field-label">
              Nom d’affichage{" "}
              <span className="font-normal text-primary-strong">(requis)</span>
            </label>
            <input
              id="displayName"
              className="field-input"
              value={form.displayName}
              onChange={update("displayName")}
              placeholder="Ex. Awa K."
              autoComplete="off"
              required
            />
            <p className="field-hint">
              Le nom présenté à l’établissement lorsqu’une alerte vous concerne.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="bloodGroup" className="field-label">
              Groupe sanguin <span className="font-normal text-primary-strong">(requis)</span>
            </label>
            <BloodGroupSelect
              id="bloodGroup"
              value={form.bloodGroup}
              onChange={update("bloodGroup")}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="field-label">
              Téléphone <span className="font-normal text-primary-strong">(requis)</span>
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              className="field-input"
              value={form.phone}
              onChange={update("phone")}
              placeholder="+229 XX XX XX XX XX"
              autoComplete="off"
              required
            />
            <p className="field-hint">
              Au format international. C’est par ce numéro que vous serez prévenu.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="city" className="field-label">
              Ville / zone <span className="font-normal text-primary-strong">(requis)</span>
            </label>
            <select
              id="city"
              className="field-input"
              value={form.city}
              onChange={update("city")}
              required
            >
              <option value="">Choisir votre zone</option>
              {DEMO_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="rounded-2xl bg-light px-5 py-4">
            <legend className="px-1 text-sm font-bold text-secondary">Localisation</legend>
            <label className="mt-2 flex items-start gap-3 text-sm leading-6 text-secondary">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-accent text-primary focus:ring-primary"
                checked={form.gpsConsent}
                onChange={update("gpsConsent")}
              />
              <span>
                J’autorise l’utilisation d’une position approximative pour
                accélérer le rapprochement lors d’une urgence.
              </span>
            </label>
            <p className="mt-2 text-sm text-muted">
              {form.gpsConsent
                ? "La position ne sert qu’au rapprochement géographique et n’est jamais partagée."
                : "Sans position, le rapprochement se fait à l’échelle de votre ville."}
            </p>
          </fieldset>

          <div className="space-y-2">
            <SubmitButton
              pending={submitting}
              success={justOk}
              disabled={!canSubmit}
              className="w-full"
            >
              Enregistrer le profil
            </SubmitButton>
            {!canSubmit ? (
              <p className="field-hint">
                Renseignez votre nom, votre groupe sanguin, votre téléphone et
                votre zone pour continuer.
              </p>
            ) : null}
            {result ? (
              <p className="text-sm font-semibold text-success">
                Profil enregistré pour {result.display_name} ({result.city}).
                Vous serez prévenu en cas de besoin compatible.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </PageFrame>
  );
}
