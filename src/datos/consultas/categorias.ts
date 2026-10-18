import { obtenerBaseDatos } from '../conexion';
import { Categoria } from '../tipos';
import { emitirCambioBoveda } from '../sincronizacion';

export function obtenerCategorias(flowType?: 'EXPENSE' | 'INCOME'): Categoria[] {
  const db = obtenerBaseDatos();
  let query = 'SELECT * FROM categories';
  const params: string[] = [];
  if (flowType) {
    query += ' WHERE flow_type = ?';
    params.push(flowType);
  }
  query += ' ORDER BY name ASC';
  const rows = db.getAllSync<{
    id: string;
    name: string;
    flow_type: 'EXPENSE' | 'INCOME';
    icon: string;
    color: string;
    is_system: number;
  }>(query, params);

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    flowType: r.flow_type,
    icon: r.icon,
    color: r.color,
    isSystem: r.is_system === 1,
  }));
}

export function crearCategoria(data: {
  name: string;
  flowType: 'EXPENSE' | 'INCOME';
  icon?: string;
  color?: string;
}): Categoria {
  const db = obtenerBaseDatos();
  const id = 'cat_' + Math.random().toString(36).substring(2, 10);
  const icon = data.icon || (data.flowType === 'INCOME' ? 'attach-money' : 'category');
  const color = data.color || (data.flowType === 'INCOME' ? '#57F5AB' : '#8A4FFF');

  db.runSync(
    'INSERT INTO categories (id, name, flow_type, icon, color, is_system) VALUES (?, ?, ?, ?, ?, 0)',
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
