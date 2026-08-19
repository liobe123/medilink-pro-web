import { LayoutDashboard, Building2, Stethoscope, Users } from 'lucide-react';
import RoleLayout from '../layouts/RoleLayout';

const NAV_ITEMS = [
  { to: '/directeur', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/directeur/etablissements', label: 'Etablissements', icon: Building2 },
  { to: '/directeur/medecins', label: 'Medecins', icon: Stethoscope },
  { to: '/directeur/patients', label: 'Patients', icon: Users },
];

export default function DirecteurLayout({ children }) {
  return (
    <RoleLayout navItems={NAV_ITEMS} roleLabel="Espace direction">
      {children}
    </RoleLayout>
  );
}
