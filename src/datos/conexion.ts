import * as SQLite from 'expo-sqlite';

let instanciaBD: SQLite.SQLiteDatabase | null = null;

export function obtenerBaseDatos(): SQLite.SQLiteDatabase {
  if (!instanciaBD) {
    instanciaBD = SQLite.openDatabaseSync('kyrara_gez.db');
  }
  return instanciaBD;
}

export function cerrarBaseDatos(): void {
  if (instanciaBD) {
    try {
      instanciaBD.closeSync();
    } catch {
      // Ignorar error de cierre
    }
    instanciaBD = null;
  }
}

// Alias compatibles
export const getDatabase = obtenerBaseDatos;
export const closeDatabase = cerrarBaseDatos;
