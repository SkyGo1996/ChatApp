import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { type ReactNode } from "react";
import { AccessibilityInfo } from "react-native";

import { queryKeys } from "@/lib/query-keys";
import { API_BASE_URL } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { mswMessagesCollectionUrl, useNodeHttpAdapterForMsw } from "@/test-msw";
import { createTestQueryClient } from "@/test-utils";

import { MESSAGES_PAGE_SIZE } from "@/features/chat/api/fetchMessagesPage";
import { makePost } from "@/features/chat/test-fixtures";
import type { ConversationsInfiniteData } from "@/features/conversations/hooks/useConversations";

import {
  messagesInfiniteOptions,
  type MessagesInfiniteData,
} from "./useMessages";
import { useSendMessage } from "./useSendMessage";

const contactId = 5;
const postsPath = mswMessagesCollectionUrl();
const sendUrl = `${API_BASE_URL}${endpoints.chat.send}`;

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

function wrapperFor(clientInstance: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={clientInstance}>
        {children}
      </QueryClientProvider>
    );
  };
}

function seedConversations(
  qc: QueryClient,
  id = contactId
): ConversationsInfiniteData {
  const data: ConversationsInfiniteData = {
    pages: [
      {
        items: [
          {
            id,
            name: "User 5",
            avatar: "https://i.pravatar.cc/150?img=5",
          },
        ],
        nextCursor: null,
        previousCursor: null,
      },
    ],
    pageParams: [0],
  };
  qc.setQueryData(queryKeys.conversations(), data);
  return data;
}

function seedMessages(qc: QueryClient): void {
  const data: MessagesInfiniteData = {
    pages: [
      {
        items: [
          {
            id: 1,
            text: "Existing",
            sender: "them",
            createdAt: "2025-07-01T10:12:00Z",
            status: "sent",
          },
        ],
        nextCursor: null,
        previousCursor: null,
        total: 1,
        offset: 0,
        limit: MESSAGES_PAGE_SIZE,
      },
    ],
    pageParams: ["tail"],
  };
  qc.setQueryData(queryKeys.messages(contactId), data);
}

function lastMessage(qc: QueryClient) {
  return qc
    .getQueryData<MessagesInfiniteData>(queryKeys.messages(contactId))
    ?.pages[0]?.items.at(-1);
}

describe("useSendMessage", () => {
  test("appends sending then replaces on 201 and patches conversations without refetch", async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {
        /* no-op for Jest */
      });
    let postCount = 0;
    let usersGetCount = 0;

    server.use(
      http.post(sendUrl, async ({ request }) => {
        postCount += 1;
        const body = (await request.json()) as { body: string };
        return HttpResponse.json(
          {
            id: 101,
            userId: contactId,
            title: body.body,
            slug: "hello",
            body: body.body,
            tags: [],
            category: "General",
            createdAt: "2026-09-04T11:53:31.123Z",
          },
          { status: 201 }
        );
      }),
      http.get(`${API_BASE_URL}${endpoints.conversations.list}`, () => {
        usersGetCount += 1;
        return HttpResponse.json({
          total: 0,
          limit: 20,
          offset: 0,
          results: [],
        });
      }),
      http.get(postsPath, () =>
        HttpResponse.json({
          total: 1,
          limit: 20,
          offset: 0,
          results: [makePost(1, { userId: contactId, body: "Existing" })],
        })
      )
    );

    const qc = createTestQueryClient();
    seedConversations(qc);
    seedMessages(qc);

    const { result, unmount } = await renderHook(
      () => useSendMessage(contactId),
      { wrapper: wrapperFor(qc) }
    );

    await act(async () => {
      await result.current.send("  hello world  ");
    });

    const last = lastMessage(qc);
    expect(last?.status).toBe("sent");
    expect(last?.text).toBe("hello world");
    expect(last?.id).toBe(101);
    expect(last?.createdAt).toBe("2026-09-04T11:53:31.123Z");

    const conversations = qc.getQueryData<ConversationsInfiniteData>(
      queryKeys.conversations()
    );
    expect(conversations?.pages[0]?.items[0]).toMatchObject({
      id: contactId,
      lastMessage: "hello world",
      lastMessageAt: "2026-09-04T11:53:31.123Z",
    });
    expect(postCount).toBe(1);
    expect(usersGetCount).toBe(0);
    expect(announceSpy).toHaveBeenCalledWith("sending");
    expect(announceSpy).toHaveBeenCalledWith("sent");
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Light
    );

    // Mock GET omits 101 — preserveOutgoingOnTail must keep the server row.
    await act(async () => {
      await qc.fetchInfiniteQuery(messagesInfiniteOptions(contactId));
    });
    const afterRefetch = qc.getQueryData<MessagesInfiniteData>(
      queryKeys.messages(contactId)
    );
    expect(
      afterRefetch?.pages
        .flatMap((page) => page.items)
        .some((message) => message.id === 101 && message.sender === "me")
    ).toBe(true);

    void unmount();
    qc.getMutationCache().clear();
    qc.clear();
  });

  test("marks failed on error without auto-retry (mutations retry 0)", async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {
        /* no-op for Jest */
      });
    let postCount = 0;

    server.use(
      http.post(sendUrl, () => {
        postCount += 1;
        return HttpResponse.json({ error: "Internal" }, { status: 500 });
      })
    );

    const qc = createTestQueryClient();
    seedMessages(qc);

    const { result, unmount } = await renderHook(
      () => useSendMessage(contactId),
      { wrapper: wrapperFor(qc) }
    );

    await act(async () => {
      await result.current.send("ping");
    });

    expect(lastMessage(qc)?.status).toBe("failed");

    expect(postCount).toBe(1);
    expect(announceSpy).toHaveBeenCalledWith("failed");
    expect(Haptics.impactAsync).not.toHaveBeenCalled();

    void unmount();
    qc.getMutationCache().clear();
    qc.clear();
  });

  test("retry re-issues POST and succeeds after recovery", async () => {
    jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {
        /* no-op for Jest */
      });
    let postCount = 0;

    server.use(
      http.post(sendUrl, async ({ request }) => {
        postCount += 1;
        if (postCount === 1) {
          return HttpResponse.json({ error: "Internal" }, { status: 500 });
        }
        const body = (await request.json()) as { body: string };
        return HttpResponse.json(
          {
            id: 101,
            userId: contactId,
            title: body.body,
            slug: "retry",
            body: body.body,
            tags: [],
            category: "General",
            createdAt: "2026-09-04T12:00:00.000Z",
          },
          { status: 201 }
        );
      })
    );

    const qc = createTestQueryClient();
    seedConversations(qc);
    seedMessages(qc);

    const { result, unmount } = await renderHook(
      () => useSendMessage(contactId),
      { wrapper: wrapperFor(qc) }
    );

    await act(async () => {
      await result.current.send("retry me");
    });

    expect(lastMessage(qc)?.status).toBe("failed");

    const failedId = String(lastMessage(qc)?.id);

    await act(async () => {
      await result.current.retry(failedId);
    });

    const last = lastMessage(qc);
    expect(last?.status).toBe("sent");
    expect(last?.text).toBe("retry me");
    expect(last?.id).toBe(101);
    expect(String(last?.id)).not.toBe(failedId);

    expect(postCount).toBe(2);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(
      qc.getQueryData<ConversationsInfiniteData>(queryKeys.conversations())
        ?.pages[0]?.items[0]
    ).toMatchObject({
      lastMessage: "retry me",
      lastMessageAt: "2026-09-04T12:00:00.000Z",
    });

    void unmount();
    qc.getMutationCache().clear();
    qc.clear();
  });
});
