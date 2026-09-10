export default function UrgencyBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-strong">
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"
          data-decorative
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      {children}
    </span>
  );
}
