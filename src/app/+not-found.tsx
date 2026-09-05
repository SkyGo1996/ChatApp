import { Link } from "expo-router";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text>Not found</Text>
      <Link href="/(tabs)/chats" style={styles.link}>
        Go to Chats
      </Link>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    backgroundColor: theme.colors.bg,
    flex: 1,
    justifyContent: "center",
  },
  link: {
    color: theme.colors.primary,
    marginTop: theme.space(3),
  },
}));
