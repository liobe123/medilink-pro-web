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
