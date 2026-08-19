import { LayoutDashboard, CalendarHeart, MapPinned, FileHeart } from 'lucide-react';
import RoleLayout from '../layouts/RoleLayout';

const NAV_ITEMS = [
  { to: '/patient', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/patient/dossier', label: 'Mon dossier', icon: FileHeart },
  { to: '/patient/recherche', label: 'Trouver un specialiste', icon: MapPinned },
  { to: '/patient/rendez-vous', label: 'Mes rendez-vous', icon: CalendarHeart },
];

export default function PatientLayout({ children }) {
  return (
    <RoleLayout navItems={NAV_ITEMS} roleLabel="Espace patient">
      {children}
    </RoleLayout>
  );
}
