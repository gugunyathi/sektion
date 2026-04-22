import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "@/lib/api";

export type BookmarkType = "event" | "venue" | "table";

export type Bookmark = {
  id: string;
  type: BookmarkType;
  refId: string;         // eventId / venueId / tableId
  title: string;
  subtitle: string;
  image: string;
  savedAt: number;
  city?: string;
};

type Ctx = {
  bookmarks: Bookmark[];
  isBookmarked: (refId: string) => boolean;
  toggleBookmark: (item: Omit<Bookmark, "id" | "savedAt">) => void;
  removeBookmark: (refId: string) => void;
  clearBookmarks: () => void;
};

const BookmarksContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "sektion.bookmarks.v1";

export const BookmarksProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthed } = useAuth();
  const userKey = user ? `${STORAGE_KEY}.${user.id}` : null;
  const syncedRef = useRef<string | null>(null);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Load when user changes
  useEffect(() => {
    if (!userKey) { setBookmarks([]); return; }

    // If authenticated, fetch from API (once per user session)
    if (isAuthed && syncedRef.current !== userKey) {
      syncedRef.current = userKey;
      api.get<Bookmark[]>("/api/bookmarks")
        .then((items) => setBookmarks(items))
        .catch(() => {
          // Fall back to localStorage
          try {
            const raw = localStorage.getItem(userKey);
            setBookmarks(raw ? JSON.parse(raw) : []);
          } catch { setBookmarks([]); }
        });
      return;
    }

    try {
      const raw = localStorage.getItem(userKey);
      setBookmarks(raw ? JSON.parse(raw) : []);
    } catch {
      setBookmarks([]);
    }
  }, [userKey, isAuthed]);

  // Persist locally as backup
  useEffect(() => {
    if (!userKey) return;
    localStorage.setItem(userKey, JSON.stringify(bookmarks));
  }, [bookmarks, userKey]);

  const isBookmarked = useCallback((refId: string) => bookmarks.some((b) => b.refId === refId), [bookmarks]);

  const toggleBookmark = useCallback(async (item: Omit<Bookmark, "id" | "savedAt">) => {
    const exists = bookmarks.find((b) => b.refId === item.refId);
    if (exists) {
      setBookmarks((prev) => prev.filter((b) => b.refId !== item.refId));
      if (isAuthed) api.delete(`/api/bookmarks/${item.refId}`).catch(() => {});
    } else {
      const newBm: Bookmark = { ...item, id: `bm_${Date.now()}`, savedAt: Date.now() };
      setBookmarks((prev) => [newBm, ...prev]);
      if (isAuthed) {
        api.post<Bookmark>("/api/bookmarks", item)
          .then((saved) => {
            setBookmarks((prev) => prev.map((b) => b.refId === saved.refId ? saved : b));
          })
          .catch(() => {});
      }
    }
  }, [bookmarks, isAuthed]);

  const removeBookmark = useCallback((refId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.refId !== refId));
    if (isAuthed) api.delete(`/api/bookmarks/${refId}`).catch(() => {});
  }, [isAuthed]);

  const clearBookmarks = useCallback(async () => {
    setBookmarks([]);
    if (isAuthed) api.delete("/api/bookmarks").catch(() => {});
  }, [isAuthed]);

  return (
    <BookmarksContext.Provider value={{ bookmarks, isBookmarked, toggleBookmark, removeBookmark, clearBookmarks }}>
      {children}
    </BookmarksContext.Provider>
  );
};

export const useBookmarks = () => {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
};
