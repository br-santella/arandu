import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '../theme/colors';
import { fontAssets, fonts } from '../theme/typography';

SplashScreen.preventAutoHideAsync();

// Server data cache (published points, areas). Map data changes rarely.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 2 } },
});

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // If fonts fail, render anyway with system fonts rather than block the app.
  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.title },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="mapa" options={{ title: 'Mapa' }} />
        <Stack.Screen name="progresso" options={{ title: 'Progresso' }} />
        <Stack.Screen name="desafio" options={{ title: 'Nome escondido' }} />
        <Stack.Screen name="guia" options={{ title: 'Guia' }} />
        <Stack.Screen name="trilha" options={{ title: 'Trilha' }} />
        <Stack.Screen name="ponto/[slug]" options={{ title: 'Ponto' }} />
      </Stack>
    </QueryClientProvider>
  );
}
