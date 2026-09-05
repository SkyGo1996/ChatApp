import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { type ReactNode } from "react";

import { mswMessagesCollectionUrl, useNodeHttpAdapterForMsw } from "@/test-msw";
import { createTestQueryClient } from "@/test-utils";

import { MESSAGES_PAGE_SIZE } from "@/features/chat/api/fetchMessagesPage";
import { makePost } from "@/features/chat/test-fixtures";

import { useMessages } from "./useMessages";

const contactId = 5;
const postsPath = mswMessagesCollectionUrl();
const offsets: number[] = [];

const TOTAL = 45;

const server = setupServer(
  http.get(postsPath, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    offsets.push(offset);
    const results = Array.from(
      { length: Math.min(limit, TOTAL - offset) },
      (_, i) =>
        makePost(offset + i + 1, {
          userId: contactId,
          body: `Body ${offset + i + 1}`,
        })
    );
    return HttpResponse.json({
      total: TOTAL,
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

describe("useMessages", () => {
  test("loads chronological tail without reversing", async () => {
    const qc = createTestQueryClient();
    const { result } = await renderHook(() => useMessages(contactId), {
      wrapper: wrapperFor(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items).toHaveLength(MESSAGES_PAGE_SIZE);
    // Probe offset 0 then tail at total - page size
    expect(offsets).toEqual([0, 25]);
    expect(result.current.items[0]?.text).toBe("Body 26");
    expect(result.current.items[MESSAGES_PAGE_SIZE - 1]?.text).toBe("Body 45");
    expect(result.current.hasPreviousPage).toBe(true);
  });

  test("fetchPreviousPage prepends older Messages without reversing", async () => {
    const qc = createTestQueryClient();
    const { result } = await renderHook(() => useMessages(contactId), {
      wrapper: wrapperFor(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    offsets.length = 0;

    await result.current.fetchPreviousPage();
    await waitFor(() => expect(result.current.items.length).toBe(40));

    // Older page at previousCursor=5
    expect(offsets).toEqual([5]);
    expect(result.current.items[0]?.text).toBe("Body 6");
    expect(result.current.items[39]?.text).toBe("Body 45");
  });

  test("empty collection yields empty items", async () => {
    server.use(
      http.get(postsPath, () =>
        HttpResponse.json({
          total: 0,
          limit: 20,
          offset: 0,
          results: [],
        })
      )
    );

    const qc = createTestQueryClient();
    const { result } = await renderHook(() => useMessages(contactId), {
      wrapper: wrapperFor(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items).toEqual([]);
  });
});
