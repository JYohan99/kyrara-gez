export const NOMBRES_MESES = [
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

export const NOMBRES_DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function esMismoDia(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function esHoy(d: Date): boolean {
  return esMismoDia(d, new Date());
}

export function esAyer(d: Date): boolean {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return esMismoDia(d, ayer);
}

export function formatearFechaAmigable(d: Date): string {
  const dia = d.getDate();
  const mes = NOMBRES_MESES[d.getMonth()].slice(0, 3).toLowerCase();
  const anioActual = new Date().getFullYear();

  if (esHoy(d)) {
    return `Hoy, ${dia} ${mes}`;
  }
  if (esAyer(d)) {
    return `Ayer, ${dia} ${mes}`;
  }

  const indiceDiaSemana = (d.getDay() + 6) % 7;
  const nombreDia = NOMBRES_DIAS_CORTO[indiceDiaSemana];

  if (d.getFullYear() === anioActual) {
    return `${nombreDia}, ${dia} ${mes}`;
  }
  return `${dia} ${mes} ${d.getFullYear()}`;
}

export function obtenerDiasEnMes(anio: number, mes: number): number {
  return new Date(anio, mes + 1, 0).getDate();
}

/**
 * Retorna índice 0 para Lunes, 6 para Domingo.
 */
export function obtenerPrimerDiaMesIndice(anio: number, mes: number): number {
  const diaJs = new Date(anio, mes, 1).getDay();
  return (diaJs + 6) % 7;
}

export function crearFechaSegura(anio: number, mes: number, dia: number): Date {
  const ahora = new Date();
  if (anio === ahora.getFullYear() && mes === ahora.getMonth() && dia === ahora.getDate()) {
    return ahora;
  }
  return new Date(anio, mes, dia, 12, 0, 0, 0);
}

// Alias compatibles
export const MONTH_NAMES = NOMBRES_MESES;
export const DAY_NAMES_SHORT = NOMBRES_DIAS_CORTO;
export const isSameDay = esMismoDia;
export const isToday = esHoy;
export const isYesterday = esAyer;
export const formatFriendlyDate = formatearFechaAmigable;
export const getDaysInMonth = obtenerDiasEnMes;
export const getFirstDayOfMonthIndex = obtenerPrimerDiaMesIndice;
export const createSafeDate = crearFechaSegura;
