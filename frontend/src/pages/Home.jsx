import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import BeninMap from "../components/BeninMap.jsx";
import { Reveal, RevealGroup } from "../components/Reveal.jsx";
import useCountUp from "../hooks/useCountUp.js";

const steps = [
  {
    n: "1",
    title: "Signaler le besoin",
    body: "Un proche ou l’équipe soignante indique le groupe recherché et l’établissement. En moins d’une minute.",
  },
  {
    n: "2",
    title: "Alerter les donneurs proches",
    body: "Les donneurs compatibles de la même ville reçoivent l’alerte et répondent d’un geste.",
  },
  {
    n: "3",
    title: "Suivre jusqu’au don",
    body: "L’avancement est visible en temps réel : ouverte, en cours, pourvue. Chacun sait où en est la demande.",
  },
];

function Stat({ target, label }) {
  const value = useCountUp(target);
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-xl font-extrabold text-secondary">{value}</span>
      <span className="text-xs font-medium text-muted">{label}</span>
    </span>
  );
}

function NetworkStrip() {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-light bg-white/70 px-5 py-3.5 shadow-soft">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary-strong">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"
            data-decorative
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Réseau actif
      </span>
      <Stat target={7} label="établissements reconnus" />
      <Stat target={7} label="villes desservies" />
      <span className="flex items-baseline gap-1.5">
        <span className="text-xl font-extrabold text-secondary">&lt; 15&nbsp;min</span>
        <span className="text-xs font-medium text-muted">réponse visée</span>
      </span>
    </div>
  );
}

function ShieldCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M12 3.2 5 6v5.6c0 4.3 2.9 7.4 7 9.2 4.1-1.8 7-4.9 7-9.2V6l-7-2.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m8.8 12 2.3 2.3 4.1-4.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoDirectLink() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18.5" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8 12h8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeDasharray="1 3"
      />
      <path
        d="m9.5 8.5 5 7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

const trust = [
  {
    icon: <ShieldCheck />,
    title: "Établissements reconnus par l’État",
    body: "Une alerte ne peut cibler qu’un hôpital public officiellement reconnu — pour que le don arrive au bon endroit.",
  },
  {
    icon: <NoDirectLink />,
    title: "Pas de contact direct entre donneur et receveur",
    body: "Les numéros ne sont jamais échangés. La mise en relation passe entièrement par la plateforme.",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.05] via-white to-light">
        <div
          className="pointer-events-none absolute right-[-10%] top-[-20%] h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
          data-decorative
        />
        <RevealGroup className="relative mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-strong">
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"
                  data-decorative
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Alerte transfusionnelle · Bénin
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-secondary sm:text-5xl">
              Un donneur de sang compatible,{" "}
              <span className="text-primary">près de l’hôpital</span>, en quelques
              minutes.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              Quand chaque minute compte, SOS Sang 229 prévient les donneurs
              compatibles de la ville de l’établissement et suit la demande
              jusqu’au don.
            </p>

            {isAuthenticated ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/mes-demandes" className="btn-primary w-full sm:w-auto">
                  Mes demandes
                </Link>
                <Link
                  to="/demandes-en-cours"
                  className="btn-secondary w-full sm:w-auto"
                >
                  Demandes en cours
                </Link>
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/alerte" className="btn-primary w-full sm:w-auto">
                  J’ai besoin de sang
                </Link>
                <Link
                  to="/donneur/inscription"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-success px-6 py-3 text-base font-semibold text-success transition duration-micro ease-soft-out hover:bg-success/5 sm:w-auto"
                >
                  Devenir donneur
                </Link>
              </div>
            )}

            <NetworkStrip />
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="card p-4 sm:p-6">
              <BeninMap className="mx-auto max-h-[26rem]" />
              <p className="mt-3 flex items-center justify-center gap-2 font-mono text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Cotonou · alerte en cours · 2 donneurs prévenus
              </p>
            </div>
          </div>
        </RevealGroup>
      </section>

      {/* Confiance */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <RevealGroup className="grid gap-4 sm:grid-cols-2">
          {trust.map((item) => (
            <div key={item.title} className="card flex gap-4">
              <span className="shrink-0 text-primary-strong">{item.icon}</span>
              <div>
                <h2 className="text-base font-bold text-secondary">
                  {item.title}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </RevealGroup>
      </section>

      {/* Comment ça marche */}
      <section className="bg-light/70">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-strong">
              Comment ça marche
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-secondary">
              Trois gestes, une <span className="text-primary">chaîne</span>{" "}
              claire
            </h2>
          </Reveal>
          <RevealGroup as="ol" className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="card">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
                  {step.n}
                </span>
                <h3 className="mt-4 text-lg font-bold text-secondary">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-primary-dark">
        <Reveal className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/80">
              Chaque poche compte
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              Lancez une alerte, ou rejoignez les donneurs.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/alerte"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-primary-strong shadow-soft transition duration-micro ease-soft-out hover:bg-light"
            >
              Signaler une urgence
            </Link>
            <Link
              to="/donneur/inscription"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/70 px-6 py-3 text-base font-semibold text-white transition duration-micro ease-soft-out hover:bg-white/10"
            >
              Devenir donneur
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
