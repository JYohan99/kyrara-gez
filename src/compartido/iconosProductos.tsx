import React from 'react';
import { Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { obtenerAjuste, fijarAjuste } from '@/datos/consultas/seguridad';

export interface GrupoIconos {
  id: string;
  titulo: string;
  iconos: string[];
}

/**
 * Detecta si una cadena contiene caracteres de emoji.
 */
export function esEmoji(texto?: string): boolean {
  if (!texto) return false;
  const regexEmoji = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1FA00}-\u{1FAFF}]/u;
  return regexEmoji.test(texto);
}

/**
 * Grupos de iconos predeterminados incluidos en la aplicación.
 */
export const GRUPOS_ICONOS_BASE: GrupoIconos[] = [
  {
    id: 'destacados',
    titulo: 'Destacados',
    iconos: [
      'inventory-2',
      'local-cafe',
      'image',
      'photo-camera',
      'emoji-food-beverage',
      'checkroom',
      'shopping-bag',
      'storefront',
      'palette',
      'devices',
    ],
  },
  {
    id: 'fotografia',
    titulo: 'Fotografía & Arte',
    iconos: [
      'image',
      'photo-camera',
      'photo-library',
      'print',
      'wallpaper',
      'brush',
      'palette',
      'collections',
      'burst-mode',
      'auto-awesome',
      'camera',
      'aspect-ratio',
    ],
  },
  {
    id: 'cafe_bebidas',
    titulo: 'Café & Bebidas',
    iconos: [
      'local-cafe',
      'coffee',
      'emoji-food-beverage',
      'free-breakfast',
      'liquor',
      'local-bar',
      'wine-bar',
      'sports-bar',
      'local-drink',
      'nightlife',
    ],
  },
  {
    id: 'alimentos',
    titulo: 'Alimentos & Gastronomía',
    iconos: [
      'restaurant',
      'fastfood',
      'bakery-dining',
      'lunch-dining',
      'cake',
      'icecream',
      'local-pizza',
      'ramen-dining',
      'set-meal',
      'brunch-dining',
    ],
  },
  {
    id: 'comercio',
    titulo: 'Comercio & Tienda',
    iconos: [
      'inventory-2',
      'shopping-bag',
      'shopping-cart',
      'storefront',
      'sell',
      'local-offer',
      'loyalty',
      'qr-code-2',
      'point-of-sale',
      'receipt-long',
    ],
  },
  {
    id: 'ropa_moda',
    titulo: 'Ropa & Moda',
    iconos: [
      'checkroom',
      'dry-cleaning',
      'accessibility-new',
      'watch',
      'diamond',
      'style',
      'shopping-basket',
    ],
  },
  {
    id: 'papeleria',
    titulo: 'Papelería & Oficina',
    iconos: [
      'menu-book',
      'auto-stories',
      'content-paste',
      'edit',
      'draw',
      'receipt-long',
      'folder',
      'folder-special',
      'note-alt',
      'bookmark',
    ],
  },
  {
    id: 'tecnologia',
    titulo: 'Tecnología & Dispositivos',
    iconos: [
      'devices',
      'smartphone',
      'laptop',
      'memory',
      'headphones',
      'cable',
      'charging-station',
      'mouse',
      'keyboard',
      'videogame-asset',
    ],
  },
  {
    id: 'servicios',
    titulo: 'Servicios & Varios',
    iconos: [
      'build',
      'handyman',
      'clean-hands',
      'miscellaneous-services',
      'verified',
      'star',
      'thumb-up',
      'support-agent',
      'badge',
      'card-giftcard',
    ],
  },
  {
    id: 'emojis',
    titulo: 'Emojis Populares',
    iconos: [
      '☕',
      '📸',
      '🖼️',
      '🥐',
      '🍰',
      '🍕',
      '👕',
      '📦',
      '🛍️',
      '🎨',
      '💻',
      '⭐',
      '✨',
      '🎁',
      '📱',
      '🧃',
      '📚',
      '🍩',
      '🍔',
      '🕶️',
    ],
  },
];

const CLAVE_AJUSTE_ICONOS_REMOTOS = 'catalogo_iconos_remotos_v1';

/**
 * Retorna todos los grupos de iconos, combinando los locales con los sincronizados de la nube si existen.
 */
export function obtenerGruposIconos(): GrupoIconos[] {
  try {
    const jsonGuardado = obtenerAjuste(CLAVE_AJUSTE_ICONOS_REMOTOS, '');
    if (jsonGuardado) {
      const gruposRemotos = JSON.parse(jsonGuardado) as GrupoIconos[];
      if (Array.isArray(gruposRemotos) && gruposRemotos.length > 0) {
        return gruposRemotos;
      }
    }
  } catch {
    // Si falla el parseo, usar base
  }
  return GRUPOS_ICONOS_BASE;
}

/**
 * Sincroniza iconos desde una URL remota (ej: GitHub Raw, CDN o Firebase) sin compilar un nuevo APK.
 */
export async function sincronizarIconosRemotos(url?: string): Promise<boolean> {
  const urlFinal = url || obtenerAjuste('url_catalogo_iconos_remoto', '');
  if (!urlFinal) return false;

  try {
    const respuesta = await fetch(urlFinal);
    if (!respuesta.ok) return false;
    const datos = await respuesta.json();
    if (Array.isArray(datos?.grupos)) {
      fijarAjuste(CLAVE_AJUSTE_ICONOS_REMOTOS, JSON.stringify(datos.grupos));
      return true;
    }
  } catch (err) {
    console.warn('Error al sincronizar iconos remotos:', err);
  }
  return false;
}

/**
 * Determina el icono de un producto: si el producto tiene uno asignado lo usa,
 * de lo contrario infiere uno según el nombre o retorna el predeterminado.
 */
export function obtenerIconoProducto(nombre?: string, iconoGuardado?: string): string {
  if (iconoGuardado && iconoGuardado.trim().length > 0) {
    return iconoGuardado.trim();
  }
  const nom = (nombre || '').toLowerCase();
  if (nom.includes('caf')) return 'local-cafe';
  if (nom.includes('foto') || nom.includes('cuadro') || nom.includes('lienzo')) return 'image';
  if (nom.includes('taza') || nom.includes('vaso')) return 'emoji-food-beverage';
  if (nom.includes('remera') || nom.includes('ropa')) return 'checkroom';
  return 'inventory-2';
}

export const COLOR_ICONO_PRODUCTO = '#00D2FF';

export interface PropiedadesIconoProducto {
  icono?: string;
  nombre?: string;
  size?: number;
  color?: string;
}

/**
 * Componente unificado para renderizar iconos de producto (soporta MaterialIcons y Emojis).
 */
export const IconoProducto: React.FC<PropiedadesIconoProducto> = ({
  icono,
  nombre,
  size = 20,
  color = COLOR_ICONO_PRODUCTO,
}) => {
  const iconoFinal = obtenerIconoProducto(nombre, icono);

  if (esEmoji(iconoFinal)) {
    return (
      <Text style={{ fontSize: size - 2, textAlign: 'center', includeFontPadding: false }}>
        {iconoFinal}
      </Text>
    );
  }

  return <MaterialIcons name={iconoFinal as any} size={size} color={color} />;
};
