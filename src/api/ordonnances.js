import { api } from './client';

export async function getAllOrdonnances() {
  const { data } = await api.get('/api/ordonnances');
  return data;
}

export async function getOrdonnancesByPatient(patientId) {
  const { data } = await api.get(`/api/ordonnances/patient/${patientId}`);
  return data;
}

export async function createOrdonnance(payload) {
  const { data } = await api.post('/api/ordonnances', payload);
  return data;
}

/**
 * Corps envoye a POST /api/ordonnances (OrdonnanceRequest cote backend).
 * Le medecin et le patient sont deduits de la consultation par le serveur.
 */
export function toOrdonnancePayload({ consultationId, medicaments, instructions, dureeValiditeJours }) {
  return {
    consultationId,
    lignes: medicaments
      .filter((m) => m.nom.trim())
      .map((m) => ({ nom: m.nom.trim(), posologie: m.posologie.trim() || null, duree: m.duree.trim() || null })),
    instructions: instructions?.trim() || null,
    dureeValiditeJours: dureeValiditeJours ? Number(dureeValiditeJours) : null,
  };
}

/**
 * Lignes de l'ordonnance : format structure ("lignes") en priorite, sinon le
 * texte libre historique ("medicaments", une ligne par medicament).
 */
export function readMedicaments(ordonnance) {
  if (Array.isArray(ordonnance?.lignes) && ordonnance.lignes.length > 0) {
    return ordonnance.lignes.map((l) => ({ nom: l.nom, posologie: l.posologie || '', duree: l.duree || '' }));
  }
  const texte = ordonnance?.medicaments;
  if (!texte) return [];
  const lignes = texte.split(/\n|;/).map((s) => s.trim()).filter(Boolean).map((nom) => ({ nom }));
  // Ancienne posologie globale en texte libre : rattachee a la premiere ligne.
  if (ordonnance.posologie && lignes.length === 1) lignes[0].posologie = ordonnance.posologie;
  return lignes;
}

/** Code court a presenter en pharmacie (ordonnances recentes) ou, a defaut, code QR. */
export function readCodeVerification(ordonnance) {
  return ordonnance?.codeVerification || ordonnance?.codeQr || null;
}

/** Verification publique d'une ordonnance (pharmacie, sans compte). */
export async function verifierOrdonnance(code) {
  const { data } = await api.get(`/api/ordonnances/verification/${encodeURIComponent(code.trim())}`);
  return data;
}
