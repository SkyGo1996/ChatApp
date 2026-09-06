import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { Phone } from "lucide-react-native";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Avatar } from "@/components/Avatar";
import { ErrorRetry } from "@/components/ErrorRetry";
import { Shimmer } from "@/components/Shimmer";
import { BlockConfirm } from "@/features/profile/components/BlockConfirm";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useReduceTransparency } from "@/hooks/useReduceTransparency";
import { getRetryAfterMs, type ApiError } from "@/services/api/client";
import { chromeSheet, glassColorScheme } from "@/theme/recipes";
import { motion } from "@/theme/tokens";

import { useProfile } from "@/features/profile/hooks/useProfile";

type Props = {
  contactId: string;
};

const AVATAR_SIZE = 108;

function profileErrorMessage(error: ApiError | null): string {
  if (!error) return "Something went wrong.";
  if (error.status === 404) return "Contact not found";
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

function ProfileWash({
  children,
  style,
}: {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
}) {
  const { theme } = useUnistyles();
  const reduceTransparency = useReduceTransparency();
  const chrome = chromeSheet(theme);

  if (Platform.OS === "android") {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: chrome.backgroundColor,
            borderColor: chrome.borderColor,
            borderWidth: chrome.borderWidth,
            elevation: chrome.elevation,
          },
        ]}>
        {children}
      </View>
    );
  }

  const canGlass =
    !reduceTransparency &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  // Host fill covers native empty-effect dark frame; never opaque-fill GlassView.
  const iosBorder = {
    borderColor: chrome.borderColor,
    borderWidth: chrome.borderWidth,
  };
  const hostFill = { backgroundColor: chrome.backgroundColor };

  if (canGlass) {
    return (
      <View style={[styles.glassHost, theme.shadow, hostFill]}>
        <GlassView
          style={[style, iosBorder]}
          tintColor={theme.colors.glassTint}
          colorScheme={glassColorScheme(theme)}
          glassEffectStyle="regular">
          {children}
        </GlassView>
      </View>
    );
  }

  if (!reduceTransparency && chrome.useGlass) {
    return (
      <View style={[styles.glassHost, theme.shadow, hostFill]}>
        <BlurView
          intensity={chrome.blurRadius ?? theme.blur.full}
          tint="default"
          style={[style, iosBorder, hostFill, { overflow: "hidden" as const }]}>
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View
      style={[
        style,
        {
          backgroundColor: chrome.backgroundColor,
          borderColor: theme.colors.border,
          borderWidth: 1,
        },
      ]}>
      {children}
    </View>
  );
}

function ProfileShimmer() {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, theme.space(4)) },
      ]}
      accessibilityLabel="Loading profile"
      accessibilityRole="progressbar">
      {/* Header card shimmer — mirrors WhatsApp photo+name+phone header */}
      <ProfileWash style={styles.card}>
        <View style={styles.identityStack} testID="profile-shimmer">
          <Shimmer
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            borderRadius={AVATAR_SIZE / 2}
          />
          <Shimmer width={140} height={16} style={styles.shimmerName} />
          <Shimmer width={160} height={14} />
        </View>
      </ProfileWash>
      {/* Details card shimmer */}
      <ProfileWash style={styles.card}>
        <View style={styles.shimmerDetails}>
          <Shimmer width={36} height={36} borderRadius={18} />
          <View style={styles.shimmerDetailsTexts}>
            <Shimmer width={120} height={14} />
            <Shimmer width={80} height={12} style={styles.shimmerSub} />
          </View>
        </View>
      </ProfileWash>
      {/* Block danger-zone shimmer */}
      <ProfileWash style={styles.blockCard}>
        <View style={styles.blockRow}>
          <Shimmer width={20} height={20} borderRadius={10} />
          <Shimmer width={110} height={14} style={styles.shimmerBlock} />
        </View>
      </ProfileWash>
    </ScrollView>
  );
}

function ContactDetailsCard({ phone }: { phone: string }) {
  const { theme } = useUnistyles();

  const handlePhonePress = useCallback(() => {
    const url = `tel:${phone}`;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(url);
  }, [phone]);

  return (
    <ProfileWash style={styles.card}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle} allowFontScaling>
          Contact info
        </Text>
        <Pressable
          onPress={handlePhonePress}
          accessibilityRole="button"
          accessibilityLabel={`Call ${phone}`}
          accessibilityHint="Opens phone app"
          hitSlop={8}
          style={styles.row}>
          <View style={styles.rowIconWrap}>
            <Phone size={20} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.rowTexts}>
            <Text style={styles.rowValue} allowFontScaling>
              {phone}
            </Text>
            <Text style={styles.rowLabel} allowFontScaling>
              Mobile
            </Text>
          </View>
        </Pressable>
      </View>
    </ProfileWash>
  );
}

function BlockSection({
  contactId,
  name,
}: {
  contactId: string;
  name: string;
}) {
  return <BlockConfirm contactId={contactId} name={name} />;
}

export default function ProfileScreen({ contactId }: Props) {
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const { data, isPending, isError, error, refetch } = useProfile(contactId);
  const retryDisabled = useRetryDisabledUntil(error);

  if (isPending) {
    return (
      <View style={styles.outer}>
        <ProfileShimmer />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.outer}>
        <ErrorRetry
          message={profileErrorMessage(error)}
          onRetry={() => {
            void refetch();
          }}
          retryDisabled={retryDisabled}
          retryAccessibilityLabel="Retry profile"
        />
      </View>
    );
  }

  const content = (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, theme.space(4)) },
      ]}>
      <View style={styles.identityStack}>
        <Avatar
          name={data.name}
          uri={data.avatar}
          size={AVATAR_SIZE}
          recyclingKey={String(data.id)}
          testID="profile-avatar"
        />
        <Text style={styles.name} allowFontScaling accessibilityRole="header">
          {data.name}
        </Text>
      </View>

      {/* Contact details — WhatsApp Contact info section; phone row with tel: link, no About/bio */}
      <ContactDetailsCard phone={data.phone} />

      {/* Danger zone — WhatsApp Block/Report bottom group; Block entry wired to useBlock, Report omitted (no report feature in v1) */}
      <BlockSection contactId={contactId} name={data.name} />
    </ScrollView>
  );

  if (reduceMotion) {
    return <View style={styles.outer}>{content}</View>;
  }

  return (
    <Animated.View
      style={styles.outer}
      entering={FadeInUp.duration(motion.fadeUp.duration).withInitialValues({
        // Keep opacity at 1 — GlassView under opacity 0 never installs (expo-glass-effect).
        opacity: 1,
        transform: [{ translateY: motion.fadeUp.from.translateY }],
      })}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  outer: {
    backgroundColor: theme.colors.bg,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: theme.space(3),
    padding: theme.space(4),
  },
  glassHost: {
    borderRadius: theme.radius.lg,
  },
  card: {
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(6),
    width: "100%",
  },
  // Header — WhatsApp photo+name+phone card (ticket 10: 108pt within 96–120pt, title2/phone)
  identityStack: {
    alignItems: "center",
    gap: theme.space(3),
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.type.title2.size,
    fontWeight: theme.type.title2.weight,
    letterSpacing: theme.type.title2.letterSpacing,
    lineHeight: theme.type.title2.lineHeight,
    textAlign: "center",
  },
  phone: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.body.size,
    fontWeight: theme.type.body.weight,
    letterSpacing: theme.type.body.letterSpacing,
    lineHeight: theme.type.body.lineHeight,
    textAlign: "center",
  },
  // Section — WhatsApp grouped-inset feel (Contact info label + inset row)
  section: {
    gap: theme.space(3),
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.footnote.size,
    fontWeight: "600",
    letterSpacing: theme.type.footnote.letterSpacing,
    lineHeight: theme.type.footnote.lineHeight,
    textTransform: "uppercase",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.space(3),
    minHeight: 44,
  },
  rowIconWrap: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  rowTexts: {
    flex: 1,
    gap: theme.space(1),
  },
  rowValue: {
    color: theme.colors.text,
    fontSize: theme.type.body.size,
    fontWeight: theme.type.body.weight,
    letterSpacing: theme.type.body.letterSpacing,
    lineHeight: theme.type.body.lineHeight,
  },
  rowLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.subhead.size,
    fontWeight: theme.type.subhead.weight,
    letterSpacing: theme.type.subhead.letterSpacing,
    lineHeight: theme.type.subhead.lineHeight,
  },
  // Block — WhatsApp danger-zone card (destructive when unblocked, primary when blocked)
  blockCard: {
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(2),
    width: "100%",
  },
  blockRowPressable: {
    minHeight: 44,
    justifyContent: "center",
  },
  blockRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.space(3),
    minHeight: 44,
  },
  blockText: {
    fontSize: theme.type.body.size,
    fontWeight: "600",
    letterSpacing: theme.type.body.letterSpacing,
    lineHeight: theme.type.body.lineHeight,
  },
  // Shimmer — grouped sections
  shimmerName: {
    marginTop: theme.space(2),
  },
  shimmerDetails: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.space(3),
  },
  shimmerDetailsTexts: {
    flex: 1,
    gap: theme.space(2),
  },
  shimmerSub: {
    marginTop: theme.space(1),
  },
  shimmerBlock: {
    marginLeft: theme.space(1),
  },
}));
