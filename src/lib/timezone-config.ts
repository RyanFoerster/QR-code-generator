// Configuration globale des fuseaux horaires pour l'application

export const TIMEZONE_CONFIG = {
  // Fuseau horaire principal de l'application
  DEFAULT_TIMEZONE: "Europe/Brussels", // ou 'Europe/Paris'

  // Format de date par défaut
  DEFAULT_DATE_FORMAT: "fr-BE", // ou 'fr-FR'
};

// Fonction pour convertir une date UTC en heure locale
export function toLocalTime(utcDate: string | Date): Date {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return new Date(
    date.toLocaleString("en-US", { timeZone: TIMEZONE_CONFIG.DEFAULT_TIMEZONE })
  );
}

// Fonction pour convertir une date locale en UTC pour la base de données
export function toUTC(localDate: Date): Date {
  return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
}

// Fonction pour formater une date selon votre fuseau horaire
export function formatLocalDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE_CONFIG.DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return new Intl.DateTimeFormat(
    TIMEZONE_CONFIG.DEFAULT_DATE_FORMAT,
    defaultOptions
  ).format(dateObj);
}

// Fonction pour vérifier si une date est dans le futur (en tenant compte du fuseau horaire)
export function isFutureDate(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  // Convertir les deux dates dans le même fuseau horaire pour la comparaison
  const localDate = toLocalTime(dateObj);
  const localNow = toLocalTime(now);

  return localDate > localNow;
}

// Fonction pour obtenir l'heure actuelle dans le fuseau horaire configuré
export function getCurrentLocalTime(): Date {
  return toLocalTime(new Date());
}
