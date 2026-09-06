// Setup for jest: worklets mock must come before reanimated setUpTests()
// Per https://docs.swmansion.com/react-native-worklets/docs/guides/testing
// and https://docs.swmansion.com/react-native-reanimated/docs/guides/testing

// 1. Worklets mock - must be before reanimated import

// 3. Safe area context mock

import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";

// jest.mock factories must use `require` (hoisted, out-of-scope `import` is forbidden).
// `no-require-imports` is disabled via eslint.config.js for this file; keep
// `no-unsafe-return` narrowly suppressed — factory returns untyped third-party mock.
/* eslint-disable @typescript-eslint/no-unsafe-return */
jest.mock("react-native-worklets", () =>
  require("react-native-worklets/src/mock")
);
/* eslint-enable @typescript-eslint/no-unsafe-return */

// 2. Reanimated mock setup — typed to avoid no-unsafe-call / no-unsafe-member-access
const { setUpTests } = require("react-native-reanimated") as {
  setUpTests: () => void;
};
setUpTests();

jest.mock("react-native-safe-area-context", () => mockSafeAreaContext);

// 4. Keyboard controller mock
/* eslint-disable @typescript-eslint/no-unsafe-return */
jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest")
);
/* eslint-enable @typescript-eslint/no-unsafe-return */

// 5. Expo Crypto mock (for persist.ts MMKV encryptionKey + local Message ids)
jest.mock("expo-crypto", () => {
  let uuidSeq = 0;
  return {
    getRandomBytes: jest.fn((byteCount: number) => {
      const arr = new Uint8Array(byteCount);
      for (let i = 0; i < byteCount; i++) arr[i] = (i * 17 + 3) % 256;
      return arr;
    }),
    getRandomBytesAsync: jest.fn((byteCount: number) => {
      const arr = new Uint8Array(byteCount);
      for (let i = 0; i < byteCount; i++) arr[i] = (i * 17 + 3) % 256;
      return Promise.resolve(arr);
    }),
    randomUUID: jest.fn(() => {
      uuidSeq += 1;
      return `00000000-0000-4000-8000-${String(uuidSeq).padStart(12, "0")}`;
    }),
  };
});

// 5b. Expo SecureStore in-memory mock (for persist.ts)
// jest-expo auto-mocks expo-secure-store, but we provide deterministic in-memory impl
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
    getItemAsync: jest.fn((key: string) =>
      Promise.resolve(store.get(key) ?? null)
    ),
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    // expose for test cleanup
    __store: store,
    __clear: () => store.clear(),
  };
});

// 5c. react-native-mmkv in-memory mock (v4 createMMKV API)
jest.mock("react-native-mmkv", () => {
  const instances = new Map<string, Map<string, string>>();
  function createMMKV(config?: { id?: string; encryptionKey?: string }) {
    const id = config?.id ?? "mmkv.default";
    if (!instances.has(id)) instances.set(id, new Map());
    const map = instances.get(id)!;
    return {
      getString: (key: string) => map.get(key),
      set: (key: string, value: string | number | boolean) => {
        map.set(key, String(value));
      },
      remove: (key: string) => {
        map.delete(key);
      },
      clearAll: () => {
        map.clear();
      },
      contains: (key: string) => map.has(key),
      getAllKeys: () => Array.from(map.keys()),
    };
  }
  return {
    createMMKV,
    __instances: instances,
    __clearAll: () => instances.clear(),
  };
});

// 6. Expo Router mocks (auto-mocked via jest-expo, but ensure gesture-handler/reanimated deps)
// Import expo-router testing-library mocks for integration helpers
// This augments jest-expo's linking + gesture mocks — optional, best-effort.
try {
  require("expo-router/testing-library/mocks");
} catch (e: unknown) {
  // MODULE_NOT_FOUND is expected on expo-router versions without this path
  // (jest-expo already provides linking mocks). Only warn on unexpected errors.
  const msg = e instanceof Error ? e.message : String(e);
  if (!msg.includes("Cannot find module") && __DEV__) {
    console.warn("[test-setup] expo-router mocks failed", e);
  }
}

// 7. sonner-native mock — JS-only toast, no native module
jest.mock("sonner-native", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}));

// 8. react-native-svg mock (sonner-native peer — avoid native SVG in jest)
jest.mock("react-native-svg", () => {
  const React = require("react") as typeof import("react");
  const Svg = (props: unknown) =>
    React.createElement("Svg", props as Record<string, unknown>);
  return {
    __esModule: true,
    default: Svg,
    Svg,
    Path: (props: unknown) =>
      React.createElement("Path", props as Record<string, unknown>),
    Circle: (props: unknown) =>
      React.createElement("Circle", props as Record<string, unknown>),
    Rect: (props: unknown) =>
      React.createElement("Rect", props as Record<string, unknown>),
    G: (props: unknown) =>
      React.createElement("G", props as Record<string, unknown>),
  };
});

// 9. expo-haptics mock — no native Taptic/Vibrator in Jest
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
    Rigid: "rigid",
    Soft: "soft",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

// 9b. lucide-react-native — ESM package; stub icons as simple View/Text hosts
jest.mock("lucide-react-native", () => {
  const React = require("react") as typeof import("react");
  const { View } = require("react-native") as typeof import("react-native");
  const Icon = (props: Record<string, unknown>) =>
    React.createElement(View, { ...props, testID: "lucide-icon" });
  return new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop === "__esModule") return true;
        return Icon;
      },
    }
  );
});

// 10. FlashList → FlatList for Jest (v2 recycling not needed in unit tests)
jest.mock("@shopify/flash-list", () => {
  const { FlatList } = require("react-native") as typeof import("react-native");
  return {
    FlashList: FlatList,
  };
});

// 11. expo-image — no native image pipeline in Jest
jest.mock("expo-image", () => {
  const React = require("react") as typeof import("react");
  const { View } = require("react-native") as typeof import("react-native");
  const Image = (props: {
    testID?: string;
    accessibilityLabel?: string;
    [key: string]: unknown;
  }) =>
    React.createElement(View, {
      testID: props.testID ?? "expo-image",
      accessibilityLabel: props.accessibilityLabel,
    });
  return { Image };
});

// 12. expo-glass-effect — no native Liquid Glass in Jest
jest.mock("expo-glass-effect", () => {
  const React = require("react") as typeof import("react");
  const { View } = require("react-native") as typeof import("react-native");
  const GlassView = (props: Record<string, unknown>) =>
    React.createElement(View, { ...props, testID: "glass-view" });
  return {
    GlassView,
    GlassContainer: GlassView,
    isLiquidGlassAvailable: () => false,
    isGlassEffectAPIAvailable: () => false,
  };
});

// 13. expo-blur — no native blur in Jest
jest.mock("expo-blur", () => {
  const React = require("react") as typeof import("react");
  const { View } = require("react-native") as typeof import("react-native");
  const BlurView = (props: Record<string, unknown>) =>
    React.createElement(View, { ...props, testID: "blur-view" });
  return { BlurView };
});

// 13b. expo-constants — ensure version is defined in Jest (app.json 1.0.0 fallback)
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { version: "1.0.0" },
    manifest: { version: "1.0.0" },
  },
  expoConfig: { version: "1.0.0" },
}));

// 13c. @expo/ui community segmented-control — Pressable mock with radio semantics
jest.mock("@expo/ui/community/segmented-control", () => {
  const React = require("react") as typeof import("react");
  const {
    View,
    Pressable,
    Text: RNText,
  } = require("react-native") as typeof import("react-native");
  function SegmentedControl({
    values = [],
    selectedIndex = 0,
    onValueChange,
    onChange,
    testID,
  }: {
    values?: string[];
    selectedIndex?: number;
    onValueChange?: (v: string) => void;
    onChange?: (e: {
      nativeEvent: { selectedSegmentIndex: number; value: string };
    }) => void;
    testID?: string;
  }) {
    return React.createElement(
      View,
      {
        testID: testID ?? "segmented-control",
        accessibilityRole: "radiogroup" as const,
      },
      (values ?? []).map((v: string, i: number) =>
        React.createElement(
          Pressable,
          {
            key: v,
            testID: `segment-${v}`,
            accessibilityRole: "radio" as const,
            accessibilityState: { selected: i === selectedIndex },
            onPress: () => {
              onValueChange?.(v);
              onChange?.({
                nativeEvent: { selectedSegmentIndex: i, value: v },
              });
            },
          },
          React.createElement(RNText, null, v)
        )
      )
    );
  }
  return { SegmentedControl, __esModule: true, default: SegmentedControl };
});

// 14. @expo/ui — native SwiftUI / Jetpack Compose hosts not available in Jest
jest.mock("@expo/ui/swift-ui", () => {
  const React = require("react") as typeof import("react");
  const {
    View,
    Pressable,
    Text: RNText,
  } = require("react-native") as typeof import("react-native");
  type MockAlertProps = {
    title: string;
    isPresented?: boolean;
    children?: React.ReactNode;
  };
  function MockAlert({ title, isPresented, children }: MockAlertProps) {
    if (!isPresented) return null;
    return React.createElement(
      View,
      { testID: "expo-alert", accessibilityLabel: title },
      children
    );
  }

  MockAlert.Trigger = function Trigger({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  MockAlert.Actions = function Actions({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  MockAlert.Message = function Message({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  const MockButton = ({
    label,
    onPress,
  }: {
    label: string;
    onPress?: () => void;
    role?: string;
  }) =>
    React.createElement(
      Pressable,
      {
        onPress,
        accessibilityRole: "button",
        accessibilityLabel: label,
        testID: `expo-button-${label}`,
      },
      React.createElement(RNText, null, label)
    );
  const MockText = ({ children }: { children: React.ReactNode }) =>
    React.createElement(RNText, null, children);
  const MockHost = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);
  return {
    Host: MockHost,
    Alert: MockAlert,
    Button: MockButton,
    Text: MockText,
  };
});

jest.mock("@expo/ui/jetpack-compose", () => {
  const React = require("react") as typeof import("react");
  const {
    View,
    Pressable,
    Text: RNText,
  } = require("react-native") as typeof import("react-native");
  type MockDialogProps = {
    children?: React.ReactNode;
    onDismissRequest?: () => void;
  };
  function MockAlertDialog({ children }: MockDialogProps) {
    return React.createElement(View, { testID: "expo-alert-dialog" }, children);
  }
  MockAlertDialog.Title = function Title({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  MockAlertDialog.Text = function TextSlot({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  MockAlertDialog.ConfirmButton = function ConfirmButton({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  MockAlertDialog.DismissButton = function DismissButton({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  MockAlertDialog.Icon = function Icon({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  const MockTextButton = ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) =>
    React.createElement(
      Pressable,
      {
        onPress: onClick,
        accessibilityRole: "button",
        testID: "expo-text-button",
      },
      children
    );
  const MockButton = ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) =>
    React.createElement(
      Pressable,
      {
        onPress: onClick,
        accessibilityRole: "button",
        testID: "expo-compose-button",
      },
      children
    );
  const MockText = ({ children }: { children: React.ReactNode }) =>
    React.createElement(RNText, null, children);
  const MockIcon = () => React.createElement(View, { testID: "expo-icon" });
  const MockHost = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);
  return {
    Host: MockHost,
    AlertDialog: MockAlertDialog,
    TextButton: MockTextButton,
    Button: MockButton,
    Text: MockText,
    Icon: MockIcon,
  };
});

// RNTL v14 built-in matchers: no need for @testing-library/jest-native/extend-expect
// Importing from @testing-library/react-native auto-extends expect.
// Keep explicit import for coverage if pure import is avoided in some tests.

// @testing-library/react-native/pure does NOT auto-extend, but main entry does.
// We intentionally do not import extend-expect here (deprecated path).
