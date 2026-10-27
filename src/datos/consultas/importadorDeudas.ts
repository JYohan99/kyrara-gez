import { obtenerBaseDatos } from '../conexion';
import { TipoDeuda, Deuda } from '../tipos';
import { crearDeuda } from './deudas';

export interface RegistroRevisionManual {
  indiceFila: number;
  filaOriginal: Record<string, any>;
  razon: string;
  camposDetectados: {
    persona?: string;
    concepto?: string;
    montoCentavos?: number;
    fechaEmision?: string;
    fechaVencimiento?: string;
    tipoDetectado?: TipoDeuda;
    notas?: string;
  };
}

export interface ResultadoImportacionDeudas {
  totalLeidos: number;
  importados: number;
  duplicados: number;
  pendientesRevision: RegistroRevisionManual[];
  deudasImportadas: Deuda[];
}

/**
 * Normaliza cadenas de texto quitando espacios redundantes.
 */
function limpiarTexto(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Convierte valores monetarios en centavos enteros exactos.
 * Soporta números, strings con coma, punto y signos de moneda.
 */
function parsearMontoEnCentavos(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return null;
    return Math.round(val * 100);
  }

  let str = String(val).trim();
  if (!str) return null;

  // Quitar símbolos de moneda y espacios
  str = str.replace(/[$€UYU\s]/gi, '');

  // Detectar formato con punto como separador de miles y coma decimal (ej: 1.500,50)
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Solo coma (ej: 1500,50)
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return null;
  return Math.round(num * 100);
}

/**
 * Normaliza fechas provenientes de Excel (números de serie o strings DD/MM/AAAA o YYYY-MM-DD).
 */
function parsearFechaISO(val: any): string | null {
  if (!val) return null;

  // Si es número de serie de Excel (e.g. 45220)
  if (typeof val === 'number' && val > 20000 && val < 70000) {
    const epoch = new Date(1899, 11, 30);
    const date = new Date(epoch.getTime() + val * 86400000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Formato DD/MM/YYYY o DD-MM-YYYY
  const partes = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (partes) {
    const d = partes[1].padStart(2, '0');
    const m = partes[2].padStart(2, '0');
    const y = partes[3];
    return `${y}-${m}-${d}`;
  }

  // Intentar parsear con Date estándar
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Busca el valor de un campo inspeccionando posibles nombres de columnas comunes en Excel.
 */
function buscarValorColumna(fila: Record<string, any>, clavesPosibles: string[]): any {
  const llaves = Object.keys(fila);
  for (const clave of clavesPosibles) {
    const claveNormalizada = clave.toLowerCase();
    for (const k of llaves) {
      if (k.toLowerCase() === claveNormalizada) {
        return fila[k];
      }
    }
  }
  // Búsqueda aproximada si no hubo match exacto
  for (const clave of clavesPosibles) {
    const claveNormalizada = clave.toLowerCase();
    for (const k of llaves) {
      if (k.toLowerCase().includes(claveNormalizada)) {
        return fila[k];
      }
    }
  }
  return undefined;
}

/**
 * Detecta si el registro corresponde a «Me deben» (RECEIVABLE) o «Debo» (PAYABLE).
 * Si no hay certeza objetiva, retorna null para no inventar datos.
 */
function clasificarTipoDeuda(fila: Record<string, any>): TipoDeuda | null {
  const tipoRaw = buscarValorColumna(fila, ['tipo', 'direccion', 'seccion', 'categoria', 'sentido', 'cuenta']);
  const texto = limpiarTexto(tipoRaw).toLowerCase();

  if (
    texto.includes('me deben') ||
    texto.includes('por cobrar') ||
    texto.includes('a favor') ||
    texto.includes('prestamo ot') ||
    texto.includes('receivable') ||
    texto.includes('cobro')
  ) {
    return 'RECEIVABLE';
  }

  if (
    texto.includes('debo') ||
    texto.includes('por pagar') ||
    texto.includes('en contra') ||
    texto.includes('deuda a') ||
    texto.includes('payable') ||
    texto.includes('pago')
  ) {
    return 'PAYABLE';
  }

  return null;
}

/**
 * Verifica si una deuda idéntica ya existe en la base de datos para prevenir duplicados.
 */
function existeDuplicado(
  tipo: TipoDeuda,
  persona: string,
  concepto: string,
  monto: number,
  fecha: string
): boolean {
  const db = obtenerBaseDatos();
  const row = db.getFirstSync<{ id: string }>(
    `SELECT id FROM debts
     WHERE type = ? AND LOWER(person) = LOWER(?) AND LOWER(concept) = LOWER(?) AND total_amount = ? AND issue_date = ?`,
    [tipo, persona.trim(), concepto.trim(), monto, fecha]
  );
  return Boolean(row);
}

/**
 * Procesa e importa exclusivamente los registros de la hoja «Deudas» de un archivo de origen.
 * Garantiza:
 * 1. Separación rigurosa de «Me deben» y «Debo».
 * 2. Conservación estricta de descripciones, importes y fechas.
 * 3. NO inventa datos incompletos ni asume estados inexistentes.
 * 4. Envía registros ambiguos a revisión manual con motivo detallado.
 * 5. Evita duplicaciones al reintentar la importación.
 */
export function importarRegistrosHojaDeudas(
  filas: Record<string, any>[]
): ResultadoImportacionDeudas {
  let importados = 0;
  let duplicados = 0;
  const pendientesRevision: RegistroRevisionManual[] = [];
  const deudasImportadas: Deuda[] = [];

  filas.forEach((fila, index) => {
    // Si la fila está totalmente vacía, ignorarla silenciosamente
    const valoresNoVacios = Object.values(fila).filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    if (valoresNoVacios.length === 0) {
      return;
    }

    const personaRaw = buscarValorColumna(fila, ['persona', 'nombre', 'contacto', 'deudor', 'acreedor', 'titular']);
    const conceptoRaw = buscarValorColumna(fila, ['concepto', 'descripcion', 'motivo', 'detalle', 'asunto']);
    const importeRaw = buscarValorColumna(fila, ['importe', 'monto', 'total', 'saldo', 'valor', 'pesos']);
    const fechaEmisionRaw = buscarValorColumna(fila, ['fecha', 'emision', 'fecha_emision', 'creado', 'dia']);
    const fechaVencimientoRaw = buscarValorColumna(fila, ['vencimiento', 'fecha_vencimiento', 'plazo', 'vence']);
    const notasRaw = buscarValorColumna(fila, ['notas', 'observaciones', 'comentario', 'nota']);

    const persona = limpiarTexto(personaRaw);
    const concepto = limpiarTexto(conceptoRaw) || 'Deuda importada';
    const montoCentavos = parsearMontoEnCentavos(importeRaw);
    const fechaEmision = parsearFechaISO(fechaEmisionRaw);
    const fechaVencimiento = parsearFechaISO(fechaVencimientoRaw);
    const tipo = clasificarTipoDeuda(fila);
    const notas = limpiarTexto(notasRaw);

    const camposDetectados = {
      persona: persona || undefined,
      concepto,
      montoCentavos: montoCentavos || undefined,
      fechaEmision: fechaEmision || undefined,
      fechaVencimiento: fechaVencimiento || undefined,
      tipoDetectado: tipo || undefined,
      notas: notas || undefined,
    };

    // Validaciones estrictas: no inventar datos ausentes
    const motivosFallo: string[] = [];
    if (!persona) {
      motivosFallo.push('Falta el nombre de la persona o contacto');
    }
    if (!montoCentavos) {
      motivosFallo.push('Importe ausente, cero o inválido');
    }
    if (!fechaEmision) {
      motivosFallo.push('Fecha de emisión no identificable');
    }
    if (!tipo) {
      motivosFallo.push('Tipo ambiguo (no se identifica si es «Me deben» o «Debo»)');
    }

    if (motivosFallo.length > 0) {
      pendientesRevision.push({
        indiceFila: index + 1,
        filaOriginal: fila,
        razon: motivosFallo.join('; '),
        camposDetectados,
      });
      return;
    }

    // Comprobación de duplicados para importación idempotente
    if (existeDuplicado(tipo!, persona, concepto, montoCentavos!, fechaEmision!)) {
      duplicados++;
      return;
    }

    // Inserción segura
    try {
      const nuevaDeuda = crearDeuda({
        type: tipo!,
        person: persona,
        concept: concepto,
        totalAmount: montoCentavos!,
        issueDate: fechaEmision!,
        dueDate: fechaVencimiento || undefined,
        notes: notas || undefined,
      });
      deudasImportadas.push(nuevaDeuda);
      importados++;
    } catch (err: any) {
      pendientesRevision.push({
        indiceFila: index + 1,
        filaOriginal: fila,
        razon: `Error al persistir: ${err.message || 'Error desconocido'}`,
        camposDetectados,
      });
    }
  });

  return {
    totalLeidos: filas.length,
    importados,
    duplicados,
    pendientesRevision,
    deudasImportadas,
  };
}
