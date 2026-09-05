import ProfileScreen from "@/features/profile/screens/ProfileScreen";
import { useLocalSearchParams } from "expo-router";

export default function ProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileScreen contactId={id ?? ""} />;
}
