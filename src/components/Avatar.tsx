import { Image } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";
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
      style={styles.sized(size)}
      accessibilityIgnoresInvertColors>
      {showImage ? (
        <Image
          source={{ uri: uri as string }}
          style={styles.image(size)}
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
          style={styles.fallback(size)}
          accessibilityLabel={`${name} avatar`}>
          <Text style={styles.initials(fontSize, lineHeight)}>{initials}</Text>
        </View>
      )}
      {showImage && loading ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.loadingFill(size)]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  sized: (size: number) => ({
    borderRadius: size / 2,
    height: size,
    overflow: "hidden",
    width: size,
  }),
  image: (size: number) => ({
    borderRadius: size / 2,
    height: size,
    width: size,
  }),
  fallback: (size: number) => ({
    alignItems: "center",
    backgroundColor: theme.colors.surface3,
    borderRadius: size / 2,
    height: size,
    justifyContent: "center",
    width: size,
  }),
  loadingFill: (size: number) => ({
    backgroundColor: theme.colors.surface3,
    borderRadius: size / 2,
  }),
  initials: (fontSize: number, lineHeight: number) => ({
    color: theme.colors.textSecondary,
    fontSize,
    fontWeight: "600",
    lineHeight,
  }),
}));
