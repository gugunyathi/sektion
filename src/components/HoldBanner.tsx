import { useBooking, useCountdown } from "@/context/BookingContext";
import { AlertTriangle, Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { BookingFlow } from "./BookingFlow";
import { EVENTS } from "@/data/events";

/** Floating banner that surfaces an active hold, expired hold, or confirmation across the app. */
export const HoldBanner = () => {
  const { booking, releaseSeat } = useBooking();
  const { label, percent, expired } = useCountdown(booking?.expiresAt);
  const [reopen, setReopen] = useState(false);

  if (!booking) return null;
  const event = EVENTS.find((e) => e.id === booking.eventId) ?? null;

  if (booking.status === "confirmed") {
    return (
      <Wrap accent="confirmed">
        <span className="bg-secondary text-secondary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">
            Confirmed
          </p>
          <p className="truncate text-sm font-semibold">{booking.eventTitle}</p>
        </div>
        <button onClick={releaseSeat} aria-label="Dismiss" className="text-muted-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </Wrap>
    );
  }

  if (booking.status === "expired" || expired) {
    return (
      <Wrap accent="expired">
        <span className="bg-destructive/20 text-destructive flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-destructive text-[10px] font-bold uppercase tracking-wider">
            Hold expired · seat reopened
          </p>
          <p className="truncate text-sm font-semibold">{booking.eventTitle}</p>
        </div>
        <button
          onClick={releaseSeat}
          className="border-border rounded-full border px-3 py-1 text-xs font-semibold"
        >
          Dismiss
        </button>
      </Wrap>
    );
  }

  // Held & ticking
  return (
    <>
      <Wrap accent="held">
        <button
          onClick={() => setReopen(true)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className="bg-secondary/15 text-secondary relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <Clock className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Seat held · pay to lock in
            </p>
            <p className="truncate text-sm font-semibold">
              {booking.eventTitle} · {booking.guests} guest{booking.guests > 1 ? "s" : ""}
            </p>
          </div>
          <span className="font-display text-secondary text-xl font-black tabular-nums">
            {label}
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            releaseSeat();
          }}
          aria-label="Release hold"
          className="border-border hover:border-destructive hover:text-destructive ml-1 shrink-0 rounded-full border p-2 text-muted-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="bg-background/40 absolute inset-x-3 bottom-1.5 h-1 overflow-hidden rounded-full">
          <div
            className="bg-gradient-vibe h-full transition-all"
            style={{ width: `${percent * 100}%` }}
          />
        </div>
      </Wrap>
      <BookingFlow event={event} open={reopen} onOpenChange={setReopen} />
    </>
  );
};

const Wrap = ({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: "held" | "expired" | "confirmed";
}) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-md justify-center px-4">
    <div
      className={cn(
        "glass pointer-events-auto relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 pb-4 shadow-card animate-float-up",
        accent === "held" && "border border-secondary/40",
        accent === "confirmed" && "border border-secondary/40",
        accent === "expired" && "border border-destructive/40",
      )}
    >
      {children}
    </div>
  </div>
);
