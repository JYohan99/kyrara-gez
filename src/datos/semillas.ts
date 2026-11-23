import * as SQLite from 'expo-sqlite';
import { obtenerBaseDatos } from './conexion';
import { Categoria } from './tipos';

export const CATEGORIAS_PREDETERMINADAS: Omit<Categoria, 'id'>[] = [
  // ==========================================
  // GASTOS (EXPENSE) - ICONOS DETALLADOS DE OBJETOS REALES
  // ==========================================

  // --- Alimentación y Consumo ---
  { name: 'Supermercado y Despensa', flowType: 'EXPENSE', icon: 'shopping-cart', color: '#FF8A9E', isSystem: true },
  { name: 'Restaurantes y Bares', flowType: 'EXPENSE', icon: 'restaurant', color: '#FF8A9E', isSystem: true },
  { name: 'Cafetería y Panadería', flowType: 'EXPENSE', icon: 'local-cafe', color: '#FF8A9E', isSystem: true },
  { name: 'Comida Rápida y Delivery', flowType: 'EXPENSE', icon: 'fastfood', color: '#FF8A9E', isSystem: true },

  // --- Vivienda e Inmuebles ---
  { name: 'Alquiler de Vivienda', flowType: 'EXPENSE', icon: 'house', color: '#D1BCFF', isSystem: true },
  { name: 'Electricidad y Luz', flowType: 'EXPENSE', icon: 'lightbulb', color: '#D1BCFF', isSystem: true },
  { name: 'Agua y Saneamiento', flowType: 'EXPENSE', icon: 'plumbing', color: '#D1BCFF', isSystem: true },
  { name: 'Gas y Calefacción', flowType: 'EXPENSE', icon: 'propane-tank', color: '#D1BCFF', isSystem: true },
  { name: 'Gastos Comunes y Expensas', flowType: 'EXPENSE', icon: 'apartment', color: '#D1BCFF', isSystem: true },
  { name: 'Mantenimiento y Reparación Hogar', flowType: 'EXPENSE', icon: 'home-repair-service', color: '#D1BCFF', isSystem: true },
  { name: 'Muebles y Artículos del Hogar', flowType: 'EXPENSE', icon: 'weekend', color: '#D1BCFF', isSystem: true },

  // --- Conectividad y Servicios Digitales ---
  { name: 'Internet y Wifi', flowType: 'EXPENSE', icon: 'router', color: '#A5E7FF', isSystem: true },
  { name: 'Telefonía Móvil y Celular', flowType: 'EXPENSE', icon: 'smartphone', color: '#A5E7FF', isSystem: true },
  { name: 'Suscripciones y Streaming', flowType: 'EXPENSE', icon: 'live-tv', color: '#A5E7FF', isSystem: true },
  { name: 'Software y Herramientas Digitales', flowType: 'EXPENSE', icon: 'computer', color: '#A5E7FF', isSystem: true },

  // --- Transporte y Movilidad ---
  { name: 'Combustible y Nafta', flowType: 'EXPENSE', icon: 'local-gas-station', color: '#FFB4AB', isSystem: true },
  { name: 'Transporte Público y Boletos', flowType: 'EXPENSE', icon: 'directions-bus', color: '#FFB4AB', isSystem: true },
  { name: 'Taxi, Uber y Aplicaciones', flowType: 'EXPENSE', icon: 'local-taxi', color: '#FFB4AB', isSystem: true },
  { name: 'Mantenimiento y Taller Mecánico', flowType: 'EXPENSE', icon: 'car-repair', color: '#FFB4AB', isSystem: true },
  { name: 'Peajes y Estacionamiento', flowType: 'EXPENSE', icon: 'traffic', color: '#FFB4AB', isSystem: true },
  { name: 'Seguro de Vehículo', flowType: 'EXPENSE', icon: 'car-rental', color: '#FFB4AB', isSystem: true },

  // --- Salud y Bienestar Personal ---
  { name: 'Farmacia y Medicamentos', flowType: 'EXPENSE', icon: 'medication', color: '#55D8E9', isSystem: true },
  { name: 'Consultas Médicas y Odontología', flowType: 'EXPENSE', icon: 'medical-services', color: '#55D8E9', isSystem: true },
  { name: 'Cuidado Personal y Peluquería', flowType: 'EXPENSE', icon: 'content-cut', color: '#55D8E9', isSystem: true },
  { name: 'Gimnasio y Actividad Física', flowType: 'EXPENSE', icon: 'fitness-center', color: '#55D8E9', isSystem: true },

  // --- Educación y Familia ---
  { name: 'Educación y Matrículas', flowType: 'EXPENSE', icon: 'school', color: '#EADDFF', isSystem: true },
  { name: 'Cursos y Capacitación', flowType: 'EXPENSE', icon: 'menu-book', color: '#EADDFF', isSystem: true },
  { name: 'Libros y Material de Estudio', flowType: 'EXPENSE', icon: 'book', color: '#EADDFF', isSystem: true },
  { name: 'Ropa, Calzado y Accesorios', flowType: 'EXPENSE', icon: 'checkroom', color: '#EADDFF', isSystem: true },
  { name: 'Mascotas, Veterinaria y Alimento', flowType: 'EXPENSE', icon: 'pets', color: '#EADDFF', isSystem: true },

  // --- Ocio, Cultura y Vida Social ---
  { name: 'Cine, Salidas y Entretenimiento', flowType: 'EXPENSE', icon: 'theater-comedy', color: '#FFD8E4', isSystem: true },
  { name: 'Viajes, Vacaciones y Alojamiento', flowType: 'EXPENSE', icon: 'luggage', color: '#FFD8E4', isSystem: true },
  { name: 'Regalos y Celebraciones', flowType: 'EXPENSE', icon: 'card-giftcard', color: '#FFD8E4', isSystem: true },
  { name: 'Donaciones y Solidaridad', flowType: 'EXPENSE', icon: 'volunteer-activism', color: '#FFD8E4', isSystem: true },

  // --- Negocio, Taller, Producción y Comercio ---
  { name: 'Compra de Mercadería (Reventa)', flowType: 'EXPENSE', icon: 'inventory-2', color: '#FFCC80', isSystem: true },
  { name: 'Materias Primas e Insumos', flowType: 'EXPENSE', icon: 'palette', color: '#FFCC80', isSystem: true },
  { name: 'Herramientas y Maquinaria', flowType: 'EXPENSE', icon: 'handyman', color: '#FFCC80', isSystem: true },
  { name: 'Embalaje, Cajas y Packaging', flowType: 'EXPENSE', icon: 'inventory', color: '#FFCC80', isSystem: true },
  { name: 'Envíos, Fletes y Cadetería', flowType: 'EXPENSE', icon: 'local-shipping', color: '#FFCC80', isSystem: true },
  { name: 'Publicidad, Redes y Marketing', flowType: 'EXPENSE', icon: 'campaign', color: '#FFCC80', isSystem: true },
  { name: 'Alquiler de Local o Taller Comercial', flowType: 'EXPENSE', icon: 'store', color: '#FFCC80', isSystem: true },

  // --- Obligaciones Financieras y Otros ---
  { name: 'Impuestos, Tasas y Tributos', flowType: 'EXPENSE', icon: 'receipt-long', color: '#CF6679', isSystem: true },
  { name: 'Comisiones Bancarias y del POS', flowType: 'EXPENSE', icon: 'credit-card', color: '#CF6679', isSystem: true },
  { name: 'Cuotas de Préstamos e Intereses', flowType: 'EXPENSE', icon: 'account-balance', color: '#CF6679', isSystem: true },
  { name: 'Otros Gastos Varios', flowType: 'EXPENSE', icon: 'shopping-bag', color: '#958DA1', isSystem: true },

  // ==========================================
  // INGRESOS (INCOME) - ICONOS DETALLADOS DE OBJETOS REALES
  // ==========================================

  // --- Ventas y Facturación Comercial ---
  { name: 'Ventas de Productos', flowType: 'INCOME', icon: 'point-of-sale', color: '#57F5AB', isSystem: true },
  { name: 'Cobro de Servicios y Mano de Obra', flowType: 'INCOME', icon: 'design-services', color: '#57F5AB', isSystem: true },
  { name: 'Ventas de Artesanías y Creaciones', flowType: 'INCOME', icon: 'brush', color: '#57F5AB', isSystem: true },
  { name: 'Comisiones por Ventas', flowType: 'INCOME', icon: 'paid', color: '#57F5AB', isSystem: true },

  // --- Trabajo, Empleo y Honorarios ---
  { name: 'Sueldo y Salario', flowType: 'INCOME', icon: 'work', color: '#57F5AB', isSystem: true },
  { name: 'Honorarios Profesionales', flowType: 'INCOME', icon: 'badge', color: '#57F5AB', isSystem: true },
  { name: 'Trabajos Independientes y Extras', flowType: 'INCOME', icon: 'work-history', color: '#57F5AB', isSystem: true },
  { name: 'Propinas y Gratificaciones', flowType: 'INCOME', icon: 'savings', color: '#57F5AB', isSystem: true },
  { name: 'Aguinaldo y Bonificaciones', flowType: 'INCOME', icon: 'card-giftcard', color: '#57F5AB', isSystem: true },

  // --- Rendimientos e Inversiones ---
  { name: 'Rendimientos e Inversiones', flowType: 'INCOME', icon: 'analytics', color: '#55D8E9', isSystem: true },
  { name: 'Alquileres Cobrados', flowType: 'INCOME', icon: 'apartment', color: '#55D8E9', isSystem: true },
  { name: 'Dividendos y Ganancias de Capital', flowType: 'INCOME', icon: 'account-balance', color: '#55D8E9', isSystem: true },

  // --- Otros Ingresos ---
  { name: 'Cobro de Deudas y Préstamos', flowType: 'INCOME', icon: 'request-quote', color: '#A5E7FF', isSystem: true },
  { name: 'Reembolsos y Devoluciones', flowType: 'INCOME', icon: 'currency-exchange', color: '#A5E7FF', isSystem: true },
  { name: 'Premios y Sorteos', flowType: 'INCOME', icon: 'emoji-events', color: '#A5E7FF', isSystem: true },
  { name: 'Regalos en Efectivo', flowType: 'INCOME', icon: 'redeem', color: '#A5E7FF', isSystem: true },
  { name: 'Subsidios y Ayudas Estatales', flowType: 'INCOME', icon: 'assured-workload', color: '#A5E7FF', isSystem: true },
  { name: 'Otros Ingresos Varios', flowType: 'INCOME', icon: 'payments', color: '#57F5AB', isSystem: true },
];

export function sembrarCategoriasPredeterminadas(db: SQLite.SQLiteDatabase = obtenerBaseDatos()): void {
  for (const cat of CATEGORIAS_PREDETERMINADAS) {
    const existente = db.getFirstSync<{ id: string }>(
      'SELECT id FROM categories WHERE name = ? AND flow_type = ?',
      [cat.name, cat.flowType]
    );

    if (!existente) {
      const id = 'cat_' + Math.random().toString(36).substring(2, 10);
      db.runSync(
        'INSERT INTO categories (id, name, flow_type, icon, color, is_system) VALUES (?, ?, ?, ?, ?, ?)',
        [id, cat.name, cat.flowType, cat.icon, cat.color, cat.isSystem ? 1 : 0]
      );
    } else {
      db.runSync(
        'UPDATE categories SET icon = ?, color = ?, is_system = 1 WHERE id = ?',
        [cat.icon, cat.color, existente.id]
      );
    }
  }
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
export const seedDefaultCategories = sembrarCategoriasPredeterminadas;
export const seedDefaultAccounts = sembrarCuentasPredeterminadas;
