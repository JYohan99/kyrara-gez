import React from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

export type NombreIconoNav3D =
  | 'inicio'
  | 'deudas'
  | 'agenda'
  | 'presupuestos'
  | 'productos';

export interface PropiedadesIconoNav3D {
  nombre: NombreIconoNav3D;
  focused?: boolean;
  size?: number;
}

/**
 * Conjunto de íconos SVG con volumen 3D, biseles metálicos, reflejos especulares
 * y sombras proyectadas para la barra de navegación inferior.
 */
export const IconoNav3D: React.FC<PropiedadesIconoNav3D> = ({
  nombre,
  focused = false,
  size = 24,
}) => {
  // Paletas 3D según estado activo (porcelana/cristal brillante sobre orbe cian)
  // o inactivo (plata satinada con volumen sobre barra obsidiana)
  const cTop = focused ? '#FFFFFF' : '#C8D6DF';
  const cMid = focused ? '#D2F4FF' : '#8A9CA8';
  const cDeep = focused ? '#6BB8CE' : '#4C5B66';
  const cAccentTop = focused ? '#FFF2A6' : '#A5E7FF';
  const cAccentDeep = focused ? '#00B8E6' : '#3E7A8F';
  const shadowColor = focused ? '#002233' : '#05080A';
  const shadowOpacity = focused ? 0.42 : 0.5;
  const uid = `${nombre}_${focused ? 'on' : 'off'}`;

  switch (nombre) {
    case 'inicio':
      // Casa / Dashboard 3D con techo biselado y ventana luminosa
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <LinearGradient id={`${uid}_body`} x1="0" y1="0" x2="0.8" y2="1">
              <Stop offset="0%" stopColor={cTop} />
              <Stop offset="55%" stopColor={cMid} />
              <Stop offset="100%" stopColor={cDeep} />
            </LinearGradient>
            <LinearGradient id={`${uid}_roof`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="50%" stopColor={cTop} />
              <Stop offset="100%" stopColor={cDeep} />
            </LinearGradient>
            <LinearGradient id={`${uid}_door`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={cAccentDeep} />
              <Stop offset="100%" stopColor={focused ? '#004B63' : '#24313A'} />
            </LinearGradient>
          </Defs>

          {/* Sombra 3D */}
          <G opacity={shadowOpacity} translateX={0.8} translateY={1.3}>
            <Path d="M 3 11.2 L 12 3.5 L 21 11.2 L 19 11.2 L 19 20 C 19 20.8 18.3 21.5 17.5 21.5 L 6.5 21.5 C 5.7 21.5 5 20.8 5 20 L 5 11.2 Z" fill={shadowColor} />
          </G>

          {/* Cuerpo de la casa */}
          <Path
            d="M 5 10.5 L 12 4.8 L 19 10.5 L 19 19.6 C 19 20.4 18.3 21 17.5 21 L 6.5 21 C 5.7 21 5 20.4 5 19.6 Z"
            fill={`url(#${uid}_body)`}
          />
          {/* Puerta/ventana hundida */}
          <Rect x="9.5" y="13.5" width="5" height="7.5" rx="2" fill={`url(#${uid}_door)`} />
          {/* Techo 3D sobresaliente */}
          <Path
            d="M 2.8 11.2 L 11.3 3.7 C 11.7 3.3 12.3 3.3 12.7 3.7 L 21.2 11.2 C 21.7 11.6 21.4 12.4 20.7 12.4 L 19.4 12.4 L 12 5.9 L 4.6 12.4 L 3.3 12.4 C 2.6 12.4 2.3 11.6 2.8 11.2 Z"
            fill={`url(#${uid}_roof)`}
          />
          {/* Reflejo especular superior */}
          <Line
            x1="7.5"
            y1="10.2"
            x2="12"
            y2="6.4"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeLinecap="round"
            opacity={0.75}
          />
        </Svg>
      );

    case 'deudas':
      // Pila de monedas 3D metálicas con brillo especular
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <LinearGradient id={`${uid}_side`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={cDeep} />
              <Stop offset="45%" stopColor={cMid} />
              <Stop offset="100%" stopColor={cDeep} />
            </LinearGradient>
            <LinearGradient id={`${uid}_face`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="55%" stopColor={cTop} />
              <Stop offset="100%" stopColor={cMid} />
            </LinearGradient>
          </Defs>

          {/* Sombra 3D */}
          <G opacity={shadowOpacity} translateX={0.8} translateY={1.3}>
            <Rect x="4.2" y="5.5" width="15.6" height="14.5" rx="5.5" fill={shadowColor} />
          </G>

          {/* Moneda inferior */}
          <Path
            d="M 4.5 14.5 L 4.5 17.5 C 4.5 19.3 7.9 20.6 12 20.6 C 16.1 20.6 19.5 19.3 19.5 17.5 L 19.5 14.5 Z"
            fill={`url(#${uid}_side)`}
          />
          {/* Moneda intermedia */}
          <Path
            d="M 4.5 10.6 L 4.5 13.8 C 4.5 15.6 7.9 16.9 12 16.9 C 16.1 16.9 19.5 15.6 19.5 13.8 L 19.5 10.6 Z"
            fill={`url(#${uid}_side)`}
          />
          <Path
            d="M 4.5 13.8 C 4.5 15.6 7.9 16.9 12 16.9 C 16.1 16.9 19.5 15.6 19.5 13.8"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="0.9"
          />
          {/* Moneda superior (cuerpo) */}
          <Path
            d="M 4.5 7.2 L 4.5 10.1 C 4.5 11.9 7.9 13.2 12 13.2 C 16.1 13.2 19.5 11.9 19.5 10.1 L 19.5 7.2 Z"
            fill={`url(#${uid}_side)`}
          />
          {/* Cara superior elíptica luminosa */}
          <Path
            d="M 12 4.1 C 16.1 4.1 19.5 5.5 19.5 7.2 C 19.5 8.9 16.1 10.3 12 10.3 C 7.9 10.3 4.5 8.9 4.5 7.2 C 4.5 5.5 7.9 4.1 12 4.1 Z"
            fill={`url(#${uid}_face)`}
          />
          {/* Reflejo curvo en la moneda superior */}
          <Path
            d="M 7.5 6.8 C 8.7 5.7 11.2 5.4 13.6 5.7"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity={0.9}
          />
        </Svg>
      );

    case 'agenda':
      // Calendario 3D con anillas metálicas y cabecera biselada
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <LinearGradient id={`${uid}_card`} x1="0" y1="0" x2="0.6" y2="1">
              <Stop offset="0%" stopColor={cTop} />
              <Stop offset="60%" stopColor={cMid} />
              <Stop offset="100%" stopColor={cDeep} />
            </LinearGradient>
            <LinearGradient id={`${uid}_hdr`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={cAccentTop} />
              <Stop offset="100%" stopColor={cAccentDeep} />
            </LinearGradient>
          </Defs>

          {/* Sombra 3D */}
          <G opacity={shadowOpacity} translateX={0.8} translateY={1.3}>
            <Rect x="3.5" y="5" width="17" height="15.5" rx="3.5" fill={shadowColor} />
          </G>

          {/* Cuerpo del calendario */}
          <Rect x="3.5" y="5" width="17" height="15.5" rx="3.5" fill={`url(#${uid}_card)`} />
          {/* Cabecera superior con volumen */}
          <Path
            d="M 7 5 L 17 5 C 18.9 5 20.5 6.5 20.5 8.5 L 20.5 9.8 L 3.5 9.8 L 3.5 8.5 C 3.5 6.5 5.1 5 7 5 Z"
            fill={`url(#${uid}_hdr)`}
          />
          {/* Anillas metálicas superiores */}
          <Rect x="7.2" y="2.8" width="2.4" height="4.4" rx="1.2" fill="#FFFFFF" />
          <Rect x="14.4" y="2.8" width="2.4" height="4.4" rx="1.2" fill="#FFFFFF" />

          {/* Puntos de días */}
          <Circle cx="8" cy="13.2" r="1.25" fill={focused ? '#00566A' : '#32404A'} />
          <Circle cx="12" cy="13.2" r="1.25" fill={focused ? '#00566A' : '#32404A'} />
          <Circle cx="16" cy="13.2" r="1.25" fill={focused ? '#00566A' : '#32404A'} />
          <Circle cx="8" cy="16.8" r="1.25" fill={focused ? '#00566A' : '#32404A'} />
          <Circle cx="12" cy="16.8" r="1.25" fill={focused ? '#0088B0' : '#4A5D6B'} />

          {/* Brillo especular */}
          <Line
            x1="5.5"
            y1="6.4"
            x2="18.5"
            y2="6.4"
            stroke="#FFFFFF"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity={0.7}
          />
        </Svg>
      );

    case 'presupuestos':
      // Gráfico donut / anillo 3D segmentado con brillo cristal
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <LinearGradient id={`${uid}_ring`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={cTop} />
              <Stop offset="55%" stopColor={cMid} />
              <Stop offset="100%" stopColor={cDeep} />
            </LinearGradient>
            <LinearGradient id={`${uid}_seg`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="50%" stopColor={cAccentTop} />
              <Stop offset="100%" stopColor={cAccentDeep} />
            </LinearGradient>
          </Defs>

          {/* Sombra 3D */}
          <G opacity={shadowOpacity} translateX={0.8} translateY={1.3}>
            <Circle cx="12" cy="12" r="7.5" fill="none" stroke={shadowColor} strokeWidth="4.4" />
          </G>

          {/* Anillo principal 3D */}
          <Circle cx="12" cy="12" r="7.5" fill="none" stroke={`url(#${uid}_ring)`} strokeWidth="4.2" />
          {/* Segmento destacado elevado */}
          <Path
            d="M 12 4.5 A 7.5 7.5 0 0 1 19.5 12"
            fill="none"
            stroke={`url(#${uid}_seg)`}
            strokeWidth="4.6"
            strokeLinecap="round"
          />
          {/* Brillo especular curvo en el aro */}
          <Path
            d="M 6.8 7.4 A 6.9 6.9 0 0 1 12 5.1"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity={0.85}
          />
        </Svg>
      );

    case 'productos':
      // Cubo isométrico 3D real con 3 caras sombreadas y cinta superior
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <LinearGradient id={`${uid}_top`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor={cTop} />
            </LinearGradient>
            <LinearGradient id={`${uid}_left`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={cMid} />
              <Stop offset="100%" stopColor={cDeep} />
            </LinearGradient>
            <LinearGradient id={`${uid}_right`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={cDeep} />
              <Stop offset="100%" stopColor={focused ? '#3D7E96' : '#2E3A42'} />
            </LinearGradient>
          </Defs>

          {/* Sombra 3D */}
          <G opacity={shadowOpacity} translateX={0.9} translateY={1.4}>
            <Polygon points="12,3 20.2,7.5 20.2,16.5 12,21 3.8,16.5 3.8,7.5" fill={shadowColor} />
          </G>

          {/* Cara superior iluminada */}
          <Polygon points="12,3.2 20,7.6 12,12 4,7.6" fill={`url(#${uid}_top)`} />
          {/* Cara izquierda tono medio */}
          <Polygon points="4,7.6 12,12 12,20.8 4,16.4" fill={`url(#${uid}_left)`} />
          {/* Cara derecha sombreada */}
          <Polygon points="20,7.6 12,12 12,20.8 20,16.4" fill={`url(#${uid}_right)`} />

          {/* Cinta de sellado 3D */}
          <Line
            x1="8"
            y1="5.4"
            x2="16"
            y2="9.8"
            stroke={focused ? '#00A8CC' : '#506470'}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={0.75}
          />
          {/* Aristas especulares */}
          <Line x1="4.4" y1="7.8" x2="12" y2="12" stroke="#FFFFFF" strokeWidth="0.9" opacity={0.8} />
          <Line x1="12" y1="12" x2="19.6" y2="7.8" stroke="#FFFFFF" strokeWidth="0.8" opacity={0.6} />
          <Line x1="12" y1="12" x2="12" y2="20.4" stroke="#FFFFFF" strokeWidth="0.8" opacity={0.5} />
        </Svg>
      );
  }
};
