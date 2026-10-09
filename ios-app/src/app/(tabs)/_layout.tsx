/* Bottom tab bar. On the website the same four destinations were the header menu
   (hamburger on phones); on iOS they become a thumb-reachable tab bar. */

import { Tabs } from 'expo-router';

import { Icon } from '@/components/Icon';
import { useAppData } from '@/lib/AppData';
import { colors, fonts } from '@/lib/theme';

export default function TabsLayout() {
  const { bookings } = useAppData();
  const upcoming = bookings.filter((b) => b.source === 'app' && b.status === 'requested').length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.green700,
        tabBarInactiveTintColor: colors.ink3,
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        headerTitleStyle: { fontFamily: fonts.head, color: colors.green900 },
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: ({ color }) => <Icon name="i-home" size={24} color={color} /> }} />
      <Tabs.Screen name="identify" options={{ title: 'Pest Guide', tabBarIcon: ({ color }) => <Icon name="i-search" size={24} color={color} /> }} />
      <Tabs.Screen name="estimate" options={{ title: 'Estimate', headerTitle: 'Get an estimate', tabBarIcon: ({ color }) => <Icon name="i-dollar" size={24} color={color} /> }} />
      <Tabs.Screen
        name="services"
        options={{
          title: 'My Services',
          tabBarIcon: ({ color }) => <Icon name="i-user" size={24} color={color} />,
          tabBarBadge: upcoming || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.amber500, color: colors.green900, fontFamily: fonts.bodySemi },
        }}
      />
    </Tabs>
  );
}
