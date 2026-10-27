import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import assert from 'node:assert/strict';

function setupTestDb() {
  const db = new DatabaseSync(':memory:');

  db.exec(`
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
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

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
      cost_usd REAL,
      exchange_rate REAL,
      price_valid_from TEXT,
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

  return db;
}

// Lógica de cálculo puro
function calcularGananciaYMargen(salePrice, costPrice) {
  const grossProfit = salePrice - costPrice;
  const grossMarginPercent = salePrice > 0 ? (grossProfit / salePrice) * 100 : null;
  return { grossProfit, grossMarginPercent };
}

function verificarNombreDuplicado(db, nombre, idExcluir = null) {
  const nombreLimpio = nombre.trim().toLowerCase();
  if (!nombreLimpio) return false;

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM photo_products
    WHERE LOWER(TRIM(name)) = ?
    AND (? IS NULL OR id != ?)
  `);
  const row = stmt.get(nombreLimpio, idExcluir, idExcluir);
  return Boolean(row && row.count > 0);
}

function crearProducto(db, datos) {
  const nombreLimpio = datos.name.trim();
  if (!nombreLimpio) {
    throw new Error('El nombre del producto es obligatorio.');
  }

  const unidadLimpia = datos.saleUnit.trim();
  if (!unidadLimpia) {
    throw new Error('La unidad de venta es obligatoria.');
  }

  if (verificarNombreDuplicado(db, nombreLimpio)) {
    throw new Error(`Ya existe un producto con el nombre "${nombreLimpio}".`);
  }

  const ahora = Date.now();
  const id = 'prod_foto_' + Math.random().toString(36).substring(2, 10);
  const categoria = datos.category?.trim() || 'General';
  const formato = datos.sizeFormat?.trim() || null;
  const descripcion = datos.description?.trim() || null;
  const activo = datos.isActive === false ? 0 : 1;
  const precioBase = datos.basePrice !== undefined ? Math.round(datos.basePrice) : 0;
  const costoBase = datos.costPrice !== undefined ? Math.round(datos.costPrice) : 0;
  const costoUsd = datos.costUsd !== undefined ? datos.costUsd : null;
  const tipoCambio = datos.exchangeRate !== undefined ? datos.exchangeRate : null;
  const fechaVigencia = datos.priceValidFrom || '2026-10-22';
  const moneda = datos.currency || 'UYU';

  const stmt = db.prepare(`
    INSERT INTO photo_products (
      id, name, category, size_format, sale_unit, description,
      is_active, base_price, cost_price, cost_usd, exchange_rate, price_valid_from,
      currency, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, nombreLimpio, categoria, formato, unidadLimpia, descripcion, activo, precioBase, costoBase, costoUsd, tipoCambio, fechaVigencia, moneda, ahora, ahora);

  if (precioBase > 0 || costoBase > 0 || costoUsd !== null) {
    const tariffStmt = db.prepare(`
      INSERT INTO photo_product_prices (
        id, product_id, sale_price, cost_price, cost_usd, exchange_rate,
        valid_from, valid_to, notes, currency, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'Tarifa inicial', ?, ?, ?)
    `);
    tariffStmt.run('tariff_' + Math.random().toString(36).substring(2, 8), id, precioBase, costoBase, costoUsd, tipoCambio, fechaVigencia, moneda, ahora, ahora);
  }

  const calc = calcularGananciaYMargen(precioBase, costoBase);

  return {
    id,
    name: nombreLimpio,
    category: categoria,
    sizeFormat: formato,
    saleUnit: unidadLimpia,
    description: descripcion,
    isActive: activo === 1,
    basePrice: precioBase,
    costPrice: costoBase,
    costUsd: costoUsd,
    exchangeRate: tipoCambio,
    priceValidFrom: fechaVigencia,
    currency: moneda,
    createdAt: ahora,
    updatedAt: ahora,
    grossProfit: calc.grossProfit,
    grossMarginPercent: calc.grossMarginPercent,
  };
}

function establecerTarifa(db, datos) {
  const prod = db.prepare('SELECT * FROM photo_products WHERE id = ?').get(datos.productId);
  if (!prod) throw new Error('El producto fotográfico no existe.');

  if (datos.salePrice < 0) throw new Error('El precio de venta no puede ser negativo.');
  if (datos.costPrice < 0) throw new Error('El costo no puede ser negativo.');
  if (datos.costUsd !== undefined && datos.costUsd < 0) throw new Error('El costo de referencia en USD no puede ser negativo.');
  if (datos.exchangeRate !== undefined && datos.exchangeRate <= 0) throw new Error('El tipo de cambio debe ser mayor a cero.');

  const ahora = Date.now();
  const fechaValida = datos.validFrom || '2026-10-22';
  const moneda = datos.currency || prod.currency || 'UYU';

  const tarifaVigente = db.prepare(
    "SELECT * FROM photo_product_prices WHERE product_id = ? AND (valid_to IS NULL OR TRIM(valid_to) = '') ORDER BY valid_from DESC, created_at DESC LIMIT 1"
  ).get(datos.productId);

  // Evitar duplicar registros cuando se guarda una tarifa consecutiva idéntica
  if (
    !datos.isCorrection &&
    tarifaVigente &&
    tarifaVigente.sale_price === Math.round(datos.salePrice) &&
    tarifaVigente.cost_price === Math.round(datos.costPrice) &&
    (tarifaVigente.currency || 'UYU') === moneda
  ) {
    const calc = calcularGananciaYMargen(prod.base_price, prod.cost_price);
    return { ...prod, ...calc };
  }

  if (datos.isCorrection && tarifaVigente) {
    db.prepare(`
      UPDATE photo_product_prices SET
        sale_price = ?,
        cost_price = ?,
        cost_usd = ?,
        exchange_rate = ?,
        valid_from = ?,
        notes = ?,
        currency = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      Math.round(datos.salePrice),
      Math.round(datos.costPrice),
      datos.costUsd !== undefined ? datos.costUsd : null,
      datos.exchangeRate !== undefined ? datos.exchangeRate : null,
      fechaValida,
      datos.notes || null,
      moneda,
      ahora,
      tarifaVigente.id
    );
  } else {
    if (tarifaVigente) {
      db.prepare('UPDATE photo_product_prices SET valid_to = ?, updated_at = ? WHERE id = ?')
        .run(fechaValida, ahora, tarifaVigente.id);
    }

    const nuevoId = 'tariff_' + Math.random().toString(36).substring(2, 8);
    db.prepare(`
      INSERT INTO photo_product_prices (
        id, product_id, sale_price, cost_price, cost_usd, exchange_rate,
        valid_from, valid_to, notes, currency, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
    `).run(
      nuevoId,
      datos.productId,
      Math.round(datos.salePrice),
      Math.round(datos.costPrice),
      datos.costUsd !== undefined ? datos.costUsd : null,
      datos.exchangeRate !== undefined ? datos.exchangeRate : null,
      fechaValida,
      datos.notes || null,
      moneda,
      ahora,
      ahora
    );
  }

  db.prepare(`
    UPDATE photo_products SET
      base_price = ?,
      cost_price = ?,
      cost_usd = ?,
      exchange_rate = ?,
      price_valid_from = ?,
      currency = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    Math.round(datos.salePrice),
    Math.round(datos.costPrice),
    datos.costUsd !== undefined ? datos.costUsd : null,
    datos.exchangeRate !== undefined ? datos.exchangeRate : null,
    fechaValida,
    moneda,
    ahora,
    datos.productId
  );

  const updatedProd = db.prepare('SELECT * FROM photo_products WHERE id = ?').get(datos.productId);
  const calc = calcularGananciaYMargen(updatedProd.base_price, updatedProd.cost_price);
  return { ...updatedProd, ...calc };
}

function listarTarifas(db, productId) {
  return db.prepare('SELECT * FROM photo_product_prices WHERE product_id = ? ORDER BY valid_from DESC, created_at DESC').all(productId);
}

function obtenerHistorialCambiosPrecios(db, filtros = {}) {
  let queryProductos = 'SELECT * FROM photo_products';
  const paramsProd = [];
  if (filtros.productId) {
    queryProductos += ' WHERE id = ?';
    paramsProd.push(filtros.productId);
  } else if (filtros.search) {
    queryProductos += ' WHERE (LOWER(name) LIKE ? OR LOWER(size_format) LIKE ? OR LOWER(category) LIKE ?)';
    const term = `%${filtros.search.trim().toLowerCase()}%`;
    paramsProd.push(term, term, term);
  }
  queryProductos += ' ORDER BY name COLLATE NOCASE ASC';

  const productos = db.prepare(queryProductos).all(...paramsProd);
  const cambiosTotales = [];

  for (const prod of productos) {
    const tarifas = db.prepare(
      'SELECT * FROM photo_product_prices WHERE product_id = ? ORDER BY valid_from ASC, created_at ASC'
    ).all(prod.id);

    for (let i = 0; i < tarifas.length; i++) {
      const tarifaActual = tarifas[i];
      const tarifaAnterior = i > 0 ? tarifas[i - 1] : null;

      const newSalePrice = tarifaActual.sale_price;
      const newCostPrice = tarifaActual.cost_price;
      const calcNew = calcularGananciaYMargen(newSalePrice, newCostPrice);

      let previousSalePrice = null;
      let previousCostPrice = null;
      let previousGrossProfit = null;
      let previousGrossMarginPercent = null;
      let salePriceDiff = null;
      let salePriceDiffPercent = null;
      let costPriceDiff = null;
      let costPriceDiffPercent = null;
      const isInitialTariff = tarifaAnterior === null;

      if (tarifaAnterior) {
        previousSalePrice = tarifaAnterior.sale_price;
        previousCostPrice = tarifaAnterior.cost_price;
        const prevCalc = calcularGananciaYMargen(previousSalePrice, previousCostPrice);
        previousGrossProfit = prevCalc.grossProfit;
        previousGrossMarginPercent = prevCalc.grossMarginPercent;

        salePriceDiff = newSalePrice - previousSalePrice;
        salePriceDiffPercent = previousSalePrice > 0 ? (salePriceDiff / previousSalePrice) * 100 : null;

        costPriceDiff = newCostPrice - previousCostPrice;
        costPriceDiffPercent = previousCostPrice > 0 ? (costPriceDiff / previousCostPrice) * 100 : null;
      }

      const isCurrent = !tarifaActual.valid_to || tarifaActual.valid_to.trim() === '';
      const currency = tarifaActual.currency || prod.currency || 'UYU';

      if (filtros.startDate && tarifaActual.valid_from < filtros.startDate) continue;
      if (filtros.endDate && tarifaActual.valid_from > filtros.endDate) continue;
      if (filtros.currency && currency !== filtros.currency) continue;

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
        newGrossProfit: calcNew.grossProfit,
        newGrossMarginPercent: calcNew.grossMarginPercent,
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

  cambiosTotales.sort((a, b) => {
    if (b.validFrom !== a.validFrom) {
      return b.validFrom.localeCompare(a.validFrom);
    }
    return b.createdAt - a.createdAt;
  });

  return cambiosTotales;
}

function obtenerEvolucionTarifasProducto(db, productId) {
  const tarifasFilas = db.prepare(
    'SELECT * FROM photo_product_prices WHERE product_id = ? ORDER BY valid_from ASC, created_at ASC'
  ).all(productId);

  const items = [];
  for (let i = 0; i < tarifasFilas.length; i++) {
    const tf = tarifasFilas[i];
    const prev = i > 0 ? tarifasFilas[i - 1] : null;

    const { grossProfit, grossMarginPercent } = calcularGananciaYMargen(tf.sale_price, tf.cost_price);
    const salePriceDiff = prev ? tf.sale_price - prev.sale_price : null;
    const salePriceDiffPercent = prev && prev.sale_price > 0 ? (salePriceDiff / prev.sale_price) * 100 : null;

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

function obtenerEstadisticasCatalogoFotos(db) {
  const productosFilas = db.prepare('SELECT * FROM photo_products ORDER BY name COLLATE NOCASE ASC').all();

  let totalProductosGlobal = 0;
  let totalActivosGlobal = 0;
  let totalInactivosGlobal = 0;
  let totalSinPrecioGlobal = 0;
  let totalSinCostoGlobal = 0;

  const porMoneda = {};

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

  const tarifasCountRows = db.prepare(`
    SELECT COALESCE(p.currency, 'UYU') as currency, COUNT(*) as count
    FROM photo_product_prices pr
    JOIN photo_products p ON p.id = pr.product_id
    GROUP BY COALESCE(p.currency, 'UYU')
  `).all();

  for (const row of tarifasCountRows) {
    const mon = row.currency || 'UYU';
    if (porMoneda[mon]) {
      porMoneda[mon].totalTarifasRegistradas = row.count;
    }
  }

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

// TESTS FASE 1 & FASE 2
test('1. Crear producto fotográfico con campos válidos y valores predeterminados', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, {
    name: 'Copia 15x21 cm Brillante',
    category: 'Copias y Ampliaciones',
    sizeFormat: '15x21 cm',
    saleUnit: 'Copia',
    description: 'Papel fotográfico satinado Fuji',
    isActive: true,
  });

  assert.ok(prod.id.startsWith('prod_foto_'));
  assert.equal(prod.name, 'Copia 15x21 cm Brillante');
  assert.equal(prod.basePrice, 0);
  assert.equal(prod.costPrice, 0);
  assert.equal(prod.grossProfit, 0);
  assert.equal(prod.grossMarginPercent, null); // Precio venta 0 no calcula margen
});

test('2. Validaciones: nombre obligatorio y unidad obligatoria', () => {
  const db = setupTestDb();
  assert.throws(() => crearProducto(db, { name: '  ', saleUnit: 'Unidad' }), /El nombre del producto es obligatorio/);
  assert.throws(() => crearProducto(db, { name: 'Foto', saleUnit: '  ' }), /La unidad de venta es obligatoria/);
});

test('3. Prevención de duplicados insensible a mayúsculas y espacios', () => {
  const db = setupTestDb();
  crearProducto(db, { name: 'Retrato Escolar Básico', saleUnit: 'Paquete' });
  assert.throws(() => {
    crearProducto(db, { name: '  retrato escolar básico  ', saleUnit: 'Paquete' });
  }, /Ya existe un producto con el nombre/);
});

test('4. Cálculos automáticos de Ganancia Bruta y Margen (%)', () => {
  // Caso ganancia positiva
  const res1 = calcularGananciaYMargen(20000, 12000); // Venta $200, Costo $120
  assert.equal(res1.grossProfit, 8000); // Ganancia $80
  assert.equal(res1.grossMarginPercent, 40); // 40%

  // Caso costo mayor que precio (pérdida)
  const res2 = calcularGananciaYMargen(10000, 12000); // Venta $100, Costo $120
  assert.equal(res2.grossProfit, -2000); // -$20
  assert.equal(res2.grossMarginPercent, -20); // -20%

  // Caso precio de venta cero: no calcula margen
  const res3 = calcularGananciaYMargen(0, 5000);
  assert.equal(res3.grossProfit, -5000);
  assert.equal(res3.grossMarginPercent, null);

  const res4 = calcularGananciaYMargen(0, 0);
  assert.equal(res4.grossProfit, 0);
  assert.equal(res4.grossMarginPercent, null);
});

test('5. Historial de precios: conservar tarifa anterior al cambiar de precio', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, {
    name: 'Cuadro Lienzo 30x40',
    saleUnit: 'Unidad',
    basePrice: 15000, // $150
    costPrice: 8000,  // $80
    priceValidFrom: '2026-01-01',
  });

  // Verificar tarifa inicial
  const tarifasIniciales = listarTarifas(db, prod.id);
  assert.equal(tarifasIniciales.length, 1);
  assert.equal(tarifasIniciales[0].sale_price, 15000);
  assert.equal(tarifasIniciales[0].cost_price, 8000);
  assert.equal(tarifasIniciales[0].valid_to, null);

  // Nueva tarifa aplicada a partir de 2026-10-22
  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 19500, // $195
    costPrice: 9500,  // $95
    validFrom: '2026-10-22',
    notes: 'Ajuste de costos de bastidor',
  });

  const tarifasActualizadas = listarTarifas(db, prod.id);
  assert.equal(tarifasActualizadas.length, 2);

  // Tarifa anterior archivada con fecha de término
  const tarifaAnterior = tarifasActualizadas.find(t => t.valid_to !== null);
  assert.ok(tarifaAnterior);
  assert.equal(tarifaAnterior.sale_price, 15000);
  assert.equal(tarifaAnterior.cost_price, 8000);
  assert.equal(tarifaAnterior.valid_from, '2026-01-01');
  assert.equal(tarifaAnterior.valid_to, '2026-10-22');

  // Tarifa nueva vigente
  const tarifaNueva = tarifasActualizadas.find(t => t.valid_to === null);
  assert.ok(tarifaNueva);
  assert.equal(tarifaNueva.sale_price, 19500);
  assert.equal(tarifaNueva.cost_price, 9500);
  assert.equal(tarifaNueva.valid_from, '2026-10-22');

  // Producto actualizado
  const prodActualizado = db.prepare('SELECT * FROM photo_products WHERE id = ?').get(prod.id);
  assert.equal(prodActualizado.base_price, 19500);
  assert.equal(prodActualizado.cost_price, 9500);
});

test('6. Corrección de tarifa actual por error (isCorrection: true) preserva el historial', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, {
    name: 'Fotolibro 20x30',
    saleUnit: 'Unidad',
    basePrice: 20000,
    costPrice: 10000,
    priceValidFrom: '2026-01-01',
  });

  // Establecer tarifa de octubre
  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 25000,
    costPrice: 12000,
    validFrom: '2026-10-01',
  });

  assert.equal(listarTarifas(db, prod.id).length, 2);

  // Corregir un error de tipeo en la tarifa vigente (ej: era 26000, no 25000)
  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 26000,
    costPrice: 12000,
    validFrom: '2026-10-01',
    isCorrection: true,
    notes: 'Corrección de error tipográfico',
  });

  // La cantidad de tarifas históricas NO debe incrementarse
  const tarifasDespuesCorreccion = listarTarifas(db, prod.id);
  assert.equal(tarifasDespuesCorreccion.length, 2);

  const vigente = tarifasDespuesCorreccion.find(t => t.valid_to === null);
  assert.equal(vigente.sale_price, 26000);
});

test('7. Validación: rechazar precios o costos negativos', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, { name: 'Foto 10x15', saleUnit: 'Copia' });

  assert.throws(() => {
    establecerTarifa(db, {
      productId: prod.id,
      salePrice: -100,
      costPrice: 50,
      validFrom: '2026-10-22',
    });
  }, /El precio de venta no puede ser negativo/);

  assert.throws(() => {
    establecerTarifa(db, {
      productId: prod.id,
      salePrice: 100,
      costPrice: -50,
      validFrom: '2026-10-22',
    });
  }, /El costo no puede ser negativo/);
});

test('8. Referencia en USD y Tipo de Cambio no convierten automáticamente sin TC', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, {
    name: 'Papel Fine Art A3',
    saleUnit: 'Hoja',
  });

  // Registrar con referencia USD pero costo UYU independiente
  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 35000, // $350 UYU
    costPrice: 15000, // $150 UYU
    costUsd: 3.5,     // US$ 3.50 de referencia
    exchangeRate: 42.5,
    validFrom: '2026-10-22',
  });

  const tarifas = listarTarifas(db, prod.id);
  assert.equal(tarifas[0].cost_usd, 3.5);
  assert.equal(tarifas[0].exchange_rate, 42.5);
  assert.equal(tarifas[0].cost_price, 15000); // Conserva el costo explícito en UYU
});

test('9. Compatibilidad y persistencia: datos de otros módulos y productos sin precios', () => {
  const db = setupTestDb();
  db.prepare(`
    INSERT INTO accounts (id, name, type, currency, created_at)
    VALUES ('acc_main', 'Caja Estudio', 'CASH', 'UYU', 123456)
  `).run();

  db.prepare(`
    INSERT INTO debts (id, type, person, concept, total_amount, remaining_amount, issue_date, created_at, updated_at)
    VALUES ('debt_x', 'RECEIVABLE', 'Carlos Gómez', 'Fotos de Boda', 300000, 300000, '2026-10-22', 123456, 123456)
  `).run();

  // Producto sin precio alguno
  const prodSinPrecio = crearProducto(db, { name: 'Foto Pasaporte', saleUnit: 'Unidad' });
  assert.equal(prodSinPrecio.basePrice, 0);
  assert.equal(prodSinPrecio.grossProfit, 0);
  assert.equal(prodSinPrecio.grossMarginPercent, null);

  // Tablas externas intactas
  const acc = db.prepare('SELECT * FROM accounts WHERE id = ?').get('acc_main');
  assert.equal(acc.name, 'Caja Estudio');
  const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get('debt_x');
  assert.equal(debt.person, 'Carlos Gómez');
});

// --- Fase 3: Calculadora de Precios y Estimaciones ---

function validarCantidadCalculo(cantidad) {
  const parsed = typeof cantidad === 'string' ? Number(cantidad.trim()) : cantidad;
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('La cantidad debe ser un número entero positivo mayor a cero.');
  }
  return parsed;
}

function verificarRegistroPrecioYCosto(producto) {
  const tienePrecio = typeof producto.basePrice === 'number' && producto.basePrice > 0;
  const tieneCosto = typeof producto.costPrice === 'number' && producto.costPrice > 0;
  return { tienePrecio, tieneCosto };
}

function calcularLineaFoto(producto, cantidad) {
  const cantidadValidada = validarCantidadCalculo(cantidad);
  const { tienePrecio, tieneCosto } = verificarRegistroPrecioYCosto(producto);
  const esInactivo = !producto.isActive;
  const precioUnitario = tienePrecio ? producto.basePrice : 0;
  const costoUnitario = tieneCosto ? producto.costPrice : 0;
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

function calcularTotalesFotos(lineas) {
  const totalesPorMoneda = {};

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

test('10. Calculadora: cálculo con un solo producto y cantidades válidas', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, {
    name: 'Foto 15x20 cm',
    saleUnit: 'Unidad',
    basePrice: 15000, // $150,00 UYU
    costPrice: 8000,  // $80,00 UYU
    currency: 'UYU',
  });

  const linea = calcularLineaFoto(prod, 10);
  assert.equal(linea.cantidad, 10);
  assert.equal(linea.subtotalImporte, 150000); // $1.500,00
  assert.equal(linea.subtotalCosto, 80000);    // $800,00
  assert.equal(linea.subtotalGanancia, 70000); // $700,00
  assert.ok(Math.abs(linea.margenPorcentual - 46.6666) < 0.01);

  const res = calcularTotalesFotos([linea]);
  assert.equal(res.esMultimoneda, false);
  assert.equal(res.tieneFaltantes, false);
  const uyu = res.totalesPorMoneda['UYU'];
  assert.equal(uyu.cantidadLineas, 1);
  assert.equal(uyu.totalUnidades, 10);
  assert.equal(uyu.totalImporte, 150000);
  assert.equal(uyu.totalCosto, 80000);
  assert.equal(uyu.totalGanancia, 70000);
  assert.ok(Math.abs(uyu.margenPorcentual - 46.6666) < 0.01);
});

test('11. Calculadora: cálculo con varios productos y cambio inmediato de cantidades', () => {
  const db = setupTestDb();
  const prodA = crearProducto(db, {
    name: 'Copia 10x15 cm',
    saleUnit: 'Copia',
    basePrice: 2500, // $25,00
    costPrice: 1000, // $10,00
  });

  const prodB = crearProducto(db, {
    name: 'Fotolibro Tapa Dura 20x30',
    saleUnit: 'Unidad',
    basePrice: 250000, // $2.500,00
    costPrice: 120000, // $1.200,00
  });

  // Cálculo inicial: 100 copias + 2 fotolibros
  const lineaA = calcularLineaFoto(prodA, 100);
  let lineaB = calcularLineaFoto(prodB, 2);

  let res = calcularTotalesFotos([lineaA, lineaB]);
  let uyu = res.totalesPorMoneda['UYU'];
  assert.equal(uyu.totalUnidades, 102);
  assert.equal(uyu.totalImporte, 250000 + 500000); // $7.500,00
  assert.equal(uyu.totalCosto, 100000 + 240000);   // $3.400,00
  assert.equal(uyu.totalGanancia, 150000 + 260000); // $4.100,00

  // Cambio de cantidad inmediato: Fotolibros pasa de 2 a 4
  lineaB = calcularLineaFoto(prodB, 4);
  res = calcularTotalesFotos([lineaA, lineaB]);
  uyu = res.totalesPorMoneda['UYU'];
  assert.equal(uyu.totalUnidades, 104);
  assert.equal(uyu.totalImporte, 250000 + 1000000); // $12.500,00
  assert.equal(uyu.totalCosto, 100000 + 480000);    // $5.800,00
  assert.equal(uyu.totalGanancia, 150000 + 520000); // $6.700,00
});

test('12. Calculadora: productos sin precio o sin costo no inventan valores ni usan cero silencioso', () => {
  const db = setupTestDb();
  // Producto sin precio (basePrice = 0)
  const prodSinPrecio = crearProducto(db, {
    name: 'Lienzo Artesanal 50x70',
    saleUnit: 'Unidad',
    costPrice: 40000, // tiene costo $400, pero no tiene precio de venta
  });

  // Producto sin costo (costPrice = 0)
  const prodSinCosto = crearProducto(db, {
    name: 'Descarga Digital Evento',
    saleUnit: 'Archivo digital',
    basePrice: 80000, // tiene precio $800, pero costo desconocido
  });

  const lineaSinPrecio = calcularLineaFoto(prodSinPrecio, 3);
  assert.equal(lineaSinPrecio.tienePrecio, false);
  assert.equal(lineaSinPrecio.tieneCosto, true);
  assert.equal(lineaSinPrecio.subtotalImporte, null); // No usa 0 silencioso
  assert.equal(lineaSinPrecio.subtotalCosto, 120000);
  assert.equal(lineaSinPrecio.subtotalGanancia, null); // No calculable
  assert.equal(lineaSinPrecio.margenPorcentual, null);

  const lineaSinCosto = calcularLineaFoto(prodSinCosto, 2);
  assert.equal(lineaSinCosto.tienePrecio, true);
  assert.equal(lineaSinCosto.tieneCosto, false);
  assert.equal(lineaSinCosto.subtotalImporte, 160000);
  assert.equal(lineaSinCosto.subtotalCosto, null);    // No usa 0 silencioso
  assert.equal(lineaSinCosto.subtotalGanancia, null); // No calculable

  const res = calcularTotalesFotos([lineaSinPrecio, lineaSinCosto]);
  assert.equal(res.tieneFaltantes, true);
  const uyu = res.totalesPorMoneda['UYU'];
  assert.equal(uyu.esCalculoCompleto, false);
  assert.equal(uyu.itemsSinPrecio, 1);
  assert.equal(uyu.itemsSinCosto, 1);
  assert.equal(uyu.totalImporte, 160000); // Solo suma el que tiene precio
  assert.equal(uyu.totalCosto, 120000);   // Solo suma el que tiene costo
  assert.equal(uyu.margenPorcentual, null); // No calcula margen falso
});

test('13. Calculadora: validación de cantidades (enteros positivos mayores a cero)', () => {
  assert.equal(validarCantidadCalculo(1), 1);
  assert.equal(validarCantidadCalculo('15'), 15);

  // Cantidad cero
  assert.throws(() => validarCantidadCalculo(0), /La cantidad debe ser un número entero positivo mayor a cero/);
  // Cantidad negativa
  assert.throws(() => validarCantidadCalculo(-3), /La cantidad debe ser un número entero positivo mayor a cero/);
  // Cantidad decimal indivisible
  assert.throws(() => validarCantidadCalculo(2.5), /La cantidad debe ser un número entero positivo mayor a cero/);
  // Entrada inválida
  assert.throws(() => validarCantidadCalculo('abc'), /La cantidad debe ser un número entero positivo mayor a cero/);
});

test('14. Calculadora: productos inactivos identificados correctamente', () => {
  const db = setupTestDb();
  const prodInactivo = crearProducto(db, {
    name: 'Formato Obsoleto 9x13',
    saleUnit: 'Copia',
    basePrice: 1000,
    costPrice: 500,
    isActive: false,
  });

  const linea = calcularLineaFoto(prodInactivo, 1);
  assert.equal(linea.esInactivo, true);
});

test('15. Calculadora: productos con diferentes monedas no se suman entre sí', () => {
  const db = setupTestDb();
  const prodUYU = crearProducto(db, {
    name: 'Impresión A4 Local',
    saleUnit: 'Unidad',
    basePrice: 15000, // $150 UYU
    costPrice: 5000,  // $50 UYU
    currency: 'UYU',
  });

  const prodUSD = crearProducto(db, {
    name: 'Licencia Digital Internacional',
    saleUnit: 'Archivo digital',
    basePrice: 5000,  // $50.00 USD (en centavos de dólar)
    costPrice: 1500,  // $15.00 USD
    currency: 'USD',
  });

  const lineaUYU = calcularLineaFoto(prodUYU, 10); // $1500 UYU importe
  const lineaUSD = calcularLineaFoto(prodUSD, 2);  // $100 USD importe

  const res = calcularTotalesFotos([lineaUYU, lineaUSD]);
  assert.equal(res.esMultimoneda, true);
  assert.deepEqual(res.monedas.sort(), ['USD', 'UYU']);

  // Totales separados y correctos
  const uyu = res.totalesPorMoneda['UYU'];
  assert.equal(uyu.totalImporte, 150000);
  assert.equal(uyu.totalCosto, 50000);
  assert.equal(uyu.totalGanancia, 100000);

  const usd = res.totalesPorMoneda['USD'];
  assert.equal(usd.totalImporte, 10000);
  assert.equal(usd.totalCosto, 3000);
  assert.equal(usd.totalGanancia, 7000);
});

test('16. Calculadora: reinicio y limpieza sin generar registros en base de datos', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, {
    name: 'Pack Cuadro Canvas 40x50',
    saleUnit: 'Unidad',
    basePrice: 180000,
    costPrice: 90000,
  });

  // Simular cálculo en memoria
  const linea = calcularLineaFoto(prod, 5);
  const res = calcularTotalesFotos([linea]);
  assert.equal(res.lineas.length, 1);

  // Limpiar / Nuevo cálculo
  const resLimpio = calcularTotalesFotos([]);
  assert.equal(resLimpio.lineas.length, 0);
  assert.equal(resLimpio.monedas.length, 0);
  assert.equal(resLimpio.esMultimoneda, false);

  // Asegurar que la calculadora no guardó nada en la base de datos
  const tablas = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const nombresTablas = tablas.map(t => t.name);
  assert.ok(!nombresTablas.includes('sales'));
  assert.ok(!nombresTablas.includes('estimates'));
  assert.ok(!nombresTablas.includes('quotes'));
});

test('17. Compatibilidad global: catálogo y demás módulos conservan datos intactos', () => {
  const db = setupTestDb();
  // Verificar catálogo
  const prod = crearProducto(db, { name: 'Foto Carnet', saleUnit: 'Unidad', basePrice: 20000, costPrice: 5000 });
  const check = db.prepare('SELECT * FROM photo_products WHERE id = ?').get(prod.id);
  assert.equal(check.name, 'Foto Carnet');
  assert.equal(check.base_price, 20000);
});

// ==========================================
// TESTS FASE 4: HISTORIAL Y ESTADÍSTICAS
// ==========================================

test('18. Historial de precios: registro y consulta con precios anteriores, nuevos, ganancia y márgenes', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, {
    name: 'Retrato Fine Art 30x40',
    saleUnit: 'Unidad',
    sizeFormat: '30x40 cm',
    category: 'Impresiones',
    basePrice: 100000, // $1000.00
    costPrice: 40000,  // $400.00
    priceValidFrom: '2026-01-01',
    currency: 'UYU',
  });

  // Nuevo cambio de precio
  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 150000, // $1500.00 (+50%)
    costPrice: 60000,  // $600.00 (+50%)
    validFrom: '2026-06-01',
    notes: 'Ajuste de mitad de año por insumos',
  });

  const historial = obtenerHistorialCambiosPrecios(db, { productId: prod.id });
  assert.equal(historial.length, 2);

  // El más reciente primero
  const reciente = historial[0];
  assert.equal(reciente.validFrom, '2026-06-01');
  assert.equal(reciente.newSalePrice, 150000);
  assert.equal(reciente.newCostPrice, 60000);
  assert.equal(reciente.previousSalePrice, 100000);
  assert.equal(reciente.previousCostPrice, 40000);
  assert.equal(reciente.salePriceDiff, 50000);
  assert.equal(reciente.salePriceDiffPercent, 50);
  assert.equal(reciente.costPriceDiff, 20000);
  assert.equal(reciente.costPriceDiffPercent, 50);
  assert.equal(reciente.newGrossProfit, 90000);
  assert.equal(reciente.newGrossMarginPercent, 60);
  assert.equal(reciente.previousGrossProfit, 60000);
  assert.equal(reciente.previousGrossMarginPercent, 60);
  assert.equal(reciente.isInitialTariff, false);
  assert.equal(reciente.isCurrent, true);
  assert.equal(reciente.currency, 'UYU');

  // Tarifa inicial
  const inicial = historial[1];
  assert.equal(inicial.validFrom, '2026-01-01');
  assert.equal(inicial.newSalePrice, 100000);
  assert.equal(inicial.newCostPrice, 40000);
  assert.equal(inicial.previousSalePrice, null);
  assert.equal(inicial.previousCostPrice, null);
  assert.equal(inicial.isInitialTariff, true);
  assert.equal(inicial.isCurrent, false);
});

test('19. Historial de precios: orden cronológico estricto (del más reciente al más antiguo)', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, {
    name: 'Fotolibro 20x20',
    saleUnit: 'Unidad',
    basePrice: 50000,
    costPrice: 20000,
    priceValidFrom: '2025-03-01',
  });

  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 60000,
    costPrice: 25000,
    validFrom: '2025-09-01',
  });

  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 75000,
    costPrice: 30000,
    validFrom: '2026-02-15',
  });

  const historial = obtenerHistorialCambiosPrecios(db, { productId: prod.id });
  assert.equal(historial.length, 3);
  assert.equal(historial[0].validFrom, '2026-02-15');
  assert.equal(historial[1].validFrom, '2025-09-01');
  assert.equal(historial[2].validFrom, '2025-03-01');
});

test('20. Historial de precios: filtros por producto, período y moneda', () => {
  const db = setupTestDb();
  const prodUYU = crearProducto(db, {
    name: 'Foto 15x21 UYU',
    saleUnit: 'Unidad',
    basePrice: 15000,
    costPrice: 5000,
    priceValidFrom: '2026-01-10',
    currency: 'UYU',
  });

  establecerTarifa(db, {
    productId: prodUYU.id,
    salePrice: 20000,
    costPrice: 7000,
    validFrom: '2026-07-01',
    currency: 'UYU',
  });

  const prodUSD = crearProducto(db, {
    name: 'Sesión Estudio USD',
    saleUnit: 'Servicio',
    basePrice: 15000, // $150.00 USD
    costPrice: 5000,  // $50.00 USD
    priceValidFrom: '2026-03-01',
    currency: 'USD',
  });

  // 1. Filtrar solo por producto prodUYU
  const histProdUYU = obtenerHistorialCambiosPrecios(db, { productId: prodUYU.id });
  assert.equal(histProdUYU.every(h => h.productId === prodUYU.id), true);
  assert.equal(histProdUYU.length, 2);

  // 2. Filtrar por moneda USD
  const histUSD = obtenerHistorialCambiosPrecios(db, { currency: 'USD' });
  assert.equal(histUSD.length, 1);
  assert.equal(histUSD[0].currency, 'USD');
  assert.equal(histUSD[0].productId, prodUSD.id);
  assert.equal(histUSD[0].productName, 'Sesión Estudio USD');

  // 3. Filtrar por período (fechas)
  const histPeriodo = obtenerHistorialCambiosPrecios(db, {
    startDate: '2026-05-01',
    endDate: '2026-12-31',
  });
  assert.equal(histPeriodo.length, 1);
  assert.equal(histPeriodo[0].validFrom, '2026-07-01');
});

test('21. Integridad del historial: evitar duplicados idénticos consecutivos y conservar valores originales', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, {
    name: 'Lienzo Texturado 50x70',
    saleUnit: 'Unidad',
    basePrice: 300000,
    costPrice: 120000,
    priceValidFrom: '2026-01-01',
  });

  const countAntes = db.prepare('SELECT COUNT(*) as count FROM photo_product_prices WHERE product_id = ?').get(prod.id).count;
  assert.equal(countAntes, 1);

  // Guardar cambio con los MISMOS precios y costos (debe evitar duplicar)
  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 300000,
    costPrice: 120000,
    validFrom: '2026-01-01',
  });

  const countDespues = db.prepare('SELECT COUNT(*) as count FROM photo_product_prices WHERE product_id = ?').get(prod.id).count;
  assert.equal(countDespues, 1, 'No debe crear una tarifa idéntica consecutiva redundante');

  // Aplicar un cambio legítimo nuevo
  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 350000,
    costPrice: 140000,
    validFrom: '2026-05-01',
  });

  // Los registros históricos deben conservar sus valores originales intactos
  const tarifas = db.prepare('SELECT * FROM photo_product_prices WHERE product_id = ? ORDER BY valid_from ASC').all(prod.id);
  assert.equal(tarifas.length, 2);
  assert.equal(tarifas[0].valid_from, '2026-01-01');
  assert.equal(tarifas[0].sale_price, 300000);
  assert.equal(tarifas[0].cost_price, 120000);
  assert.equal(tarifas[0].valid_to, '2026-05-01');

  assert.equal(tarifas[1].valid_from, '2026-05-01');
  assert.equal(tarifas[1].sale_price, 350000);
  assert.equal(tarifas[1].cost_price, 140000);
  assert.equal(tarifas[1].valid_to, null);
});

test('22. Estadísticas del catálogo: conteo exacto de activos, inactivos, sin precio y sin costo', () => {
  const db = setupTestDb();

  // Prod 1: Activo con precio y costo
  crearProducto(db, {
    name: 'Prod 1',
    saleUnit: 'Unidad',
    basePrice: 50000,
    costPrice: 20000,
    isActive: true,
  });

  // Prod 2: Activo sin precio ni costo
  crearProducto(db, {
    name: 'Prod 2',
    saleUnit: 'Unidad',
    basePrice: 0,
    costPrice: 0,
    isActive: true,
  });

  // Prod 3: Inactivo con precio pero sin costo
  crearProducto(db, {
    name: 'Prod 3',
    saleUnit: 'Unidad',
    basePrice: 80000,
    costPrice: 0,
    isActive: false,
  });

  const stats = obtenerEstadisticasCatalogoFotos(db);
  assert.equal(stats.totalProductosGlobal, 3);
  assert.equal(stats.totalActivosGlobal, 2);
  assert.equal(stats.totalInactivosGlobal, 1);
  assert.equal(stats.totalSinPrecioGlobal, 1);
  assert.equal(stats.totalSinCostoGlobal, 2);
});

test('23. Estadísticas del catálogo: separación estricta de monedas y exactitud de promedios', () => {
  const db = setupTestDb();

  // UYU
  crearProducto(db, {
    name: 'Foto Carnet UYU',
    saleUnit: 'Unidad',
    basePrice: 20000, // $200 UYU
    costPrice: 5000,  // $50 UYU (ganancia: $150)
    currency: 'UYU',
  });
  crearProducto(db, {
    name: 'Foto 10x15 UYU',
    saleUnit: 'Unidad',
    basePrice: 40000, // $400 UYU
    costPrice: 15000, // $150 UYU (ganancia: $250)
    currency: 'UYU',
  });

  // USD
  crearProducto(db, {
    name: 'Sesión Digital USD',
    saleUnit: 'Servicio',
    basePrice: 10000, // $100 USD
    costPrice: 4000,  // $40 USD (ganancia: $60)
    currency: 'USD',
  });

  const stats = obtenerEstadisticasCatalogoFotos(db);
  assert.deepEqual(stats.monedas.sort(), ['USD', 'UYU']);

  // Validar estadísticas UYU
  const uyu = stats.porMoneda['UYU'];
  assert.equal(uyu.totalProductos, 2);
  assert.equal(uyu.precioPromedio, 30000); // (20000 + 40000) / 2
  assert.equal(uyu.costoPromedio, 10000);  // (5000 + 15000) / 2
  assert.equal(uyu.gananciaPromedio, 20000); // (15000 + 25000) / 2
  // Margen global UYU: (40000 / 60000) * 100 = 66.666...%
  assert.ok(Math.abs(uyu.margenPromedio - 66.67) < 0.1);

  // Validar estadísticas USD (no mezcladas con UYU)
  const usd = stats.porMoneda['USD'];
  assert.equal(usd.totalProductos, 1);
  assert.equal(usd.precioPromedio, 10000);
  assert.equal(usd.costoPromedio, 4000);
  assert.equal(usd.gananciaPromedio, 6000);
  assert.equal(usd.margenPromedio, 60);
});

test('24. Evolución de tarifas: secuencia temporal de cambios individuales para un producto', () => {
  const db = setupTestDb();
  const prod = crearProducto(db, {
    name: 'Pack Bautismo',
    saleUnit: 'Pack',
    basePrice: 120000,
    costPrice: 50000,
    priceValidFrom: '2025-01-01',
  });

  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 150000,
    costPrice: 60000,
    validFrom: '2025-07-01',
    notes: 'Aumento de verano',
  });

  establecerTarifa(db, {
    productId: prod.id,
    salePrice: 180000,
    costPrice: 75000,
    validFrom: '2026-01-01',
    notes: 'Ajuste anual',
  });

  const evolucion = obtenerEvolucionTarifasProducto(db, prod.id);
  assert.equal(evolucion.length, 3);

  // Orden cronológico ascendente para gráficos / líneas de tiempo
  assert.equal(evolucion[0].validFrom, '2025-01-01');
  assert.equal(evolucion[0].salePrice, 120000);
  assert.equal(evolucion[0].salePriceDiff, null);
  assert.equal(evolucion[0].isCurrent, false);

  assert.equal(evolucion[1].validFrom, '2025-07-01');
  assert.equal(evolucion[1].salePrice, 150000);
  assert.equal(evolucion[1].salePriceDiff, 30000);
  assert.equal(evolucion[1].salePriceDiffPercent, 25);
  assert.equal(evolucion[1].isCurrent, false);

  assert.equal(evolucion[2].validFrom, '2026-01-01');
  assert.equal(evolucion[2].salePrice, 180000);
  assert.equal(evolucion[2].salePriceDiff, 30000);
  assert.equal(evolucion[2].salePriceDiffPercent, 20);
  assert.equal(evolucion[2].isCurrent, true);
});

test('25. Nombres generalizados: catálogo aplicable a cualquier producto comercial (artículos, servicios, kits)', () => {
  const db = setupTestDb();
  // Crear artículos diversos no fotográficos (remeras, tazas, servicios de diseño, asesorías)
  const articulo = crearProducto(db, {
    name: 'Taza Térmica Personalizada',
    category: 'Artículos',
    sizeFormat: '350 ml',
    saleUnit: 'Unidad',
    basePrice: 45000,
    costPrice: 20000,
    currency: 'UYU',
  });

  const servicio = crearProducto(db, {
    name: 'Sesión de Asesoría 1 a 1',
    category: 'Servicios',
    sizeFormat: '1 hora',
    saleUnit: 'Servicio',
    basePrice: 120000,
    costPrice: 30000,
    currency: 'UYU',
  });

  assert.equal(articulo.name, 'Taza Térmica Personalizada');
  assert.equal(articulo.category, 'Artículos');
  assert.equal(articulo.grossProfit, 25000);

  assert.equal(servicio.name, 'Sesión de Asesoría 1 a 1');
  assert.equal(servicio.category, 'Servicios');
  assert.equal(servicio.grossProfit, 90000);

  // Calcular totales
  const lineaArticulo = calcularLineaFoto(articulo, 3);
  const lineaServicio = calcularLineaFoto(servicio, 1);
  const totales = calcularTotalesFotos([lineaArticulo, lineaServicio]);

  assert.equal(totales.totalesPorMoneda['UYU'].totalImporte, 45000 * 3 + 120000); // 135000 + 120000 = 255000
  assert.equal(totales.totalesPorMoneda['UYU'].totalCosto, 20000 * 3 + 30000);    // 60000 + 30000 = 90000
  assert.equal(totales.totalesPorMoneda['UYU'].totalGanancia, 255000 - 90000);     // 165000
});
