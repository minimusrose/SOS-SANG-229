import { STATUS_META } from "../data/demo.js";

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    className: "bg-stone-100 text-stone-700 ring-stone-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
