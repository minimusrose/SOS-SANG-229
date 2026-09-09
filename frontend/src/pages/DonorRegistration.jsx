import { useState } from "react";
import BloodGroupSelect from "../components/BloodGroupSelect.jsx";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
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
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = Boolean(form.bloodGroup && form.phone.trim() && form.city);

  function update(field) {
    return (event) => {
      const value =
        event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setForm((current) => ({ ...current, [field]: value }));
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
    onToast(
      "Profil donneur simulé. Rien n’a été envoyé ni enregistré — maquette locale uniquement.",
    );
    setForm(INITIAL);
  }

  return (
    <PageFrame>
      <div className="space-y-8">
        <PageHeader kicker="Volontaire" title="Inscription" highlight="donneur">
          Créez un profil fictif pour tester le parcours. Téléphone et ville
          restent locaux à cet écran.
        </PageHeader>

        <DemoBanner>
          Ne saisissez pas de vrai numéro, de vrai nom ni une adresse réelle.
          Exemple : Donneur Demo, 00 00 00 00, Zone Demo.
        </DemoBanner>

        <form className="card space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div className="space-y-2">
            <label htmlFor="displayName" className="field-label">
              Nom d’affichage
            </label>
            <input
              id="displayName"
              className="field-input"
              value={form.displayName}
              onChange={update("displayName")}
              placeholder="Donneur Demo"
              autoComplete="off"
            />
            <p className="field-hint">Libellé fictif visible dans la maquette uniquement.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="bloodGroup" className="field-label">
              Groupe sanguin <span className="font-normal text-accent">(requis)</span>
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
              Téléphone <span className="font-normal text-accent">(requis, fictif)</span>
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              className="field-input"
              value={form.phone}
              onChange={update("phone")}
              placeholder="00 00 00 00"
              autoComplete="off"
              required
            />
            <p className="field-hint">
              Placeholder volontairement neutre. N’entrez pas un numéro béninois réel.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="city" className="field-label">
              Ville / zone <span className="font-normal text-accent">(requis)</span>
            </label>
            <select
              id="city"
              className="field-input"
              value={form.city}
              onChange={update("city")}
              required
            >
              <option value="">Choisir une zone démo</option>
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
                J’accepte, dans une future version, de partager une position
                approximative pour le matching.{" "}
                <strong className="font-semibold">Aucun GPS réel n’est demandé ici.</strong>
              </span>
            </label>
            <p className="mt-2 text-sm text-accent">
              {form.gpsConsent
                ? "Consentement noté pour la maquette. La géolocalisation du navigateur reste désactivée."
                : "Option désactivée : aucune coordonnée ne sera lue."}
            </p>
          </fieldset>

          <div className="space-y-2">
            <button type="submit" className="btn-primary w-full" disabled={!canSubmit}>
              Enregistrer le profil (démo)
            </button>
            {!canSubmit ? (
              <p className="field-hint">
                Le bouton s’active lorsque le groupe, le téléphone fictif et la
                ville sont renseignés.
              </p>
            ) : null}
            {submitted ? (
              <p className="text-sm font-semibold text-success">
                Dernière action : succès local, formulaire réinitialisé. Aucune
                donnée conservée.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </PageFrame>
  );
}
