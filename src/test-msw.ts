import { client } from "@/services/api/client";

/**
 * Point the shared axios client at an adapter msw can intercept in Jest.
 * RN/browser axios builds stub Node `http` as null; use `fetch` instead.
 */
export function useNodeHttpAdapterForMsw(): void {
  client.defaults.adapter = "fetch";
}
