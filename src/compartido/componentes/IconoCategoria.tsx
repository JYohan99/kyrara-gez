import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface PropiedadesIconoCategoria {
  icon?: string | null;
  size?: number;
  color?: string;
  fallbackIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
}

export const esIconoEmoji = (icon?: string | null): boolean => {
  if (!icon) return false;
  return /\p{Extended_Pictographic}/u.test(icon);
};

export const IconoCategoria: React.FC<PropiedadesIconoCategoria> = ({
  icon,
  size = 20,
  color = '#FFFFFF',
  fallbackIcon = 'category',
}) => {
  const iconStr = icon?.trim();
  if (!iconStr) {
    return <MaterialIcons name={fallbackIcon} size={size} color={color} />;
  }

  if (esIconoEmoji(iconStr)) {
    return (
      <Text
        style={[
          estilos.emoji,
          {
            fontSize: Math.round(size * 1.1),
            lineHeight: Math.round(size * 1.35),
          },
        ]}
      >
        {iconStr}
      </Text>
    );
  }

  return <MaterialIcons name={iconStr as any} size={size} color={color} />;
};

const estilos = StyleSheet.create({
  emoji: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
