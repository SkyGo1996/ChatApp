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
