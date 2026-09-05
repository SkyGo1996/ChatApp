import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Settings placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    backgroundColor: theme.colors.bg,
    flex: 1,
    justifyContent: "center",
    padding: theme.space(4),
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: theme.space(1),
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
}));
