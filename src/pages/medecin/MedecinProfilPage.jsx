import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMedecin, updateMedecin } from '../../api/medecins';
import { Card, Button, Spinner, FieldLabel, TextInput, PageHeader } from '../../components/ui';

export default function MedecinProfilPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMedecin(user.userId)
      .then((data) => { if (!cancelled) setForm(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user.userId]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMedecin(user.userId, {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        specialite: form.specialite,
        numeroOrdre: form.numeroOrdre,
        tarif: form.tarif !== '' && form.tarif != null ? Number(form.tarif) : null,
        latitude: form.latitude !== '' && form.latitude != null ? Number(form.latitude) : null,
        longitude: form.longitude !== '' && form.longitude != null ? Number(form.longitude) : null,
      });
      setForm(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Mon profil" description="Vos informations professionnelles visibles par les patients." />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Prenom</FieldLabel>
              <TextInput value={form.prenom || ''} onChange={(e) => update('prenom', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Nom</FieldLabel>
              <TextInput value={form.nom || ''} onChange={(e) => update('nom', e.target.value)} />
            </div>
          </div>

          <div>
            <FieldLabel>Telephone</FieldLabel>
            <TextInput value={form.telephone || ''} onChange={(e) => update('telephone', e.target.value)} />
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
              <TextInput type="number" min="0" value={form.tarif ?? ''} onChange={(e) => update('tarif', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Latitude</FieldLabel>
              <TextInput type="number" step="any" value={form.latitude ?? ''} onChange={(e) => update('latitude', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Longitude</FieldLabel>
              <TextInput type="number" step="any" value={form.longitude ?? ''} onChange={(e) => update('longitude', e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-(--color-ink-300)">
            La position determine votre visibilite dans la recherche geolocalisee des patients.
          </p>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-(--color-sage-500) font-medium">
                <CheckCircle2 size={15} /> Enregistre
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
