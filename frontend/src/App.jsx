import { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import BrandMark from "./components/BrandMark.jsx";
import Toast from "./components/Toast.jsx";
import useToast from "./hooks/useToast.js";
import { useAuth } from "./auth/AuthContext.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import Home from "./pages/Home.jsx";
import DonorRegistration from "./pages/DonorRegistration.jsx";
import EmergencyAlert from "./pages/EmergencyAlert.jsx";
import Login from "./pages/Login.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import CompatibleRequests from "./pages/CompatibleRequests.jsx";
import MyInfo from "./pages/MyInfo.jsx";
import NotFound from "./pages/NotFound.jsx";

const COLS = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

function desktopNavClass({ isActive }) {
  return [
    "flex h-full items-center whitespace-nowrap border-b-[3px] text-sm font-semibold uppercase tracking-wide transition-colors duration-micro ease-soft-out",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    isActive
      ? "border-primary text-white"
      : "border-transparent text-white/75 hover:border-white/30 hover:text-white",
  ].join(" ");
}

function mobileNavClass({ isActive }) {
  return [
    "flex min-h-[44px] items-center border-l-[3px] px-3 text-base font-semibold transition-colors duration-micro ease-soft-out",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    isActive
      ? "border-primary text-white"
      : "border-transparent text-white/80 hover:text-white",
  ].join(" ");
}

export default function App() {
  const toast = useToast();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dismissToast = toast.dismiss;
  useEffect(() => {
    dismissToast();
    setMenuOpen(false);
    setAcctOpen(false);
  }, [location.pathname, dismissToast]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // Feeds the mobile bottom tab bar only — kept as-is (out of scope for the navbar redesign).
  const primaryLinks = useMemo(() => {
    if (isAuthenticated) {
      return [
        { to: "/", label: "Accueil", short: "Accueil", end: true },
        { to: "/mes-demandes", label: "Mes demandes", short: "Demandes" },
        { to: "/demandes-en-cours", label: "Demandes en cours", short: "Compatibles" },
      ];
    }
    return [
      { to: "/", label: "Accueil", short: "Accueil", end: true },
      { to: "/donneur/inscription", label: "Devenir donneur", short: "Donneur" },
      { to: "/alerte", label: "Signaler une urgence", short: "Alerte" },
      { to: "/connexion", label: "Connexion", short: "Connexion" },
    ];
  }, [isAuthenticated]);

  // Top navbar entries (excludes the trailing button, rendered separately).
  const headerLinks = useMemo(() => {
    if (isAuthenticated) {
      return [
        { to: "/", label: "Accueil", end: true },
        { to: "/mes-demandes", label: "Mes demandes" },
        { to: "/demandes-en-cours", label: "Demandes en cours" },
        { to: "/alerte", label: "Signaler une urgence" },
      ];
    }
    return [
      { to: "/", label: "Accueil", end: true },
      { to: "/donneur/inscription", label: "Devenir donneur" },
      { to: "/alerte", label: "Signaler une urgence" },
    ];
  }, [isAuthenticated]);

  const accountActions =
    user && user.has_donor_profile
      ? [{ to: "/mes-informations", label: "Mes informations" }]
      : [{ to: "/donneur/inscription", label: "Devenir donneur" }];

  const bottomItems = isAuthenticated ? primaryLinks.length + 1 : primaryLinks.length;

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>

      <header
        className={`sticky top-0 z-30 bg-secondary transition-shadow duration-micro ease-soft-out ${
          scrolled ? "shadow-soft" : ""
        }`}
      >
        <div
          className={`mx-auto flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:gap-14 lg:px-8 ${
            isAuthenticated ? "max-w-[1240px]" : "max-w-5xl"
          }`}
        >
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5" end>
            <BrandMark />
            <span className="min-w-0">
              <span className="block truncate text-base font-extrabold tracking-tight text-white">
                SOS Sang 229
              </span>
              <span className="block truncate text-xs font-medium text-white/70">
                Don de sang d’urgence · Bénin
              </span>
            </span>
          </NavLink>

          {/* Desktop navigation. Connected users get one extra link (Signaler une
              urgence) plus a wider "Mon espace" button, so their layout needs both a
              later breakpoint and a wider container to avoid overlapping the links
              (see step 1 bis follow-up) — guest layout is untouched at 1024px/1024px. */}
          <nav
            className={`hidden h-full items-center ${
              isAuthenticated ? "min-[1180px]:flex" : "lg:flex"
            }`}
            aria-label="Navigation principale"
          >
            <ul className="flex h-full items-center">
              {headerLinks.map((link, index) => (
                <li key={link.to} className="flex h-full items-center">
                  {index > 0 ? (
                    <span aria-hidden="true" className="mx-4 h-4 w-px bg-white/25" />
                  ) : null}
                  <NavLink to={link.to} end={link.end} className={desktopNavClass}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <span aria-hidden="true" className="mx-6 h-4 w-px bg-white/25" />

            {isAuthenticated ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/10 px-5 text-sm font-semibold text-white transition duration-micro ease-soft-out hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-expanded={acctOpen}
                  onClick={() => setAcctOpen((open) => !open)}
                >
                  Mon espace
                  <span aria-hidden="true" className="text-xs">
                    {acctOpen ? "▲" : "▼"}
                  </span>
                </button>
                {acctOpen ? (
                  <>
                    <button
                      type="button"
                      aria-hidden="true"
                      tabIndex={-1}
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setAcctOpen(false)}
                    />
                    <ul className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-light bg-white py-1 shadow-card">
                      {accountActions.map((action) => (
                        <li key={action.to}>
                          <NavLink
                            to={action.to}
                            className="block px-4 py-2 text-sm font-medium text-secondary hover:bg-light"
                          >
                            {action.label}
                          </NavLink>
                        </li>
                      ))}
                      <li>
                        <button
                          type="button"
                          className="block w-full px-4 py-2 text-left text-sm font-medium text-primary-strong hover:bg-light"
                          onClick={() => {
                            setAcctOpen(false);
                            logout();
                          }}
                        >
                          Se déconnecter
                        </button>
                      </li>
                    </ul>
                  </>
                ) : null}
              </div>
            ) : (
              <NavLink
                to="/connexion"
                className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-lg bg-white/10 px-5 text-sm font-semibold text-white transition duration-micro ease-soft-out hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Connexion
              </NavLink>
            )}
          </nav>

          {/* Mobile / tablet trigger — same breakpoint as the desktop nav above */}
          <button
            type="button"
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border-2 border-white/30 px-3 text-sm font-semibold text-white ${
              isAuthenticated ? "min-[1180px]:hidden" : "lg:hidden"
            }`}
            aria-expanded={menuOpen}
            aria-controls="nav-principale-mobile"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">
              {menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            </span>
            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {menuOpen ? (
          <nav
            id="nav-principale-mobile"
            aria-label="Navigation principale"
            className={`border-t border-white/10 bg-secondary px-4 py-4 ${
              isAuthenticated ? "min-[1180px]:hidden" : "lg:hidden"
            }`}
          >
            <ul className="space-y-1">
              {headerLinks.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end} className={mobileNavClass}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              {isAuthenticated ? (
                <>
                  {accountActions.map((action) => (
                    <NavLink
                      key={action.to}
                      to={action.to}
                      className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-white/10 px-4 text-base font-semibold text-white transition duration-micro ease-soft-out hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {action.label}
                    </NavLink>
                  ))}
                  <button
                    type="button"
                    className="flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 text-base font-semibold text-white/80 hover:text-white"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <NavLink
                  to="/connexion"
                  className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-white/10 px-4 text-base font-semibold text-white transition duration-micro ease-soft-out hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Connexion
                </NavLink>
              )}
            </div>
          </nav>
        ) : null}
      </header>

      <main id="contenu" className="flex-1 pb-20 sm:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<Login onToast={toast.show} />} />
          <Route
            path="/donneur/inscription"
            element={<DonorRegistration onToast={toast.show} />}
          />
          <Route path="/alerte" element={<EmergencyAlert onToast={toast.show} />} />
          <Route
            path="/mes-demandes"
            element={
              <RequireAuth>
                <MyRequests onToast={toast.show} />
              </RequireAuth>
            }
          />
          <Route
            path="/demandes-en-cours"
            element={
              <RequireAuth>
                <CompatibleRequests onToast={toast.show} />
              </RequireAuth>
            }
          />
          <Route
            path="/mes-informations"
            element={
              <RequireAuth>
                <MyInfo onToast={toast.show} />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="hidden border-t border-light bg-secondary sm:block">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-semibold text-white">SOS Sang 229</p>
          <p>Don de sang d’urgence · Bénin</p>
        </div>
      </footer>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-light bg-white/90 backdrop-blur-md sm:hidden"
      >
        <ul className={`mx-auto grid max-w-5xl ${COLS[bottomItems] || "grid-cols-4"}`}>
          {primaryLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex flex-col items-center px-1 py-2.5 text-[11px] font-bold ${
                    isActive ? "text-primary-strong" : "text-muted"
                  }`
                }
              >
                {link.short}
              </NavLink>
            </li>
          ))}
          {isAuthenticated ? (
            <li>
              <button
                type="button"
                className="flex w-full flex-col items-center px-1 py-2.5 text-[11px] font-bold text-muted"
                onClick={() => setMenuOpen((open) => !open)}
              >
                Compte
              </button>
            </li>
          ) : null}
        </ul>
      </nav>

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
