import { Event, MediaItem } from "@/data/events";
import { VibeTag } from "./VibeTag";
import { SharersSheet } from "./SharersSheet";
import { MediaCarousel } from "./MediaCarousel";
import { MediaUploadSheet } from "./MediaUploadSheet";
import { Bookmark, Heart, MapPin, MessageCircle, Send, Users, Zap, CheckCircle2, Clock, ShieldAlert, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useInventory } from "@/context/InventoryContext";
import { toast } from "sonner";
import { getTablesForEvent, IncludedItem } from "@/data/tables";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const EventCard = ({ event, onOpen }: { event: Event; onOpen: (e: Event) => void }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharersOpen, setSharersOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>(event.media ?? []);
  const [active, setActive] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const { seatsLeftForEvent } = useInventory();
  const seatsLeft = seatsLeftForEvent(event.id);

  // Gather included items from all tables for this event
  const allItems: IncludedItem[] = (() => {
    const tables = getTablesForEvent(event);
    const seen = new Set<string>();
    return tables.flatMap((t) => t.includedItems ?? []).filter((item) => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
  })();

  // Mock: pretend the current user hosts a couple of events so upload/remove controls show
  const isHost = event.id === "e1" || event.id === "e3";

  // Get moderation status of media (prioritize worse status)
  const getModerationStatus = () => {
    if (media.some((m) => m.status === "frozen")) return "frozen";
    if (media.some((m) => m.status === "pending")) return "pending";
    return "approved";
  };

  const moderationStatus = getModerationStatus();

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setActive(entry.intersectionRatio > 0.6),
      { threshold: [0, 0.6, 1] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleAdd = () => {
    setUploadOpen(true);
  };

  const handleMediaUpload = (
    newMedia: Omit<MediaItem, "id" | "uploadedBy" | "status" | "flags">
  ) => {
    const id = `${event.id}-u${Date.now()}`;
    setMedia((m) => [
      ...m,
      {
        ...newMedia,
        id,
        uploadedBy: "you",
        status: "pending",
        flags: 0,
      },
    ]);
    toast.success("Media uploaded. Pending moderation.");
  };

  const handleRemove = (id: string) => setMedia((m) => m.filter((x) => x.id !== id));
  const handleFlag = (id: string) =>
    setMedia((m) => m.map((x) => (x.id === id ? { ...x, status: "frozen", flags: x.flags + 1 } : x)));

  return (
    <article ref={articleRef} className="snap-item relative h-[100dvh] w-full overflow-hidden">
      <MediaCarousel
        media={media}
        active={active}
        isHost={isHost}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onFlag={handleFlag}
      />
      <div className="absolute inset-0 bg-gradient-overlay pointer-events-none" />
      <div className="bg-gradient-radial absolute inset-x-0 top-0 h-1/2 opacity-60 pointer-events-none" />

      {/* Top meta */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          {event.trending && (
            <span className="bg-secondary/95 text-secondary-foreground animate-pulse-neon flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
              <Zap className="h-3 w-3" /> Trending
            </span>
          )}
          {event.surge && (
            <span className="glass rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-glow">
              Surge
            </span>
          )}
          {/* Moderation status badge */}
          {moderationStatus === "approved" && (
            <span className="glass rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Approved
            </span>
          )}
          {moderationStatus === "pending" && (
            <span className="glass rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pending
            </span>
          )}
          {moderationStatus === "frozen" && (
            <span className="glass rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Frozen
            </span>
          )}
        </div>
        <span className="glass rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
          {event.category}
        </span>
      </header>

      {/* Action rail */}
      <aside className="absolute bottom-40 right-4 z-10 flex flex-col items-center gap-5">
        <button
          onClick={() => setLiked((v) => !v)}
          className="flex flex-col items-center gap-1"
          aria-label="Like"
        >
          <span
            className={cn(
              "glass flex h-12 w-12 items-center justify-center rounded-full transition-all",
              liked && "bg-primary/30 border-primary/60 shadow-neon",
            )}
          >
            <Heart className={cn("h-6 w-6", liked ? "fill-primary text-primary" : "text-foreground")} />
          </span>
          <span className="text-[11px] font-semibold text-foreground/90 drop-shadow">
            {(liked ? 1 : 0) + 234}
          </span>
        </button>
        <button className="flex flex-col items-center gap-1" aria-label="Comments">
          <span className="glass flex h-12 w-12 items-center justify-center rounded-full">
            <MessageCircle className="h-6 w-6 text-foreground" />
          </span>
          <span className="text-[11px] font-semibold text-foreground/90 drop-shadow">42</span>
        </button>
        <button className="flex flex-col items-center gap-1" aria-label="Share">
          <span className="glass flex h-12 w-12 items-center justify-center rounded-full">
            <Send className="h-6 w-6 text-foreground" />
          </span>
          <span className="text-[11px] font-semibold text-foreground/90 drop-shadow">18</span>
        </button>
        <button onClick={() => setSaved((v) => !v)} aria-label="Save" className="flex flex-col items-center">
          <span className="glass flex h-12 w-12 items-center justify-center rounded-full">
            <Bookmark className={cn("h-6 w-6", saved ? "fill-secondary text-secondary" : "text-foreground")} />
          </span>
        </button>
      </aside>

      {/* Included items strip */}
      {allItems.length > 0 && (
        <div className="absolute inset-x-0 z-20 flex items-center gap-2 px-4"
          style={{ top: "calc(max(1.25rem, env(safe-area-inset-top)) + 5.5rem)" }}
        >
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {allItems.slice(0, 6).map((item) => (
              <div
                key={item.id + item.name}
                className="glass flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-xl shadow-sm"
              >
                <span>{item.emoji}</span>
              </div>
            ))}
          </div>
          {allItems.length > 0 && (
            <button
              onClick={() => setItemsOpen(true)}
              className="glass flex h-14 w-9 shrink-0 items-center justify-center rounded-xl"
              aria-label="View all included items"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-32">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {event.vibes.map((v) => <VibeTag key={v} vibe={v} />)}
        </div>
        <h2 className="font-display text-3xl font-black leading-tight tracking-tight">
          {event.title}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground/85">
          <MapPin className="h-3.5 w-3.5" />
          <span className="font-medium">{event.venue}</span>
          <span className="text-foreground/50">·</span>
          <span>{event.city}</span>
        </p>
        <p className="mt-1 text-sm font-medium text-foreground/70">
          {event.date} · {event.time}
        </p>

        {/* Sharers strip — tap to view profiles */}
        <button
          onClick={() => setSharersOpen(true)}
          className="mt-4 flex items-center gap-3 rounded-full bg-background/30 backdrop-blur-md px-2 py-1.5 pr-3 active:scale-[0.98] transition-transform"
          aria-label="View sharers"
        >
          <div className="flex -space-x-3">
            {event.sharers.slice(0, 4).map((s) => (
              <img
                key={s.id}
                src={s.avatar}
                alt={s.name}
                className="border-background h-9 w-9 rounded-full border-2 object-cover"
                loading="lazy"
                width={64}
                height={64}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-foreground/90">
            <Users className="h-3.5 w-3.5" />
            <span className={cn("font-semibold", seatsLeft === 0 ? "text-destructive" : "text-secondary")}>
              {seatsLeft}
            </span>
            <span>of {event.totalSeats} · view all</span>
          </div>
        </button>

        {/* CTA */}
        <button
          onClick={() => onOpen(event)}
          className="bg-gradient-primary shadow-neon mt-5 flex h-14 w-full items-center justify-between rounded-2xl px-6 text-primary-foreground active:scale-[0.98] transition-transform"
        >
          <span className="font-display text-base font-bold uppercase tracking-wider">TableShare</span>
          <span className="flex items-baseline gap-1">
            <span className="text-xs font-medium opacity-80">from</span>
            <span className="font-display text-xl font-black">${event.pricePerSeat}</span>
          </span>
        </button>
      </div>

      <SharersSheet
        sharers={event.sharers}
        open={sharersOpen}
        onOpenChange={setSharersOpen}
        title={`${event.title} · sharers`}
      />
      <MediaUploadSheet
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSave={handleMediaUpload}
      />

      {/* Included items sheet */}
      <Sheet open={itemsOpen} onOpenChange={setItemsOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-[28px] p-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />
          <div className="px-5 pt-4 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">What's included</p>
            <h3 className="font-display mt-0.5 text-xl font-black">{event.title}</h3>
          </div>
          {(["drink", "food", "mixer", "extra"] as const).map((cat) => {
            const catItems = allItems.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;
            const labels: Record<string, string> = { drink: "Drinks", food: "Food", mixer: "Mixers & Soft", extra: "Extras" };
            return (
              <div key={cat} className="px-5 py-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{labels[cat]}</p>
                <div className="grid grid-cols-4 gap-3">
                  {catItems.map((item) => (
                    <div key={item.id + item.name} className="flex flex-col items-center gap-1.5">
                      <div className="glass flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-sm">
                        {item.emoji}
                      </div>
                      <span className="text-center text-[10px] font-medium leading-tight text-foreground/80">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </SheetContent>
      </Sheet>
    </article>
  );
};
