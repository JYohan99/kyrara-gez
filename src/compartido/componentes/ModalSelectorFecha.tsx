import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES } from '../tema/colores';
import { TIPOGRAFIA } from '../tema/tipografia';
import { TarjetaVidrio } from './TarjetaVidrio';
import { EncabezadoModal } from './EncabezadoModal';
import { OrbeGlossy } from './OrbeGlossy';
import { ChipFiltro } from './ChipFiltro';
import { BotonBrillante } from './BotonBrillante';
import {
  NOMBRES_MESES,
  NOMBRES_DIAS_CORTO,
  esMismoDia,
  esHoy,
  esAyer,
  obtenerDiasEnMes,
  obtenerPrimerDiaMesIndice,
  crearFechaSegura,
} from '../utilidades/fecha';
import { vibracionSeleccion, vibracionLigera } from '../utilidades/hapticos';

export interface PropiedadesModalSelectorFecha {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export const ModalSelectorFecha: React.FC<PropiedadesModalSelectorFecha> = ({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  const [anioVista, setAnioVista] = useState(selectedDate.getFullYear());
  const [mesVista, setMesVista] = useState(selectedDate.getMonth());
  const [fechaTemporal, setFechaTemporal] = useState<Date>(selectedDate);

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  if (!visible) return null;

  const diasEnMes = obtenerDiasEnMes(anioVista, mesVista);
  const primerDiaIndice = obtenerPrimerDiaMesIndice(anioVista, mesVista);

  const manejarMesAnterior = () => {
    vibracionSeleccion();
    if (mesVista === 0) {
      setMesVista(11);
      setAnioVista(prev => prev - 1);
    } else {
      setMesVista(prev => prev - 1);
    }
  };

  const manejarMesSiguiente = () => {
    vibracionSeleccion();
    if (mesVista === 11) {
      setMesVista(0);
      setAnioVista(prev => prev + 1);
    } else {
      setMesVista(prev => prev + 1);
    }
  };

  const manejarSeleccionarDia = (dia: number) => {
    vibracionSeleccion();
    const nuevaFecha = crearFechaSegura(anioVista, mesVista, dia);
    setFechaTemporal(nuevaFecha);
  };

  const manejarRapidoHoy = () => {
    vibracionSeleccion();
    const ahora = new Date();
    setFechaTemporal(ahora);
    setAnioVista(ahora.getFullYear());
    setMesVista(ahora.getMonth());
  };

  const manejarRapidoAyer = () => {
    vibracionSeleccion();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerSeguro = crearFechaSegura(
      ayer.getFullYear(),
      ayer.getMonth(),
      ayer.getDate()
    );
    setFechaTemporal(ayerSeguro);
    setAnioVista(ayerSeguro.getFullYear());
    setMesVista(ayerSeguro.getMonth());
  };

  const manejarConfirmar = () => {
    vibracionLigera();
    onSelectDate(fechaTemporal);
    onClose();
  };

  // Generar celdas de días
  const celdasDias = [];
  // Espacios vacíos antes del 1er día del mes
  for (let i = 0; i < primerDiaIndice; i++) {
    celdasDias.push(<View key={`empty-${i}`} style={estilos.celdaDiaVacia} />);
  }

  const hoy = new Date();
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaCelda = new Date(anioVista, mesVista, dia);
    const estaSeleccionado = esMismoDia(fechaCelda, fechaTemporal);
    const esDiaActual = esMismoDia(fechaCelda, hoy);

    celdasDias.push(
      <TouchableOpacity
        key={`day-${dia}`}
        style={[
          estilos.celdaDia,
          esDiaActual && !estaSeleccionado && estilos.celdaDiaHoy,
          estaSeleccionado && estilos.celdaDiaSeleccionada,
        ]}
        onPress={() => manejarSeleccionarDia(dia)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            estilos.textoCeldaDia,
            esDiaActual && !estaSeleccionado && estilos.textoCeldaDiaHoy,
            estaSeleccionado && estilos.textoCeldaDiaSeleccionada,
          ]}
        >
          {dia}
        </Text>
        {esDiaActual && !estaSeleccionado && <View style={estilos.puntoHoy} />}
      </TouchableOpacity>
    );
  }

  const esTemporalHoy = esHoy(fechaTemporal);
  const esTemporalAyer = esAyer(fechaTemporal);

  return (
    <View style={estilos.superposicion}>
      <Pressable style={estilos.fondo} onPress={onClose} />

      <TarjetaVidrio variant="high" style={estilos.tarjetaCalendario}>
        <EncabezadoModal
          titulo="Fecha de Operación"
          icono="calendar-month"
          tono="violeta"
          onCerrar={onClose}
          style={estilos.cabeceraModal}
        />

        {/* Atajos rápidos (Hoy / Ayer) */}
        <View style={estilos.filaAtajos}>
          <ChipFiltro
            etiqueta="Hoy"
            activo={esTemporalHoy}
            tono="violeta"
            onPress={manejarRapidoHoy}
          />
          <ChipFiltro
            etiqueta="Ayer"
            activo={esTemporalAyer}
            tono="violeta"
            onPress={manejarRapidoAyer}
          />
        </View>

        {/* Navegación Mes / Año */}
        <View style={estilos.filaNavegacionMes}>
          <OrbeGlossy
            tamano={34}
            tono="obsidiana"
            onPress={manejarMesAnterior}
            accessibilityLabel="Mes anterior"
          >
            <MaterialIcons name="chevron-left" size={22} color={COLORES.enSuperficie} />
          </OrbeGlossy>

          <Text style={[estilos.textoNavMes, TIPOGRAFIA.titularPequeno]}>
            {NOMBRES_MESES[mesVista]} {anioVista}
          </Text>

          <OrbeGlossy
            tamano={34}
            tono="obsidiana"
            onPress={manejarMesSiguiente}
            accessibilityLabel="Mes siguiente"
          >
            <MaterialIcons name="chevron-right" size={22} color={COLORES.enSuperficie} />
          </OrbeGlossy>
        </View>

        {/* Encabezados de días de la semana */}
        <View style={estilos.filaDiasSemana}>
          {NOMBRES_DIAS_CORTO.map((nombre, idx) => (
            <Text key={`weekday-${idx}`} style={estilos.textoDiaSemana}>
              {nombre}
            </Text>
          ))}
        </View>

        {/* Grilla de días */}
        <View style={estilos.contenedorGrilla}>{celdasDias}</View>

        {/* Acciones inferiores */}
        <View style={estilos.filaAcciones}>
          <TouchableOpacity style={estilos.botonCancelar} onPress={onClose}>
            <Text style={estilos.textoBotonCancelar}>Cancelar</Text>
          </TouchableOpacity>

          <View style={estilos.confirmarWrap}>
            <BotonBrillante title="Confirmar" onPress={manejarConfirmar} />
          </View>
        </View>
      </TarjetaVidrio>
    </View>
  );
};

// Alias compatible
export const DatePickerModal = ModalSelectorFecha;

const estilos = StyleSheet.create({
  superposicion: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 20,
  },
  fondo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tarjetaCalendario: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 18,
  },
  cabeceraModal: {
    marginBottom: 12,
  },
  filaAtajos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filaNavegacionMes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 10,
  },
  textoNavMes: {
    color: COLORES.enSuperficie,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  filaDiasSemana: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 6,
  },
  textoDiaSemana: {
    width: 38,
    textAlign: 'center',
    color: COLORES.bordeContorno,
    fontSize: 11,
    fontWeight: '600',
  },
  contenedorGrilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 4,
  },
  celdaDiaVacia: {
    width: 38,
    height: 38,
  },
  celdaDia: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  celdaDiaSeleccionada: {
    backgroundColor: COLORES.primarioContenedor,
    borderWidth: 1,
    borderColor: COLORES.primario,
    shadowColor: COLORES.primario,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  celdaDiaHoy: {
    borderWidth: 1,
    borderColor: COLORES.secundario,
    backgroundColor: 'rgba(165, 231, 255, 0.08)',
  },
  textoCeldaDia: {
    color: COLORES.enSuperficie,
    fontSize: 14,
    fontWeight: '500',
  },
  textoCeldaDiaHoy: {
    color: COLORES.secundario,
    fontWeight: '700',
  },
  textoCeldaDiaSeleccionada: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  puntoHoy: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORES.secundario,
  },
  filaAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(165, 231, 255, 0.1)',
  },
  botonCancelar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 13, 15, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
  },
  textoBotonCancelar: {
    color: COLORES.enSuperficieVariante,
    fontSize: 13,
    fontWeight: '700',
  },
  confirmarWrap: {
    flex: 1,
  },
});
