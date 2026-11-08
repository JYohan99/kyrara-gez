import { obtenerBaseDatos } from '../conexion';
import { asegurarEsquemaBaseDatos } from '../esquema';
import {
  Producto,
  FiltroProductos,
  TarifaProducto,
  LineaCalculoProducto,
  TotalesMonedaCalculoProducto,
  ResultadoCalculadoraProductos,
  CambioPrecioHistorial,
  FiltroHistorialPrecios,
  EstadisticasCatalogoProductos,
  EstadisticasMonedaProductos,
  EvolucionTarifaItem,
} from '../tipos';
import { emitirCambioBoveda } from '../sincronizacion';

export const CATEGORIAS_PRODUCTOS_SUGERIDAS = [
  'General',
  'Artículos',
  'Servicios',
  'Impresiones',
  'Digital',
  'Packs',
  'Personalizados',
  'Accesorios',
];

export const FORMATOS_PRODUCTOS_SUGERIDOS = [
  'Estándar',
  'Chico',
  'Mediano',
  'Grande',
  '10x15 cm',
  '15x21 cm',
  '30x40 cm',
  'A4',
  'A3',
  'Digital',
  'Personalizado',
];

export const UNIDADES_VENTA_SUGERIDAS = [
  'Unidad',
  'Paquete',
  'Servicio',
  'Docena',
  'Kit',
];

interface FilaProducto {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  size_format: string | null;
  sale_unit: string;
  description: string | null;
  is_active: number;
  base_price: number | null;
  cost_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  supplier: string | null;
  cost_usd: number | null;
  exchange_rate: number | null;
  price_valid_from: string | null;
  currency: string | null;
  created_at: number;
  updated_at: number;
  tariffs_count?: number;
}

interface FilaTarifaProducto {
  id: string;
  product_id: string;
  sale_price: number;
  cost_price: number;
  cost_usd: number | null;
  exchange_rate: number | null;
  valid_from: string;
  valid_to: string | null;
  notes: string | null;
  currency?: string | null;
  created_at: number;
  updated_at: number;
}

function fechaActualISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

/**
 * Calcula la ganancia bruta por unidad y el margen bruto porcentual.
 * - Ganancia bruta = Precio de venta - Costo.
 * - Margen bruto (%) = (Ganancia bruta / Precio de venta) * 100.
 * - Si el precio de venta es 0, no se calcula el margen (%) retornando null.
 */
export function calcularGananciaYMargen(
  salePrice: number,
  costPrice: number
): { grossProfit: number; grossMarginPercent: number | null } {
  const grossProfit = salePrice - costPrice;
  const grossMarginPercent = salePrice > 0 ? (grossProfit / salePrice) * 100 : null;
  return { grossProfit, grossMarginPercent };
}

function mapearFilaAProducto(fila: FilaProducto, tariffsCount?: number): Producto {
  const sale = fila.base_price !== null && fila.base_price !== undefined ? fila.base_price : 0;
  const cost = fila.cost_price !== null && fila.cost_price !== undefined ? fila.cost_price : 0;
  const { grossProfit, grossMarginPercent } = calcularGananciaYMargen(sale, cost);
  const currentStock = fila.current_stock !== null && fila.current_stock !== undefined ? fila.current_stock : 0;
  const minStock = fila.min_stock !== null && fila.min_stock !== undefined ? fila.min_stock : 0;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= minStock;

  return {
    id: fila.id,
    name: fila.name,
    sku: fila.sku || undefined,
    category: fila.category || 'General',
    sizeFormat: fila.size_format || undefined,
    saleUnit: fila.sale_unit || 'Unidad',
    description: fila.description || undefined,
    isActive: fila.is_active === 1,
    basePrice: sale,
    costPrice: cost,
    currentStock,
    minStock,
    supplier: fila.supplier || undefined,
    costUsd: fila.cost_usd !== null && fila.cost_usd !== undefined ? fila.cost_usd : undefined,
    exchangeRate: fila.exchange_rate !== null && fila.exchange_rate !== undefined ? fila.exchange_rate : undefined,
    priceValidFrom: fila.price_valid_from || undefined,
    currency: fila.currency || 'UYU',
    createdAt: fila.created_at,
    updatedAt: fila.updated_at,
    grossProfit,
    grossMarginPercent,
    tariffsCount: tariffsCount ?? fila.tariffs_count ?? 0,
    isLowStock,
    isOutOfStock,
  };
}

function mapearFilaATarifa(fila: FilaTarifaProducto): TarifaProducto {
  return {
    id: fila.id,
    productId: fila.product_id,
    salePrice: fila.sale_price,
    costPrice: fila.cost_price,
    costUsd: fila.cost_usd !== null && fila.cost_usd !== undefined ? fila.cost_usd : undefined,
    exchangeRate: fila.exchange_rate !== null && fila.exchange_rate !== undefined ? fila.exchange_rate : undefined,
    validFrom: fila.valid_from,
    validTo: fila.valid_to || undefined,
    notes: fila.notes || undefined,
    currency: fila.currency || 'UYU',
    createdAt: fila.created_at,
    updatedAt: fila.updated_at,
  };
}

/**
 * Verifica si ya existe un producto con el mismo nombre (ignorando mayúsculas y espacios).
 */
export function verificarNombreDuplicado(nombre: string, idExcluir?: string): boolean {
  const nombreLimpio = nombre.trim().toLowerCase();
  if (!nombreLimpio) return false;

  const db = obtenerBaseDatos();
  const fila = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM photo_products
     WHERE LOWER(TRIM(name)) = ?
     AND (? IS NULL OR id != ?)`,
    [nombreLimpio, idExcluir || null, idExcluir || null]
  );

  return Boolean(fila && fila.count > 0);
}

/**
 * Obtiene la lista de productos según los filtros especificados.
 */
export function obtenerProductos(filtros?: FiltroProductos): Producto[] {
  asegurarEsquemaBaseDatos();
  const db = obtenerBaseDatos();
  let query = `
    SELECT p.*, COALESCE(t.count, 0) as tariffs_count
    FROM photo_products p
    LEFT JOIN (
      SELECT product_id, COUNT(*) as count
      FROM photo_product_prices
      GROUP BY product_id
    ) t ON t.product_id = p.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filtros?.statusFilter === 'ACTIVOS') {
    query += ' AND p.is_active = 1';
  } else if (filtros?.statusFilter === 'INACTIVOS') {
    query += ' AND p.is_active = 0';
  }

  if (filtros?.category && filtros.category !== 'TODAS') {
    query += ' AND p.category = ?';
    params.push(filtros.category);
  }

  if (filtros?.search && filtros.search.trim()) {
    const searchPattern = `%${filtros.search.trim()}%`;
    query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.supplier LIKE ? OR p.size_format LIKE ? OR p.category LIKE ? OR p.description LIKE ?)';
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  // Ordenar: primero los activos, luego alfabéticamente por nombre
  query += ' ORDER BY p.is_active DESC, p.name COLLATE NOCASE ASC';

  const rows = db.getAllSync<FilaProducto>(query, params);
  return rows.map(r => mapearFilaAProducto(r, r.tariffs_count));
}

/**
 * Obtiene un producto por su identificador único.
 */
export function obtenerProductoPorId(id: string): Producto | null {
  asegurarEsquemaBaseDatos();
  const db = obtenerBaseDatos();
  const row = db.getFirstSync<FilaProducto>(
    `SELECT p.*, COALESCE(t.count, 0) as tariffs_count
     FROM photo_products p
     LEFT JOIN (
       SELECT product_id, COUNT(*) as count
       FROM photo_product_prices
       GROUP BY product_id
     ) t ON t.product_id = p.id
     WHERE p.id = ?`,
    [id]
  );
  return row ? mapearFilaAProducto(row, row.tariffs_count) : null;
}

/**
 * Obtiene todas las tarifas históricas y vigentes de un producto.
 */
export function obtenerTarifasProducto(productId: string): TarifaProducto[] {
  const db = obtenerBaseDatos();
  const rows = db.getAllSync<FilaTarifaProducto>(
    'SELECT * FROM photo_product_prices WHERE product_id = ? ORDER BY valid_from DESC, created_at DESC',
    [productId]
  );
  return rows.map(mapearFilaATarifa);
}

/**
 * Obtiene la tarifa vigente actual de un producto.
 */
export function obtenerTarifaVigente(productId: string): TarifaProducto | null {
  const db = obtenerBaseDatos();
  // Primero buscar la que tenga valid_to NULL
  const row = db.getFirstSync<FilaTarifaProducto>(
    "SELECT * FROM photo_product_prices WHERE product_id = ? AND (valid_to IS NULL OR TRIM(valid_to) = '') ORDER BY valid_from DESC, created_at DESC LIMIT 1",
    [productId]
  );
  if (row) return mapearFilaATarifa(row);

  // Fallback: la más reciente
  const fallback = db.getFirstSync<FilaTarifaProducto>(
    'SELECT * FROM photo_product_prices WHERE product_id = ? ORDER BY valid_from DESC, created_at DESC LIMIT 1',
    [productId]
  );
  return fallback ? mapearFilaATarifa(fallback) : null;
}

export interface DatosEstablecerTarifa {
  productId: string;
  salePrice: number; // en centavos (ej: 15000 = $150,00)
  costPrice: number; // en centavos (ej: 8000 = $80,00)
  costUsd?: number;
  exchangeRate?: number;
  validFrom: string; // 'YYYY-MM-DD'
  isCorrection?: boolean;
  notes?: string;
  currency?: string;
}

/**
 * Establece una tarifa para un producto.
 * - Valida precios no negativos.
 * - Si es corrección (isCorrection: true), modifica la tarifa vigente conservando el historial previo.
 * - Si es nueva tarifa (isCorrection: false), cierra la tarifa anterior asignándole valid_to y crea la nueva tarifa vigente.
 */
export function establecerTarifaProducto(datos: DatosEstablecerTarifa): {
  product: Producto;
  tariff: TarifaProducto;
} {
  const db = obtenerBaseDatos();
  const producto = obtenerProductoPorId(datos.productId);
  if (!producto) {
    throw new Error('El producto no existe.');
  }

  if (datos.salePrice < 0) {
    throw new Error('El precio de venta no puede ser negativo.');
  }

  if (datos.costPrice < 0) {
    throw new Error('El costo no puede ser negativo.');
  }

  if (datos.costUsd !== undefined && datos.costUsd < 0) {
    throw new Error('El costo de referencia en USD no puede ser negativo.');
  }

  if (datos.exchangeRate !== undefined && datos.exchangeRate <= 0) {
    throw new Error('El tipo de cambio debe ser mayor a cero.');
  }

  const fechaValida = datos.validFrom && /^\d{4}-\d{2}-\d{2}$/.test(datos.validFrom)
    ? datos.validFrom
    : fechaActualISO();

  const ahora = Date.now();
  let tarifaFinal: TarifaProducto;

  db.withTransactionSync(() => {
    const tarifaVigenteFila = db.getFirstSync<FilaTarifaProducto>(
      "SELECT * FROM photo_product_prices WHERE product_id = ? AND (valid_to IS NULL OR TRIM(valid_to) = '') ORDER BY valid_from DESC, created_at DESC LIMIT 1",
      [datos.productId]
    );

    const monedaFinal = datos.currency || producto.currency || 'UYU';

    if (datos.isCorrection && tarifaVigenteFila) {
      // Corrección por error de la tarifa actual: preserva el historial previo intacto
      db.runSync(
        `UPDATE photo_product_prices SET
          sale_price = ?,
          cost_price = ?,
          cost_usd = ?,
          exchange_rate = ?,
          valid_from = ?,
          notes = ?,
          currency = ?,
          updated_at = ?
        WHERE id = ?`,
        [
          Math.round(datos.salePrice),
          Math.round(datos.costPrice),
          datos.costUsd !== undefined ? datos.costUsd : null,
          datos.exchangeRate !== undefined ? datos.exchangeRate : null,
          fechaValida,
          datos.notes?.trim() || null,
          monedaFinal,
          ahora,
          tarifaVigenteFila.id,
        ]
      );

      tarifaFinal = {
        id: tarifaVigenteFila.id,
        productId: datos.productId,
        salePrice: Math.round(datos.salePrice),
        costPrice: Math.round(datos.costPrice),
        costUsd: datos.costUsd,
        exchangeRate: datos.exchangeRate,
        validFrom: fechaValida,
        validTo: undefined,
        notes: datos.notes?.trim() || undefined,
        currency: monedaFinal,
        createdAt: tarifaVigenteFila.created_at,
        updatedAt: ahora,
      };
    } else {
      // Evitar duplicar registros si se guarda exactamente el mismo cambio
      if (
        tarifaVigenteFila &&
        tarifaVigenteFila.sale_price === Math.round(datos.salePrice) &&
        tarifaVigenteFila.cost_price === Math.round(datos.costPrice) &&
        tarifaVigenteFila.valid_from === fechaValida &&
        (tarifaVigenteFila.currency || producto.currency || 'UYU') === monedaFinal &&
        (tarifaVigenteFila.notes || null) === (datos.notes?.trim() || null)
      ) {
        tarifaFinal = mapearFilaATarifa(tarifaVigenteFila);
        return;
      }

      // Nueva tarifa: cerrar la anterior si existe
      if (tarifaVigenteFila) {
        db.runSync(
          'UPDATE photo_product_prices SET valid_to = ?, updated_at = ? WHERE id = ?',
          [fechaValida, ahora, tarifaVigenteFila.id]
        );
      }

      const nuevoTarifaId = 'tariff_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      db.runSync(
        `INSERT INTO photo_product_prices (
          id, product_id, sale_price, cost_price, cost_usd, exchange_rate,
          valid_from, valid_to, notes, currency, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
        [
          nuevoTarifaId,
          datos.productId,
          Math.round(datos.salePrice),
          Math.round(datos.costPrice),
          datos.costUsd !== undefined ? datos.costUsd : null,
          datos.exchangeRate !== undefined ? datos.exchangeRate : null,
          fechaValida,
          datos.notes?.trim() || null,
          monedaFinal,
          ahora,
          ahora,
        ]
      );

      tarifaFinal = {
        id: nuevoTarifaId,
        productId: datos.productId,
        salePrice: Math.round(datos.salePrice),
        costPrice: Math.round(datos.costPrice),
        costUsd: datos.costUsd,
        exchangeRate: datos.exchangeRate,
        validFrom: fechaValida,
        validTo: undefined,
        notes: datos.notes?.trim() || undefined,
        currency: monedaFinal,
        createdAt: ahora,
        updatedAt: ahora,
      };
    }

    // Actualizar campos denormalizados en photo_products para acceso rápido
    db.runSync(
      `UPDATE photo_products SET
        base_price = ?,
        cost_price = ?,
        cost_usd = ?,
        exchange_rate = ?,
        price_valid_from = ?,
        currency = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        Math.round(datos.salePrice),
        Math.round(datos.costPrice),
        datos.costUsd !== undefined ? datos.costUsd : null,
        datos.exchangeRate !== undefined ? datos.exchangeRate : null,
        fechaValida,
        monedaFinal,
        ahora,
        datos.productId,
      ]
    );
  });

  emitirCambioBoveda();

  const productoActualizado = obtenerProductoPorId(datos.productId)!;
  return { product: productoActualizado, tariff: tarifaFinal! };
}

/**
 * Elimina una tarifa del historial.
 */
export function eliminarTarifaProducto(tariffId: string): void {
  const db = obtenerBaseDatos();
  const tarifa = db.getFirstSync<FilaTarifaProducto>(
    'SELECT * FROM photo_product_prices WHERE id = ?',
    [tariffId]
  );
  if (!tarifa) return;

  db.withTransactionSync(() => {
    db.runSync('DELETE FROM photo_product_prices WHERE id = ?', [tariffId]);

    // Si eliminó la tarifa vigente, reactivar la más reciente si existe
    const latest = db.getFirstSync<FilaTarifaProducto>(
      'SELECT * FROM photo_product_prices WHERE product_id = ? ORDER BY valid_from DESC, created_at DESC LIMIT 1',
      [tarifa.product_id]
    );

    if (latest) {
      db.runSync(
        `UPDATE photo_products SET
          base_price = ?,
          cost_price = ?,
          cost_usd = ?,
          exchange_rate = ?,
          price_valid_from = ?,
          updated_at = ?
        WHERE id = ?`,
        [
          latest.sale_price,
          latest.cost_price,
          latest.cost_usd,
          latest.exchange_rate,
          latest.valid_from,
          Date.now(),
          tarifa.product_id,
        ]
      );
    } else {
      // No quedan tarifas
      db.runSync(
        `UPDATE photo_products SET
          base_price = 0,
          cost_price = 0,
          cost_usd = NULL,
          exchange_rate = NULL,
          price_valid_from = NULL,
          updated_at = ?
        WHERE id = ?`,
        [Date.now(), tarifa.product_id]
      );
    }
  });

  emitirCambioBoveda();
}

/**
 * Obtiene las categorías actualmente en uso más las sugeridas.
 */
export function obtenerCategoriasProductos(): string[] {
  const db = obtenerBaseDatos();
  const rows = db.getAllSync<{ category: string }>(
    'SELECT DISTINCT category FROM photo_products WHERE category IS NOT NULL AND TRIM(category) != "" ORDER BY category ASC'
  );
  const usadas = rows.map(r => r.category);
  const todas = Array.from(new Set([...CATEGORIAS_PRODUCTOS_SUGERIDAS, ...usadas]));
  return todas;
}

export interface DatosCrearProducto {
  name: string;
  sku?: string;
  category?: string;
  sizeFormat?: string;
  saleUnit: string;
  description?: string;
  isActive?: boolean;
  basePrice?: number;
  costPrice?: number;
  initialStock?: number;
  minStock?: number;
  supplier?: string;
  costUsd?: number;
  exchangeRate?: number;
  priceValidFrom?: string;
  currency?: string;
}

/**
 * Registra un nuevo producto comercial/inventariable en el catálogo.
 */
export function crearProducto(datos: DatosCrearProducto): Producto {
  asegurarEsquemaBaseDatos();
  const nombreLimpio = datos.name.trim();
  if (!nombreLimpio) {
    throw new Error('El nombre del producto es obligatorio.');
  }

  const unidadLimpia = datos.saleUnit.trim();
  if (!unidadLimpia) {
    throw new Error('La unidad de venta es obligatoria.');
  }

  if (verificarNombreDuplicado(nombreLimpio)) {
    throw new Error(`Ya existe un producto con el nombre "${nombreLimpio}".`);
  }

  const db = obtenerBaseDatos();
  const ahora = Date.now();
  const id = 'prod_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  const sku = datos.sku?.trim() || null;
  const categoria = datos.category?.trim() || 'General';
  const formato = datos.sizeFormat?.trim() || null;
  const descripcion = datos.description?.trim() || null;
  const activo = datos.isActive === false ? 0 : 1;
  const precioBase = datos.basePrice !== undefined ? Math.round(datos.basePrice) : 0;
  const costoBase = datos.costPrice !== undefined ? Math.round(datos.costPrice) : 0;
  const stockInicial = datos.initialStock !== undefined && datos.initialStock > 0 ? Number(datos.initialStock) : 0;
  const stockMinimo = datos.minStock !== undefined && datos.minStock >= 0 ? Number(datos.minStock) : 0;
  const proveedor = datos.supplier?.trim() || null;
  const costoUsd = datos.costUsd !== undefined ? datos.costUsd : null;
  const tipoCambio = datos.exchangeRate !== undefined ? datos.exchangeRate : null;
  const fechaVigencia = datos.priceValidFrom || fechaActualISO();
  const moneda = datos.currency || 'UYU';

  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO photo_products (
        id, name, sku, category, size_format, sale_unit, description,
        is_active, base_price, cost_price, current_stock, min_stock, supplier,
        cost_usd, exchange_rate, price_valid_from, currency, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        nombreLimpio,
        sku,
        categoria,
        formato,
        unidadLimpia,
        descripcion,
        activo,
        precioBase,
        costoBase,
        stockInicial,
        stockMinimo,
        proveedor,
        costoUsd,
        tipoCambio,
        fechaVigencia,
        moneda,
        ahora,
        ahora,
      ]
    );

    // Si se especificó un stock inicial positivo, registrar operación formal en inventory_operations
    if (stockInicial > 0) {
      const opId = 'op_inv_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      db.runSync(
        `INSERT INTO inventory_operations (
          id, product_id, type, quantity, previous_stock, new_stock, unit_cost, total_cost,
          reason, supplier, notes, date, created_at
        ) VALUES (?, ?, 'PURCHASE', ?, 0, ?, ?, ?, 'Stock inicial', ?, 'Carga de inventario inicial al registrar producto', ?, ?)`,
        [
          opId,
          id,
          stockInicial,
          stockInicial,
          costoBase,
          costoBase * stockInicial,
          proveedor,
          ahora,
          ahora,
        ]
      );
    }

    // Si se registraron precios (venta o costo > 0 o referencia USD), crear tarifa inicial en historial
    if (precioBase > 0 || costoBase > 0 || costoUsd !== null) {
      const tarifaId = 'tariff_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      db.runSync(
        `INSERT INTO photo_product_prices (
          id, product_id, sale_price, cost_price, cost_usd, exchange_rate,
          valid_from, valid_to, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'Tarifa inicial', ?, ?)`,
        [
          tarifaId,
          id,
          precioBase,
          costoBase,
          costoUsd,
          tipoCambio,
          fechaVigencia,
          ahora,
          ahora,
        ]
      );
    }
  });

  emitirCambioBoveda();

  return obtenerProductoPorId(id)!;
}

export interface DatosActualizarProducto {
  name?: string;
  sku?: string;
  category?: string;
  sizeFormat?: string;
  saleUnit?: string;
  description?: string;
  isActive?: boolean;
  basePrice?: number;
  costPrice?: number;
  minStock?: number;
  supplier?: string;
  costUsd?: number;
  exchangeRate?: number;
  priceValidFrom?: string;
  currency?: string;
  isCorrection?: boolean;
}

/**
 * Actualiza los datos de un producto existente.
 */
export function actualizarProducto(
  id: string,
  datos: DatosActualizarProducto
): Producto {
  const actual = obtenerProductoPorId(id);
  if (!actual) {
    throw new Error('El producto no existe.');
  }

  let nombreFinal = actual.name;
  if (datos.name !== undefined) {
    nombreFinal = datos.name.trim();
    if (!nombreFinal) {
      throw new Error('El nombre del producto no puede estar vacío.');
    }
    if (verificarNombreDuplicado(nombreFinal, id)) {
      throw new Error(`Ya existe otro producto con el nombre "${nombreFinal}".`);
    }
  }

  let unidadFinal = actual.saleUnit;
  if (datos.saleUnit !== undefined) {
    unidadFinal = datos.saleUnit.trim();
    if (!unidadFinal) {
      throw new Error('La unidad de venta no puede estar vacía.');
    }
  }

  const skuFinal = datos.sku !== undefined ? (datos.sku.trim() || null) : (actual.sku || null);
  const categoriaFinal = datos.category !== undefined ? (datos.category.trim() || 'General') : actual.category;
  const formatoFinal = datos.sizeFormat !== undefined ? (datos.sizeFormat.trim() || null) : (actual.sizeFormat || null);
  const descripcionFinal = datos.description !== undefined ? (datos.description.trim() || null) : (actual.description || null);
  const activoFinal = datos.isActive !== undefined ? (datos.isActive ? 1 : 0) : (actual.isActive ? 1 : 0);
  const precioFinal = datos.basePrice !== undefined ? Math.round(datos.basePrice) : (actual.basePrice ?? 0);
  const costoFinal = datos.costPrice !== undefined ? Math.round(datos.costPrice) : (actual.costPrice ?? 0);
  const minStockFinal = datos.minStock !== undefined ? Math.max(0, Number(datos.minStock)) : actual.minStock;
  const supplierFinal = datos.supplier !== undefined ? (datos.supplier.trim() || null) : (actual.supplier || null);
  const costoUsdFinal = datos.costUsd !== undefined ? datos.costUsd : (actual.costUsd ?? null);
  const tipoCambioFinal = datos.exchangeRate !== undefined ? datos.exchangeRate : (actual.exchangeRate ?? null);
  const fechaVigenciaFinal = datos.priceValidFrom || actual.priceValidFrom || fechaActualISO();
  const monedaFinal = datos.currency !== undefined ? datos.currency : (actual.currency || 'UYU');
  const ahora = Date.now();

  const db = obtenerBaseDatos();

  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE photo_products SET
        name = ?,
        sku = ?,
        category = ?,
        size_format = ?,
        sale_unit = ?,
        description = ?,
        is_active = ?,
        base_price = ?,
        cost_price = ?,
        min_stock = ?,
        supplier = ?,
        cost_usd = ?,
        exchange_rate = ?,
        price_valid_from = ?,
        currency = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        nombreFinal,
        skuFinal,
        categoriaFinal,
        formatoFinal,
        unidadFinal,
        descripcionFinal,
        activoFinal,
        precioFinal,
        costoFinal,
        minStockFinal,
        supplierFinal,
        costoUsdFinal,
        tipoCambioFinal,
        fechaVigenciaFinal,
        monedaFinal,
        ahora,
        id,
      ]
    );

    // Si los precios cambiaron, gestionar la tarifa
    const cambioPrecios =
      datos.basePrice !== undefined ||
      datos.costPrice !== undefined ||
      datos.costUsd !== undefined ||
      datos.exchangeRate !== undefined;

    if (cambioPrecios) {
      const tarifaVigenteFila = db.getFirstSync<FilaTarifaProducto>(
        "SELECT * FROM photo_product_prices WHERE product_id = ? AND (valid_to IS NULL OR TRIM(valid_to) = '') ORDER BY valid_from DESC, created_at DESC LIMIT 1",
        [id]
      );

      if (datos.isCorrection && tarifaVigenteFila) {
        db.runSync(
          `UPDATE photo_product_prices SET
            sale_price = ?,
            cost_price = ?,
            cost_usd = ?,
            exchange_rate = ?,
            valid_from = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            precioFinal,
            costoFinal,
            costoUsdFinal,
            tipoCambioFinal,
            fechaVigenciaFinal,
            ahora,
            tarifaVigenteFila.id,
          ]
        );
      } else if (tarifaVigenteFila) {
        // Nueva tarifa: cerrar anterior y abrir nueva
        db.runSync(
          'UPDATE photo_product_prices SET valid_to = ?, updated_at = ? WHERE id = ?',
          [fechaVigenciaFinal, ahora, tarifaVigenteFila.id]
        );

        const nuevoTarifaId = 'tariff_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        db.runSync(
          `INSERT INTO photo_product_prices (
            id, product_id, sale_price, cost_price, cost_usd, exchange_rate,
            valid_from, valid_to, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'Actualización de tarifa', ?, ?)`,
          [
            nuevoTarifaId,
            id,
            precioFinal,
            costoFinal,
            costoUsdFinal,
            tipoCambioFinal,
            fechaVigenciaFinal,
            ahora,
            ahora,
          ]
        );
      } else if (precioFinal > 0 || costoFinal > 0 || costoUsdFinal !== null) {
        // Primera tarifa
        const nuevoTarifaId = 'tariff_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        db.runSync(
          `INSERT INTO photo_product_prices (
            id, product_id, sale_price, cost_price, cost_usd, exchange_rate,
            valid_from, valid_to, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'Tarifa inicial', ?, ?)`,
          [
            nuevoTarifaId,
            id,
            precioFinal,
            costoFinal,
            costoUsdFinal,
            tipoCambioFinal,
            fechaVigenciaFinal,
            ahora,
            ahora,
          ]
        );
      }
    }
  });

  emitirCambioBoveda();

  return obtenerProductoPorId(id)!;
}

/**
 * Alterna el estado activo/inactivo de un producto.
 */
export function alternarEstadoProducto(id: string): Producto {
  const actual = obtenerProductoPorId(id);
  if (!actual) {
    throw new Error('El producto no existe.');
  }

  return actualizarProducto(id, { isActive: !actual.isActive });
}

/**
 * Elimina físicamente un producto del catálogo.
 */
export function eliminarProducto(id: string): void {
  const db = obtenerBaseDatos();
  db.runSync('DELETE FROM photo_products WHERE id = ?', [id]);
  emitirCambioBoveda();
}

/* ==========================================================================
   Fase 3: Calculadora de Precios y Estimaciones (Cálculos automáticos en memoria)
   ========================================================================== */

/**
 * Valida que una cantidad para la calculadora sea un número entero positivo mayor a cero.
 * Evita valores negativos, cero, decimales o no numéricos.
 */
export function validarCantidadCalculo(cantidad: number | string): number {
  const parsed = typeof cantidad === 'string' ? Number(cantidad.trim()) : cantidad;
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('La cantidad debe ser un número entero positivo mayor a cero.');
  }
  return parsed;
}

/**
 * Verifica si un producto tiene precio de venta y costo unitario registrados.
 * No asume cero como sustituto silencioso de un dato desconocido.
 */
export function verificarRegistroPrecioYCosto(producto: Producto): {
  tienePrecio: boolean;
  tieneCosto: boolean;
} {
  const tienePrecio = typeof producto.basePrice === 'number' && producto.basePrice > 0;
  const tieneCosto = typeof producto.costPrice === 'number' && producto.costPrice > 0;
  return { tienePrecio, tieneCosto };
}

/**
 * Calcula el importe, costo estimado y ganancia estimada para un ítem del cálculo.
 * - Importe = precio unitario × cantidad.
 * - Costo estimado = costo unitario × cantidad.
 * - Ganancia bruta estimada = importe − costo estimado.
 * Si falta el precio o el costo, no inventa valores ni usa cero silenciosamente: retorna null en los campos no calculables.
 */
export function calcularLineaProducto(
  producto: Producto,
  cantidad: number | string
): LineaCalculoProducto {
  const cantidadValidada = validarCantidadCalculo(cantidad);
  const { tienePrecio, tieneCosto } = verificarRegistroPrecioYCosto(producto);
  const esInactivo = !producto.isActive;
  const precioUnitario = tienePrecio ? producto.basePrice! : 0;
  const costoUnitario = tieneCosto ? producto.costPrice! : 0;
  const moneda = producto.currency || 'UYU';

  const subtotalImporte = tienePrecio ? precioUnitario * cantidadValidada : null;
  const subtotalCosto = tieneCosto ? costoUnitario * cantidadValidada : null;
  const subtotalGanancia =
    subtotalImporte !== null && subtotalCosto !== null
      ? subtotalImporte - subtotalCosto
      : null;

  const margenPorcentual =
    subtotalGanancia !== null && subtotalImporte !== null && subtotalImporte > 0
      ? (subtotalGanancia / subtotalImporte) * 100
      : null;

  return {
    producto,
    cantidad: cantidadValidada,
    precioUnitario,
    costoUnitario,
    tienePrecio,
    tieneCosto,
    esInactivo,
    moneda,
    subtotalImporte,
    subtotalCosto,
    subtotalGanancia,
    margenPorcentual,
  };
}

/**
 * Agrupa y totaliza los resultados de todas las líneas añadidas a la calculadora.
 * - Separa los totales por moneda (UYU, USD, etc.) sin sumar monedas incompatibles entre sí.
 * - No redondea internamente antes de totalizar.
 * - Advierte si faltan precios o costos en los productos seleccionados.
 */
export function calcularTotalesProductos(
  lineas: LineaCalculoProducto[]
): ResultadoCalculadoraProductos {
  const totalesPorMoneda: Record<string, TotalesMonedaCalculoProducto> = {};

  for (const linea of lineas) {
    const mon = linea.moneda;
    if (!totalesPorMoneda[mon]) {
      totalesPorMoneda[mon] = {
        moneda: mon,
        cantidadLineas: 0,
        totalUnidades: 0,
        totalImporte: 0,
        totalCosto: 0,
        totalGanancia: 0,
        margenPorcentual: null,
        itemsSinPrecio: 0,
        itemsSinCosto: 0,
        esCalculoCompleto: true,
      };
    }

    const t = totalesPorMoneda[mon];
    t.cantidadLineas += 1;
    t.totalUnidades += linea.cantidad;

    if (linea.subtotalImporte !== null) {
      t.totalImporte += linea.subtotalImporte;
    } else {
      t.itemsSinPrecio += 1;
      t.esCalculoCompleto = false;
    }

    if (linea.subtotalCosto !== null) {
      t.totalCosto += linea.subtotalCosto;
    } else {
      t.itemsSinCosto += 1;
      t.esCalculoCompleto = false;
    }

    if (linea.subtotalGanancia !== null) {
      t.totalGanancia += linea.subtotalGanancia;
    }
  }

  const monedas = Object.keys(totalesPorMoneda);
  for (const mon of monedas) {
    const t = totalesPorMoneda[mon];
    // El margen general se calcula sobre las líneas completas
    if (t.totalImporte > 0 && t.esCalculoCompleto) {
      t.margenPorcentual = (t.totalGanancia / t.totalImporte) * 100;
    } else {
      t.margenPorcentual = null;
    }
  }

  const esMultimoneda = monedas.length > 1;
  const tieneFaltantes = Object.values(totalesPorMoneda).some(
    t => !t.esCalculoCompleto
  );

  return {
    lineas,
    totalesPorMoneda,
    monedas,
    esMultimoneda,
    tieneFaltantes,
  };
}

/* ==========================================================================
   Fase 4: Historial de Precios, Evolución y Estadísticas del Catálogo
   ========================================================================== */

/**
 * Obtiene el historial detallado de cambios de precios para cada producto,
 * calculando para cada transición:
 * - Nombre y formato del producto.
 * - Precio de venta anterior y nuevo.
 * - Costo unitario anterior y nuevo.
 * - Ganancia bruta y margen estimado anterior y nuevo.
 * - Diferencias y variaciones porcentuales.
 * - Fecha de aplicación del cambio y moneda.
 * Ordenado estrictamente del cambio más reciente al más antiguo.
 */
export function obtenerHistorialCambiosPrecios(
  filtros?: FiltroHistorialPrecios
): CambioPrecioHistorial[] {
  const db = obtenerBaseDatos();

  let sqlProd = 'SELECT id, name, category, size_format, sale_unit, currency, is_active FROM photo_products WHERE 1=1';
  const paramsProd: (string | number)[] = [];

  if (filtros?.productId) {
    sqlProd += ' AND id = ?';
    paramsProd.push(filtros.productId);
  }

  if (filtros?.currency) {
    sqlProd += ' AND currency = ?';
    paramsProd.push(filtros.currency);
  }

  if (filtros?.search && filtros.search.trim()) {
    const pattern = `%${filtros.search.trim()}%`;
    sqlProd += ' AND (name LIKE ? OR size_format LIKE ? OR category LIKE ?)';
    paramsProd.push(pattern, pattern, pattern);
  }

  const productos = db.getAllSync<{
    id: string;
    name: string;
    category: string;
    size_format: string | null;
    sale_unit: string;
    currency: string | null;
    is_active: number;
  }>(sqlProd, paramsProd);

  const cambiosTotales: CambioPrecioHistorial[] = [];

  for (const prod of productos) {
    // Tarifas ordenadas cronológicamente de la más antigua a la más reciente
    const tarifasFilas = db.getAllSync<FilaTarifaProducto>(
      'SELECT * FROM photo_product_prices WHERE product_id = ? ORDER BY valid_from ASC, created_at ASC',
      [prod.id]
    );

    if (tarifasFilas.length === 0) continue;

    for (let i = 0; i < tarifasFilas.length; i++) {
      const tarifaActual = tarifasFilas[i];
      const tarifaAnterior = i > 0 ? tarifasFilas[i - 1] : null;

      const newSalePrice = tarifaActual.sale_price;
      const newCostPrice = tarifaActual.cost_price;
      const { grossProfit: newGrossProfit, grossMarginPercent: newGrossMarginPercent } =
        calcularGananciaYMargen(newSalePrice, newCostPrice);

      let previousSalePrice: number | null = null;
      let previousCostPrice: number | null = null;
      let previousGrossProfit: number | null = null;
      let previousGrossMarginPercent: number | null = null;
      let salePriceDiff: number | null = null;
      let salePriceDiffPercent: number | null = null;
      let costPriceDiff: number | null = null;
      let costPriceDiffPercent: number | null = null;
      const isInitialTariff = tarifaAnterior === null;

      if (tarifaAnterior) {
        previousSalePrice = tarifaAnterior.sale_price;
        previousCostPrice = tarifaAnterior.cost_price;
        const prevCalc = calcularGananciaYMargen(previousSalePrice, previousCostPrice);
        previousGrossProfit = prevCalc.grossProfit;
        previousGrossMarginPercent = prevCalc.grossMarginPercent;

        salePriceDiff = newSalePrice - previousSalePrice;
        salePriceDiffPercent = previousSalePrice > 0
          ? (salePriceDiff / previousSalePrice) * 100
          : null;

        costPriceDiff = newCostPrice - previousCostPrice;
        costPriceDiffPercent = previousCostPrice > 0
          ? (costPriceDiff / previousCostPrice) * 100
          : null;
      }

      const isCurrent = !tarifaActual.valid_to || tarifaActual.valid_to.trim() === '';
      const currency = tarifaActual.currency || prod.currency || 'UYU';

      // Filtros por fecha
      if (filtros?.startDate && tarifaActual.valid_from < filtros.startDate) {
        continue;
      }
      if (filtros?.endDate && tarifaActual.valid_from > filtros.endDate) {
        continue;
      }
      if (filtros?.currency && currency !== filtros.currency) {
        continue;
      }

      cambiosTotales.push({
        id: tarifaActual.id,
        productId: prod.id,
        productName: prod.name,
        sizeFormat: prod.size_format || undefined,
        category: prod.category || 'General',
        saleUnit: prod.sale_unit || 'Unidad',
        currency,
        newSalePrice,
        newCostPrice,
        newGrossProfit,
        newGrossMarginPercent,
        previousSalePrice,
        previousCostPrice,
        previousGrossProfit,
        previousGrossMarginPercent,
        salePriceDiff,
        salePriceDiffPercent,
        costPriceDiff,
        costPriceDiffPercent,
        validFrom: tarifaActual.valid_from,
        validTo: tarifaActual.valid_to || undefined,
        notes: tarifaActual.notes || undefined,
        isInitialTariff,
        isCurrent,
        createdAt: tarifaActual.created_at,
      });
    }
  }

  // Ordenar del más reciente al más antiguo
  cambiosTotales.sort((a, b) => {
    if (b.validFrom !== a.validFrom) {
      return b.validFrom.localeCompare(a.validFrom);
    }
    return b.createdAt - a.createdAt;
  });

  return cambiosTotales;
}

/**
 * Obtiene la evolución histórica de tarifas de un producto específico,
 * ordenadas cronológicamente para visualizar variaciones y líneas de tiempo.
 */
export function obtenerEvolucionTarifasProducto(productId: string): EvolucionTarifaItem[] {
  const db = obtenerBaseDatos();
  const tarifasFilas = db.getAllSync<FilaTarifaProducto>(
    'SELECT * FROM photo_product_prices WHERE product_id = ? ORDER BY valid_from ASC, created_at ASC',
    [productId]
  );

  const items: EvolucionTarifaItem[] = [];

  for (let i = 0; i < tarifasFilas.length; i++) {
    const tf = tarifasFilas[i];
    const prev = i > 0 ? tarifasFilas[i - 1] : null;

    const { grossProfit, grossMarginPercent } = calcularGananciaYMargen(tf.sale_price, tf.cost_price);
    const salePriceDiff = prev ? tf.sale_price - prev.sale_price : null;
    const salePriceDiffPercent = prev && prev.sale_price > 0
      ? (salePriceDiff! / prev.sale_price) * 100
      : null;

    items.push({
      id: tf.id,
      validFrom: tf.valid_from,
      validTo: tf.valid_to || undefined,
      salePrice: tf.sale_price,
      costPrice: tf.cost_price,
      grossProfit,
      grossMarginPercent,
      salePriceDiff,
      salePriceDiffPercent,
      notes: tf.notes || undefined,
      isCurrent: !tf.valid_to || tf.valid_to.trim() === '',
    });
  }

  return items;
}

/**
 * Obtiene estadísticas generales del catálogo de productos:
 * - Cantidad de productos activos e inactivos.
 * - Cantidad de productos sin precio o costo registrado.
 * - Promedios de venta, costo, ganancia bruta y margen, desglosados estrictamente por moneda.
 */
export function obtenerEstadisticasCatalogo(): EstadisticasCatalogoProductos {
  const db = obtenerBaseDatos();
  const productosFilas = db.getAllSync<FilaProducto>(
    'SELECT * FROM photo_products ORDER BY name COLLATE NOCASE ASC'
  );

  let totalProductosGlobal = 0;
  let totalActivosGlobal = 0;
  let totalInactivosGlobal = 0;
  let totalSinPrecioGlobal = 0;
  let totalSinCostoGlobal = 0;

  const porMoneda: Record<string, EstadisticasMonedaProductos> = {};

  for (const fila of productosFilas) {
    totalProductosGlobal++;
    const isActive = fila.is_active === 1;
    if (isActive) totalActivosGlobal++;
    else totalInactivosGlobal++;

    const tienePrecio = fila.base_price !== null && fila.base_price > 0;
    const tieneCosto = fila.cost_price !== null && fila.cost_price > 0;

    if (!tienePrecio) totalSinPrecioGlobal++;
    if (!tieneCosto) totalSinCostoGlobal++;

    const mon = fila.currency || 'UYU';
    if (!porMoneda[mon]) {
      porMoneda[mon] = {
        moneda: mon,
        totalProductos: 0,
        productosActivos: 0,
        productosInactivos: 0,
        productosSinPrecio: 0,
        productosSinCosto: 0,
        productosConPrecioYCosto: 0,
        precioPromedio: null,
        costoPromedio: null,
        gananciaPromedio: null,
        margenPromedio: null,
        totalTarifasRegistradas: 0,
      };
    }

    const stat = porMoneda[mon];
    stat.totalProductos++;
    if (isActive) stat.productosActivos++;
    else stat.productosInactivos++;

    if (!tienePrecio) stat.productosSinPrecio++;
    if (!tieneCosto) stat.productosSinCosto++;
    if (tienePrecio && tieneCosto) stat.productosConPrecioYCosto++;
  }

  // Contar tarifas en photo_product_prices agrupadas por moneda de producto
  const tarifasCountRows = db.getAllSync<{ currency: string | null; count: number }>(`
    SELECT COALESCE(p.currency, 'UYU') as currency, COUNT(*) as count
    FROM photo_product_prices pr
    JOIN photo_products p ON p.id = pr.product_id
    GROUP BY COALESCE(p.currency, 'UYU')
  `);

  for (const row of tarifasCountRows) {
    const mon = row.currency || 'UYU';
    if (porMoneda[mon]) {
      porMoneda[mon].totalTarifasRegistradas = row.count;
    }
  }

  // Calcular promedios para productos con datos válidos
  for (const mon of Object.keys(porMoneda)) {
    const stat = porMoneda[mon];
    const prodsMon = productosFilas.filter(p => (p.currency || 'UYU') === mon);

    const conPrecio = prodsMon.filter(p => p.base_price !== null && p.base_price > 0);
    if (conPrecio.length > 0) {
      const sumaPrecios = conPrecio.reduce((acc, p) => acc + (p.base_price || 0), 0);
      stat.precioPromedio = Math.round(sumaPrecios / conPrecio.length);
    }

    const conCosto = prodsMon.filter(p => p.cost_price !== null && p.cost_price > 0);
    if (conCosto.length > 0) {
      const sumaCostos = conCosto.reduce((acc, p) => acc + (p.cost_price || 0), 0);
      stat.costoPromedio = Math.round(sumaCostos / conCosto.length);
    }

    const conAmbos = prodsMon.filter(
      p => p.base_price !== null && p.base_price > 0 && p.cost_price !== null && p.cost_price > 0
    );
    if (conAmbos.length > 0) {
      const sumaGanancias = conAmbos.reduce(
        (acc, p) => acc + ((p.base_price || 0) - (p.cost_price || 0)),
        0
      );
      stat.gananciaPromedio = Math.round(sumaGanancias / conAmbos.length);

      const sumaPreciosAmbos = conAmbos.reduce((acc, p) => acc + (p.base_price || 0), 0);
      stat.margenPromedio = sumaPreciosAmbos > 0
        ? (sumaGanancias / sumaPreciosAmbos) * 100
        : null;
    }
  }

  return {
    totalProductosGlobal,
    totalActivosGlobal,
    totalInactivosGlobal,
    totalSinPrecioGlobal,
    totalSinCostoGlobal,
    monedas: Object.keys(porMoneda),
    porMoneda,
  };
}

export const obtenerEstadisticasCatalogoProductos = obtenerEstadisticasCatalogo;
