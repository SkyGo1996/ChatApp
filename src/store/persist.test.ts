import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import {
  __resetBlockedMMKVForTests,
  blockedStorage,
  bytesToAsciiKey,
  getRawBlockedMMKV,
  getRawThemeMMKV,
  initBlockedStorage,
  isValidAes256Key,
  MMKV_AES256_KEY_BYTES,
  MMKV_KEY_SECURE_STORE,
  themeStorage,
} from "./persist";

type MMKVMock = {
  createMMKV: jest.Mock;
  __clearAll?: () => void;
  __instances?: Map<string, Map<string, string>>;
};

function getMMKVMock(): MMKVMock {
  return jest.requireMock("react-native-mmkv") as unknown as MMKVMock;
}

type SecureStoreMock = typeof SecureStore & {
  __clear: () => void;
  __store: Map<string, string>;
  isAvailableAsync: jest.Mock;
};

const secureStoreMock = SecureStore as SecureStoreMock;

/** Deterministic 32-char ASCII key matching the mock Crypto.getRandomBytes output. */
function expectedAsciiKeyFromMock(): string {
  const bytes = new Uint8Array(MMKV_AES256_KEY_BYTES);
  for (let i = 0; i < MMKV_AES256_KEY_BYTES; i++) {
    bytes[i] = (i * 17 + 3) % 256;
  }
  return bytesToAsciiKey(bytes);
}

const VALID_32_KEY = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345"; // exactly 32 ASCII

describe("bytesToAsciiKey / isValidAes256Key", () => {
  test("maps 32 bytes to exactly 32 ASCII chars", () => {
    const bytes = Crypto.getRandomBytes(32);
    const key = bytesToAsciiKey(bytes);
    expect(key).toHaveLength(32);
    expect(isValidAes256Key(key)).toBe(true);
  });

  test("rejects wrong length and non-ASCII", () => {
    expect(isValidAes256Key("short")).toBe(false);
    expect(isValidAes256Key("a".repeat(64))).toBe(false);
    expect(isValidAes256Key("é".repeat(32))).toBe(false);
    expect(isValidAes256Key(VALID_32_KEY)).toBe(true);
  });
});

describe("initBlockedStorage", () => {
  beforeEach(() => {
    secureStoreMock.__clear();
    jest.clearAllMocks();
    getMMKVMock().__clearAll?.();
    __resetBlockedMMKVForTests();
    secureStoreMock.isAvailableAsync.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("generates 32-char ASCII key via Crypto.getRandomBytes when SecureStore is empty", async () => {
    const mathSpy = jest.spyOn(Math, "random");

    await initBlockedStorage();

    expect(Crypto.getRandomBytes).toHaveBeenCalledWith(32);
    expect(mathSpy).not.toHaveBeenCalled();

    const expected = expectedAsciiKeyFromMock();
    const stored = await SecureStore.getItemAsync(MMKV_KEY_SECURE_STORE);
    expect(stored).toBe(expected);
    expect(stored).toHaveLength(32);
    expect(isValidAes256Key(stored!)).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      MMKV_KEY_SECURE_STORE,
      expected
    );

    mathSpy.mockRestore();
  });

  test("wires encryptionKey + AES-256 into encrypted MMKV instance", async () => {
    const mmkvMock = getMMKVMock();
    const createSpy = jest.spyOn(mmkvMock, "createMMKV");

    await initBlockedStorage();

    const stored = await SecureStore.getItemAsync(MMKV_KEY_SECURE_STORE);
    expect(createSpy).toHaveBeenCalledWith({
      id: "blocked-mmkv-enc",
      encryptionKey: stored,
      encryptionType: "AES-256",
    });
  });

  test("reuses existing valid SecureStore key without regenerating", async () => {
    await SecureStore.setItemAsync(MMKV_KEY_SECURE_STORE, VALID_32_KEY);
    jest.clearAllMocks();
    secureStoreMock.isAvailableAsync.mockResolvedValue(true);

    await initBlockedStorage();

    expect(Crypto.getRandomBytes).not.toHaveBeenCalled();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(await SecureStore.getItemAsync(MMKV_KEY_SECURE_STORE)).toBe(
      VALID_32_KEY
    );
  });

  test("regenerates invalid legacy 64-char hex key", async () => {
    const legacyHex = "a".repeat(64);
    await SecureStore.setItemAsync(MMKV_KEY_SECURE_STORE, legacyHex);
    jest.clearAllMocks();
    secureStoreMock.isAvailableAsync.mockResolvedValue(true);

    await initBlockedStorage();

    expect(Crypto.getRandomBytes).toHaveBeenCalledWith(32);
    const stored = await SecureStore.getItemAsync(MMKV_KEY_SECURE_STORE);
    expect(stored).not.toBe(legacyHex);
    expect(isValidAes256Key(stored!)).toBe(true);
  });

  test("falls back to plain MMKV when SecureStore is unavailable", async () => {
    secureStoreMock.isAvailableAsync.mockResolvedValue(false);
    const createSpy = jest.spyOn(getMMKVMock(), "createMMKV");

    await initBlockedStorage();

    expect(createSpy).toHaveBeenCalledWith({ id: "blocked-mmkv" });
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  });

  test("falls back to plain MMKV when encryption is unsupported", async () => {
    const mmkvMock = getMMKVMock();
    const createSpy = jest.spyOn(mmkvMock, "createMMKV");
    createSpy.mockImplementationOnce(() => {
      throw new Error("encryption not supported");
    });

    await initBlockedStorage();

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "blocked-mmkv-enc",
        encryptionType: "AES-256",
      })
    );
    expect(createSpy).toHaveBeenCalledWith({ id: "blocked-mmkv" });
  });

  test("falls back to plain MMKV when SecureStore throws", async () => {
    secureStoreMock.isAvailableAsync.mockRejectedValueOnce(
      new Error("secure store unavailable")
    );
    const createSpy = jest.spyOn(getMMKVMock(), "createMMKV");

    await expect(initBlockedStorage()).resolves.toBeUndefined();

    expect(createSpy).toHaveBeenCalledWith({ id: "blocked-mmkv" });
  });
});

describe("MMKV storage adapter corruption recovery", () => {
  beforeEach(() => {
    getMMKVMock().__clearAll?.();
    __resetBlockedMMKVForTests();
  });

  test("clears corrupt theme JSON and resolves null", async () => {
    const raw = getRawThemeMMKV();
    raw.set("persist:theme", "{not-json");

    await expect(themeStorage.getItem("persist:theme")).resolves.toBeNull();
    expect(raw.getString("persist:theme")).toBeUndefined();
  });

  test("clears corrupt blocked JSON and resolves null (Contact → unblocked)", async () => {
    await initBlockedStorage();
    const raw = getRawBlockedMMKV();
    raw.set("persist:blocked", "{not-json");

    await expect(blockedStorage.getItem("persist:blocked")).resolves.toBeNull();
    expect(raw.getString("persist:blocked")).toBeUndefined();
  });

  test("returns null (not throw) when underlying MMKV throws", async () => {
    const raw = getRawThemeMMKV();
    const getStringSpy = jest.spyOn(raw, "getString").mockImplementation(() => {
      throw new Error("mmkv read failed");
    });

    await expect(blockedStorage.getItem("persist:blocked")).resolves.toBeNull();

    getStringSpy.mockRestore();
  });
});
