import { EVENTS } from "@/data/events";
import { VibeTag } from "../VibeTag";
import { CalendarDays, Loader2, MapPin, Shuffle, Sparkles, X, Zap, Building2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BookingFlow } from "../BookingFlow";
import { useInventory } from "@/context/InventoryContext";
import { VenueManagerPanel } from "../VenueManagerPanel";
import { getTablesForEvent } from "@/data/tables";
import { useSeatAvailability } from "@/context/SeatAvailabilityContext";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { api } from "@/lib/api";

type PersonalizedEntry = {
  eventId: string;
  score: number;
  rationale?: string;
  stalkPriority?: boolean;
  event: (typeof EVENTS)[number];
};

/** Compute a 0-100 match score for an event given user vibes + city preference */
function matchScore(eventVibes: string[], eventCity: string, userVibes: string[], preferredCity: string | null): number {
  const vibeHits = eventVibes.filter((v) => userVibes.includes(v)).length;
  const vibeScore = eventVibes.length > 0 ? (vibeHits / eventVibes.length) * 60 : 30;
  const cityMatch = preferredCity && eventCity.toLowerCase().includes(preferredCity.toLowerCase()) ? 40 : 0;
  return Math.round(vibeScore + cityMatch);
}

export const TableShareScreen = () => {
  const { user, isAuthed, requireAuth } = useAuth();
  const loc = useLocation();

  // Effective city: profile city → detected city → null
  const preferredCity = user?.city || loc.city || null;

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [venueOpen, setVenueOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [autoBooked, setAutoBooked] = useState<{ title: string; date: string; city: string; tableLabel: string } | null>(null);
  const [personalized, setPersonalized] = useState<PersonalizedEntry[]>([]);
  const { seatsLeftForEvent } = useInventory();
  const { releaseSeat } = useSeatAvailability();

  // Smart-match: score all events, filter by date if set, sort by score
  const smartMatched = useMemo(() => {
    if (personalized.length > 0) {
      return personalized
        .filter((entry) => !selectedDate || entry.event.dateISO === selectedDate)
        .map((entry) => ({ event: entry.event, score: entry.score, rationale: entry.rationale, stalkPriority: entry.stalkPriority }));
    }

    return EVENTS
      .filter((e) => !selectedDate || e.dateISO === selectedDate)
      .map((e) => ({
        event: e,
        score: matchScore(e.vibes, e.city, user?.vibes ?? [], preferredCity),
      }))
      .sort((a, b) => b.score - a.score);
  }, [selectedDate, user?.vibes, preferredCity, personalized]);

  useEffect(() => {
    if (!isAuthed) {
      setPersonalized([]);
      setAutoBooked(null);
      setAiError(null);
      return;
    }

    let canceled = false;
    setAiLoading(true);
    setAiError(null);

    const q = selectedDate ? `?date=${encodeURIComponent(selectedDate)}&autoBook=1` : "?autoBook=1";
    api.get<{ recommendations: PersonalizedEntry[]; autoBooked?: { title: string; date: string; city: string; tableLabel: string } | null }>(`/api/tableshare/personalized${q}`)
      .then((data) => {
        if (canceled) return;
        setPersonalized(Array.isArray(data.recommendations) ? data.recommendations : []);
        setAutoBooked(data.autoBooked ?? null);
      })
      .catch((err) => {
        if (canceled) return;
        setAiError(err instanceof Error ? err.message : "Could not load AI recommendations");
      })
      .finally(() => {
        if (!canceled) setAiLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [isAuthed, selectedDate]);

  const [idx, setIdx] = useState(0);
  const entry = smartMatched[idx % Math.max(smartMatched.length, 1)];
  const event = entry?.event ?? EVENTS[0];
  const score = entry?.score ?? 0;

  const seatsLeft = seatsLeftForEvent(event.id);
  const tables = getTablesForEvent(event);

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

  const shuffle = () => setIdx((i) => (i + 1) % Math.max(smartMatched.length, 1));

  return (
    <div className="min-h-[100dvh] px-5 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mb-4">
        <span className="text-secondary text-xs font-bold uppercase tracking-[0.25em]">
          Smart Match
        </span>
        <h1 className="font-display mt-1 text-3xl font-black leading-tight tracking-tight">
          {"Tonight's"} <span className="text-gradient-vibe">surprise</span> table.
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          AI-curated based on your vibes. Hit shuffle for chaos.
        </p>
        {!isAuthed && (
          <button
            onClick={() => requireAuth("Sign in to unlock Gemini-powered tableshare and automatic stalk-priority booking.")}
            className="mt-3 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold"
          >
            Sign in to enable AI auto-curation + auto-booking
          </button>
        )}
        {aiLoading && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Refreshing personalized feed...
          </p>
        )}
        {aiError && <p className="text-xs text-red-300 mt-2">{aiError}</p>}
        {autoBooked && (
          <div className="mt-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs">
            Auto-booked by AI: {autoBooked.title} · {autoBooked.city} · {autoBooked.date} · {autoBooked.tableLabel}
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {/* Location badge */}
        <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-xs font-semibold">
          {loc.loading ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-3 w-3 text-secondary" />
          )}
          <span className="text-foreground/80">
            {preferredCity ?? (loc.error ? "Location off" : "Detecting…")}
          </span>
          {!preferredCity && !loc.loading && (
            <button onClick={loc.detect} className="text-accent font-bold ml-0.5">Enable</button>
          )}
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1 text-xs font-semibold">
          <CalendarDays className="h-3 w-3 text-secondary shrink-0" />
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => { setSelectedDate(e.target.value); setIdx(0); }}
            className="bg-transparent outline-none text-xs text-foreground/80 w-28"
          />
          {selectedDate && (
            <button onClick={() => setSelectedDate("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Results count */}
        <span className="text-[11px] text-muted-foreground ml-auto">
          {smartMatched.length} {smartMatched.length === 1 ? "event" : "events"}
        </span>
      </div>

      {smartMatched.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">No events on this date</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different date or clear the filter</p>
          <button onClick={() => setSelectedDate("")} className="mt-4 text-xs text-accent font-semibold">
            Clear date filter
          </button>
        </div>
      ) : (
        <>
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
              <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${score >= 70 ? "bg-gradient-gold text-primary-foreground" : "glass"}`}>
                <Sparkles className="h-3 w-3" /> {score}% match
              </span>
              {(entry as { stalkPriority?: boolean } | undefined)?.stalkPriority && (
                <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                  <Zap className="h-3 w-3" /> Stalk Priority
                </span>
              )}
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
              {(entry as { rationale?: string } | undefined)?.rationale && (
                <p className="mb-2 text-[11px] text-accent/90">{(entry as { rationale?: string }).rationale}</p>
              )}
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
        </>
      )}

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