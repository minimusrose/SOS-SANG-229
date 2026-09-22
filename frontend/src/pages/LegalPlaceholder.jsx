import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";

// Page minimale pour un lien de footer qui n'a pas encore de contenu
// juridique réel. N'écrit aucun texte juridique — seulement l'espace
// réservé demandé.
export default function LegalPlaceholder({ title }) {
  return (
    <PageFrame>
      <PageHeader title={title} />
      <p className="mt-6 text-base leading-7 text-muted">Contenu à venir.</p>
    </PageFrame>
  );
}
