/**
 * Extrait un message lisible d'une erreur axios. Le backend renvoie en general
 * ErrorResponse { message, validationErrors: { champ: msg } }.
 */
export function getErrorMessage(err, fallback = 'Une erreur est survenue. Reessayez.') {
  if (!err) return fallback;
  if (err.code === 'ECONNABORTED') return 'Le serveur met trop de temps a repondre. Reessayez.';
  if (!err.response) return 'Serveur injoignable. Verifiez votre connexion internet.';

  const data = err.response.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message) return data.message;
  const fieldErrors = data?.validationErrors || data?.errors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const first = Object.values(fieldErrors)[0];
    if (first) return Array.isArray(first) ? first[0] : String(first);
  }
  if (err.response.status === 403) return "Vous n'avez pas les droits pour cette action.";
  if (err.response.status === 404) return 'Element introuvable.';
  return fallback;
}
