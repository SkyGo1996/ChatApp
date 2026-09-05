import { toast } from "sonner-native";

import { handleRateLimit } from "./rate-limit";

describe("handleRateLimit", () => {
  beforeEach(() => jest.clearAllMocks());

  test("429 surfaces error toast with retry-after", () => {
    handleRateLimit({
      status: 429,
      retryAfter: "5",
      headers: { "retry-after": "5" },
    });
    expect(toast.error).toHaveBeenCalledWith("Too many requests — try again", {
      description: "Retry after 5s",
    });
    expect(toast.warning).not.toHaveBeenCalled();
  });

  test("429 without retryAfter still toasts", () => {
    handleRateLimit({ status: 429 });
    expect(toast.error).toHaveBeenCalledWith(
      "Too many requests — try again",
      undefined
    );
  });

  test("x-ratelimit-remaining <10 warns", () => {
    const warn = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    handleRateLimit({ headers: { "x-ratelimit-remaining": "9" } });
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining("9 remaining")
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test("x-ratelimit-remaining >=10 no toast", () => {
    handleRateLimit({ headers: { "x-ratelimit-remaining": "15" } });
    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  test("normal success no toast", () => {
    handleRateLimit({ status: 200, headers: {} });
    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
