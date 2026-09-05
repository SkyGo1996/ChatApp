export const endpoints = {
  conversations: {
    list: "/users",
  },
  chat: {
    messages: (conversationId: string | number) =>
      `/posts?userId=${conversationId}`,
    send: "/posts",
  },
  profile: {
    detail: (contactId: string | number) => `/users/${contactId}`,
  },
} as const;
