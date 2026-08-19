import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, BadgeCheck, Navigation, Loader2 } from 'lucide-react';
import { searchMedecins } from '../../api/medecins';
import { Card, Button, TextInput, Spinner, EmptyState } from '../../components/ui';

export default function RechercheMedecinsPage() {
  const [specialite, setSpecialite] = useState('');
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  const runSearch = useCallback(async (params) => {
    setLoading(true);
    try {
      const data = await searchMedecins(params);
      setMedecins(data);
    } catch {
      setMedecins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch({});
  }, [runSearch]);

  function handleSubmit(e) {
    e.preventDefault();
    runSearch({ specialite: specialite || undefined, lat: coords?.lat, lng: coords?.lng });
  }

  function handleLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        setLocating(false);
        runSearch({ specialite: specialite || undefined, ...newCoords });
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Trouver un specialiste</h1>
        <p className="text-(--color-ink-600) mt-1">Recherchez par specialite et triez par proximite.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-ink-300)" />
          <TextInput
            placeholder="Cardiologie, pediatrie, dermatologie..."
            value={specialite}
            onChange={(e) => setSpecialite(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="button" variant="ghost" onClick={handleLocate} disabled={locating}>
          {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          {coords ? 'Position activee' : 'Pres de moi'}
        </Button>
        <Button type="submit">Rechercher</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-7 h-7" />
        </div>
      ) : medecins.length === 0 ? (
        <Card>
          <EmptyState icon={Search} title="Aucun specialiste trouve" description="Essayez une autre specialite ou elargissez votre recherche." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {medecins.map((m) => (
            <Card key={m.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-semibold text-(--color-ink-900)">Dr {m.prenom} {m.nom}</p>
                  <p className="text-sm text-(--color-amber-500) font-medium">{m.specialite || 'Generaliste'}</p>
                </div>
                {m.verifie && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-(--color-sage-500) bg-(--color-sage-100) px-2 py-1 rounded-full shrink-0">
                    <BadgeCheck size={13} /> Verifie
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1 text-sm text-(--color-ink-600)">
                {m.etablissementNom && (
                  <p className="flex items-center gap-1.5"><MapPin size={14} /> {m.etablissementNom}</p>
                )}
                {m.distanceApprox != null && (
                  <p className="text-(--color-petrol-600) font-medium">{m.distanceApprox} km de vous</p>
                )}
                {m.tarif != null && (
                  <p>Consultation : <span className="font-medium text-(--color-ink-900)">{m.tarif} FCFA</span></p>
                )}
              </div>

              <Link to={`/patient/rendez-vous/nouveau/${m.id}`} className="mt-4">
                <Button className="w-full">Prendre rendez-vous</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
