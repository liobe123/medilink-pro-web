import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injecte automatiquement le token JWT stocke en session sur chaque requete sortante.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('medilinkpro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si le token est expire ou invalide, l'API renvoie 401 : on deconnecte proprement.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('medilinkpro_token');
      sessionStorage.removeItem('medilinkpro_user');
      if (window.location.pathname !== '/connexion') {
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);
