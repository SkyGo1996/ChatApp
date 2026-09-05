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
 * Absolute MSW path for the posts collection.
 * Derived from `endpoints.chat.messages` so tests never hardcode `/posts`.
 */
export function mswMessagesCollectionUrl(): string {
  return `${API_BASE_URL}${endpoints.chat.messages(0)}`;
}
