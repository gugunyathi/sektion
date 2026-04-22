import { useCallback, useEffect, useState } from "react";

export type LocationState = {
  city: string | null;
  loading: boolean;
  error: string | null;
  /** Re-trigger detection */
  detect: () => void;
};

/** Reverse-geocode coords → city name via OpenStreetMap Nominatim (free, no key) */
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      data?.address?.county ||
      null
    );
  } catch {
    return null;
  }
}

const CACHE_KEY = "sektion.location.v1";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function loadCache(): { city: string; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (Date.now() - v.ts > CACHE_TTL) return null;
    return v;
  } catch {
    return null;
  }
}

export function useLocation(): LocationState {
  const cached = loadCache();
  const [city, setCity] = useState<string | null>(cached?.city ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const name = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setCity(name);
        if (name) localStorage.setItem(CACHE_KEY, JSON.stringify({ city: name, ts: Date.now() }));
        setLoading(false);
      },
      (err) => {
        setError(err.code === 1 ? "Location permission denied" : "Could not detect location");
        setLoading(false);
      },
      { timeout: 8000, maximumAge: CACHE_TTL }
    );
  }, []);

  // Auto-detect on mount if no cache
  useEffect(() => {
    if (!cached) detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { city, loading, error, detect };
}
