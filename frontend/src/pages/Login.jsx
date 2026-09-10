import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SubmitButton from "../components/SubmitButton.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { PHONE_ERROR, isValidPhone } from "../lib/validation.js";

export default function Login({ onToast }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/mes-demandes";

  const [form, setForm] = useState({ phone: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = Boolean(form.phone.trim() && form.password);

  function update(field) {
    return (event) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    if (!isValidPhone(form.phone)) {
      onToast(PHONE_ERROR);
      return;
    }
    setSubmitting(true);
    try {
      await login({ phone: form.phone.trim(), password: form.password });
      navigate(from, { replace: true });
    } catch (error) {
      onToast(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageFrame>
      <div className="space-y-8">
        <PageHeader kicker="Compte" title="Se" highlight="connecter">
          Retrouvez vos demandes et les urgences pour lesquelles vous êtes
          compatible.
        </PageHeader>

        <form className="card space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div className="space-y-2">
            <label htmlFor="phone" className="field-label">
              Téléphone
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
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="field-label">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              className="field-input"
              value={form.password}
              onChange={update("password")}
              autoComplete="current-password"
              required
            />
          </div>

          <SubmitButton
            pending={submitting}
            disabled={!canSubmit}
            className="w-full"
          >
            Se connecter
          </SubmitButton>
        </form>

        <p className="text-sm text-muted">
          Pas encore de compte ? Créez-en un en{" "}
          <Link to="/donneur/inscription" className="font-semibold text-primary-strong">
            devenant donneur
          </Link>{" "}
          ou en{" "}
          <Link to="/alerte" className="font-semibold text-primary-strong">
            signalant une urgence
          </Link>
          .
        </p>
      </div>
    </PageFrame>
  );
}
