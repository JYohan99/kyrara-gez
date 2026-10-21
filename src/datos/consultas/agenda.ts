import { obtenerBaseDatos } from '../conexion';
import {
  Compromiso,
  Recordatorio,
  ExcepcionRecurrencia,
  OcurrenciaCompromiso,
  TipoProgramacionCompromiso,
  EstadoCompromiso,
} from '../tipos';
import { emitirCambioBoveda } from '../sincronizacion';
import {
  programarNotificacionAviso,
  cancelarNotificaciones,
} from '@/compartido/servicios/notificaciones';

/**
 * Genera un ID único para compromisos y recordatorios.
 */
function generarId(prefijo: string = 'comp'): string {
  return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Retorna la cantidad de días que tiene un mes dado en un año.
 */
function diasEnMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

/**
 * Obtiene todos los recordatorios vinculados a un compromiso.
 */
export function obtenerRecordatoriosPorCompromiso(commitmentId: string): Recordatorio[] {
  const db = obtenerBaseDatos();
  const rows = db.getAllSync<any>(
    'SELECT * FROM reminders WHERE commitment_id = ? ORDER BY days_before ASC, time ASC',
    [commitmentId]
  );
  return rows.map(r => ({
    id: r.id,
    commitmentId: r.commitment_id,
    daysBefore: r.days_before,
    time: r.time,
    notificationId: r.notification_id || undefined,
    createdAt: r.created_at,
  }));
}

/**
 * Obtiene las excepciones registradas para una serie recurrente.
 */
export function obtenerExcepcionesPorSerie(seriesId: string): ExcepcionRecurrencia[] {
  const db = obtenerBaseDatos();
  const rows = db.getAllSync<any>(
    'SELECT * FROM recurrence_exceptions WHERE series_id = ?',
    [seriesId]
  );
  return rows.map(r => ({
    id: r.id,
    seriesId: r.series_id,
    originalDate: r.original_date,
    status: r.status,
    modifiedCommitmentId: r.modified_commitment_id || undefined,
    createdAt: r.created_at,
  }));
}

export interface DatosNuevoCompromiso {
  title: string;
  date: string; // 'YYYY-MM-DD'
  time?: string; // 'HH:mm'
  description?: string;
  relatedPerson?: string;
  recurrenceType: TipoProgramacionCompromiso;
  reminders?: { daysBefore: number; time: string }[];
}

/**
 * Crea un nuevo compromiso (único o mensual) con sus recordatorios.
 */
export async function crearCompromiso(datos: DatosNuevoCompromiso): Promise<Compromiso> {
  const db = obtenerBaseDatos();
  const id = generarId('comp');
  const now = Date.now();
  const seriesId = datos.recurrenceType === 'MONTHLY' ? id : undefined;

  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO commitments (
        id, title, date, time, description, related_person,
        recurrence_type, series_id, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        datos.title.trim(),
        datos.date,
        datos.time || null,
        datos.description?.trim() || null,
        datos.relatedPerson?.trim() || null,
        datos.recurrenceType,
        seriesId || null,
        'PENDING',
        now,
        now,
      ]
    );

    if (datos.reminders && datos.reminders.length > 0) {
      for (const rem of datos.reminders) {
        const reminderId = generarId('rem');
        db.runSync(
          `INSERT INTO reminders (id, commitment_id, days_before, time, notification_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [reminderId, id, rem.daysBefore, rem.time, null, now]
        );
      }
    }
  });

  // Programar notificaciones locales para los recordatorios
  if (datos.reminders && datos.reminders.length > 0) {
    const recordatoriosInsertados = obtenerRecordatoriosPorCompromiso(id);
    for (const rem of recordatoriosInsertados) {
      const notifId = await programarNotificacionAviso({
        commitmentId: id,
        title: datos.title,
        commitmentDate: datos.date,
        commitmentTime: datos.time,
        daysBefore: rem.daysBefore,
        reminderTime: rem.time,
      });

      if (notifId) {
        db.runSync('UPDATE reminders SET notification_id = ? WHERE id = ?', [notifId, rem.id]);
      }
    }
  }

  emitirCambioBoveda();

  return {
    id,
    title: datos.title,
    date: datos.date,
    time: datos.time,
    description: datos.description,
    relatedPerson: datos.relatedPerson,
    recurrenceType: datos.recurrenceType,
    seriesId,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Actualiza un compromiso único o la definición base de una serie.
 */
export async function actualizarCompromiso(
  id: string,
  datos: Partial<DatosNuevoCompromiso> & { status?: EstadoCompromiso }
): Promise<void> {
  const db = obtenerBaseDatos();
  const actual = db.getFirstSync<any>('SELECT * FROM commitments WHERE id = ?', [id]);
  if (!actual) {
    throw new Error('El compromiso no existe.');
  }

  const now = Date.now();
  const nuevoTitulo = datos.title !== undefined ? datos.title.trim() : actual.title;
  const nuevaFecha = datos.date !== undefined ? datos.date : actual.date;
  const nuevaHora = datos.time !== undefined ? datos.time : actual.time;
  const nuevaDesc = datos.description !== undefined ? datos.description?.trim() : actual.description;
  const nuevaPersona = datos.relatedPerson !== undefined ? datos.relatedPerson?.trim() : actual.related_person;
  const nuevoTipo = datos.recurrenceType !== undefined ? datos.recurrenceType : actual.recurrence_type;
  const nuevoEstado = datos.status !== undefined ? datos.status : actual.status;

  // Cancelar notificaciones previas
  const recordatoriosAnteriores = obtenerRecordatoriosPorCompromiso(id);
  await cancelarNotificaciones(recordatoriosAnteriores.map(r => r.notificationId));

  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE commitments SET
        title = ?,
        date = ?,
        time = ?,
        description = ?,
        related_person = ?,
        recurrence_type = ?,
        status = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        nuevoTitulo,
        nuevaFecha,
        nuevaHora,
        nuevaDesc,
        nuevaPersona,
        nuevoTipo,
        nuevoEstado,
        now,
        id,
      ]
    );

    // Si se enviaron recordatorios, reemplazarlos
    if (datos.reminders !== undefined) {
      db.runSync('DELETE FROM reminders WHERE commitment_id = ?', [id]);
      for (const rem of datos.reminders) {
        const reminderId = generarId('rem');
        db.runSync(
          `INSERT INTO reminders (id, commitment_id, days_before, time, notification_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [reminderId, id, rem.daysBefore, rem.time, null, now]
        );
      }
    }
  });

  // Reprogramar notificaciones si el compromiso sigue pendiente
  if (nuevoEstado === 'PENDING') {
    const nuevosRecordatorios = obtenerRecordatoriosPorCompromiso(id);
    for (const rem of nuevosRecordatorios) {
      const notifId = await programarNotificacionAviso({
        commitmentId: id,
        title: nuevoTitulo,
        commitmentDate: nuevaFecha,
        commitmentTime: nuevaHora,
        daysBefore: rem.daysBefore,
        reminderTime: rem.time,
      });

      if (notifId) {
        db.runSync('UPDATE reminders SET notification_id = ? WHERE id = ?', [notifId, rem.id]);
      }
    }
  }

  emitirCambioBoveda();
}

/**
 * Marca una ocurrencia mensual o compromiso único como COMPLETADO.
 */
export async function completarOcurrenciaCompromiso(
  commitment: Compromiso,
  occurrenceDate: string
): Promise<void> {
  const db = obtenerBaseDatos();

  if (commitment.recurrenceType === 'SINGLE') {
    await actualizarCompromiso(commitment.id, { status: 'COMPLETED' });
    return;
  }

  // Si es mensual, registrar excepción para esta fecha concreta
  const seriesId = commitment.seriesId || commitment.id;
  const now = Date.now();

  // Cancelar notificaciones de esta ocurrencia
  const rems = obtenerRecordatoriosPorCompromiso(commitment.id);
  await cancelarNotificaciones(rems.map(r => r.notificationId));

  db.runSync(
    `INSERT OR REPLACE INTO recurrence_exceptions (id, series_id, original_date, status, created_at)
     VALUES (?, ?, ?, 'COMPLETED', ?)`,
    [generarId('exc'), seriesId, occurrenceDate, now]
  );

  emitirCambioBoveda();
}

/**
 * Cancela una ocurrencia mensual o compromiso único.
 */
export async function cancelarOcurrenciaCompromiso(
  commitment: Compromiso,
  occurrenceDate: string
): Promise<void> {
  const db = obtenerBaseDatos();

  if (commitment.recurrenceType === 'SINGLE') {
    await actualizarCompromiso(commitment.id, { status: 'CANCELLED' });
    return;
  }

  // Si es mensual, registrar excepción como CANCELLED
  const seriesId = commitment.seriesId || commitment.id;
  const now = Date.now();

  const rems = obtenerRecordatoriosPorCompromiso(commitment.id);
  await cancelarNotificaciones(rems.map(r => r.notificationId));

  db.runSync(
    `INSERT OR REPLACE INTO recurrence_exceptions (id, series_id, original_date, status, created_at)
     VALUES (?, ?, ?, 'CANCELLED', ?)`,
    [generarId('exc'), seriesId, occurrenceDate, now]
  );

  emitirCambioBoveda();
}

/**
 * Edita exclusivamente una ocurrencia concreta de una serie mensual.
 * Crea un compromiso único desacoplado y anota la excepción en la serie.
 */
export async function editarSoloEstaOcurrencia(
  seriesCommitment: Compromiso,
  originalDate: string,
  nuevosDatos: DatosNuevoCompromiso
): Promise<Compromiso> {
  const db = obtenerBaseDatos();
  const seriesId = seriesCommitment.seriesId || seriesCommitment.id;

  // 1. Crear el compromiso único
  const compromisoModificado = await crearCompromiso({
    ...nuevosDatos,
    recurrenceType: 'SINGLE',
  });

  // 2. Registrar la excepción apuntando al nuevo compromiso
  const now = Date.now();
  db.runSync(
    `INSERT OR REPLACE INTO recurrence_exceptions (id, series_id, original_date, status, modified_commitment_id, created_at)
     VALUES (?, ?, ?, 'MODIFIED', ?, ?)`,
    [generarId('exc'), seriesId, originalDate, compromisoModificado.id, now]
  );

  emitirCambioBoveda();
  return compromisoModificado;
}

/**
 * Detiene futuras repeticiones de una serie mensual a partir de cierta fecha.
 */
export async function detenerFuturasRepeticiones(seriesId: string): Promise<void> {
  const db = obtenerBaseDatos();
  // Cancelar notificaciones de la serie
  const rems = db.getAllSync<any>('SELECT notification_id FROM reminders WHERE commitment_id = ?', [seriesId]);
  await cancelarNotificaciones(rems.map(r => r.notification_id));

  db.runSync('UPDATE commitments SET status = ? WHERE id = ?', ['CANCELLED', seriesId]);
  emitirCambioBoveda();
}

/**
 * Elimina definitivamente un compromiso único o una serie completa.
 */
export async function eliminarCompromiso(id: string): Promise<void> {
  const db = obtenerBaseDatos();
  const commitment = db.getFirstSync<any>('SELECT * FROM commitments WHERE id = ?', [id]);
  if (!commitment) return;

  const rems = db.getAllSync<any>('SELECT notification_id FROM reminders WHERE commitment_id = ?', [id]);
  await cancelarNotificaciones(rems.map(r => r.notification_id));

  const seriesId = commitment.series_id || id;

  db.withTransactionSync(() => {
    // Si era una serie mensual, cancelar también los modificados vinculados
    if (commitment.recurrence_type === 'MONTHLY') {
      const excs = db.getAllSync<any>(
        'SELECT modified_commitment_id FROM recurrence_exceptions WHERE series_id = ? AND modified_commitment_id IS NOT NULL',
        [seriesId]
      );
      for (const e of excs) {
        db.runSync('DELETE FROM commitments WHERE id = ?', [e.modified_commitment_id]);
      }
      db.runSync('DELETE FROM recurrence_exceptions WHERE series_id = ?', [seriesId]);
    }

    db.runSync('DELETE FROM commitments WHERE id = ?', [id]);
  });

  emitirCambioBoveda();
}

/**
 * Reconstruye el objeto Compromiso desde una fila cruda de SQLite.
 */
function mapearFilaCompromiso(row: any): Compromiso {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time || undefined,
    description: row.description || undefined,
    relatedPerson: row.related_person || undefined,
    recurrenceType: row.recurrence_type,
    seriesId: row.series_id || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Obtiene todas las ocurrencias de compromisos para un mes específico ('YYYY-MM').
 * Incluye compromisos únicos del mes y las ocurrencias calculadas de las series mensuales.
 */
export function obtenerOcurrenciasPorMes(year: number, month: number): OcurrenciaCompromiso[] {
  const db = obtenerBaseDatos();
  const mesStr = month.toString().padStart(2, '0');
  const primerDiaMes = `${year}-${mesStr}-01`;
  const diasMes = diasEnMes(year, month);
  const ultimoDiaMes = `${year}-${mesStr}-${diasMes.toString().padStart(2, '0')}`;

  const resultado: OcurrenciaCompromiso[] = [];

  // 1. Obtener compromisos de tipo 'SINGLE' cuya fecha caiga en este mes
  const rowsSingle = db.getAllSync<any>(
    `SELECT * FROM commitments
     WHERE recurrence_type = 'SINGLE'
       AND date >= ? AND date <= ?
     ORDER BY date ASC, time ASC`,
    [primerDiaMes, ultimoDiaMes]
  );

  for (const r of rowsSingle) {
    const comp = mapearFilaCompromiso(r);
    const rems = obtenerRecordatoriosPorCompromiso(comp.id);
    resultado.push({
      ...comp,
      occurrenceDate: comp.date,
      isRecurrent: false,
      reminders: rems,
    });
  }

  // 2. Obtener series mensuales ('MONTHLY')
  const rowsMonthly = db.getAllSync<any>(
    `SELECT * FROM commitments
     WHERE recurrence_type = 'MONTHLY'
       AND date <= ?
       AND status != 'CANCELLED'
     ORDER BY date ASC, time ASC`,
    [ultimoDiaMes]
  );

  for (const r of rowsMonthly) {
    const comp = mapearFilaCompromiso(r);
    const seriesId = comp.seriesId || comp.id;

    // Obtener el día del mes original
    const diaOriginal = parseInt(comp.date.split('-')[2], 10);

    // REGLA OBLIGATORIA: Si el mes no contiene el día seleccionado (ej: 31 en febrero o abril),
    // se omite esa ocurrencia. NO debe trasladarse automáticamente a otro día.
    if (diaOriginal > diasMes) {
      continue;
    }

    const fechaOcurrencia = `${year}-${mesStr}-${diaOriginal.toString().padStart(2, '0')}`;

    // Si la ocurrencia es anterior a la fecha inicial de la serie, no se genera
    if (fechaOcurrencia < comp.date) {
      continue;
    }

    // Comprobar si existe excepción para esta ocurrencia
    const excepcion = db.getFirstSync<any>(
      'SELECT * FROM recurrence_exceptions WHERE series_id = ? AND original_date = ?',
      [seriesId, fechaOcurrencia]
    );

    if (excepcion) {
      if (excepcion.status === 'CANCELLED') {
        // Ocurrencia cancelada: se omite o se muestra como cancelada
        resultado.push({
          ...comp,
          id: `${comp.id}_${fechaOcurrencia}`,
          occurrenceDate: fechaOcurrencia,
          status: 'CANCELLED',
          isRecurrent: true,
          isException: true,
        });
      } else if (excepcion.status === 'COMPLETED') {
        // Ocurrencia completada
        resultado.push({
          ...comp,
          id: `${comp.id}_${fechaOcurrencia}`,
          occurrenceDate: fechaOcurrencia,
          status: 'COMPLETED',
          isRecurrent: true,
          isException: true,
        });
      } else if (excepcion.status === 'MODIFIED' && excepcion.modified_commitment_id) {
        // Ocurrencia modificada independientemente
        const modRow = db.getFirstSync<any>(
          'SELECT * FROM commitments WHERE id = ?',
          [excepcion.modified_commitment_id]
        );
        if (modRow) {
          const modComp = mapearFilaCompromiso(modRow);
          const rems = obtenerRecordatoriosPorCompromiso(modComp.id);
          resultado.push({
            ...modComp,
            occurrenceDate: modComp.date,
            isRecurrent: true,
            isException: true,
            reminders: rems,
          });
        }
      }
    } else {
      // Ocurrencia normal no modificada de la serie
      const rems = obtenerRecordatoriosPorCompromiso(comp.id);
      resultado.push({
        ...comp,
        id: `${comp.id}_${fechaOcurrencia}`,
        occurrenceDate: fechaOcurrencia,
        isRecurrent: true,
        reminders: rems,
      });
    }
  }

  // Ordenar cronológicamente: fecha ascendente y luego hora (los que tienen hora primero)
  resultado.sort((a, b) => {
    if (a.occurrenceDate !== b.occurrenceDate) {
      return a.occurrenceDate.localeCompare(b.occurrenceDate);
    }
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return a.title.localeCompare(b.title);
  });

  return resultado;
}

/**
 * Obtiene las ocurrencias programadas para una fecha exacta ('YYYY-MM-DD').
 */
export function obtenerOcurrenciasPorDia(fecha: string): OcurrenciaCompromiso[] {
  const [anioStr, mesStr] = fecha.split('-');
  const anio = parseInt(anioStr, 10);
  const mes = parseInt(mesStr, 10);

  const ocurrenciasMes = obtenerOcurrenciasPorMes(anio, mes);
  return ocurrenciasMes.filter(o => o.occurrenceDate === fecha);
}

/**
 * Obtiene los próximos compromisos pendientes desde hoy en adelante.
 */
export function obtenerProximosCompromisos(diasFuturos: number = 30): OcurrenciaCompromiso[] {
  const ahora = new Date();
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1;

  // Obtener compromisos de este mes y del siguiente para cubrir el rango
  const mes1 = obtenerOcurrenciasPorMes(anioActual, mesActual);

  const proxMes = mesActual === 12 ? 1 : mesActual + 1;
  const proxAnio = mesActual === 12 ? anioActual + 1 : anioActual;
  const mes2 = obtenerOcurrenciasPorMes(proxAnio, proxMes);

  const todas = [...mes1, ...mes2];

  const hoyStr = ahora.toISOString().slice(0, 10);
  const limiteDate = new Date(ahora.getTime() + diasFuturos * 86400000);
  const limiteStr = limiteDate.toISOString().slice(0, 10);

  return todas
    .filter(o => o.occurrenceDate >= hoyStr && o.occurrenceDate <= limiteStr && o.status === 'PENDING')
    .sort((a, b) => {
      if (a.occurrenceDate !== b.occurrenceDate) {
        return a.occurrenceDate.localeCompare(b.occurrenceDate);
      }
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      return 0;
    });
}

/**
 * Revisa los compromisos de los próximos 30 días y programa sus notificaciones si no están activas.
 */
export async function sincronizarNotificacionesPendientes(): Promise<void> {
  const db = obtenerBaseDatos();
  try {
    const proximos = obtenerProximosCompromisos(30);
    for (const comp of proximos) {
      if (comp.status !== 'PENDING') continue;
      const baseId = comp.seriesId || comp.id;
      const reminders = obtenerRecordatoriosPorCompromiso(baseId);
      for (const rem of reminders) {
        if (!rem.notificationId) {
          const notifId = await programarNotificacionAviso({
            commitmentId: comp.id,
            title: comp.title,
            commitmentDate: comp.occurrenceDate,
            commitmentTime: comp.time,
            daysBefore: rem.daysBefore,
            reminderTime: rem.time,
          });
          if (notifId) {
            db.runSync('UPDATE reminders SET notification_id = ? WHERE id = ?', [notifId, rem.id]);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error al sincronizar notificaciones pendientes:', err);
  }
}
