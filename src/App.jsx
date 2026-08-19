import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/marketing/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Espace Patient
import PatientLayout from './layouts/PatientLayout';
import DashboardPage from './pages/patient/DashboardPage';
import DossierMedicalPage from './pages/patient/DossierMedicalPage';
import RechercheMedecinsPage from './pages/patient/RechercheMedecinsPage';
import NouveauRendezVousPage from './pages/patient/NouveauRendezVousPage';
import RendezVousListPage from './pages/patient/RendezVousListPage';

// Espace Medecin
import MedecinLayout from './layouts/MedecinLayout';
import MedecinDashboardPage from './pages/medecin/MedecinDashboardPage';
import MedecinAgendaPage from './pages/medecin/MedecinAgendaPage';
import MedecinPatientsPage from './pages/medecin/MedecinPatientsPage';
import MedecinConsultationsPage from './pages/medecin/MedecinConsultationsPage';
import MedecinProfilPage from './pages/medecin/MedecinProfilPage';

// Espace Secretaire
import SecretaireLayout from './layouts/SecretaireLayout';
import SecretaireDashboardPage from './pages/secretaire/SecretaireDashboardPage';
import SecretaireAgendaPage from './pages/secretaire/SecretaireAgendaPage';
import SecretairePatientsPage from './pages/secretaire/SecretairePatientsPage';
import SecretaireEtablissementsPage from './pages/secretaire/SecretaireEtablissementsPage';

// Espace Directeur
import DirecteurLayout from './layouts/DirecteurLayout';
import DirecteurDashboardPage from './pages/directeur/DirecteurDashboardPage';
import DirecteurEtablissementsPage from './pages/directeur/DirecteurEtablissementsPage';
import DirecteurMedecinsPage from './pages/directeur/DirecteurMedecinsPage';
import DirecteurPatientsPage from './pages/directeur/DirecteurPatientsPage';

// Espace Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminComptesPage from './pages/admin/AdminComptesPage';
import AdminEtablissementsPage from './pages/admin/AdminEtablissementsPage';

function Espace({ role, Layout, children }) {
  return (
    <ProtectedRoute allowedRoles={[role]}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />

          {/* Espace Patient */}
          <Route path="/patient" element={<Espace role="PATIENT" Layout={PatientLayout}><DashboardPage /></Espace>} />
          <Route path="/patient/dossier" element={<Espace role="PATIENT" Layout={PatientLayout}><DossierMedicalPage /></Espace>} />
          <Route path="/patient/recherche" element={<Espace role="PATIENT" Layout={PatientLayout}><RechercheMedecinsPage /></Espace>} />
          <Route path="/patient/rendez-vous" element={<Espace role="PATIENT" Layout={PatientLayout}><RendezVousListPage /></Espace>} />
          <Route path="/patient/rendez-vous/nouveau/:medecinId" element={<Espace role="PATIENT" Layout={PatientLayout}><NouveauRendezVousPage /></Espace>} />

          {/* Espace Medecin */}
          <Route path="/medecin" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinDashboardPage /></Espace>} />
          <Route path="/medecin/agenda" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinAgendaPage /></Espace>} />
          <Route path="/medecin/patients" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinPatientsPage /></Espace>} />
          <Route path="/medecin/consultations" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinConsultationsPage /></Espace>} />
          <Route path="/medecin/profil" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinProfilPage /></Espace>} />

          {/* Espace Secretaire */}
          <Route path="/secretaire" element={<Espace role="SECRETAIRE" Layout={SecretaireLayout}><SecretaireDashboardPage /></Espace>} />
          <Route path="/secretaire/agenda" element={<Espace role="SECRETAIRE" Layout={SecretaireLayout}><SecretaireAgendaPage /></Espace>} />
          <Route path="/secretaire/patients" element={<Espace role="SECRETAIRE" Layout={SecretaireLayout}><SecretairePatientsPage /></Espace>} />
          <Route path="/secretaire/etablissements" element={<Espace role="SECRETAIRE" Layout={SecretaireLayout}><SecretaireEtablissementsPage /></Espace>} />

          {/* Espace Directeur */}
          <Route path="/directeur" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurDashboardPage /></Espace>} />
          <Route path="/directeur/etablissements" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurEtablissementsPage /></Espace>} />
          <Route path="/directeur/medecins" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurMedecinsPage /></Espace>} />
          <Route path="/directeur/patients" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurPatientsPage /></Espace>} />

          {/* Espace Admin */}
          <Route path="/admin" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminDashboardPage /></Espace>} />
          <Route path="/admin/comptes" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminComptesPage /></Espace>} />
          <Route path="/admin/etablissements" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminEtablissementsPage /></Espace>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
