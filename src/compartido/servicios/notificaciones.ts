import { Platform } from 'react-native';

const CANAL_ID = 'agenda-recordatorios';

/**
 * Indicador de si las notificaciones locales del sistema están activas.
 * Se desactiva por defecto para entornos de emulador y Expo Go donde el módulo
 * nativo 'ExpoTopicSubscriptionModule' no está compilado, evitando bloqueos durante las pruebas.
 * Cuando se compile un build nativo de desarrollo (npx expo run:android), puede activarse a true.
 */
export const NOTIFICACIONES_ACTIVAS = false;

// Referencia perezosa (lazy) al módulo de notificaciones para no romper el emulador
let NotificationsModule: typeof import('expo-notifications') | null = null;
let intentoCargaRealizado = false;

function obtenerModuloNotificaciones(): typeof import('expo-notifications') | null {
  if (!NOTIFICACIONES_ACTIVAS) {
    return null;
  }
  if (intentoCargaRealizado) {
    return NotificationsModule;
  }

  intentoCargaRealizado = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-notifications');
    NotificationsModule = mod;

    // Configurar el manejador de notificaciones para cuando la app está en primer plano
    mod.setNotificationHandler?.({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return NotificationsModule;
  } catch (err) {
    console.warn(
      '[Notificaciones] Módulo nativo expo-notifications no disponible en este entorno. Las notificaciones quedarán desactivadas.',
      err
    );
    NotificationsModule = null;
    return null;
  }
}

/**
 * Inicializa el canal de notificación en dispositivos Android.
 */
export async function inicializarCanalNotificaciones(): Promise<void> {
  const notif = obtenerModuloNotificaciones();
  if (!notif) {
    return;
  }

  if (Platform.OS === 'android') {
    try {
      await notif.setNotificationChannelAsync(CANAL_ID, {
        name: 'Recordatorios de Agenda',
        description: 'Notificaciones y avisos de compromisos programados en Kyrara Ges',
        importance: notif.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8A4FFF',
      });
    } catch (err) {
      console.warn('No se pudo inicializar el canal de notificaciones en Android:', err);
    }
  }
}

/**
 * Solicita permisos de notificación al usuario si aún no han sido concedidos.
 */
export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  const notif = obtenerModuloNotificaciones();
  if (!notif) {
    // En modo emulador / pruebas, respondemos afirmativamente para permitir el flujo en la UI
    return true;
  }

  try {
    const { status: estadoActual } = await notif.getPermissionsAsync();
    if (estadoActual === 'granted') {
      return true;
    }

    const { status: nuevoEstado } = await notif.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return nuevoEstado === 'granted';
  } catch (err) {
    console.warn('Error al solicitar permisos de notificación:', err);
    return false;
  }
}

/**
 * Verifica si los permisos de notificación están actualmente concedidos.
 */
export async function tienePermisoNotificaciones(): Promise<boolean> {
  const notif = obtenerModuloNotificaciones();
  if (!notif) {
    return true;
  }

  try {
    const { status } = await notif.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export interface ParametrosProgramacion {
  commitmentId: string;
  title: string;
  commitmentDate: string; // 'YYYY-MM-DD'
  commitmentTime?: string; // 'HH:mm'
  daysBefore: number; // 0 = hoy, 1 = ayer, etc.
  reminderTime: string; // 'HH:mm'
}

/**
 * Calcula la fecha y hora exacta del aviso en la zona horaria local.
 */
export function calcularFechaAviso(
  commitmentDate: string,
  daysBefore: number,
  reminderTime: string
): Date {
  const [anioStr, mesStr, diaStr] = commitmentDate.split('-');
  const anio = parseInt(anioStr, 10);
  const mes = parseInt(mesStr, 10) - 1; // 0-indexed en Date
  const dia = parseInt(diaStr, 10);

  const [horaStr, minStr] = (reminderTime || '09:00').split(':');
  const hora = parseInt(horaStr, 10) || 0;
  const minuto = parseInt(minStr, 10) || 0;

  // Crear la fecha base local restando los días de anticipación
  const fechaAviso = new Date(anio, mes, dia - daysBefore, hora, minuto, 0, 0);
  return fechaAviso;
}

/**
 * Genera el cuerpo descriptivo del aviso para la notificación.
 */
function construirCuerpoAviso(
  daysBefore: number,
  commitmentTime?: string
): string {
  const detalleHora = commitmentTime ? ` a las ${commitmentTime}` : '';

  if (daysBefore === 0) {
    return `Tienes este compromiso programado para hoy${detalleHora}.`;
  } else if (daysBefore === 1) {
    return `Recordatorio: compromiso mañana${detalleHora}.`;
  } else {
    return `Recordatorio: compromiso en ${daysBefore} días${detalleHora}.`;
  }
}

/**
 * Programa una notificación local para un recordatorio de compromiso.
 * Retorna el ID de la notificación programada o un ID simulado en emulador.
 */
export async function programarNotificacionAviso(
  params: ParametrosProgramacion
): Promise<string | null> {
  const fechaDisparo = calcularFechaAviso(
    params.commitmentDate,
    params.daysBefore,
    params.reminderTime
  );

  // Si la fecha calculada ya pasó, no se programa
  if (fechaDisparo.getTime() <= Date.now()) {
    return null;
  }

  const notif = obtenerModuloNotificaciones();
  if (!notif) {
    // Modo emulador: generamos un ID simulado para persistir en la base de datos sin errores
    const idSimulado = `sim_${params.commitmentId}_${params.daysBefore}_${Date.now()}`;
    return idSimulado;
  }

  try {
    const tienePermisos = await tienePermisoNotificaciones();
    if (!tienePermisos) {
      const concedido = await solicitarPermisoNotificaciones();
      if (!concedido) {
        return null;
      }
    }

    const cuerpo = construirCuerpoAviso(params.daysBefore, params.commitmentTime);

    const notificationId = await notif.scheduleNotificationAsync({
      content: {
        title: `Compromiso: ${params.title}`,
        body: cuerpo,
        data: {
          commitmentId: params.commitmentId,
          fechaCompromiso: params.commitmentDate,
        },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: CANAL_ID } : {}),
      },
      trigger: {
        type: notif.SchedulableTriggerInputTypes.DATE,
        date: fechaDisparo,
      },
    });

    return notificationId;
  } catch (err) {
    console.warn('Error al programar notificación local:', err);
    return null;
  }
}

/**
 * Cancela una notificación local previamente programada.
 */
export async function cancelarNotificacion(notificationId?: string | null): Promise<void> {
  if (!notificationId) return;

  const notif = obtenerModuloNotificaciones();
  if (!notif) {
    return;
  }

  try {
    await notif.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn(`No se pudo cancelar la notificación ${notificationId}:`, err);
  }
}

/**
 * Cancela una lista de notificaciones locales.
 */
export async function cancelarNotificaciones(notificationIds: (string | undefined | null)[]): Promise<void> {
  const idsValidos = notificationIds.filter((id): id is string => Boolean(id));
  await Promise.allSettled(idsValidos.map(id => cancelarNotificacion(id)));
}
