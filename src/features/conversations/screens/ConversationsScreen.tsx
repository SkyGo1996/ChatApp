import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { MessagesSquare } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { EmptyState } from "@/components/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorRetry } from "@/components/ErrorRetry";
import { getRetryAfterMs, type ApiError } from "@/services/api/client";

import {
  ConversationRow,
  ConversationShimmer,
} from "@/features/conversations/components";
import { useConversations } from "@/features/conversations/hooks/useConversations";
import type { Conversation } from "@/features/conversations/types";

function conversationsErrorMessage(error: ApiError | null): string {
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

const renderConversationItem: ListRenderItem<Conversation> = ({ item }) => (
  <ConversationRow conversation={item} />
);

function keyExtractor(item: Conversation): string {
  return String(item.id);
}

function ConversationsList() {
  const { theme } = useUnistyles();
  const {
    items,
    isPending,
    isError,
    isRefetchError,
    isFetchNextPageError,
    error,
    refetch,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useConversations();

  const retryDisabled = useRetryDisabledUntil(error);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const onRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const listEmpty = useCallback(
    () => (
      <EmptyState
        title="No conversations"
        secondary="When you start chatting, conversations will show up here."
        illustration={
          <MessagesSquare
            size={48}
            color={theme.colors.textSecondary}
            strokeWidth={1.5}
          />
        }
      />
    ),
    [theme.colors.textSecondary]
  );

  const listFooter = useCallback(() => {
    if (isFetchNextPageError && items.length > 0) {
      return (
        <ErrorRetry
          variant="inline"
          message={conversationsErrorMessage(error)}
          onRetry={() => {
            void fetchNextPage();
          }}
          retryDisabled={retryDisabled}
          retryAccessibilityLabel="Retry conversations"
        />
      );
    }
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }, [
    isFetchNextPageError,
    items.length,
    error,
    fetchNextPage,
    retryDisabled,
    isFetchingNextPage,
    theme.colors.primary,
  ]);

  if (isPending) {
    return <ConversationShimmer />;
  }

  if (isError && items.length === 0) {
    return (
      <ErrorRetry
        message={conversationsErrorMessage(error)}
        onRetry={() => {
          void refetch();
        }}
        retryDisabled={retryDisabled}
        retryAccessibilityLabel="Retry conversations"
      />
    );
  }

  return (
    <View style={styles.listWrap}>
      {isRefetchError && items.length > 0 ? (
        <ErrorRetry
          variant="inline"
          message={conversationsErrorMessage(error)}
          onRetry={() => {
            void refetch();
          }}
          retryDisabled={retryDisabled}
          retryAccessibilityLabel="Retry conversations"
        />
      ) : null}
      <FlashList
        testID="conversations-list"
        data={items}
        renderItem={renderConversationItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
}

export default function ConversationsScreen() {
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <ErrorBoundary retryAccessibilityLabel="Retry screen">
          <ConversationsList />
        </ErrorBoundary>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  outer: {
    backgroundColor: theme.colors.bg,
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    // flexGrow so EmptyState (flex:1) can viewport-center when the list is empty
    flexGrow: 1,
    // Clear floating tab bar (~64) + space(4)
    paddingBottom: 64 + theme.space(4),
  },
  footer: {
    alignItems: "center",
    paddingVertical: theme.space(3),
  },
}));
