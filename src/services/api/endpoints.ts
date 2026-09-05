export type MessagesQueryParams = {
  limit?: number;
  offset?: number;
};

export const endpoints = {
  conversations: {
    list: "/users",
  },
  chat: {
    /**
     * Builds `/posts?userId=&limit=&offset=` via URLSearchParams.
     * Callers must not pass axios `params` — the query lives on the path
     * so Jest's fetch adapter cannot double-append `?`.
     */
    messages: (
      conversationId: string | number,
      params?: MessagesQueryParams
    ) => {
      const search = new URLSearchParams();
      search.set("userId", String(conversationId));
      if (params?.limit !== undefined) {
        search.set("limit", String(params.limit));
      }
      if (params?.offset !== undefined) {
        search.set("offset", String(params.offset));
      }
      return `/posts?${search.toString()}`;
    },
    send: "/posts",
  },
  profile: {
    detail: (contactId: string | number) => `/users/${contactId}`,
  },
} as const;
