import { Link } from "react-router-dom";
import BrandMark from "./BrandMark.jsx";

// TODO(social-client): URLs réelles à fournir par le client. Un réseau ne
// s'affiche que si son URL est renseignée ici — aucune URL inventée.
const SOCIAL_LINKS = {
  facebook: "",
  instagram: "",
  x: "",
};

const NAV_LINKS = [
  { to: "/", label: "Accueil" },
  { to: "/donneur/inscription", label: "Devenir donneur" },
  { to: "/alerte", label: "Signaler une urgence" },
];

const LEGAL_LINKS = [
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/cgu", label: "CGU" },
  { to: "/politique-confidentialite", label: "Politique de confidentialité" },
];

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5H16l.4-3h-2.9V8.5c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.06 4.3 15.1 4.2 14 4.2c-2.3 0-3.9 1.4-3.9 4v2.3H7.6v3h2.5V21h3.4Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const SOCIAL_META = {
  facebook: { Icon: FacebookIcon, label: "Facebook" },
  instagram: { Icon: InstagramIcon, label: "Instagram" },
  x: { Icon: XIcon, label: "X" },
};

const linkClass =
  "text-[#A9AEC7] transition-colors duration-micro ease-soft-out hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm";

export default function Footer() {
  const activeSocials = Object.entries(SOCIAL_LINKS).filter(([, url]) => url);

  return (
    // pb-20 on mobile only: the fixed bottom tab bar (sm:hidden, in App.jsx)
    // overlays whatever sits at the very bottom of the page — this footer,
    // now that it's shown on mobile too — so it needs the same clearance
    // <main> already reserves, or the last row of links would be covered.
    <footer className="bg-secondary pb-20 sm:pb-0">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span>
                <span className="block text-base font-extrabold tracking-tight text-white">
                  SOS Sang 229
                </span>
                <span className="block text-xs font-medium text-white/70">
                  Don de sang d’urgence · Bénin
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#A9AEC7]">
              SOS Sang 229 prévient les donneurs compatibles de la ville de
              l’établissement et vous aide à suivre la demande jusqu’au don.
            </p>
            {activeSocials.length ? (
              <ul className="mt-5 flex items-center gap-3">
                {activeSocials.map(([key, url]) => {
                  const { Icon, label } = SOCIAL_META[key];
                  return (
                    <li key={key}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`SOS Sang 229 sur ${label}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition duration-micro ease-soft-out hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <Icon />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">Navigation</h2>
            <ul className="mt-4 space-y-4">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Informations légales
            </h2>
            <ul className="mt-4 space-y-4">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
