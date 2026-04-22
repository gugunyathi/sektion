import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EVENTS } from "@/data/events";
import { getTablesForEvent } from "@/data/tables";
import { useBooking } from "./BookingContext";

/**
 * Seat inventory: subtract held/confirmed seats from each event/table so other
 * users (or other tabs) see the lower availability instantly. Restored when
 * the hold expires or is released.
 */

export type Lock = {
  bookingId: string;
  eventId: string;
  tableId: string;
  guests: number;
  expiresAt: number;
  status: "held" | "confirmed";
};

const LOCKS_KEY = "tableshare.locks.v1";

type Ctx = {
  /** seats remaining on a given table, after subtracting active locks */
  seatsLeftForTable: (eventId: string, tableId: string) => number;
  /** seats remaining across all tables in an event */
  seatsLeftForEvent: (eventId: string) => number;
};

const InventoryContext = createContext<Ctx | null>(null);

/** Fallback used if a consumer renders outside the provider (e.g. during HMR). */
const fallbackCtx: Ctx = {
  seatsLeftForTable: (eventId, tableId) => {
    const event = EVENTS.find((e) => e.id === eventId);
    if (!event) return 0;
    const table = getTablesForEvent(event).find((t) => t.id === tableId);
    if (!table) return 0;
    return Math.max(0, table.capacity - table.taken);
  },
  seatsLeftForEvent: (eventId) => EVENTS.find((e) => e.id === eventId)?.seatsLeft ?? 0,
};

const readLocks = (): Lock[] => {
  try {
    const raw = localStorage.getItem(LOCKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Lock[];
  } catch {
    return [];
  }
};

const writeLocks = (locks: Lock[]) => {
  localStorage.setItem(LOCKS_KEY, JSON.stringify(locks));
};

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { booking } = useBooking();
  const [locks, setLocks] = useState<Lock[]>(readLocks);
  const [, setNow] = useState(Date.now());

  // Sync the current user's booking into the locks list
  useEffect(() => {
    setLocks((prev) => {
      // Strip any prior lock from this booking id (or stale ones for same user)
      const others = prev.filter(
        (l) => l.bookingId !== booking?.id && !l.bookingId.startsWith("bk_self_"),
      );
      if (booking && (booking.status === "held" || booking.status === "confirmed")) {
        const next: Lock = {
          bookingId: booking.id,
          eventId: booking.eventId,
          tableId: booking.tableId,
          guests: booking.guests,
          expiresAt: booking.expiresAt,
          status: booking.status,
        };
        const updated = [...others, next];
        writeLocks(updated);
        return updated;
      }
      writeLocks(others);
      return others;
    });
  }, [booking]);

  // Tick every second so expired locks fall off in real time
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  // Cross-tab sync: pick up locks created in other browser tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCKS_KEY) setLocks(readLocks());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const activeLocks = useMemo(
    () => locks.filter((l) => l.status === "confirmed" || l.expiresAt > Date.now()),
    // recompute whenever locks change OR the per-second tick re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locks, Math.floor(Date.now() / 1000)],
  );

  const seatsLeftForTable = useCallback(
    (eventId: string, tableId: string) => {
      const event = EVENTS.find((e) => e.id === eventId);
      if (!event) return 0;
      const table = getTablesForEvent(event).find((t) => t.id === tableId);
      if (!table) return 0;
      const lockedHere = activeLocks
        .filter((l) => l.eventId === eventId && l.tableId === tableId)
        .reduce((sum, l) => sum + l.guests, 0);
      return Math.max(0, table.capacity - table.taken - lockedHere);
    },
    [activeLocks],
  );

  const seatsLeftForEvent = useCallback(
    (eventId: string) => {
      const event = EVENTS.find((e) => e.id === eventId);
      if (!event) return 0;
      const lockedHere = activeLocks
        .filter((l) => l.eventId === eventId)
        .reduce((sum, l) => sum + l.guests, 0);
      return Math.max(0, event.seatsLeft - lockedHere);
    },
    [activeLocks],
  );

  return (
    <InventoryContext.Provider value={{ seatsLeftForTable, seatsLeftForEvent }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  // Fall back to base inventory if rendered outside the provider (avoids HMR crashes).
  return ctx ?? fallbackCtx;
};
