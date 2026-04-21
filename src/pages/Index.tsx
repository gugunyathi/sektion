import { useState } from "react";
import { BottomNav, Tab } from "@/components/BottomNav";
import { FeedScreen } from "@/components/screens/FeedScreen";
import { DiscoverScreen } from "@/components/screens/DiscoverScreen";
import { TableShareScreen } from "@/components/screens/TableShareScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { HoldBanner } from "@/components/HoldBanner";

const Index = () => {
  const [tab, setTab] = useState<Tab>("feed");

  return (
    <main className="bg-background relative mx-auto min-h-[100dvh] w-full max-w-md overflow-hidden">
      {tab === "feed" && <FeedScreen />}
      {tab === "discover" && <DiscoverScreen />}
      {tab === "tableshare" && <TableShareScreen />}
      {tab === "profile" && <ProfileScreen />}
      <HoldBanner />
      <BottomNav active={tab} onChange={setTab} />
    </main>
  );
};

export default Index;
