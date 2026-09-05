import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet as RNStyleSheet, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Shimmer } from "@/components/Shimmer";
import { initialsFromName } from "@/utils/initials";

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
  /** FlashList recycling key — resets content when the recycled cell changes identity. */
  recyclingKey?: string;
  testID?: string;
};

/**
 * Circular avatar via expo-image (`memory-disk` cache).
 * Shows shimmer while loading; falls back to initials on error / missing uri.
 * Remounts on uri/recyclingKey change so FlashList reuse cannot stick failed/loading.
 */
export function Avatar(props: Props) {
  const { uri, recyclingKey } = props;
  return (
    <AvatarContent key={`${recyclingKey ?? ""}:${uri ?? ""}`} {...props} />
  );
}

function AvatarContent({ name, uri, size = 48, recyclingKey, testID }: Props) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(uri));
  const showImage = Boolean(uri) && !failed;
  const initials = initialsFromName(name);
  const fontSize = Math.max(12, Math.round(size * 0.35));
  // Pair lineHeight with fontSize (~caption1 16/12 ratio).
  const lineHeight = Math.round(fontSize * (16 / 12));

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      accessibilityIgnoresInvertColors>
      {showImage ? (
        <Image
          source={{ uri: uri as string }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          cachePolicy="memory-disk"
          contentFit="cover"
          priority="normal"
          recyclingKey={recyclingKey ?? null}
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={() => {
            setFailed(true);
            setLoading(false);
          }}
          accessibilityLabel={`${name} avatar`}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          accessibilityLabel={`${name} avatar`}>
          <Text style={[styles.initials, { fontSize, lineHeight }]}>
            {initials}
          </Text>
        </View>
      )}
      {showImage && loading ? (
        <View style={RNStyleSheet.absoluteFill} pointerEvents="none">
          <Shimmer width={size} height={size} borderRadius={size / 2} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    overflow: "hidden",
  },
  fallback: {
    alignItems: "center",
    backgroundColor: theme.colors.surface3,
    justifyContent: "center",
  },
  initials: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
}));
