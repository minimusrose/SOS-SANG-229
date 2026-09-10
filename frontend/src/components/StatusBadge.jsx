import { STATUS_META } from "../lib/status.js";

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    className: "bg-light text-muted",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
