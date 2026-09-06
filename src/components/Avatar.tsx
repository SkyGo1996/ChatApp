import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet as RNStyleSheet, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

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
 * Static surface placeholder while loading; initials on error / missing uri.
 * Resets failed/loading on uri/recyclingKey change without remounting (FlashList recycle).
 */
export function Avatar({ name, uri, size = 48, recyclingKey, testID }: Props) {
  const identity = `${recyclingKey ?? ""}:${uri ?? ""}`;
  const [trackedIdentity, setTrackedIdentity] = useState(identity);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(uri));

  if (identity !== trackedIdentity) {
    setTrackedIdentity(identity);
    setFailed(false);
    setLoading(Boolean(uri));
  }

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
          transition={0}
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
        <View
          pointerEvents="none"
          style={[
            RNStyleSheet.absoluteFill,
            styles.loadingFill,
            { borderRadius: size / 2 },
          ]}
        />
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
  loadingFill: {
    backgroundColor: theme.colors.surface3,
  },
  initials: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
}));
