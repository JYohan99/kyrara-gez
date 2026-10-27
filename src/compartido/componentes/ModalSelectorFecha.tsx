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

      <View style={estilos.tarjetaCalendario}>
        {/* Header con título y botón cerrar */}
        <View style={estilos.filaCabecera}>
          <View style={estilos.envoltorioTituloCabecera}>
            <MaterialIcons name="calendar-month" size={20} color={COLORES.primario} />
            <Text style={[estilos.titulo, TIPOGRAFIA.etiquetaMayusculas]}>Fecha de Operación</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={20} color={COLORES.enSuperficieVariante} />
          </TouchableOpacity>
        </View>

        {/* Atajos rápidos (Hoy / Ayer) */}
        <View style={estilos.filaAtajos}>
          <TouchableOpacity
            style={[estilos.chipAtajo, esTemporalHoy && estilos.chipAtajoActivo]}
            onPress={manejarRapidoHoy}
            activeOpacity={0.7}
          >
            <Text
              style={[
                estilos.textoChipAtajo,
                esTemporalHoy && estilos.textoChipAtajoActivo,
              ]}
            >
              Hoy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[estilos.chipAtajo, esTemporalAyer && estilos.chipAtajoActivo]}
            onPress={manejarRapidoAyer}
            activeOpacity={0.7}
          >
            <Text
              style={[
                estilos.textoChipAtajo,
                esTemporalAyer && estilos.textoChipAtajoActivo,
              ]}
            >
              Ayer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navegación Mes / Año */}
        <View style={estilos.filaNavegacionMes}>
          <TouchableOpacity
            style={estilos.botonNav}
            onPress={manejarMesAnterior}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="chevron-left" size={24} color={COLORES.enSuperficie} />
          </TouchableOpacity>

          <Text style={[estilos.textoNavMes, TIPOGRAFIA.titularPequeno]}>
            {NOMBRES_MESES[mesVista]} {anioVista}
          </Text>

          <TouchableOpacity
            style={estilos.botonNav}
            onPress={manejarMesSiguiente}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="chevron-right" size={24} color={COLORES.enSuperficie} />
          </TouchableOpacity>
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

          <TouchableOpacity
            style={estilos.botonConfirmar}
            onPress={manejarConfirmar}
            activeOpacity={0.8}
          >
            <MaterialIcons name="check" size={18} color="#FFFFFF" />
            <Text style={estilos.textoBotonConfirmar}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: COLORES.superficieContenedor,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORES.bordeCristal,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  filaCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  envoltorioTituloCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titulo: {
    color: COLORES.primario,
    letterSpacing: 1.2,
  },
  filaAtajos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chipAtajo: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORES.superficieContenedorAlto,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipAtajoActivo: {
    backgroundColor: 'rgba(138, 79, 255, 0.25)',
    borderColor: COLORES.primario,
  },
  textoChipAtajo: {
    color: COLORES.enSuperficieVariante,
    fontSize: 12,
    fontWeight: '600',
  },
  textoChipAtajoActivo: {
    color: COLORES.primario,
    fontWeight: '700',
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
  botonNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORES.superficieContenedorAlto,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  botonCancelar: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  textoBotonCancelar: {
    color: COLORES.enSuperficieVariante,
    fontSize: 13,
    fontWeight: '600',
  },
  botonConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORES.primarioContenedor,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  textoBotonConfirmar: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
