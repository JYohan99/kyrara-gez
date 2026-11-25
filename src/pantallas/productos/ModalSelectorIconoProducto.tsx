import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarraBusqueda } from '@/compartido/componentes/BarraBusqueda';
import { EncabezadoModal } from '@/compartido/componentes/EncabezadoModal';
import { ChipFiltro } from '@/compartido/componentes/ChipFiltro';
import {
  obtenerGruposIconos,
  IconoProducto,
  esEmoji,
} from '@/compartido/iconosProductos';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalSelectorIconoProducto {
  visible: boolean;
  iconoActual: string;
  nombreProducto?: string;
  onSelectIcon: (icono: string) => void;
  onClose: () => void;
}

export const ModalSelectorIconoProducto: React.FC<PropiedadesModalSelectorIconoProducto> = ({
  visible,
  iconoActual,
  nombreProducto,
  onSelectIcon,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const grupos = useMemo(() => obtenerGruposIconos(), []);
  const [busqueda, setBusqueda] = useState('');
  const [grupoActivo, setGrupoActivo] = useState<string>('todos');
  const [emojiPersonalizado, setEmojiPersonalizado] = useState('');

  // Iconos filtrados por categoría o búsqueda
  const iconosAMostrar = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (q) {
      // Buscar en todos los grupos
      const setUnico = new Set<string>();
      grupos.forEach(g => {
        g.iconos.forEach(ic => {
          if (ic.toLowerCase().includes(q)) {
            setUnico.add(ic);
          }
        });
      });

      // Si la búsqueda coincide con algún icono de MaterialIcons global
      const glyphs = Object.keys(MaterialIcons.glyphMap);
      for (const g of glyphs) {
        if (g.toLowerCase().includes(q)) {
          setUnico.add(g);
          if (setUnico.size >= 60) break; // Limitar resultados para rendimiento fluido
        }
      }

      return Array.from(setUnico);
    }

    if (grupoActivo === 'todos') {
      const setUnico = new Set<string>();
      grupos.forEach(g => g.iconos.forEach(ic => setUnico.add(ic)));
      return Array.from(setUnico);
    }

    const grupoEncontrado = grupos.find(g => g.id === grupoActivo);
    return grupoEncontrado ? grupoEncontrado.iconos : [];
  }, [busqueda, grupoActivo, grupos]);

  const handleSeleccionar = (ic: string) => {
    triggerSelection();
    onSelectIcon(ic);
    onClose();
  };

  const handleAplicarEmojiPersonalizado = () => {
    const texto = emojiPersonalizado.trim();
    if (texto) {
      triggerSelection();
      onSelectIcon(texto);
      setEmojiPersonalizado('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header Drag Handle */}
          <View style={styles.dragHandle} />

          <EncabezadoModal
            titulo="Icono del Producto"
            subtitulo={esEmoji(iconoActual) ? `Emoji: ${iconoActual}` : `Icono: ${iconoActual}`}
            icono="apps"
            tono="cian"
            onCerrar={onClose}
            style={styles.modalHeader}
          />

          {/* Campo de búsqueda */}
          <BarraBusqueda
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar icono por nombre (ej: cafe, camera, box)..."
            style={{ marginHorizontal: 20, marginBottom: 10 }}
          />

          {/* Chips de Categorías (solo visibles si no hay búsqueda activa) */}
          {!busqueda && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChips}
            >
              <ChipFiltro
                etiqueta="Todos"
                activo={grupoActivo === 'todos'}
                tono="cian"
                onPress={() => setGrupoActivo('todos')}
              />

              {grupos.map(g => (
                <ChipFiltro
                  key={g.id}
                  etiqueta={g.titulo}
                  activo={grupoActivo === g.id}
                  tono="cian"
                  onPress={() => setGrupoActivo(g.id)}
                />
              ))}
            </ScrollView>
          )}

          {/* Grilla de Iconos */}
          <ScrollView style={styles.scrollGrid} contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {iconosAMostrar.map(ic => {
                const isSelected = iconoActual === ic;
                return (
                  <TouchableOpacity
                    key={ic}
                    style={[styles.iconButton, isSelected && styles.iconButtonSelected]}
                    onPress={() => handleSeleccionar(ic)}
                    activeOpacity={0.7}
                  >
                    <IconoProducto icono={ic} size={26} color={isSelected ? '#57F5AB' : '#00D2FF'} />
                    {!esEmoji(ic) && (
                      <Text style={[styles.iconLabel, isSelected && styles.iconLabelSelected]} numberOfLines={1}>
                        {ic}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sección para Escribir/Pegar cualquier Emoji */}
            <View style={styles.customEmojiSection}>
              <Text style={styles.customEmojiTitle}>¿Prefieres un Emoji personalizado?</Text>
              <View style={styles.customEmojiRow}>
                <TextInput
                  style={styles.customEmojiInput}
                  placeholder="Pega o escribe un emoji aquí (ej: 🥤 🎨 📸)"
                  placeholderTextColor="#64748B"
                  value={emojiPersonalizado}
                  onChangeText={setEmojiPersonalizado}
                  maxLength={4}
                />
                <TouchableOpacity
                  style={[styles.customEmojiBtn, !emojiPersonalizado.trim() && styles.customEmojiBtnDisabled]}
                  onPress={handleAplicarEmojiPersonalizado}
                  disabled={!emojiPersonalizado.trim()}
                >
                  <Text style={styles.customEmojiBtnText}>Usar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 11, 0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#101518',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.18)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(165, 231, 255, 0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  modalHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoryChips: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  scrollGrid: {
    paddingHorizontal: 20,
  },
  gridContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  iconButton: {
    width: '22.5%',
    aspectRatio: 1,
    backgroundColor: '#1A2328',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A3740',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  iconButtonSelected: {
    backgroundColor: 'rgba(87, 245, 171, 0.14)',
    borderColor: '#57F5AB',
  },
  iconLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  iconLabelSelected: {
    color: '#57F5AB',
    fontWeight: '600',
  },
  customEmojiSection: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#182226',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E3D46',
  },
  customEmojiTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  customEmojiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customEmojiInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#131A1D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E3D46',
    paddingHorizontal: 12,
    color: '#F8FAFC',
    fontSize: 13,
  },
  customEmojiBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#57F5AB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customEmojiBtnDisabled: {
    backgroundColor: '#2E3D46',
    opacity: 0.5,
  },
  customEmojiBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B0F10',
  },
});
