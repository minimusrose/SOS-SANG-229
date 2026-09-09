export default function EmergencyAlert() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Alerte urgence</h1>
      <p className="text-sm text-neutral-600">
        Écran placeholder. Aucune alerte n’est envoyée. Pas de noms d’établissements
        ou de patients réels.
      </p>
      <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
        <label className="block space-y-1">
          <span className="text-sm">Groupe demandé (exemple)</span>
          <select className="w-full border border-neutral-300 bg-white px-3 py-2" defaultValue="">
            <option value="" disabled>
              Choisir
            </option>
            <option>O+</option>
            <option>O-</option>
            <option>A+</option>
            <option>B+</option>
            <option>AB+</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm">Zone (libellé fictif)</span>
          <input
            className="w-full border border-neutral-300 bg-white px-3 py-2"
            placeholder="Quartier Demo — Cotonou"
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          className="border border-neutral-400 bg-white px-3 py-2 text-sm"
          disabled
        >
          Envoi d’alerte — à implémenter
        </button>
      </form>
    </section>
  );
}
