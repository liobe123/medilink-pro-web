import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Stethoscope, AlertCircle, ArrowLeft, CheckCircle2, User, ClipboardList, Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, TextInput, PasswordInput, FieldLabel, Select, Alert, ButtonLink } from '../components/ui';
import { homeForRole } from '../utils/roles';
import { GROUPES_SANGUINS, GROUPE_LABELS } from '../utils/constants';
import { toLocalDateInput } from '../utils/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Score 0-4 : longueur, chiffres, majuscules, caracteres speciaux. */
function passwordStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/\d/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const STRENGTH = [
  { label: 'Trop court', color: 'bg-(--color-clay-500)' },
  { label: 'Faible', color: 'bg-(--color-clay-500)' },
  { label: 'Moyen', color: 'bg-(--color-amber-400)' },
  { label: 'Bon', color: 'bg-(--color-sage-500)' },
  { label: 'Excellent', color: 'bg-(--color-sage-500)' },
];

function PasswordStrength({ value }) {
  if (!value) return null;
  const score = passwordStrength(value);
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < score ? STRENGTH[score].color : 'bg-(--color-petrol-100)'}`} />
        ))}
      </div>
      <p className="text-xs text-(--color-ink-600) mt-1">Securite : {STRENGTH[score].label}</p>
    </div>
  );
}

// L'inscription ADMIN n'est volontairement pas proposee ici : un administrateur
// est cree par un administrateur existant, pas via l'inscription publique.
const ROLES = [
  { value: 'PATIENT', label: 'Patient', description: 'Suivre mon dossier medical et prendre rendez-vous', icon: User },
  { value: 'MEDECIN', label: 'Medecin', description: 'Proposer des consultations et gerer mon agenda', icon: Stethoscope },
  { value: 'SECRETAIRE', label: 'Secretaire', description: "Coordonner l'accueil et les rendez-vous", icon: ClipboardList },
  { value: 'DIRECTEUR', label: 'Directeur', description: "Superviser un etablissement de sante", icon: Building2 },
];

const INITIAL_FORM = {
  nom: '', prenom: '', email: '', motDePasse: '', confirmation: '', telephone: '',
  dateNaissance: '', groupeSanguin: '',
  specialite: '', numeroOrdre: '', tarif: '',
};

export default function RegisterPage() {
  const { register, loading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('PATIENT');
  const [form, setForm] = useState(INITIAL_FORM);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [localError, setLocalError] = useState(null);
  useDocumentTitle('Inscription');

  useEffect(() => { clearError(); }, [clearError]);

  if (isAuthenticated) {
    return <Navigate to={homeForRole(user?.role)} replace />;
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // On conserve l'identite deja saisie quand on change de profil ;
  // seuls les champs specifiques au role sont reinitialises.
  function handleRoleChange(value) {
    setRole(value);
    setForm((prev) => ({
      ...INITIAL_FORM,
      nom: prev.nom, prenom: prev.prenom, email: prev.email, telephone: prev.telephone,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);
    if (form.motDePasse !== form.confirmation) {
      setLocalError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email.trim(),
        motDePasse: form.motDePasse,
        telephone: form.telephone || null,
        role,
        ...(role === 'PATIENT' && {
          dateNaissance: form.dateNaissance || null,
          groupeSanguin: form.groupeSanguin || null,
        }),
        ...(role === 'MEDECIN' && {
          specialite: form.specialite || null,
          numeroOrdre: form.numeroOrdre || null,
          tarif: form.tarif ? Number(form.tarif) : null,
        }),
      };

      const response = await register(payload);

      if (response.token) {
        // PATIENT : compte approuve immediatement, connexion directe.
        navigate(homeForRole(response.role));
      } else {
        // MEDECIN, SECRETAIRE, DIRECTEUR : compte en attente de validation admin.
        setPendingMessage(response.message);
      }
    } catch {
      // erreur deja geree par le contexte
    }
  }

  if (pendingMessage) {
    return (
      <div className="min-h-screen bg-(--color-ivory) flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-(--color-sage-100) flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={26} className="text-(--color-sage-500)" />
          </div>
          <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Demande envoyee</h1>
          <p className="text-(--color-ink-600) mt-3">{pendingMessage}</p>
          <ButtonLink to="/connexion" variant="ghost" className="mt-7">Retour a la connexion</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--color-ivory) flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-(--color-ink-600) font-medium mb-6 hover:text-(--color-petrol-600) transition-colors">
          <ArrowLeft size={15} /> Retour a l'accueil
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-(--color-petrol-600) flex items-center justify-center text-white mb-3">
            <Stethoscope size={24} strokeWidth={2} />
          </div>
          <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Rejoindre MediLinkPro</h1>
          <p className="text-sm text-(--color-ink-600) mt-1 text-center">
            Choisissez votre profil pour creer votre espace.
          </p>
        </div>

        {/* Selecteur de role */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {ROLES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRoleChange(value)}
              className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border text-left transition-colors ${
                role === value
                  ? 'border-(--color-petrol-600) bg-(--color-petrol-50) text-(--color-petrol-700)'
                  : 'border-(--color-petrol-100) bg-white text-(--color-ink-600) hover:border-(--color-petrol-400)'
              }`}
            >
              <Icon size={17} strokeWidth={2} className="shrink-0" />
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-(--color-petrol-100) shadow-sm p-6">
          {role !== 'PATIENT' && (
            <div className="flex items-start gap-2 bg-(--color-amber-400)/15 text-(--color-amber-500) text-sm rounded-xl px-3.5 py-3 mb-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>Ce profil necessite une validation par un administrateur avant la premiere connexion.</span>
            </div>
          )}

          {(localError || error) && (
            <Alert icon={AlertCircle} className="mb-4">{localError || error}</Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Prenom</FieldLabel>
                <TextInput required value={form.prenom} onChange={(e) => update('prenom', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Nom</FieldLabel>
                <TextInput required value={form.nom} onChange={(e) => update('nom', e.target.value)} />
              </div>
            </div>

            <div>
              <FieldLabel>Email</FieldLabel>
              <TextInput
                type="email"
                required
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Mot de passe</FieldLabel>
              <PasswordInput
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Au moins 6 caracteres"
                value={form.motDePasse}
                onChange={(e) => update('motDePasse', e.target.value)}
              />
              <PasswordStrength value={form.motDePasse} />
            </div>

            <div>
              <FieldLabel>Confirmer le mot de passe</FieldLabel>
              <PasswordInput
                required
                autoComplete="new-password"
                value={form.confirmation}
                onChange={(e) => update('confirmation', e.target.value)}
              />
              {form.confirmation && form.confirmation !== form.motDePasse && (
                <p className="text-xs text-(--color-clay-500) mt-1">Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            <div>
              <FieldLabel>Telephone</FieldLabel>
              <TextInput
                type="tel"
                placeholder="+237 6XX XXX XXX"
                value={form.telephone}
                onChange={(e) => update('telephone', e.target.value)}
              />
            </div>

            {role === 'PATIENT' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Date de naissance</FieldLabel>
                  <TextInput
                    type="date"
                    max={toLocalDateInput()}
                    value={form.dateNaissance}
                    onChange={(e) => update('dateNaissance', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Groupe sanguin</FieldLabel>
                  <Select value={form.groupeSanguin} onChange={(e) => update('groupeSanguin', e.target.value)}>
                    {GROUPES_SANGUINS.map((g) => (
                      <option key={g} value={g}>{GROUPE_LABELS[g]}</option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {role === 'MEDECIN' && (
              <>
                <div>
                  <FieldLabel>Specialite</FieldLabel>
                  <TextInput
                    required
                    placeholder="Cardiologie, pediatrie..."
                    value={form.specialite}
                    onChange={(e) => update('specialite', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Numero d'ordre</FieldLabel>
                    <TextInput
                      required
                      placeholder="CM-12345"
                      value={form.numeroOrdre}
                      onChange={(e) => update('numeroOrdre', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Tarif (FCFA)</FieldLabel>
                    <TextInput
                      type="number"
                      min="0"
                      placeholder="15000"
                      value={form.tarif}
                      onChange={(e) => update('tarif', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creation du compte...' : 'Creer mon compte'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-(--color-ink-600) mt-5">
          Deja un compte ?{' '}
          <Link to="/connexion" className="font-semibold text-(--color-petrol-600) hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
