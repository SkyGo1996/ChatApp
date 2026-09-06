import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { AccessibilityInfo } from "react-native";

import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/services/api/client";
import { sanitizeMessageInput } from "@/utils/sanitize";

import { sendMessage } from "@/features/chat/api/sendMessage";
import type { Message } from "@/features/chat/types";
import type { ConversationsInfiniteData } from "@/features/conversations/hooks/useConversations";

import {
  appendOutgoing,
  findOutgoing,
  patchConversationPreview,
  replaceOutgoing,
  updateOutgoing,
} from "./outgoingCache";
import type { MessagesInfiniteData } from "./useMessages";

function announce(status: "sending" | "sent" | "failed"): void {
  void AccessibilityInfo.announceForAccessibility(status);
}

/**
 * Optimistic send for a Conversation: append `sending`, replace on 201,
 * patch Conversations preview locally, mark `failed` + manual retry.
 * Memory-only — lost on kill/restart. Mutations retry 0 (transport policy).
 */
export function useSendMessage(conversationId: string | number) {
  const queryClient = useQueryClient();
  const messagesKey = queryKeys.messages(conversationId);
  const conversationsKey = queryKeys.conversations();

  const mutation = useMutation({
    mutationFn: (input: { text: string }) =>
      sendMessage({ conversationId, text: input.text }),
  });

  const applySuccess = useCallback(
    (localId: string, sent: Message, haptic: boolean) => {
      queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) =>
        replaceOutgoing(old, localId, sent)
      );
      queryClient.setQueryData<ConversationsInfiniteData>(
        conversationsKey,
        (old) =>
          patchConversationPreview(
            old,
            conversationId,
            sent.text,
            sent.createdAt
          )
      );
      if (haptic) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      announce("sent");
    },
    [conversationId, conversationsKey, messagesKey, queryClient]
  );

  const applyFailure = useCallback(
    (localId: string) => {
      queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) =>
        updateOutgoing(old, localId, { status: "failed" })
      );
      announce("failed");
    },
    [messagesKey, queryClient]
  );

  const commitOutgoing = useCallback(
    async (localId: string, text: string, haptic: boolean): Promise<void> => {
      announce("sending");
      try {
        const sent = await mutation.mutateAsync({ text });
        applySuccess(localId, sent, haptic);
      } catch {
        applyFailure(localId);
      }
    },
    [applyFailure, applySuccess, mutation]
  );

  const send = useCallback(
    async (rawText: string): Promise<void> => {
      const text = sanitizeMessageInput(rawText);
      if (text === null) return;

      const localId = `local-${Crypto.randomUUID()}`;
      const optimistic: Message = {
        id: localId,
        text,
        sender: "me",
        createdAt: new Date().toISOString(),
        status: "sending",
      };
      queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) =>
        appendOutgoing(old, optimistic)
      );

      await commitOutgoing(localId, text, true);
    },
    [commitOutgoing, messagesKey, queryClient]
  );

  const retry = useCallback(
    async (localId: string): Promise<void> => {
      const data = queryClient.getQueryData<MessagesInfiniteData>(messagesKey);
      const existing = findOutgoing(data, localId);
      if (!existing || existing.status !== "failed") return;

      queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) =>
        updateOutgoing(old, localId, { status: "sending" })
      );

      await commitOutgoing(localId, existing.text, false);
    },
    [commitOutgoing, messagesKey, queryClient]
  );

  return {
    send,
    retry,
    isPending: mutation.isPending,
    error: mutation.error as ApiError | null,
  };
}
