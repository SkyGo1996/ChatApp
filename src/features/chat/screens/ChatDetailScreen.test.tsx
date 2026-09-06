import { QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { type ReactNode } from "react";
import { AccessibilityInfo } from "react-native";

import { API_BASE_URL } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { mswMessagesCollectionUrl, useNodeHttpAdapterForMsw } from "@/test-msw";
import { createTestQueryClient } from "@/test-utils";

import { makePost } from "@/features/chat/test-fixtures";

import ChatDetailScreen from "./ChatDetailScreen";

const contactId = "5";
const postsPath = mswMessagesCollectionUrl();
const sendUrl = `${API_BASE_URL}${endpoints.chat.send}`;

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
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

function wrapperFor(client: ReturnType<typeof createTestQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("ChatDetailScreen", () => {
  test("renders message body (not title) with list and composer", async () => {
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
    expect(screen.getByTestId("composer")).toBeTruthy();
    expect(screen.getByLabelText("Send")).toBeTruthy();
  });

  test("shows composer even when initial load fails", async () => {
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
    expect(screen.getByTestId("composer")).toBeTruthy();
    expect(screen.getByLabelText("Send")).toBeDisabled();
  });

  test("composer send shows optimistic Message then settles on success", async () => {
    jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {
        /* no-op for Jest */
      });

    server.use(
      http.get(postsPath, () =>
        HttpResponse.json({
          total: 1,
          limit: 20,
          offset: 0,
          results: [
            makePost(1, {
              userId: 5,
              body: "Existing history",
              createdAt: new Date().toISOString(),
            }),
          ],
        })
      ),
      http.post(sendUrl, async ({ request }) => {
        const body = (await request.json()) as { body: string };
        return HttpResponse.json(
          {
            id: 101,
            userId: 5,
            title: body.body,
            slug: "optimistic-ping",
            body: body.body,
            tags: [],
            category: "General",
            createdAt: "2026-09-04T11:53:31.123Z",
          },
          { status: 201 }
        );
      })
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

    expect(await screen.findByText("Existing history")).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(
        screen.getByTestId("composer-input"),
        "Optimistic ping"
      );
    });
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Send"));
    });

    expect(await screen.findByText("Optimistic ping")).toBeTruthy();
    // Settled = no Retry affordance and sent announcement (no opacity coupling
    // to MessageBubble internals; Retry absence already proves settle).
    await waitFor(() => {
      expect(screen.getByLabelText(/You: Optimistic ping/)).toBeTruthy();
    });
    expect(screen.queryByLabelText("Retry send")).toBeNull();

    qc.getMutationCache().clear();
    qc.clear();
  });
});
