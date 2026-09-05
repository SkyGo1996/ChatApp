import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { endpoints } from "@/services/api/endpoints";
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
    const requested: { limit?: string | null; userId?: string | null } = {};

    server.use(
      http.get(postsPath, ({ request }) => {
        const url = new URL(request.url);
        requested.limit = url.searchParams.get("limit");
        requested.userId = url.searchParams.get("userId");
        // Assert registry path embeds userId the same way endpoints.chat.messages does
        expect(endpoints.chat.messages(contactId)).toContain(
          `userId=${contactId}`
        );
        return HttpResponse.json({
          total: 3,
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
    expect(preview).toEqual({
      text: "Latest preview text",
      createdAt: "2025-07-01T10:12:00Z",
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
