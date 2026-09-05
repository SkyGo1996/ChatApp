import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { endpoints } from "@/services/api/endpoints";
import { mswMessagesCollectionUrl, useNodeHttpAdapterForMsw } from "@/test-msw";

import { makePost } from "@/features/chat/test-fixtures";

import {
  fetchMessagesPage,
  fetchNewestMessagesPage,
  mapPostToMessage,
  MESSAGES_PAGE_SIZE,
} from "./fetchMessagesPage";

const contactId = 5;
const postsPath = mswMessagesCollectionUrl();

const server = setupServer();

beforeAll(() => {
  useNodeHttpAdapterForMsw();
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("mapPostToMessage", () => {
  test("maps body only as text and attributes to them/sent", () => {
    expect(
      mapPostToMessage({
        id: 10,
        body: "Hello bubble",
        createdAt: "2025-07-01T10:12:00Z",
      })
    ).toEqual({
      id: 10,
      text: "Hello bubble",
      sender: "them",
      createdAt: "2025-07-01T10:12:00Z",
      status: "sent",
    });
  });
});

describe("fetchMessagesPage", () => {
  test("fetches via endpoints.chat.messages with page size 20 and adapts", async () => {
    const requested: {
      limit?: string | null;
      offset?: string | null;
      userId?: string | null;
    } = {};

    server.use(
      http.get(postsPath, ({ request }) => {
        const url = new URL(request.url);
        requested.limit = url.searchParams.get("limit");
        requested.offset = url.searchParams.get("offset");
        requested.userId = url.searchParams.get("userId");
        expect(
          endpoints.chat.messages(contactId, { limit: 20, offset: 0 })
        ).toContain(`userId=${contactId}`);
        const limit = Number(requested.limit ?? 100);
        const offset = Number(requested.offset ?? 0);
        const results = Array.from({ length: limit }, (_, i) =>
          makePost(offset + i + 1, {
            userId: contactId,
            title: `Hidden title ${offset + i + 1}`,
            body: `Body ${offset + i + 1}`,
          })
        );
        return HttpResponse.json({
          total: 60,
          limit,
          offset,
          results,
        });
      })
    );

    const page = await fetchMessagesPage(contactId);

    expect(requested.limit).toBe(String(MESSAGES_PAGE_SIZE));
    expect(requested.offset).toBe("0");
    expect(requested.userId).toBe(String(contactId));
    expect(page.items).toHaveLength(MESSAGES_PAGE_SIZE);
    expect(page.items[0]).toEqual({
      id: 1,
      text: "Body 1",
      sender: "them",
      createdAt: "2025-07-01T10:12:00Z",
      status: "sent",
    });
    expect(page.items[0]?.text).not.toContain("Hidden title");
    expect(page.nextCursor).toBe(20);
    expect(page.previousCursor).toBeNull();
    expect(page.total).toBe(60);
    expect(page.offset).toBe(0);
  });

  test("passes offset and sets previousCursor on later pages", async () => {
    server.use(
      http.get(postsPath, ({ request }) => {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? 20);
        const offset = Number(url.searchParams.get("offset") ?? 0);
        expect(offset).toBe(20);
        return HttpResponse.json({
          total: 45,
          limit,
          offset,
          results: Array.from({ length: 20 }, (_, i) =>
            makePost(21 + i, { userId: contactId, body: `Body ${21 + i}` })
          ),
        });
      })
    );

    const page = await fetchMessagesPage(contactId, { offset: 20 });
    expect(page.items).toHaveLength(20);
    expect(page.nextCursor).toBe(40);
    expect(page.previousCursor).toBe(0);
  });

  test("rejects with normalized ApiError on 500", async () => {
    server.use(
      http.get(postsPath, () =>
        HttpResponse.json({ error: "Internal" }, { status: 500 })
      )
    );

    await expect(fetchMessagesPage(contactId)).rejects.toMatchObject({
      status: 500,
      message: "Internal",
    });
  });
});

describe("fetchNewestMessagesPage", () => {
  test("returns the first page when total fits in one page", async () => {
    const offsets: string[] = [];

    server.use(
      http.get(postsPath, ({ request }) => {
        const url = new URL(request.url);
        offsets.push(url.searchParams.get("offset") ?? "0");
        return HttpResponse.json({
          total: 3,
          limit: 20,
          offset: 0,
          results: [
            makePost(1, { userId: contactId, body: "Oldest" }),
            makePost(2, { userId: contactId, body: "Middle" }),
            makePost(3, { userId: contactId, body: "Newest" }),
          ],
        });
      })
    );

    const page = await fetchNewestMessagesPage(contactId);
    expect(offsets).toEqual(["0"]);
    expect(page.items.map((m) => m.text)).toEqual([
      "Oldest",
      "Middle",
      "Newest",
    ]);
    expect(page.previousCursor).toBeNull();
  });

  test("refetches chronological tail when total exceeds page size", async () => {
    const offsets: string[] = [];

    server.use(
      http.get(postsPath, ({ request }) => {
        const url = new URL(request.url);
        const offset = Number(url.searchParams.get("offset") ?? 0);
        const limit = Number(url.searchParams.get("limit") ?? 20);
        offsets.push(String(offset));

        if (offset === 0) {
          return HttpResponse.json({
            total: 45,
            limit,
            offset: 0,
            results: Array.from({ length: limit }, (_, i) =>
              makePost(i + 1, { userId: contactId, body: `Body ${i + 1}` })
            ),
          });
        }

        return HttpResponse.json({
          total: 45,
          limit,
          offset,
          results: Array.from({ length: limit }, (_, i) =>
            makePost(offset + i + 1, {
              userId: contactId,
              body: `Body ${offset + i + 1}`,
            })
          ),
        });
      })
    );

    const page = await fetchNewestMessagesPage(contactId);
    expect(offsets).toEqual(["0", "25"]);
    expect(page.offset).toBe(25);
    expect(page.items[0]?.text).toBe("Body 26");
    expect(page.items[page.items.length - 1]?.text).toBe("Body 45");
    expect(page.previousCursor).toBe(5);
  });
});
