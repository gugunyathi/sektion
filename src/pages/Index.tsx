import { useEffect, useState } from "react";
import { BottomNav, Tab } from "@/components/BottomNav";
import { FeedScreen } from "@/components/screens/FeedScreen";
import { DiscoverScreen } from "@/components/screens/DiscoverScreen";
import { TableShareScreen } from "@/components/screens/TableShareScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { HoldBanner } from "@/components/HoldBanner";
import { ProfileSetupSheet } from "@/components/ProfileSetupSheet";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const [tab, setTab] = useState<Tab>("feed");
  const { user, isAuthed } = useAuth();
  const [setupOpen, setSetupOpen] = useState(false);

  // Auto-open profile setup when user first signs in without a complete profile
  useEffect(() => {
    if (isAuthed && !user?.profileComplete) {
      const t = setTimeout(() => setSetupOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [isAuthed, user?.profileComplete]);

  return (
    <main className="bg-background relative mx-auto min-h-[100dvh] w-full max-w-md overflow-hidden">
      {tab === "feed" && <FeedScreen />}
      {tab === "discover" && <DiscoverScreen />}
      {tab === "tableshare" && <TableShareScreen />}
      {tab === "profile" && <ProfileScreen />}
      <HoldBanner />
      <BottomNav active={tab} onChange={setTab} />
      <ProfileSetupSheet open={setupOpen} onOpenChange={setSetupOpen} />
    </main>
  );
};

export default Index;
