export default function DemoBanner({ children }) {
  return (
    <aside className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
      <p className="font-semibold">Maquette de démonstration</p>
      <p className="mt-1">{children}</p>
    </aside>
  );
}
