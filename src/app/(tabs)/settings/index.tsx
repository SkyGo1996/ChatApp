import { ErrorBoundary } from "@/components/ErrorBoundary";
import SettingsScreen from "@/features/settings/screens/SettingsScreen";

export default function SettingsRoute() {
  return (
    <ErrorBoundary retryAccessibilityLabel="Retry screen">
      <SettingsScreen />
    </ErrorBoundary>
  );
}
