// Inline format-error message shown under a field once it has been touched
// and is invalid. Reuses the same red already used for "(requis)" on these
// forms (RequiredMark's text-primary-strong) — no new color introduced.
export default function FieldError({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-1.5 text-sm font-semibold text-primary-strong"
    >
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-4 w-4 shrink-0"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7.5v5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16.25" r="1.1" fill="currentColor" />
      </svg>
      {message}
    </p>
  );
}
