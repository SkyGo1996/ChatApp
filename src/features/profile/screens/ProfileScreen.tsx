import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { Phone } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Avatar } from "@/components/Avatar";
import { ErrorRetry } from "@/components/ErrorRetry";
import { Shimmer } from "@/components/Shimmer";
import { BlockConfirm, ProfileWash } from "@/features/profile/components";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useRetryDisabledUntil } from "@/hooks/useRetryDisabledUntil";
import { type ApiError } from "@/services/api/client";
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
      <BlockConfirm contactId={contactId} name={data.name} />
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

const styles = StyleSheet.create((theme) => {
  return {
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
    blockRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.space(3),
      minHeight: 44,
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
  };
});
