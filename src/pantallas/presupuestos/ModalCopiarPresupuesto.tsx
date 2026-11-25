import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { BotonBrillante, EncabezadoModal, TarjetaVidrio } from '@/compartido/componentes';

export interface PropiedadesModalCopiarPresupuesto {
  visible: boolean;
  previousMonthName: string;
  monthName: string;
  year: number;
  onConfirm: () => void;
  onClose: () => void;
}

export const ModalCopiarPresupuesto: React.FC<PropiedadesModalCopiarPresupuesto> = ({
  visible,
  previousMonthName,
  monthName,
  year,
  onConfirm,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

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
          <EncabezadoModal
            titulo="¿Copiar presupuestos?"
            subtitulo={`Se replicarán los límites de ${previousMonthName}`}
            icono="content-copy"
            tono="violeta"
            onCerrar={onClose}
          />

          <TarjetaVidrio variant="lowest" style={styles.cloneExplanationBox}>
            <Text style={[styles.cloneExplanationText, TYPOGRAPHY.bodySm]}>
              Esto actualizará los topes mensuales de tus categorías para {monthName} {year} manteniendo los consumos que ya hayas registrado intactos.
            </Text>
          </TarjetaVidrio>

          <View style={styles.modalActionButtons}>
            <BotonBrillante
              title="Duplicar"
              onPress={onConfirm}
            />
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
    gap: 12,
  },
  cloneExplanationBox: {
    padding: 14,
    borderRadius: 14,
  },
  cloneExplanationText: {
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  modalActionButtons: {
    marginTop: 6,
  },
});

export const CloneBudgetModal = ModalCopiarPresupuesto;
