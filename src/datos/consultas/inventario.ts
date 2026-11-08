import { obtenerBaseDatos } from '../conexion';
import { asegurarEsquemaBaseDatos } from '../esquema';
import {
  OperacionInventario,
  TipoOperacionInventario,
  ResumenInventario,
  TipoFiltroPeriodoInventario,
  RankingProductoVenta,
  PuntoEvolucionVentas,
  AnalisisVentasInventario,
  ProductoImportadoExcel,
  Producto,
} from '../tipos';
import { emitirCambioBoveda } from '../sincronizacion';
import {
  obtenerProductoPorId,
  crearProducto,
} from './productos';

interface FilaOperacionInventario {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number | null;
  total_cost: number | null;
  unit_price: number | null;
  total_price: number | null;
  customer: string | null;
  payment_status: string | null;
  payment_method: string | null;
  account_id: string | null;
  account_name: string | null;
  transaction_id: string | null;
  debt_id: string | null;
  debt_status: string | null;
  related_operation_id: string | null;
  reason: string | null;
  supplier: string | null;
  notes: string | null;
  date: number;
  created_at: number;
}

function hoyISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Obtiene o crea la categoría financiera "Ventas" en la tabla categories
 * para asociar los ingresos cobrados al sistema de movimientos.
 */
function obtenerOCrearCategoriaVentas(): string {
  const db = obtenerBaseDatos();
  const cat = db.getFirstSync<{ id: string }>(
    "SELECT id FROM categories WHERE flow_type = 'INCOME' AND (LOWER(name) = 'ventas' OR LOWER(name) LIKE '%venta%') LIMIT 1"
  );
  if (cat) return cat.id;

  const fallback = db.getFirstSync<{ id: string }>(
    "SELECT id FROM categories WHERE flow_type = 'INCOME' LIMIT 1"
  );
  if (fallback) return fallback.id;

  const newId = 'cat_ventas_' + Math.random().toString(36).substring(2, 8);
  db.runSync(
    "INSERT INTO categories (id, name, flow_type, icon, color, is_system) VALUES (?, 'Ventas', 'INCOME', 'sell', '#57F5AB', 1)",
    [newId]
  );
  return newId;
}

function mapearFilaAOperacion(fila: FilaOperacionInventario): OperacionInventario {
  const totalPrice = fila.total_price !== null && fila.total_price !== undefined ? fila.total_price : undefined;
  const totalCost = fila.total_cost !== null && fila.total_cost !== undefined ? fila.total_cost : undefined;
  const grossProfit = totalPrice !== undefined && totalCost !== undefined ? (totalPrice - totalCost) : undefined;

  return {
    id: fila.id,
    productId: fila.product_id,
    type: fila.type as TipoOperacionInventario,
    quantity: fila.quantity,
    previousStock: fila.previous_stock,
    newStock: fila.new_stock,
    unitCost: fila.unit_cost !== null && fila.unit_cost !== undefined ? fila.unit_cost : undefined,
    totalCost,
    unitPrice: fila.unit_price !== null && fila.unit_price !== undefined ? fila.unit_price : undefined,
    totalPrice,
    grossProfit,
    customer: fila.customer || undefined,
    paymentStatus: (fila.payment_status as any) || undefined,
    paymentMethod: fila.payment_method || undefined,
    accountId: fila.account_id || undefined,
    accountName: fila.account_name || undefined,
    transactionId: fila.transaction_id || undefined,
    debtId: fila.debt_id || undefined,
    debtStatus: fila.debt_status || undefined,
    relatedOperationId: fila.related_operation_id || undefined,
    reason: fila.reason || undefined,
    supplier: fila.supplier || undefined,
    notes: fila.notes || undefined,
    date: fila.date,
    createdAt: fila.created_at,
  };
}

/**
 * Obtiene el historial completo de operaciones de inventario de un producto enriquecido con nombres de cuentas y deudas.
 */
export function obtenerOperacionesProducto(productId: string): OperacionInventario[] {
  asegurarEsquemaBaseDatos();
  const db = obtenerBaseDatos();
  const rows = db.getAllSync<FilaOperacionInventario>(
    `SELECT
      io.*,
      a.name as account_name,
      d.status as debt_status
    FROM inventory_operations io
    LEFT JOIN accounts a ON io.account_id = a.id
    LEFT JOIN debts d ON io.debt_id = d.id
    WHERE io.product_id = ?
    ORDER BY io.date DESC, io.created_at DESC`,
    [productId]
  );
  return rows.map(mapearFilaAOperacion);
}

export interface DatosRegistrarCompra {
  productId: string;
  quantity: number; // Unidades a sumar (> 0)
  unitCost?: number; // Costo unitario en centavos (>= 0)
  supplier?: string;
  notes?: string;
  actualizarCostoProducto?: boolean;
  date?: number;
}

/**
 * Registra una compra de mercadería / insumos aumentando el stock del producto.
 */
export function registrarCompraInventario(datos: DatosRegistrarCompra): OperacionInventario {
  const cantidad = Number(datos.quantity);
  if (isNaN(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad comprada debe ser un número mayor a cero.');
  }

  const producto = obtenerProductoPorId(datos.productId);
  if (!producto) {
    throw new Error('El producto no existe.');
  }

  const costoUnitario =
    datos.unitCost !== undefined && !isNaN(datos.unitCost) && datos.unitCost >= 0
      ? Math.round(datos.unitCost)
      : (producto.costPrice ?? 0);

  const costoTotal = Math.round(costoUnitario * cantidad);
  const previousStock = producto.currentStock ?? 0;
  const newStock = previousStock + cantidad;
  const ahora = Date.now();
  const fechaOperacion = datos.date || ahora;
  const idOperacion = 'op_buy_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const proveedor = datos.supplier?.trim() || producto.supplier || null;

  const db = obtenerBaseDatos();

  db.withTransactionSync(() => {
    // 1. Insertar registro inmutable de la operación de compra
    db.runSync(
      `INSERT INTO inventory_operations (
        id, product_id, type, quantity, previous_stock, new_stock,
        unit_cost, total_cost, reason, supplier, notes, date, created_at
      ) VALUES (?, ?, 'PURCHASE', ?, ?, ?, ?, ?, 'Compra a proveedor', ?, ?, ?, ?)`,
      [
        idOperacion,
        datos.productId,
        cantidad,
        previousStock,
        newStock,
        costoUnitario,
        costoTotal,
        proveedor,
        datos.notes?.trim() || null,
        fechaOperacion,
        ahora,
      ]
    );

    // 2. Actualizar stock actual y proveedor en el producto
    if (datos.actualizarCostoProducto && costoUnitario > 0) {
      db.runSync(
        `UPDATE photo_products SET
          current_stock = ?,
          cost_price = ?,
          supplier = COALESCE(?, supplier),
          updated_at = ?
        WHERE id = ?`,
        [newStock, costoUnitario, proveedor, ahora, datos.productId]
      );
    } else {
      db.runSync(
        `UPDATE photo_products SET
          current_stock = ?,
          supplier = COALESCE(?, supplier),
          updated_at = ?
        WHERE id = ?`,
        [newStock, proveedor, ahora, datos.productId]
      );
    }
  });

  emitirCambioBoveda();

  return {
    id: idOperacion,
    productId: datos.productId,
    type: 'PURCHASE',
    quantity: cantidad,
    previousStock,
    newStock,
    unitCost: costoUnitario,
    totalCost: costoTotal,
    reason: 'Compra a proveedor',
    supplier: proveedor || undefined,
    notes: datos.notes?.trim() || undefined,
    date: fechaOperacion,
    createdAt: ahora,
  };
}

export interface DatosRegistrarDevolucionProveedor {
  productId: string;
  quantity: number; // Unidades a devolver (> 0)
  supplier?: string;
  reason: string; // Motivo de la devolución
  notes?: string;
  date?: number;
}

/**
 * Registra una devolución de producto al proveedor reduciendo el stock existente.
 */
export function registrarDevolucionProveedor(datos: DatosRegistrarDevolucionProveedor): OperacionInventario {
  const cantidad = Number(datos.quantity);
  if (isNaN(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad a devolver debe ser mayor a cero.');
  }

  const motivoLimpio = datos.reason?.trim();
  if (!motivoLimpio) {
    throw new Error('Debes indicar el motivo de la devolución al proveedor.');
  }

  const producto = obtenerProductoPorId(datos.productId);
  if (!producto) {
    throw new Error('El producto no existe.');
  }

  const previousStock = producto.currentStock ?? 0;
  if (cantidad > previousStock) {
    throw new Error(
      `No puedes devolver ${cantidad} ${producto.saleUnit}s. El stock actual disponible es ${previousStock} ${producto.saleUnit}s.`
    );
  }

  const newStock = previousStock - cantidad;
  const costoUnitario = producto.costPrice ?? 0;
  const costoTotal = Math.round(costoUnitario * cantidad);
  const ahora = Date.now();
  const fechaOperacion = datos.date || ahora;
  const idOperacion = 'op_ret_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const proveedor = datos.supplier?.trim() || producto.supplier || null;

  const db = obtenerBaseDatos();

  db.withTransactionSync(() => {
    // 1. Insertar operación de devolución
    db.runSync(
      `INSERT INTO inventory_operations (
        id, product_id, type, quantity, previous_stock, new_stock,
        unit_cost, total_cost, reason, supplier, notes, date, created_at
      ) VALUES (?, ?, 'SUPPLIER_RETURN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idOperacion,
        datos.productId,
        cantidad,
        previousStock,
        newStock,
        costoUnitario,
        costoTotal,
        motivoLimpio,
        proveedor,
        datos.notes?.trim() || null,
        fechaOperacion,
        ahora,
      ]
    );

    // 2. Actualizar stock actual en el producto
    db.runSync(
      'UPDATE photo_products SET current_stock = ?, updated_at = ? WHERE id = ?',
      [newStock, ahora, datos.productId]
    );
  });

  emitirCambioBoveda();

  return {
    id: idOperacion,
    productId: datos.productId,
    type: 'SUPPLIER_RETURN',
    quantity: cantidad,
    previousStock,
    newStock,
    unitCost: costoUnitario,
    totalCost: costoTotal,
    reason: motivoLimpio,
    supplier: proveedor || undefined,
    notes: datos.notes?.trim() || undefined,
    date: fechaOperacion,
    createdAt: ahora,
  };
}

export interface DatosRegistrarAjuste {
  productId: string;
  adjustmentMode: 'DELTA' | 'COUNT'; // DELTA = restar o sumar cantidad; COUNT = nuevo stock real contado
  quantity?: number; // Para modo DELTA (ej: -2 por rotura, +3 por hallazgo)
  newStockTarget?: number; // Para modo COUNT (ej: conté 14 unidades)
  reason: string; // Motivo: Pérdida, Rotura, Diferencia de conteo, etc.
  notes?: string;
  date?: number;
}

/**
 * Registra un ajuste de inventario por pérdida, rotura, vencimiento o diferencia de conteo.
 */
export function registrarAjusteInventario(datos: DatosRegistrarAjuste): OperacionInventario {
  const motivoLimpio = datos.reason?.trim();
  if (!motivoLimpio) {
    throw new Error('Debes indicar el motivo del ajuste de inventario.');
  }

  const producto = obtenerProductoPorId(datos.productId);
  if (!producto) {
    throw new Error('El producto no existe.');
  }

  const previousStock = producto.currentStock ?? 0;
  let newStock: number;
  let cantidadAfectada: number;

  if (datos.adjustmentMode === 'COUNT') {
    if (datos.newStockTarget === undefined || isNaN(Number(datos.newStockTarget))) {
      throw new Error('Debes ingresar la cantidad de unidades contadas.');
    }
    const contado = Number(datos.newStockTarget);
    if (contado < 0) {
      throw new Error('El stock contado no puede ser negativo.');
    }
    newStock = contado;
    cantidadAfectada = Math.abs(newStock - previousStock);
    if (newStock === previousStock) {
      throw new Error('El conteo ingresado es idéntico al stock actual registrado.');
    }
  } else {
    // Modo DELTA
    if (datos.quantity === undefined || isNaN(Number(datos.quantity))) {
      throw new Error('Debes ingresar la cantidad del ajuste.');
    }
    const delta = Number(datos.quantity);
    if (delta === 0) {
      throw new Error('La cantidad de ajuste no puede ser cero.');
    }
    newStock = previousStock + delta;
    if (newStock < 0) {
      throw new Error(
        `El ajuste resulta en un stock negativo (${newStock}). El stock actual es ${previousStock}.`
      );
    }
    cantidadAfectada = Math.abs(delta);
  }

  const costoUnitario = producto.costPrice ?? 0;
  const costoTotal = Math.round(costoUnitario * cantidadAfectada);
  const ahora = Date.now();
  const fechaOperacion = datos.date || ahora;
  const idOperacion = 'op_adj_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);

  const db = obtenerBaseDatos();

  db.withTransactionSync(() => {
    // 1. Insertar operación de ajuste
    db.runSync(
      `INSERT INTO inventory_operations (
        id, product_id, type, quantity, previous_stock, new_stock,
        unit_cost, total_cost, reason, supplier, notes, date, created_at
      ) VALUES (?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      [
        idOperacion,
        datos.productId,
        cantidadAfectada,
        previousStock,
        newStock,
        costoUnitario,
        costoTotal,
        motivoLimpio,
        datos.notes?.trim() || null,
        fechaOperacion,
        ahora,
      ]
    );

    // 2. Actualizar stock en el producto
    db.runSync(
      'UPDATE photo_products SET current_stock = ?, updated_at = ? WHERE id = ?',
      [newStock, ahora, datos.productId]
    );
  });

  emitirCambioBoveda();

  return {
    id: idOperacion,
    productId: datos.productId,
    type: 'ADJUSTMENT',
    quantity: cantidadAfectada,
    previousStock,
    newStock,
    unitCost: costoUnitario,
    totalCost: costoTotal,
    reason: motivoLimpio,
    notes: datos.notes?.trim() || undefined,
    date: fechaOperacion,
    createdAt: ahora,
  };
}

export interface DatosRegistrarVenta {
  productId: string;
  quantity: number; // unidades vendidas (> 0, <= currentStock)
  unitPrice: number; // precio unitario de venta en centavos (>= 0)
  paymentMode: 'IMMEDIATE_ACCOUNT' | 'CREDIT_PENDING';
  accountId?: string; // obligatorio si paymentMode === 'IMMEDIATE_ACCOUNT'
  customer?: string; // obligatorio si paymentMode === 'CREDIT_PENDING'
  dueDate?: string; // 'YYYY-MM-DD' opcional para venta a crédito
  notes?: string;
  date?: number;
}

/**
 * Registra una venta desde el detalle del producto:
 * - Reduce el stock disponible.
 * - Guarda el costo histórico unitario del producto en el momento de la venta.
 * - Registra el ingreso en la cuenta bancaria/efectivo si fue cobrado de inmediato.
 * - Si es pendiente de cobro, registra la cuenta por cobrar en el sistema de deudas (RECEIVABLE).
 * - Distingue venta, cobro, costo de lo vendido y ganancia bruta.
 */
export function registrarVentaInventario(datos: DatosRegistrarVenta): OperacionInventario {
  const cantidad = Number(datos.quantity);
  if (isNaN(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad vendida debe ser mayor a cero.');
  }

  const producto = obtenerProductoPorId(datos.productId);
  if (!producto) {
    throw new Error('El producto no existe.');
  }

  const previousStock = producto.currentStock ?? 0;
  if (cantidad > previousStock) {
    throw new Error(
      `Stock insuficiente para vender ${cantidad} ${producto.saleUnit}s. El stock disponible actual es de ${previousStock} ${producto.saleUnit}s.`
    );
  }

  if (datos.unitPrice === undefined || isNaN(datos.unitPrice) || datos.unitPrice < 0) {
    throw new Error('El precio unitario de venta no puede ser negativo.');
  }

  const unitPrice = Math.round(datos.unitPrice);
  const totalPrice = Math.round(unitPrice * cantidad); // Venta: importe total vendido
  const unitCost = producto.costPrice ?? 0; // Costo histórico inmutable en el momento de la venta
  const totalCost = Math.round(unitCost * cantidad); // Costo de lo vendido
  const grossProfit = totalPrice - totalCost; // Ganancia bruta
  const newStock = previousStock - cantidad;

  const ahora = Date.now();
  const fechaOperacion = datos.date || ahora;
  const idOperacion = 'op_sale_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const cliente = datos.customer?.trim() || undefined;

  let transactionId: string | null = null;
  let debtId: string | null = null;
  let accountId: string | null = null;
  let paymentStatus: 'PAID' | 'PENDING' = 'PAID';

  const db = obtenerBaseDatos();

  db.withTransactionSync(() => {
    if (datos.paymentMode === 'IMMEDIATE_ACCOUNT') {
      if (!datos.accountId) {
        throw new Error('Debes seleccionar la cuenta donde ingresa el dinero cobrado.');
      }
      accountId = datos.accountId;
      paymentStatus = 'PAID';

      // 1. Registrar ingreso en la tabla transactions
      transactionId = 'tx_sale_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const categoriaId = obtenerOCrearCategoriaVentas();
      const notaTx = `Venta: ${cantidad} x ${producto.name}${cliente ? ` (${cliente})` : ''}`;

      db.runSync(
        `INSERT INTO transactions (
          id, amount, type, source_account_id, target_account_id,
          category_id, date, note, payee, tags
        ) VALUES (?, ?, 'INCOME', ?, NULL, ?, ?, ?, ?, 'VENTA')`,
        [
          transactionId,
          totalPrice,
          accountId,
          categoriaId,
          fechaOperacion,
          datos.notes?.trim() ? `${notaTx} - ${datos.notes.trim()}` : notaTx,
          cliente || 'Cliente',
        ]
      );

      // 2. Incrementar el saldo disponible en la cuenta receptora
      db.runSync(
        'UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?',
        [totalPrice, accountId]
      );
    } else {
      // Pendiente de cobro (a crédito / fiado): no altera el dinero de cuentas, crea cuenta por cobrar en debts
      if (!cliente) {
        throw new Error('Debes indicar el nombre del cliente para registrar una venta a crédito o pendiente de cobro.');
      }
      paymentStatus = 'PENDING';
      debtId = 'debt_sale_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const conceptoDeuda = `Venta de ${cantidad} x ${producto.name}`;
      const fechaEmision = hoyISO();

      db.runSync(
        `INSERT INTO debts (
          id, type, person, concept, total_amount, paid_amount, remaining_amount,
          issue_date, due_date, status, notes, reminder_days_before, reminder_time,
          notification_id, created_at, updated_at
        ) VALUES (?, 'RECEIVABLE', ?, ?, ?, 0, ?, ?, ?, 'PENDING', ?, NULL, '09:00', NULL, ?, ?)`,
        [
          debtId,
          cliente,
          conceptoDeuda,
          totalPrice,
          totalPrice,
          fechaEmision,
          datos.dueDate || null,
          datos.notes?.trim() || null,
          ahora,
          ahora,
        ]
      );
    }

    // 3. Reducir stock del producto
    db.runSync(
      'UPDATE photo_products SET current_stock = ?, updated_at = ? WHERE id = ?',
      [newStock, ahora, datos.productId]
    );

    // 4. Registrar operación de inventario con todos los datos históricos inmutables
    db.runSync(
      `INSERT INTO inventory_operations (
        id, product_id, type, quantity, previous_stock, new_stock,
        unit_cost, total_cost, unit_price, total_price, customer,
        payment_status, payment_method, account_id, transaction_id, debt_id,
        related_operation_id, reason, supplier, notes, date, created_at
      ) VALUES (?, ?, 'SALE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'Venta a cliente', NULL, ?, ?, ?)`,
      [
        idOperacion,
        datos.productId,
        cantidad,
        previousStock,
        newStock,
        unitCost,
        totalCost,
        unitPrice,
        totalPrice,
        cliente || null,
        paymentStatus,
        datos.paymentMode,
        accountId,
        transactionId,
        debtId,
        datos.notes?.trim() || null,
        fechaOperacion,
        ahora,
      ]
    );
  });

  emitirCambioBoveda();

  return {
    id: idOperacion,
    productId: datos.productId,
    type: 'SALE',
    quantity: cantidad,
    previousStock,
    newStock,
    unitCost,
    totalCost,
    unitPrice,
    totalPrice,
    grossProfit,
    customer: cliente,
    paymentStatus,
    paymentMethod: datos.paymentMode,
    accountId: accountId || undefined,
    transactionId: transactionId || undefined,
    debtId: debtId || undefined,
    reason: 'Venta a cliente',
    notes: datos.notes?.trim() || undefined,
    date: fechaOperacion,
    createdAt: ahora,
  };
}

export interface DatosRegistrarDevolucionCliente {
  productId: string;
  quantity: number; // unidades devueltas por el cliente (> 0)
  unitPrice?: number; // precio unitario cobrado a reembolsar
  unitCost?: number; // costo unitario histórico que reingresa al inventario
  originalSaleId?: string; // id de la venta en inventory_operations
  customer?: string;
  reason: string; // Motivo de la devolución
  refundMode: 'REFUND_FROM_ACCOUNT' | 'REDUCE_DEBT' | 'NO_REFUND';
  accountId?: string; // cuenta desde donde se reembolsa el dinero
  debtId?: string; // id de la cuenta por cobrar a cancelar/reducir
  notes?: string;
  date?: number;
}

/**
 * Registra una devolución efectuada por un cliente:
 * - Aumenta el stock en el inventario.
 * - Reintegra el costo de lo vendido al valor del inventario.
 * - Reembolsa el dinero restándolo de la cuenta financiera correspondiente (si fue cobrado).
 * - O reduce/cancela la cuenta por cobrar en el sistema de deudas (si estaba pendiente de cobro).
 */
export function registrarDevolucionCliente(datos: DatosRegistrarDevolucionCliente): OperacionInventario {
  const cantidad = Number(datos.quantity);
  if (isNaN(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad devuelta debe ser un número mayor a cero.');
  }

  const motivoLimpio = datos.reason?.trim();
  if (!motivoLimpio) {
    throw new Error('Debes indicar el motivo de la devolución del cliente.');
  }

  const producto = obtenerProductoPorId(datos.productId);
  if (!producto) {
    throw new Error('El producto no existe.');
  }

  const previousStock = producto.currentStock ?? 0;
  const newStock = previousStock + cantidad;

  // Buscar venta original si fue provista
  const db = obtenerBaseDatos();
  let ventaOriginal: FilaOperacionInventario | null = null;
  if (datos.originalSaleId) {
    ventaOriginal = db.getFirstSync<FilaOperacionInventario>(
      'SELECT * FROM inventory_operations WHERE id = ?',
      [datos.originalSaleId]
    );
  }

  const unitPrice =
    datos.unitPrice !== undefined && datos.unitPrice >= 0
      ? Math.round(datos.unitPrice)
      : (ventaOriginal?.unit_price ?? producto.basePrice ?? 0);

  const unitCost =
    datos.unitCost !== undefined && datos.unitCost >= 0
      ? Math.round(datos.unitCost)
      : (ventaOriginal?.unit_cost ?? producto.costPrice ?? 0);

  const totalRefund = Math.round(unitPrice * cantidad); // importe reembolsado
  const totalCost = Math.round(unitCost * cantidad); // costo que reingresa
  const ahora = Date.now();
  const fechaOperacion = datos.date || ahora;
  const idOperacion = 'op_cref_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const cliente = datos.customer?.trim() || ventaOriginal?.customer || undefined;

  let transactionId: string | null = null;
  let debtId: string | null = datos.debtId || ventaOriginal?.debt_id || null;
  let accountId: string | null = null;

  db.withTransactionSync(() => {
    if (datos.refundMode === 'REFUND_FROM_ACCOUNT') {
      if (!datos.accountId) {
        throw new Error('Debes seleccionar la cuenta financiera de la cual sale el reembolso al cliente.');
      }
      accountId = datos.accountId;

      // 1. Registrar gasto/reembolso en transactions
      transactionId = 'tx_refund_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const categoriaId = obtenerOCrearCategoriaVentas();
      const notaTx = `Reembolso por devolución: ${cantidad} x ${producto.name}${cliente ? ` (${cliente})` : ''}`;

      db.runSync(
        `INSERT INTO transactions (
          id, amount, type, source_account_id, target_account_id,
          category_id, date, note, payee, tags
        ) VALUES (?, ?, 'EXPENSE', ?, NULL, ?, ?, ?, ?, 'DEVOLUCION_VENTA')`,
        [
          transactionId,
          totalRefund,
          accountId,
          categoriaId,
          fechaOperacion,
          datos.notes?.trim() ? `${notaTx} - ${datos.notes.trim()}` : notaTx,
          cliente || 'Cliente',
        ]
      );

      // 2. Descontar el dinero de la cuenta
      db.runSync(
        'UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?',
        [totalRefund, accountId]
      );
    } else if (datos.refundMode === 'REDUCE_DEBT') {
      if (!debtId) {
        throw new Error('No se encontró la cuenta por cobrar asociada para reducir el saldo.');
      }

      // Reducir el saldo pendiente de la cuenta por cobrar en debts
      db.runSync(
        `UPDATE debts SET
          total_amount = MAX(0, total_amount - ?),
          remaining_amount = MAX(0, remaining_amount - ?),
          status = CASE WHEN remaining_amount - ? <= 0 THEN 'CANCELLED' ELSE status END,
          updated_at = ?
        WHERE id = ?`,
        [totalRefund, totalRefund, totalRefund, ahora, debtId]
      );
    }

    // 3. Aumentar stock del producto devuelto
    db.runSync(
      'UPDATE photo_products SET current_stock = ?, updated_at = ? WHERE id = ?',
      [newStock, ahora, datos.productId]
    );

    // 4. Registrar la operación inmutable
    db.runSync(
      `INSERT INTO inventory_operations (
        id, product_id, type, quantity, previous_stock, new_stock,
        unit_cost, total_cost, unit_price, total_price, customer,
        payment_status, payment_method, account_id, transaction_id, debt_id,
        related_operation_id, reason, supplier, notes, date, created_at
      ) VALUES (?, ?, 'CUSTOMER_RETURN', ?, ?, ?, ?, ?, ?, ?, ?, 'REFUNDED', ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      [
        idOperacion,
        datos.productId,
        cantidad,
        previousStock,
        newStock,
        unitCost,
        totalCost,
        unitPrice,
        totalRefund,
        cliente || null,
        datos.refundMode,
        accountId,
        transactionId,
        debtId,
        datos.originalSaleId || null,
        motivoLimpio,
        datos.notes?.trim() || null,
        fechaOperacion,
        ahora,
      ]
    );
  });

  emitirCambioBoveda();

  return {
    id: idOperacion,
    productId: datos.productId,
    type: 'CUSTOMER_RETURN',
    quantity: cantidad,
    previousStock,
    newStock,
    unitCost,
    totalCost,
    unitPrice,
    totalPrice: totalRefund,
    grossProfit: -(totalRefund - totalCost),
    customer: cliente,
    paymentStatus: 'REFUNDED',
    paymentMethod: datos.refundMode,
    accountId: accountId || undefined,
    transactionId: transactionId || undefined,
    debtId: debtId || undefined,
    relatedOperationId: datos.originalSaleId,
    reason: motivoLimpio,
    notes: datos.notes?.trim() || undefined,
    date: fechaOperacion,
    createdAt: ahora,
  };
}

/**
 * Calcula el rango de fechas [start, end] en milisegundos para los filtros de período del inventario.
 */
export function obtenerRangoFechasPeriodoInventario(filtro: TipoFiltroPeriodoInventario = 'ESTE_MES'): {
  start: number;
  end: number;
  label: string;
} {
  const now = new Date();
  switch (filtro) {
    case 'ESTE_MES': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const label = `${meses[now.getMonth()]} ${now.getFullYear()}`;
      return { start, end, label };
    }
    case 'MES_ANTERIOR': {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const start = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1, 0, 0, 0, 0).getTime();
      const end = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const label = `${meses[prevMonthDate.getMonth()]} ${prevMonthDate.getFullYear()}`;
      return { start, end, label };
    }
    case 'ULTIMOS_30_DIAS': {
      const end = now.getTime();
      const start = end - 30 * 24 * 60 * 60 * 1000;
      return { start, end, label: 'Últimos 30 días' };
    }
    case 'ESTE_ANO': {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
      return { start, end, label: `Año ${now.getFullYear()}` };
    }
    case 'TODO':
    default: {
      return { start: 0, end: Date.now() + 365 * 24 * 60 * 60 * 1000, label: 'Todo el historial' };
    }
  }
}

/**
 * Calcula métricas agregadas de inventario y ventas para el período seleccionado.
 * - Valor actual del inventario: calculado al costo actual de los productos activos.
 * - Ventas, cobros y ganancia bruta: acotados al rango del período seleccionado.
 */
export function obtenerResumenInventario(filtroPeriodo: TipoFiltroPeriodoInventario = 'ESTE_MES'): ResumenInventario {
  asegurarEsquemaBaseDatos();
  const db = obtenerBaseDatos();
  const { start, end, label } = obtenerRangoFechasPeriodoInventario(filtroPeriodo);

  const row = db.getFirstSync<{
    total_count: number;
    active_count: number;
    total_stock: number | null;
    cost_value: number | null;
    sale_value: number | null;
    low_stock_count: number;
    out_of_stock_count: number;
  }>(`
    SELECT
      COUNT(*) as total_count,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count,
      SUM(COALESCE(current_stock, 0)) as total_stock,
      SUM(COALESCE(current_stock, 0) * COALESCE(cost_price, 0)) as cost_value,
      SUM(COALESCE(current_stock, 0) * COALESCE(base_price, 0)) as sale_value,
      SUM(CASE WHEN is_active = 1 AND current_stock > 0 AND current_stock <= COALESCE(min_stock, 0) THEN 1 ELSE 0 END) as low_stock_count,
      SUM(CASE WHEN is_active = 1 AND (current_stock IS NULL OR current_stock <= 0) THEN 1 ELSE 0 END) as out_of_stock_count
    FROM photo_products
  `);

  const salesRow = db.getFirstSync<{
    total_sales: number | null;
    total_collected: number | null;
    total_pending: number | null;
    total_cogs: number | null;
    total_units_sold: number | null;
  }>(`
    SELECT
      SUM(CASE
        WHEN type = 'SALE' THEN COALESCE(total_price, 0)
        WHEN type = 'CUSTOMER_RETURN' THEN -COALESCE(total_price, 0)
        ELSE 0
      END) as total_sales,
      SUM(CASE
        WHEN type = 'SALE' AND payment_status = 'PAID' THEN COALESCE(total_price, 0)
        WHEN type = 'CUSTOMER_RETURN' AND payment_method = 'REFUND_FROM_ACCOUNT' THEN -COALESCE(total_price, 0)
        ELSE 0
      END) as total_collected,
      SUM(CASE
        WHEN type = 'SALE' AND payment_status = 'PENDING' THEN COALESCE(total_price, 0)
        ELSE 0
      END) as total_pending,
      SUM(CASE
        WHEN type = 'SALE' THEN COALESCE(total_cost, 0)
        WHEN type = 'CUSTOMER_RETURN' THEN -COALESCE(total_cost, 0)
        ELSE 0
      END) as total_cogs,
      SUM(CASE
        WHEN type = 'SALE' THEN quantity
        WHEN type = 'CUSTOMER_RETURN' THEN -quantity
        ELSE 0
      END) as total_units_sold
    FROM inventory_operations
    WHERE date >= ? AND date <= ? AND type IN ('SALE', 'CUSTOMER_RETURN')
  `, [start, end]);

  const totalProducts = row?.total_count || 0;
  const activeProducts = row?.active_count || 0;
  const totalStockUnits = row?.total_stock || 0;
  const inventoryCostValue = Math.round(row?.cost_value || 0);
  const inventorySaleValue = Math.round(row?.sale_value || 0);
  const potentialProfit = inventorySaleValue - inventoryCostValue;
  const lowStockCount = row?.low_stock_count || 0;
  const outOfStockCount = row?.out_of_stock_count || 0;

  const totalSalesValue = Math.max(0, Math.round(salesRow?.total_sales || 0));
  const totalCollectedValue = Math.max(0, Math.round(salesRow?.total_collected || 0));
  const totalPendingCollectValue = Math.max(0, Math.round(salesRow?.total_pending || 0));
  const totalCostOfGoodsSold = Math.max(0, Math.round(salesRow?.total_cogs || 0));
  const totalGrossProfit = totalSalesValue - totalCostOfGoodsSold;
  const totalUnitsSold = Math.max(0, Number(salesRow?.total_units_sold || 0));

  return {
    totalProducts,
    activeProducts,
    totalStockUnits,
    inventoryCostValue,
    inventorySaleValue,
    potentialProfit,
    lowStockCount,
    outOfStockCount,
    totalSalesValue,
    totalCollectedValue,
    totalPendingCollectValue,
    totalCostOfGoodsSold,
    totalGrossProfit,
    totalUnitsSold,
    periodoFiltro: filtroPeriodo,
    labelPeriodo: label,
  };
}

/**
 * Obtiene el análisis comercial y financiero completo con datos reales para el período seleccionado.
 * Distingue explícitamente:
 * - Venta: importe total facturado/vendido.
 * - Cobro: dinero que efectivamente ingresó a las cuentas.
 * - Costo de lo vendido: costo histórico de salida de los productos.
 * - Ganancia bruta: Venta menos Costo de lo vendido.
 * - Rankings de productos más vendidos y más rentables.
 * - Serie cronológica de evolución de ventas y ganancias.
 */
export function obtenerAnalisisVentasInventario(
  filtroPeriodo: TipoFiltroPeriodoInventario = 'ESTE_MES'
): AnalisisVentasInventario {
  asegurarEsquemaBaseDatos();
  const db = obtenerBaseDatos();
  const { start, end, label } = obtenerRangoFechasPeriodoInventario(filtroPeriodo);

  // 1. Resumen global del período
  const summaryRow = db.getFirstSync<{
    total_sales: number | null;
    total_collected: number | null;
    total_pending: number | null;
    total_cogs: number | null;
    total_units: number | null;
  }>(`
    SELECT
      SUM(CASE
        WHEN type = 'SALE' THEN COALESCE(total_price, 0)
        WHEN type = 'CUSTOMER_RETURN' THEN -COALESCE(total_price, 0)
        ELSE 0
      END) as total_sales,
      SUM(CASE
        WHEN type = 'SALE' AND payment_status = 'PAID' THEN COALESCE(total_price, 0)
        WHEN type = 'CUSTOMER_RETURN' AND payment_method = 'REFUND_FROM_ACCOUNT' THEN -COALESCE(total_price, 0)
        ELSE 0
      END) as total_collected,
      SUM(CASE
        WHEN type = 'SALE' AND payment_status = 'PENDING' THEN COALESCE(total_price, 0)
        ELSE 0
      END) as total_pending,
      SUM(CASE
        WHEN type = 'SALE' THEN COALESCE(total_cost, 0)
        WHEN type = 'CUSTOMER_RETURN' THEN -COALESCE(total_cost, 0)
        ELSE 0
      END) as total_cogs,
      SUM(CASE
        WHEN type = 'SALE' THEN quantity
        WHEN type = 'CUSTOMER_RETURN' THEN -quantity
        ELSE 0
      END) as total_units
    FROM inventory_operations
    WHERE date >= ? AND date <= ? AND type IN ('SALE', 'CUSTOMER_RETURN')
  `, [start, end]);

  const totalSales = Math.max(0, Math.round(summaryRow?.total_sales || 0));
  const totalCollected = Math.max(0, Math.round(summaryRow?.total_collected || 0));
  const totalPending = Math.max(0, Math.round(summaryRow?.total_pending || 0));
  const totalCostOfGoods = Math.max(0, Math.round(summaryRow?.total_cogs || 0));
  const grossProfit = totalSales - totalCostOfGoods;
  const marginPercent = totalSales > 0 ? (grossProfit / totalSales) * 100 : null;
  const totalUnitsSold = Math.max(0, Number(summaryRow?.total_units || 0));

  // 2. Rankings por producto en el período
  const productRows = db.getAllSync<{
    product_id: string;
    product_name: string;
    category: string;
    sale_unit: string;
    size_format: string | null;
    units_sold: number;
    total_sales: number | null;
    total_collected: number | null;
    total_cost: number | null;
  }>(`
    SELECT
      p.id as product_id,
      p.name as product_name,
      p.category,
      p.sale_unit,
      p.size_format,
      SUM(CASE
        WHEN o.type = 'SALE' THEN o.quantity
        WHEN o.type = 'CUSTOMER_RETURN' THEN -o.quantity
        ELSE 0
      END) as units_sold,
      SUM(CASE
        WHEN o.type = 'SALE' THEN COALESCE(o.total_price, 0)
        WHEN o.type = 'CUSTOMER_RETURN' THEN -COALESCE(o.total_price, 0)
        ELSE 0
      END) as total_sales,
      SUM(CASE
        WHEN o.type = 'SALE' AND o.payment_status = 'PAID' THEN COALESCE(o.total_price, 0)
        WHEN o.type = 'CUSTOMER_RETURN' AND o.payment_method = 'REFUND_FROM_ACCOUNT' THEN -COALESCE(o.total_price, 0)
        ELSE 0
      END) as total_collected,
      SUM(CASE
        WHEN o.type = 'SALE' THEN COALESCE(o.total_cost, 0)
        WHEN o.type = 'CUSTOMER_RETURN' THEN -COALESCE(o.total_cost, 0)
        ELSE 0
      END) as total_cost
    FROM inventory_operations o
    JOIN photo_products p ON p.id = o.product_id
    WHERE o.date >= ? AND o.date <= ? AND o.type IN ('SALE', 'CUSTOMER_RETURN')
    GROUP BY p.id
    HAVING units_sold > 0 OR total_sales > 0
  `, [start, end]);

  const rankingsBase: RankingProductoVenta[] = productRows.map(r => {
    const s = Math.max(0, Math.round(r.total_sales || 0));
    const c = Math.max(0, Math.round(r.total_cost || 0));
    const profit = s - c;
    const margin = s > 0 ? (profit / s) * 100 : null;
    return {
      productId: r.product_id,
      productName: r.product_name,
      category: r.category,
      saleUnit: r.sale_unit,
      sizeFormat: r.size_format || undefined,
      unitsSold: Math.max(0, r.units_sold),
      totalSales: s,
      totalCollected: Math.max(0, Math.round(r.total_collected || 0)),
      totalCost: c,
      grossProfit: profit,
      marginPercent: margin,
    };
  });

  const topSellingProducts = [...rankingsBase].sort((a, b) => b.unitsSold - a.unitsSold || b.totalSales - a.totalSales);
  const topProfitableProducts = [...rankingsBase].sort((a, b) => b.grossProfit - a.grossProfit || (b.marginPercent || 0) - (a.marginPercent || 0));

  // 3. Evolución temporal de ventas y ganancias
  const rawOps = db.getAllSync<{
    date: number;
    type: string;
    quantity: number;
    total_price: number | null;
    total_cost: number | null;
    payment_status: string | null;
    payment_method: string | null;
  }>(`
    SELECT date, type, quantity, total_price, total_cost, payment_status, payment_method
    FROM inventory_operations
    WHERE date >= ? AND date <= ? AND type IN ('SALE', 'CUSTOMER_RETURN')
    ORDER BY date ASC
  `, [start, end]);

  const isWideRange = (end - start) > 40 * 24 * 60 * 60 * 1000;
  const mesesAbrev = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const buckets: Record<string, PuntoEvolucionVentas> = {};

  for (const op of rawOps) {
    const d = new Date(op.date);
    let key: string;
    let labelText: string;

    if (isWideRange) {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labelText = `${mesesAbrev[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      labelText = `${String(d.getDate()).padStart(2, '0')} ${mesesAbrev[d.getMonth()]}`;
    }

    if (!buckets[key]) {
      buckets[key] = {
        dateKey: key,
        label: labelText,
        sales: 0,
        collected: 0,
        costOfGoods: 0,
        grossProfit: 0,
        unitsSold: 0,
      };
    }

    const price = op.total_price || 0;
    const cost = op.total_cost || 0;

    if (op.type === 'SALE') {
      buckets[key].sales += price;
      buckets[key].costOfGoods += cost;
      buckets[key].unitsSold += op.quantity;
      if (op.payment_status === 'PAID') {
        buckets[key].collected += price;
      }
    } else if (op.type === 'CUSTOMER_RETURN') {
      buckets[key].sales -= price;
      buckets[key].costOfGoods -= cost;
      buckets[key].unitsSold -= op.quantity;
      if (op.payment_method === 'REFUND_FROM_ACCOUNT') {
        buckets[key].collected -= price;
      }
    }
    buckets[key].grossProfit = buckets[key].sales - buckets[key].costOfGoods;
  }

  const evolution = Object.values(buckets);

  return {
    periodo: filtroPeriodo,
    startDate: start,
    endDate: end,
    labelPeriodo: label,
    totalSales,
    totalCollected,
    totalPending,
    totalCostOfGoods,
    grossProfit,
    marginPercent,
    totalUnitsSold,
    topSellingProducts,
    topProfitableProducts,
    evolution,
  };
}

/**
 * Obtiene la lista de productos activos que presentan alertas de stock (stock bajo o agotado).
 */
export function obtenerProductosConAlertasStock(): Producto[] {
  asegurarEsquemaBaseDatos();
  const db = obtenerBaseDatos();
  const rows = db.getAllSync<any>(`
    SELECT p.*, COALESCE(t.count, 0) as tariffs_count
    FROM photo_products p
    LEFT JOIN (
      SELECT product_id, COUNT(*) as count
      FROM photo_product_prices
      GROUP BY product_id
    ) t ON t.product_id = p.id
    WHERE p.is_active = 1 AND (p.current_stock <= COALESCE(p.min_stock, 0) OR p.current_stock <= 0)
    ORDER BY (CASE WHEN p.current_stock <= 0 THEN 0 ELSE 1 END) ASC, p.current_stock ASC, p.name ASC
  `);

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    sku: r.sku || undefined,
    category: r.category || 'General',
    sizeFormat: r.size_format || undefined,
    saleUnit: r.sale_unit || 'Unidad',
    description: r.description || undefined,
    isActive: r.is_active === 1,
    basePrice: r.base_price ?? 0,
    costPrice: r.cost_price ?? 0,
    currentStock: r.current_stock ?? 0,
    minStock: r.min_stock ?? 0,
    supplier: r.supplier || undefined,
    currency: r.currency || 'UYU',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    grossProfit: (r.base_price ?? 0) - (r.cost_price ?? 0),
    grossMarginPercent: (r.base_price ?? 0) > 0 ? (((r.base_price ?? 0) - (r.cost_price ?? 0)) / r.base_price) * 100 : null,
    tariffsCount: r.tariffs_count ?? 0,
    isLowStock: (r.current_stock ?? 0) > 0 && (r.current_stock ?? 0) <= (r.min_stock ?? 0),
    isOutOfStock: (r.current_stock ?? 0) <= 0,
  }));
}

/**
 * Productos extraídos fielmente de la hoja INVERSIONES del archivo Excel de compromisos.
 *
 * NOTA DE AUDITORÍA:
 * En el archivo original, las celdas de cantidades (D) y ventas (F) no tienen cantidades registradas
 * (evalúan a 0 o están vacías), y las fórmulas presentes representan proyecciones/plantillas.
 * Conforme a las instrucciones del usuario, NO se importan fórmulas como operaciones reales ni se
 * inventan compras o ventas ficticias. Se importan los productos con sus precios y costos unitarios confirmados.
 */
export const PRODUCTOS_EXCEL_INVERSIONES_SUGERIDOS: ProductoImportadoExcel[] = [
  {
    name: 'Cuadros 12x18',
    category: 'Cuadros',
    saleUnit: 'Unidad',
    sizeFormat: '12x18',
    costPrice: 165000, // $1.650,00 (en centavos)
    basePrice: 350000, // $3.500,00 (en centavos)
    initialStock: 0,
    minStock: 2,
    sourceSheet: 'INVERSIONES',
    sourceRow: 2,
    isSelected: true,
  },
  {
    name: 'Cuadros 8x10',
    category: 'Cuadros',
    saleUnit: 'Unidad',
    sizeFormat: '8x10',
    costPrice: 85000, // $850,00 (en centavos)
    basePrice: 250000, // $2.500,00 (en centavos)
    initialStock: 0,
    minStock: 2,
    sourceSheet: 'INVERSIONES',
    sourceRow: 3,
    isSelected: true,
  },
  {
    name: 'Álbum 5x7',
    category: 'Álbumes',
    saleUnit: 'Unidad',
    sizeFormat: '5x7',
    costPrice: 80000, // $800,00 (en centavos)
    basePrice: 130000, // $1.300,00 (en centavos)
    initialStock: 0,
    minStock: 2,
    sourceSheet: 'INVERSIONES',
    sourceRow: 4,
    isSelected: true,
  },
  {
    name: 'Álbum 8x10',
    category: 'Álbumes',
    saleUnit: 'Unidad',
    sizeFormat: '8x10',
    costPrice: 90000, // $900,00 (en centavos)
    basePrice: 200000, // $2.000,00 (en centavos)
    initialStock: 0,
    minStock: 2,
    sourceSheet: 'INVERSIONES',
    sourceRow: 5,
    isSelected: true,
  },
  {
    name: 'Café',
    category: 'Cafetería',
    saleUnit: 'Unidad',
    costPrice: 0,
    basePrice: 70000, // $700,00 (en centavos)
    initialStock: 0,
    minStock: 5,
    sourceSheet: 'INVERSIONES',
    sourceRow: 8,
    isSelected: true,
  },
  {
    name: 'Café Dayli',
    category: 'Cafetería',
    saleUnit: 'Unidad',
    costPrice: 0,
    basePrice: 60000, // $600,00 (en centavos)
    initialStock: 0,
    minStock: 5,
    sourceSheet: 'INVERSIONES',
    sourceRow: 9,
    isSelected: true,
  },
];

/**
 * Importa los productos seleccionados de la hoja INVERSIONES a la base de datos SQLite.
 * Si un producto con el mismo nombre ya existe, actualiza sus precios de referencia.
 * Si no existe, lo crea con stock 0 y su tarifa inicial.
 */
export function importarProductosDesdeExcel(
  productos: ProductoImportadoExcel[]
): { importados: number; actualizados: number } {
  asegurarEsquemaBaseDatos();
  const db = obtenerBaseDatos();
  let importados = 0;
  let actualizados = 0;
  const ahora = Date.now();
  const fechaISO = new Date().toISOString().slice(0, 10);

  db.withTransactionSync(() => {
    for (const p of productos) {
      if (p.isSelected === false) continue;

      const nombreLimpio = p.name.trim();
      const existente = db.getFirstSync<{ id: string }>(
        'SELECT id FROM photo_products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
        [nombreLimpio]
      );

      if (existente) {
        // Actualizar datos comerciales de referencia
        db.runSync(
          `UPDATE photo_products SET
            base_price = ?,
            cost_price = ?,
            size_format = COALESCE(?, size_format),
            category = COALESCE(?, category),
            min_stock = COALESCE(?, min_stock),
            updated_at = ?
          WHERE id = ?`,
          [
            p.basePrice,
            p.costPrice,
            p.sizeFormat || null,
            p.category || null,
            p.minStock ?? 2,
            ahora,
            existente.id,
          ]
        );

        // Crear tarifa actualizada en historial
        const tarifaId = 'tariff_' + ahora.toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        db.runSync(
          `INSERT INTO photo_product_prices (
            id, product_id, sale_price, cost_price, valid_from, notes, currency, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'UYU', ?, ?)`,
          [
            tarifaId,
            existente.id,
            p.basePrice,
            p.costPrice,
            fechaISO,
            `Actualizado desde ${p.sourceSheet} (${p.name})`,
            ahora,
            ahora,
          ]
        );
        actualizados++;
      } else {
        // Crear nuevo producto en el catálogo
        crearProducto({
          name: nombreLimpio,
          category: p.category || 'General',
          saleUnit: p.saleUnit || 'Unidad',
          sizeFormat: p.sizeFormat,
          basePrice: p.basePrice,
          costPrice: p.costPrice,
          initialStock: 0, // Sin inventar compras no confirmadas
          minStock: p.minStock ?? 2,
          supplier: p.supplier,
          description: `Importado de Excel (${p.sourceSheet}, fila ${p.sourceRow})`,
        });
        importados++;
      }
    }
  });

  emitirCambioBoveda();
  return { importados, actualizados };
}
