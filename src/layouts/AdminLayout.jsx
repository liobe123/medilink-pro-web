import { LayoutDashboard, UserCheck, Building2 } from 'lucide-react';
import RoleLayout from '../layouts/RoleLayout';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/comptes', label: 'Comptes en attente', icon: UserCheck },
  { to: '/admin/etablissements', label: 'Etablissements', icon: Building2 },
];

export default function AdminLayout({ children }) {
  return (
    <RoleLayout navItems={NAV_ITEMS} roleLabel="Administration">
      {children}
    </RoleLayout>
  );
}
