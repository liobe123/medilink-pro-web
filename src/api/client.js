import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const TOKEN_KEY = 'medilinkpro_token';
export const USER_KEY = 'medilinkpro_user';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // evite les requetes "pendues" sur reseau mobile instable
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injecte automatiquement le token JWT stocke en session sur chaque requete sortante.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si le token est expire ou invalide, l'API renvoie 401 : on deconnecte proprement.
// La route /api/auth/login renvoie aussi 401 en cas de mauvais identifiants :
// on l'exclut pour ne pas recharger la page de connexion et perdre le message d'erreur.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith('/api/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/connexion') {
        window.location.href = '/connexion?expiree=1';
      }
    }
    return Promise.reject(error);
  }
);
