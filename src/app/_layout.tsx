import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  inicializarBaseDatos as initDatabase,
  obtenerAjustesSeguridad as getSecuritySettings,
  useSeguridadBoveda as useVaultSecurity,
} from '@/datos';
import { COLORES as COLORS } from '@/compartido/tema';
import { PantallaBloqueo as LockScreen } from '@/compartido/componentes/PantallaBloqueo';
import { ProveedorSincronizacionBoveda as VaultSyncProvider } from '@/datos/sincronizacion';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { security } = useVaultSecurity();

  const [isLocked, setIsLocked] = React.useState(() => {
    try {
      initDatabase();
      const sec = getSecuritySettings();
      return sec.hasPin && sec.requirePinOnStartup;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      initDatabase();
    } catch (err) {
      console.error('Error initializing database:', err);
    }
  }, []);

  const handleUnlocked = React.useCallback(() => {
    setIsLocked(false);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <VaultSyncProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.surfaceBase },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="ajustes" options={{ animation: 'slide_from_right' }} />
        </Stack>

        {isLocked && security.hasPin && (
          <LockScreen
            correctPin={security.pinCode}
            onUnlocked={handleUnlocked}
            allowBiometrics={security.biometricsEnabled}
          />
        )}
      </View>
    </VaultSyncProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
