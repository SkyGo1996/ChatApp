import {
  parsePersistedThemeMode,
  sanitizeBlockedState,
  sanitizeThemeState,
} from "./persist-recovery";

describe("sanitizeThemeState", () => {
  test("returns system for null / non-object", () => {
    expect(sanitizeThemeState(null)).toEqual({ mode: "system" });
    expect(sanitizeThemeState(undefined)).toEqual({ mode: "system" });
    expect(sanitizeThemeState("light")).toEqual({ mode: "system" });
    expect(sanitizeThemeState(42)).toEqual({ mode: "system" });
  });

  test("keeps valid modes", () => {
    expect(sanitizeThemeState({ mode: "light" })).toEqual({ mode: "light" });
    expect(sanitizeThemeState({ mode: "dark" })).toEqual({ mode: "dark" });
    expect(sanitizeThemeState({ mode: "system" })).toEqual({ mode: "system" });
  });

  test("invalid mode → system", () => {
    expect(sanitizeThemeState({ mode: "sepia" })).toEqual({ mode: "system" });
    expect(sanitizeThemeState({ mode: null })).toEqual({ mode: "system" });
  });

  test("strips unknown keys", () => {
    expect(
      sanitizeThemeState({ mode: "dark", extra: true, nested: { a: 1 } })
    ).toEqual({ mode: "dark" });
  });
});

describe("sanitizeBlockedState", () => {
  test("returns empty map for null / non-object", () => {
    expect(sanitizeBlockedState(null)).toEqual({ blockedIds: {} });
    expect(sanitizeBlockedState(undefined)).toEqual({ blockedIds: {} });
    expect(sanitizeBlockedState([])).toEqual({ blockedIds: {} });
  });

  test("keeps only true entries", () => {
    expect(
      sanitizeBlockedState({
        blockedIds: { "1": true, "2": false, "3": "yes", "4": true },
        extra: 1,
      })
    ).toEqual({ blockedIds: { "1": true, "4": true } });
  });

  test("non-object blockedIds → empty", () => {
    expect(sanitizeBlockedState({ blockedIds: null })).toEqual({
      blockedIds: {},
    });
    expect(sanitizeBlockedState({ blockedIds: ["1"] })).toEqual({
      blockedIds: {},
    });
  });

  test("persist-shaped input with _persist + unknown keys strips extras", () => {
    expect(
      sanitizeBlockedState({
        blockedIds: { "10": true, "11": false },
        _persist: { version: 1, rehydrated: true },
        leaked: "nope",
      })
    ).toEqual({ blockedIds: { "10": true } });
  });
});

describe("parsePersistedThemeMode", () => {
  test("null / empty → system", () => {
    expect(parsePersistedThemeMode(null)).toBe("system");
    expect(parsePersistedThemeMode("")).toBe("system");
  });

  test("corrupt JSON → system", () => {
    expect(parsePersistedThemeMode("{not-json")).toBe("system");
    expect(parsePersistedThemeMode("null")).toBe("system");
  });

  test("persistoid nested mode (JSON-stringified)", () => {
    expect(
      parsePersistedThemeMode(
        JSON.stringify({ mode: JSON.stringify("light"), _persist: "{}" })
      )
    ).toBe("light");
    expect(
      parsePersistedThemeMode(JSON.stringify({ mode: JSON.stringify("dark") }))
    ).toBe("dark");
    expect(
      parsePersistedThemeMode(
        JSON.stringify({ mode: JSON.stringify("system") })
      )
    ).toBe("system");
  });

  test("bare mode string still accepted", () => {
    expect(parsePersistedThemeMode(JSON.stringify({ mode: "dark" }))).toBe(
      "dark"
    );
  });

  test("invalid nested mode → system", () => {
    expect(
      parsePersistedThemeMode(JSON.stringify({ mode: JSON.stringify("neon") }))
    ).toBe("system");
  });
});
