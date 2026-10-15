import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY } from '@/core/theme';

export interface BackupViewerModalProps {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export const BackupViewerModal: React.FC<BackupViewerModalProps> = ({
  visible,
  title,
  content,
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
        <View style={[styles.modalDrawer, { maxHeight: '80%', paddingBottom: Math.max(insets.bottom, 22) }]}>
          <View style={styles.drawerHandle} />
          <Text style={[styles.modalTitle, TYPOGRAPHY.headlineSm]}>{title}</Text>
          <ScrollView style={styles.backupTextScroll}>
            <Text style={styles.backupContentText}>{content}</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.modalSaveBtn}
            onPress={onClose}
          >
            <Text style={[styles.modalSaveText, TYPOGRAPHY.labelCaps]}>Cerrar</Text>
          </TouchableOpacity>
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
    gap: 14,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    color: COLORS.onSurface,
  },
  modalSaveBtn: {
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
  },
  backupTextScroll: {
    maxHeight: 280,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 12,
    borderRadius: 12,
  },
  backupContentText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
