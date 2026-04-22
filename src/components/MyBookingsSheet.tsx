import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Zap,
  Ban,
  Pencil,
  Trophy,
  ArrowUpCircle,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBooking, Booking } from "@/context/BookingContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

/* ── helpers ──────────────────────────────────────────── */
const fmt = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const isUpcoming = (b: Booking) =>
  (b.status === "confirmed" || b.status === "held") &&
  new Date(b.date) >= new Date(new Date().toDateString());

const statusColor: Record<string, string> = {
  confirmed: "text-emerald-400 bg-emerald-400/10",
  held: "text-amber-400 bg-amber-400/10",
  cancelled: "text-rose-400 bg-rose-400/10",
  expired: "text-muted-foreground bg-muted",
};

const statusLabel: Record<string, string> = {
  confirmed: "Confirmed",
  held: "On Hold",
  cancelled: "Cancelled",
  expired: "Expired",
};

/* ── Mini Calendar ───────────────────────────────────── */
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function MiniCalendar({ dates, onMonthSelect }: { dates: string[]; onMonthSelect?: (m: string) => void }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const bookingSet = useMemo(() => new Set(dates), [dates]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = (firstDay + 6) % 7; // Monday-start
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="glass rounded-2xl p-4 mx-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10">
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
        <span className="text-sm font-bold">{monthLabel}</span>
        <button onClick={nextMonth} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          const hasBooking = bookingSet.has(dateStr);
          return (
            <button
              key={day}
              onClick={() => hasBooking && onMonthSelect?.(dateStr)}
              className={[
                "relative h-8 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-colors",
                isToday ? "bg-gradient-primary text-white font-bold" : "hover:bg-white/10",
                hasBooking && !isToday ? "text-accent font-bold" : "",
              ].join(" ")}
            >
              {day}
              {hasBooking && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Booking Card ────────────────────────────────────── */
function BookingCard({
  booking,
  onCancel,
  onReschedule,
  onUpgrade,
}: {
  booking: Booking;
  onCancel?: () => void;
  onReschedule?: () => void;
  onUpgrade?: () => void;
}) {
  const canManage = booking.status === "confirmed" || booking.status === "held";

  return (
    <div className="glass rounded-2xl overflow-hidden mx-5 mb-4">
      {/* Image / header stripe */}
      <div className="relative h-20 bg-gradient-vibe/30 flex items-center px-4 gap-3">
        {booking.eventImage ? (
          <img src={booking.eventImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : null}
        <div className="relative flex-1 min-w-0">
          <p className="font-display font-black text-base leading-tight line-clamp-1">{booking.eventTitle}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{booking.venue} · {booking.city}</span>
          </div>
        </div>
        <span className={`relative shrink-0 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${statusColor[booking.status]}`}>
          {statusLabel[booking.status]}
        </span>
      </div>

      {/* Details */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Date</span>
          </div>
          <span className="text-xs font-bold">{fmt(booking.date)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Time</span>
          </div>
          <span className="text-xs font-bold">{booking.time}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Guests</span>
          </div>
          <span className="text-xs font-bold">{booking.guests}</span>
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{booking.tableLabel}</p>
          <p className="text-sm font-black">€{booking.total}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
            >
              <ArrowUpCircle className="h-3.5 w-3.5" />
              Upgrade
            </button>
            <button
              onClick={onReschedule}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-foreground text-xs font-bold hover:bg-white/15 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Reschedule Sheet ────────────────────────────────── */
function RescheduleSheet({
  booking,
  open,
  onOpenChange,
  onSave,
}: {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (date: string) => void;
}) {
  const [date, setDate] = useState(booking?.date ?? "");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-[28px] p-0">
        <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          <button
            onClick={() => onOpenChange(false)}
            className="border-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Change Date</p>
            <h3 className="font-display mt-0.5 text-xl font-black">{booking?.eventTitle}</h3>
          </div>
        </div>
        <div className="px-5 pb-6 flex flex-col gap-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Select new date
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Rescheduling is subject to availability. Original time slot will be released.
          </p>
          <button
            disabled={!date || date === booking?.date}
            onClick={() => { onSave(date); onOpenChange(false); }}
            className="bg-gradient-primary text-primary-foreground flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold disabled:opacity-40"
          >
            <Calendar className="h-4 w-4" /> Confirm New Date
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Main Sheet ──────────────────────────────────────── */
export function MyBookingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { bookingHistory } = useBooking();
  const { cancelBooking, rescheduleBooking } = useBooking();

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "calendar">("upcoming");

  const upcoming = useMemo(() => bookingHistory.filter(isUpcoming), [bookingHistory]);
  const past = useMemo(
    () => bookingHistory.filter((b) => !isUpcoming(b)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [bookingHistory]
  );
  const allDates = useMemo(() => bookingHistory.map((b) => b.date), [bookingHistory]);

  const handleCancel = (b: Booking) => setCancelTarget(b);
  const handleReschedule = (b: Booking) => { setRescheduleTarget(b); setRescheduleOpen(true); };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-[28px] p-0 h-[92dvh]">
          <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />

          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-4 pb-3">
            <button
              onClick={() => onOpenChange(false)}
              className="border-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Profile</p>
              <h3 className="font-display mt-0.5 text-xl font-black">My Bookings</h3>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
              <Trophy className="h-3.5 w-3.5 text-accent" />
              <span>{bookingHistory.filter((b) => b.status === "confirmed").length} confirmed</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col h-full pb-8">
            <TabsList className="mx-5 mb-3 grid grid-cols-3 bg-muted/40 rounded-xl h-9">
              <TabsTrigger value="upcoming" className="text-xs font-bold rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                Upcoming {upcoming.length > 0 && <span className="ml-1 bg-accent/20 text-accent rounded-full px-1.5 text-[10px]">{upcoming.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="past" className="text-xs font-bold rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                Past
              </TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs font-bold rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <CalendarDays className="h-3.5 w-3.5 mr-1" /> Calendar
              </TabsTrigger>
            </TabsList>

            {/* Upcoming */}
            <TabsContent value="upcoming" className="overflow-y-auto flex-1 mt-0">
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-3">
                  <Zap className="h-10 w-10 text-muted-foreground/40" />
                  <p className="font-display text-lg font-black text-muted-foreground">No upcoming bookings</p>
                  <p className="text-xs text-muted-foreground">Discover events and book your next table.</p>
                </div>
              ) : (
                upcoming.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onCancel={() => handleCancel(b)}
                    onReschedule={() => handleReschedule(b)}
                    onUpgrade={() => toast.info("Upgrade options coming soon!")}
                  />
                ))
              )}
            </TabsContent>

            {/* Past */}
            <TabsContent value="past" className="overflow-y-auto flex-1 mt-0">
              {past.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-3">
                  <Trophy className="h-10 w-10 text-muted-foreground/40" />
                  <p className="font-display text-lg font-black text-muted-foreground">No past bookings yet</p>
                </div>
              ) : (
                past.map((b) => <BookingCard key={b.id} booking={b} />)
              )}
            </TabsContent>

            {/* Calendar */}
            <TabsContent value="calendar" className="overflow-y-auto flex-1 mt-0">
              <MiniCalendar dates={allDates} />
              {bookingHistory.length > 0 && (
                <div className="px-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">All Bookings</p>
                  {[...bookingHistory]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((b) => (
                      <div key={b.id} className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
                        <div className="flex flex-col items-center justify-center glass rounded-xl h-12 w-12 shrink-0">
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {new Date(b.date).toLocaleDateString("en-GB", { month: "short" })}
                          </span>
                          <span className="font-display text-lg font-black leading-none">
                            {new Date(b.date).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{b.eventTitle}</p>
                          <p className="text-xs text-muted-foreground truncate">{b.venue} · {b.tableLabel}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor[b.status]}`}>
                          {statusLabel[b.status]}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Cancel confirm dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}>
        <AlertDialogContent className="bg-card border-border rounded-2xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-black">Cancel booking?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{cancelTarget?.eventTitle}</strong> on {cancelTarget ? fmt(cancelTarget.date) : ""} will be cancelled.
              This action cannot be undone and your seat will be released.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => {
                if (cancelTarget) {
                  cancelBooking(cancelTarget.id);
                  toast.success("Booking cancelled");
                  setCancelTarget(null);
                }
              }}
            >
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule sheet */}
      <RescheduleSheet
        booking={rescheduleTarget}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onSave={(date) => {
          if (rescheduleTarget) {
            rescheduleBooking(rescheduleTarget.id, date);
            toast.success("Booking rescheduled");
          }
        }}
      />
    </>
  );
}
