import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, MapPin, BadgeCheck, Navigation, Loader2, SlidersHorizontal, Phone } from 'lucide-react';
import { searchMedecins } from '../../api/medecins';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import {
  Card, Button, ButtonLink, TextInput, Spinner, EmptyState, Select, cx, ErrorState,
} from '../../components/ui';
import { formatTarif, normalize } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const TRIS = [
  { value: 'pertinence', label: 'Pertinence' },
  { value: 'distance', label: 'Plus proche' },
  { value: 'tarif', label: 'Tarif croissant' },
  { value: 'nom', label: 'Nom (A-Z)' },
];

export default function RechercheMedecinsPage() {
  const toast = useToast();
  const [specialite, setSpecialite] = useState('');
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [tri, setTri] = useState('pertinence');
  const [verifiesSeulement, setVerifiesSeulement] = useState(false);
  const [tarifMax, setTarifMax] = useState('');
  const [showFiltres, setShowFiltres] = useState(false);
  const [specialitesConnues, setSpecialitesConnues] = useState([]);
  useDocumentTitle('Trouver un specialiste');

  const runSearch = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchMedecins(params);
      setMedecins(data);
      // On memorise les specialites vues pour proposer des raccourcis.
      setSpecialitesConnues((prev) => {
        const set = new Set(prev);
        data.forEach((m) => m.specialite && set.add(m.specialite));
        return Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 12);
      });
    } catch (err) {
      setError(err);
      setMedecins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { runSearch({}); }, [runSearch]);

  function lancer(spec = specialite) {
    runSearch({ specialite: spec || undefined, lat: coords?.lat, lng: coords?.lng });
  }

  function handleSubmit(e) {
    e.preventDefault();
    lancer();
  }

  function choisirSpecialite(spec) {
    const next = normalize(specialite) === normalize(spec) ? '' : spec;
    setSpecialite(next);
    lancer(next);
  }

  function handleLocate() {
    if (coords) {
      // Second clic : desactive la recherche par proximite.
      setCoords(null);
      if (tri === 'distance') setTri('pertinence');
      runSearch({ specialite: specialite || undefined });
      return;
    }
    if (!navigator.geolocation) {
      toast.error("La geolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        setLocating(false);
        setTri('distance');
        runSearch({ specialite: specialite || undefined, ...newCoords });
      },
      (err) => {
        setLocating(false);
        toast.error(err.code === 1
          ? 'Acces a votre position refuse. Autorisez-le dans les reglages du navigateur.'
          : 'Position introuvable pour le moment. Reessayez.');
      },
      { timeout: 8000 }
    );
  }

  const resultats = useMemo(() => {
    const list = medecins
      .filter((m) => !verifiesSeulement || m.verifie)
      .filter((m) => !tarifMax || m.tarif == null || m.tarif <= Number(tarifMax));
    const sorted = [...list];
    if (tri === 'distance') sorted.sort((a, b) => (a.distanceApprox ?? Infinity) - (b.distanceApprox ?? Infinity));
    if (tri === 'tarif') sorted.sort((a, b) => (a.tarif ?? Infinity) - (b.tarif ?? Infinity));
    if (tri === 'nom') sorted.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`));
    return sorted;
  }, [medecins, verifiesSeulement, tarifMax, tri]);

  const nbFiltresActifs = (verifiesSeulement ? 1 : 0) + (tarifMax ? 1 : 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Trouver un specialiste</h1>
        <p className="text-(--color-ink-600) mt-1">Recherchez par specialite et triez par proximite.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-ink-300) pointer-events-none" />
          <TextInput
            placeholder="Cardiologie, pediatrie, dermatologie..."
            value={specialite}
            onChange={(e) => setSpecialite(e.target.value)}
            className="pl-10"
            aria-label="Specialite"
          />
        </div>
        <Button variant={coords ? 'success' : 'ghost'} onClick={handleLocate} disabled={locating}>
          {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          {coords ? 'Pres de moi (actif)' : 'Pres de moi'}
        </Button>
        <Button type="submit">Rechercher</Button>
      </form>

      {specialitesConnues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {specialitesConnues.map((s) => {
            const active = normalize(specialite) === normalize(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => choisirSpecialite(s)}
                className={cx(
                  'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                  active
                    ? 'bg-(--color-petrol-600) border-(--color-petrol-600) text-white'
                    : 'bg-white border-(--color-petrol-100) text-(--color-petrol-600) hover:border-(--color-petrol-400)',
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-(--color-ink-600)">
          {!loading && `${resultats.length} specialiste${resultats.length > 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="py-2" onClick={() => setShowFiltres((v) => !v)} aria-expanded={showFiltres}>
            <SlidersHorizontal size={15} /> Filtres{nbFiltresActifs > 0 && ` (${nbFiltresActifs})`}
          </Button>
          <Select value={tri} onChange={(e) => setTri(e.target.value)} className="w-auto! py-2" aria-label="Trier par">
            {TRIS.filter((t) => t.value !== 'distance' || coords).map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {showFiltres && (
        <Card className="p-4 flex flex-wrap items-end gap-5">
          <label className="flex items-center gap-2 text-sm text-(--color-ink-900) cursor-pointer">
            <input
              type="checkbox"
              checked={verifiesSeulement}
              onChange={(e) => setVerifiesSeulement(e.target.checked)}
              className="w-4 h-4 accent-(--color-petrol-600)"
            />
            Medecins verifies uniquement
          </label>
          <div>
            <label htmlFor="tarifMax" className="block text-sm font-medium text-(--color-ink-600) mb-1.5">Tarif maximum (FCFA)</label>
            <TextInput
              id="tarifMax"
              type="number"
              min="0"
              step="1000"
              placeholder="Ex. 20000"
              value={tarifMax}
              onChange={(e) => setTarifMax(e.target.value)}
              className="w-44"
            />
          </div>
          {nbFiltresActifs > 0 && (
            <Button variant="ghost" onClick={() => { setVerifiesSeulement(false); setTarifMax(''); }}>
              Reinitialiser
            </Button>
          )}
        </Card>
      )}

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => lancer()} />
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-7 h-7" />
        </div>
      ) : resultats.length === 0 ? (
        <Card>
          <EmptyState
            icon={Search}
            title="Aucun specialiste trouve"
            description={nbFiltresActifs ? 'Essayez de retirer un filtre.' : 'Essayez une autre specialite ou elargissez votre recherche.'}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {resultats.map((m) => (
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

              <div className="mt-3 space-y-1 text-sm text-(--color-ink-600) flex-1">
                {m.etablissementNom && (
                  <p className="flex items-center gap-1.5"><MapPin size={14} /> {m.etablissementNom}</p>
                )}
                {m.distanceApprox != null && (
                  <p className="text-(--color-petrol-600) font-medium">{m.distanceApprox} km de vous</p>
                )}
                {m.tarif != null && (
                  <p>Consultation : <span className="font-medium text-(--color-ink-900)">{formatTarif(m.tarif)}</span></p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <ButtonLink to={`/patient/rendez-vous/nouveau/${m.id}`} className="flex-1">Prendre rendez-vous</ButtonLink>
                {m.latitude != null && m.longitude != null && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center px-3 rounded-xl border border-(--color-petrol-100) text-(--color-petrol-600) hover:border-(--color-petrol-400)"
                    aria-label="Itineraire"
                    title="Itineraire"
                  >
                    <Navigation size={16} />
                  </a>
                )}
                {m.telephone && (
                  <a
                    href={`tel:${m.telephone.replace(/\s/g, '')}`}
                    className="inline-flex items-center justify-center px-3 rounded-xl border border-(--color-petrol-100) text-(--color-petrol-600) hover:border-(--color-petrol-400)"
                    aria-label="Appeler"
                    title="Appeler"
                  >
                    <Phone size={16} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
