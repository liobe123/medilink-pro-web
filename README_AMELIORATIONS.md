# MediLinkPro — Frontend ameliore

Remplacez votre dossier `src/` par celui de cette archive. Aucune nouvelle
dependance npm : tout repose sur react, react-router-dom, axios, lucide-react
et Tailwind v4, deja presents dans votre projet.

## Corrections de bugs
- `TextInput` / `Select` / `Textarea` : la prop `className` ecrasait tout le style de base.
- Profil medecin : chargement infini si l'API echouait.
- Erreurs API ignorees (catch vides) : elles sont maintenant affichees (toasts, etats d'erreur avec "Reessayer").
- Suppressions et annulations sans confirmation.
- `<Link><Button>` (HTML invalide) remplace par `ButtonLink`.
- Date minimale de reservation calculee en UTC (decalage d'un jour la nuit au Cameroun).
- Token expire non detecte au chargement ; utilisateur "connecte" sans token.
- La route `/api/auth/login` en 401 rechargeait la page et effacait le message d'erreur.
- Message d'erreur de connexion qui restait affiche d'une page a l'autre.
- Pas de page 404.

## Nouvelles fonctionnalites
Transversal : toasts, confirmations, modales accessibles, hook `useApi`,
chargement des pages a la demande (React.lazy), routes imbriquees,
deconnexion automatique a l'expiration du JWT, retour a la page demandee apres
connexion, titres d'onglet, impression.

- Patient : grille de creneaux (creneaux pris grises), export agenda (.ics),
  onglets a venir / passes / annules, delai d'annulation de 2 h, dossier avec
  ordonnances + impression, recherche avec filtres / tri / itineraire / appel,
  page "Mon profil" (`/patient/profil`).
- Medecin : tableau de bord chiffre + programme du jour, agenda filtrable
  groupe par jour, redaction d'ordonnances, compte rendu depuis un RDV (RDV
  passe automatiquement a TERMINE), historique d'un patient, geolocalisation.
- Secretaire : prise de RDV au guichet (`/secretaire/rendez-vous/nouveau`),
  salle d'attente du jour, recherches.
- Directeur : statistiques (taux de verification, repartition par specialite
  et par etablissement), filtres medecins.
- Admin : validation groupee, motifs de refus predefinis, page "Utilisateurs"
  (`/admin/utilisateurs`) : suspendre / reactiver / reexaminer.

## Alignement avec le backend (version 2)
Le frontend utilise maintenant les formats reels du backend ameliore :
- ordonnance envoyee sous forme `lignes` [{nom, posologie, duree}] ; affichage de la validite
  et du code de verification ;
- creneaux lus via `GET /api/medecins/{id}/creneaux-occupes` (plus l'agenda complet du medecin),
  avec la meme regle de chevauchement de 30 min que le serveur ;
- consultation creee avec `rendezVousId` : le serveur cloture le RDV ;
- messages de validation lus dans `validationErrors` ;
- profil patient : allergies et antecedents ; affiches dans le dossier et dans l'historique
  consulte par le medecin ;
- tableau de bord directeur : `GET /api/dashboard/statistiques` ;
- nouvelle page publique `/verifier-ordonnance` pour les pharmacies.

## Nouveaux fichiers principaux
- `components/` : Toast, ConfirmDialog, Modal, RendezVousAgenda, SlotPicker,
  OrdonnanceForm, OrdonnanceView, PatientHistoriqueModal, GeolocButton,
  EtablissementCard
- `hooks/` : useApi, useDocumentTitle
- `utils/` : format, constants, errors, jwt, ics
- `pages/` : NotFoundPage, VerifierOrdonnancePage, patient/PatientProfilPage,
  secretaire/SecretaireNouveauRdvPage, admin/AdminUtilisateursPage
