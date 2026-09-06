import { API_BASE_URL, client } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";

/**
 * Point the shared axios client at an adapter msw can intercept in Jest.
 * RN/browser axios builds stub Node `http` as null; use `fetch` instead.
 */
export function useNodeHttpAdapterForMsw(): void {
  client.defaults.adapter = "fetch";
}

/**
 * Absolute MSW path for the posts collection (no query string).
 * Derived from `endpoints.chat.messages` so tests never hardcode `/posts`.
 */
export function mswMessagesCollectionUrl(): string {
  const withQuery = endpoints.chat.messages(0);
  const q = withQuery.indexOf("?");
  const path = q >= 0 ? withQuery.slice(0, q) : withQuery;
  return `${API_BASE_URL}${path}`;
}

/**
 * Absolute MSW URL for a single profile detail.
 * Derived from `endpoints.profile.detail` so tests never hardcode `/users/:id`.
 */
export function mswProfileDetailUrl(id: string | number): string {
  return `${API_BASE_URL}${endpoints.profile.detail(id)}`;
}
