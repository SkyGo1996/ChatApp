import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  link: {
    marginTop: 12,
  },
});
