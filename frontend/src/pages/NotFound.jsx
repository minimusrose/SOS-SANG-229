import { Link } from "react-router-dom";
import PageFrame from "../components/PageFrame.jsx";

export default function NotFound() {
  return (
    <PageFrame>
      <div className="card space-y-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-strong">
          Page introuvable
        </p>
        <h1 className="text-2xl font-extrabold text-secondary">
          Cette page n’existe pas
        </h1>
        <p className="text-sm leading-6 text-muted">
          Le lien est peut-être ancien ou incomplet.
        </p>
        <Link to="/" className="btn-primary mx-auto">
          Retour à l’accueil
        </Link>
      </div>
    </PageFrame>
  );
}
