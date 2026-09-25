import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Stethoscope, ShieldCheck, ShieldX, ArrowLeft, Search } from 'lucide-react';
import { verifierOrdonnance, readMedicaments } from '../api/ordonnances';
import { Button, Card, TextInput, Alert } from '../components/ui';
import { formatDate } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * NOUVEAU — page publique pour les pharmacies : verifie une ordonnance a partir
 * de son code (ex. K7M2-PQ4X) sans creer de compte. Le patient n'apparait que
 * par ses initiales.
 */
export default function VerifierOrdonnancePage() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [loading, setLoading] = useState(false);
  useDocumentTitle('Verifier une ordonnance');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErreur(null);
    setResultat(null);
    try {
      setResultat(await verifierOrdonnance(code));
    } catch (err) {
      setErreur(err.response?.status === 404
        ? 'Aucune ordonnance ne correspond a ce code. Verifiez la saisie.'
        : getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const medicaments = resultat ? readMedicaments(resultat) : [];

  return (
    <div className="min-h-screen bg-(--color-ivory) px-4 py-10">
      <div className="max-w-md mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-(--color-ink-600) font-medium mb-6 hover:text-(--color-petrol-600)">
          <ArrowLeft size={15} /> MediLinkPro
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-(--color-petrol-600) flex items-center justify-center text-white">
            <Stethoscope size={22} />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-(--color-petrol-700)">Verifier une ordonnance</h1>
            <p className="text-sm text-(--color-ink-600)">Espace pharmacie, sans inscription.</p>
          </div>
        </div>

        <Card className="p-5">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <TextInput
              required
              placeholder="Code (ex. K7M2-PQ4X)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono tracking-wider"
              aria-label="Code de verification"
            />
            <Button type="submit" disabled={loading || !code.trim()} aria-label="Verifier">
              <Search size={16} />
            </Button>
          </form>
          {erreur && <Alert className="mt-4">{erreur}</Alert>}
        </Card>

        {resultat && (
          <Card className="p-5 mt-4">
            <div className={`flex items-center gap-2 font-display font-semibold ${resultat.valide ? 'text-(--color-sage-500)' : 'text-(--color-clay-500)'}`}>
              {resultat.valide ? <ShieldCheck size={20} /> : <ShieldX size={20} />}
              {resultat.valide ? 'Ordonnance authentique et valide' : 'Ordonnance expiree'}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-(--color-ink-600)">Prescripteur</dt>
              <dd className="text-(--color-ink-900) font-medium">Dr {resultat.medecinNomComplet}</dd>
              {resultat.numeroOrdreMedecin && (<><dt className="text-(--color-ink-600)">N° d'ordre</dt><dd>{resultat.numeroOrdreMedecin}</dd></>)}
              <dt className="text-(--color-ink-600)">Patient</dt>
              <dd>{resultat.patientInitiales}</dd>
              <dt className="text-(--color-ink-600)">Emise le</dt>
              <dd>{formatDate(resultat.dateEmission)}</dd>
              {resultat.dateExpiration && (<><dt className="text-(--color-ink-600)">Valable jusqu'au</dt><dd>{formatDate(`${resultat.dateExpiration}T00:00`)}</dd></>)}
            </dl>
            <ul className="mt-4 pt-4 border-t border-(--color-petrol-100) space-y-2">
              {medicaments.map((m, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium text-(--color-ink-900)">{m.nom}</p>
                  {(m.posologie || m.duree) && <p className="text-(--color-ink-600)">{[m.posologie, m.duree].filter(Boolean).join(' pendant ')}</p>}
                </li>
              ))}
            </ul>
            {resultat.instructions && <p className="text-sm text-(--color-ink-600) mt-3 whitespace-pre-line">{resultat.instructions}</p>}
          </Card>
        )}
      </div>
    </div>
  );
}
