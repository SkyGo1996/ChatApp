import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
  contactId: string;
};

export default function ProfileScreen({ contactId }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile {contactId}</Text>
      <Text style={styles.subtitle}>Profile placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    backgroundColor: theme.colors.bg,
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing(4),
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(1),
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
}));
