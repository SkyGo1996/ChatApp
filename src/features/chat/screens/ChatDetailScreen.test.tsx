import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { type ReactNode } from "react";

import { mswMessagesCollectionUrl, useNodeHttpAdapterForMsw } from "@/test-msw";
import { createTestQueryClient } from "@/test-utils";

import { makePost } from "@/features/chat/test-fixtures";

import ChatDetailScreen from "./ChatDetailScreen";

const contactId = "5";
const postsPath = mswMessagesCollectionUrl();

jest.mock("expo-router", () => ({
  useNavigation: () => ({
    setOptions: jest.fn(),
  }),
}));

const server = setupServer();

beforeAll(() => {
  useNodeHttpAdapterForMsw();
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapperFor(client: ReturnType<typeof createTestQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("ChatDetailScreen", () => {
  test("shows loading shimmer then message body (not title)", async () => {
    server.use(
      http.get(postsPath, () =>
        HttpResponse.json({
          total: 1,
          limit: 20,
          offset: 0,
          results: [
            makePost(1, {
              userId: 5,
              title: "Secret title must not render",
              body: "Visible bubble body",
              createdAt: new Date().toISOString(),
            }),
          ],
        })
      )
    );

    const qc = createTestQueryClient();
    await render(
      <ChatDetailScreen
        conversationId={contactId}
        contactName="Ada"
        contactAvatar="https://i.pravatar.cc/150?img=5"
      />,
      { wrapper: wrapperFor(qc) }
    );

    expect(await screen.findByText("Visible bubble body")).toBeTruthy();
    expect(screen.queryByText("Secret title must not render")).toBeNull();
    expect(screen.getByTestId("messages-list")).toBeTruthy();
  });

  test("shows ErrorRetry when initial load fails", async () => {
    server.use(
      http.get(postsPath, () =>
        HttpResponse.json({ error: "Internal" }, { status: 500 })
      )
    );

    const qc = createTestQueryClient();
    await render(<ChatDetailScreen conversationId={contactId} />, {
      wrapper: wrapperFor(qc),
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Retry messages")).toBeTruthy();
    });
    expect(screen.getByText("Something went wrong.")).toBeTruthy();
  });
});
