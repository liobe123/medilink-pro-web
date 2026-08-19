import { Link } from 'react-router-dom';
import { CalendarHeart, Users, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui';

export default function SecretaireDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
          Bonjour {user?.prenom} 👋
        </h1>
        <p className="text-(--color-ink-600) mt-1">Coordonnez les rendez-vous et l'accueil des patients.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/secretaire/agenda">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-petrol-50) flex items-center justify-center mb-3">
              <CalendarHeart size={18} className="text-(--color-petrol-600)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Agenda</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Tous les rendez-vous en un coup d'oeil.</p>
          </Card>
        </Link>

        <Link to="/secretaire/patients">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-sage-100) flex items-center justify-center mb-3">
              <Users size={18} className="text-(--color-sage-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Patients</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Consultez la liste des patients enregistres.</p>
          </Card>
        </Link>

        <Link to="/secretaire/etablissements">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-amber-400)/20 flex items-center justify-center mb-3">
              <Building2 size={18} className="text-(--color-amber-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Etablissements</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Consultez les etablissements de sante.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
