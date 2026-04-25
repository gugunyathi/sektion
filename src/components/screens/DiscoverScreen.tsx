import { useMemo, useState } from "react";
import { ALL_VIBES, EVENTS, Event, Vibe } from "@/data/events";
import { VibeTag } from "../VibeTag";
import { BookingFlow } from "../BookingFlow";
import { useInventory } from "@/context/InventoryContext";
import { Bookmark, CalendarDays, Loader2, MapPin, Search, Users, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/context/BookmarksContext";
import { useLocation } from "@/hooks/useLocation";

export const DiscoverScreen = () => {
  const [query, setQuery] = useState("");
  const [activeVibes, setActiveVibes] = useState<Vibe[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selected, setSelected] = useState<Event | null>(null);
  const [open, setOpen] = useState(false);
  const { seatsLeftForEvent } = useInventory();

  const { isAuthed, requireAuth, user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const loc = useLocation();

  // Effective preferred city from profile or geolocation
  const preferredCity = user?.city || loc.city || null;

  const toggle = (v: Vibe) =>
    setActiveVibes((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));

  const handleOpenBooking = (e: Event) => {
    if (!isAuthed) {
      requireAuth(`Sign in to book a table at ${e.title}.`);
      return;
    }
    setSelected(e);
    setOpen(true);
  };

  const handleBookmark = (e: Event, ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!isAuthed) {
      requireAuth("Sign in to save your favourite events.");
      return;
    }
    toggleBookmark({ type: "event", refId: e.id, title: e.title, subtitle: e.venue, image: e.image, city: e.city });
  };

  const filtered = useMemo(() => {
    return EVENTS
      .filter((e) => {
        const q = query.toLowerCase();
        const matchQ = !q || e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
        const matchV = activeVibes.length === 0 || activeVibes.some((v) => e.vibes.includes(v));
        const matchD = !selectedDate || e.dateISO === selectedDate;
        return matchQ && matchV && matchD;
      })
      .sort((a, b) => {
        // Boost events in user's preferred city to top
        if (!preferredCity) return 0;
        const aMatch = a.city.toLowerCase().includes(preferredCity.toLowerCase()) ? -1 : 0;
        const bMatch = b.city.toLowerCase().includes(preferredCity.toLowerCase()) ? -1 : 0;
        return aMatch - bMatch;
      });
  }, [query, activeVibes, selectedDate, preferredCity]);

  return (
    <div className="min-h-[100dvh] pb-28">
      <header className="bg-background/80 sticky top-0 z-20 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <h1 className="font-display text-2xl font-black tracking-tight">Discover</h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Find your tribe tonight.</p>
          {/* Location pill */}
          <button
            onClick={loc.detect}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {loc.loading
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <MapPin className="h-3 w-3 text-secondary" />}
            <span>{preferredCity ?? "Detect location"}</span>
          </button>
        </div>
        <div className="bg-muted/60 border-border mt-3 flex items-center gap-2 rounded-2xl border px-4 py-3">
          <Search className="text-muted-foreground h-4 w-4" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Venue, city, vibe…"
            className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          {ALL_VIBES.map((v) => {
            const active = activeVibes.includes(v);
            return (
              <button
                key={v}
                onClick={() => toggle(v)}
                className={`shrink-0 transition-transform ${active ? "scale-105" : "opacity-70"}`}
              >
                <VibeTag vibe={v} className={active ? "ring-2 ring-foreground/40" : ""} />
              </button>
            );
          })}
        </div>
        {/* Date filter */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-xs font-semibold">
            <CalendarDays className="h-3 w-3 text-secondary shrink-0" />
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none text-xs text-foreground/80 w-28"
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
            {preferredCity && !query && !selectedDate && activeVibes.length === 0 && ` near ${preferredCity}`}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 px-5 pt-4">
        {filtered.map((e) => (
          <button
            key={e.id}
            onClick={() => handleOpenBooking(e)}
            className="group relative aspect-[3/4] overflow-hidden rounded-2xl text-left animate-float-up"
          >
            <img
              src={e.image}
              alt={e.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform group-active:scale-105"
              loading="lazy"
              width={832}
              height={1472}
            />
            <div className="bg-gradient-overlay absolute inset-0" />
            <div className="absolute inset-x-0 top-0 flex justify-between p-2.5">
              <span className="glass rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                {e.category}
              </span>
              {e.trending && (
                <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Hot
                </span>
              )}
              <button
                onClick={(ev) => handleBookmark(e, ev)}
                className="glass ml-auto flex h-6 w-6 items-center justify-center rounded-full"
                aria-label="Save"
              >
                <Bookmark className={`h-3 w-3 ${isBookmarked(e.id) ? "fill-accent text-accent" : "text-white/80"}`} />
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="font-display text-sm font-bold leading-tight">{e.title}</p>
              <p className="text-foreground/70 text-[11px]">{e.city} · {e.date.split(" ").slice(0,2).join(" ")}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-display text-primary-glow text-base font-black">${e.pricePerSeat}</span>
                <span className="text-foreground/80 flex items-center gap-1 text-[10px]">
                  <Users className="h-3 w-3" /> {seatsLeftForEvent(e.id)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-muted-foreground mt-12 text-center text-sm">No tables match those vibes — try clearing filters.</p>
      )}
      <BookingFlow event={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
};
