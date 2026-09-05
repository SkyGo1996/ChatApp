import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { type ReactNode } from "react";

import { API_BASE_URL } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { useNodeHttpAdapterForMsw } from "@/test-msw";
import { createTestQueryClient } from "@/test-utils";

import { CONVERSATIONS_PAGE_SIZE } from "@/features/conversations/api/fetchConversationsPage";

import { useConversations } from "./useConversations";

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

const offsets: number[] = [];

const server = setupServer(
  http.get(usersUrl, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    offsets.push(offset);
    const results = Array.from(
      { length: Math.min(limit, 60 - offset) },
      (_, i) => makeUser(offset + i + 1)
    );
    return HttpResponse.json({
      total: 60,
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
  offsets.length = 0;
  server.resetHandlers();
});
afterAll(() => server.close());

function wrapperFor(clientInstance: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={clientInstance}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useConversations", () => {
  test("loads first page of 20 and flattens items", async () => {
    const qc = createTestQueryClient();
    const { result } = await renderHook(() => useConversations(), {
      wrapper: wrapperFor(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items).toHaveLength(CONVERSATIONS_PAGE_SIZE);
    expect(result.current.items[0]?.name).toBe("User 1");
    expect(offsets[0]).toBe(0);
  });

  test("fetchNextPage requests next offset", async () => {
    const qc = createTestQueryClient();
    const { result } = await renderHook(() => useConversations(), {
      wrapper: wrapperFor(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.items.length).toBe(40));
    expect(offsets).toEqual([0, 20]);
  });

  test("empty collection yields empty items", async () => {
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
    const { result } = await renderHook(() => useConversations(), {
      wrapper: wrapperFor(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items).toEqual([]);
  });
});
