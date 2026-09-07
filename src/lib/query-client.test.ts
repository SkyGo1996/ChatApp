import { toast } from "sonner-native";

import type { ApiError } from "@/services/api/client";

import { createQueryClient } from "./query-client";

function rateLimitError(retryAfter = "1"): ApiError {
  return {
    status: 429,
    message: "Too many requests",
    retryAfter,
    headers: { "retry-after": retryAfter },
    raw: undefined,
  };
}

/** Mirrors axios interceptor: ApiError is the app contract, not Error. */
function rejectApiError(error: ApiError): Promise<never> {
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  return Promise.reject(error);
}

describe("createQueryClient", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("when a GET recovers after one 429", () => {
    it("should not toast when the retry succeeds", async () => {
      // Arrange
      const qc = createQueryClient();
      let attempts = 0;

      // Act
      const resultPromise = qc.fetchQuery({
        queryKey: ["rate-limit-recover"],
        queryFn: () => {
          attempts += 1;
          if (attempts === 1) return rejectApiError(rateLimitError("1"));
          return Promise.resolve("ok");
        },
      });
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      // Assert
      expect(result).toBe("ok");
      expect(attempts).toBe(2);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe("when a GET stays rate-limited after retry", () => {
    it("should toast once when both attempts return 429", async () => {
      // Arrange
      const qc = createQueryClient();
      let attempts = 0;
      const resultPromise = qc.fetchQuery({
        queryKey: ["rate-limit-fail"],
        queryFn: () => {
          attempts += 1;
          return rejectApiError(rateLimitError("1"));
        },
      });
      const settled = expect(resultPromise).rejects.toMatchObject({
        status: 429,
      });

      // Act
      await jest.runAllTimersAsync();
      await settled;

      // Assert
      expect(attempts).toBe(2);
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(
        "Too many requests — try again",
        { description: "Retry after 1s" }
      );
    });
  });

  describe("when a mutation returns 429", () => {
    it("should toast once with retry 0", async () => {
      // Arrange
      const qc = createQueryClient();
      const mutation = qc.getMutationCache().build(qc, {
        mutationFn: () => rejectApiError(rateLimitError("5")),
      });

      // Act
      await expect(mutation.execute({})).rejects.toMatchObject({
        status: 429,
      });

      // Assert
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(
        "Too many requests — try again",
        { description: "Retry after 5s" }
      );
    });
  });
});
