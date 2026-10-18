import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Ellipse,
  Rect,
  Circle,
  Path,
  G,
} from 'react-native-svg';

interface PropiedadesIlustracionBoveda {
  width?: number;
  height?: number;
}

export const IlustracionBoveda: React.FC<PropiedadesIlustracionBoveda> = ({
  width = 280,
  height = 176,
}) => {
  return (
    <View style={estilos.contenedor}>
      <Svg width={width} height={height} viewBox="0 0 280 176" fill="none">
        <Defs>
          <LinearGradient id="vaultGlow" x1="40" y1="20" x2="240" y2="160" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#8A4FFF" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#00D2FF" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#57F5AB" stopOpacity="0.6" />
          </LinearGradient>
          <LinearGradient id="vaultPlate" x1="70" y1="30" x2="210" y2="150" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#272B2C" />
            <Stop offset="100%" stopColor="#181C1D" />
          </LinearGradient>
          <RadialGradient id="sparkleLight" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#A5E7FF" stopOpacity="1" />
            <Stop offset="60%" stopColor="#8A4FFF" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#8A4FFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Anillo de órbita */}
        <Ellipse
          cx={140}
          cy={88}
          rx={100}
          ry={48}
          stroke="url(#vaultGlow)"
          strokeWidth={1.5}
          strokeDasharray="4 6"
          opacity={0.6}
        />

        {/* Cuerpo de la Bóveda */}
        <Rect x={85} y={44} width={110} height={90} rx={16} fill="url(#vaultPlate)" />

        {/* Anillos de dial */}
        <Circle cx={140} cy={89} r={30} fill="#101415" />
        <Circle cx={140} cy={89} r={26} stroke="#8A4FFF" strokeWidth={2} opacity={0.8} />
        <Circle cx={140} cy={89} r={14} fill="#1C2021" />

        {/* Pasador de dial */}
        <Path d="M140 79L143 89H137L140 79Z" fill="#57F5AB" />

        {/* Nodos de flujo monetario */}
        <Circle cx={98} cy={56} r={3} fill="#00D2FF" opacity={0.8} />
        <Circle cx={182} cy={56} r={3} fill="#D1BCFF" opacity={0.8} />
        <Circle cx={98} cy={122} r={3} fill="#57F5AB" opacity={0.8} />
        <Circle cx={182} cy={122} r={3} fill="#FF8A9E" opacity={0.8} />

        {/* Estrella Kyrara */}
        <G transform="translate(196, 32)">
          <Circle cx={14} cy={14} r={18} fill="url(#sparkleLight)" />
          <Path
            d="M14 2V26M2 14H26M6 6L22 22M6 22L22 6"
            stroke="#EADDFF"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>

        {/* Micro chip */}
        <G transform="translate(48, 80)">
          <Rect x={0} y={0} width={28} height={20} rx={4} fill="#1C2021" />
          <Circle cx={14} cy={10} r={4} fill="#00D2FF" opacity={0.7} />
        </G>
      </Svg>
    </View>
  );
};

// Alias compatible
export const VaultIllustration = IlustracionBoveda;

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
