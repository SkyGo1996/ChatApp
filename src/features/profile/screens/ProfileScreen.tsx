import { StyleSheet, Text, View } from "react-native";

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

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
});
