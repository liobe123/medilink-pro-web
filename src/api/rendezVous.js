import { api } from './client';

export async function getAllRendezVous() {
  const { data } = await api.get('/api/rendez-vous');
  return data;
}

export async function getRendezVousByPatient(patientId) {
  const { data } = await api.get(`/api/rendez-vous/patient/${patientId}`);
  return data;
}

export async function getRendezVousByMedecin(medecinId) {
  const { data } = await api.get(`/api/rendez-vous/medecin/${medecinId}`);
  return data;
}

export async function createRendezVous(payload) {
  const { data } = await api.post('/api/rendez-vous', payload);
  return data;
}

export async function updateStatutRendezVous(id, statut) {
  const { data } = await api.patch(`/api/rendez-vous/${id}/statut`, { statut });
  return data;
}

export async function deleteRendezVous(id) {
  await api.delete(`/api/rendez-vous/${id}`);
}
