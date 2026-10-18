import * as SQLite from 'expo-sqlite';
import { obtenerBaseDatos } from './conexion';
import { Categoria } from './tipos';

export function sembrarCategoriasPredeterminadas(db: SQLite.SQLiteDatabase = obtenerBaseDatos()): void {
  const categoriasBase: Omit<Categoria, 'id'>[] = [
    // Gastos
    { name: 'Alimentación', flowType: 'EXPENSE', icon: 'shopping-cart', color: '#FF8A9E', isSystem: true },
    { name: 'Transporte', flowType: 'EXPENSE', icon: 'local-gas-station', color: '#FFB4AB', isSystem: true },
    { name: 'Vivienda y Servicios', flowType: 'EXPENSE', icon: 'home', color: '#D1BCFF', isSystem: true },
    { name: 'Salud y Cuidado', flowType: 'EXPENSE', icon: 'favorite', color: '#55D8E9', isSystem: true },
    { name: 'Ocio y Suscripciones', flowType: 'EXPENSE', icon: 'movie', color: '#A5E7FF', isSystem: true },
    { name: 'Educación', flowType: 'EXPENSE', icon: 'school', color: '#EADDFF', isSystem: true },
    { name: 'Otros Gastos', flowType: 'EXPENSE', icon: 'more-horiz', color: '#958DA1', isSystem: true },

    // Ingresos
    { name: 'Sueldo / Salario', flowType: 'INCOME', icon: 'work', color: '#57F5AB', isSystem: true },
    { name: 'Honorarios / Freelance', flowType: 'INCOME', icon: 'work-history', color: '#57F5AB', isSystem: true },
    { name: 'Rentas e Inversiones', flowType: 'INCOME', icon: 'trending-up', color: '#55D8E9', isSystem: true },
    { name: 'Otros Ingresos', flowType: 'INCOME', icon: 'attach-money', color: '#57F5AB', isSystem: true },
  ];

  for (const cat of categoriasBase) {
    const id = 'cat_' + Math.random().toString(36).substring(2, 10);
    db.runSync(
      'INSERT INTO categories (id, name, flow_type, icon, color, is_system) VALUES (?, ?, ?, ?, ?, ?)',
      [id, cat.name, cat.flowType, cat.icon, cat.color, cat.isSystem ? 1 : 0]
    );
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
