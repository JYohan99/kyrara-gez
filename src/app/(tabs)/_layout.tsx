import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS } from '@/compartido/tema';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const tabHeight = 60 + insets.bottom;
  const paddingBottom = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabHeight,
            paddingBottom,
            paddingTop: 8,
          },
        ],
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.onSurfaceVariant,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="movimientos"
        options={{
          title: 'Movimientos',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="receipt-long" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="event" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="presupuestos"
        options={{
          title: 'Presupuestos',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="donut-large" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cuentas"
        options={{
          title: 'Cuentas',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-balance-wallet" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nuevo"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#101415',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGlass,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
