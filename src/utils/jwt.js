/**
 * Lecture du champ "exp" d'un JWT, sans verification de signature (la
 * verification reste le travail du backend). Sert uniquement a deconnecter
 * l'utilisateur cote client des que son token est expire, au lieu d'attendre
 * la premiere requete en 401.
 */
export function getTokenExpiration(token) {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  if (!token) return true;
  const exp = getTokenExpiration(token);
  return exp != null && exp <= Date.now();
}
