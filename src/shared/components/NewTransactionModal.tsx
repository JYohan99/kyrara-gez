import React from 'react';
import { Modal } from 'react-native';
import { FlowType } from '@/core/database';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';

export interface NewTransactionModalProps {
  visible: boolean;
  initialType?: FlowType;
  onClose: () => void;
  onCreated?: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  visible,
  initialType = 'EXPENSE',
  onClose,
  onCreated,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TransactionForm
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
