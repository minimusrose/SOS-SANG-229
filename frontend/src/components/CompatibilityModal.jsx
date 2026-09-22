import { useEffect, useMemo, useRef, useState } from "react";
import { BLOOD_GROUPS } from "../data/demo.js";
import { explainIncompatibility, isCompatible } from "../lib/bloodCompatibility.js";

const FOCUSABLE_SELECTOR =
  'button, [href], select, input, textarea, [tabindex]:not([tabindex="-1"])';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CompatibilityModal({ open, onClose, returnFocusRef }) {
  const dialogRef = useRef(null);
  const donorRef = useRef(null);
  const [donor, setDonor] = useState("");
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    donorRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      const returnTo = returnFocusRef?.current || previouslyFocused;
      if (returnTo instanceof HTMLElement) returnTo.focus();
    };
  }, [open, onClose, returnFocusRef]);

  useEffect(() => {
    if (!open) {
      setDonor("");
      setRecipient("");
    }
  }, [open]);

  const result = useMemo(() => {
    if (!donor || !recipient) return null;
    const compatible = isCompatible(donor, recipient);
    return {
      compatible,
      reason: compatible ? null : explainIncompatibility(donor, recipient),
    };
  }, [donor, recipient]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compat-modal-title"
        className="max-h-[calc(100svh-3rem)] w-full max-w-[440px] overflow-y-auto rounded-3xl bg-white p-6 shadow-card sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="compat-modal-title" className="text-xl font-extrabold text-secondary">
              Testez la compatibilité
            </h2>
            <p className="mt-1 text-sm text-muted">
              Choisissez un groupe donneur et un groupe receveur.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-m-1.5 shrink-0 rounded-full p-1.5 text-muted transition duration-micro ease-soft-out hover:bg-light hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Groupe du donneur</span>
            <select
              ref={donorRef}
              className="field-input mt-1.5"
              value={donor}
              onChange={(event) => setDonor(event.target.value)}
            >
              <option value="">Choisir un groupe</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">Groupe du receveur</span>
            <select
              className="field-input mt-1.5"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
            >
              <option value="">Choisir un groupe</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div aria-live="polite" className="mt-5">
          {result ? (
            result.compatible ? (
              <div className="flex items-start gap-2.5 rounded-2xl bg-success/10 px-4 py-3.5 text-success">
                <CheckIcon />
                <p className="text-sm font-semibold leading-6">
                  Compatible : un donneur {donor} peut donner à un receveur{" "}
                  {recipient}.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-2xl bg-primary/10 px-4 py-3.5 text-primary-strong">
                <CrossIcon />
                <p className="text-sm font-semibold leading-6">
                  Non compatible : un donneur {donor} ne peut pas donner à un
                  receveur {recipient}. Incompatibilité liée {result.reason}.
                </p>
              </div>
            )
          ) : null}
        </div>

        <p className="mt-4 text-xs leading-5 text-muted">
          Information indicative concernant la transfusion de globules rouges.
          La décision transfusionnelle relève toujours de l’équipe médicale.
        </p>

        <button type="button" onClick={onClose} className="btn-secondary mt-6 w-full">
          Fermer
        </button>
      </div>
    </div>
  );
}
