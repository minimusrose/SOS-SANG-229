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

function navClass({ isActive }) {
  return isActive
    ? "font-bold text-primary-strong"
    : "font-medium text-secondary/80 hover:text-primary-strong";
}

const COLS = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

export default function App() {
  const toast = useToast();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);

  const dismissToast = toast.dismiss;
  useEffect(() => {
    dismissToast();
    setMenuOpen(false);
    setAcctOpen(false);
  }, [location.pathname, dismissToast]);

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

  const accountActions = [
    { to: "/alerte", label: "Signaler une urgence" },
    ...(user && user.has_donor_profile
      ? [{ to: "/mes-informations", label: "Mes informations" }]
      : [{ to: "/donneur/inscription", label: "Devenir donneur" }]),
  ];

  const bottomItems = isAuthenticated ? primaryLinks.length + 1 : primaryLinks.length;

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>

      <header className="sticky top-0 z-30 border-b border-light/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5" end>
            <BrandMark />
            <span className="min-w-0">
              <span className="block truncate text-base font-extrabold tracking-tight text-secondary">
                SOS Sang 229
              </span>
              <span className="block text-xs font-medium text-muted">
                Don de sang d’urgence · Bénin
              </span>
            </span>
          </NavLink>

          <button
            type="button"
            className="rounded-full border-2 border-primary px-4 py-1.5 text-sm font-semibold text-primary-strong sm:hidden"
            aria-expanded={menuOpen}
            aria-controls="nav-principale"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {isAuthenticated ? "Compte" : "Menu"}
          </button>

          <nav className="hidden items-center gap-x-6 text-sm sm:flex">
            {primaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-light px-3 py-1.5 text-sm font-bold text-secondary"
                  aria-expanded={acctOpen}
                  onClick={() => setAcctOpen((open) => !open)}
                >
                  {user.display_name}
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
            ) : null}
          </nav>
        </div>

        {menuOpen ? (
          <nav id="nav-principale" className="border-t border-light px-4 py-4 sm:hidden">
            <ul className="space-y-3 text-sm">
              {primaryLinks.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.end} className={navClass}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
              {isAuthenticated ? (
                <>
                  {accountActions.map((action) => (
                    <li key={action.to}>
                      <NavLink to={action.to} className={navClass}>
                        {action.label}
                      </NavLink>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      className="font-semibold text-primary-strong"
                      onClick={logout}
                    >
                      Se déconnecter
                    </button>
                  </li>
                </>
              ) : null}
            </ul>
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
