import * as SQLite from 'expo-sqlite';
import { obtenerBaseDatos } from './conexion';

export interface CategoriaDefinicion {
  id: string;
  name: string;
  group: string;
  flowType: 'EXPENSE' | 'INCOME';
  icon: string;
  color: string;
}

export const CATEGORIAS_PREDETERMINADAS: CategoriaDefinicion[] = [
  // ==========================================
  // GASTOS (EXPENSE) - ICONOS 3D
  // ==========================================

  // --- Alimentación y Consumo ---
  { id: 'cat_supermercado', name: 'Supermercado', group: 'Alimentación y Consumo', flowType: 'EXPENSE', icon: '🛒', color: '#FF8A9E' },
  { id: 'cat_restaurantes', name: 'Restaurantes', group: 'Alimentación y Consumo', flowType: 'EXPENSE', icon: '🍽️', color: '#FF8A9E' },
  { id: 'cat_cafeteria', name: 'Cafetería', group: 'Alimentación y Consumo', flowType: 'EXPENSE', icon: '☕', color: '#FF8A9E' },
  { id: 'cat_comida_rapida', name: 'Comida Rápida', group: 'Alimentación y Consumo', flowType: 'EXPENSE', icon: '🍔', color: '#FF8A9E' },

  // --- Vivienda e Inmuebles ---
  { id: 'cat_alquiler_vivienda', name: 'Alquiler de Vivienda', group: 'Vivienda e Inmuebles', flowType: 'EXPENSE', icon: '🏡', color: '#D1BCFF' },
  { id: 'cat_electricidad', name: 'Electricidad', group: 'Vivienda e Inmuebles', flowType: 'EXPENSE', icon: '💡', color: '#D1BCFF' },
  { id: 'cat_agua', name: 'Agua', group: 'Vivienda e Inmuebles', flowType: 'EXPENSE', icon: '🚰', color: '#D1BCFF' },
  { id: 'cat_gas', name: 'Gas', group: 'Vivienda e Inmuebles', flowType: 'EXPENSE', icon: '🔥', color: '#D1BCFF' },
  { id: 'cat_gastos_comunes', name: 'Gastos Comunes', group: 'Vivienda e Inmuebles', flowType: 'EXPENSE', icon: '🏢', color: '#D1BCFF' },
  { id: 'cat_mantenimiento_hogar', name: 'Reparación Hogar', group: 'Vivienda e Inmuebles', flowType: 'EXPENSE', icon: '🛠️', color: '#D1BCFF' },
  { id: 'cat_muebles_hogar', name: 'Artículos del Hogar', group: 'Vivienda e Inmuebles', flowType: 'EXPENSE', icon: '🛋️', color: '#D1BCFF' },

  // --- Conectividad y Digital ---
  { id: 'cat_internet', name: 'Internet', group: 'Conectividad y Digital', flowType: 'EXPENSE', icon: '📶', color: '#A5E7FF' },
  { id: 'cat_telefonia', name: 'Telefonía Móvil', group: 'Conectividad y Digital', flowType: 'EXPENSE', icon: '📱', color: '#A5E7FF' },
  { id: 'cat_suscripciones', name: 'Suscripciones', group: 'Conectividad y Digital', flowType: 'EXPENSE', icon: '🎬', color: '#A5E7FF' },
  { id: 'cat_software', name: 'Software y Herramientas Digitales', group: 'Conectividad y Digital', flowType: 'EXPENSE', icon: '💻', color: '#A5E7FF' },

  // --- Transporte y Movilidad ---
  { id: 'cat_combustible', name: 'Combustibl', group: 'Transporte y Movilidad', flowType: 'EXPENSE', icon: '⛽', color: '#FFB4AB' },
  { id: 'cat_transporte_publico', name: 'Transporte Público y Boletos', group: 'Transporte y Movilidad', flowType: 'EXPENSE', icon: '🚌', color: '#FFB4AB' },
  { id: 'cat_taller_mecanico', name: 'Taller Mecánico', group: 'Transporte y Movilidad', flowType: 'EXPENSE', icon: '🔧', color: '#FFB4AB' },
  { id: 'cat_peajes', name: 'Peajes y Estacionamiento', group: 'Transporte y Movilidad', flowType: 'EXPENSE', icon: '🅿️', color: '#FFB4AB' },
  { id: 'cat_seguro_vehiculo', name: 'Seguro de Vehículo', group: 'Transporte y Movilidad', flowType: 'EXPENSE', icon: '🚗', color: '#FFB4AB' },

  // --- Salud y Bienestar ---
  { id: 'cat_farmacia', name: 'Farmacia', group: 'Salud y Bienestar', flowType: 'EXPENSE', icon: '💊', color: '#55D8E9' },
  { id: 'cat_medico', name: 'Consultas Médicas', group: 'Salud y Bienestar', flowType: 'EXPENSE', icon: '🩺', color: '#55D8E9' },
  { id: 'cat_cuidado_personal', name: 'Cuidado Personal', group: 'Salud y Bienestar', flowType: 'EXPENSE', icon: '💈', color: '#55D8E9' },
  { id: 'cat_gimnasio', name: 'Gimnasio', group: 'Salud y Bienestar', flowType: 'EXPENSE', icon: '🏋️', color: '#55D8E9' },

  // --- Educación y Familia ---
  { id: 'cat_educacion', name: 'Educación', group: 'Educación y Familia', flowType: 'EXPENSE', icon: '🎓', color: '#EADDFF' },
  { id: 'cat_libros', name: 'Libros', group: 'Educación y Familia', flowType: 'EXPENSE', icon: '📖', color: '#EADDFF' },
  { id: 'cat_ropa', name: 'Ropa, Calzado y Accesorios', group: 'Educación y Familia', flowType: 'EXPENSE', icon: '👕', color: '#EADDFF' },
  { id: 'cat_mascotas', name: 'Mascotas', group: 'Educación y Familia', flowType: 'EXPENSE', icon: '🐾', color: '#EADDFF' },

  // --- Ocio y Vida Social ---
  { id: 'cat_entretenimiento', name: 'Entretenimiento', group: 'Ocio y Vida Social', flowType: 'EXPENSE', icon: '🎭', color: '#FFD8E4' },
  { id: 'cat_viajes', name: 'Viajes, Vacaciones y Alojamiento', group: 'Ocio y Vida Social', flowType: 'EXPENSE', icon: '✈️', color: '#FFD8E4' },
  { id: 'cat_regalos', name: 'Regalos', group: 'Ocio y Vida Social', flowType: 'EXPENSE', icon: '🎁', color: '#FFD8E4' },

  // --- Negocio, Taller y Comercio ---
  { id: 'cat_compra_mercaderia', name: 'Compra de Mercadería', group: 'Negocio, Taller y Comercio', flowType: 'EXPENSE', icon: '📦', color: '#FFCC80' },
  { id: 'cat_materias_primas', name: 'Materias Primas e Insumos', group: 'Negocio, Taller y Comercio', flowType: 'EXPENSE', icon: '🪵', color: '#FFCC80' },
  { id: 'cat_herramientas', name: 'Herramientas y Maquinaria', group: 'Negocio, Taller y Comercio', flowType: 'EXPENSE', icon: '⚙️', color: '#FFCC80' },
  { id: 'cat_packaging', name: 'Embalaje, Cajas y Packaging', group: 'Negocio, Taller y Comercio', flowType: 'EXPENSE', icon: '🏷️', color: '#FFCC80' },
  { id: 'cat_envios', name: 'Envíos y Fletes', group: 'Negocio, Taller y Comercio', flowType: 'EXPENSE', icon: '🚚', color: '#FFCC80' },
  { id: 'cat_publicidad', name: 'Publicidad, Redes y Marketing', group: 'Negocio, Taller y Comercio', flowType: 'EXPENSE', icon: '📢', color: '#FFCC80' },
  { id: 'cat_alquiler_comercial', name: 'Alquiler de Local', group: 'Negocio, Taller y Comercio', flowType: 'EXPENSE', icon: '🏪', color: '#FFCC80' },

  // --- Finanzas y Obligaciones ---
  { id: 'cat_impuestos', name: 'Impuestos, Tasas y Tributos', group: 'Finanzas y Obligaciones', flowType: 'EXPENSE', icon: '🏛️', color: '#CF6679' },
  { id: 'cat_comisiones_pos', name: 'Comisiones Bancarias', group: 'Finanzas y Obligaciones', flowType: 'EXPENSE', icon: '💳', color: '#CF6679' },
  { id: 'cat_prestamos', name: 'Cuotas de Préstamos e Intereses', group: 'Finanzas y Obligaciones', flowType: 'EXPENSE', icon: '🏦', color: '#CF6679' },
  { id: 'cat_otros_gastos', name: 'Otros Gastos Varios', group: 'Finanzas y Obligaciones', flowType: 'EXPENSE', icon: '💸', color: '#CF6679' },

  // ==========================================
  // INGRESOS (INCOME)
  // ==========================================

  // --- Ventas y Comercio ---
  { id: 'cat_ventas_productos', name: 'Ventas de Productos', group: 'Ventas y Comercio', flowType: 'INCOME', icon: '🛍️', color: '#57F5AB' },
  { id: 'cat_cobro_servicios', name: 'Cobro de Servicios y Mano de Obra', group: 'Ventas y Comercio', flowType: 'INCOME', icon: '💼', color: '#57F5AB' },
  { id: 'cat_artesanias', name: 'Ventas de Artesanías y Creaciones', group: 'Ventas y Comercio', flowType: 'INCOME', icon: '🎨', color: '#57F5AB' },
  { id: 'cat_comisiones_ventas', name: 'Comisiones por Ventas', group: 'Ventas y Comercio', flowType: 'INCOME', icon: '📈', color: '#57F5AB' },

  // --- Trabajo y Empleo ---
  { id: 'cat_sueldo', name: 'Sueldo', group: 'Trabajo y Empleo', flowType: 'INCOME', icon: '💵', color: '#57F5AB' },
  { id: 'cat_honorarios', name: 'Honorarios Profesionales', group: 'Trabajo y Empleo', flowType: 'INCOME', icon: '👔', color: '#57F5AB' },
  { id: 'cat_independientes', name: 'Trabajos Independientes y Extras', group: 'Trabajo y Empleo', flowType: 'INCOME', icon: '⚡', color: '#57F5AB' },
  { id: 'cat_propinas', name: 'Propinas y Gratificaciones', group: 'Trabajo y Empleo', flowType: 'INCOME', icon: '🪙', color: '#57F5AB' },
  { id: 'cat_aguinaldo', name: 'Aguinaldo y Bonificaciones', group: 'Trabajo y Empleo', flowType: 'INCOME', icon: '🎉', color: '#57F5AB' },

  // --- Rentas e Inversiones ---
  { id: 'cat_inversiones', name: 'Rendimientos e Inversiones', group: 'Rentas e Inversiones', flowType: 'INCOME', icon: '📊', color: '#55D8E9' },
  { id: 'cat_alquileres_cobrados', name: 'Alquileres Cobrados', group: 'Rentas e Inversiones', flowType: 'INCOME', icon: '🏠', color: '#55D8E9' },
  { id: 'cat_dividendos', name: 'Dividendos y Ganancias de Capital', group: 'Rentas e Inversiones', flowType: 'INCOME', icon: '💰', color: '#55D8E9' },

  // --- Otros Ingresos ---
  { id: 'cat_cobro_deudas', name: 'Cobro de Deudas y Préstamos', group: 'Otros Ingresos', flowType: 'INCOME', icon: '🧾', color: '#A5E7FF' },
  { id: 'cat_reembolsos', name: 'Reembolsos y Devoluciones', group: 'Otros Ingresos', flowType: 'INCOME', icon: '🔄', color: '#A5E7FF' },
  { id: 'cat_premios', name: 'Premios y Sorteos', group: 'Otros Ingresos', flowType: 'INCOME', icon: '🏆', color: '#A5E7FF' },
  { id: 'cat_regalos_efectivo', name: 'Regalos en Efectivo', group: 'Otros Ingresos', flowType: 'INCOME', icon: '🎁', color: '#A5E7FF' },
  { id: 'cat_subsidios', name: 'Subsidios y Ayudas Estatales', group: 'Otros Ingresos', flowType: 'INCOME', icon: '🏛️', color: '#A5E7FF' },
  { id: 'cat_otros_ingresos', name: 'Otros Ingresos Varios', group: 'Otros Ingresos', flowType: 'INCOME', icon: '✨', color: '#57F5AB' },
];

export function sembrarCategoriasPredeterminadas(db: SQLite.SQLiteDatabase = obtenerBaseDatos()): void {
  // 1. Insertar o actualizar primero las categorías oficiales con IDs estables
  for (const cat of CATEGORIAS_PREDETERMINADAS) {
    db.runSync(
      `INSERT INTO categories (id, name, flow_type, icon, color, is_system)
       VALUES (?, ?, ?, ?, ?, 1)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         icon = excluded.icon,
         color = excluded.color;`,
      [cat.id, cat.name, cat.flowType, cat.icon, cat.color]
    );
  }

  // 2. Eliminar categorías del sistema antiguas/duplicadas (incluyendo IDs aleatorios 'cat_xxxx')
  try {
    const idsValidos = CATEGORIAS_PREDETERMINADAS.map(c => c.id);
    const placeholders = idsValidos.map(() => '?').join(',');
    const viejas = db.getAllSync<{ id: string; name: string; flow_type: string }>(
      `SELECT id, name, flow_type FROM categories WHERE is_system = 1 AND id NOT IN (${placeholders})`,
      idsValidos
    );

    for (const vieja of viejas) {
      const nueva = CATEGORIAS_PREDETERMINADAS.find(
        c => c.name.toLowerCase() === vieja.name.toLowerCase() && c.flowType === vieja.flow_type
      );
      if (nueva) {
        try {
          db.runSync('UPDATE transactions SET category_id = ? WHERE category_id = ?', [nueva.id, vieja.id]);
          db.runSync('UPDATE OR IGNORE budgets SET category_id = ? WHERE category_id = ?', [nueva.id, vieja.id]);
          db.runSync('DELETE FROM budgets WHERE category_id = ?', [vieja.id]);
        } catch { }
      }
      try {
        db.runSync('DELETE FROM categories WHERE id = ?', [vieja.id]);
      } catch { }
    }
  } catch { }
}

export function sembrarCuentasPredeterminadas(db: SQLite.SQLiteDatabase = obtenerBaseDatos()): void {
  const id = 'acc_' + Math.random().toString(36).substring(2, 10);
  const now = Date.now();
  db.runSync(
    'INSERT INTO accounts (id, name, type, currency, initial_balance, current_balance, icon, color, is_archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
    [id, 'Efectivo en mano', 'CASH', 'UYU', 0, 0, 'payments', '#57F5AB', now]
  );
}

// Alias compatibles
