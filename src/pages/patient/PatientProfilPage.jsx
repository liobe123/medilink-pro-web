import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPatient, updatePatient } from '../../api/patients';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import {
  Card, Button, FieldLabel, TextInput, Select, Textarea, PageHeader, PageLoader, ErrorState,
} from '../../components/ui';
import { GROUPES_SANGUINS, GROUPE_LABELS } from '../../utils/constants';
import { toLocalDateInput } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

/**
 * NOUVEAU — le patient peut corriger ses informations (telephone, date de
 * naissance, groupe sanguin...). Utilise les endpoints existants
 * GET/PUT /api/patients/{id}.
 */
export default function PatientProfilPage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  useDocumentTitle('Mon profil');

  const { data, loading, error, reload } = useApi(() => getPatient(user.userId), [user.userId]);
  useEffect(() => {
    if (data) {
      setForm({
        ...data,
        dateNaissance: data.dateNaissance ? String(data.dateNaissance).slice(0, 10) : '',
        groupeSanguin: data.groupeSanguin || '',
      });
    }
  }, [data]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updatePatient(user.userId, {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone ?? '',
        dateNaissance: form.dateNaissance || null,
        groupeSanguin: form.groupeSanguin || null,
        adresse: form.adresse ?? '',
        // Chaine vide = effacer la valeur cote backend
        allergies: form.allergies ?? '',
        antecedents: form.antecedents ?? '',
      });
      if (updated) {
        setForm((prev) => ({ ...prev, ...updated, dateNaissance: updated.dateNaissance ? String(updated.dateNaissance).slice(0, 10) : prev.dateNaissance }));
      }
      updateUser({ nom: form.nom, prenom: form.prenom });
      setDirty(false);
      toast.success('Profil mis a jour.');
    } catch (err) {
      toast.error(getErrorMessage(err, "Impossible d'enregistrer vos informations."));
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  if (loading || !form) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Mon profil" description="Ces informations aident vos medecins a mieux vous soigner." />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Prenom</FieldLabel>
              <TextInput required value={form.prenom || ''} onChange={(e) => update('prenom', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Nom</FieldLabel>
              <TextInput required value={form.nom || ''} onChange={(e) => update('nom', e.target.value)} />
            </div>
          </div>

          <div>
            <FieldLabel>Email</FieldLabel>
            <TextInput value={form.email || user.email || ''} disabled />
            <p className="text-xs text-(--color-ink-300) mt-1">L'email sert d'identifiant et ne peut pas etre modifie ici.</p>
          </div>

          <div>
            <FieldLabel>Telephone</FieldLabel>
            <TextInput type="tel" placeholder="+237 6XX XXX XXX" value={form.telephone || ''} onChange={(e) => update('telephone', e.target.value)} />
          </div>

          <div>
            <FieldLabel>Adresse</FieldLabel>
            <TextInput placeholder="Quartier, ville" value={form.adresse || ''} onChange={(e) => update('adresse', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Date de naissance</FieldLabel>
              <TextInput type="date" max={toLocalDateInput()} value={form.dateNaissance} onChange={(e) => update('dateNaissance', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Groupe sanguin</FieldLabel>
              <Select value={form.groupeSanguin} onChange={(e) => update('groupeSanguin', e.target.value)}>
                {GROUPES_SANGUINS.map((g) => <option key={g} value={g}>{GROUPE_LABELS[g]}</option>)}
              </Select>
            </div>
          </div>

          <div className="pt-2 border-t border-(--color-petrol-100)">
            <p className="text-sm font-semibold text-(--color-ink-900) mt-3 mb-3">Informations medicales</p>
            <div className="space-y-4">
              <div>
                <FieldLabel>Allergies</FieldLabel>
                <Textarea
                  rows={2}
                  placeholder="Penicilline, arachides... (laisser vide si aucune)"
                  value={form.allergies || ''}
                  onChange={(e) => update('allergies', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Antecedents medicaux</FieldLabel>
                <Textarea
                  rows={2}
                  placeholder="Diabete, hypertension, operations..."
                  value={form.antecedents || ''}
                  onChange={(e) => update('antecedents', e.target.value)}
                />
              </div>
              <p className="text-xs text-(--color-ink-300)">
                Visibles uniquement par vous et les medecins qui vous suivent.
              </p>
            </div>
          </div>

          <Button type="submit" disabled={saving || !dirty}>
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
