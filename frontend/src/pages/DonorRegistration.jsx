import { useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { requestPosition } from "../lib/geolocation.js";
import { PHONE_ERROR, isValidPhone } from "../lib/validation.js";
import BloodGroupSelect from "../components/BloodGroupSelect.jsx";
import DemoBanner from "../components/DemoBanner.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SubmitButton from "../components/SubmitButton.jsx";
import { DEMO_CITIES } from "../data/demo.js";

const INITIAL = {
  displayName: "",
  phone: "",
  password: "",
  bloodGroup: "",
  city: "",
  gpsConsent: false,
};

const GEO_INITIAL = { status: "idle", coords: null, code: null };

export default function DonorRegistration({ onToast }) {
  const { user, register, refreshMe } = useAuth();
  const needsAccount = !user;

  const [form, setForm] = useState(INITIAL);
  const [geo, setGeo] = useState(GEO_INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const canSubmit = Boolean(
    form.bloodGroup &&
      form.city &&
      (!needsAccount ||
        (form.displayName.trim() &&
          form.phone.trim() &&
          form.password.length >= 8)),
  );

  function update(field) {
    return (event) => {
      const value =
        event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setForm((current) => ({ ...current, [field]: value }));
    };
  }

  async function handleGpsToggle(event) {
    const checked = event.target.checked;
    setForm((current) => ({ ...current, gpsConsent: checked }));
    if (!checked) {
      setGeo(GEO_INITIAL);
      return;
    }
    setGeo({ status: "loading", coords: null, code: null });
    try {
      const coords = await requestPosition();
      setGeo({ status: "granted", coords, code: null });
    } catch (error) {
      setGeo({ status: "error", coords: null, code: error.code || "unavailable" });
    }
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
          display_name: form.displayName.trim(),
        });
      }
      const created = await api.createDonor({
        blood_group: form.bloodGroup,
        city: form.city,
        is_available: true,
        ...(geo.status === "granted" && geo.coords
          ? { location: geo.coords }
          : {}),
      });
      await refreshMe();
      setResult(created);
      setForm(INITIAL);
      setGeo(GEO_INITIAL);
    } catch (error) {
      const conflict =
        error instanceof ApiError && error.status === 409
          ? "Ce numéro ou ce compte a déjà un profil donneur."
          : error.message;
      onToast(conflict);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <PageFrame>
        <div className="card space-y-5 border-primary/20 text-center">
          <span className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-success/15 text-success">
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
                  animation:
                    "draw-check 420ms cubic-bezier(.22,1,.36,1) 120ms forwards",
                }}
              />
            </svg>
          </span>
          <h1 className="text-2xl font-extrabold text-secondary">
            Inscription réussie
          </h1>
          <p className="text-sm leading-6 text-muted">
            Profil enregistré pour {result.display_name} ({result.city}). Vous
            serez prévenu dès qu’un don compatible sera nécessaire près de chez
            vous.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className="btn-secondary">
              Retour à l’accueil
            </Link>
            <Link to="/mes-demandes" className="btn-primary">
              Voir mes demandes
            </Link>
          </div>
        </div>
      </PageFrame>
    );
  }

  if (user?.has_donor_profile) {
    return (
      <PageFrame>
        <div className="space-y-6">
          <PageHeader kicker="Volontaire" title="Vous êtes" highlight="donneur">
            Votre profil est déjà enregistré.
          </PageHeader>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/" className="btn-secondary">
              Retour à l’accueil
            </Link>
            <Link to="/demandes-en-cours" className="btn-primary">
              Voir les demandes compatibles
            </Link>
          </div>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <div className="space-y-8">
        <PageHeader kicker="Volontaire" title="Devenir" highlight="donneur">
          Enregistrez votre groupe sanguin et votre zone. Vous serez prévenu
          uniquement lorsqu’un don compatible est nécessaire près de chez vous.
        </PageHeader>

        <DemoBanner>
          Votre numéro sert uniquement à vous joindre en cas d’urgence. Il n’est
          jamais affiché publiquement ni transmis à d’autres donneurs.
        </DemoBanner>

        <form className="card space-y-6" onSubmit={handleSubmit} autoComplete="off">
          {needsAccount ? (
            <>
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
                  Sert d’identifiant de connexion et pour vous prévenir.
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
            <label htmlFor="bloodGroup" className="field-label">
              Groupe sanguin{" "}
              <span className="font-normal text-primary-strong">(requis)</span>
            </label>
            <BloodGroupSelect
              id="bloodGroup"
              value={form.bloodGroup}
              onChange={update("bloodGroup")}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="city" className="field-label">
              Ville / zone{" "}
              <span className="font-normal text-primary-strong">(requis)</span>
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
            <legend className="px-1 text-sm font-bold text-secondary">
              Localisation
            </legend>
            <label className="mt-2 flex items-start gap-3 text-sm leading-6 text-secondary">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-accent text-primary focus:ring-primary"
                checked={form.gpsConsent}
                onChange={handleGpsToggle}
              />
              <span>
                J’autorise l’utilisation de ma position approximative pour
                accélérer le rapprochement lors d’une urgence.
              </span>
            </label>
            <p className="mt-2 text-sm text-muted">
              {geo.status === "loading"
                ? "Récupération de votre position…"
                : geo.status === "granted"
                  ? "Position enregistrée. Elle n’est jamais affichée ni partagée."
                  : geo.status === "error"
                    ? "Position indisponible — le rapprochement se fera à l’échelle de votre ville."
                    : "Sans position, le rapprochement se fait à l’échelle de votre ville."}
            </p>
          </fieldset>

          <div className="space-y-2">
            <SubmitButton
              pending={submitting}
              disabled={!canSubmit}
              className="w-full"
            >
              {needsAccount ? "Créer mon compte donneur" : "Enregistrer le profil"}
            </SubmitButton>
            {!canSubmit ? (
              <p className="field-hint">
                Renseignez les champs requis pour continuer.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </PageFrame>
  );
}
