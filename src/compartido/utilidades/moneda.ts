/**
 * Formatea centavos a texto de moneda con símbolo.
 * Ejemplo: 14285000 -> "$ 142.850,00"
 */
export interface OpcionesFormateoMoneda {
  moneda?: string;
  currency?: string;
  mostrarDecimales?: boolean;
  showDecimals?: boolean;
  oculto?: boolean;
  hidden?: boolean;
}

export function formatearMoneda(
  centavos: number,
  opciones?: OpcionesFormateoMoneda
): string {
  if (opciones?.oculto || opciones?.hidden) {
    return '••••••••';
  }

  const esNegativo = centavos < 0;
  const centavosAbs = Math.abs(centavos);
  const unidades = Math.floor(centavosAbs / 100);
  const residuo = centavosAbs % 100;

  // Formatear unidades con puntos: 142850 -> "142.850"
  const unidadesStr = unidades.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  let resultado = unidadesStr;
  const debeMostrarDecimales = opciones?.mostrarDecimales ?? opciones?.showDecimals;
  if (debeMostrarDecimales !== false) {
    const decimalesStr = residuo.toString().padStart(2, '0');
    resultado += `,${decimalesStr}`;
  }

  const signo = esNegativo ? '- ' : '';
  const mon = opciones?.moneda || opciones?.currency;
  const simboloMoneda = mon === 'USD' ? 'US$ ' : '$ ';

  return `${signo}${simboloMoneda}${resultado}`;
}

/**
 * Formatea el texto introducido por el usuario en tiempo real con separador de miles '.' y coma decimal ','.
 */
export function formatearEntradaDinero(entrada: string): string {
  if (!entrada) return '';

  let tieneComa = entrada.includes(',');
  let texto = entrada;

  if (!tieneComa && texto.includes('.')) {
    const ultimoPunto = texto.lastIndexOf('.');
    const despuesPunto = texto.substring(ultimoPunto + 1);
    if (despuesPunto.length <= 2) {
      texto = texto.substring(0, ultimoPunto) + ',' + despuesPunto;
      tieneComa = true;
    }
  }

  if (tieneComa) {
    const indiceComa = texto.indexOf(',');
    const parteEnteraBruta = texto.substring(0, indiceComa);
    const parteDecimalBruta = texto.substring(indiceComa + 1);

    const digitosEnteros = parteEnteraBruta.replace(/\D/g, '');
    const enteroLimpio = digitosEnteros ? digitosEnteros.replace(/^0+(?=\d)/, '') : '0';
    const enteroFormateado = enteroLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    const decimalLimpio = parteDecimalBruta.replace(/\D/g, '').slice(0, 2);

    return `${enteroFormateado},${decimalLimpio}`;
  }

  const digitos = texto.replace(/\D/g, '');
  if (!digitos) return '';
  const limpio = digitos.replace(/^0+(?=\d)/, '');
  return limpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Convierte el texto de entrada del usuario en centavos enteros.
 */
export function convertirMontoACentavos(entrada: string): number {
  if (!entrada) return 0;
  const limpio = entrada.replace(/[\$\s]/g, '');
  if (!limpio) return 0;

  if (limpio.includes(',')) {
    const [parteEntera, parteDecimal = ''] = limpio.split(',');
    const unidades = parseInt(parteEntera.replace(/\D/g, '') || '0', 10);
    const decimales = parseInt((parteDecimal.replace(/\D/g, '') + '00').slice(0, 2), 10);
    return unidades * 100 + decimales;
  }

  const unidades = parseInt(limpio.replace(/\D/g, '') || '0', 10);
  return unidades * 100;
}

// Alias compatibles para no romper nada
export const formatCurrency = (
  cents: number,
  options?: { currency?: string; showDecimals?: boolean; hidden?: boolean }
) =>
  formatearMoneda(cents, {
    moneda: options?.currency,
    mostrarDecimales: options?.showDecimals,
    oculto: options?.hidden,
  });

export const formatMoneyInput = formatearEntradaDinero;
export const parseAmountToCents = convertirMontoACentavos;
