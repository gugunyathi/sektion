import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Event } from "@/data/events";
import { api, getTokens } from "@/lib/api";

const HOLD_DURATION_MS = 60 * 60 * 1000; // 1 hour
const STORAGE_KEY = "tableshare.booking.v1";
const HISTORY_KEY = "tableshare.booking.history.v1";

export type BookingStatus = "held" | "confirmed" | "expired" | "cancelled";

export type Booking = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  tableId: string;
  tableLabel: string;
  guests: number;
  pricePerSeat: number;
  total: number;
  heldAt: number;
  expiresAt: number;
  confirmedAt?: number;
  cancelledAt?: number;
  status: BookingStatus;
  notes?: string;
};

type Ctx = {
  booking: Booking | null;
  bookingHistory: Booking[];
  createHold: (args: {
    event: Event;
    tableId: string;
    tableLabel: string;
    guests: number;
  }) => Promise<Booking>;
  confirmPayment: () => Promise<void>;
  releaseSeat: () => void;
  cancelBooking: (id: string) => Promise<void>;
  rescheduleBooking: (id: string, newDate: string) => Promise<void>;
  upgradeBooking: (id: string, newTableId: string, newTableLabel: string, newTotal: number) => Promise<void>;
  addBookingNote: (id: string, notes: string) => Promise<void>;
};

const BookingContext = createContext<Ctx | null>(null);

/* ---------- Mock seed data ---------- */
const MOCK_PAST_BOOKINGS: Booking[] = [
  {
    id: "bk_demo_1",
    eventId: "evt_1",
    eventTitle: "Neon Garden — DJ Kira",
    eventImage: "",
    venue: "Club Nova",
    city: "Berlin",
    date: "2026-03-15",
    time: "22:00",
    tableId: "t1",
    tableLabel: "Booth A3",
    guests: 4,
    pricePerSeat: 85,
    total: 340,
    heldAt: new Date("2026-03-15T20:00:00").getTime(),
    expiresAt: new Date("2026-03-15T21:00:00").getTime(),
    confirmedAt: new Date("2026-03-15T20:05:00").getTime(),
    status: "confirmed",
  },
  {
    id: "bk_demo_2",
    eventId: "evt_2",
    eventTitle: "Fine Dining Night — Chef Luca",
    eventImage: "",
    venue: "Osteria 36",
    city: "Milan",
    date: "2026-02-20",
    time: "20:00",
    tableId: "t3",
    tableLabel: "Table 8",
    guests: 2,
    pricePerSeat: 120,
    total: 240,
    heldAt: new Date("2026-02-20T18:00:00").getTime(),
    expiresAt: new Date("2026-02-20T19:00:00").getTime(),
    confirmedAt: new Date("2026-02-20T18:10:00").getTime(),
    status: "confirmed",
  },
  {
    id: "bk_demo_3",
    eventId: "evt_3",
    eventTitle: "Rooftop Lounge — Sunset Series",
    eventImage: "",
    venue: "Sky Bar",
    city: "Barcelona",
    date: "2026-01-10",
    time: "19:30",
    tableId: "t2",
    tableLabel: "Terrace B1",
    guests: 3,
    pricePerSeat: 65,
    total: 195,
    heldAt: new Date("2026-01-10T17:00:00").getTime(),
    expiresAt: new Date("2026-01-10T18:00:00").getTime(),
    cancelledAt: new Date("2026-01-09T10:00:00").getTime(),
    status: "cancelled",
  },
];

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const isAuthed = !!getTokens();
  const syncedRef = useRef(false);

  const [booking, setBooking] = useState<Booking | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Booking;
      if (parsed.status === "held" && Date.now() >= parsed.expiresAt) {
        return { ...parsed, status: "expired" };
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [bookingHistory, setBookingHistory] = useState<Booking[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as Booking[]) : MOCK_PAST_BOOKINGS;
    } catch {
      return MOCK_PAST_BOOKINGS;
    }
  });

  // When authenticated, load bookings from API (once per session)
  useEffect(() => {
    if (!isAuthed || syncedRef.current) return;
    syncedRef.current = true;
    api.get<Booking[]>("/api/bookings")
      .then((items) => {
        const active = items.find((b) => b.status === "held" || b.status === "confirmed");
        setBookingHistory(items);
        if (active) setBooking(active);
        else setBooking(null);
      })
      .catch(() => { /* fall through to localStorage */ });
  }, [isAuthed]);

  // Persist booking
  useEffect(() => {
    if (booking) localStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    else localStorage.removeItem(STORAGE_KEY);
  }, [booking]);

  // Persist history
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(bookingHistory));
  }, [bookingHistory]);

  // Auto-release when timer hits zero
  useEffect(() => {
    if (!booking || booking.status !== "held") return;
    const ms = booking.expiresAt - Date.now();
    if (ms <= 0) {
      setBooking({ ...booking, status: "expired" });
      return;
    }
    const t = setTimeout(() => {
      setBooking((b) => (b && b.status === "held" ? { ...b, status: "expired" } : b));
    }, ms);
    return () => clearTimeout(t);
  }, [booking]);

  const createHold: Ctx["createHold"] = useCallback(async ({ event, tableId, tableLabel, guests }) => {
    if (isAuthed) {
      try {
        const created = await api.post<Booking>("/api/bookings", {
          eventId: event.id,
          eventTitle: event.title,
          eventImage: event.image,
          venue: event.venue,
          city: event.city,
          date: event.date,
          time: event.time,
          tableId,
          tableLabel,
          guests,
          pricePerSeat: event.pricePerSeat,
        });
        setBooking(created);
        return created;
      } catch { /* fall through */ }
    }
    const now = Date.now();
    const next: Booking = {
      id: `bk_${now}`,
      eventId: event.id,
      eventTitle: event.title,
      eventImage: event.image,
      venue: event.venue,
      city: event.city,
      date: event.date,
      time: event.time,
      tableId,
      tableLabel,
      guests,
      pricePerSeat: event.pricePerSeat,
      total: event.pricePerSeat * guests,
      heldAt: now,
      expiresAt: now + HOLD_DURATION_MS,
      status: "held",
    };
    setBooking(next);
    return next;
  }, [isAuthed]);

  const confirmPayment = useCallback(async () => {
    if (!booking) return;
    if (isAuthed) {
      try {
        const confirmed = await api.patch<Booking>(`/api/bookings/${booking.id}/confirm`);
        setBooking(confirmed);
        setBookingHistory((h) => {
          const exists = h.find((b) => b.id === confirmed.id);
          return exists ? h.map((b) => b.id === confirmed.id ? confirmed : b) : [confirmed, ...h];
        });
        return;
      } catch { /* fall through */ }
    }
    setBooking((b) => {
      if (!b) return b;
      const confirmed = { ...b, status: "confirmed" as const, confirmedAt: Date.now() };
      setBookingHistory((h) => [confirmed, ...h]);
      return confirmed;
    });
  }, [booking, isAuthed]);

  const releaseSeat = useCallback(() => setBooking(null), []);

  const cancelBooking = useCallback(async (id: string) => {
    if (isAuthed) {
      try {
        const updated = await api.patch<Booking>(`/api/bookings/${id}/cancel`);
        setBookingHistory((h) => h.map((b) => b.id === id ? updated : b));
        setBooking((b) => b?.id === id ? updated : b);
        return;
      } catch { /* fall through */ }
    }
    const now = Date.now();
    setBookingHistory((h) =>
      h.map((b) => b.id === id ? { ...b, status: "cancelled" as const, cancelledAt: now } : b)
    );
    setBooking((b) => b?.id === id ? { ...b, status: "cancelled" as const, cancelledAt: now } : b);
  }, [isAuthed]);

  const rescheduleBooking = useCallback(async (id: string, newDate: string) => {
    if (isAuthed) {
      try {
        const updated = await api.patch<Booking>(`/api/bookings/${id}/reschedule`, { date: newDate });
        setBookingHistory((h) => h.map((b) => b.id === id ? updated : b));
        setBooking((b) => b?.id === id ? updated : b);
        return;
      } catch { /* fall through */ }
    }
    setBookingHistory((h) => h.map((b) => b.id === id ? { ...b, date: newDate } : b));
    setBooking((b) => b?.id === id ? { ...b, date: newDate } : b);
  }, [isAuthed]);

  const upgradeBooking = useCallback(async (id: string, newTableId: string, newTableLabel: string, newTotal: number) => {
    if (isAuthed) {
      try {
        const updated = await api.patch<Booking>(`/api/bookings/${id}/upgrade`, { tableId: newTableId, tableLabel: newTableLabel, total: newTotal });
        setBookingHistory((h) => h.map((b) => b.id === id ? updated : b));
        setBooking((b) => b?.id === id ? updated : b);
        return;
      } catch { /* fall through */ }
    }
    setBookingHistory((h) =>
      h.map((b) => b.id === id ? { ...b, tableId: newTableId, tableLabel: newTableLabel, total: newTotal } : b)
    );
    setBooking((b) => b?.id === id ? { ...b, tableId: newTableId, tableLabel: newTableLabel, total: newTotal } : b);
  }, [isAuthed]);

  const addBookingNote = useCallback(async (id: string, notes: string) => {
    if (isAuthed) {
      try {
        const updated = await api.patch<Booking>(`/api/bookings/${id}/notes`, { notes });
        setBookingHistory((h) => h.map((b) => b.id === id ? updated : b));
        setBooking((b) => b?.id === id ? updated : b);
        return;
      } catch { /* fall through */ }
    }
    setBookingHistory((h) => h.map((b) => b.id === id ? { ...b, notes } : b));
    setBooking((b) => b?.id === id ? { ...b, notes } : b);
  }, [isAuthed]);

  return (
    <BookingContext.Provider value={{
      booking,
      bookingHistory,
      createHold,
      confirmPayment,
      releaseSeat,
      cancelBooking,
      rescheduleBooking,
      upgradeBooking,
      addBookingNote,
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
};

/** Live countdown hook returning ms remaining + formatted string. */
export const useCountdown = (expiresAt: number | undefined) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [expiresAt]);
  if (!expiresAt) return { ms: 0, label: "00:00", expired: true, percent: 0 };
  const ms = Math.max(0, expiresAt - now);
  const total = HOLD_DURATION_MS;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return {
    ms,
    label: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    expired: ms <= 0,
    percent: Math.max(0, Math.min(1, ms / total)),
  };
};

export { HOLD_DURATION_MS };
