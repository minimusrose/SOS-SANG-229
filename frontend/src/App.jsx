import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import DonorRegistration from "./pages/DonorRegistration.jsx";
import EmergencyAlert from "./pages/EmergencyAlert.jsx";
import LiveTracking from "./pages/LiveTracking.jsx";

const links = [
  { to: "/", label: "Accueil", end: true },
  { to: "/donneur/inscription", label: "Inscription donneur" },
  { to: "/alerte", label: "Alerte urgence" },
  { to: "/suivi", label: "Suivi des demandes" },
];

function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">SOS Sang 229</p>
          <nav className="flex flex-wrap gap-3 text-sm">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive ? "underline" : "text-neutral-600 hover:text-neutral-900"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/donneur/inscription" element={<DonorRegistration />} />
          <Route path="/alerte" element={<EmergencyAlert />} />
          <Route path="/suivi" element={<LiveTracking />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
