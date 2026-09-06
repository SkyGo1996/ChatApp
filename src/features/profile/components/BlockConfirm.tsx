import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { Ban } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { useReduceTransparency } from "@/hooks/useReduceTransparency";
import { useBlock } from "@/store/useBlock";
import { chromeSheet } from "@/theme/recipes";

import {
  AlertDialog,
  Host as ComposeHost,
  Text as ComposeText,
  TextButton,
} from "@expo/ui/jetpack-compose";
import {
  Alert,
  Button as SwiftUIButton,
  Host as SwiftUIHost,
} from "@expo/ui/swift-ui";

type Props = {
  contactId: string;
  name: string;
};

function ProfileWash({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: import("react-native").StyleProp<import("react-native").ViewStyle>;
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

  const iosFill = {
    backgroundColor: chrome.backgroundColor,
    borderColor: chrome.borderColor,
    borderWidth: chrome.borderWidth,
    overflow: "hidden" as const,
  };

  if (canGlass) {
    return (
      <View style={[styles.glassHost, theme.shadow]}>
        <GlassView
          style={[style, iosFill]}
          tintColor={theme.colors.glassTint}
          glassEffectStyle="regular">
          {children}
        </GlassView>
      </View>
    );
  }

  if (!reduceTransparency && chrome.useGlass) {
    return (
      <View style={[styles.glassHost, theme.shadow]}>
        <BlurView
          intensity={chrome.blurRadius ?? theme.blur.full}
          tint="default"
          style={[style, iosFill]}>
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

export function BlockConfirm({ contactId, name }: Props) {
  const { theme } = useUnistyles();
  const { isBlocked, block, unblock } = useBlock(contactId);
  const [isPresented, setIsPresented] = useState(false);

  const title = `Block ${name}?`;
  const label = isBlocked ? `Unblock ${name}` : `Block ${name}`;
  const color = isBlocked ? theme.colors.primary : theme.colors.destructive;

  const handlePress = useCallback(() => {
    if (isBlocked) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      unblock();
    } else {
      setIsPresented(true);
    }
  }, [isBlocked, unblock]);

  const handleConfirmBlock = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    block();
    setIsPresented(false);
  }, [block]);

  const handleCancel = useCallback(() => {
    setIsPresented(false);
  }, []);

  const iosAlert =
    Platform.OS === "ios" ? (
      <SwiftUIHost style={styles.hostHidden} pointerEvents="none">
        <Alert
          title={title}
          isPresented={isPresented}
          onIsPresentedChange={setIsPresented}>
          <Alert.Trigger>
            <SwiftUIButton
              label="trigger"
              onPress={() => setIsPresented(true)}
            />
          </Alert.Trigger>
          <Alert.Actions>
            <SwiftUIButton
              label="Block"
              role="destructive"
              onPress={handleConfirmBlock}
            />
            <SwiftUIButton
              label="Cancel"
              role="cancel"
              onPress={handleCancel}
            />
          </Alert.Actions>
        </Alert>
      </SwiftUIHost>
    ) : null;

  const androidAlert =
    Platform.OS === "android" && isPresented ? (
      <ComposeHost style={styles.hostHidden}>
        <AlertDialog onDismissRequest={handleCancel}>
          <AlertDialog.Title>
            <ComposeText>{title}</ComposeText>
          </AlertDialog.Title>
          <AlertDialog.ConfirmButton>
            <TextButton onClick={handleConfirmBlock}>
              <ComposeText>Block</ComposeText>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={handleCancel}>
              <ComposeText>Cancel</ComposeText>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      </ComposeHost>
    ) : null;

  // iOS AlertDialog fallback for jest (default Platform OS is ios in jest-expo);
  // when running on ios, androidAlert is null, but tests that set Platform.OS to android need coverage.
  // Provide non-Platform guard for tests that force Platform.OS.
  // Already handled above.

  return (
    <>
      <ProfileWash style={styles.blockCard}>
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={
            isBlocked ? "Unblocks this contact" : "Blocks this contact"
          }
          hitSlop={8}
          style={styles.blockRowPressable}>
          <View style={styles.blockRow}>
            <Ban size={20} color={color} />
            <Text style={[styles.blockText, { color }]} allowFontScaling>
              {label}
            </Text>
          </View>
        </Pressable>
      </ProfileWash>
      {iosAlert}
      {androidAlert}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  glassHost: {
    borderRadius: theme.radius.lg,
  },
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
  hostHidden: {
    position: "absolute",
    height: 0,
    width: 0,
    opacity: 0,
  },
}));
