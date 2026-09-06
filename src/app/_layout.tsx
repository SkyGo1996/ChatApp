import "react-native-reanimated";

import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import {
  SplashScreen,
  Stack,
  ThemeProvider,
  useRootNavigationState,
} from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "sonner-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { ensurePersistor, store } from "@/store";
import { getPersistedThemeModeSync, initBlockedStorage } from "@/store/persist";
import { themedStackOptions, useNavigationTheme } from "@/theme/navigation";
import { applyThemeMode } from "@/theme/unistyles";

void SplashScreen.preventAutoHideAsync();

// Apply persisted theme ASAP (after StyleSheet.configure via unistyles import)
// so the first painted frame matches stored Light/Dark/System — no flash.
applyThemeMode(getPersistedThemeModeSync());

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function InnerProviders({
  children,
  onPersistLift,
}: {
  children: ReactNode;
  onPersistLift: () => void;
}) {
  const [persistor, setPersistor] = useState<ReturnType<
    typeof ensurePersistor
  > | null>(null);

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

  const handleBeforeLift = useCallback(() => {
    onPersistLift();
  }, [onPersistLift]);

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

function ThemedRootStack() {
  const { theme } = useUnistyles();
  const navTheme = useNavigationTheme();
  const opaque = useMemo(() => themedStackOptions(theme), [theme]);
  const transparentChat = useMemo(
    () => themedStackOptions(theme, { transparent: Platform.OS === "ios" }),
    [theme]
  );
  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={opaque}>
        <Stack.Screen
          name="index"
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="chats/[id]"
          options={{
            title: "Chat",
            ...transparentChat,
          }}
        />
        <Stack.Screen
          name="chats/[id]/profile"
          options={{
            title: "Profile",
            ...opaque,
          }}
        />
        <Stack.Screen
          name="+not-found"
          options={{ title: "Not Found", ...opaque }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [bootId, setBootId] = useState(0);

  // Empty map: lucide is SVG (no font files). expo-font still gates splash per techstack §9.
  // Failure must not hang splash — treat error as ready.
  const [fontsLoaded, fontError] = useFonts({});
  const fontsReady = fontsLoaded || fontError != null;

  const rootNav = useRootNavigationState();
  const navReady = (() => {
    if (rootNav?.key == null) return false;
    // Don't hide while still on the transient `index` redirect or +not-found.
    // Hide only once the root stack has navigated to `(tabs)` (or other real route).
    const nav = rootNav as unknown as {
      routes?: { name: string }[];
      index?: number;
    };
    const focused = nav.routes?.[nav.index ?? 0];
    if (focused && (focused.name === "index" || focused.name === "+not-found"))
      return false;
    return true;
  })();
  const [persistLifted, setPersistLifted] = useState(false);
  const [layoutDone, setLayoutDone] = useState(false);
  const splashHidden = useRef(false);

  const appReady = fontsReady && persistLifted && navReady;
  const onLayout = useCallback(() => setLayoutDone(true), []);

  useEffect(() => {
    if (appReady && layoutDone && !splashHidden.current) {
      splashHidden.current = true;
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady, layoutDone]);

  const handlePersistLift = useCallback(() => {
    const mode = store.getState().theme.mode;
    applyThemeMode(mode);
    setPersistLifted(true);
  }, []);

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
            <InnerProviders onPersistLift={handlePersistLift}>
              <View style={{ flex: 1 }} onLayout={onLayout} collapsable={false}>
                <ThemedRootStack />
              </View>
            </InnerProviders>
            <Toaster />
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
