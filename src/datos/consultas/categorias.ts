import { obtenerBaseDatos } from '../conexion';
import { Categoria } from '../tipos';
import { emitirCambioBoveda } from '../sincronizacion';
import { CATEGORIAS_PREDETERMINADAS } from '../semillas';

export const ORDEN_GRUPOS: string[] = [
  // --- Gastos ---
  'Alimentación y Consumo',
  'Vivienda e Inmuebles',
  'Conectividad y Digital',
  'Transporte y Movilidad',
  'Salud y Bienestar',
  'Educación y Familia',
  'Ocio y Vida Social',
  'Negocio, Taller y Comercio',
  'Finanzas y Obligaciones',

  // --- Ingresos ---
  'Ventas y Comercio',
  'Trabajo y Empleo',
  'Rentas e Inversiones',
  'Otros Ingresos',
];

// Generado automáticamente desde semillas.ts (¡no requiere duplicar nombres a mano!)
export const GRUPOS_CATEGORIAS: Record<string, string> = Object.fromEntries(
  CATEGORIAS_PREDETERMINADAS.map(c => [c.name, c.group])
);

export function obtenerGrupoCategoria(nombre: string): string {
  if (!nombre) return 'General';

  // 1. Coincidencia directa
  if (GRUPOS_CATEGORIAS[nombre]) {
    return GRUPOS_CATEGORIAS[nombre];
  }

  // 2. Coincidencia insensible a mayúsculas/minúsculas y espacios
  const nombreLimpio = nombre.trim().toLowerCase();
  for (const [clave, grupo] of Object.entries(GRUPOS_CATEGORIAS)) {
    if (clave.trim().toLowerCase() === nombreLimpio) {
      return grupo;
    }
  }

  // 3. Coincidencia por inclusión (ej: si se acorta "Electricidad y Luz" a "Luz")
  for (const [clave, grupo] of Object.entries(GRUPOS_CATEGORIAS)) {
    const claveLimpia = clave.trim().toLowerCase();
    if (
      (nombreLimpio.length >= 3 && claveLimpia.includes(nombreLimpio)) ||
      (claveLimpia.length >= 3 && nombreLimpio.includes(claveLimpia))
    ) {
      return grupo;
    }
  }

  return 'General';
}

export function obtenerCategorias(flowType?: 'EXPENSE' | 'INCOME', soloActivas = false): Categoria[] {
  const db = obtenerBaseDatos();
  let query = 'SELECT * FROM categories';
  const condiciones: string[] = [];
  const params: string[] = [];

  if (flowType) {
    condiciones.push('flow_type = ?');
    params.push(flowType);
  }
  if (soloActivas) {
    condiciones.push('(is_active = 1 OR is_active IS NULL)');
  }

  if (condiciones.length > 0) {
    query += ' WHERE ' + condiciones.join(' AND ');
  }

  query += ' ORDER BY name ASC';

  const rows = db.getAllSync<{
    id: string;
    name: string;
    flow_type: 'EXPENSE' | 'INCOME';
    icon: string;
    color: string;
    is_system: number;
    is_active?: number;
  }>(query, params);

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    flowType: r.flow_type,
    icon: r.icon,
    color: r.color,
    isSystem: r.is_system === 1,
    isActive: r.is_active === undefined ? true : r.is_active === 1,
  }));
}

export function activarCategoria(id: string, activa: boolean): void {
  const db = obtenerBaseDatos();
  db.runSync('UPDATE categories SET is_active = ? WHERE id = ?', [activa ? 1 : 0, id]);
  emitirCambioBoveda();
}

export function activarTodasCategorias(flowType?: 'EXPENSE' | 'INCOME', activa: boolean = true): void {
  const db = obtenerBaseDatos();
  if (flowType) {
    db.runSync('UPDATE categories SET is_active = ? WHERE flow_type = ?', [activa ? 1 : 0, flowType]);
  } else {
    db.runSync('UPDATE categories SET is_active = ?', [activa ? 1 : 0]);
  }
  emitirCambioBoveda();
}

export function activarGrupoCategorias(nombres: string[], activa: boolean): void {
  if (nombres.length === 0) return;
  const db = obtenerBaseDatos();
  const placeholders = nombres.map(() => '?').join(',');
  db.runSync(
    `UPDATE categories SET is_active = ? WHERE name IN (${placeholders})`,
    [activa ? 1 : 0, ...nombres]
  );
  emitirCambioBoveda();
}

export function obtenerFrecuenciaUsoCategorias(): Record<string, number> {
  const db = obtenerBaseDatos();
  try {
    const rows = db.getAllSync<{ category_id: string; total_count: number }>(
      `SELECT category_id, COUNT(*) as total_count
       FROM transactions
       WHERE category_id IS NOT NULL AND category_id != ''
       GROUP BY category_id
       ORDER BY total_count DESC`
    );
    const mapa: Record<string, number> = {};
    for (const r of rows) {
      mapa[r.category_id] = r.total_count;
    }
    return mapa;
  } catch {
    return {};
  }
}

export function crearCategoria(data: {
  name: string;
  flowType: 'EXPENSE' | 'INCOME';
  icon?: string;
  color?: string;
}): Categoria {
  const db = obtenerBaseDatos();
  const id = 'cat_' + Math.random().toString(36).substring(2, 10);
  const icon = data.icon || (data.flowType === 'INCOME' ? 'payments' : 'shopping-bag');
  const color = data.color || (data.flowType === 'INCOME' ? '#57F5AB' : '#8A4FFF');

  db.runSync(
    'INSERT INTO categories (id, name, flow_type, icon, color, is_system, is_active) VALUES (?, ?, ?, ?, ?, 0, 1)',
    [id, data.name.trim(), data.flowType, icon, color]
  );

  emitirCambioBoveda();

  return {
    id,
    name: data.name.trim(),
    flowType: data.flowType,
    icon,
    color,
    isSystem: false,
    isActive: true,
  };
}

export function eliminarCategoria(id: string): void {
  const db = obtenerBaseDatos();
  db.runSync('DELETE FROM categories WHERE id = ? AND is_system = 0', [id]);
  emitirCambioBoveda();
}

// Alias compatibles
export const getCategories = obtenerCategorias;
export const createCategory = crearCategoria;
export const deleteCategory = eliminarCategoria;
