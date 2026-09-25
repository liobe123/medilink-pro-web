/** Referentiels partages entre les pages (statuts, groupes sanguins, types). */

export const STATUTS_RDV = ['EN_ATTENTE', 'CONFIRME', 'TERMINE', 'ANNULE', 'NO_SHOW'];

export const STATUT_RDV_LABELS = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirme',
  ANNULE: 'Annule',
  TERMINE: 'Termine',
  NO_SHOW: 'Absence',
};

export const TYPES_CONSULTATION = [
  { value: 'PHYSIQUE', label: 'Consultation physique' },
  { value: 'TELECONSULTATION', label: 'Teleconsultation' },
];

export const GROUPES_SANGUINS = [
  '', 'A_POSITIF', 'A_NEGATIF', 'B_POSITIF', 'B_NEGATIF',
  'AB_POSITIF', 'AB_NEGATIF', 'O_POSITIF', 'O_NEGATIF', 'INCONNU',
];

export const GROUPE_LABELS = {
  '': 'Je ne sais pas',
  A_POSITIF: 'A+', A_NEGATIF: 'A-',
  B_POSITIF: 'B+', B_NEGATIF: 'B-',
  AB_POSITIF: 'AB+', AB_NEGATIF: 'AB-',
  O_POSITIF: 'O+', O_NEGATIF: 'O-',
  INCONNU: 'Inconnu',
};

/** Creneaux proposes a la reservation (debut inclus, fin exclue). */
export const HORAIRES_CABINET = { debut: 8, fin: 18, pasMinutes: 30 };
