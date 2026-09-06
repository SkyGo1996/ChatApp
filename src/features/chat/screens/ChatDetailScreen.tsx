import {
  FlashList,
  type FlashListRef,
  type ListRenderItem,
} from "@shopify/flash-list";
import { useNavigation } from "expo-router";
import {
  forwardRef,
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
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
  type ScrollViewProps,
} from "react-native";
import {
  KeyboardChatScrollView,
  KeyboardGestureArea,
  KeyboardStickyView,
  type KeyboardChatScrollViewProps,
} from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { getRetryAfterMs, type ApiError } from "@/services/api/client";
import { useBlock } from "@/store/useBlock";
import { motion, space } from "@/theme/tokens";
import * as Haptics from "expo-haptics";

import { MessagesSquare } from "lucide-react-native";

import {
  CHAT_INPUT_NATIVE_ID,
  ChatHeaderTitle,
  Composer,
  DateSeparator,
  MessageBubble,
  MessageShimmer,
  ScrollToBottomFAB,
} from "@/features/chat/components";
import { useContactIdentity } from "@/features/chat/hooks/useContactIdentity";
import { useMessages } from "@/features/chat/hooks/useMessages";
import { useSendMessage } from "@/features/chat/hooks/useSendMessage";
import {
  buildChatListItems,
  type ChatListItem,
} from "@/features/chat/screens/buildChatListItems";

const SCROLL_FAB_THRESHOLD_PX = 200;
/** Pill tap minHeight 48 (HIG/M3, not spacing scale) + wrap paddingTop space(2). */
const COMPOSER_HEIGHT_FALLBACK = 48 + space(2);
const COMPOSER_INSET_KEY = "composer-inset";
const HEADER_INSET_KEY = "header-inset";
/** Compact iOS nav bar content height (ChatHeaderTitle avatar is 44pt). */
const IOS_HEADER_BAR_HEIGHT = 44;

type Props = {
  conversationId: string;
  contactName?: string | undefined;
  contactAvatar?: string | undefined;
};

type ChatScrollViewProps = ScrollViewProps & KeyboardChatScrollViewProps;

const ChatScrollView = forwardRef<
  React.ElementRef<typeof KeyboardChatScrollView>,
  ChatScrollViewProps
>(function ChatScrollView(props, ref) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardChatScrollView
      {...props}
      ref={ref}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="interactive"
      // Composer keeps home-indicator padding; sticky opened-offset tucks it
      // into the keyboard, so list lift is keyboardHeight minus that tuck.
      offset={Math.max(0, insets.bottom - space(2))}
    />
  );
});

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

type ListInsetItem = {
  type: "inset";
  key: string;
  height: number;
};

type MessagesListItem = ChatListItem | ListInsetItem;

function keyExtractor(item: MessagesListItem): string {
  return item.key;
}

function getItemType(item: MessagesListItem): string {
  return item.type;
}

type MessagesListProps = {
  conversationId: string;
  composerHeight: number;
  onRetrySend: (localId: string) => void;
};

function MessagesList({
  conversationId,
  composerHeight,
  onRetrySend,
}: MessagesListProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const listRef = useRef<FlashListRef<MessagesListItem>>(null);
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
  const composerClearance = composerHeight + theme.space(2);
  // Transparent iOS header overlays the list; Android's opaque header already
  // consumes layout so the list starts below it.
  const headerClearance =
    Platform.OS === "ios"
      ? insets.top + IOS_HEADER_BAR_HEIGHT + theme.space(2)
      : 0;
  const listItems = useMemo((): MessagesListItem[] => {
    const built = buildChatListItems(items);
    // Spacers must be rows (not contentContainerStyle / ListHeader / ListFooter).
    // FlashList v2 startRenderingFromBottom only accounts for ViewHolder content.
    const rows: MessagesListItem[] = [];
    if (headerClearance > 0) {
      rows.push({
        type: "inset",
        key: HEADER_INSET_KEY,
        height: headerClearance,
      });
    }
    rows.push(...built, {
      type: "inset",
      key: COMPOSER_INSET_KEY,
      height: composerClearance,
    });
    return rows;
  }, [items, composerClearance, headerClearance]);

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => <ChatScrollView {...props} />,
    []
  );

  const renderItem = useCallback<ListRenderItem<MessagesListItem>>(
    ({ item }) => {
      if (item.type === "separator") {
        return <DateSeparator label={item.label} />;
      }
      if (item.type === "inset") {
        return (
          <View
            style={{ height: item.height }}
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          />
        );
      }
      return (
        <MessageBubble
          message={item.message}
          marginTop={item.marginTop}
          onRetrySend={onRetrySend}
        />
      );
    },
    [onRetrySend]
  );

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

  // Keep FlashList mounted during initial load and fade skeleton over it
  // so startRenderingFromBottom placement and scroll position do not jump
  // when `isPending` flips to data. Optimistic `me` rows stay visible.
  const showSkeleton = isPending && items.length === 0;

  if (isError && items.length === 0) {
    return (
      <View
        style={[
          styles.listWrap,
          { paddingBottom: composerClearance, paddingTop: headerClearance },
        ]}>
        <ErrorRetry
          message={messagesErrorMessage(error)}
          onRetry={() => {
            void refetch();
          }}
          retryDisabled={retryDisabled}
          retryAccessibilityLabel="Retry messages"
        />
      </View>
    );
  }

  if (!isPending && items.length === 0) {
    return (
      <View
        style={[
          styles.listWrap,
          styles.emptyWrap,
          { paddingBottom: composerClearance, paddingTop: headerClearance },
        ]}>
        <EmptyState
          title="No messages yet"
          secondary="Say hello to start the conversation."
          illustration={
            <MessagesSquare
              size={48}
              color={theme.colors.textSecondary}
              strokeWidth={1.5}
            />
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.listWrap}>
      <FlashList
        ref={listRef}
        testID="messages-list"
        data={listItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        onStartReached={onStartReached}
        onStartReachedThreshold={0.5}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={listHeader}
        extraData={`${composerHeight}:${headerClearance}:${showSkeleton ? 1 : 0}`}
        maintainVisibleContentPosition={{
          autoscrollToBottomThreshold: 0.2,
          startRenderingFromBottom: true,
        }}
        renderScrollComponent={renderScrollComponent}
        style={styles.list}
      />
      {showSkeleton ? (
        <Animated.View
          pointerEvents="none"
          entering={reduceMotion ? FadeIn.duration(0) : FadeIn.duration(150)}
          exiting={reduceMotion ? FadeOut.duration(0) : FadeOut.duration(200)}
          style={styles.skeletonOverlay(composerClearance, headerClearance)}>
          <MessageShimmer variant="page" />
        </Animated.View>
      ) : null}
      <ScrollToBottomFAB
        visible={fabVisible}
        onPress={scrollToBottom}
        bottomOffset={composerClearance}
      />
    </View>
  );
}

export default function ChatDetailScreen({
  conversationId,
  contactName,
  contactAvatar,
}: Props) {
  const navigation = useNavigation();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const [composerHeight, setComposerHeight] = useState(
    COMPOSER_HEIGHT_FALLBACK + Math.max(insets.bottom, space(2))
  );
  const contact = useContactIdentity(conversationId, {
    name: contactName,
    avatar: contactAvatar,
  });
  const { isBlocked, unblock } = useBlock(conversationId);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <ChatHeaderTitle
          conversationId={conversationId}
          name={contact.name}
          avatar={contact.avatar}
        />
      ),
    });
  }, [navigation, conversationId, contact.name, contact.avatar]);

  const onComposerHeightChange = useCallback((height: number) => {
    setComposerHeight((prev) => (prev === height ? prev : height));
  }, []);

  const onStickyLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setComposerHeight((prev) => (prev === h ? prev : h));
  }, []);

  const handleUnblock = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    unblock();
  }, [unblock]);

  const stickyOffset = useMemo(
    () => ({
      closed: 0,
      opened: Math.max(0, insets.bottom - space(2)),
    }),
    [insets.bottom]
  );

  const { send, retry } = useSendMessage(conversationId);
  const onSend = useCallback(
    (text: string) => {
      void send(text);
    },
    [send]
  );
  const onRetrySend = useCallback(
    (localId: string) => {
      void retry(localId);
    },
    [retry]
  );

  const body = (
    <KeyboardGestureArea
      interpolator="ios"
      style={styles.gesture}
      textInputNativeID={CHAT_INPUT_NATIVE_ID}>
      <MessagesList
        conversationId={conversationId}
        composerHeight={composerHeight}
        onRetrySend={onRetrySend}
      />
      {/* Absolute sticky composer floats over the list; a trailing list
           spacer reserves space so timestamps/bubbles never sit under the pill. */}
      <KeyboardStickyView offset={stickyOffset} style={styles.composerSticky}>
        <View onLayout={onStickyLayout} testID="composer-sticky-wrap">
          {isBlocked ? (
            <View
              testID="block-guard"
              style={styles.blockGuard}
              accessibilityRole="alert">
              <Text style={styles.blockGuardText} allowFontScaling>
                This Contact is blocked
              </Text>
              <Pressable
                onPress={handleUnblock}
                accessibilityRole="button"
                accessibilityLabel="Unblock"
                hitSlop={8}
                style={styles.blockGuardButton}>
                <Text style={styles.blockGuardButtonText} allowFontScaling>
                  Unblock
                </Text>
              </Pressable>
            </View>
          ) : null}
          <Composer
            onSend={onSend}
            disabled={isBlocked}
            onHeightChange={onComposerHeightChange}
          />
        </View>
      </KeyboardStickyView>
    </KeyboardGestureArea>
  );

  if (reduceMotion) {
    return <View style={styles.outer}>{body}</View>;
  }

  return (
    <Animated.View
      style={styles.outer}
      entering={FadeInUp.duration(motion.fadeUp.duration).withInitialValues({
        // Keep opacity at 1 — GlassView under opacity 0 never installs (expo-glass-effect).
        opacity: 1,
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
  gesture: {
    flex: 1,
  },
  listWrap: {
    flex: 1,
  },
  list: {
    backgroundColor: theme.colors.bg,
  },
  emptyWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  composerSticky: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 3,
  },
  blockGuard: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.space(2),
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(2),
    backgroundColor: theme.colors.bg,
  },
  blockGuardText: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.subhead.size,
    fontWeight: theme.type.subhead.weight,
    letterSpacing: theme.type.subhead.letterSpacing,
    lineHeight: theme.type.subhead.lineHeight,
  },
  blockGuardButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: theme.space(2),
  },
  blockGuardButtonText: {
    color: theme.colors.primary,
    fontSize: theme.type.callout.size,
    fontWeight: "600",
    letterSpacing: theme.type.callout.letterSpacing,
    lineHeight: theme.type.callout.lineHeight,
  },
  skeletonOverlay: (paddingBottom: number, paddingTop: number) => ({
    backgroundColor: theme.colors.bg,
    bottom: 0,
    left: 0,
    paddingBottom,
    paddingTop,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 2,
  }),
}));
