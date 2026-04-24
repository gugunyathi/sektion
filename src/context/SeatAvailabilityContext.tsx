import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/api";

export type ApiTableAvailability = {
  id: string;
  label: string;
  capacity: number;
  taken: number;
  available: number;
  tableType: string;
  vibe: string;
  perks: string[];
  includedItems: { id: string; emoji: string; name: string; category: string }[];
};

export type EventAvailability = {
  seatsLeft: number;
  totalSeats: number;
  tables: ApiTableAvailability[];
};

export type SeatAvailability = {
  eventId: string;
  tableId: string;
  availableSeats: number;
  releaseReason?: string; // e.g., "user_no_show", "voluntary_release"
  releasedAt: number;
  userId?: string;
};

type Ctx = {
  availability: SeatAvailability[];
  releaseSeat: (args: {
    eventId: string;
    tableId: string;
    seatsToRelease: number;
    reason: "no_show" | "voluntary";
  }) => void;
  getAvailableSeats: (eventId: string, tableId: string) => number;
  /** Fetch real-time availability from the API for a DB event */
  fetchAvailability: (eventId: string) => Promise<void>;
  /** Returns fetched availability data if available */
  getEventAvailability: (eventId: string) => EventAvailability | null;
};

const SeatAvailabilityContext = createContext<Ctx | null>(null);

export const SeatAvailabilityProvider = ({ children }: { children: ReactNode }) => {
  const [availability, setAvailability] = useState<SeatAvailability[]>([]);
  const [apiAvailMap, setApiAvailMap] = useState<Record<string, EventAvailability>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  // Auto-cleanup old releases after 2 hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAvailability((prev) =>
        prev.filter((a) => now - a.releasedAt < 2 * 60 * 60 * 1000)
      );
    }, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const releaseSeat = useCallback(
    ({
      eventId,
      tableId,
      seatsToRelease,
      reason,
    }: {
      eventId: string;
      tableId: string;
      seatsToRelease: number;
      reason: "no_show" | "voluntary";
    }) => {
      const existing = availability.find(
        (a) => a.eventId === eventId && a.tableId === tableId
      );

      if (existing) {
        setAvailability((prev) =>
          prev.map((a) =>
            a.eventId === eventId && a.tableId === tableId
              ? {
                  ...a,
                  availableSeats: a.availableSeats + seatsToRelease,
                  releasedAt: Date.now(),
                }
              : a
          )
        );
      } else {
        const newAvailability: SeatAvailability = {
          eventId,
          tableId,
          availableSeats: seatsToRelease,
          releaseReason:
            reason === "no_show"
              ? "Attendee didn't show up"
              : "Voluntarily released",
          releasedAt: Date.now(),
          userId: `user_${Math.random().toString(36).substr(2, 9)}`,
        };
        setAvailability((prev) => [...prev, newAvailability]);
      }
    },
    [availability]
  );

  const getAvailableSeats = useCallback(
    (eventId: string, tableId: string) => {
      const item = availability.find(
        (a) => a.eventId === eventId && a.tableId === tableId
      );
      return item?.availableSeats ?? 0;
    },
    [availability]
  );

  const fetchAvailability = useCallback(async (eventId: string) => {
    if (fetchingRef.current.has(eventId)) return;
    fetchingRef.current.add(eventId);
    try {
      const data = await api.get<EventAvailability>(`/api/events/${eventId}/availability`);
      setApiAvailMap((prev) => ({ ...prev, [eventId]: data }));
    } catch {
      // silently ignore — falls back to mock data
    } finally {
      fetchingRef.current.delete(eventId);
    }
  }, []);

  const getEventAvailability = useCallback(
    (eventId: string): EventAvailability | null => apiAvailMap[eventId] ?? null,
    [apiAvailMap]
  );

  return (
    <SeatAvailabilityContext.Provider
      value={{
        availability,
        releaseSeat,
        getAvailableSeats,
        fetchAvailability,
        getEventAvailability,
      }}
    >
      {children}
    </SeatAvailabilityContext.Provider>
  );
};

export const useSeatAvailability = () => {
  const ctx = useContext(SeatAvailabilityContext);
  if (!ctx) {
    throw new Error(
      "useSeatAvailability must be used within SeatAvailabilityProvider"
    );
  }
  return ctx;
};
