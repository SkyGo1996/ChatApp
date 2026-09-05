import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { mswMessagesCollectionUrl, useNodeHttpAdapterForMsw } from "@/test-msw";

import { fetchLatestPreview } from "./fetchLatestPreview";

const contactId = 5;
const postsPath = mswMessagesCollectionUrl();

const server = setupServer();

beforeAll(() => {
  useNodeHttpAdapterForMsw();
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("fetchLatestPreview", () => {
  test("fetches via endpoints.chat.messages with limit 1 and maps body/createdAt", async () => {
    const requested: {
      limit?: string | null;
      userId?: string | null;
      offset?: string | null;
    } = {};

    server.use(
      http.get(postsPath, ({ request }) => {
        const url = new URL(request.url);
        requested.limit = url.searchParams.get("limit");
        requested.userId = url.searchParams.get("userId");
        requested.offset = url.searchParams.get("offset");
        return HttpResponse.json({
          total: 1,
          limit: 1,
          offset: 0,
          results: [
            {
              id: 10,
              userId: contactId,
              title: "Hello",
              body: "  Latest   preview   text  ",
              tags: [],
              category: "General",
              createdAt: "2025-07-01T10:12:00Z",
            },
          ],
        });
      })
    );

    const preview = await fetchLatestPreview(contactId);

    expect(requested.limit).toBe("1");
    expect(requested.userId).toBe(String(contactId));
    expect(requested.offset).toBe("0");
    expect(preview).toEqual({
      text: "Latest preview text",
      createdAt: "2025-07-01T10:12:00Z",
    });
  });

  test("when total > 1, fetches offset=total-1 and returns the latest body", async () => {
    const offsets: string[] = [];

    server.use(
      http.get(postsPath, ({ request }) => {
        const url = new URL(request.url);
        const offset = url.searchParams.get("offset") ?? "0";
        offsets.push(offset);

        if (offset === "0") {
          return HttpResponse.json({
            total: 3,
            limit: 1,
            offset: 0,
            results: [
              {
                id: 1,
                userId: contactId,
                title: "Oldest",
                body: "Oldest preview text",
                tags: [],
                category: "General",
                createdAt: "2025-07-01T10:12:00Z",
              },
            ],
          });
        }

        return HttpResponse.json({
          total: 3,
          limit: 1,
          offset: 2,
          results: [
            {
              id: 75,
              userId: contactId,
              title: "Latest",
              body: "Latest preview text",
              tags: [],
              category: "General",
              createdAt: "2025-08-02T09:00:00Z",
            },
          ],
        });
      })
    );

    const preview = await fetchLatestPreview(contactId);

    expect(offsets).toEqual(["0", "2"]);
    expect(preview).toEqual({
      text: "Latest preview text",
      createdAt: "2025-08-02T09:00:00Z",
    });
  });

  test("returns null when results are empty", async () => {
    server.use(
      http.get(postsPath, () =>
        HttpResponse.json({
          total: 0,
          limit: 1,
          offset: 0,
          results: [],
        })
      )
    );

    expect(await fetchLatestPreview(contactId)).toBeNull();
  });

  test("returns null when body is blank after collapse", async () => {
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
              title: "Empty",
              body: "   \n\t  ",
              tags: [],
              category: "General",
              createdAt: "2025-07-01T10:12:00Z",
            },
          ],
        })
      )
    );

    expect(await fetchLatestPreview(contactId)).toBeNull();
  });
});
