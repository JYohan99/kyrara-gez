import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { ChipFiltro } from '@/compartido/componentes/ChipFiltro';

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
    onSeleccionar(opcion);
    if (onToggleMostrarPersonalizado) {
      onToggleMostrarPersonalizado(false);
    }
  };

  const handleSeleccionarPersonalizado = () => {
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
            <ChipFiltro
              key={opcion}
              etiqueta={opcion}
              activo={estaActivo}
              tono="cian"
              onPress={() => handleSeleccionarOpcion(opcion)}
            />
          );
        })}

        {permitePersonalizado && (
          <ChipFiltro
            etiqueta={etiquetaPersonalizado}
            activo={mostrarPersonalizado}
            tono="violeta"
            onPress={handleSeleccionarPersonalizado}
          />
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
