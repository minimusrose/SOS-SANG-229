import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import BloodGroupSelect from "../components/BloodGroupSelect.jsx";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Skeleton from "../components/Skeleton.jsx";
import SubmitButton from "../components/SubmitButton.jsx";
import { DEMO_CITIES } from "../data/demo.js";

export default function MyInfo({ onToast }) {
  const { refreshMe } = useAuth();
  const [state, setState] = useState("loading"); // loading | ready | no-donor | error
  const [phone, setPhone] = useState("");
  const [form, setForm] = useState({ displayName: "", bloodGroup: "", city: "" });
  const [submitting, setSubmitting] = useState(false);
  const [justOk, setJustOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getDonorProfile()
      .then((p) => {
        if (cancelled) return;
        setPhone(p.phone);
        setForm({
          displayName: p.display_name,
          bloodGroup: p.blood_group,
          city: p.city,
        });
        setState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setState(
          error instanceof ApiError && error.status === 404 ? "no-donor" : "error",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = Boolean(
    form.displayName.trim() && form.bloodGroup && form.city,
  );

  function update(field) {
    return (event) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setJustOk(false);
    setSubmitting(true);
    try {
      const updated = await api.updateDonorProfile({
        display_name: form.displayName.trim(),
        blood_group: form.bloodGroup,
        city: form.city,
      });
      setForm({
        displayName: updated.display_name,
        bloodGroup: updated.blood_group,
        city: updated.city,
      });
      await refreshMe();
      setJustOk(true);
      onToast("Vos informations ont été mises à jour.");
    } catch (error) {
      onToast(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageFrame>
      <div className="space-y-8">
        <PageHeader kicker="Compte" title="Mes" highlight="informations">
          Consultez et modifiez votre nom, votre groupe sanguin et votre zone.
        </PageHeader>

        {state === "loading" ? (
          <div className="card space-y-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : state === "error" ? (
          <div className="card text-center">
            <p className="text-lg font-extrabold text-secondary">
              Service indisponible
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Réessayez dans un instant.
            </p>
          </div>
        ) : state === "no-donor" ? (
          <div className="card text-center">
            <p className="text-lg font-extrabold text-secondary">
              Vous n’êtes pas encore donneur
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Enregistrez votre groupe sanguin et votre zone pour gérer vos
              informations ici.
            </p>
            <Link to="/donneur/inscription" className="btn-primary mt-5">
              Devenir donneur
            </Link>
          </div>
        ) : (
          <form
            className="card space-y-6"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <div className="space-y-2">
              <label className="field-label" htmlFor="phone-ro">
                Téléphone
              </label>
              <input
                id="phone-ro"
                className="field-input"
                value={phone}
                disabled
                readOnly
              />
              <p className="field-hint">
                Sert d’identifiant de connexion — non modifiable ici.
              </p>
            </div>

            <div className="space-y-2">
              <label className="field-label" htmlFor="displayName">
                Nom d’affichage{" "}
                <span className="font-normal text-primary-strong">(requis)</span>
              </label>
              <input
                id="displayName"
                className="field-input"
                value={form.displayName}
                onChange={update("displayName")}
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="field-label" htmlFor="bloodGroup">
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
              <label className="field-label" htmlFor="city">
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
                {form.city && !DEMO_CITIES.includes(form.city) ? (
                  <option value={form.city}>{form.city}</option>
                ) : null}
              </select>
            </div>

            <SubmitButton
              pending={submitting}
              success={justOk}
              disabled={!canSubmit}
              className="w-full"
            >
              Enregistrer les modifications
            </SubmitButton>
          </form>
        )}
      </div>
    </PageFrame>
  );
}
