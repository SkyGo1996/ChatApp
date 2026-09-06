import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { API_BASE_URL } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { useNodeHttpAdapterForMsw } from "@/test-msw";

import {
  derivePostTitle,
  mapSentPostToMessage,
  sendMessage,
} from "./sendMessage";

const contactId = 5;
const sendUrl = `${API_BASE_URL}${endpoints.chat.send}`;

const server = setupServer();

beforeAll(() => {
  useNodeHttpAdapterForMsw();
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("derivePostTitle", () => {
  test("uses first line and truncates long titles", () => {
    expect(derivePostTitle("Hello world")).toBe("Hello world");
    expect(derivePostTitle("Line one\nLine two")).toBe("Line one");
    expect(derivePostTitle("a".repeat(100))).toBe("a".repeat(80));
  });
});

describe("mapSentPostToMessage", () => {
  test("maps body as text and attributes to me/sent", () => {
    expect(
      mapSentPostToMessage({
        id: 101,
        body: "Hello bubble",
        createdAt: "2026-09-04T11:53:31.123Z",
      })
    ).toEqual({
      id: 101,
      text: "Hello bubble",
      sender: "me",
      createdAt: "2026-09-04T11:53:31.123Z",
      status: "sent",
    });
  });
});

describe("sendMessage", () => {
  test("POSTs sanitized body via endpoints.chat.send and maps 201 id 101", async () => {
    let received: {
      userId?: number;
      title?: string;
      body?: string;
    } = {};

    server.use(
      http.post(sendUrl, async ({ request }) => {
        received = (await request.json()) as typeof received;
        return HttpResponse.json(
          {
            id: 101,
            userId: contactId,
            title: received.title,
            slug: "hello-world",
            body: received.body,
            tags: [],
            category: "General",
            createdAt: "2026-09-04T11:53:31.123Z",
          },
          { status: 201 }
        );
      })
    );

    const message = await sendMessage({
      conversationId: contactId,
      text: "  hello   world\u0000  ",
    });

    expect(received).toEqual({
      userId: contactId,
      title: "hello world",
      body: "hello world",
    });
    expect(message).toEqual({
      id: 101,
      text: "hello world",
      sender: "me",
      createdAt: "2026-09-04T11:53:31.123Z",
      status: "sent",
    });
  });

  test("rejects empty after sanitization without calling the API", async () => {
    let called = false;
    server.use(
      http.post(sendUrl, () => {
        called = true;
        return HttpResponse.json({ error: "should not run" }, { status: 500 });
      })
    );

    await expect(
      sendMessage({ conversationId: contactId, text: "   \n\t  " })
    ).rejects.toMatchObject({
      status: 400,
      message: "Message body is empty after sanitization",
    });
    expect(called).toBe(false);
  });

  test("rejects with normalized ApiError on 500", async () => {
    server.use(
      http.post(sendUrl, () =>
        HttpResponse.json({ error: "Internal" }, { status: 500 })
      )
    );

    await expect(
      sendMessage({ conversationId: contactId, text: "ping" })
    ).rejects.toMatchObject({
      status: 500,
      message: "Internal",
    });
  });
});
