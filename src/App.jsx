import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import ProtectedRoute from './components/ProtectedRoute';
import { PageLoader } from './components/ui';

import PatientLayout from './layouts/PatientLayout';
import MedecinLayout from './layouts/MedecinLayout';
import SecretaireLayout from './layouts/SecretaireLayout';
import DirecteurLayout from './layouts/DirecteurLayout';
import AdminLayout from './layouts/AdminLayout';

// Chargement a la demande : un patient ne telecharge plus le code des
// espaces medecin/admin/directeur. Premier affichage plus rapide sur mobile.
const LandingPage = lazy(() => import('./pages/marketing/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const VerifierOrdonnancePage = lazy(() => import('./pages/VerifierOrdonnancePage'));

const DashboardPage = lazy(() => import('./pages/patient/DashboardPage'));
const DossierMedicalPage = lazy(() => import('./pages/patient/DossierMedicalPage'));
const RechercheMedecinsPage = lazy(() => import('./pages/patient/RechercheMedecinsPage'));
const NouveauRendezVousPage = lazy(() => import('./pages/patient/NouveauRendezVousPage'));
const RendezVousListPage = lazy(() => import('./pages/patient/RendezVousListPage'));
const PatientProfilPage = lazy(() => import('./pages/patient/PatientProfilPage'));

const MedecinDashboardPage = lazy(() => import('./pages/medecin/MedecinDashboardPage'));
const MedecinAgendaPage = lazy(() => import('./pages/medecin/MedecinAgendaPage'));
const MedecinPatientsPage = lazy(() => import('./pages/medecin/MedecinPatientsPage'));
const MedecinConsultationsPage = lazy(() => import('./pages/medecin/MedecinConsultationsPage'));
const MedecinProfilPage = lazy(() => import('./pages/medecin/MedecinProfilPage'));

const SecretaireDashboardPage = lazy(() => import('./pages/secretaire/SecretaireDashboardPage'));
const SecretaireAgendaPage = lazy(() => import('./pages/secretaire/SecretaireAgendaPage'));
const SecretaireNouveauRdvPage = lazy(() => import('./pages/secretaire/SecretaireNouveauRdvPage'));
const SecretairePatientsPage = lazy(() => import('./pages/secretaire/SecretairePatientsPage'));
const SecretaireEtablissementsPage = lazy(() => import('./pages/secretaire/SecretaireEtablissementsPage'));

const DirecteurDashboardPage = lazy(() => import('./pages/directeur/DirecteurDashboardPage'));
const DirecteurEtablissementsPage = lazy(() => import('./pages/directeur/DirecteurEtablissementsPage'));
const DirecteurMedecinsPage = lazy(() => import('./pages/directeur/DirecteurMedecinsPage'));
const DirecteurPatientsPage = lazy(() => import('./pages/directeur/DirecteurPatientsPage'));

const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminComptesPage = lazy(() => import('./pages/admin/AdminComptesPage'));
const AdminUtilisateursPage = lazy(() => import('./pages/admin/AdminUtilisateursPage'));
const AdminEtablissementsPage = lazy(() => import('./pages/admin/AdminEtablissementsPage'));

/**
 * "Layout route" : protege l'espace et affiche le layout une seule fois pour
 * toutes ses pages (avant, chaque route recreait ProtectedRoute + Layout).
 */
function Espace({ role, Layout }) {
  return (
    <ProtectedRoute allowedRoles={[role]}>
      <Layout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/connexion" element={<LoginPage />} />
                <Route path="/inscription" element={<RegisterPage />} />
                <Route path="/verifier-ordonnance" element={<VerifierOrdonnancePage />} />

                {/* Espace Patient */}
                <Route path="/patient" element={<Espace role="PATIENT" Layout={PatientLayout} />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="dossier" element={<DossierMedicalPage />} />
                  <Route path="recherche" element={<RechercheMedecinsPage />} />
                  <Route path="rendez-vous" element={<RendezVousListPage />} />
                  <Route path="rendez-vous/nouveau/:medecinId" element={<NouveauRendezVousPage />} />
                  <Route path="profil" element={<PatientProfilPage />} />
                </Route>

                {/* Espace Medecin */}
                <Route path="/medecin" element={<Espace role="MEDECIN" Layout={MedecinLayout} />}>
                  <Route index element={<MedecinDashboardPage />} />
                  <Route path="agenda" element={<MedecinAgendaPage />} />
                  <Route path="patients" element={<MedecinPatientsPage />} />
                  <Route path="consultations" element={<MedecinConsultationsPage />} />
                  <Route path="profil" element={<MedecinProfilPage />} />
                </Route>

                {/* Espace Secretaire */}
                <Route path="/secretaire" element={<Espace role="SECRETAIRE" Layout={SecretaireLayout} />}>
                  <Route index element={<SecretaireDashboardPage />} />
                  <Route path="agenda" element={<SecretaireAgendaPage />} />
                  <Route path="rendez-vous/nouveau" element={<SecretaireNouveauRdvPage />} />
                  <Route path="patients" element={<SecretairePatientsPage />} />
                  <Route path="etablissements" element={<SecretaireEtablissementsPage />} />
                </Route>

                {/* Espace Directeur */}
                <Route path="/directeur" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout} />}>
                  <Route index element={<DirecteurDashboardPage />} />
                  <Route path="etablissements" element={<DirecteurEtablissementsPage />} />
                  <Route path="medecins" element={<DirecteurMedecinsPage />} />
                  <Route path="patients" element={<DirecteurPatientsPage />} />
                </Route>

                {/* Espace Admin */}
                <Route path="/admin" element={<Espace role="ADMIN" Layout={AdminLayout} />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="comptes" element={<AdminComptesPage />} />
                  <Route path="utilisateurs" element={<AdminUtilisateursPage />} />
                  <Route path="etablissements" element={<AdminEtablissementsPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
