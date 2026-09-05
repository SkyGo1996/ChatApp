import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Avatar } from "@/components/Avatar";

type Props = {
  conversationId: string;
  name: string;
  avatar?: string | null;
};

/**
 * Stack header title: 44pt Avatar + Contact name.
 * Tapping either navigates to Profile.
 */
export function ChatHeaderTitle({ conversationId, name, avatar }: Props) {
  return (
    <Link
      href={{
        pathname: "/(tabs)/chats/[id]/profile",
        params: { id: conversationId },
      }}
      asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View profile for ${name}`}
        accessibilityHint="Opens Contact profile"
        style={styles.pressable}
        hitSlop={8}>
        <View style={styles.row}>
          <Avatar
            name={name}
            uri={avatar ?? null}
            size={44}
            recyclingKey={conversationId}
          />
          <Text style={styles.name} numberOfLines={1} allowFontScaling>
            {name}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create((theme) => ({
  pressable: {
    maxWidth: "100%",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.space(2),
    maxWidth: 260,
  },
  name: {
    color: theme.colors.text,
    flexShrink: 1,
    fontSize: theme.type.headline.size,
    fontWeight: theme.type.headline.weight,
    letterSpacing: theme.type.headline.letterSpacing,
    lineHeight: theme.type.headline.lineHeight,
  },
}));
