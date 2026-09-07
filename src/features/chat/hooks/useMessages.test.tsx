import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { type ReactNode } from "react";

import { queryKeys } from "@/lib/query-keys";
import { mswMessagesCollectionUrl, useNodeHttpAdapterForMsw } from "@/test-msw";
import { createTestQueryClient } from "@/test-utils";

import { MESSAGES_PAGE_SIZE } from "@/features/chat/api/fetchMessagesPage";
import { makePost } from "@/features/chat/test-fixtures";
import type { Message } from "@/features/chat/types";

import { appendOutgoing } from "./outgoingCache";
import {
  getOlderMessagesPageParam,
  useMessages,
  type MessagesInfiniteData,
} from "./useMessages";

const contactId = 5;
const postsPath = mswMessagesCollectionUrl();
const requests: { offset: number; limit: number }[] = [];

const TOTAL = 45;

const server = setupServer(
  http.get(postsPath, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    requests.push({ offset, limit });
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
  requests.length = 0;
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

describe("getOlderMessagesPageParam", () => {
  test("returns non-overlapping remainder window when offset < limit", () => {
    expect(getOlderMessagesPageParam({ offset: 25, limit: 20 })).toEqual({
      offset: 5,
      limit: 20,
    });
    expect(getOlderMessagesPageParam({ offset: 5, limit: 20 })).toEqual({
      offset: 0,
      limit: 5,
    });
    expect(getOlderMessagesPageParam({ offset: 0, limit: 5 })).toBeUndefined();
  });
});

describe("useMessages", () => {
  test("loads chronological tail without reversing", async () => {
    const qc = createTestQueryClient();
    const { result } = await renderHook(() => useMessages(contactId), {
      wrapper: wrapperFor(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items).toHaveLength(MESSAGES_PAGE_SIZE);
    // Probe offset 0 then tail at total - page size
    expect(requests).toEqual([
      { offset: 0, limit: 20 },
      { offset: 25, limit: 20 },
    ]);
    expect(result.current.items[0]?.text).toBe("Body 26");
    expect(result.current.items[MESSAGES_PAGE_SIZE - 1]?.text).toBe("Body 45");
    expect(result.current.hasPreviousPage).toBe(true);
  });

  test("fetchPreviousPage prepends older Messages without overlapping remainder", async () => {
    const qc = createTestQueryClient();
    const { result } = await renderHook(() => useMessages(contactId), {
      wrapper: wrapperFor(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    requests.length = 0;

    await result.current.fetchPreviousPage();
    await waitFor(() => expect(result.current.items.length).toBe(40));

    expect(requests).toEqual([{ offset: 5, limit: 20 }]);
    expect(result.current.items[0]?.text).toBe("Body 6");
    expect(result.current.items[39]?.text).toBe("Body 45");
    expect(result.current.hasPreviousPage).toBe(true);

    requests.length = 0;
    await result.current.fetchPreviousPage();
    await waitFor(() => expect(result.current.items.length).toBe(TOTAL));

    // Remainder window: offset 0 with limit 5 (not 20) — no overlap
    expect(requests).toEqual([{ offset: 0, limit: 5 }]);
    const ids = result.current.items.map((m) => m.id);
    expect(ids).toEqual(Array.from({ length: TOTAL }, (_, i) => i + 1));
    expect(new Set(ids).size).toBe(TOTAL);
    expect(result.current.hasPreviousPage).toBe(false);
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

  it("should preserve outgoing me row when send races the first tail GET", async () => {
    // Arrange
    let releaseGet!: () => void;
    const getHeld = new Promise<void>((resolve) => {
      releaseGet = resolve;
    });

    server.use(
      http.get(postsPath, async ({ request }) => {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? 20);
        const offset = Number(url.searchParams.get("offset") ?? 0);
        requests.push({ offset, limit });
        await getHeld;
        return HttpResponse.json({
          total: 1,
          limit,
          offset,
          results: [makePost(1, { userId: contactId, body: "Server message" })],
        });
      })
    );

    const qc = createTestQueryClient();
    const { result } = await renderHook(() => useMessages(contactId), {
      wrapper: wrapperFor(qc),
    });

    await waitFor(() => expect(requests.length).toBe(1));

    const outgoing: Message = {
      id: "local-race-1",
      text: "Sent during skeleton",
      sender: "me",
      createdAt: "2026-09-07T12:00:00.000Z",
      status: "sending",
    };
    qc.setQueryData<MessagesInfiniteData>(
      queryKeys.messages(contactId),
      (old) => appendOutgoing(old, outgoing)
    );

    // Act
    releaseGet();

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items.map((m) => m.id)).toEqual([1, "local-race-1"]);
    expect(result.current.items[1]).toMatchObject({
      id: "local-race-1",
      sender: "me",
      text: "Sent during skeleton",
      status: "sending",
    });
  });
});
