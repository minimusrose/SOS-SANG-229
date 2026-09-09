export default function Toast({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-lg rounded-2xl bg-secondary px-4 py-3 text-sm text-white shadow-card sm:bottom-8"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 leading-5">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-white/70 hover:text-white"
          aria-label="Fermer la notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
