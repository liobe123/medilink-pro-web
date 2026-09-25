import { api } from './client';

/** Indicateurs agreges (DIRECTEUR, ADMIN). */
export async function getStatistiques() {
  const { data } = await api.get('/api/dashboard/statistiques');
  return data;
}
