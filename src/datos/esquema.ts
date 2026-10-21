import { obtenerBaseDatos } from './conexion';
import { sembrarCategoriasPredeterminadas, sembrarCuentasPredeterminadas } from './semillas';

export function inicializarBaseDatos(): void {
  const db = obtenerBaseDatos();

  // Crear tablas y configurar PRAGMA de SQLite
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      currency TEXT DEFAULT 'UYU',
      initial_balance INTEGER DEFAULT 0,
      current_balance INTEGER DEFAULT 0,
      icon TEXT,
      color TEXT,
      is_archived INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flow_type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      source_account_id TEXT NOT NULL,
      target_account_id TEXT,
      category_id TEXT,
      date INTEGER NOT NULL,
      note TEXT,
      payee TEXT,
      tags TEXT,
      FOREIGN KEY(source_account_id) REFERENCES accounts(id),
      FOREIGN KEY(target_account_id) REFERENCES accounts(id),
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      monthly_limit INTEGER NOT NULL,
      period TEXT NOT NULL,
      alert_threshold REAL DEFAULT 0.90,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS commitments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      description TEXT,
      related_person TEXT,
      recurrence_type TEXT NOT NULL DEFAULT 'SINGLE',
      series_id TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      commitment_id TEXT NOT NULL,
      days_before INTEGER NOT NULL,
      time TEXT NOT NULL,
      notification_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(commitment_id) REFERENCES commitments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recurrence_exceptions (
      id TEXT PRIMARY KEY,
      series_id TEXT NOT NULL,
      original_date TEXT NOT NULL,
      status TEXT NOT NULL,
      modified_commitment_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_commitments_date ON commitments(date);
    CREATE INDEX IF NOT EXISTS idx_commitments_series ON commitments(series_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_commitment ON reminders(commitment_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_series_date ON recurrence_exceptions(series_id, original_date);
  `);

  // Migraciones no destructivas
  try {
    db.execSync('ALTER TABLE transactions ADD COLUMN payee TEXT;');
  } catch {
    // Columna ya existe
  }

  // Sembrar categorías predeterminadas si la base de datos está vacía
  const countRow = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (!countRow || countRow.count === 0) {
    sembrarCategoriasPredeterminadas(db);
  }

  // Sembrar cuenta predeterminada si no existe ninguna
  const accCountRow = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM accounts');
  if (!accCountRow || accCountRow.count === 0) {
    sembrarCuentasPredeterminadas(db);
  }
}

// Alias compatible
export const initDatabase = inicializarBaseDatos;
