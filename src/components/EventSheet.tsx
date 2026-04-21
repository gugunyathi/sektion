import { Event } from "@/data/events";
import { VibeTag } from "./VibeTag";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BadgeCheck, Clock, Minus, Plus, Shield, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const EventSheet = ({
  event,
  open,
  onOpenChange,
}: {
  event: Event | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const [guests, setGuests] = useState(1);

  if (!event) return null;
  const total = event.pricePerSeat * guests;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-card border-border h-[88dvh] overflow-y-auto rounded-t-[28px] p-0"
      >
        <div className="bg-gradient-radial absolute inset-x-0 top-0 h-40 rounded-t-[28px] opacity-60" />
        <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />

        <SheetHeader className="relative px-6 pt-4 text-left">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {event.vibes.map((v) => <VibeTag key={v} vibe={v} />)}
          </div>
          <SheetTitle className="font-display text-2xl font-black leading-tight">
            {event.title}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {event.venue} · {event.city} · {event.date} · {event.time}
          </p>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-32 pt-6">
          {/* Host note */}
          <div className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-glow">
              <Sparkles className="h-3.5 w-3.5" /> From the host
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{event.hostNote}</p>
          </div>

          {/* Sharers */}
          <div>
            <h3 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">
              Who's sharing your table
            </h3>
            <div className="space-y-2">
              {event.sharers.map((s) => (
                <div key={s.id} className="bg-muted/40 flex items-center gap-3 rounded-2xl p-3">
                  <img
                    src={s.avatar}
                    alt={s.name}
                    className="h-12 w-12 rounded-full object-cover"
                    loading="lazy"
                    width={64}
                    height={64}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold">{s.name}</p>
                      {s.verified && <BadgeCheck className="h-4 w-4 text-accent" />}
                    </div>
                    <div className="mt-1">
                      <VibeTag vibe={s.vibe} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guests selector */}
          <div className="bg-muted/40 rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-sm font-bold uppercase tracking-wider">Guests</span>
              <span className="text-xs text-muted-foreground">{event.seatsLeft} seats left</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className="border-border flex h-11 w-11 items-center justify-center rounded-full border"
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-display text-3xl font-black">{guests}</span>
              <button
                onClick={() => setGuests((g) => Math.min(event.seatsLeft, g + 1))}
                className="border-border flex h-11 w-11 items-center justify-center rounded-full border"
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Trust */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Shield className="text-accent h-4 w-4" />
            <span>Verified sharers · ID-checked hosts · Table Guardian on-site</span>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="glass-dark fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Pay within 1 hour to lock in
            </span>
            <span className="text-foreground/90">
              <span className="font-semibold">${total}</span> total
            </span>
          </div>
          <button
            onClick={() => {
              toast.success("Seat held! Complete payment to confirm.", {
                description: `${guests} seat${guests > 1 ? "s" : ""} at ${event.title}`,
              });
              onOpenChange(false);
            }}
            className="bg-gradient-primary shadow-neon font-display flex h-14 w-full items-center justify-center rounded-2xl text-base font-bold uppercase tracking-wider text-primary-foreground active:scale-[0.98] transition-transform"
          >
            Hold my seat
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
