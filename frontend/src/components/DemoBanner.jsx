export default function DemoBanner({ title = "Confidentialité", children }) {
  return (
    <aside className="rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-sm leading-6 text-secondary">
      <p className="font-bold text-primary-strong">{title}</p>
      <p className="mt-1 text-secondary/80">{children}</p>
    </aside>
  );
}
