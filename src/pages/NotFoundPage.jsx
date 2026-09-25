import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../utils/roles';
import { ButtonLink } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  const { isAuthenticated, user } = useAuth();
  useDocumentTitle('Page introuvable');
  const target = isAuthenticated ? homeForRole(user?.role) : '/';

  return (
    <div className="min-h-screen bg-(--color-ivory) flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-(--color-petrol-50) flex items-center justify-center mx-auto mb-5">
          <Compass size={26} className="text-(--color-petrol-600)" />
        </div>
        <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Cette page n'existe pas</h1>
        <p className="text-(--color-ink-600) mt-2">
          Le lien est peut-etre ancien ou mal saisi. Revenez a votre espace pour continuer.
        </p>
        <ButtonLink to={target} className="mt-6">
          {isAuthenticated ? 'Retour a mon espace' : "Retour a l'accueil"}
        </ButtonLink>
      </div>
    </div>
  );
}
