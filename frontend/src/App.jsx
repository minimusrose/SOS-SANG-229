import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import Toast from "./components/Toast.jsx";
import useToast from "./hooks/useToast.js";
import Home from "./pages/Home.jsx";
import DonorRegistration from "./pages/DonorRegistration.jsx";
import EmergencyAlert from "./pages/EmergencyAlert.jsx";
import LiveTracking from "./pages/LiveTracking.jsx";

const links = [
  { to: "/", label: "Accueil", short: "Accueil", end: true },
  { to: "/donneur/inscription", label: "Inscription donneur", short: "Donneur" },
  { to: "/alerte", label: "Alerte urgence", short: "Alerte" },
  { to: "/suivi", label: "Suivi des demandes", short: "Suivi" },
];

function navClass({ isActive }) {
  return isActive
    ? "font-semibold text-brand-700"
    : "text-stone-600 hover:text-stone-900";
}

export default function App() {
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>

      <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight text-brand-700">
              SOS Sang 229
            </p>
            <p className="text-xs text-stone-500">Maquette · Hackathon Cursor Bénin</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-700 sm:hidden"
            aria-expanded={menuOpen}
            aria-controls="nav-principale"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>
          <nav className="hidden flex-wrap justify-end gap-x-4 gap-y-1 text-sm sm:flex">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        {menuOpen ? (
          <nav
            id="nav-principale"
            className="border-t border-sand-200 px-4 py-3 sm:hidden"
          >
            <ul className="space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={navClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>

      <main
        id="contenu"
        className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-6 sm:pb-10"
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/donneur/inscription"
            element={<DonorRegistration onToast={toast.show} />}
          />
          <Route path="/alerte" element={<EmergencyAlert onToast={toast.show} />} />
          <Route path="/suivi" element={<LiveTracking onToast={toast.show} />} />
        </Routes>
      </main>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-white/95 backdrop-blur sm:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex flex-col items-center px-1 py-2.5 text-[11px] font-semibold ${
                    isActive ? "text-brand-700" : "text-stone-500"
                  }`
                }
              >
                {link.short}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
