import { useState } from "react";
import { EVENTS, Event, MediaItem } from "@/data/events";
import { EventCard } from "../EventCard";
import { BookingFlow } from "../BookingFlow";
import { ModerationReviewInbox } from "../ModerationReviewInbox";
import { ShieldAlert } from "lucide-react";

export const FeedScreen = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Event | null>(null);
  const [modOpen, setModOpen] = useState(false);
  // Track all event media in state so moderation actions persist
  const [allMedia, setAllMedia] = useState<Record<string, MediaItem[]>>(
    () => Object.fromEntries(EVENTS.map((e) => [e.id, e.media ?? []]))
  );

  const frozenItems = EVENTS.flatMap((e) =>
    (allMedia[e.id] ?? [])
      .filter((m) => m.status === "frozen")
      .map((m) => ({ ...m, eventId: e.id, eventTitle: e.title, flagCount: m.flags }))
  );

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

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="w-9" />
        <h1 className="font-display text-gradient-vibe text-xl font-black tracking-tight drop-shadow-lg">
          TableShare
        </h1>
        <button
          className="pointer-events-auto glass flex h-9 w-9 items-center justify-center rounded-full"
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
      </header>
      <div className="snap-feed no-scrollbar h-[100dvh] overflow-y-scroll">
        {EVENTS.map((e) => (
          <EventCard
            key={e.id}
            event={{ ...e, media: allMedia[e.id] }}
            onOpen={(ev) => {
              setSelected(ev);
              setOpen(true);
            }}
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
