import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';

export interface CloneBudgetModalProps {
  visible: boolean;
  previousMonthName: string;
  monthName: string;
  year: number;
  onConfirm: () => void;
  onClose: () => void;
}

export const CloneBudgetModal: React.FC<CloneBudgetModalProps> = ({
  visible,
  previousMonthName,
  monthName,
  year,
  onConfirm,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalDrawer, { paddingBottom: Math.max(insets.bottom, 22) }]}>
          <View style={styles.drawerHandle} />

          <View style={styles.cloneHeaderRow}>
            <View style={styles.cloneIconBox}>
              <MaterialIcons name="content-copy" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.cloneHeaderCol}>
              <Text style={[styles.drawerTitle, TYPOGRAPHY.headlineSm]}>
                ¿Copiar presupuestos?
              </Text>
              <Text style={[styles.drawerSubtitle, TYPOGRAPHY.bodySm]}>
                Se replicarán los límites de {previousMonthName}
              </Text>
            </View>
          </View>

          <View style={styles.cloneExplanationBox}>
            <Text style={[styles.cloneExplanationText, TYPOGRAPHY.bodySm]}>
              Esto actualizará los topes mensuales de tus categorías para {monthName} {year} manteniendo los consumos que ya hayas registrado intactos.
            </Text>
          </View>

          <View style={styles.modalActionButtons}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCancelBtn}
            >
              <Text style={[styles.modalCancelText, TYPOGRAPHY.labelCaps]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={styles.modalSaveBtn}
            >
              <Text style={[styles.modalSaveText, TYPOGRAPHY.labelCaps]}>
                Duplicar Ahora
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 16, 0.8)',
    justifyContent: 'flex-end',
  },
  modalDrawer: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    gap: 16,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: 4,
  },
  cloneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cloneIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloneHeaderCol: {
    flex: 1,
  },
  drawerTitle: {
    color: COLORS.onSurface,
  },
  drawerSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  cloneExplanationBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  cloneExplanationText: {
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.onSurface,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
  },
});
