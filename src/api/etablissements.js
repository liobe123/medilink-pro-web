import { api } from './client';

export async function getAllEtablissements() {
  const { data } = await api.get('/api/etablissements');
  return data;
}

export async function getEtablissement(id) {
  const { data } = await api.get(`/api/etablissements/${id}`);
  return data;
}

export async function createEtablissement(payload) {
  const { data } = await api.post('/api/etablissements', payload);
  return data;
}

export async function updateEtablissement(id, payload) {
  const { data } = await api.put(`/api/etablissements/${id}`, payload);
  return data;
}

export async function deleteEtablissement(id) {
  await api.delete(`/api/etablissements/${id}`);
}
