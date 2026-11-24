import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { BarraNavegacionCurva } from '@/compartido/componentes/BarraNavegacionCurva';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <BarraNavegacionCurva {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size ?? 23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="movimientos"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="deudas"
        options={{
          title: 'Deudas',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="handshake" size={size ?? 23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event" size={size ?? 23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="presupuestos"
        options={{
          title: 'Presupuestos',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="donut-large" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cuentas"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="categorias"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="productos"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory-2" size={size ?? 22} color={color} />
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
