import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Event } from "@/data/events";

const HOLD_DURATION_MS = 60 * 60 * 1000; // 1 hour
const STORAGE_KEY = "tableshare.booking.v1";

export type BookingStatus = "held" | "confirmed" | "expired";

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
  status: BookingStatus;
};

type Ctx = {
  booking: Booking | null;
  createHold: (args: {
    event: Event;
    tableId: string;
    tableLabel: string;
    guests: number;
  }) => Booking;
  confirmPayment: () => void;
  releaseSeat: () => void;
};

const BookingContext = createContext<Ctx | null>(null);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [booking, setBooking] = useState<Booking | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Booking;
      // Auto-expire stale holds on load
      if (parsed.status === "held" && Date.now() >= parsed.expiresAt) {
        return { ...parsed, status: "expired" };
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Persist
  useEffect(() => {
    if (booking) localStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    else localStorage.removeItem(STORAGE_KEY);
  }, [booking]);

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

  const createHold: Ctx["createHold"] = useCallback(({ event, tableId, tableLabel, guests }) => {
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
  }, []);

  const confirmPayment = useCallback(() => {
    setBooking((b) => (b ? { ...b, status: "confirmed" } : b));
  }, []);

  const releaseSeat = useCallback(() => setBooking(null), []);

  return (
    <BookingContext.Provider value={{ booking, createHold, confirmPayment, releaseSeat }}>
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
