import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorRetry } from "@/components/ErrorRetry";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { getRetryAfterMs, type ApiError } from "@/services/api/client";
import { motion } from "@/theme/tokens";

import {
  DateSeparator,
  MessageBubble,
  MessageShimmer,
} from "@/features/chat/components";
import { useMessages } from "@/features/chat/hooks/useMessages";
import {
  buildChatListItems,
  type ChatListItem,
} from "@/features/chat/lib/buildChatListItems";

type Props = {
  conversationId: string;
};

function messagesErrorMessage(error: ApiError | null): string {
  if (!error) return "Something went wrong.";
  if (error.status === undefined || error.status === null) {
    return "You're offline / request timed out";
  }
  if (error.status === 429) {
    return "Too many requests — try again";
  }
  return "Something went wrong.";
}

function useRetryDisabledUntil(error: ApiError | null): boolean {
  const [trackedError, setTrackedError] = useState(error);
  const [disabled, setDisabled] = useState(() => error?.status === 429);

  if (error !== trackedError) {
    setTrackedError(error);
    setDisabled(error?.status === 429);
  }

  useEffect(() => {
    if (error?.status !== 429) return;
    const ms = getRetryAfterMs(error.retryAfter, error.headers);
    const wait = Math.max(1000, ms ?? 1000);
    const id = setTimeout(() => {
      setDisabled(false);
    }, wait);
    return () => clearTimeout(id);
  }, [error]);

  return disabled;
}

const renderChatItem: ListRenderItem<ChatListItem> = ({ item }) => {
  if (item.type === "separator") {
    return <DateSeparator label={item.label} />;
  }
  return (
    <MessageBubble
      message={item.message}
      group={item.group}
      marginTop={item.marginTop}
    />
  );
};

function keyExtractor(item: ChatListItem): string {
  return item.key;
}

function getItemType(item: ChatListItem): string {
  return item.type;
}

function MessagesList({ conversationId }: { conversationId: string }) {
  const { theme } = useUnistyles();
  const {
    items,
    isPending,
    isError,
    error,
    refetch,
    isFetchingPreviousPage,
    isFetchPreviousPageError,
    hasPreviousPage,
    fetchPreviousPage,
  } = useMessages(conversationId);

  const retryDisabled = useRetryDisabledUntil(error);
  const listItems = useMemo(() => buildChatListItems(items), [items]);

  const onStartReached = useCallback(() => {
    if (
      hasPreviousPage &&
      !isFetchingPreviousPage &&
      !isFetchPreviousPageError
    ) {
      void fetchPreviousPage();
    }
  }, [
    hasPreviousPage,
    isFetchingPreviousPage,
    isFetchPreviousPageError,
    fetchPreviousPage,
  ]);

  const listHeader = useCallback(() => {
    if (isFetchPreviousPageError && items.length > 0) {
      return (
        <ErrorRetry
          variant="inline"
          message={messagesErrorMessage(error)}
          onRetry={() => {
            void fetchPreviousPage();
          }}
          retryDisabled={retryDisabled}
          retryAccessibilityLabel="Retry messages"
        />
      );
    }
    if (isFetchingPreviousPage) {
      return <MessageShimmer variant="header" />;
    }
    return null;
  }, [
    isFetchPreviousPageError,
    items.length,
    error,
    fetchPreviousPage,
    retryDisabled,
    isFetchingPreviousPage,
  ]);

  if (isPending) {
    return <MessageShimmer variant="page" />;
  }

  if (isError && items.length === 0) {
    return (
      <ErrorRetry
        message={messagesErrorMessage(error)}
        onRetry={() => {
          void refetch();
        }}
        retryDisabled={retryDisabled}
        retryAccessibilityLabel="Retry messages"
      />
    );
  }

  return (
    <View style={styles.listWrap}>
      <FlashList
        testID="messages-list"
        data={listItems}
        renderItem={renderChatItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        onStartReached={onStartReached}
        onStartReachedThreshold={0.5}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        maintainVisibleContentPosition={{
          autoscrollToBottomThreshold: 0.2,
          startRenderingFromBottom: true,
        }}
        style={{ backgroundColor: theme.colors.bg }}
      />
    </View>
  );
}

export default function ChatDetailScreen({ conversationId }: Props) {
  const reduceMotion = useReduceMotion();

  const body = (
    <ErrorBoundary retryAccessibilityLabel="Retry screen">
      <MessagesList conversationId={conversationId} />
    </ErrorBoundary>
  );

  if (reduceMotion) {
    return <View style={styles.outer}>{body}</View>;
  }

  return (
    <Animated.View
      style={styles.outer}
      entering={FadeInUp.duration(motion.fadeUp.duration).withInitialValues({
        opacity: motion.fadeUp.from.opacity,
        transform: [{ translateY: motion.fadeUp.from.translateY }],
      })}>
      {body}
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  outer: {
    backgroundColor: theme.colors.bg,
    flex: 1,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space(4),
  },
}));
