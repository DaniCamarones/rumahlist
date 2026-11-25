import { HouseholdProvider } from "@/components/household-provider";
import { OfflineBanner } from "@/components/offline-banner";

/** Full-screen layout without navigation, for Shopping Mode. */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <HouseholdProvider>
      <OfflineBanner />
      {children}
    </HouseholdProvider>
  );
}
