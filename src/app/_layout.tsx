import "react-native-reanimated";

import { applyThemeMode } from "@/theme/unistyles";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { ensurePersistor, store } from "@/store";
import { getPersistedThemeModeSync, initBlockedStorage } from "@/store/persist";
import { Toaster } from "sonner-native";

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function InnerProviders({ children }: { children: ReactNode }) {
  const [appIsReady, setAppIsReady] = useState(false);
  const [persistor, setPersistor] = useState<ReturnType<
    typeof ensurePersistor
  > | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        await initBlockedStorage();
        const persistedMode = getPersistedThemeModeSync();
        applyThemeMode(persistedMode);
        const p = ensurePersistor();
        setPersistor(p);
      } catch (e) {
        if (__DEV__) console.warn("[boot] prepare failed", e);
        // Ensure gate still lifts even if blocked init fails — fall back to plain MMKV.
        try {
          const p = ensurePersistor();
          setPersistor(p);
        } catch (e2) {
          if (__DEV__) console.warn("[boot] ensurePersistor failed", e2);
        }
      } finally {
        setAppIsReady(true);
      }
    }
    void prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hide();
    }
  }, [appIsReady]);

  // PersistGate will re-apply theme after rehydration in case the store value differs
  // from the synchronous MMKV read (e.g. migration).
  const handleBeforeLift = useCallback(() => {
    const mode = store.getState().theme.mode;
    applyThemeMode(mode);
  }, []);

  if (!appIsReady || !persistor) {
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

  const handleReset = useCallback(() => {
    // Singleton queryClient survives React tree remount — must be cleared explicitly.
    queryClient.clear();
    setBootId((n) => n + 1);
  }, []);

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
