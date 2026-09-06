import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { endpoints } from "@/services/api/endpoints";
import { mswProfileDetailUrl, useNodeHttpAdapterForMsw } from "@/test-msw";

import { makeUser } from "@/features/conversations/test-fixtures";

import { fetchProfile } from "./fetchProfile";

const contactId = 7;
const server = setupServer();

beforeAll(() => {
  useNodeHttpAdapterForMsw();
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("fetchProfile", () => {
  test("fetches via endpoints.profile.detail and maps to Profile", async () => {
    const user = makeUser(contactId);
    server.use(
      http.get(mswProfileDetailUrl(contactId), () => HttpResponse.json(user))
    );

    const profile = await fetchProfile(contactId);

    expect(endpoints.profile.detail(contactId)).toBe(`/users/${contactId}`);
    expect(profile).toEqual({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      phone: user.phone,
    });
    // No bio/About leakage
    expect(profile).not.toHaveProperty("website");
    expect(profile).not.toHaveProperty("address");
  });

  test("accepts string contactId", async () => {
    const user = makeUser(12);
    server.use(
      http.get(mswProfileDetailUrl("12"), () => HttpResponse.json(user))
    );

    const profile = await fetchProfile("12");
    expect(profile.id).toBe(12);
  });

  test("rejects with normalized ApiError on 404", async () => {
    server.use(
      http.get(mswProfileDetailUrl(contactId), () =>
        HttpResponse.json({ error: "User not found" }, { status: 404 })
      )
    );

    await expect(fetchProfile(contactId)).rejects.toMatchObject({
      status: 404,
      message: "User not found",
    });
  });

  test("rejects with normalized ApiError on 500", async () => {
    server.use(
      http.get(mswProfileDetailUrl(contactId), () =>
        HttpResponse.json({ error: "Internal" }, { status: 500 })
      )
    );

    await expect(fetchProfile(contactId)).rejects.toMatchObject({
      status: 500,
      message: "Internal",
    });
  });

  test("rejects with normalized ApiError on 429 preserving retry-after", async () => {
    server.use(
      http.get(mswProfileDetailUrl(contactId), () =>
        HttpResponse.json(
          { error: "Too many requests" },
          { status: 429, headers: { "retry-after": "60" } }
        )
      )
    );

    await expect(fetchProfile(contactId)).rejects.toMatchObject({
      status: 429,
      retryAfter: "60",
    });
  });

  test("rejects without status on network error", async () => {
    server.use(
      http.get(mswProfileDetailUrl(contactId), () => HttpResponse.error())
    );

    await expect(fetchProfile(contactId)).rejects.toMatchObject({
      message: expect.any(String) as string,
    });
    await expect(fetchProfile(contactId)).rejects.toHaveProperty(
      "status",
      undefined
    );
  });
});
