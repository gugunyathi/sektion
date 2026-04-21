import { useState } from "react";
import { EVENTS, Event } from "@/data/events";
import { EventCard } from "../EventCard";
import { BookingFlow } from "../BookingFlow";

export const FeedScreen = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Event | null>(null);

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="font-display text-gradient-vibe text-xl font-black tracking-tight drop-shadow-lg">
          TableShare
        </h1>
      </header>
      <div className="snap-feed no-scrollbar h-[100dvh] overflow-y-scroll">
        {EVENTS.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            onOpen={(ev) => {
              setSelected(ev);
              setOpen(true);
            }}
          />
        ))}
      </div>
      <BookingFlow event={selected} open={open} onOpenChange={setOpen} />
    </>
  );
};
