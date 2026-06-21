/**
 * Layout de tabs. 5 tabs: Inicio / Plantas / Scan / Espacios / Perfil.
 * Scan vive en el centro como tab raíz (no como modal anidado en plants),
 * como en web. La acción "agregar planta" es la tab; no hay FAB en plants.
 *
 * Los iconos vienen de /assets/Navbar/ (SVGs con fill="currentColor").
 * El color activo/inactivo lo inyecta el callback tabBarIcon de expo-router.
 */

import { Tabs } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import HomeSvg from '@assets/Navbar/Home.svg';
import PlantsSvg from '@assets/Navbar/plants icon.svg';
import ScannerSvg from '@assets/Navbar/Scanner icon.svg';
import SpacesSvg from '@assets/Navbar/Spaces icon.svg';
import ProfileSvg from '@assets/Navbar/Profile icon.svg';

const NAV_ICON_SIZE = 26;

export default function TabsLayout() {
  const { colors, typography } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: {
          ...typography.h3,
          color: colors.text,
        },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'TikTokSans-SemiBold',
          fontSize: 11,
          letterSpacing: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <HomeSvg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Plantas',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <PlantsSvg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <ScannerSvg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sections"
        options={{
          title: 'Espacios',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SpacesSvg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <ProfileSvg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} color={color} />
          ),
        }}
      />
      {/* Pantalla accesible vía "Ver todo" del dashboard, no aparece en tab bar. */}
      <Tabs.Screen name="thirsty" options={{ href: null, title: 'Plantas con sed', headerShown: false }} />
    </Tabs>
  );
}
