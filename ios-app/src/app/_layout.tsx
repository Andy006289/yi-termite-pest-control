/* Root layout: loads the brand fonts (Poppins + Inter, as in the style guide), provides
   the shared app data, and defines the stack. The four tabs sit at the bottom of the
   stack; detail screens (result, booking, report …) are pushed on top of them. */

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppDataProvider } from '@/lib/AppData';
import { colors, fonts } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, fontError] = useFonts({ Poppins_600SemiBold, Poppins_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

  useEffect(() => {
    if (loaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, fontError]);

  if (!loaded && !fontError) return null;

  return (
    <AppDataProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.green700,
          headerTitleStyle: { fontFamily: fonts.head, color: colors.green900 },
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="pest/[id]" options={{ presentation: 'modal', title: 'Pest details' }} />
        <Stack.Screen name="result" options={{ title: 'Your estimate' }} />
        <Stack.Screen name="booking" options={{ title: 'Book a service' }} />
        <Stack.Screen name="confirmed/[ref]" options={{ title: 'Booking confirmed', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="report/[ref]" options={{ title: 'Service report' }} />
        <Stack.Screen name="security" options={{ title: 'Data & security' }} />
      </Stack>
    </AppDataProvider>
  );
}
