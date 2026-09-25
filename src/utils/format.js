/**
 * Fonctions de formatage partagees (dates, montants, noms).
 * Centralisees ici pour eviter la duplication qui existait dans chaque page.
 */

export function formatDate(iso, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', options);
}

export function formatHeure(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateHeure(iso, { withYear = false } = {}) {
  const d = new Date(iso);
  return {
    jour: d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', ...(withYear && { year: 'numeric' }),
    }),
    heure: formatHeure(iso),
  };
}

/** 15000 -> "15 000 FCFA" */
export function formatTarif(montant) {
  if (montant == null || montant === '') return null;
  return `${Number(montant).toLocaleString('fr-FR')} FCFA`;
}

export function initiales(prenom, nom) {
  return `${prenom?.charAt(0) || ''}${nom?.charAt(0) || ''}`.toUpperCase() || '?';
}

export function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

export function isToday(iso) {
  return isSameDay(iso, new Date());
}

/**
 * Date locale au format YYYY-MM-DD (pour les <input type="date">).
 * toISOString() renvoie la date UTC : a Douala (UTC+1) cela decale le jour
 * entre minuit et 1h du matin, d'ou cette version locale.
 */
export function toLocalDateInput(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Cle "YYYY-MM-DDTHH:mm" en heure locale, pour comparer des creneaux. */
export function toSlotKey(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${toLocalDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Normalise une chaine pour la recherche (minuscules, sans accents). */
export function normalize(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesSearch(query, ...fields) {
  const q = normalize(query);
  if (!q) return true;
  return fields.some((f) => normalize(f).includes(q));
}
