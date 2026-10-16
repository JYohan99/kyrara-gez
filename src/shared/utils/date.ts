export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function isYesterday(d: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(d, yesterday);
}

export function formatFriendlyDate(d: Date): string {
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()].slice(0, 3).toLowerCase();
  const currentYear = new Date().getFullYear();

  if (isToday(d)) {
    return `Hoy, ${day} ${month}`;
  }
  if (isYesterday(d)) {
    return `Ayer, ${day} ${month}`;
  }

  const dayOfWeekIndex = (d.getDay() + 6) % 7;
  const dayName = DAY_NAMES_SHORT[dayOfWeekIndex];

  if (d.getFullYear() === currentYear) {
    return `${dayName}, ${day} ${month}`;
  }
  return `${day} ${month} ${d.getFullYear()}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Returns index 0 for Monday, 6 for Sunday.
 */
export function getFirstDayOfMonthIndex(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay();
  return (jsDay + 6) % 7;
}

export function createSafeDate(year: number, month: number, day: number): Date {
  const now = new Date();
  if (year === now.getFullYear() && month === now.getMonth() && day === now.getDate()) {
    return now;
  }
  return new Date(year, month, day, 12, 0, 0, 0);
}
