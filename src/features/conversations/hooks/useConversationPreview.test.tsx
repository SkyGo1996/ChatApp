import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { type ReactNode } from "react";

import { mswMessagesCollectionUrl, useNodeHttpAdapterForMsw } from "@/test-msw";
import { createTestQueryClient } from "@/test-utils";

import { useConversationPreview } from "./useConversationPreview";

const contactId = 7;
const postsPath = mswMessagesCollectionUrl();

const server = setupServer();

beforeAll(() => {
  useNodeHttpAdapterForMsw();
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
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

describe("useConversationPreview", () => {
  test("loads preview via registry URL", async () => {
    let hit = false;
    server.use(
      http.get(postsPath, ({ request }) => {
        hit = true;
        const url = new URL(request.url);
        expect(url.searchParams.get("limit")).toBe("1");
        expect(url.searchParams.get("userId")).toBe(String(contactId));
        expect(url.searchParams.get("offset")).toBe("0");
        return HttpResponse.json({
          total: 1,
          limit: 1,
          offset: 0,
          results: [
            {
              id: 1,
              userId: contactId,
              title: "T",
              body: "Hello from posts",
              tags: [],
              category: "General",
              createdAt: "2025-07-01T10:12:00Z",
            },
          ],
        });
      })
    );

    const qc = createTestQueryClient();
    const { result } = await renderHook(
      () => useConversationPreview(contactId),
      { wrapper: wrapperFor(qc) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(hit).toBe(true);
    expect(result.current.preview).toEqual({
      text: "Hello from posts",
      createdAt: "2025-07-01T10:12:00Z",
    });
  });

  test("429 leaves preview null (fail-soft for row)", async () => {
    server.use(
      http.get(postsPath, () =>
        HttpResponse.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: { "retry-after": "2" },
          }
        )
      )
    );

    const qc = createTestQueryClient();
    const { result } = await renderHook(
      () => useConversationPreview(contactId),
      { wrapper: wrapperFor(qc) }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.preview).toBeNull();
    expect(result.current.error?.status).toBe(429);
  });

  test("timeout / network leaves preview null (fail-soft)", async () => {
    server.use(http.get(postsPath, () => HttpResponse.error()));

    const qc = createTestQueryClient();
    const { result } = await renderHook(
      () => useConversationPreview(contactId),
      { wrapper: wrapperFor(qc) }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.preview).toBeNull();
  });
});
