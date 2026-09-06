import { queryOptions, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/services/api/client";

import { fetchProfile } from "@/features/profile/api/fetchProfile";

export function profileQueryOptions(contactId: string | number) {
  return queryOptions({
    queryKey: queryKeys.profile(contactId),
    queryFn: () => fetchProfile(contactId),
  });
}

/**
 * Single-resource Profile query for GET /users/:id.
 * Caching/retry comes from global QueryClient defaults (staleTime 5m, GET 1 retry).
 */
export function useProfile(contactId: string | number) {
  const query = useQuery(profileQueryOptions(contactId));
  return {
    ...query,
    error: query.error as ApiError | null,
  };
}
