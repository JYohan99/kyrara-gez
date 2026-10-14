import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { hasCompletedOnboarding } from '@/core/database';
import { COLORS } from '@/core/theme';

export default function IndexScreen() {
  useEffect(() => {
    const checkNavigation = () => {
      try {
        const completed = hasCompletedOnboarding();
        if (completed) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(onboarding)');
        }
      } catch {
        // If error or first run, go to onboarding
        router.replace('/(onboarding)');
      }
    };

    // Small delay to ensure root layout has mounted
    const timer = setTimeout(checkNavigation, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={COLORS.primaryContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
