import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS } from '@/core/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'high' | 'low' | 'lowest';
  bordered?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'surface',
  bordered = true,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'low':
        return COLORS.surfaceContainerLow;
      case 'high':
        return COLORS.surfaceContainerHigh;
      case 'lowest':
        return COLORS.surfaceContainerLowest;
      case 'surface':
      default:
        return COLORS.surfaceContainer;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: bordered ? COLORS.borderGlass : 'transparent',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});
