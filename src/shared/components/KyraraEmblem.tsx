import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { COLORS } from '@/core/theme';

interface KyraraEmblemProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const KyraraEmblem: React.FC<KyraraEmblemProps> = ({
  size = 64,
  style,
  imageStyle,
}) => {
  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      <Image
        source={require('../../../assets/logo.png')}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: Math.round(size * 0.22) },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  image: {
    overflow: 'hidden',
  },
});
