import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import React, { type ReactElement } from "react";
import { Provider } from "react-redux";
import type { Storage } from "redux-persist";

import blockedReducer, { type BlockedState } from "@/store/slices/blockedSlice";
import themeReducer, { type ThemeState } from "@/store/slices/themeSlice";

// ---------------------------------------------------------------------------
// QueryClient helpers - per TanStack docs, each test gets isolated client
// with retry:false and gcTime Infinity to avoid Jest open-handle warnings
// ---------------------------------------------------------------------------
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

// In-memory Storage for redux-persist tests (avoids MMKV)
export function createMemoryStorage(
  initial: Record<string, string> = {}
): Storage & { __store: Map<string, string> } {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    __store: store,
    getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  };
}

type TestRootState = {
  blocked: BlockedState;
  theme: ThemeState;
};

const testRootReducer = combineReducers({
  blocked: blockedReducer,
  theme: themeReducer,
});

// Minimal store for component tests (pure reducers, no persist)
export function createTestStore(preloadedState?: Partial<TestRootState>) {
  return configureStore({
    reducer: testRootReducer,
    ...(preloadedState !== undefined
      ? { preloadedState: preloadedState as TestRootState }
      : {}),
  });
}

type CustomRenderOptions = Omit<RenderOptions, "wrapper"> & {
  queryClient?: QueryClient;
  store?: ReturnType<typeof createTestStore>;
};

// Render with QueryClient + Redux providers (covers react-query + redux-persist consumers)
// RNTL v14: render is async
export async function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient: qcOpt, store: storeOpt, ...renderOptions } = options;
  const queryClient = qcOpt ?? createTestQueryClient();
  const store = storeOpt ?? createTestStore();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    );
  }

  const result = await render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    queryClient,
    store,
  };
}

// Re-export RNTL built-in matchers + helpers (RNTL v14 auto-extends expect)
export * from "@testing-library/react-native";

// Helper to clear SecureStore mock between tests
type SecureStoreMock = {
  __clear?: () => void;
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};

export function clearSecureStoreMock(): void {
  // SecureStore is mocked in test-setup.ts with __clear + jest.fn() methods
  const mocked = SecureStore as unknown as SecureStoreMock;
  mocked.__clear?.();
  mocked.getItemAsync.mockClear();
  mocked.setItemAsync.mockClear();
  mocked.deleteItemAsync.mockClear();
}
