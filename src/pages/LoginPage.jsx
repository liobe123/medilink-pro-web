import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Stethoscope, AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, TextInput, PasswordInput, FieldLabel, Alert } from '../components/ui';
import { homeForRole } from '../utils/roles';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function LoginPage() {
  const { login, loading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', motDePasse: '' });
  useDocumentTitle('Connexion');

  // L'erreur d'une tentative precedente (ou de la page inscription) ne doit
  // pas rester affichee en arrivant sur la page.
  useEffect(() => { clearError(); }, [clearError]);

  // Retour a la page demandee avant la redirection, si elle appartient a l'espace du role.
  function destinationFor(role) {
    const from = location.state?.from;
    const home = homeForRole(role);
    return from && from.startsWith(home) ? from : home;
  }

  // Deja connecte (ou connexion qui vient de reussir) : on quitte la page.
  if (isAuthenticated) {
    return <Navigate to={destinationFor(user?.role)} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await login({ ...form, email: form.email.trim() });
      navigate(destinationFor(response.role), { replace: true });
    } catch {
      // l'erreur est deja geree et affichee via le contexte
    }
  }

  return (
    <div className="min-h-screen bg-(--color-ivory) flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-(--color-ink-600) font-medium mb-6 hover:text-(--color-petrol-600) transition-colors">
          <ArrowLeft size={15} /> Retour a l'accueil
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-(--color-petrol-600) flex items-center justify-center text-white mb-3">
            <Stethoscope size={24} strokeWidth={2} />
          </div>
          <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">MediLinkPro</h1>
          <p className="text-sm text-(--color-ink-600) mt-1">Votre suivi medical, simplifie.</p>
        </div>

        <div className="bg-white rounded-2xl border border-(--color-petrol-100) shadow-sm p-6">
          <h2 className="font-display font-semibold text-lg text-(--color-ink-900) mb-5">Se connecter</h2>

          {searchParams.get('expiree') && !error && (
            <Alert variant="warning" icon={Clock} className="mb-4">
              Votre session a expire. Reconnectez-vous pour continuer.
            </Alert>
          )}

          {error && (
            <Alert icon={AlertCircle} className="mb-4">{error}</Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <TextInput
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="motDePasse">Mot de passe</FieldLabel>
              <PasswordInput
                id="motDePasse"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.motDePasse}
                onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-(--color-ink-600) mt-5">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-semibold text-(--color-petrol-600) hover:underline">
            Creer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
