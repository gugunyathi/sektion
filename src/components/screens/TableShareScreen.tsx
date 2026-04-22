import { EVENTS } from "@/data/events";
import { VibeTag } from "../VibeTag";
import { Shuffle, Sparkles, Zap, Building2 } from "lucide-react";
import { useState } from "react";
import { BookingFlow } from "../BookingFlow";
import { useInventory } from "@/context/InventoryContext";
import { VenueManagerPanel } from "../VenueManagerPanel";
import { getTablesForEvent } from "@/data/tables";
import { useSeatAvailability } from "@/context/SeatAvailabilityContext";

export const TableShareScreen = () => {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [venueOpen, setVenueOpen] = useState(false);
  const event = EVENTS[idx];
  const { seatsLeftForEvent } = useInventory();
  const seatsLeft = seatsLeftForEvent(event.id);
  const tables = getTablesForEvent(event);
  const { releaseSeat } = useSeatAvailability();

  const [attendees, setAttendees] = useState(() => [
    { id: "a1", name: "Zara K.", seats: 2, status: "checked_in" as const, tableId: tables[0]?.id, avatar: "" },
    { id: "a2", name: "Diego M.", seats: 1, status: "pending" as const, avatar: "" },
    { id: "a3", name: "Niko R.", seats: 3, status: "pending" as const, avatar: "" },
    { id: "a4", name: "Sam L.", seats: 2, status: "no_show" as const, tableId: tables[1]?.id, avatar: "" },
  ]);

  const handlePlaceAttendee = (attendeeId: string, tableId: string) => {
    setAttendees((prev) => prev.map((a) => a.id === attendeeId ? { ...a, tableId, status: "checked_in" as const } : a));
  };
  const handleMarkNoShow = (attendeeId: string) => {
    const a = attendees.find((x) => x.id === attendeeId);
    if (a?.tableId) releaseSeat({ eventId: event.id, tableId: a.tableId, seatsToRelease: a.seats, reason: "no-show" });
    setAttendees((prev) => prev.map((a) => a.id === attendeeId ? { ...a, status: "no_show" as const } : a));
  };
  const handleReleaseSeats = (tableId: string, seats: number) => {
    releaseSeat({ eventId: event.id, tableId, seatsToRelease: seats, reason: "voluntary" });
  };

  const shuffle = () => setIdx((i) => (i + 1) % EVENTS.length);

  return (
    <div className="min-h-[100dvh] px-5 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mb-6">
        <span className="text-secondary text-xs font-bold uppercase tracking-[0.25em]">
          Smart Match
        </span>
        <h1 className="font-display mt-1 text-3xl font-black leading-tight tracking-tight">
          {"Tonight's"} <span className="text-gradient-vibe">surprise</span> table.
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          AI-curated based on your vibes. Hit shuffle for chaos.
        </p>
      </div>

      <article className="shadow-card relative overflow-hidden rounded-3xl">
        <img
          src={event.image}
          alt={event.title}
          className="aspect-[3/4] w-full object-cover"
          loading="lazy"
          width={832}
          height={1472}
        />
        <div className="bg-gradient-overlay absolute inset-0" />
        <div className="absolute inset-x-0 top-0 flex justify-between p-4">
          <span className="bg-gradient-gold text-primary-foreground flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" /> 94% match
          </span>
          {event.trending && (
            <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
              <Zap className="h-3 w-3" /> Hot
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {event.vibes.map((v) => <VibeTag key={v} vibe={v} />)}
          </div>
          <h2 className="font-display text-2xl font-black leading-tight">{event.title}</h2>
          <p className="text-foreground/80 text-sm">{event.venue} · {event.city}</p>
          <p className="text-foreground/60 mt-1 text-xs">{event.date} · {event.time}</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              {event.sharers.slice(0, 3).map(s => (
                <img key={s.id} src={s.avatar} alt={s.name} className="border-background h-8 w-8 rounded-full border-2 object-cover" loading="lazy" width={48} height={48} />
              ))}
            </div>
            <span className="text-xs text-foreground/80">
              <span className="text-secondary font-semibold">{seatsLeft}</span> seats · ${event.pricePerSeat}/seat
            </span>
          </div>
        </div>
      </article>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={shuffle}
          className="border-border bg-muted/40 active:bg-muted flex h-14 items-center justify-center gap-2 rounded-2xl border font-semibold transition-colors"
        >
          <Shuffle className="h-4 w-4" /> Shuffle
        </button>
        <button
          onClick={() => setOpen(true)}
          className="bg-gradient-primary shadow-neon font-display flex h-14 items-center justify-center rounded-2xl font-bold uppercase tracking-wider text-primary-foreground"
        >
          Join table
        </button>
      </div>

      <button
        onClick={() => setVenueOpen(true)}
        className="border-border bg-muted/30 active:bg-muted mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition-colors"
      >
        <Building2 className="h-4 w-4" /> Venue Manager Panel
      </button>

      <BookingFlow event={event} open={open} onOpenChange={setOpen} />
      <VenueManagerPanel
        event={event}
        tables={tables}
        open={venueOpen}
        onOpenChange={setVenueOpen}
        attendees={attendees}
        onPlaceAttendee={handlePlaceAttendee}
        onMarkNoShow={handleMarkNoShow}
        onReleaseSeats={handleReleaseSeats}
      />
    </div>
  );
};