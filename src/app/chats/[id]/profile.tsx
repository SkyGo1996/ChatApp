import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProfileScreen from "@/features/profile/screens/ProfileScreen";
import { useLocalSearchParams } from "expo-router";

export default function ProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ErrorBoundary retryAccessibilityLabel="Retry screen">
      <ProfileScreen contactId={id ?? ""} />
    </ErrorBoundary>
  );
}
