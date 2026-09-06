import { MESSAGE_MAX_LENGTH, sanitizeMessageInput } from "./sanitize";

describe("sanitizeMessageInput", () => {
  test("returns null for empty string", () => {
    expect(sanitizeMessageInput("")).toBeNull();
  });

  test("returns null for whitespace-only", () => {
    expect(sanitizeMessageInput("   ")).toBeNull();
    expect(sanitizeMessageInput("\n\n\t")).toBeNull();
  });

  test("trims leading and trailing whitespace and newlines", () => {
    expect(sanitizeMessageInput("  hello  ")).toBe("hello");
    expect(sanitizeMessageInput("\nhello\n")).toBe("hello");
  });

  test("collapses horizontal whitespace to a single space", () => {
    expect(sanitizeMessageInput("hello    world")).toBe("hello world");
    expect(sanitizeMessageInput("hello\t\tworld")).toBe("hello world");
  });

  test("preserves newlines between lines", () => {
    expect(sanitizeMessageInput("line1\nline2")).toBe("line1\nline2");
    // Horizontal runs collapse to a single space; newlines stay.
    expect(sanitizeMessageInput("a  \n  b")).toBe("a \n b");
  });

  test("strips C0 control chars except newline and tab", () => {
    expect(sanitizeMessageInput("hello\u0000world")).toBe("helloworld");
    expect(sanitizeMessageInput("a\u0007b\u001Fc")).toBe("abc");
    // \r is stripped so \r\n becomes \n
    expect(sanitizeMessageInput("a\r\nb")).toBe("a\nb");
  });

  test("returns null when only control chars remain after strip", () => {
    expect(sanitizeMessageInput("\u0000\u0001\u0007")).toBeNull();
  });

  test("enforces max length of 2000", () => {
    const long = "a".repeat(MESSAGE_MAX_LENGTH + 50);
    const result = sanitizeMessageInput(long);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(MESSAGE_MAX_LENGTH);
  });

  test("keeps text at exactly max length", () => {
    const exact = "b".repeat(MESSAGE_MAX_LENGTH);
    expect(sanitizeMessageInput(exact)).toBe(exact);
  });
});
