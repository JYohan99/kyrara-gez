import React from 'react';
import { router } from 'expo-router';
import { FormularioMovimiento } from '@/pantallas/movimientos';

export default function NuevoMovimientoScreen() {
  return (
    <FormularioMovimiento
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
