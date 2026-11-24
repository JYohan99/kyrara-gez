import React, { useRef, useState } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { COLORES as COLORS } from '../tema';
import { gatillarSeleccion } from '../utilidades/hapticos';

const IconoLupa3D: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <SvgLinearGradient id="lupaAro" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#D6ECF7" />
        <Stop offset="100%" stopColor="#6D8EA0" />
      </SvgLinearGradient>
      <RadialGradient id="lupaLente" cx="35%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
        <Stop offset="55%" stopColor="#B6EBFF" stopOpacity="0.28" />
        <Stop offset="100%" stopColor="#00566A" stopOpacity="0.4" />
      </RadialGradient>
      <SvgLinearGradient id="lupaMango" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="45%" stopColor="#BFD9E6" />
        <Stop offset="100%" stopColor="#3B5361" />
      </SvgLinearGradient>
    </Defs>

    {/* Sombra proyectada para volumen 3D */}
    <G opacity={0.38} translateX={0.8} translateY={1.3}>
      <Line
        x1="15.2"
        y1="15.2"
        x2="20.2"
        y2="20.2"
        stroke="#001622"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <Circle cx="10.2" cy="10.2" r="6.5" fill="none" stroke="#001622" strokeWidth="2.6" />
    </G>

    {/* Mango cilíndrico 3D */}
    <Line
      x1="15.2"
      y1="15.2"
      x2="20.2"
      y2="20.2"
      stroke="url(#lupaMango)"
      strokeWidth="3.1"
      strokeLinecap="round"
    />
    <Line
      x1="15.6"
      y1="14.7"
      x2="19.6"
      y2="18.7"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="0.9"
      strokeLinecap="round"
    />

    {/* Lente de cristal y aro metálico 3D */}
    <Circle cx="10.2" cy="10.2" r="6.2" fill="url(#lupaLente)" />
    <Circle cx="10.2" cy="10.2" r="6.2" fill="none" stroke="url(#lupaAro)" strokeWidth="2.3" />

    {/* Reflejo especular curvo en el lente */}
    <Path
      d="M 6.7 8.4 A 4.1 4.1 0 0 1 10.6 6.1"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="1.35"
      strokeLinecap="round"
      opacity={0.9}
    />
    <Circle cx="12.6" cy="7.1" r="0.7" fill="#FFFFFF" opacity={0.85} />
  </Svg>
);

const IconoCerrar3D: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <SvgLinearGradient id="cerrarGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="65%" stopColor="#E6DCFF" />
        <Stop offset="100%" stopColor="#9B84D6" />
      </SvgLinearGradient>
    </Defs>
    {/* Sombra 3D */}
    <G opacity={0.4} translateX={0.7} translateY={1.2}>
      <Line x1="6.5" y1="6.5" x2="17.5" y2="17.5" stroke="#18003B" strokeWidth="3.2" strokeLinecap="round" />
      <Line x1="17.5" y1="6.5" x2="6.5" y2="17.5" stroke="#18003B" strokeWidth="3.2" strokeLinecap="round" />
    </G>
    {/* Trazo principal 3D */}
    <Line x1="6.5" y1="6.5" x2="17.5" y2="17.5" stroke="url(#cerrarGrad)" strokeWidth="3" strokeLinecap="round" />
    <Line x1="17.5" y1="6.5" x2="6.5" y2="17.5" stroke="url(#cerrarGrad)" strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

export interface PropiedadesBarraBusqueda {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  colorOrbe?: 'cian' | 'violeta';
}

/**
 * Barra de búsqueda reutilizable con estilo cápsula glossy 3D y botón orbe luminoso,
 * a juego con EncabezadoSuperior y la paleta oscura/cian de la aplicación.
 */
export const BarraBusqueda: React.FC<PropiedadesBarraBusqueda> = ({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  onClear,
  style,
  autoFocus = false,
  onSubmitEditing,
  colorOrbe = 'cian',
}) => {
  const inputRef = useRef<TextInput>(null);
  const [enfocado, setEnfocado] = useState(false);

  const tieneTexto = value.length > 0;

  const handlePressOrbe = () => {
    gatillarSeleccion();
    if (tieneTexto) {
      if (onClear) {
        onClear();
      } else {
        onChangeText('');
      }
    } else {
      inputRef.current?.focus();
    }
  };

  const coloresBorde: [string, string, string] = enfocado
    ? [
        'rgba(0, 210, 255, 0.78)',
        'rgba(165, 231, 255, 0.45)',
        'rgba(138, 79, 255, 0.42)',
      ]
    : [
        'rgba(165, 231, 255, 0.45)',
        'rgba(74, 84, 92, 0.42)',
        'rgba(209, 188, 255, 0.22)',
      ];

  const coloresOrbe: [string, string, string] =
    tieneTexto || colorOrbe === 'violeta'
      ? ['#B894FF', COLORS.primarioContenedor, COLORS.enPrimario]
      : ['#6CE5FF', COLORS.secundarioContenedor, COLORS.enSecundarioContenedor];

  return (
    <View style={[styles.container, style]}>
      {/* Borde exterior metálico/cristal */}
      <LinearGradient
        colors={coloresBorde}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.capsuleRim}
      >
        {/* Cuerpo oscuro glossy de la cápsula */}
        <LinearGradient
          colors={['#202B30', '#11181B', '#090D0F', '#141D20']}
          locations={[0, 0.46, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.capsuleBody}
        >
          {/* Reflejo especular superior (efecto cristal 3D) */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.22)',
              'rgba(165, 231, 255, 0.06)',
              'rgba(255, 255, 255, 0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
            style={styles.capsuleGloss}
          />

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="rgba(204, 195, 216, 0.52)"
            style={styles.input}
            autoCorrect={false}
            autoFocus={autoFocus}
            returnKeyType="search"
            onFocus={() => setEnfocado(true)}
            onBlur={() => setEnfocado(false)}
            onSubmitEditing={onSubmitEditing}
          />

          {/* Orbe 3D glossy derecho (lupa 3D para enfocar / X 3D para limpiar) */}
          <TouchableOpacity
            style={styles.orbBezel}
            onPress={handlePressOrbe}
            activeOpacity={0.78}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={tieneTexto ? 'Limpiar búsqueda' : 'Buscar'}
          >
            <LinearGradient
              colors={coloresOrbe}
              locations={[0, 0.52, 1]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.orbSphere}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.62)', 'rgba(255, 255, 255, 0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
                style={styles.orbGloss}
              />
              {tieneTexto ? <IconoCerrar3D size={18} /> : <IconoLupa3D size={20} />}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  capsuleRim: {
    borderRadius: 999,
    padding: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.45,
        shadowRadius: 9,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  capsuleBody: {
    borderRadius: 999,
    paddingLeft: 16,
    paddingRight: 5,
    paddingVertical: 4,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  capsuleGloss: {
    position: 'absolute',
    top: 1,
    left: 12,
    right: 12,
    height: '48%',
    borderRadius: 999,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 6,
    paddingRight: 8,
  },
  orbBezel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    backgroundColor: 'rgba(5, 8, 10, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbSphere: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbGloss: {
    position: 'absolute',
    top: 1.5,
    left: 4,
    right: 4,
    height: '48%',
    borderRadius: 999,
  },
});
