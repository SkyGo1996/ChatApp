import type { InfiniteData } from "@tanstack/react-query";

import {
  MESSAGES_PAGE_SIZE,
  type MessagesPage,
} from "@/features/chat/api/fetchMessagesPage";
import type { Message } from "@/features/chat/types";
import type { ConversationsInfiniteData } from "@/features/conversations/hooks/useConversations";

import {
  appendOutgoing,
  patchConversationPreview,
  preserveOutgoingOnTail,
  updateOutgoing,
} from "./outgoingCache";

type MessagesPageParam = "tail" | { offset: number; limit: number };
type MessagesInfiniteData = InfiniteData<MessagesPage, MessagesPageParam>;

const meSending = (id: string, text = "Hello"): Message => ({
  id,
  text,
  sender: "me",
  createdAt: "2026-09-06T01:00:00.000Z",
  status: "sending",
});

const themSent = (id: number, text = "Hi"): Message => ({
  id,
  text,
  sender: "them",
  createdAt: "2025-07-01T10:12:00Z",
  status: "sent",
});

function makeMessagesData(
  items: Message[],
  pageParams: MessagesInfiniteData["pageParams"] = ["tail"]
): MessagesInfiniteData {
  return {
    pages: [
      {
        items,
        nextCursor: null,
        previousCursor: null,
        total: items.length,
        offset: 0,
        limit: MESSAGES_PAGE_SIZE,
      },
    ],
    pageParams,
  };
}

describe("appendOutgoing", () => {
  test("seeds a tail page when cache is empty", () => {
    const message = meSending("local-1");
    const next = appendOutgoing(undefined, message);
    expect(next.pageParams).toEqual(["tail"]);
    expect(next.pages).toHaveLength(1);
    expect(next.pages[0]?.items).toEqual([message]);
    expect(next.pages[0]?.limit).toBe(MESSAGES_PAGE_SIZE);
  });

  test("appends to the last page only", () => {
    const older = themSent(1, "Older");
    const newer = themSent(2, "Newer");
    const outgoing = meSending("local-2");
    const data: MessagesInfiniteData = {
      pages: [
        {
          items: [older],
          nextCursor: 20,
          previousCursor: null,
          total: 40,
          offset: 0,
          limit: MESSAGES_PAGE_SIZE,
        },
        {
          items: [newer],
          nextCursor: null,
          previousCursor: 0,
          total: 40,
          offset: 20,
          limit: MESSAGES_PAGE_SIZE,
        },
      ],
      pageParams: [{ offset: 0, limit: 20 }, "tail"],
    };

    const next = appendOutgoing(data, outgoing);
    expect(next.pages[0]?.items).toEqual([older]);
    expect(next.pages[1]?.items).toEqual([newer, outgoing]);
  });
});

describe("updateOutgoing", () => {
  test("patches the matching local Message by id", () => {
    const data = makeMessagesData([
      themSent(1),
      meSending("local-1", "ping"),
      meSending("local-2", "pong"),
    ]);
    const next = updateOutgoing(data, "local-1", {
      status: "sent",
      createdAt: "2026-09-06T01:01:00.000Z",
    });
    expect(next?.pages[0]?.items[1]).toMatchObject({
      id: "local-1",
      text: "ping",
      status: "sent",
      createdAt: "2026-09-06T01:01:00.000Z",
    });
    expect(next?.pages[0]?.items[2]).toMatchObject({
      id: "local-2",
      status: "sending",
    });
  });

  test("returns undefined when cache is empty", () => {
    expect(updateOutgoing(undefined, "local-1", { status: "failed" })).toBe(
      undefined
    );
  });
});

describe("patchConversationPreview", () => {
  test("sets lastMessage fields on the matching Contact", () => {
    const data: ConversationsInfiniteData = {
      pages: [
        {
          items: [
            { id: 1, name: "Ada", avatar: "a" },
            { id: 5, name: "Bob", avatar: "b" },
          ],
          nextCursor: 20,
          previousCursor: null,
        },
      ],
      pageParams: [0],
    };

    const next = patchConversationPreview(
      data,
      5,
      "Optimistic patch",
      "2026-09-06T01:01:00.000Z"
    );
    expect(next?.pages[0]?.items[0]).toEqual({
      id: 1,
      name: "Ada",
      avatar: "a",
    });
    expect(next?.pages[0]?.items[1]).toEqual({
      id: 5,
      name: "Bob",
      avatar: "b",
      lastMessage: "Optimistic patch",
      lastMessageAt: "2026-09-06T01:01:00.000Z",
    });
  });

  test("no-ops when conversations cache is missing", () => {
    expect(
      patchConversationPreview(undefined, 5, "x", "2026-09-06T01:01:00.000Z")
    ).toBeUndefined();
  });
});

describe("preserveOutgoingOnTail", () => {
  test("re-appends me Messages missing from a fresh tail page", () => {
    const outgoing = meSending("local-1", "Keep me");
    const previous = makeMessagesData([themSent(1, "Server"), outgoing]);
    const nextTail = {
      items: [themSent(1, "Server"), themSent(2, "Also server")],
      nextCursor: null,
      previousCursor: null,
      total: 2,
      offset: 0,
      limit: MESSAGES_PAGE_SIZE,
    };

    const merged = preserveOutgoingOnTail(previous, nextTail);
    expect(merged.items.map((m) => m.text)).toEqual([
      "Server",
      "Also server",
      "Keep me",
    ]);
    expect(merged.items[2]?.sender).toBe("me");
  });

  test("does not duplicate outgoing ids already present", () => {
    const outgoing = meSending("local-1");
    const previous = makeMessagesData([outgoing]);
    const nextTail = {
      items: [outgoing],
      nextCursor: null,
      previousCursor: null,
      total: 1,
      offset: 0,
      limit: MESSAGES_PAGE_SIZE,
    };
    expect(preserveOutgoingOnTail(previous, nextTail).items).toHaveLength(1);
  });

  test("returns the fresh page when previous cache has no me rows", () => {
    const previous = makeMessagesData([themSent(1)]);
    const nextTail = {
      items: [themSent(2)],
      nextCursor: null,
      previousCursor: null,
      total: 1,
      offset: 0,
      limit: MESSAGES_PAGE_SIZE,
    };
    expect(preserveOutgoingOnTail(previous, nextTail)).toBe(nextTail);
  });
});
