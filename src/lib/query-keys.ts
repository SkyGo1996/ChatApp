export const queryKeys = {
  conversations: () => ["conversations"] as const,
  messages: (conversationId: string | number) =>
    ["messages", String(conversationId)] as const,
  profile: (contactId: string | number) =>
    ["profile", String(contactId)] as const,
} as const;
