import React from 'react';
import { router } from 'expo-router';
import { TransactionForm } from '@/features/transactions';

export default function NuevoMovimientoScreen() {
  return (
    <TransactionForm
      isScreen
      onSuccess={() => {
        router.replace('/(tabs)/movimientos');
      }}
      onCancel={() => {
        router.back();
      }}
    />
  );
}
