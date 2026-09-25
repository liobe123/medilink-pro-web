import { useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import { Button } from './ui';
import { useToast } from './Toast';

/** Remplit latitude/longitude avec la position actuelle de l'appareil. */
export default function GeolocButton({ onLocate, label = 'Utiliser ma position actuelle' }) {
  const toast = useToast();
  const [locating, setLocating] = useState(false);

  function handleClick() {
    if (!navigator.geolocation) {
      toast.error("La geolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onLocate({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      (err) => {
        setLocating(false);
        toast.error(err.code === 1
          ? "Acces a la position refuse. Autorisez-le dans les reglages du navigateur."
          : 'Position introuvable. Reessayez a l\'exterieur ou saisissez les coordonnees.');
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  return (
    <Button variant="ghost" onClick={handleClick} disabled={locating} className="px-0 hover:bg-transparent hover:underline">
      {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
      {locating ? 'Localisation...' : label}
    </Button>
  );
}
