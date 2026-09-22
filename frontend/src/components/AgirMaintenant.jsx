import { Link } from "react-router-dom";
import { Reveal, RevealGroup } from "./Reveal.jsx";

// Mêmes routes que les entrées correspondantes de la navbar — aucune
// protection de route touchée : un visiteur non connecté qui clique sur
// "Suivre les demandes" suit la redirection déjà gérée par RequireAuth.
const ACTIONS = [
  {
    title: "Signaler une urgence",
    body: "Créez une demande pour un patient et un hôpital reconnu.",
    to: "/alerte",
  },
  {
    title: "Devenir donneur",
    body: "Inscrivez votre groupe, téléphone et ville pour rejoindre le réseau.",
    to: "/donneur/inscription",
  },
  {
    title: "Suivre les demandes",
    body: "Consultez les alertes : ouvertes, en matching ou pourvues.",
    to: "/demandes-en-cours",
  },
];

function ActionCard({ title, body, to }) {
  return (
    <Link
      to={to}
      aria-label={`Ouvrir : ${title}`}
      className="flex flex-col rounded-3xl bg-white p-7 shadow-soft transition duration-micro ease-soft-out hover:-translate-y-1 hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <h3 className="text-[22px] font-semibold leading-snug text-secondary">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-base leading-6 text-muted">{body}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 font-bold text-primary">
        Ouvrir
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

export default function AgirMaintenant() {
  return (
    <section id="agir-maintenant" className="scroll-mt-[72px] bg-light py-16 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-secondary">
            Agir <span className="text-primary">maintenant</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted">
            Trois parcours pour sauver des vies : signaler une urgence,
            rejoindre le réseau de donneurs, ou suivre une demande en cours.
          </p>
        </Reveal>

        <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map((action) => (
            <ActionCard key={action.to} {...action} />
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
