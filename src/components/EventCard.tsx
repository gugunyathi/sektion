import { Event } from "@/data/events";
import { VibeTag } from "./VibeTag";
import { SharersSheet } from "./SharersSheet";
import { Bookmark, Heart, MapPin, MessageCircle, Send, Users, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useInventory } from "@/context/InventoryContext";

export const EventCard = ({ event, onOpen }: { event: Event; onOpen: (e: Event) => void }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharersOpen, setSharersOpen] = useState(false);
  const { seatsLeftForEvent } = useInventory();
  const seatsLeft = seatsLeftForEvent(event.id);

  return (
    <article className="snap-item relative h-[100dvh] w-full overflow-hidden">
      <img
        src={event.image}
        alt={event.title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        width={832}
        height={1472}
      />
      <div className="absolute inset-0 bg-gradient-overlay" />
      <div className="bg-gradient-radial absolute inset-x-0 top-0 h-1/2 opacity-60" />

      {/* Top meta */}
      <header className="absolute inset-x-0 top-0 flex items-start justify-between p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
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

        {/* Sharers strip */}
        <div className="mt-4 flex items-center gap-3">
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
          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
            <Users className="h-3.5 w-3.5" />
            <span className={cn("font-semibold", seatsLeft === 0 ? "text-destructive" : "text-secondary")}>
              {seatsLeft}
            </span>
            <span>of {event.totalSeats} seats left</span>
          </div>
        </div>

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
    </article>
  );
};
