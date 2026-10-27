import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesSelectorChips {
  titulo: string;
  opciones: string[];
  seleccionada: string;
  onSeleccionar: (opcion: string) => void;
  permitePersonalizado?: boolean;
  etiquetaPersonalizado?: string;
  valorPersonalizado?: string;
  onChangeValorPersonalizado?: (valor: string) => void;
  mostrarPersonalizado?: boolean;
  onToggleMostrarPersonalizado?: (mostrar: boolean) => void;
  placeholderPersonalizado?: string;
}

/**
 * Componente modular para seleccionar opciones con chips estilizados
 * y campo de entrada opcional para valores personalizados.
 */
export const SelectorChips: React.FC<PropiedadesSelectorChips> = ({
  titulo,
  opciones,
  seleccionada,
  onSeleccionar,
  permitePersonalizado = true,
  etiquetaPersonalizado = 'Otro / Personalizado',
  valorPersonalizado = '',
  onChangeValorPersonalizado,
  mostrarPersonalizado = false,
  onToggleMostrarPersonalizado,
  placeholderPersonalizado = 'Ingresa una opción personalizada...',
}) => {
  const handleSeleccionarOpcion = (opcion: string) => {
    triggerSelection();
    onSeleccionar(opcion);
    if (onToggleMostrarPersonalizado) {
      onToggleMostrarPersonalizado(false);
    }
  };

  const handleSeleccionarPersonalizado = () => {
    triggerSelection();
    if (onToggleMostrarPersonalizado) {
      onToggleMostrarPersonalizado(true);
    }
  };

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.titulo, TYPOGRAPHY.etiquetaMayusculas]}>{titulo}</Text>

      <View style={styles.trackChips}>
        {opciones.map(opcion => {
          const estaActivo = !mostrarPersonalizado && seleccionada === opcion;
          return (
            <TouchableOpacity
              key={opcion}
              style={[styles.chip, estaActivo && styles.chipActivo]}
              onPress={() => handleSeleccionarOpcion(opcion)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipTexto,
                  TYPOGRAPHY.cuerpoPequeno,
                  estaActivo && styles.chipTextoActivo,
                ]}
              >
                {opcion}
              </Text>
            </TouchableOpacity>
          );
        })}

        {permitePersonalizado && (
          <TouchableOpacity
            style={[styles.chip, mostrarPersonalizado && styles.chipActivo]}
            onPress={handleSeleccionarPersonalizado}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipTexto,
                TYPOGRAPHY.cuerpoPequeno,
                mostrarPersonalizado && styles.chipTextoActivo,
              ]}
            >
              {etiquetaPersonalizado}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {permitePersonalizado && mostrarPersonalizado && onChangeValorPersonalizado && (
        <TextInput
          style={[styles.inputPersonalizado, TYPOGRAPHY.cuerpoMedio]}
          value={valorPersonalizado}
          onChangeText={onChangeValorPersonalizado}
          placeholder={placeholderPersonalizado}
          placeholderTextColor={COLORS.onSurfaceVariant + '80'}
          autoCapitalize="sentences"
          autoFocus
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    gap: 8,
  },
  titulo: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  trackChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipActivo: {
    backgroundColor: 'rgba(87, 245, 171, 0.15)',
    borderColor: COLORS.secondary,
  },
  chipTexto: {
    color: COLORS.onSurfaceVariant,
  },
  chipTextoActivo: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  inputPersonalizado: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.onSurface,
    marginTop: 4,
  },
});
