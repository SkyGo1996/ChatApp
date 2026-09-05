export const endpoints = {
  conversations: {
    list: "/users",
  },
  chat: {
    /** Path only — pass `userId` (and pagination) via axios `params`. */
    messages: (_conversationId: string | number) => "/posts",
    send: "/posts",
  },
  profile: {
    detail: (contactId: string | number) => `/users/${contactId}`,
  },
} as const;
