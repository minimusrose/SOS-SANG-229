import { Link } from "react-router-dom";

const actions = [
  {
    to: "/donneur/inscription",
    title: "Devenir donneur",
    body: "Enregistrez un profil fictif : groupe sanguin, téléphone démo, ville et consentement GPS.",
    cta: "Ouvrir l’inscription",
  },
  {
    to: "/alerte",
    title: "Lancer une alerte",
    body: "Simulez une urgence transfusionnelle pour un patient et un hôpital de démonstration.",
    cta: "Ouvrir l’alerte",
    accent: true,
  },
  {
    to: "/suivi",
    title: "Suivre les demandes",
    body: "Consultez une liste fictive (REQ-DEMO-*) avec statuts ouverte, en matching ou pourvue.",
    cta: "Voir le suivi",
  },
];

const steps = [
  {
    n: "1",
    title: "Signaler le besoin",
    body: "Un établissement indique le groupe demandé et le lieu — ici, uniquement des libellés démo.",
  },
  {
    n: "2",
    title: "Prévenir les donneurs",
    body: "Le matching et le SMS arriveront plus tard. Cette maquette montre le parcours, pas l’envoi.",
  },
  {
    n: "3",
    title: "Suivre jusqu’au don",
    body: "Chaque demande a un statut visible, pour rassurer l’équipe soignante et le proche.",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-brand-700 text-white shadow-card">
        <div className="space-y-4 px-5 py-7 sm:px-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-100">
            Bénin · urgence transfusionnelle
          </p>
          <h1 className="max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Trouver un donneur compatible, plus vite.
          </h1>
          <p className="max-w-xl text-sm leading-6 text-brand-50 sm:text-base">
            SOS Sang 229 relie un besoin de sang à des volontaires à proximité.
            Cette version est une maquette statique : rien n’est envoyé, rien n’est
            enregistré.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link
              to="/alerte"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-base font-semibold text-brand-700 shadow-sm hover:bg-brand-50"
            >
              Signaler une urgence
            </Link>
            <Link
              to="/donneur/inscription"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-4 py-3 text-base font-semibold text-white hover:bg-white/10"
            >
              Je veux donner
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900">Parcours de la maquette</h2>
        <div className="grid gap-3">
          {actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`card block transition hover:border-brand-200 hover:shadow-md ${
                action.accent ? "border-brand-200 bg-brand-50" : ""
              }`}
            >
              <h3 className="text-base font-bold text-stone-900">{action.title}</h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">{action.body}</p>
              <p className="mt-3 text-sm font-semibold text-brand-700">{action.cta} →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900">Comment ça marchera</h2>
        <ol className="grid gap-3">
          {steps.map((step) => (
            <li key={step.n} className="card flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {step.n}
              </span>
              <div>
                <h3 className="font-semibold text-stone-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-stone-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm leading-6 text-stone-600">
        <p className="font-semibold text-stone-800">Données et confiance</p>
        <p className="mt-1">
          Groupe sanguin, téléphone et localisation sont des données sensibles.
          Ici, utilisez uniquement des valeurs fictives (Donneur Demo, 00 00 00 00,
          Zone Demo). Aucun backend, SMS ou géolocalisation réelle n’est branché.
        </p>
      </section>
    </div>
  );
}
