import "react-native-reanimated";

import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "sonner-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { ensurePersistor, store } from "@/store";
import { getPersistedThemeModeSync, initBlockedStorage } from "@/store/persist";
import { applyThemeMode } from "@/theme/unistyles";

void SplashScreen.preventAutoHideAsync();

// Apply persisted theme ASAP (after StyleSheet.configure via unistyles import)
// so the first painted frame matches stored Light/Dark/System — no flash.
applyThemeMode(getPersistedThemeModeSync());

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function InnerProviders({ children }: { children: ReactNode }) {
  const [persistor, setPersistor] = useState<ReturnType<
    typeof ensurePersistor
  > | null>(null);
  const splashHidden = useRef(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initBlockedStorage();
        applyThemeMode(getPersistedThemeModeSync());
        const p = ensurePersistor();
        setPersistor(p);
      } catch (e) {
        if (__DEV__) console.warn("[boot] prepare failed", e);
        try {
          applyThemeMode(getPersistedThemeModeSync());
          const p = ensurePersistor();
          setPersistor(p);
        } catch (e2) {
          if (__DEV__) console.warn("[boot] ensurePersistor failed", e2);
        }
      }
    }
    void prepare();
  }, []);

  // Hide splash only after persist hydrate + theme apply.
  // Fonts are already ready — RootLayout gates InnerProviders on fontsReady.
  const handleBeforeLift = useCallback(() => {
    const mode = store.getState().theme.mode;
    applyThemeMode(mode);
    if (!splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hide();
    }
  }, []);

  if (!persistor) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate
          loading={null}
          persistor={persistor}
          onBeforeLift={handleBeforeLift}>
          {children}
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  const [bootId, setBootId] = useState(0);

  // Empty map: lucide is SVG (no font files). expo-font still gates splash per techstack §9.
  // Failure must not hang splash — treat error as ready.
  const [fontsLoaded, fontError] = useFonts({});
  const fontsReady = fontsLoaded || fontError != null;

  const handleReset = useCallback(() => {
    queryClient.clear();
    setBootId((n) => n + 1);
  }, []);

  if (!fontsReady) {
    return null;
  }

  return (
    <ErrorBoundary key={bootId} onReset={handleReset}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <InnerProviders>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </InnerProviders>
            <Toaster />
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
