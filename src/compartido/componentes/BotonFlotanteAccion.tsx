import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { vibracionSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesBotonFlotante {
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  accessibilityLabel?: string;
  colors?: [string, string, ...string[]];
  style?: ViewStyle;
}

export const BotonFlotanteAccion: React.FC<PropiedadesBotonFlotante> = ({
  onPress,
  icon = 'add',
  accessibilityLabel = 'Crear nuevo registro',
  colors = ['#9B5CFF', '#6A1FE8'],
  style,
}) => {
  const handlePress = () => {
    triggerSelection();
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.fabButton, style]}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabGradient}
      >
        <MaterialIcons name={icon} size={30} color="#FFFFFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fabButton: {
    position: 'absolute',
    bottom: 22,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: '#8A4FFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});

// Alias en inglés para compatibilidad
export const FloatingActionButton = BotonFlotanteAccion;
export type FloatingActionButtonProps = PropiedadesBotonFlotante;
