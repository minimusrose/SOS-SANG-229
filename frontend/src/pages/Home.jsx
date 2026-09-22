import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import CompatibilityModal from "../components/CompatibilityModal.jsx";
import { Reveal, RevealGroup } from "../components/Reveal.jsx";

// Hero photo fournie par le client (portrait de donneuse à gauche +
// pictogrammes à droite). Le cadre rouge de la source (~56px/3556) a été
// retiré au dépôt du fichier ; la variante mobile est un recadrage dédié sur
// le portrait (0–45% de la largeur), pas un simple object-position sur
// l'image pleine largeur, pour garder une vraie résolution une fois zoomée.
const HERO_IMAGE = {
  desktop: {
    avif: "/images/hero/hero-desktop.avif",
    webp: "/images/hero/hero-desktop.webp",
    fallback: "/images/hero/hero-desktop.jpg",
    width: 2400,
    height: 1316,
  },
  mobile: {
    avif: "/images/hero/hero-mobile.avif",
    webp: "/images/hero/hero-mobile.webp",
    fallback: "/images/hero/hero-mobile.jpg",
    width: 1100,
    height: 1340,
  },
};

const steps = [
  {
    n: "1",
    title: "Signaler le besoin",
    body: "Un proche ou l’équipe soignante indique le groupe recherché et l’établissement.",
  },
  {
    n: "2",
    title: "Alerter les donneurs proches",
    body: "Les donneurs compatibles de la même ville reçoivent l’alerte. Dès que le don est fait, ils le confirment sur la plateforme.",
  },
  {
    n: "3",
    title: "Suivre jusqu’au don",
    body: "L’avancement est visible en temps réel : ouverte, en cours, pourvue. Chacun sait où en est la demande.",
  },
];

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
    body: "Une alerte ne peut cibler qu’un hôpital public officiellement reconnu — pour que le don arrive dans un endroit autorisé.",
  },
  {
    icon: <NoDirectLink />,
    title: "Pas de contact direct entre donneur et receveur",
    body: "Les numéros ne sont jamais échangés. La mise en relation passe entièrement par la plateforme.",
  },
];

// rowFrom: breakpoint at which the buttons go from stacked to side-by-side.
// The mobile hero band is full-width, so it can go side-by-side as soon as
// there's room (sm, 640px — "pleine largeur uniquement sous 640px"). The
// desktop hero's text column is only ~30% of the bar, so it stays stacked
// until there's genuinely enough room for two pill buttons side by side (xl).
function HeroCta({ isAuthenticated, rowFrom = "sm" }) {
  const direction = rowFrom === "xl" ? "flex-col xl:flex-row" : "flex-col sm:flex-row";
  const className = `mt-8 flex gap-3 ${direction}`;

  if (isAuthenticated) {
    return (
      <div className={className}>
        <Link to="/mes-demandes" className="btn-primary w-full sm:w-auto">
          Mes demandes
        </Link>
        <Link to="/demandes-en-cours" className="btn-secondary w-full sm:w-auto">
          Demandes en cours
        </Link>
      </div>
    );
  }
  return (
    <div className={className}>
      <Link to="/alerte" className="btn-primary w-full sm:w-auto">
        J’ai besoin de sang
      </Link>
      <Link
        to="/donneur/inscription"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-success bg-white/90 px-6 py-3 text-base font-semibold text-success transition duration-micro ease-soft-out hover:bg-white sm:w-auto"
      >
        Devenir donneur
      </Link>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [compatModalOpen, setCompatModalOpen] = useState(false);
  const compatTriggerRef = useRef(null);

  return (
    <div>
      {/* Hero — mobile (<768px): portrait crop only, text in a solid band below
          the photo (the 36–68% safe band the image reserves for text becomes
          too narrow to hold on a cropped mobile frame). */}
      <section className="relative isolate overflow-hidden bg-secondary md:hidden">
        <div className="relative h-[50svh] min-h-[320px] max-h-[480px] w-full overflow-hidden">
          <picture>
            <source srcSet={HERO_IMAGE.mobile.avif} type="image/avif" />
            <source srcSet={HERO_IMAGE.mobile.webp} type="image/webp" />
            <img
              src={HERO_IMAGE.mobile.fallback}
              alt=""
              aria-hidden="true"
              width={HERO_IMAGE.mobile.width}
              height={HERO_IMAGE.mobile.height}
              fetchpriority="high"
              loading="eager"
              className="h-full w-full object-cover object-center"
            />
          </picture>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-secondary to-transparent"
          />
        </div>
        <Reveal className="bg-gradient-to-b from-secondary to-secondary/95 px-4 py-10">
          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-white">
            Le bon donneur, au bon endroit, au bon moment.
          </h1>
          <p className="mt-4 text-base leading-7 text-white/85">
            Quand un établissement hospitalier ou un patient manque de sang,
            chaque minute compte. Inscrivez-vous et recevez une alerte
            uniquement lorsque votre groupe sanguin est recherché à proximité.
          </p>
          <HeroCta isAuthenticated={isAuthenticated} />
        </Reveal>
      </section>

      {/* Hero — desktop/tablet (≥768px): full-bleed photo, text confined to the
          36–68% safe band (pl-[38%] / pr-[32%] ⇒ a ~30%-wide column starting
          just right of center), never centered on the whole hero and never
          left-aligned to 0 — both would land on the portrait or the icons. */}
      <section className="relative isolate hidden overflow-hidden bg-secondary md:block">
        <div className="absolute inset-0">
          <picture>
            <source srcSet={HERO_IMAGE.desktop.avif} type="image/avif" />
            <source srcSet={HERO_IMAGE.desktop.webp} type="image/webp" />
            <img
              src={HERO_IMAGE.desktop.fallback}
              alt=""
              aria-hidden="true"
              width={HERO_IMAGE.desktop.width}
              height={HERO_IMAGE.desktop.height}
              fetchpriority="high"
              loading="eager"
              className="h-full w-full object-cover"
            />
          </picture>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-secondary/45 via-secondary/45 to-secondary/70"
          />
        </div>

        <RevealGroup
          className="relative flex min-h-[max(560px,calc(100svh-72px))] w-full items-center pl-[38%] pr-[32%] py-16"
        >
          <div>
            <h1 className="text-[2.5rem] font-extrabold leading-[1.15] tracking-tight text-white lg:text-[2.75rem]">
              Le bon donneur, au bon endroit, au bon moment.
            </h1>
            <p className="mt-5 text-base leading-7 text-white/85">
              Quand un établissement hospitalier ou un patient manque de sang,
              chaque minute compte. Inscrivez-vous et recevez une alerte
              uniquement lorsque votre groupe sanguin est recherché à
              proximité.
            </p>
            <HeroCta isAuthenticated={isAuthenticated} rowFrom="xl" />
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

      {/* Testez votre compatibilité — fond blanc : la section "Comment ça
          marche" juste au-dessus est déjà grise (bg-light/70) et le bandeau
          CTA juste en dessous est rouge, donc le blanc garde l'alternance
          claire/blanc/rouge plutôt que deux blocs gris consécutifs. */}
      <section id="compatibilite" className="scroll-mt-[72px] bg-white py-14">
        <Reveal className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-secondary sm:text-3xl">
            Un doute sur votre compatibilité avec le groupe sanguin d’un
            proche ?
          </h2>
          <button
            ref={compatTriggerRef}
            type="button"
            aria-haspopup="dialog"
            onClick={() => setCompatModalOpen(true)}
            className="btn-primary mt-6"
          >
            Testez ici
          </button>
        </Reveal>
      </section>

      <CompatibilityModal
        open={compatModalOpen}
        onClose={() => setCompatModalOpen(false)}
        returnFocusRef={compatTriggerRef}
      />

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
