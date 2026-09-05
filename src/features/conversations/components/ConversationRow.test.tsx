import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { type ReactNode } from "react";

import { mswMessagesCollectionUrl, useNodeHttpAdapterForMsw } from "@/test-msw";
import { createTestQueryClient } from "@/test-utils";

import { ConversationRow } from "./ConversationRow";

const contactId = 3;
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

const conversation = {
  id: contactId,
  name: "Ada Lovelace",
  avatar: "https://i.pravatar.cc/150?img=3",
};

describe("ConversationRow", () => {
  test("shows placeholder and hides timestamp when enrichment fails", async () => {
    server.use(
      http.get(postsPath, () =>
        HttpResponse.json(
          { error: "Too many requests" },
          { status: 429, headers: { "retry-after": "1" } }
        )
      )
    );

    const qc = createTestQueryClient();
    await render(<ConversationRow conversation={conversation} />, {
      wrapper: wrapperFor(qc),
    });

    expect(await screen.findByText("No messages yet")).toBeTruthy();
    expect(
      screen.queryByText(/AM|PM|Yesterday|\d{2}\/\d{2}\/\d{2}/)
    ).toBeNull();
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
  });

  test("shows preview body and timestamp when enrichment succeeds", async () => {
    server.use(
      http.get(postsPath, () =>
        HttpResponse.json({
          total: 1,
          limit: 1,
          offset: 0,
          results: [
            {
              id: 1,
              userId: contactId,
              title: "T",
              body: "Enriched preview line",
              tags: [],
              category: "General",
              createdAt: new Date().toISOString(),
            },
          ],
        })
      )
    );

    const qc = createTestQueryClient();
    await render(<ConversationRow conversation={conversation} />, {
      wrapper: wrapperFor(qc),
    });

    expect(await screen.findByText("Enriched preview line")).toBeTruthy();
    // Today → hh:mm a
    expect(screen.getByText(/^\d{2}:\d{2} (AM|PM)$/)).toBeTruthy();
  });

  test("prefers patched lastMessage over enrichment", async () => {
    server.use(
      http.get(postsPath, () =>
        HttpResponse.json({
          total: 1,
          limit: 1,
          offset: 0,
          results: [
            {
              id: 1,
              userId: contactId,
              title: "T",
              body: "From network",
              tags: [],
              category: "General",
              createdAt: "2024-01-15T12:00:00Z",
            },
          ],
        })
      )
    );

    const qc = createTestQueryClient();
    await render(
      <ConversationRow
        conversation={{
          ...conversation,
          lastMessage: "Optimistic patch",
          lastMessageAt: "2024-01-15T12:00:00Z",
        }}
      />,
      { wrapper: wrapperFor(qc) }
    );

    expect(await screen.findByText("Optimistic patch")).toBeTruthy();
    expect(screen.queryByText("From network")).toBeNull();
  });
});
