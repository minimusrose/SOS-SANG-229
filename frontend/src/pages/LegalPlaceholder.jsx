import PageFrame from "../components/PageFrame.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function LegalPlaceholder({ title }) {
  const renderContent = () => {
    if (title === "Politique de confidentialité") {
      return (
        <div className="mt-6 space-y-6 text-base leading-7 text-muted">
          <p>
            La présente politique de confidentialité décrit la manière dont SOS SANG 229 collecte, utilise et protège vos données personnelles. En utilisant notre plateforme, vous acceptez ces pratiques.
          </p>
          <h2 className="text-xl font-bold text-secondary">1. Données collectées</h2>
          <p>
            Nous collectons votre nom, numéro de téléphone, groupe sanguin et localisation (commune/département) pour les besoins de mise en relation lors d'urgences sanguines.
          </p>
          <h2 className="text-xl font-bold text-secondary">2. Utilisation des données</h2>
          <p>
            Vos données sont exclusivement utilisées pour vous notifier (par SMS) lorsqu'une personne compatible a besoin de votre groupe sanguin dans votre zone géographique.
          </p>
          <h2 className="text-xl font-bold text-secondary">3. Protection et Partage</h2>
          <p>
            Votre numéro de téléphone n'est <strong>jamais partagé</strong> avec le patient ou l'hôpital. Seul notre système automatisé y a accès pour vous envoyer des notifications d'urgence. Nous ne revendons aucune donnée à des tiers.
          </p>
          <h2 className="text-xl font-bold text-secondary">4. Vos droits</h2>
          <p>
            Conformément à la législation en vigueur en République du Bénin sur la protection des données à caractère personnel, vous disposez d'un droit d'accès, de modification et de suppression de vos données. Vous pouvez modifier vos préférences depuis votre espace compte.
          </p>
        </div>
      );
    }
    
    if (title === "CGU") {
      return (
        <div className="mt-6 space-y-6 text-base leading-7 text-muted">
          <p>
            Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de la plateforme SOS SANG 229.
          </p>
          <h2 className="text-xl font-bold text-secondary">1. Objet de la plateforme</h2>
          <p>
            SOS SANG 229 est une plateforme numérique béninoise mettant en relation des hôpitaux ayant des besoins urgents en produits sanguins avec des donneurs bénévoles compatibles inscrits sur la plateforme.
          </p>
          <h2 className="text-xl font-bold text-secondary">2. Inscription et Engagements</h2>
          <p>
            En tant que donneur, vous vous engagez à fournir des informations exactes sur votre groupe sanguin. Le don de sang est un acte bénévole, anonyme et non rémunéré. Vous êtes libre d'accepter ou de refuser de vous rendre à l'hôpital lors de la réception d'une notification.
          </p>
          <h2 className="text-xl font-bold text-secondary">3. Responsabilités</h2>
          <p>
            SOS SANG 229 agit uniquement comme un intermédiaire technologique. Nous ne sommes pas responsables de la gestion médicale du don de sang, des qualifications médicales du donneur, ni de la qualité du sang transfusé. Ces aspects relèvent de l'entière responsabilité du centre hospitalier et de l'Agence Nationale de Transfusion Sanguine.
          </p>
          <h2 className="text-xl font-bold text-secondary">4. Modification des CGU</h2>
          <p>
            Nous nous réservons le droit d'adapter ou de modifier à tout moment les présentes CGU. Les utilisateurs seront informés de toute modification significative.
          </p>
        </div>
      );
    }

    if (title === "Mentions légales") {
      return (
        <div className="mt-6 space-y-6 text-base leading-7 text-muted">
          <p>
            La plateforme <strong>SOS SANG 229</strong> a été développée dans le cadre du Hackathon Cursor Bénin.
          </p>
          <h2 className="text-xl font-bold text-secondary">Éditeur de la plateforme</h2>
          <p>
            SOS SANG 229 (Projet Hackathon)<br />
            Cotonou, Bénin<br />
            Email de contact : contact@sossang229.bj
          </p>
          <h2 className="text-xl font-bold text-secondary">Hébergement</h2>
          <p>
            La plateforme technique (Frontend & Backend) est hébergée sur les serveurs de Vercel et Railway. Les envois de SMS sont propulsés par Africa's Talking / Robase.
          </p>
          <h2 className="text-xl font-bold text-secondary">Propriété intellectuelle</h2>
          <p>
            L'ensemble des éléments constituant la plateforme (textes, graphismes, logiciels, code source) sont protégés par le droit d'auteur.
          </p>
        </div>
      );
    }

    return <p className="mt-6 text-base leading-7 text-muted">Contenu à venir.</p>;
  };

  return (
    <PageFrame>
      <PageHeader title={title} />
      {renderContent()}
    </PageFrame>
  );
}
