import { useEffect, useMemo, useState } from "react";
import { Event } from "@/data/events";
import {
  ALL_TABLE_TYPES,
  getTablesForEvent,
  Table,
  TABLE_TYPE_META,
  TableType,
} from "@/data/tables";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { VibeTag } from "./VibeTag";
import { TableTypeBadge } from "./TableTypeBadge";
import { SharersSheet } from "./SharersSheet";
import { useBooking, useCountdown } from "@/context/BookingContext";
import { useInventory } from "@/context/InventoryContext";
import { useSeatAvailability } from "@/context/SeatAvailabilityContext";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  CreditCard,
  Crown,
  Lock,
  Minus,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  Heart,
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
  const { seatsLeftForTable, seatsLeftForEvent } = useInventory();
  const { fetchAvailability, getEventAvailability } = useSeatAvailability();
  const [step, setStep] = useState<Step>("guests");
  const [guests, setGuests] = useState(1);
  const [tableId, setTableId] = useState<string | null>(null);

  // Detect if this is a DB-backed event (has a MongoDB _id)
  const dbId = (event as unknown as { _id?: string })._id;

  // Fetch real availability whenever the sheet opens for a DB event
  useEffect(() => {
    if (open && dbId && event) {
      fetchAvailability(event.id);
    }
  }, [open, event?.id, dbId, fetchAvailability]);

  // For DB events, use real tables from the API; fall back to mock-generated tables
  const apiAvailability = dbId ? getEventAvailability(event?.id ?? "") : null;
  const tables = useMemo(() => {
    if (apiAvailability?.tables && apiAvailability.tables.length > 0) {
      return apiAvailability.tables.map((t): Table => ({
        id: t.id,
        label: t.label,
        capacity: t.capacity,
        taken: t.taken,
        perks: t.perks,
        vibe: t.vibe,
        tableType: t.tableType as TableType,
        includedItems: t.includedItems,
      }));
    }
    return event ? getTablesForEvent(event) : [];
  }, [event, apiAvailability]);

  // Real seatsLeft: from API for DB events, from InventoryContext for mock events
  const seatsLeft = apiAvailability?.seatsLeft ?? (event ? seatsLeftForEvent(event.id) : 0);

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

  const handlePay = async () => {
    if (!selectedTable) return;
    try {
      await confirmPayment();
      setStep("done");
      // Refresh availability after confirm so seat counts update
      if (dbId && event) fetchAvailability(event.id);
      toast.success("Seat confirmed 🎉", { description: `${event.title} · ${event.date}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Booking failed";
      if (msg.includes("seat") || msg.includes("available")) {
        toast.error("Seats just got taken", {
          description: "Please pick another table — this one no longer fits your party.",
        });
        setStep("tables");
      } else {
        toast.error(msg);
      }
    }
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
              {step === "done" ? "Confirmed" : "Sektion"}
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
            <GuestsStep event={event} guests={guests} setGuests={setGuests} seatsLeft={seatsLeft} />
          )}
          {step === "tables" && (
            <TablesStep
              event={event}
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
  seatsLeft: seatsLeftProp,
}: {
  event: Event;
  guests: number;
  setGuests: (n: number) => void;
  seatsLeft?: number;
}) => {
  const { seatsLeftForEvent } = useInventory();
  const seatsLeft = seatsLeftProp ?? seatsLeftForEvent(event.id);
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
  event,
  tables,
  guests,
  tableId,
  onSelect,
}: {
  event: Event;
  tables: Table[];
  guests: number;
  tableId: string | null;
  onSelect: (id: string) => void;
}) => {
  const { seatsLeftForTable } = useInventory();
  const { getAvailableSeats } = useSeatAvailability();
  const [typeFilters, setTypeFilters] = useState<TableType[]>([]);

  const toggle = (t: TableType) =>
    setTypeFilters((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const visible = typeFilters.length
    ? tables.filter((t) => typeFilters.includes(t.tableType))
    : tables;

  const selectedTable = tableId ? tables.find((t) => t.id === tableId) : null;
  const standardFree = selectedTable ? seatsLeftForTable(event.id, selectedTable.id) : 0;
  const releasedFree = selectedTable ? getAvailableSeats(event.id, selectedTable.id) : 0;
  const free = standardFree + releasedFree;
  const fits = selectedTable && free >= guests;
  const meta = selectedTable ? TABLE_TYPE_META[selectedTable.tableType] : undefined;

  return (
    <div className="space-y-4 animate-float-up">
      <div>
        <h2 className="font-display text-2xl font-black leading-tight">Pick your table</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Filter by vibe and select your table.
        </p>
      </div>

      {/* Table type filters */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {ALL_TABLE_TYPES.map((tt) => {
          const active = typeFilters.includes(tt);
          return (
            <button
              key={tt}
              onClick={() => toggle(tt)}
              className={cn("shrink-0 transition-transform", active ? "scale-105" : "opacity-70")}
            >
              <TableTypeBadge
                type={tt}
                long
                className={active ? "ring-2 ring-foreground/40" : ""}
              />
            </button>
          );
        })}
      </div>

      {/* Tables grid - compact cards */}
      <div className="space-y-2 pb-4">
        {visible.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No tables match those filters — try clearing one.
          </p>
        ) : (
          visible.map((t) => {
            const stdFree = seatsLeftForTable(event.id, t.id);
            const relFree = getAvailableSeats(event.id, t.id);
            const totalFree = stdFree + relFree;
            const canFit = totalFree >= guests;
            const isSelected = tableId === t.id;

            return (
              <button
                key={t.id}
                onClick={() => canFit && onSelect(t.id)}
                disabled={!canFit}
                className={cn(
                  "relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-neon"
                    : canFit
                      ? "border-border bg-muted/40 hover:border-primary/40"
                      : "border-destructive/30 bg-destructive/5 cursor-not-allowed opacity-60",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TableTypeBadge type={t.tableType} />
                      {isSelected && (
                        <span className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="font-display text-base font-bold">{t.label}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{t.vibe}</p>
                    {t.hostedBy && (
                      <p className="text-xs text-foreground/70 mt-1.5">
                        Hosted by <span className="font-semibold">{t.hostedBy.name}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm font-bold",
                        canFit ? "text-secondary" : "text-destructive",
                      )}
                    >
                      <Users className="h-4 w-4" />
                      {totalFree}/{t.capacity}
                    </div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider mt-0.5">
                      seats free
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
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
}) => {
  const [sharersOpen, setSharersOpen] = useState(false);
  const refundable = Math.round(total * 0.9);
  const fee = total - refundable;
  return (
    <div className="flex flex-col items-center text-center animate-float-up">
      <div className="bg-gradient-primary shadow-neon mb-6 mt-4 flex h-20 w-20 items-center justify-center rounded-full">
        <Check className="text-primary-foreground h-10 w-10" strokeWidth={3} />
      </div>
      <h2 className="font-display text-3xl font-black leading-tight">You're in.</h2>
      <p className="text-muted-foreground mt-2 max-w-xs text-sm">
        {table.label} at {event.venue}. We've messaged the other sharers.
      </p>

      <div className="bg-muted/40 mt-6 w-full space-y-3 rounded-2xl p-4 text-left">
        <div className="flex items-center gap-1.5">
          <TableTypeBadge type={table.tableType} long />
        </div>
        <Row label="When" value={`${event.date} · ${event.time}`} />
        <Row label="Where" value={`${event.venue}, ${event.city}`} />
        <Row label="Guests" value={String(guests)} />
        <Divider />
        <Row label="Paid" value={`$${total}`} bold />
      </div>

      {/* Escrow panel */}
      <div className="mt-4 w-full overflow-hidden rounded-2xl border border-accent/30 bg-accent/5 p-4 text-left">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-accent h-4 w-4" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
            Held in escrow
          </p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-foreground/85">
          Your <span className="font-semibold">${total}</span> is held safely. Funds release to
          venue & sharers only once everyone shows up.
        </p>
        <div className="mt-3 space-y-2 rounded-xl bg-background/40 p-3 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cancel 24h+ before</span>
            <span className="text-secondary font-semibold">${refundable} refund</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">10% platform fee withheld</span>
            <span className="text-foreground/80">${fee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Event cancelled by host</span>
            <span className="text-secondary font-semibold">100% pro-rata refund</span>
          </div>
        </div>
        {table.seeking?.payer === "host" && table.seeking.billBudget && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-secondary/30 bg-secondary/5 p-2.5 text-[11px] leading-snug">
            <Crown className="text-secondary mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Host-pays table — your{" "}
              <span className="font-semibold">${table.seeking.billBudget}</span> covers the full
              bill. Refunded pro-rata if cancelled in time.
            </span>
          </p>
        )}
      </div>

      {/* Sharers preview */}
      <button
        onClick={() => setSharersOpen(true)}
        className="border-border bg-muted/30 hover:border-primary/40 mt-4 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors"
      >
        <div className="flex -space-x-2">
          {event.sharers.slice(0, 4).map((s) => (
            <img
              key={s.id}
              src={s.avatar}
              alt={s.name}
              className="border-card h-8 w-8 rounded-full border-2 object-cover"
              loading="lazy"
              width={64}
              height={64}
            />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Meet your sharers</p>
          <p className="text-muted-foreground text-[11px]">
            Tap to view all {event.sharers.length} profiles
          </p>
        </div>
      </button>

      <SharersSheet
        sharers={event.sharers}
        open={sharersOpen}
        onOpenChange={setSharersOpen}
        title={table.label}
      />
    </div>
  );
};

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
