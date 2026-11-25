import React from 'react';
import { Tabs } from 'expo-router';
import { BarraNavegacionCurva } from '@/compartido/componentes/BarraNavegacionCurva';
import { IconoNav3D } from '@/compartido/componentes/IconosNavegacion3D';

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
          tabBarIcon: ({ focused, size }) => (
            <IconoNav3D nombre="inicio" focused={focused} size={size ?? 23} />
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
          tabBarIcon: ({ focused, size }) => (
            <IconoNav3D nombre="deudas" focused={focused} size={size ?? 23} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ focused, size }) => (
            <IconoNav3D nombre="agenda" focused={focused} size={size ?? 23} />
          ),
        }}
      />
      <Tabs.Screen
        name="presupuestos"
        options={{
          title: 'Presupuestos',
          tabBarIcon: ({ focused, size }) => (
            <IconoNav3D nombre="presupuestos" focused={focused} size={size ?? 23} />
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
          tabBarIcon: ({ focused, size }) => (
            <IconoNav3D nombre="productos" focused={focused} size={size ?? 23} />
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
