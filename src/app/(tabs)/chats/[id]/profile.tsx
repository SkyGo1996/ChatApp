import { useLocalSearchParams } from "expo-router";
import ProfileScreen from "@/features/profile/screens/ProfileScreen";

export default function ProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileScreen contactId={id ?? ""} />;
}
