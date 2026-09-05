import * as fs from "node:fs";
import * as path from "node:path";

const appJsonRaw = fs.readFileSync(
  path.join(__dirname, "..", "app.json"),
  "utf8"
);
const appJson = JSON.parse(appJsonRaw) as {
  expo: {
    name?: string;
    slug?: string;
    scheme?: string;
    scheme2?: string;
    userInterfaceStyle?: string;
    ios?: Record<string, unknown>;
    android?: Record<string, unknown>;
    plugins?: unknown[];
    experiments?: Record<string, unknown>;
    updates?: unknown;
    extra?: unknown;
    androidStatusBar?: unknown;
  };
};
const pkgRaw = fs.readFileSync(
  path.join(__dirname, "..", "package.json"),
  "utf8"
);
const pkg = JSON.parse(pkgRaw) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

describe("app shell config non-regression", () => {
  test("userInterfaceStyle is automatic", () => {
    expect(appJson.expo.userInterfaceStyle).toBe("automatic");
  });

  test("linking scheme is chatapp", () => {
    expect(appJson.expo.scheme).toBe("chatapp");
  });

  test("minimal plugins — expo-router + splash + secure-store only, no OTA/updates", () => {
    const plugins = appJson.expo.plugins ?? [];
    // plugins may be strings or [name, config] tuples
    const names = plugins.map((p) =>
      Array.isArray(p) ? String(p[0]) : String(p)
    );
    expect(names).toEqual(
      expect.arrayContaining([
        "expo-router",
        "expo-splash-screen",
        "expo-secure-store",
      ])
    );
    expect(names).not.toEqual(expect.arrayContaining(["expo-updates"]));
    expect(appJson.expo.updates).toBeUndefined();
  });

  test("android permissions minimal — no permissions array", () => {
    const android = appJson.expo.android as
      { permissions?: unknown } | undefined;
    expect(android?.permissions).toBeUndefined();
  });

  test("ios minimal — bundleIdentifier set, no NSPrivacyAccessedAPITypes/Tracking in app.json", () => {
    const ios = appJson.expo.ios as
      | { bundleIdentifier?: string; infoPlist?: Record<string, unknown> }
      | undefined;
    expect(ios?.bundleIdentifier).toBeTruthy();
    expect(ios?.infoPlist?.["NSPrivacyAccessedAPITypes"]).toBeUndefined();
    expect(ios?.infoPlist?.["NSUserTrackingUsageDescription"]).toBeUndefined();
  });

  test("single prod env wiring — no EXPO_PUBLIC_API_URL in app.json extra, no expo-updates, no eas.json", () => {
    expect(appJson.expo.extra).toBeUndefined();
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps["expo-updates"]).toBeUndefined();
    expect(fs.existsSync(path.join(__dirname, "..", "eas.json"))).toBe(false);
    // single prod baseURL lives in src/services/api/client.ts per techstack §9 — multi-env not yet wired
    expect(process.env["EXPO_PUBLIC_API_URL"]).toBeUndefined();
  });

  test("linking scheme maps to expected paths (chatapp://)", () => {
    expect(appJson.expo.scheme).toBe("chatapp");
    // experiments keep typedRoutes for file-based linking
    expect(appJson.expo.experiments?.["typedRoutes"]).toBe(true);
  });

  test("no web universal links / intentFilters / associatedDomains leaked in", () => {
    const raw = appJsonRaw;
    expect(raw).not.toMatch(/intentFilters/);
    expect(raw).not.toMatch(/associatedDomains/);
    expect(raw).not.toMatch(/associatedBundleIdentifiers/);
  });
});
