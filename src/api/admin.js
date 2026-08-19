import { api } from './client';

export async function getComptesEnAttente(role) {
  const { data } = await api.get('/api/admin/comptes-en-attente', {
    params: role ? { role } : {},
  });
  return data;
}

export async function validerCompte(id, { approuve, motifRejet }) {
  const { data } = await api.patch(`/api/admin/comptes/${id}/valider`, { approuve, motifRejet });
  return data;
}

export async function remettreEnAttente(id) {
  const { data } = await api.patch(`/api/admin/comptes/${id}/remettre-en-attente`);
  return data;
}

export async function toggleActif(id) {
  const { data } = await api.patch(`/api/admin/comptes/${id}/toggle-actif`);
  return data;
}
