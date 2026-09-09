const DEMO_REQUESTS = [
  { id: "REQ-DEMO-001", status: "ouverte", group: "O+", zone: "Zone Demo A" },
  { id: "REQ-DEMO-002", status: "en matching", group: "A+", zone: "Zone Demo B" },
];

export default function LiveTracking() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Suivi des demandes</h1>
      <p className="text-sm text-neutral-600">
        Liste fictive. Aucune donnée réelle de donneur ou de patient.
      </p>
      <ul className="divide-y divide-neutral-200 border border-neutral-200 bg-white">
        {DEMO_REQUESTS.map((item) => (
          <li key={item.id} className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:justify-between">
            <span className="font-mono text-sm">{item.id}</span>
            <span className="text-sm text-neutral-700">
              {item.group} · {item.zone} · {item.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
