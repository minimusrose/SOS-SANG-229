export default function DonorRegistration() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Inscription donneur</h1>
      <p className="text-sm text-neutral-600">
        Formulaire placeholder. Ne pas saisir de vraies données personnelles.
      </p>
      <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
        <label className="block space-y-1">
          <span className="text-sm">Nom d’affichage (fictif)</span>
          <input
            className="w-full border border-neutral-300 bg-white px-3 py-2"
            placeholder="Donneur Demo"
            autoComplete="off"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm">Groupe sanguin (exemple)</span>
          <select className="w-full border border-neutral-300 bg-white px-3 py-2" defaultValue="">
            <option value="" disabled>
              Choisir
            </option>
            <option>O+</option>
            <option>O-</option>
            <option>A+</option>
            <option>A-</option>
            <option>B+</option>
            <option>B-</option>
            <option>AB+</option>
            <option>AB-</option>
          </select>
        </label>
        <p className="text-sm text-neutral-500">
          Téléphone et localisation : champs non exposés sur ce scaffold.
        </p>
        <button
          type="submit"
          className="border border-neutral-400 bg-white px-3 py-2 text-sm"
          disabled
        >
          Enregistrement — à implémenter
        </button>
      </form>
    </section>
  );
}
