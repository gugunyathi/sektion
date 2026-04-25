import { useEffect, useMemo, useState } from "react";
import { ALL_VIBES, EVENTS, Event, Vibe } from "@/data/events";
import { VibeTag } from "../VibeTag";
import { BookingFlow } from "../BookingFlow";
import { useInventory } from "@/context/InventoryContext";
import { Bookmark, CalendarDays, Loader2, MapPin, Search, Users, UserRound, Building2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/context/BookmarksContext";
import { useLocation } from "@/hooks/useLocation";
import { api } from "@/lib/api";

type DiscoverMode = "events" | "people";
type PeopleTab = "users" | "establishments";

interface DiscoverUser {
  id: string;
  username?: string;
  displayName?: string;
  city?: string;
  photoURL?: string;
  vibes?: string[];
  bio?: string;
  stalking: boolean;
}

interface DiscoverEstablishment {
  key: string;
  name: string;
  city?: string;
  nextDate?: string;
  upcomingCount: number;
  stalking: boolean;
}

export const DiscoverScreen = () => {
  const [mode, setMode] = useState<DiscoverMode>("events");
  const [peopleTab, setPeopleTab] = useState<PeopleTab>("users");
  const [query, setQuery] = useState("");
  const [activeVibes, setActiveVibes] = useState<Vibe[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selected, setSelected] = useState<Event | null>(null);
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [establishments, setEstablishments] = useState<DiscoverEstablishment[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
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

  useEffect(() => {
    if (mode !== "people" || !isAuthed) return;

    let canceled = false;
    setPeopleLoading(true);
    setPeopleError(null);

    const timer = setTimeout(async () => {
      try {
        if (peopleTab === "users") {
          const data = await api.get<{ users: DiscoverUser[] }>(`/api/stalks/discover/users?q=${encodeURIComponent(query)}&limit=30`);
          if (!canceled) setUsers(Array.isArray(data.users) ? data.users : []);
          return;
        }

        const data = await api.get<{ establishments: DiscoverEstablishment[] }>(`/api/stalks/discover/establishments?q=${encodeURIComponent(query)}&limit=40`);
        if (!canceled) setEstablishments(Array.isArray(data.establishments) ? data.establishments : []);
      } catch (err) {
        if (!canceled) {
          setPeopleError(err instanceof Error ? err.message : "Could not load people");
        }
      } finally {
        if (!canceled) setPeopleLoading(false);
      }
    }, 220);

    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [mode, peopleTab, query, isAuthed]);

  const toggleStalkUser = async (u: DiscoverUser) => {
    if (!isAuthed) {
      requireAuth("Sign in to stalk users.");
      return;
    }

    const key = `user:${u.id}`;
    setBusyKey(key);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, stalking: !x.stalking } : x)));
    try {
      if (u.stalking) {
        await api.delete(`/api/stalks/users/${u.id}`);
      } else {
        await api.post(`/api/stalks/users/${u.id}`);
      }
    } catch (err) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, stalking: u.stalking } : x)));
      setPeopleError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyKey(null);
    }
  };

  const toggleStalkEstablishment = async (e: DiscoverEstablishment) => {
    if (!isAuthed) {
      requireAuth("Sign in to stalk establishments.");
      return;
    }

    const key = `est:${e.key}`;
    setBusyKey(key);
    setEstablishments((prev) => prev.map((x) => (x.key === e.key ? { ...x, stalking: !x.stalking } : x)));
    try {
      if (e.stalking) {
        await api.delete(`/api/stalks/establishments/${encodeURIComponent(e.key)}`);
      } else {
        await api.post(`/api/stalks/establishments`, { name: e.name, city: e.city });
      }
    } catch (err) {
      setEstablishments((prev) => prev.map((x) => (x.key === e.key ? { ...x, stalking: e.stalking } : x)));
      setPeopleError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="min-h-[100dvh] pb-28">
      <header className="bg-background/80 sticky top-0 z-20 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <h1 className="font-display text-2xl font-black tracking-tight">Discover</h1>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
          <button
            onClick={() => setMode("events")}
            className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === "events" ? "bg-white/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Events
          </button>
          <button
            onClick={() => setMode("people")}
            className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === "people" ? "bg-white/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            People
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">{mode === "events" ? "Find your tribe tonight." : "Stalk public calendars and keep tabs on where they go."}</p>
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
            placeholder={mode === "events" ? "Venue, city, vibe…" : "Search users or establishments…"}
            className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        {mode === "events" ? (
          <>
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
          </>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
            <button
              onClick={() => setPeopleTab("users")}
              className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${peopleTab === "users" ? "bg-white/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Users
            </button>
            <button
              onClick={() => setPeopleTab("establishments")}
              className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${peopleTab === "establishments" ? "bg-white/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Establishments
            </button>
          </div>
        )}
      </header>

      {mode === "events" ? (
        <>
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
        </>
      ) : (
        <div className="space-y-3 px-5 pt-4">
          {!isAuthed && (
            <button
              onClick={() => requireAuth("Sign in to stalk users and establishments.")}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left"
            >
              <p className="text-sm font-bold">Sign in to use stalk calendars</p>
              <p className="text-xs text-muted-foreground mt-1">Track users and establishments and blend them into your calendar.</p>
            </button>
          )}

          {isAuthed && peopleLoading && (
            <div className="flex items-center justify-center rounded-2xl border border-white/10 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading
            </div>
          )}

          {isAuthed && peopleError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {peopleError}
            </div>
          )}

          {isAuthed && !peopleLoading && peopleTab === "users" && users.map((u) => (
            <div key={u.id} className="glass rounded-2xl p-3 flex items-start gap-3">
              {u.photoURL ? (
                <img src={u.photoURL} alt={u.displayName || u.username || "User"} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{u.displayName || u.username || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">{u.username ? `@${u.username}` : "No username"}{u.city ? ` · ${u.city}` : ""}</p>
                {!!u.bio && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{u.bio}</p>}
              </div>
              <button
                onClick={() => toggleStalkUser(u)}
                disabled={busyKey === `user:${u.id}`}
                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${u.stalking ? "bg-accent/20 text-accent" : "bg-blue-600/20 text-blue-300"}`}
              >
                {busyKey === `user:${u.id}` ? "..." : u.stalking ? "Stalking" : "Stalk"}
              </button>
            </div>
          ))}

          {isAuthed && !peopleLoading && peopleTab === "establishments" && establishments.map((e) => (
            <div key={e.key} className="glass rounded-2xl p-3 flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {e.city || "Unknown city"} · {e.upcomingCount} upcoming{e.nextDate ? ` · next ${e.nextDate}` : ""}
                </p>
              </div>
              <button
                onClick={() => toggleStalkEstablishment(e)}
                disabled={busyKey === `est:${e.key}`}
                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${e.stalking ? "bg-accent/20 text-accent" : "bg-blue-600/20 text-blue-300"}`}
              >
                {busyKey === `est:${e.key}` ? "..." : e.stalking ? "Stalking" : "Stalk"}
              </button>
            </div>
          ))}

          {isAuthed && !peopleLoading && peopleTab === "users" && users.length === 0 && (
            <p className="text-muted-foreground text-center text-sm py-8">No users found.</p>
          )}
          {isAuthed && !peopleLoading && peopleTab === "establishments" && establishments.length === 0 && (
            <p className="text-muted-foreground text-center text-sm py-8">No establishments found.</p>
          )}
        </div>
      )}
      <BookingFlow event={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
};
