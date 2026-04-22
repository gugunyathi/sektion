import { useRef, useState } from "react";
import { EVENTS, Event, MediaItem } from "@/data/events";
import { EventCard } from "../EventCard";
import { BookingFlow } from "../BookingFlow";
import { ModerationReviewInbox } from "../ModerationReviewInbox";
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const GATE_AFTER = 4; // show auth gate after scrolling past this many cards

export const FeedScreen = () => {
  const { isAuthed, requireAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Event | null>(null);
  const [modOpen, setModOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gatedRef = useRef(false);
  // Track all event media in state so moderation actions persist
  const [allMedia, setAllMedia] = useState<Record<string, MediaItem[]>>(
    () => Object.fromEntries(EVENTS.map((e) => [e.id, e.media ?? []]))
  );

  const frozenItems = EVENTS.flatMap((e) =>
    (allMedia[e.id] ?? [])
      .filter((m) => m.status === "frozen")
      .map((m) => ({ ...m, eventId: e.id, eventTitle: e.title, flagCount: m.flags }))
  );

  // Derive a global status badge for the header
  const allStatuses = Object.values(allMedia).flat().map((m) => m.status);
  const globalModStatus = allStatuses.includes("frozen")
    ? "frozen"
    : allStatuses.includes("pending")
    ? "pending"
    : allStatuses.length > 0
    ? "approved"
    : null;

  const handleApprove = (itemId: string) => {
    setAllMedia((prev) => {
      const next = { ...prev };
      for (const eid of Object.keys(next)) {
        next[eid] = next[eid].map((m) => m.id === itemId ? { ...m, status: "approved" as const } : m);
      }
      return next;
    });
  };

  const handleReject = (itemId: string) => {
    setAllMedia((prev) => {
      const next = { ...prev };
      for (const eid of Object.keys(next)) {
        next[eid] = next[eid].filter((m) => m.id !== itemId);
      }
      return next;
    });
  };

  /** Called when the snap-feed scrolls — gate after GATE_AFTER cards */
  const handleScroll = () => {
    if (isAuthed || gatedRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const cardHeight = el.clientHeight;
    const scrolledCards = Math.floor(el.scrollTop / cardHeight);
    if (scrolledCards >= GATE_AFTER) {
      gatedRef.current = true;
      requireAuth("Sign in to keep exploring more events on Sektion.");
    }
  };

  /** Gated booking opener */
  const handleOpenBooking = (ev: Event) => {
    if (!isAuthed) {
      requireAuth("Sign in to book a table at " + ev.title + ".");
      return;
    }
    setSelected(ev);
    setOpen(true);
  };

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="font-display text-gradient-vibe text-xl font-black tracking-tight drop-shadow-lg">
          Sektion
        </h1>
        <div className="pointer-events-auto flex items-center gap-2">
          {globalModStatus === "approved" && (
            <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
              <CheckCircle2 className="h-3 w-3" /> Approved
            </span>
          )}
          {globalModStatus === "pending" && (
            <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              <Clock className="h-3 w-3" /> Pending
            </span>
          )}
          {globalModStatus === "frozen" && (
            <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive">
              <ShieldAlert className="h-3 w-3" /> Frozen
            </span>
          )}
          <button
            className="relative glass flex h-9 w-9 items-center justify-center rounded-full"
            onClick={() => setModOpen(true)}
            aria-label="Moderation inbox"
          >
            <ShieldAlert className="h-4 w-4" />
            {frozenItems.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                {frozenItems.length}
              </span>
            )}
          </button>
        </div>
      </header>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="snap-feed no-scrollbar h-[100dvh] overflow-y-scroll pt-[max(3.5rem,calc(1rem+env(safe-area-inset-top)))]"
      >
        {EVENTS.map((e) => (
          <EventCard
            key={e.id}
            event={{ ...e, media: allMedia[e.id] }}
            onOpen={handleOpenBooking}
          />
        ))}
      </div>
      <BookingFlow event={selected} open={open} onOpenChange={setOpen} />
      <ModerationReviewInbox
        open={modOpen}
        onOpenChange={setModOpen}
        frozenItems={frozenItems}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
};
