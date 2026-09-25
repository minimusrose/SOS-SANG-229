import { useEffect, useRef } from "react";

// Accessible modal pattern reused from CompatibilityModal.jsx (focus trap,
// Escape, backdrop). Deliberately has a single exit: Escape and the backdrop
// both act like the "Annuler" button — there is no way to proceed and create
// the alert from here.
const FOCUSABLE_SELECTOR =
  'button, [href], select, input, textarea, [tabindex]:not([tabindex="-1"])';

export default function DuplicatePatientAlertModal({ open, message, onCancel }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCancel();
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
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-patient-title"
        className="w-full max-w-[440px] rounded-3xl bg-white p-6 shadow-card sm:p-7"
      >
        <h2
          id="duplicate-patient-title"
          className="text-xl font-extrabold text-secondary"
        >
          Alerte déjà existante
        </h2>
        <p className="mt-3 text-sm leading-6 text-secondary">{message}</p>
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="btn-primary mt-6 w-full"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
