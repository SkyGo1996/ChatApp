import Constants from "expo-constants";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

import { MeCard, ThemeSegmentedControl } from "@/features/settings/components";
import { APP_VERSION_FALLBACK } from "@/features/settings/constants";

function getAppVersion(): string {
  const fromExpoConfig = (
    Constants.expoConfig as { version?: string } | undefined
  )?.version;
  if (fromExpoConfig) return fromExpoConfig;
  const fromManifest = (
    Constants as unknown as { manifest?: { version?: string } }
  ).manifest?.version;
  if (fromManifest) return fromManifest;
  return APP_VERSION_FALLBACK;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const version = getAppVersion();

  return (
    // collapsable={false}: iOS NativeTabs treats first nested ScrollView specially
    // for insets / scroll-edge; wrappers must not collapse away.
    <View style={styles.outer} collapsable={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
        testID="settings-scrollview">
        {/* Identity section — grouped inset list card with outer + row padding */}
        <View
          style={styles.card}
          accessibilityLabel="Current user"
          testID="settings-identity-card">
          <MeCard />
        </View>

        {/* Theme section — grouped inset card with label + platform-adaptive segmented pill */}
        <View style={styles.card} testID="settings-theme-card">
          <View style={styles.themeHeader}>
            <Text
              style={styles.sectionTitle}
              allowFontScaling
              accessibilityRole="header">
              Theme
            </Text>
          </View>
          <ThemeSegmentedControl />
        </View>

        {/* Version — secondary caption text sourced from app config (expo-constants) */}
        <Text style={styles.version} allowFontScaling testID="settings-version">
          Version {version}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  outer: {
    backgroundColor: theme.colors.bg,
    flex: 1,
  },
  scroll: {
    backgroundColor: theme.colors.bg,
    flex: 1,
  },
  content: {
    gap: theme.space(3),
    padding: theme.space(4),
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(4),
    width: "100%",
  },
  themeHeader: {
    marginBottom: theme.space(3),
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.footnote.size,
    fontWeight: "600",
    letterSpacing: theme.type.footnote.letterSpacing,
    lineHeight: theme.type.footnote.lineHeight,
    textTransform: "uppercase",
  },
  version: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.caption1.size,
    fontWeight: theme.type.caption1.weight,
    letterSpacing: theme.type.caption1.letterSpacing,
    lineHeight: theme.type.caption1.lineHeight,
    marginTop: theme.space(1),
    textAlign: "center",
  },
}));
