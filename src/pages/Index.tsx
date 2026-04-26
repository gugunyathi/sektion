import { useEffect, useState } from "react";
import { BottomNav, Tab } from "@/components/BottomNav";
import { FeedScreen } from "@/components/screens/FeedScreen";
import { DiscoverScreen } from "@/components/screens/DiscoverScreen";
import { TableShareScreen } from "@/components/screens/TableShareScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { HoldBanner } from "@/components/HoldBanner";
import { ProfileSetupSheet } from "@/components/ProfileSetupSheet";
import { UploadSektionSheet } from "@/components/UploadSektionSheet";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { useAuth } from "@/context/AuthContext";

const ONBOARDING_SEEN_PREFIX = "sektion.onboarding.seen";

const Index = () => {
  const [tab, setTab] = useState<Tab>("feed");
  const { user, isAuthed, requireAuth } = useAuth();
  const [setupOpen, setSetupOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAuthed || !user?.id) {
      setOnboardingOpen(false);
      return;
    }

    const seenKey = `${ONBOARDING_SEEN_PREFIX}.${user.id}`;
    const hasSeen = localStorage.getItem(seenKey) === "1";
    if (!hasSeen) {
      const t = setTimeout(() => setOnboardingOpen(true), 250);
      return () => clearTimeout(t);
    }
  }, [isAuthed, user?.id]);

  // Auto-open profile setup when user first signs in without a complete profile
  useEffect(() => {
    if (isAuthed && !user?.profileComplete && !onboardingOpen) {
      const t = setTimeout(() => setSetupOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [isAuthed, onboardingOpen, user?.profileComplete]);

  const handleCompleteOnboarding = () => {
    if (user?.id) {
      localStorage.setItem(`${ONBOARDING_SEEN_PREFIX}.${user.id}`, "1");
    }
    setOnboardingOpen(false);
  };

  const handleUploadClick = () => {
    if (!isAuthed) {
      requireAuth("Sign in to upload a sektion.");
      return;
    }
    setUploadOpen(true);
  };

  const handleSektionCreated = () => {
    setFeedRefreshKey((k) => k + 1);
    setTab("feed");
  };

  const handleExitUploadHome = () => {
    setUploadOpen(false);
    setTab("feed");
  };

  return (
    <main className="bg-background relative mx-auto min-h-[100dvh] w-full max-w-md overflow-hidden">
      {tab === "feed" && <FeedScreen refreshKey={feedRefreshKey} />}
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
        onExitHome={handleExitUploadHome}
      />
      <OnboardingFlow open={onboardingOpen} onComplete={handleCompleteOnboarding} />
    </main>
  );
};

export default Index;
