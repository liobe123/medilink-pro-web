import { api } from './client';

export async function login({ email, motDePasse }) {
  const { data } = await api.post('/api/auth/login', { email, motDePasse });
  return data;
}

export async function register(payload) {
  const { data } = await api.post('/api/auth/register', payload);
  return data;
}
