import { obtenerBaseDatos } from '../conexion';
import { Categoria } from '../tipos';
import { emitirCambioBoveda } from '../sincronizacion';

export const GRUPOS_CATEGORIAS: Record<string, string> = {
  // --- Gastos ---
  'Supermercado y Despensa': 'Alimentación y Consumo',
  'Restaurantes y Bares': 'Alimentación y Consumo',
  'Cafetería y Panadería': 'Alimentación y Consumo',
  'Comida Rápida y Delivery': 'Alimentación y Consumo',

  'Alquiler de Vivienda': 'Vivienda e Inmuebles',
  'Electricidad y Luz': 'Vivienda e Inmuebles',
  'Agua y Saneamiento': 'Vivienda e Inmuebles',
  'Gas y Calefacción': 'Vivienda e Inmuebles',
  'Gastos Comunes y Expensas': 'Vivienda e Inmuebles',
  'Mantenimiento y Reparación Hogar': 'Vivienda e Inmuebles',
  'Muebles y Artículos del Hogar': 'Vivienda e Inmuebles',

  'Internet y Wifi': 'Conectividad y Digital',
  'Telefonía Móvil y Celular': 'Conectividad y Digital',
  'Suscripciones y Streaming': 'Conectividad y Digital',
  'Software y Herramientas Digitales': 'Conectividad y Digital',

  'Combustible y Nafta': 'Transporte y Movilidad',
  'Transporte Público y Boletos': 'Transporte y Movilidad',
  'Taxi, Uber y Aplicaciones': 'Transporte y Movilidad',
  'Mantenimiento y Taller Mecánico': 'Transporte y Movilidad',
  'Peajes y Estacionamiento': 'Transporte y Movilidad',
  'Seguro de Vehículo': 'Transporte y Movilidad',

  'Farmacia y Medicamentos': 'Salud y Bienestar',
  'Consultas Médicas y Odontología': 'Salud y Bienestar',
  'Cuidado Personal y Peluquería': 'Salud y Bienestar',
  'Gimnasio y Actividad Física': 'Salud y Bienestar',

  'Educación y Matrículas': 'Educación y Familia',
  'Cursos y Capacitación': 'Educación y Familia',
  'Libros y Material de Estudio': 'Educación y Familia',
  'Ropa, Calzado y Accesorios': 'Educación y Familia',
  'Mascotas, Veterinaria y Alimento': 'Educación y Familia',

  'Cine, Salidas y Entretenimiento': 'Ocio y Vida Social',
  'Viajes, Vacaciones y Alojamiento': 'Ocio y Vida Social',
  'Regalos y Celebraciones': 'Ocio y Vida Social',
  'Donaciones y Solidaridad': 'Ocio y Vida Social',

  'Compra de Mercadería (Reventa)': 'Negocio, Taller y Comercio',
  'Materias Primas e Insumos': 'Negocio, Taller y Comercio',
  'Herramientas y Maquinaria': 'Negocio, Taller y Comercio',
  'Embalaje, Cajas y Packaging': 'Negocio, Taller y Comercio',
  'Envíos, Fletes y Cadetería': 'Negocio, Taller y Comercio',
  'Publicidad, Redes y Marketing': 'Negocio, Taller y Comercio',
  'Alquiler de Local o Taller Comercial': 'Negocio, Taller y Comercio',

  'Impuestos, Tasas y Tributos': 'Finanzas y Obligaciones',
  'Comisiones Bancarias y del POS': 'Finanzas y Obligaciones',
  'Cuotas de Préstamos e Intereses': 'Finanzas y Obligaciones',
  'Otros Gastos Varios': 'Finanzas y Obligaciones',

  // --- Ingresos ---
  'Ventas de Productos': 'Ventas y Comercio',
  'Cobro de Servicios y Mano de Obra': 'Ventas y Comercio',
  'Ventas de Artesanías y Creaciones': 'Ventas y Comercio',
  'Comisiones por Ventas': 'Ventas y Comercio',

  'Sueldo y Salario': 'Trabajo y Empleo',
  'Honorarios Profesionales': 'Trabajo y Empleo',
  'Trabajos Independientes y Extras': 'Trabajo y Empleo',
  'Propinas y Gratificaciones': 'Trabajo y Empleo',
  'Aguinaldo y Bonificaciones': 'Trabajo y Empleo',

  'Rendimientos e Inversiones': 'Rentas e Inversiones',
  'Alquileres Cobrados': 'Rentas e Inversiones',
  'Dividendos y Ganancias de Capital': 'Rentas e Inversiones',

  'Cobro de Deudas y Préstamos': 'Otros Ingresos',
  'Reembolsos y Devoluciones': 'Otros Ingresos',
  'Premios y Sorteos': 'Otros Ingresos',
  'Regalos en Efectivo': 'Otros Ingresos',
  'Subsidios y Ayudas Estatales': 'Otros Ingresos',
  'Otros Ingresos Varios': 'Otros Ingresos',
};

export function obtenerGrupoCategoria(nombre: string): string {
  return GRUPOS_CATEGORIAS[nombre] || 'General';
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
