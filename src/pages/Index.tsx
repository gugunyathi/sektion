import { useEffect, useState } from "react";
import { BottomNav, Tab } from "@/components/BottomNav";
import { FeedScreen } from "@/components/screens/FeedScreen";
import { DiscoverScreen } from "@/components/screens/DiscoverScreen";
import { TableShareScreen } from "@/components/screens/TableShareScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { HoldBanner } from "@/components/HoldBanner";
import { ProfileSetupSheet } from "@/components/ProfileSetupSheet";
import { UploadSektionSheet } from "@/components/UploadSektionSheet";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const [tab, setTab] = useState<Tab>("feed");
  const { user, isAuthed, requireAuth } = useAuth();
  const [setupOpen, setSetupOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Auto-open profile setup when user first signs in without a complete profile
  useEffect(() => {
    if (isAuthed && !user?.profileComplete) {
      const t = setTimeout(() => setSetupOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [isAuthed, user?.profileComplete]);

  const handleUploadClick = () => {
    if (!isAuthed) {
      requireAuth("Sign in to upload a sektion.");
      return;
    }
    setUploadOpen(true);
  };

  const handleSektionCreated = () => {
    // Navigate to feed so user sees their new sektion at top
    setTab("feed");
  };

  return (
    <main className="bg-background relative mx-auto min-h-[100dvh] w-full max-w-md overflow-hidden">
      {tab === "feed" && <FeedScreen />}
      {tab === "discover" && <DiscoverScreen />}
      {tab === "tableshare" && <TableShareScreen />}
      {tab === "profile" && <ProfileScreen onOpenUpload={handleUploadClick} />}
      <HoldBanner />
      <BottomNav active={tab} onChange={setTab} onUpload={handleUploadClick} />
      <ProfileSetupSheet open={setupOpen} onOpenChange={setSetupOpen} />
      <UploadSektionSheet
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onCreated={handleSektionCreated}
      />
    </main>
  );
};

export default Index;
