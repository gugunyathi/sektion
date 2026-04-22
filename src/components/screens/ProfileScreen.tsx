import { useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  CalendarDays,
  Crown,
  Flame,
  LogOut,
  Pencil,
  Settings,
  Trophy,
  Utensils,
  Zap,
} from "lucide-react";
import { VibeTag } from "../VibeTag";
import { MyBookingsSheet } from "../MyBookingsSheet";
import { ProfileSetupSheet } from "../ProfileSetupSheet";
import { Footer } from "../Footer";
import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/context/BookmarksContext";
import a1 from "@/assets/avatar-1.jpg";
import club from "@/assets/event-club.jpg";
import dining from "@/assets/event-dining.jpg";
import themed from "@/assets/event-themed.jpg";
import lounge from "@/assets/event-lounge.jpg";

const BADGES = [
  { icon: Flame, label: "Party Legend", grad: "bg-gradient-primary" },
  { icon: Utensils, label: "Foodie Explorer", grad: "bg-gradient-gold" },
  { icon: Trophy, label: "First Share", grad: "bg-gradient-vibe" },
  { icon: Crown, label: "City #3", grad: "bg-gradient-gold" },
];

const COLLAGE = [club, dining, themed, lounge, club, dining];

/* ── Saved/Bookmarks panel ───────────────────────────── */
function SavedSection() {
  const { bookmarks } = useBookmarks();
  const { requireAuth } = useAuth();
  const { isAuthed } = useAuth();

  if (!isAuthed) {
    return (
      <section className="mt-8 px-5">
        <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">Saved</h2>
        <button
          onClick={() => requireAuth("Sign in to save your favourite tables and events.")}
          className="glass w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground hover:bg-white/10 transition-colors"
        >
          <Bookmark className="h-8 w-8 opacity-30" />
          <p className="text-sm font-bold">Sign in to save favourites</p>
          <p className="text-xs opacity-60">Your saved events &amp; tables appear here</p>
        </button>
      </section>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <section className="mt-8 px-5">
        <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">Saved</h2>
        <div className="glass w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
          <Bookmark className="h-8 w-8 opacity-30" />
          <p className="text-sm font-bold">Nothing saved yet</p>
          <p className="text-xs opacity-60">Tap the bookmark icon on any event to save it</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 px-5">
      <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">
        Saved · {bookmarks.length}
      </h2>
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
        {bookmarks.map((bm) => (
          <div key={bm.id} className="shrink-0 w-36 glass rounded-2xl overflow-hidden">
            {bm.image ? (
              <img src={bm.image} alt={bm.title} className="h-20 w-full object-cover" loading="lazy" width={144} height={80} />
            ) : (
              <div className="h-20 w-full bg-gradient-vibe/30" />
            )}
            <div className="p-2">
              <p className="text-xs font-bold leading-tight line-clamp-1">{bm.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{bm.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Main component ──────────────────────────────────── */
export const ProfileScreen = () => {
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const { bookingHistory } = useBooking();
  const { user, isAuthed, requireAuth, signOut } = useAuth();

  const upcomingCount = bookingHistory.filter(
    (b) =>
      (b.status === "confirmed" || b.status === "held") &&
      new Date(b.date) >= new Date(new Date().toDateString())
  ).length;

  // Real user values vs demo fallbacks
  const displayName = user?.displayName ?? "@niko.r";
  const username = user?.username ? `@${user.username}` : "@niko.r";
  const bio = user?.bio ?? "Foodie by day, party legend by night. Negroni enthusiast. Always at the head of the table.";
  const city = user?.city ?? "Berlin";
  const vibes = user?.vibes?.length ? user.vibes : ["Foodie", "Party Animal", "Luxe"];
  const profileIncomplete = isAuthed && !user?.profileComplete;

  return (
  <div className="min-h-[100dvh] pb-28">
    {/* Hero */}
    <div className="relative">
      <div className="bg-gradient-vibe absolute inset-x-0 top-0 h-48 opacity-40 blur-3xl" />
      <header className="relative flex items-start justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{city} · DE</div>
        <div className="flex items-center gap-2">
          {isAuthed && (
            <button
              onClick={() => setSetupOpen(true)}
              className="glass flex h-9 w-9 items-center justify-center rounded-full"
              aria-label="Edit profile"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {isAuthed ? (
            <button
              onClick={signOut}
              className="glass flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button className="glass flex h-9 w-9 items-center justify-center rounded-full" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Profile incomplete banner */}
      {profileIncomplete && (
        <button
          onClick={() => setSetupOpen(true)}
          className="mx-5 mt-3 w-[calc(100%-2.5rem)] flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-2xl px-4 py-2.5"
        >
          <Zap className="h-4 w-4 text-accent shrink-0" />
          <span className="text-xs font-bold text-accent">Complete your profile to unlock all features</span>
        </button>
      )}

      <div className="relative mt-6 flex flex-col items-center px-5">
        <div className="bg-gradient-primary shadow-neon rounded-full p-1">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={displayName} className="bg-background h-24 w-24 rounded-full border-4 border-background object-cover" loading="lazy" width={96} height={96} />
          ) : (
            <img src={a1} alt={displayName} className="bg-background h-24 w-24 rounded-full border-4 border-background object-cover" loading="lazy" width={256} height={256} />
          )}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <h1 className="font-display text-2xl font-black">{isAuthed && user?.username ? username : "@niko.r"}</h1>
          {isAuthed && <BadgeCheck className="text-accent h-5 w-5" />}
        </div>
        {isAuthed && user?.displayName && user.displayName !== user.username && (
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">{user.displayName}</p>
        )}
        <p className="text-muted-foreground mt-1 max-w-xs text-center text-sm">{bio}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {vibes.map((v) => <VibeTag key={v} vibe={v as never} />)}
        </div>
      </div>

      {/* Stats */}
      <div className="mx-5 mt-6 grid grid-cols-3 gap-3">
        {[
          { v: "47", l: "Tables" },
          { v: "12", l: "Cities" },
          { v: "1.2k", l: "Sharers" },
        ].map((s) => (
          <div key={s.l} className="glass flex flex-col items-center rounded-2xl py-3">
            <span className="font-display text-xl font-black">{s.v}</span>
            <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{s.l}</span>
          </div>
        ))}
      </div>

      {/* My Bookings CTA */}
      <button
        onClick={() => isAuthed ? setBookingsOpen(true) : requireAuth("Sign in to view your bookings.")}
        className="mx-5 mt-4 w-[calc(100%-2.5rem)] glass rounded-2xl flex items-center px-4 py-3.5 gap-3 hover:bg-white/10 transition-colors active:scale-[0.99]"
      >
        <span className="bg-gradient-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
          <CalendarDays className="h-4 w-4 text-primary-foreground" />
        </span>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold leading-tight">My Bookings</p>
          <p className="text-[11px] text-muted-foreground">
            {!isAuthed ? "Sign in to view bookings" : upcomingCount > 0 ? `${upcomingCount} upcoming` : "View history & manage"}
          </p>
        </div>
        {isAuthed && upcomingCount > 0 && (
          <span className="bg-accent text-accent-foreground text-[10px] font-black px-2 py-0.5 rounded-full">
            {upcomingCount}
          </span>
        )}
      </button>
    </div>

    {/* Saved / Bookmarks */}
    <SavedSection />

    {/* Badges */}
    <section className="mt-8 px-5">
      <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">Badges</h2>
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
        {BADGES.map(({ icon: Icon, label, grad }) => (
          <div key={label} className="flex w-24 shrink-0 flex-col items-center gap-2">
            <span className={`${grad} shadow-card flex h-20 w-20 items-center justify-center rounded-2xl`}>
              <Icon className="text-primary-foreground h-8 w-8" strokeWidth={2.5} />
            </span>
            <span className="text-center text-[11px] font-semibold leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </section>

    {/* Collage */}
    <section className="mt-8 px-5 pb-8">
      <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">Table Moments</h2>
      <div className="grid grid-cols-3 gap-1">
        {COLLAGE.map((src, i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-lg">
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" width={300} height={300}/>
          </div>
        ))}
      </div>
    </section>

    {/* Footer */}
    <Footer />

    <MyBookingsSheet open={bookingsOpen} onOpenChange={setBookingsOpen} />
    <ProfileSetupSheet open={setupOpen} onOpenChange={setSetupOpen} />
  </div>
  );
};
