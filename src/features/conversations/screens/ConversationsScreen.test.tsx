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

import { API_BASE_URL } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { useNodeHttpAdapterForMsw } from "@/test-msw";
import { createTestQueryClient } from "@/test-utils";

import ConversationsScreen from "./ConversationsScreen";

const usersUrl = `${API_BASE_URL}${endpoints.conversations.list}`;

function makeUser(id: number) {
  return {
    id,
    name: `User ${id}`,
    username: `user${id}`,
    email: `user${id}@example.com`,
    avatar: `https://i.pravatar.cc/150?img=${id}`,
    phone: "+1-555-0100",
    website: "https://example.com",
    address: { street: "1 St", city: "Town", zipcode: "00000" },
  };
}

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
    await qc.refetchQueries({ queryKey: ["conversations"] });

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
    fireEvent(screen.getByTestId("conversations-list"), "onEndReached");

    await waitFor(() => {
      expect(screen.getByText("Too many requests — try again")).toBeTruthy();
    });

    const retry = screen.getByLabelText("Retry conversations");
    expect(retry.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(retry);
    expect(retry.props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByText("User 1")).toBeTruthy();
  });
});
