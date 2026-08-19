import { useEffect, useState } from 'react';
import { Building2, MapPin, Phone } from 'lucide-react';
import { getAllEtablissements } from '../../api/etablissements';
import { Card, Spinner, EmptyState, PageHeader } from '../../components/ui';

export default function SecretaireEtablissementsPage() {
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllEtablissements()
      .then((data) => { if (!cancelled) setEtablissements(data); })
      .catch(() => { if (!cancelled) setEtablissements([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Etablissements" description="Hopitaux et cliniques partenaires de MediLinkPro." />

      {etablissements.length === 0 ? (
        <Card>
          <EmptyState icon={Building2} title="Aucun etablissement" description="Les etablissements ajoutes apparaitront ici." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {etablissements.map((e) => (
            <Card key={e.id} className="p-5">
              <p className="font-display font-semibold text-(--color-ink-900)">{e.nom}</p>
              {e.type && <p className="text-sm text-(--color-amber-500) font-medium">{e.type}</p>}
              <div className="mt-3 space-y-1 text-sm text-(--color-ink-600)">
                {e.adresse && <p className="flex items-center gap-1.5"><MapPin size={14} /> {e.adresse}</p>}
                {e.telephone && <p className="flex items-center gap-1.5"><Phone size={14} /> {e.telephone}</p>}
              </div>
              {e.specialitesDisponibles?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {e.specialitesDisponibles.map((s) => (
                    <span key={s} className="text-xs font-medium px-2 py-1 rounded-full bg-(--color-petrol-50) text-(--color-petrol-600)">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
