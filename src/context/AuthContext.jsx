import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import * as authApi from '../api/auth';
import { TOKEN_KEY, USER_KEY } from '../api/client';
import { getErrorMessage } from '../utils/errors';
import { getTokenExpiration, isTokenExpired } from '../utils/jwt';

const AuthContext = createContext(null);

function clearStorage() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function readStoredUser() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    // Un utilisateur sans token valide n'est pas considere comme connecte
    // (avant : un "user" orphelin en session suffisait a passer ProtectedRoute).
    if (isTokenExpired(token)) {
      clearStorage();
      return null;
    }
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const persistSession = useCallback((authResponse) => {
    const { token, ...userInfo } = authResponse;
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const logout = useCallback(() => {
    clearStorage();
    setUser(null);
  }, []);

  // Deconnexion automatique a l'expiration du token.
  useEffect(() => {
    if (!user) return undefined;
    const exp = getTokenExpiration(sessionStorage.getItem(TOKEN_KEY));
    if (!exp) return undefined;
    const delay = exp - Date.now();
    if (delay <= 0) { logout(); return undefined; }
    // setTimeout est limite a ~24,8 jours
    const timer = setTimeout(logout, Math.min(delay, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [user, logout]);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      persistSession(response);
      return response;
    } catch (err) {
      setError(err.response?.status === 401
        ? 'Email ou mot de passe incorrect.'
        : getErrorMessage(err, 'Email ou mot de passe incorrect.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(payload);
      // Patient et Admin recoivent un token et sont connectes immediatement.
      // Medecin, Secretaire et Directeur passent par une validation admin :
      // aucun token n'est emis, on ne connecte donc pas l'utilisateur.
      if (response.token) {
        persistSession(response);
      }
      return response;
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de creer le compte.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  /** Met a jour les infos affichees (ex. nom modifie depuis la page profil). */
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      sessionStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    user, loading, error, login, register, logout, clearError, updateUser, isAuthenticated: !!user,
  }), [user, loading, error, login, register, logout, clearError, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise a l'interieur de AuthProvider");
  return ctx;
}
