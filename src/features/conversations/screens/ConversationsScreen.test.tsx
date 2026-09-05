import { QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { type ReactNode } from "react";
import type { TestInstance } from "test-renderer";

import { API_BASE_URL } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { useNodeHttpAdapterForMsw } from "@/test-msw";
import { createTestQueryClient } from "@/test-utils";

import { makeUser } from "@/features/conversations/test-fixtures";

import ConversationsScreen from "./ConversationsScreen";

const usersUrl = `${API_BASE_URL}${endpoints.conversations.list}`;

type Mode = "ok" | "fail500" | "next429";

let mode: Mode = "ok";
/** After the first successful page-0 response, subsequent page-0 calls may fail. */
let page0Loads = 0;

const server = setupServer(
  http.get(usersUrl, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    if (mode === "fail500" && offset === 0 && page0Loads > 0) {
      return HttpResponse.json({ error: "Internal" }, { status: 500 });
    }

    if (mode === "next429" && offset > 0) {
      return HttpResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "retry-after": "60", "x-ratelimit-remaining": "0" },
        }
      );
    }

    if (offset === 0) page0Loads += 1;

    const results = Array.from(
      { length: Math.min(limit, 40 - offset) },
      (_, i) => makeUser(offset + i + 1)
    );
    return HttpResponse.json({
      total: 40,
      limit,
      offset,
      results,
    });
  })
);

beforeAll(() => {
  useNodeHttpAdapterForMsw();
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => {
  mode = "ok";
  page0Loads = 0;
  server.resetHandlers();
});
afterAll(() => server.close());

function wrapperFor(client: ReturnType<typeof createTestQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("ConversationsScreen", () => {
  test("shows full-page ErrorRetry when initial load fails with empty list", async () => {
    server.use(
      http.get(usersUrl, () =>
        HttpResponse.json({ error: "Internal" }, { status: 500 })
      )
    );
    const qc = createTestQueryClient();
    await render(<ConversationsScreen />, { wrapper: wrapperFor(qc) });

    expect(await screen.findByLabelText("Retry conversations")).toBeTruthy();
    expect(screen.getByText("Something went wrong.")).toBeTruthy();
  });

  test("surfaces refresh error above list when rows already exist", async () => {
    const qc = createTestQueryClient();
    await render(<ConversationsScreen />, { wrapper: wrapperFor(qc) });

    expect(await screen.findByText("User 1")).toBeTruthy();

    mode = "fail500";
    const list = screen.getByTestId("conversations-list");
    const refreshControl = list.children.find(
      (child): child is TestInstance =>
        typeof child !== "string" && child.type === "RCTRefreshControl"
    );
    if (!refreshControl) {
      throw new Error("Expected RCTRefreshControl under conversations-list");
    }
    await fireEvent(refreshControl, "refresh");

    await waitFor(() => {
      expect(screen.getByText("Something went wrong.")).toBeTruthy();
    });
    expect(screen.getByText("User 1")).toBeTruthy();
    expect(screen.getByLabelText("Retry conversations")).toBeTruthy();
  });

  test("surfaces fetchNextPage 429 in footer and disables retry", async () => {
    const qc = createTestQueryClient();
    await render(<ConversationsScreen />, { wrapper: wrapperFor(qc) });

    expect(await screen.findByText("User 1")).toBeTruthy();

    mode = "next429";
    await fireEvent(screen.getByTestId("conversations-list"), "onEndReached");

    await waitFor(() => {
      expect(screen.getByText("Too many requests — try again")).toBeTruthy();
    });

    const retry = screen.getByLabelText("Retry conversations");
    expect(retry).toBeDisabled();
    await fireEvent.press(retry);
    expect(retry).toBeDisabled();
    expect(screen.getByText("User 1")).toBeTruthy();
  });

  test("shows centered empty copy when collection is empty", async () => {
    server.use(
      http.get(usersUrl, () =>
        HttpResponse.json({
          total: 0,
          limit: 20,
          offset: 0,
          results: [],
        })
      )
    );
    const qc = createTestQueryClient();
    await render(<ConversationsScreen />, { wrapper: wrapperFor(qc) });

    expect(await screen.findByText("No conversations")).toBeTruthy();
    expect(
      screen.getByText(
        "When you start chatting, conversations will show up here."
      )
    ).toBeTruthy();
  });
});
