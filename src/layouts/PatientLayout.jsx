import { LayoutDashboard, CalendarHeart, MapPinned, FileHeart, UserCog } from 'lucide-react';
import RoleLayout from './RoleLayout';

const NAV_ITEMS = [
  { to: '/patient', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/patient/dossier', label: 'Mon dossier', icon: FileHeart },
  { to: '/patient/recherche', label: 'Trouver un specialiste', icon: MapPinned },
  { to: '/patient/rendez-vous', label: 'Mes rendez-vous', icon: CalendarHeart },
  { to: '/patient/profil', label: 'Mon profil', icon: UserCog },
];

export default function PatientLayout({ children }) {
  return <RoleLayout navItems={NAV_ITEMS} roleLabel="Espace patient">{children}</RoleLayout>;
}
