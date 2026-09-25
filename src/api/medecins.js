import { api } from './client';

export async function searchMedecins({ specialite, lat, lng } = {}) {
  const params = {};
  if (specialite) params.specialite = specialite;
  if (lat != null) params.lat = lat;
  if (lng != null) params.lng = lng;
  const { data } = await api.get('/api/medecins/recherche', { params });
  return data;
}

export async function getAllMedecins() {
  const { data } = await api.get('/api/medecins');
  return data;
}

export async function getMedecin(medecinId) {
  const { data } = await api.get(`/api/medecins/${medecinId}`);
  return data;
}

export async function updateMedecin(medecinId, payload) {
  const { data } = await api.put(`/api/medecins/${medecinId}`, payload);
  return data;
}

export async function deleteMedecin(medecinId) {
  await api.delete(`/api/medecins/${medecinId}`);
}

/**
 * Heures deja reservees chez un medecin pour une date (YYYY-MM-DD), sans
 * information sur les patients. Accessible a tous les roles.
 */
export async function getCreneauxOccupes(medecinId, date) {
  const { data } = await api.get(`/api/medecins/${medecinId}/creneaux-occupes`, { params: { date } });
  return data;
}
