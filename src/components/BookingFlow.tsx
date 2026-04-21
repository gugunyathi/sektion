import { useEffect, useMemo, useState } from "react";
import { Event } from "@/data/events";
import { getTablesForEvent, Table } from "@/data/tables";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { VibeTag } from "./VibeTag";
import { useBooking, useCountdown } from "@/context/BookingContext";
import { useInventory } from "@/context/InventoryContext";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  CreditCard,
  Lock,
  Minus,
  Plus,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = "guests" | "tables" | "review" | "pay" | "done";

export const BookingFlow = ({
  event,
  open,
  onOpenChange,
}: {
  event: Event | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const { createHold, confirmPayment } = useBooking();
  const [step, setStep] = useState<Step>("guests");
  const [guests, setGuests] = useState(1);
  const [tableId, setTableId] = useState<string | null>(null);

  const tables = useMemo(() => (event ? getTablesForEvent(event) : []), [event]);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setStep("guests");
      setGuests(1);
      setTableId(null);
    }
  }, [open, event?.id]);

  if (!event) return null;
  const selectedTable: Table | undefined = tables.find((t) => t.id === tableId);
  const total = event.pricePerSeat * guests;

  const back = () => {
    if (step === "tables") setStep("guests");
    else if (step === "review") setStep("tables");
    else if (step === "pay") setStep("review");
  };

  const handleHold = () => {
    if (!selectedTable) return;
    createHold({
      event,
      tableId: selectedTable.id,
      tableLabel: selectedTable.label,
      guests,
    });
    setStep("pay");
  };

  const handlePay = () => {
    confirmPayment();
    setStep("done");
    toast.success("Seat confirmed 🎉", { description: `${event.title} · ${event.date}` });
  };

  const STEP_INDEX: Record<Step, number> = { guests: 0, tables: 1, review: 2, pay: 3, done: 4 };
  const progress = (STEP_INDEX[step] / 4) * 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-card border-border h-[92dvh] overflow-hidden rounded-t-[28px] p-0"
      >
        {/* Header */}
        <div className="bg-gradient-radial absolute inset-x-0 top-0 h-32 rounded-t-[28px] opacity-50" />
        <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />
        <header className="relative flex items-center justify-between px-5 pt-3">
          {step !== "guests" && step !== "done" ? (
            <button
              onClick={back}
              className="border-border flex h-9 w-9 items-center justify-center rounded-full border"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {step === "done" ? "Confirmed" : "TableShare"}
            </p>
            <p className="font-display text-sm font-bold">{event.title}</p>
          </div>
          <div className="h-9 w-9" />
        </header>
        {step !== "done" && (
          <div className="bg-muted/60 relative mx-5 mt-3 h-1 overflow-hidden rounded-full">
            <div
              className="bg-gradient-vibe absolute inset-y-0 left-0 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="h-[calc(92dvh-150px)] overflow-y-auto px-5 pb-32 pt-5">
          {step === "guests" && (
            <GuestsStep event={event} guests={guests} setGuests={setGuests} />
          )}
          {step === "tables" && (
            <TablesStep
              eventId={event.id}
              tables={tables}
              guests={guests}
              tableId={tableId}
              onSelect={setTableId}
            />
          )}
          {step === "review" && selectedTable && (
            <ReviewStep
              event={event}
              guests={guests}
              table={selectedTable}
              total={total}
            />
          )}
          {step === "pay" && selectedTable && (
            <PayStep event={event} guests={guests} table={selectedTable} total={total} />
          )}
          {step === "done" && selectedTable && (
            <DoneStep event={event} guests={guests} table={selectedTable} total={total} />
          )}
        </div>

        {/* Sticky CTA */}
        <div className="glass-dark fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {step === "guests" && (
            <PrimaryCta onClick={() => setStep("tables")}>
              Choose a table · ${total}
            </PrimaryCta>
          )}
          {step === "tables" && (
            <PrimaryCta disabled={!tableId} onClick={() => setStep("review")}>
              {tableId ? "Review booking" : "Select a table"}
            </PrimaryCta>
          )}
          {step === "review" && (
            <PrimaryCta onClick={handleHold}>
              <Lock className="mr-2 h-4 w-4" /> Hold seat for 1 hour
            </PrimaryCta>
          )}
          {step === "pay" && (
            <PrimaryCta onClick={handlePay}>
              <CreditCard className="mr-2 h-4 w-4" /> Pay ${total} now
            </PrimaryCta>
          )}
          {step === "done" && (
            <PrimaryCta onClick={() => onOpenChange(false)}>Done</PrimaryCta>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const PrimaryCta = ({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "font-display flex h-14 w-full items-center justify-center rounded-2xl text-base font-bold uppercase tracking-wider transition-transform active:scale-[0.98]",
      disabled
        ? "bg-muted text-muted-foreground"
        : "bg-gradient-primary shadow-neon text-primary-foreground",
    )}
  >
    {children}
  </button>
);

/* ---------- Step 1: Guests ---------- */
const GuestsStep = ({
  event,
  guests,
  setGuests,
}: {
  event: Event;
  guests: number;
  setGuests: (n: number) => void;
}) => {
  const { seatsLeftForEvent } = useInventory();
  const seatsLeft = seatsLeftForEvent(event.id);
  return (
    <div className="space-y-6 animate-float-up">
      <div>
        <h2 className="font-display text-2xl font-black leading-tight">How many of you?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          You'll be seated with curated sharers — pick how many seats to claim.
        </p>
      </div>
      <div className="bg-muted/50 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setGuests(Math.max(1, guests - 1))}
            className="border-border flex h-12 w-12 items-center justify-center rounded-full border"
            aria-label="Decrease guests"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="font-display text-6xl font-black">{guests}</div>
            <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              {guests === 1 ? "guest" : "guests"}
            </div>
          </div>
          <button
            onClick={() => setGuests(Math.min(Math.max(1, seatsLeft), guests + 1))}
            disabled={guests >= seatsLeft}
            className="border-border flex h-12 w-12 items-center justify-center rounded-full border disabled:opacity-40"
            aria-label="Increase guests"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <p className="text-muted-foreground mt-4 text-center text-xs">
          <span className={cn("font-semibold", seatsLeft === 0 ? "text-destructive" : "text-secondary")}>
            {seatsLeft}
          </span>{" "}
          seat{seatsLeft === 1 ? "" : "s"} left across all tables
        </p>
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4">
        <Sparkles className="text-secondary mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-relaxed text-foreground/85">
          <span className="font-semibold">Smart matching</span> places you with sharers whose vibes align with yours.
        </p>
      </div>
    </div>
  );
};

/* ---------- Step 2: Tables ---------- */
const TablesStep = ({
  eventId,
  tables,
  guests,
  tableId,
  onSelect,
}: {
  eventId: string;
  tables: Table[];
  guests: number;
  tableId: string | null;
  onSelect: (id: string) => void;
}) => {
  const { seatsLeftForTable } = useInventory();
  return (
  <div className="space-y-4 animate-float-up">
    <div>
      <h2 className="font-display text-2xl font-black leading-tight">Pick your table</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Live availability — locked the moment you confirm.
      </p>
    </div>
    {tables.map((t) => {
      const free = seatsLeftForTable(eventId, t.id);
      const fits = free >= guests;
      const active = tableId === t.id;
      return (
        <button
          key={t.id}
          onClick={() => fits && onSelect(t.id)}
          disabled={!fits}
          className={cn(
            "block w-full rounded-2xl border p-4 text-left transition-all",
            active
              ? "border-primary bg-primary/10 shadow-neon"
              : fits
                ? "border-border bg-muted/40 hover:border-primary/40"
                : "border-border bg-muted/20 opacity-50",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display text-base font-bold">{t.label}</p>
                {active && (
                  <span className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">{t.vibe}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.perks.map((p) => (
                  <span
                    key={p}
                    className="bg-background/60 border-border rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
              {t.hostedBy && (
                <div className="mt-3 flex items-center gap-2">
                  <img
                    src={t.hostedBy.avatar}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                    loading="lazy"
                    width={48}
                    height={48}
                  />
                  <span className="text-xs text-foreground/80">
                    Hosted by <span className="font-semibold">{t.hostedBy.name}</span>
                  </span>
                  {t.hostedBy.verified && <BadgeCheck className="text-accent h-3.5 w-3.5" />}
                </div>
              )}
            </div>
            <div className="text-right">
              <div
                className={cn(
                  "flex items-center justify-end gap-1 text-xs font-semibold",
                  fits ? "text-secondary" : "text-destructive",
                )}
              >
                <Users className="h-3 w-3" />
                {free}/{t.capacity}
              </div>
              <p className="text-muted-foreground mt-0.5 text-[10px] uppercase tracking-wider">
                seats free
              </p>
            </div>
          </div>
        </button>
      );
    })}
  </div>
  );
};

/* ---------- Step 3: Review ---------- */
const ReviewStep = ({
  event,
  guests,
  table,
  total,
}: {
  event: Event;
  guests: number;
  table: Table;
  total: number;
}) => (
  <div className="space-y-5 animate-float-up">
    <div>
      <h2 className="font-display text-2xl font-black leading-tight">Review your seat</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Looks good? We'll hold this for 60 minutes while you pay.
      </p>
    </div>
    <div className="bg-muted/40 overflow-hidden rounded-2xl">
      <img
        src={event.image}
        alt={event.title}
        className="aspect-[16/9] w-full object-cover"
        loading="lazy"
        width={832}
        height={468}
      />
      <div className="space-y-3 p-4">
        <div>
          <div className="mb-1.5 flex flex-wrap gap-1">
            {event.vibes.map((v) => <VibeTag key={v} vibe={v} />)}
          </div>
          <p className="font-display text-lg font-black">{event.title}</p>
          <p className="text-muted-foreground text-xs">
            {event.venue} · {event.city} · {event.date} · {event.time}
          </p>
        </div>
        <Divider />
        <Row label="Table" value={table.label} />
        <Row label="Guests" value={`${guests} × $${event.pricePerSeat}`} />
        <Row label="Service fee" value="Included" />
        <Divider />
        <Row label="Total" value={`$${total}`} bold />
      </div>
    </div>
    <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4">
      <Shield className="text-accent mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-xs leading-relaxed text-foreground/85">
        ID-verified sharers · Table Guardian on-site · Full refund if seat reopens.
      </p>
    </div>
  </div>
);

/* ---------- Step 4: Pay ---------- */
const PayStep = ({
  event,
  guests,
  table,
  total,
}: {
  event: Event;
  guests: number;
  table: Table;
  total: number;
}) => {
  const { booking } = useBooking();
  return (
    <div className="space-y-5 animate-float-up">
      <div>
        <h2 className="font-display text-2xl font-black leading-tight">Lock it in</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Your seat is held — complete payment before the timer runs out.
        </p>
      </div>

      {booking && booking.status === "held" && (
        <CountdownCard expiresAt={booking.expiresAt} />
      )}

      <div className="bg-muted/40 space-y-3 rounded-2xl p-4">
        <Row label="Event" value={event.title} />
        <Row label="Table" value={table.label} />
        <Row label="Guests" value={String(guests)} />
        <Divider />
        <Row label="Total due" value={`$${total}`} bold />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
          Payment method
        </p>
        <div className="border-primary bg-primary/5 flex items-center justify-between rounded-2xl border p-4">
          <div className="flex items-center gap-3">
            <span className="bg-gradient-primary flex h-9 w-12 items-center justify-center rounded-md">
              <CreditCard className="text-primary-foreground h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Visa · 4242</p>
              <p className="text-muted-foreground text-xs">Expires 04/28</p>
            </div>
          </div>
          <span className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        </div>
      </div>
    </div>
  );
};

/* ---------- Step 5: Done ---------- */
const DoneStep = ({
  event,
  guests,
  table,
  total,
}: {
  event: Event;
  guests: number;
  table: Table;
  total: number;
}) => (
  <div className="flex flex-col items-center text-center animate-float-up">
    <div className="bg-gradient-primary shadow-neon mb-6 mt-4 flex h-20 w-20 items-center justify-center rounded-full">
      <Check className="text-primary-foreground h-10 w-10" strokeWidth={3} />
    </div>
    <h2 className="font-display text-3xl font-black leading-tight">You're in.</h2>
    <p className="text-muted-foreground mt-2 max-w-xs text-sm">
      {table.label} at {event.venue}. We've messaged the other sharers.
    </p>
    <div className="bg-muted/40 mt-6 w-full space-y-3 rounded-2xl p-4 text-left">
      <Row label="When" value={`${event.date} · ${event.time}`} />
      <Row label="Where" value={`${event.venue}, ${event.city}`} />
      <Row label="Guests" value={String(guests)} />
      <Row label="Paid" value={`$${total}`} bold />
    </div>
  </div>
);

/* ---------- Bits ---------- */
const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
    <span className={cn("text-sm", bold ? "font-display text-base font-black" : "font-medium")}>
      {value}
    </span>
  </div>
);

const Divider = () => <div className="bg-border/60 h-px w-full" />;

const CountdownCard = ({ expiresAt }: { expiresAt: number }) => {
  const { label, percent, expired } = useCountdown(expiresAt);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4",
        expired
          ? "border-destructive/50 bg-destructive/10"
          : "border-secondary/40 bg-secondary/5",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={cn("h-4 w-4", expired ? "text-destructive" : "text-secondary")} />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {expired ? "Hold expired" : "Pay within"}
          </span>
        </div>
        <span
          className={cn(
            "font-display text-2xl font-black tabular-nums",
            expired ? "text-destructive" : "text-secondary",
          )}
        >
          {label}
        </span>
      </div>
      <div className="bg-background/40 mt-3 h-1.5 overflow-hidden rounded-full">
        <div
          className={cn("h-full transition-all", expired ? "bg-destructive" : "bg-gradient-vibe")}
          style={{ width: `${percent * 100}%` }}
        />
      </div>
    </div>
  );
};
