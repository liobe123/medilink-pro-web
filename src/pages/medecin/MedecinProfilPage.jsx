import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMedecin, updateMedecin } from '../../api/medecins';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import GeolocButton from '../../components/GeolocButton';
import {
  Card, Button, FieldLabel, TextInput, PageHeader, PageLoader, ErrorState,
} from '../../components/ui';
import { getErrorMessage } from '../../utils/errors';

function toNumberOrNull(v) {
  return v !== '' && v != null ? Number(v) : null;
}

export default function MedecinProfilPage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  useDocumentTitle('Mon profil');

  // Avant : sans .catch(), une erreur laissait la page en chargement infini.
  const { data, loading, error, reload } = useApi(() => getMedecin(user.userId), [user.userId]);
  useEffect(() => { if (data) setForm(data); }, [data]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const lat = toNumberOrNull(form.latitude);
    const lng = toNumberOrNull(form.longitude);
    if ((lat != null && (lat < -90 || lat > 90)) || (lng != null && (lng < -180 || lng > 180))) {
      toast.error('Coordonnees invalides : latitude entre -90 et 90, longitude entre -180 et 180.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMedecin(user.userId, {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        specialite: form.specialite,
        numeroOrdre: form.numeroOrdre,
        tarif: toNumberOrNull(form.tarif),
        latitude: lat,
        longitude: lng,
      });
      setForm(updated);
      setDirty(false);
      updateUser({ nom: updated.nom, prenom: updated.prenom });
      toast.success('Profil mis a jour.');
    } catch (err) {
      toast.error(getErrorMessage(err, "Impossible d'enregistrer le profil."));
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  if (loading || !form) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Mon profil" description="Vos informations professionnelles visibles par les patients." />

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
            <FieldLabel>Telephone</FieldLabel>
            <TextInput type="tel" value={form.telephone || ''} onChange={(e) => update('telephone', e.target.value)} />
          </div>

          <div>
            <FieldLabel>Specialite</FieldLabel>
            <TextInput value={form.specialite || ''} onChange={(e) => update('specialite', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Numero d'ordre</FieldLabel>
              <TextInput value={form.numeroOrdre || ''} onChange={(e) => update('numeroOrdre', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Tarif (FCFA)</FieldLabel>
              <TextInput type="number" min="0" step="500" value={form.tarif ?? ''} onChange={(e) => update('tarif', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Latitude</FieldLabel>
              <TextInput type="number" step="any" min="-90" max="90" value={form.latitude ?? ''} onChange={(e) => update('latitude', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Longitude</FieldLabel>
              <TextInput type="number" step="any" min="-180" max="180" value={form.longitude ?? ''} onChange={(e) => update('longitude', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-(--color-ink-300)">
              La position determine votre visibilite dans la recherche geolocalisee des patients.
            </p>
            <GeolocButton onLocate={({ latitude, longitude }) => {
              update('latitude', latitude);
              update('longitude', longitude);
            }}
            />
          </div>

          <Button type="submit" disabled={saving || !dirty}>
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
