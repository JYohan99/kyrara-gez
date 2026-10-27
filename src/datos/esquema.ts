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

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      person TEXT NOT NULL,
      concept TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      paid_amount INTEGER NOT NULL DEFAULT 0,
      remaining_amount INTEGER NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      reminder_days_before INTEGER,
      reminder_time TEXT DEFAULT '09:00',
      notification_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id TEXT PRIMARY KEY,
      debt_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      account_id TEXT,
      transaction_id TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(debt_id) REFERENCES debts(id) ON DELETE CASCADE,
      FOREIGN KEY(account_id) REFERENCES accounts(id),
      FOREIGN KEY(transaction_id) REFERENCES transactions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_commitments_date ON commitments(date);
    CREATE INDEX IF NOT EXISTS idx_commitments_series ON commitments(series_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_commitment ON reminders(commitment_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_series_date ON recurrence_exceptions(series_id, original_date);
    CREATE INDEX IF NOT EXISTS idx_debts_type_status ON debts(type, status);
    CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
    CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);

    CREATE TABLE IF NOT EXISTS photo_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      size_format TEXT,
      sale_unit TEXT NOT NULL DEFAULT 'Unidad',
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      base_price INTEGER DEFAULT 0,
      cost_price INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'UYU',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_photo_products_name ON photo_products(name);
    CREATE INDEX IF NOT EXISTS idx_photo_products_category ON photo_products(category);
    CREATE INDEX IF NOT EXISTS idx_photo_products_active ON photo_products(is_active);

    CREATE TABLE IF NOT EXISTS photo_product_prices (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      sale_price INTEGER NOT NULL DEFAULT 0,
      cost_price INTEGER NOT NULL DEFAULT 0,
      cost_usd REAL,
      exchange_rate REAL,
      valid_from TEXT NOT NULL,
      valid_to TEXT,
      notes TEXT,
      currency TEXT DEFAULT 'UYU',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(product_id) REFERENCES photo_products(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_photo_product_prices_product ON photo_product_prices(product_id);
    CREATE INDEX IF NOT EXISTS idx_photo_product_prices_valid ON photo_product_prices(valid_from, valid_to);
  `);

  // Migraciones no destructivas
  try {
    db.execSync('ALTER TABLE transactions ADD COLUMN payee TEXT;');
  } catch {
    // Columna ya existe
  }

  try {
    db.execSync('ALTER TABLE photo_products ADD COLUMN cost_usd REAL;');
  } catch {
    // Columna ya existe
  }

  try {
    db.execSync('ALTER TABLE photo_products ADD COLUMN exchange_rate REAL;');
  } catch {
    // Columna ya existe
  }

  try {
    db.execSync('ALTER TABLE photo_products ADD COLUMN price_valid_from TEXT;');
  } catch {
    // Columna ya existe
  }

  try {
    db.execSync('ALTER TABLE photo_product_prices ADD COLUMN currency TEXT DEFAULT "UYU";');
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
