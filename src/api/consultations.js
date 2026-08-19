import { api } from './client';

export async function getConsultationsByMedecin(medecinId) {
  const { data } = await api.get(`/api/consultations/medecin/${medecinId}`);
  return data;
}

export async function getConsultationsByPatient(patientId) {
  const { data } = await api.get(`/api/consultations/patient/${patientId}`);
  return data;
}

export async function getAllConsultations() {
  const { data } = await api.get('/api/consultations');
  return data;
}

export async function createConsultation(payload) {
  const { data } = await api.post('/api/consultations', payload);
  return data;
}

export async function deleteConsultation(id) {
  await api.delete(`/api/consultations/${id}`);
}
