import { StyleSheet, Text, View } from "react-native";

export default function ChatsScreen() {
  return (
    <View style={styles.container}>
      <Text>Chats</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
