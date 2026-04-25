import { useState, useEffect, useRef } from "react";
import {
  BadgeCheck,
  Bookmark,
  CalendarDays,
  Crown,
  FileEdit,
  Flame,
  ImagePlus,
  LogOut,
  MoreVertical,
  Pencil,
  Settings,
  Trash2,
  Trophy,
  Upload,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { VibeTag } from "../VibeTag";
import { MyBookingsSheet } from "../MyBookingsSheet";
import { ProfileSetupSheet } from "../ProfileSetupSheet";
import { Footer } from "../Footer";
import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/context/BookmarksContext";
import { api } from "@/lib/api";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import a1 from "@/assets/avatar-1.jpg";
import club from "@/assets/event-club.jpg";
import dining from "@/assets/event-dining.jpg";
import themed from "@/assets/event-themed.jpg";
import lounge from "@/assets/event-lounge.jpg";

const BADGES = [
  { icon: Flame, label: "Party Legend", grad: "bg-gradient-primary" },
  { icon: Utensils, label: "Foodie Explorer", grad: "bg-gradient-gold" },
  { icon: Trophy, label: "First Share", grad: "bg-gradient-vibe" },
  { icon: Crown, label: "City #3", grad: "bg-gradient-gold" },
];

const COLLAGE = [club, dining, themed, lounge, club, dining];

/* ── Draft Section ───────────────────────────────────── */
const DRAFT_KEY = "sektion.upload.form";

interface DraftForm {
  title?: string;
  venue?: string;
  city?: string;
  date?: string;
  category?: string;
}

function DraftSection({ onResume }: { onResume: () => void }) {
  const [draft, setDraft] = useState<DraftForm | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed: DraftForm = JSON.parse(raw);
        // Only show if there's meaningful content
        if (parsed.title || parsed.venue) {
          setDraft(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
  };

  if (!draft) return null;

  return (
    <section className="mt-8 px-5">
      <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
        <FileEdit className="h-4 w-4 text-amber-400" /> Draft
      </h2>
      <div className="glass rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{draft.title || "Untitled Sektion"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {[draft.venue, draft.city, draft.date].filter(Boolean).join(" · ") || "No details yet"}
            </p>
            {draft.category && (
              <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold">
                {draft.category}
              </span>
            )}
          </div>
          <button
            onClick={clearDraft}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Discard draft"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={onResume}
          className="mt-3 w-full rounded-xl bg-amber-500/20 border border-amber-500/30 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors"
        >
          Continue Editing
        </button>
      </div>
    </section>
  );
}

/* ── My Sektions Section ─────────────────────────────── */
const CATEGORIES = ["Club", "Dining", "Lounge", "Rave", "Themed"] as const;
const VIBE_OPTIONS = ["Party Animal", "Luxe", "Foodie", "Chill", "Rave", "Social", "Romantic", "LGBTQ+", "Networking"];

interface ApiMedia { src: string; kind: string; id?: string; }
interface ApiEvent {
  _id: string;
  id?: string;
  title: string;
  venue?: string;
  city?: string;
  date?: string;
  time?: string;
  category?: string;
  vibes?: string[];
  pricePerSeat?: number;
  totalSeats?: number;
  hostNote?: string;
  media?: ApiMedia[];
  createdAt?: string;
}

interface EditForm {
  title: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  category: string;
  vibes: string[];
  pricePerSeat: string;
  totalSeats: string;
  hostNote: string;
}

function MySektionsSection() {
  const { isAuthed } = useAuth();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiEvent | null>(null);
  const [editTarget, setEditTarget] = useState<ApiEvent | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", venue: "", city: "", date: "", time: "", category: "", vibes: [], pricePerSeat: "", totalSeats: "", hostNote: "" });
  const [editMedia, setEditMedia] = useState<ApiMedia[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!isAuthed) return;
    setLoading(true);
    api.get<{ events: ApiEvent[] }>("/api/events?mine=1&limit=50")
      .then(({ events: all }) => setEvents(all.slice(0, 50)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [isAuthed]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (e: ApiEvent) => {
    setEditForm({
      title: e.title ?? "",
      venue: e.venue ?? "",
      city: e.city ?? "",
      date: e.date ?? "",
      time: e.time ?? "",
      category: e.category ?? "",
      vibes: Array.isArray(e.vibes) ? e.vibes : [],
      pricePerSeat: e.pricePerSeat != null ? String(e.pricePerSeat) : "",
      totalSeats: e.totalSeats != null ? String(e.totalSeats) : "",
      hostNote: e.hostNote ?? "",
    });
    setEditMedia(Array.isArray(e.media) ? e.media : []);
    setEditTarget(e);
    setMenuOpenId(null);
  };

  const toggleVibe = (v: string) =>
    setEditForm((f) => ({
      ...f,
      vibes: f.vibes.includes(v) ? f.vibes.filter((x) => x !== v) : [...f.vibes, v],
    }));

  const handleAddMedia = async (file: File) => {
    if (!editTarget?._id) return;
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append("media", file);
      const result = await api.upload<{ mediaItem?: ApiMedia }>(`/api/events/${editTarget._id}/media/upload`, fd);
      if (!result.mediaItem?.src) throw new Error("Upload failed");
      const newItem: ApiMedia = {
        src: result.mediaItem.src,
        kind: result.mediaItem.kind,
        id: result.mediaItem.id ?? `m-${Date.now()}`,
      };
      setEditMedia((m) => [...m, newItem]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Media upload failed");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = (idx: number) => setEditMedia((m) => m.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await api.patch(`/api/events/${editTarget._id}`, {
        ...editForm,
        pricePerSeat: Number(editForm.pricePerSeat) || 0,
        totalSeats: Number(editForm.totalSeats) || 0,
        mediaUrls: editMedia.map((m) => m.src),
      });
      toast.success("Sektion updated");
      setEditTarget(null);
      load();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    setDeleteTarget(null); // close dialog immediately
    setEvents((prev) => prev.filter((e) => e._id !== id)); // remove from UI immediately
    try {
      await api.delete(`/api/events/${id}`);
      toast.success("Sektion removed from feed");
    } catch {
      toast.error("Failed to remove sektion");
      load(); // reload to restore on error
    }
  };

  if (!isAuthed) return null;
  if (!loading && events.length === 0) return null;

  return (
    <>
      <section className="mt-8 px-5">
        <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Upload className="h-4 w-4 text-blue-400" /> My Sektions
          {events.length > 0 && <span className="text-muted-foreground font-normal normal-case tracking-normal text-xs">· {events.length}</span>}
        </h2>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 no-scrollbar">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 w-36 h-44 glass rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
            {events.map((e) => {
              const cover = e.media?.find((m) => m.kind === "image")?.src ?? e.media?.[0]?.src;
              const isMenuOpen = menuOpenId === e._id;
              return (
                <div key={e._id} className="shrink-0 w-36 glass rounded-2xl overflow-hidden relative">
                  {cover ? (
                    <img src={cover} alt={e.title} className="h-20 w-full object-cover" loading="lazy" width={144} height={80} />
                  ) : (
                    <div className="h-20 w-full bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-white/30" />
                    </div>
                  )}
                  <button
                    onClick={() => setMenuOpenId(isMenuOpen ? null : e._id)}
                    className="absolute top-1 right-1 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
                    aria-label="Options"
                  >
                    <MoreVertical className="h-3.5 w-3.5 text-white" />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute top-8 right-1 z-20 glass rounded-xl overflow-hidden min-w-[120px] shadow-xl border border-white/10">
                      <button onClick={() => openEdit(e)} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold hover:bg-white/10 transition-colors">
                        <Pencil className="h-3.5 w-3.5 text-blue-400" /> Edit
                      </button>
                      <button onClick={() => { setDeleteTarget(e); setMenuOpenId(null); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold hover:bg-white/10 transition-colors text-red-400">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-bold leading-tight line-clamp-2">{e.title}</p>
                    {e.venue && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{e.venue}</p>}
                    {e.category && (
                      <span className="mt-1 inline-block rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">{e.category}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Full Edit Sheet ── */}
      <Sheet open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[92dvh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Edit Sektion</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-8">
            {/* Text fields */}
            {([
              { field: "title", label: "Title", type: "text" },
              { field: "venue", label: "Venue", type: "text" },
              { field: "city", label: "City", type: "text" },
              { field: "date", label: "Date", type: "date" },
              { field: "time", label: "Time", type: "time" },
            ] as { field: keyof EditForm; label: string; type: string }[]).map(({ field, label, type }) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={`edit-${field}`} className="text-xs font-semibold">{label}</Label>
                <Input
                  id={`edit-${field}`}
                  value={editForm[field] as string}
                  onChange={(ev) => setEditForm((f) => ({ ...f, [field]: ev.target.value }))}
                  type={type}
                  className="glass border-white/10"
                />
              </div>
            ))}

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, category: c }))}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${editForm.category === c ? "bg-blue-500 text-white" : "glass text-muted-foreground hover:bg-white/10"}`}
                  >{c}</button>
                ))}
              </div>
            </div>

            {/* Vibes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Vibes</Label>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVibe(v)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${editForm.vibes.includes(v) ? "bg-gradient-primary text-white shadow-neon" : "glass text-muted-foreground hover:bg-white/10"}`}
                  >{v}</button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Price per seat ($)</Label>
                <Input value={editForm.pricePerSeat} onChange={(ev) => setEditForm((f) => ({ ...f, pricePerSeat: ev.target.value }))} type="number" min="0" className="glass border-white/10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Total seats</Label>
                <Input value={editForm.totalSeats} onChange={(ev) => setEditForm((f) => ({ ...f, totalSeats: ev.target.value }))} type="number" min="1" className="glass border-white/10" />
              </div>
            </div>

            {/* Host note */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Host Note</Label>
              <textarea
                value={editForm.hostNote}
                onChange={(ev) => setEditForm((f) => ({ ...f, hostNote: ev.target.value }))}
                rows={3}
                className="glass border border-white/10 w-full rounded-xl px-3 py-2 text-sm bg-transparent resize-none outline-none focus:ring-1 focus:ring-white/20"
                placeholder="Tell guests what to expect…"
              />
            </div>

            {/* Media management */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Media</Label>
              <div className="flex flex-wrap gap-2">
                {editMedia.map((m, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden glass">
                    {m.kind === "video"
                      ? <video src={m.src} className="h-full w-full object-cover" muted />
                      : <img src={m.src} alt="" className="h-full w-full object-cover" />}
                    <button
                      onClick={() => handleRemoveMedia(i)}
                      className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-black/70"
                      aria-label="Remove media"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => mediaFileRef.current?.click()}
                  disabled={uploadingMedia}
                  className="h-20 w-20 glass rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {uploadingMedia ? <span className="text-[10px]">Uploading…</span> : <><ImagePlus className="h-5 w-5" /><span className="text-[10px]">Add</span></>}
                </button>
                <input
                  ref={mediaFileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(ev) => { const f = ev.target.files?.[0]; if (f) handleAddMedia(f); ev.target.value = ""; }}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !editForm.title.trim()}
              className="w-full rounded-2xl bg-gradient-primary py-3 text-sm font-bold shadow-neon disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this Sektion?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.title}</strong> will be hidden from the feed and your profile. The data is retained in the system for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── Saved/Bookmarks panel ───────────────────────────── */
function SavedSection() {
  const { bookmarks } = useBookmarks();
  const { requireAuth } = useAuth();
  const { isAuthed } = useAuth();

  if (!isAuthed) {
    return (
      <section className="mt-8 px-5">
        <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">Saved</h2>
        <button
          onClick={() => requireAuth("Sign in to save your favourite tables and events.")}
          className="glass w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground hover:bg-white/10 transition-colors"
        >
          <Bookmark className="h-8 w-8 opacity-30" />
          <p className="text-sm font-bold">Sign in to save favourites</p>
          <p className="text-xs opacity-60">Your saved events &amp; tables appear here</p>
        </button>
      </section>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <section className="mt-8 px-5">
        <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">Saved</h2>
        <div className="glass w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
          <Bookmark className="h-8 w-8 opacity-30" />
          <p className="text-sm font-bold">Nothing saved yet</p>
          <p className="text-xs opacity-60">Tap the bookmark icon on any event to save it</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 px-5">
      <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">
        Saved · {bookmarks.length}
      </h2>
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
        {bookmarks.map((bm) => (
          <div key={bm.id} className="shrink-0 w-36 glass rounded-2xl overflow-hidden">
            {bm.image ? (
              <img src={bm.image} alt={bm.title} className="h-20 w-full object-cover" loading="lazy" width={144} height={80} />
            ) : (
              <div className="h-20 w-full bg-gradient-vibe/30" />
            )}
            <div className="p-2">
              <p className="text-xs font-bold leading-tight line-clamp-1">{bm.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{bm.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Main component ──────────────────────────────────── */
export const ProfileScreen = ({ onOpenUpload }: { onOpenUpload?: () => void }) => {
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const { bookingHistory } = useBooking();
  const { user, isAuthed, requireAuth, signOut } = useAuth();

  const upcomingCount = bookingHistory.filter(
    (b) =>
      (b.status === "confirmed" || b.status === "held") &&
      new Date(b.date) >= new Date(new Date().toDateString())
  ).length;

  // Real user values vs demo fallbacks
  const displayName = user?.displayName ?? "@niko.r";
  const username = user?.username ? `@${user.username}` : "@niko.r";
  const bio = user?.bio ?? "Foodie by day, party legend by night. Negroni enthusiast. Always at the head of the table.";
  const city = user?.city ?? "Berlin";
  const vibes = user?.vibes?.length ? user.vibes : ["Foodie", "Party Animal", "Luxe"];
  const profileIncomplete = isAuthed && !user?.profileComplete;

  return (
  <div className="min-h-[100dvh] pb-28">
    {/* Hero */}
    <div className="relative">
      <div className="bg-gradient-vibe absolute inset-x-0 top-0 h-48 opacity-40 blur-3xl" />
      <header className="relative flex items-start justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{city} · DE</div>
        <div className="flex items-center gap-2">
          {isAuthed && (
            <button
              onClick={() => setSetupOpen(true)}
              className="glass flex h-9 w-9 items-center justify-center rounded-full"
              aria-label="Edit profile"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {isAuthed ? (
            <button
              onClick={signOut}
              className="glass flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button className="glass flex h-9 w-9 items-center justify-center rounded-full" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Profile incomplete banner */}
      {profileIncomplete && (
        <button
          onClick={() => setSetupOpen(true)}
          className="mx-5 mt-3 w-[calc(100%-2.5rem)] flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-2xl px-4 py-2.5"
        >
          <Zap className="h-4 w-4 text-accent shrink-0" />
          <span className="text-xs font-bold text-accent">Complete your profile to unlock all features</span>
        </button>
      )}

      <div className="relative mt-6 flex flex-col items-center px-5">
        <div className="bg-gradient-primary shadow-neon rounded-full p-1">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={displayName} className="bg-background h-24 w-24 rounded-full border-4 border-background object-cover" loading="lazy" width={96} height={96} />
          ) : (
            <img src={a1} alt={displayName} className="bg-background h-24 w-24 rounded-full border-4 border-background object-cover" loading="lazy" width={256} height={256} />
          )}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <h1 className="font-display text-2xl font-black">{isAuthed && user?.username ? username : "@niko.r"}</h1>
          {isAuthed && <BadgeCheck className="text-accent h-5 w-5" />}
        </div>
        {isAuthed && user?.displayName && user.displayName !== user.username && (
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">{user.displayName}</p>
        )}
        <p className="text-muted-foreground mt-1 max-w-xs text-center text-sm">{bio}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {vibes.map((v) => <VibeTag key={v} vibe={v as never} />)}
        </div>
      </div>

      {/* Stats */}
      <div className="mx-5 mt-6 grid grid-cols-3 gap-3">
        {[
          { v: "47", l: "Tables" },
          { v: "12", l: "Cities" },
          { v: "1.2k", l: "Sharers" },
        ].map((s) => (
          <div key={s.l} className="glass flex flex-col items-center rounded-2xl py-3">
            <span className="font-display text-xl font-black">{s.v}</span>
            <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{s.l}</span>
          </div>
        ))}
      </div>

      {/* My Bookings CTA */}
      <button
        onClick={() => isAuthed ? setBookingsOpen(true) : requireAuth("Sign in to view your bookings.")}
        className="mx-5 mt-4 w-[calc(100%-2.5rem)] glass rounded-2xl flex items-center px-4 py-3.5 gap-3 hover:bg-white/10 transition-colors active:scale-[0.99]"
      >
        <span className="bg-gradient-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
          <CalendarDays className="h-4 w-4 text-primary-foreground" />
        </span>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold leading-tight">My Bookings</p>
          <p className="text-[11px] text-muted-foreground">
            {!isAuthed ? "Sign in to view bookings" : upcomingCount > 0 ? `${upcomingCount} upcoming` : "View history & manage"}
          </p>
        </div>
        {isAuthed && upcomingCount > 0 && (
          <span className="bg-accent text-accent-foreground text-[10px] font-black px-2 py-0.5 rounded-full">
            {upcomingCount}
          </span>
        )}
      </button>
    </div>

    {/* Draft sektion */}
    <DraftSection onResume={() => onOpenUpload?.()} />

    {/* User uploaded sektions */}
    <MySektionsSection />

    {/* Saved / Bookmarks */}
    <SavedSection />

    {/* Badges */}
    <section className="mt-8 px-5">
      <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">Badges</h2>
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
        {BADGES.map(({ icon: Icon, label, grad }) => (
          <div key={label} className="flex w-24 shrink-0 flex-col items-center gap-2">
            <span className={`${grad} shadow-card flex h-20 w-20 items-center justify-center rounded-2xl`}>
              <Icon className="text-primary-foreground h-8 w-8" strokeWidth={2.5} />
            </span>
            <span className="text-center text-[11px] font-semibold leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </section>

    {/* Collage */}
    <section className="mt-8 px-5 pb-8">
      <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">Table Moments</h2>
      <div className="grid grid-cols-3 gap-1">
        {COLLAGE.map((src, i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-lg">
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" width={300} height={300}/>
          </div>
        ))}
      </div>
    </section>

    {/* Footer */}
    <Footer />

    <MyBookingsSheet open={bookingsOpen} onOpenChange={setBookingsOpen} />
    <ProfileSetupSheet open={setupOpen} onOpenChange={setSetupOpen} />
  </div>
  );
};
