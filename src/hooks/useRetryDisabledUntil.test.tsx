import { act, renderHook } from "@testing-library/react-native";

import type { ApiError } from "@/services/api/client";

import { useRetryDisabledUntil } from "./useRetryDisabledUntil";

function rateLimitError(retryAfter?: string): ApiError {
  return {
    status: 429,
    message: "Too many requests",
    ...(retryAfter !== undefined ? { retryAfter } : {}),
    headers:
      retryAfter !== undefined ? { "retry-after": retryAfter } : undefined,
    raw: undefined,
  };
}

function serverError(): ApiError {
  return {
    status: 500,
    message: "Internal",
    raw: undefined,
  };
}

describe("useRetryDisabledUntil", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("when error is null", () => {
    it("should not disable retry when there is no error", async () => {
      // Arrange
      // Act
      const { result } = await renderHook(() => useRetryDisabledUntil(null));

      // Assert
      expect(result.current).toBe(false);
    });
  });

  describe("when error is non-429", () => {
    it("should not disable retry when status is not rate-limited", async () => {
      // Arrange
      const error = serverError();

      // Act
      const { result } = await renderHook(() => useRetryDisabledUntil(error));

      // Assert
      expect(result.current).toBe(false);
    });
  });

  describe("when error is 429", () => {
    it("should disable retry immediately when status is 429", async () => {
      // Arrange
      const error = rateLimitError("2");

      // Act
      const { result } = await renderHook(() => useRetryDisabledUntil(error));

      // Assert
      expect(result.current).toBe(true);
    });

    it("should stay disabled at 1s and unlock after 2s when retryAfter is 2", async () => {
      // Arrange
      const error = rateLimitError("2");
      const { result } = await renderHook(() => useRetryDisabledUntil(error));

      // Act
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });

      // Assert
      expect(result.current).toBe(true);

      // Act
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });

      // Assert
      expect(result.current).toBe(false);
    });

    it("should unlock at the 1s floor when retryAfter is missing", async () => {
      // Arrange
      const error = rateLimitError();
      const { result } = await renderHook(() => useRetryDisabledUntil(error));

      // Act
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });

      // Assert
      expect(result.current).toBe(false);
    });
  });

  describe("when error identity changes", () => {
    it("should unlock without waiting when a new non-429 error replaces 429", async () => {
      // Arrange
      const limited = rateLimitError("60");
      const { result, rerender } = await renderHook(
        ({ error }: { error: ApiError | null }) => useRetryDisabledUntil(error),
        { initialProps: { error: limited } }
      );
      expect(result.current).toBe(true);

      // Act
      await rerender({ error: serverError() });

      // Assert
      expect(result.current).toBe(false);
    });
  });
});
