import {
  formatConversationTimestamp,
  formatDateSeparator,
  formatMessageTimestamp,
} from "./datetime";

describe("formatConversationTimestamp", () => {
  test("formats today as hh:mm a", () => {
    // Noon today avoids midnight-boundary flake (isToday stable all day).
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    const result = formatConversationTimestamp(noon);
    expect(result).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
  });

  test("formats yesterday as Yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    expect(formatConversationTimestamp(yesterday)).toBe("Yesterday");
  });

  test("formats older dates as MM/dd/yy", () => {
    expect(formatConversationTimestamp(new Date(2024, 0, 15, 14, 30))).toBe(
      "01/15/24"
    );
  });

  test("formats tomorrow as MM/dd/yy (future falls through to date)", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const expected = `${String(tomorrow.getMonth() + 1).padStart(2, "0")}/${String(
      tomorrow.getDate()
    ).padStart(2, "0")}/${String(tomorrow.getFullYear()).slice(-2)}`;
    expect(formatConversationTimestamp(tomorrow)).toBe(expected);
  });

  test("accepts epoch numbers", () => {
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    expect(formatConversationTimestamp(noon.getTime())).toMatch(
      /^\d{2}:\d{2} (AM|PM)$/
    );
  });

  test("accepts ISO strings", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    expect(formatConversationTimestamp(yesterday.toISOString())).toBe(
      "Yesterday"
    );
  });

  test("returns null for invalid dates", () => {
    expect(formatConversationTimestamp("not-a-date")).toBeNull();
    expect(formatConversationTimestamp(Number.NaN)).toBeNull();
    expect(formatConversationTimestamp(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("formatMessageTimestamp", () => {
  test("formats as hh:mm a", () => {
    expect(formatMessageTimestamp(new Date(2024, 0, 15, 14, 30))).toBe(
      "02:30 PM"
    );
  });

  test("returns null for invalid dates", () => {
    expect(formatMessageTimestamp("bad")).toBeNull();
  });
});

describe("formatDateSeparator", () => {
  test("returns Today for today", () => {
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    expect(formatDateSeparator(noon)).toBe("Today");
  });

  test("returns Yesterday for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    expect(formatDateSeparator(yesterday)).toBe("Yesterday");
  });

  test("returns MM/dd/yy for older dates", () => {
    expect(formatDateSeparator(new Date(2024, 5, 3))).toBe("06/03/24");
  });

  test("returns null for invalid dates", () => {
    expect(formatDateSeparator("nope")).toBeNull();
  });
});
