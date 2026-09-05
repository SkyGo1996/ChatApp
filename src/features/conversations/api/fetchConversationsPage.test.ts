import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { API_BASE_URL } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { useNodeHttpAdapterForMsw } from "@/test-msw";

import {
  CONVERSATIONS_PAGE_SIZE,
  fetchConversationsPage,
} from "./fetchConversationsPage";

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

const server = setupServer();

beforeAll(() => {
  useNodeHttpAdapterForMsw();
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("fetchConversationsPage", () => {
  test("fetches via endpoints.conversations.list with page size 20 and adapts", async () => {
    const requested: { limit?: string | null; offset?: string | null } = {};

    server.use(
      http.get(usersUrl, ({ request }) => {
        const url = new URL(request.url);
        requested.limit = url.searchParams.get("limit");
        requested.offset = url.searchParams.get("offset");
        const limit = Number(requested.limit ?? 100);
        const offset = Number(requested.offset ?? 0);
        const results = Array.from({ length: limit }, (_, i) =>
          makeUser(offset + i + 1)
        );
        return HttpResponse.json({
          total: 60,
          limit,
          offset,
          results,
        });
      })
    );

    const page = await fetchConversationsPage();

    expect(requested.limit).toBe(String(CONVERSATIONS_PAGE_SIZE));
    expect(requested.offset).toBe("0");
    expect(page.items).toHaveLength(CONVERSATIONS_PAGE_SIZE);
    expect(page.items[0]).toEqual({
      id: 1,
      name: "User 1",
      avatar: "https://i.pravatar.cc/150?img=1",
    });
    expect(page.nextCursor).toBe(20);
  });

  test("passes offset and returns null nextCursor on last page", async () => {
    server.use(
      http.get(usersUrl, ({ request }) => {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? 20);
        const offset = Number(url.searchParams.get("offset") ?? 0);
        expect(offset).toBe(40);
        return HttpResponse.json({
          total: 45,
          limit,
          offset,
          results: [
            makeUser(41),
            makeUser(42),
            makeUser(43),
            makeUser(44),
            makeUser(45),
          ],
        });
      })
    );

    const page = await fetchConversationsPage({ offset: 40 });
    expect(page.items).toHaveLength(5);
    expect(page.nextCursor).toBeNull();
  });

  test("rejects with normalized ApiError on 500", async () => {
    server.use(
      http.get(usersUrl, () =>
        HttpResponse.json({ error: "Internal" }, { status: 500 })
      )
    );

    await expect(fetchConversationsPage()).rejects.toMatchObject({
      status: 500,
      message: "Internal",
    });
  });

  test("rejects on timeout / network (no status)", async () => {
    server.use(http.get(usersUrl, () => HttpResponse.error()));

    const err: unknown = await fetchConversationsPage().then(
      () => {
        throw new Error("expected fetchConversationsPage to reject");
      },
      (reason: unknown) => reason
    );
    expect(typeof err).toBe("object");
    expect(err).not.toBeNull();
    expect(typeof (err as { message: unknown }).message).toBe("string");
  });
});
