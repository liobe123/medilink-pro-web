import { LayoutDashboard, CalendarHeart, Users, Building2 } from 'lucide-react';
import RoleLayout from '../layouts/RoleLayout';

const NAV_ITEMS = [
  { to: '/secretaire', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/secretaire/agenda', label: 'Agenda', icon: CalendarHeart },
  { to: '/secretaire/patients', label: 'Patients', icon: Users },
  { to: '/secretaire/etablissements', label: 'Etablissements', icon: Building2 },
];

export default function SecretaireLayout({ children }) {
  return (
    <RoleLayout navItems={NAV_ITEMS} roleLabel="Espace secretariat">
      {children}
    </RoleLayout>
  );
}
