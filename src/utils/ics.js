/**
 * Genere et telecharge un fichier .ics (compatible Google Agenda, Outlook,
 * calendrier iPhone/Android) pour un rendez-vous.
 */
function toIcsDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
}

function escapeIcs(text) {
  return (text || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function downloadRendezVousIcs(rdv, dureeMinutes = 30) {
  const debut = new Date(rdv.dateHeure);
  const fin = new Date(debut.getTime() + dureeMinutes * 60000);
  const titre = `Rendez-vous Dr ${rdv.medecinNomComplet || ''}`.trim();
  const description = [
    rdv.specialiteMedecin,
    rdv.type === 'TELECONSULTATION' ? 'Teleconsultation' : 'Consultation physique',
    'Reserve via MediLinkPro',
  ].filter(Boolean).join(' - ');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediLinkPro//RDV//FR',
    'BEGIN:VEVENT',
    `UID:rdv-${rdv.id}@medilinkpro`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(debut)}`,
    `DTEND:${toIcsDate(fin)}`,
    `SUMMARY:${escapeIcs(titre)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    rdv.etablissementNom ? `LOCATION:${escapeIcs(rdv.etablissementNom)}` : null,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Rappel rendez-vous medical',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rendez-vous-${rdv.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
