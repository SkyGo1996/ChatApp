import {
  FlashList,
  type FlashListRef,
  type ListRenderItem,
} from "@shopify/flash-list";
import { useNavigation } from "expo-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorRetry } from "@/components/ErrorRetry";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { getRetryAfterMs, type ApiError } from "@/services/api/client";
import { chromeHeader } from "@/theme/recipes";
import { motion } from "@/theme/tokens";

import {
  ChatHeaderTitle,
  DateSeparator,
  MessageBubble,
  MessageShimmer,
  ScrollToBottomFAB,
} from "@/features/chat/components";
import { useContactIdentity } from "@/features/chat/hooks/useContactIdentity";
import { useMessages } from "@/features/chat/hooks/useMessages";
import {
  buildChatListItems,
  type ChatListItem,
} from "@/features/chat/lib/buildChatListItems";

const SCROLL_FAB_THRESHOLD_PX = 200;

type Props = {
  conversationId: string;
  contactName?: string | undefined;
  contactAvatar?: string | undefined;
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
  const reduceMotion = useReduceMotion();
  const listRef = useRef<FlashListRef<ChatListItem>>(null);
  const [fabVisible, setFabVisible] = useState(false);

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

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      setFabVisible(distanceFromBottom > SCROLL_FAB_THRESHOLD_PX);
    },
    []
  );

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: !reduceMotion });
  }, [reduceMotion]);

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
        ref={listRef}
        testID="messages-list"
        data={listItems}
        renderItem={renderChatItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        onStartReached={onStartReached}
        onStartReachedThreshold={0.5}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        maintainVisibleContentPosition={{
          autoscrollToBottomThreshold: 0.2,
          startRenderingFromBottom: true,
        }}
        style={{ backgroundColor: theme.colors.bg }}
      />
      <ScrollToBottomFAB visible={fabVisible} onPress={scrollToBottom} />
    </View>
  );
}

export default function ChatDetailScreen({
  conversationId,
  contactName,
  contactAvatar,
}: Props) {
  const navigation = useNavigation();
  const { theme } = useUnistyles();
  const reduceMotion = useReduceMotion();
  const contact = useContactIdentity(conversationId, {
    name: contactName,
    avatar: contactAvatar,
  });
  const chrome = chromeHeader(theme);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <ChatHeaderTitle
          conversationId={conversationId}
          name={contact.name}
          avatar={contact.avatar}
        />
      ),
      ...(Platform.OS === "ios"
        ? {
            headerTransparent: true,
            headerBlurEffect: "systemChromeMaterial",
            // Avoid stacking iOS 26+ automatic scrollEdgeEffects with headerBlurEffect.
            scrollEdgeEffects: {
              top: "hidden",
              bottom: "hidden",
              left: "hidden",
              right: "hidden",
            },
            headerStyle: { backgroundColor: "transparent" },
            headerShadowVisible: false,
          }
        : {
            headerTransparent: false,
            headerStyle: {
              backgroundColor: chrome.backgroundColor,
            },
            headerShadowVisible: chrome.elevation > 0,
          }),
    });
  }, [
    navigation,
    conversationId,
    contact.name,
    contact.avatar,
    chrome.backgroundColor,
    chrome.elevation,
  ]);

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
