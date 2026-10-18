import React from 'react';
import { Modal } from 'react-native';
import { TipoFlujo } from '@/datos';
import { FormularioMovimiento } from './FormularioMovimiento';

export interface PropiedadesModalNuevoMovimiento {
  visible: boolean;
  initialType?: TipoFlujo;
  onClose: () => void;
  onCreated?: () => void;
}

export const ModalNuevoMovimiento: React.FC<PropiedadesModalNuevoMovimiento> = ({
  visible,
  initialType = 'EXPENSE',
  onClose,
  onCreated,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <FormularioMovimiento
        key={`${initialType}-${visible}`}
        initialType={initialType}
        onCancel={onClose}
        onSuccess={() => {
          if (onCreated) onCreated();
          onClose();
        }}
      />
    </Modal>
  );
};

// Alias compatibles
export const NewTransactionModal = ModalNuevoMovimiento;
export type NewTransactionModalProps = PropiedadesModalNuevoMovimiento;
