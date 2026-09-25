// Wallet setup first: it installs the WalletConnect polyfills before anything else runs.
import { appKit, wagmiAdapter } from "@/wallet/appkit";

import { useEffect } from "react";
import { AppKit, AppKitProvider } from "@reown/appkit-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { WagmiProvider, useAccount } from "wagmi";
import { SetupRequired } from "@/components/setup-required";
import { useBrandFonts } from "@/hooks/use-brand-fonts";
import { colors } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, text: colors.fg, border: colors.line, primary: colors.accent },
};

/** Signed out: the welcome screen. Signed in: the tabs and the settings sheet. */
function RootStack() {
  const { isConnected, status } = useAccount();
  const settling = status === "reconnecting" || status === "connecting";

  useEffect(() => {
    // Keep the splash up while a saved session restores, so the welcome screen never flashes.
    if (!settling) SplashScreen.hideAsync();
  }, [settling]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={isConnected}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.9],
            sheetGrabberVisible: true,
            sheetCornerRadius: 28,
            contentStyle: { backgroundColor: colors.bg2 },
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!isConnected}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const fontsReady = useBrandFonts();

  useEffect(() => {
    if (!appKit) SplashScreen.hideAsync();
  }, []);

  if (!fontsReady) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      {appKit && wagmiAdapter ? (
        <AppKitProvider instance={appKit}>
          <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <RootStack />
              <AppKit />
            </QueryClientProvider>
          </WagmiProvider>
        </AppKitProvider>
      ) : (
        <SetupRequired />
      )}
    </ThemeProvider>
  );
}
