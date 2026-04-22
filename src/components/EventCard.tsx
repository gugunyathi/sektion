import { Event, MediaItem } from "@/data/events";
import { VibeTag } from "./VibeTag";
import { SharersSheet } from "./SharersSheet";
import { MediaCarousel } from "./MediaCarousel";
import { MediaUploadSheet } from "./MediaUploadSheet";
import { Bookmark, Heart, MapPin, MessageCircle, Play, Plus, Send, Trash2, Users, Zap, CheckCircle2, Clock, ShieldAlert, ChevronRight, ArrowLeft, ImagePlus, Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useInventory } from "@/context/InventoryContext";
import { toast } from "sonner";
import { getTablesForEvent, IncludedItem } from "@/data/tables";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const EventCard = ({ event, onOpen }: { event: Event; onOpen: (e: Event) => void }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharersOpen, setSharersOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<IncludedItem | null>(null);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemPickerTab, setItemPickerTab] = useState<"upload" | "venue">("venue");
  const [media, setMedia] = useState<MediaItem[]>(event.media ?? []);
  const [currentMedia, setCurrentMedia] = useState<{ id: string; kind: MediaItem["kind"]; status: MediaItem["status"] } | null>(null);
  const [active, setActive] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const itemFileRef = useRef<HTMLInputElement>(null);
  const { seatsLeftForEvent } = useInventory();
  const seatsLeft = seatsLeftForEvent(event.id);

  // Gather included items from all tables for this event
  const allItems: IncludedItem[] = (() => {
    const tables = getTablesForEvent(event);
    const seen = new Set<string>();
    return tables.flatMap((t) => t.includedItems ?? []).filter((item) => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
  })();

  // Mock: pretend the current user hosts a couple of events so upload/remove controls show
  const isHost = event.id === "e1" || event.id === "e3";

  // Get moderation status of media (prioritize worse status)
  const getModerationStatus = () => {
    if (media.some((m) => m.status === "frozen")) return "frozen";
    if (media.some((m) => m.status === "pending")) return "pending";
    return "approved";
  };

  const moderationStatus = getModerationStatus();

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setActive(entry.intersectionRatio > 0.6),
      { threshold: [0, 0.6, 1] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleAdd = () => {
    setUploadOpen(true);
  };

  const handleMediaUpload = (
    newMedia: Omit<MediaItem, "id" | "uploadedBy" | "status" | "flags">
  ) => {
    const id = `${event.id}-u${Date.now()}`;
    setMedia((m) => [
      ...m,
      {
        ...newMedia,
        id,
        uploadedBy: "you",
        status: "pending",
        flags: 0,
      },
    ]);
    toast.success("Media uploaded. Pending moderation.");
  };

  const handleItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image too large. Max 10 MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setItemImages((prev) => ({ ...prev, [editingItem.id]: ev.target?.result as string }));
      setItemPickerOpen(false);
      toast.success(`Image updated for ${editingItem.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleVenueImageSelect = (src: string) => {
    if (!editingItem) return;
    setItemImages((prev) => ({ ...prev, [editingItem.id]: src }));
    setItemPickerOpen(false);
    toast.success(`Image updated for ${editingItem.name}`);
  };

  const openItemPicker = (item: IncludedItem) => {
    setEditingItem(item);
    setItemPickerTab("venue");
    setItemPickerOpen(true);
  };

  const handleRemove = (id: string) => setMedia((m) => m.filter((x) => x.id !== id));
  const handleFlag = (id: string) =>
    setMedia((m) => m.map((x) => (x.id === id ? { ...x, status: "frozen", flags: x.flags + 1 } : x)));

  return (
    <article ref={articleRef} className="snap-item relative h-[100dvh] w-full overflow-hidden">
      <MediaCarousel
        media={media}
        active={active}
        isHost={isHost}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onFlag={handleFlag}
        onCurrentChange={setCurrentMedia}
      />
      <div className="absolute inset-0 bg-gradient-overlay pointer-events-none" />
      <div className="bg-gradient-radial absolute inset-x-0 top-0 h-1/2 opacity-60 pointer-events-none" />

      {/* Top meta — pushed down to clear the global Sektion header (~3.5rem) */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-5 pb-2 pt-[max(3.75rem,calc(env(safe-area-inset-top)+2.5rem))]">
        <div className="flex items-center gap-2">
          {/* LIVE indicator — shown when current slide is an approved video */}
          {currentMedia?.kind === "video" && currentMedia.status === "approved" && (
            <span className="flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
              <Play className="h-3 w-3 fill-current" /> Live
            </span>
          )}
          {event.trending && (
            <span className="bg-secondary/95 text-secondary-foreground animate-pulse-neon flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
              <Zap className="h-3 w-3" /> Trending
            </span>
          )}
          {event.surge && (
            <span className="glass rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-glow">
              Surge
            </span>
          )}
        </div>
        {/* Category only on the right */}
        <div className="flex items-center gap-1.5 pointer-events-none">
          <span className="glass rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            {event.category}
          </span>
        </div>
      </header>

      {/* Action rail — raised so bookmark clears the CTA button */}
      <aside className="absolute bottom-52 right-4 z-10 flex flex-col items-center gap-5">
        {/* Upload / delete media controls (host only) — horizontal pair */}
        {isHost && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="flex flex-col items-center gap-1"
              aria-label="Upload media"
            >
              <span className="glass flex h-12 w-12 items-center justify-center rounded-full">
                <Plus className="h-6 w-6 text-foreground" />
              </span>
            </button>
            {currentMedia && (
              <button
                onClick={() => handleRemove(currentMedia.id)}
                className="flex flex-col items-center gap-1"
                aria-label="Remove current media"
              >
                <span className="glass flex h-12 w-12 items-center justify-center rounded-full">
                  <Trash2 className="h-6 w-6 text-foreground" />
                </span>
              </button>
            )}
          </div>
        )}
        <button
          onClick={() => setLiked((v) => !v)}
          className="flex flex-col items-center gap-1"
          aria-label="Like"
        >
          <span
            className={cn(
              "glass flex h-12 w-12 items-center justify-center rounded-full transition-all",
              liked && "bg-primary/30 border-primary/60 shadow-neon",
            )}
          >
            <Heart className={cn("h-6 w-6", liked ? "fill-primary text-primary" : "text-foreground")} />
          </span>
          <span className="text-[11px] font-semibold text-foreground/90 drop-shadow">
            {(liked ? 1 : 0) + 234}
          </span>
        </button>
        <button className="flex flex-col items-center gap-1" aria-label="Comments">
          <span className="glass flex h-12 w-12 items-center justify-center rounded-full">
            <MessageCircle className="h-6 w-6 text-foreground" />
          </span>
          <span className="text-[11px] font-semibold text-foreground/90 drop-shadow">42</span>
        </button>
        <button className="flex flex-col items-center gap-1" aria-label="Share">
          <span className="glass flex h-12 w-12 items-center justify-center rounded-full">
            <Send className="h-6 w-6 text-foreground" />
          </span>
          <span className="text-[11px] font-semibold text-foreground/90 drop-shadow">18</span>
        </button>
        <button onClick={() => setSaved((v) => !v)} aria-label="Save" className="flex flex-col items-center">
          <span className="glass flex h-12 w-12 items-center justify-center rounded-full">
            <Bookmark className={cn("h-6 w-6", saved ? "fill-secondary text-secondary" : "text-foreground")} />
          </span>
        </button>
      </aside>

      {/* Included items strip — sits below badge row which itself is below the Sektion header */}
      {allItems.length > 0 && (
        <div className="absolute inset-x-0 z-20 flex items-center gap-2 px-4"
          style={{ top: "calc(max(3.75rem, env(safe-area-inset-top) + 2.5rem) + 3rem)" }}
        >
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {allItems.slice(0, 6).map((item) => (
              <div
                key={item.id + item.name}
                className="glass flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-xl shadow-sm"
              >
                <span>{item.emoji}</span>
              </div>
            ))}
          </div>
          {allItems.length > 0 && (
            <button
              onClick={() => setItemsOpen(true)}
              className="glass flex h-14 w-9 shrink-0 items-center justify-center rounded-xl"
              aria-label="View all included items"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-32">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {event.vibes.map((v) => <VibeTag key={v} vibe={v} />)}
        </div>
        <h2 className="font-display text-3xl font-black leading-tight tracking-tight">
          {event.title}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground/85">
          <MapPin className="h-3.5 w-3.5" />
          <span className="font-medium">{event.venue}</span>
          <span className="text-foreground/50">·</span>
          <span>{event.city}</span>
        </p>
        <p className="mt-1 text-sm font-medium text-foreground/70">
          {event.date} · {event.time}
        </p>

        {/* Sharers strip — tap to view profiles */}
        <button
          onClick={() => setSharersOpen(true)}
          className="mt-4 flex items-center gap-3 rounded-full bg-background/30 backdrop-blur-md px-2 py-1.5 pr-3 active:scale-[0.98] transition-transform"
          aria-label="View sharers"
        >
          <div className="flex -space-x-3">
            {event.sharers.slice(0, 4).map((s) => (
              <img
                key={s.id}
                src={s.avatar}
                alt={s.name}
                className="border-background h-9 w-9 rounded-full border-2 object-cover"
                loading="lazy"
                width={64}
                height={64}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-foreground/90">
            <Users className="h-3.5 w-3.5" />
            <span className={cn("font-semibold", seatsLeft === 0 ? "text-destructive" : "text-secondary")}>
              {seatsLeft}
            </span>
            <span>of {event.totalSeats} · view all</span>
          </div>
        </button>

        {/* CTA */}
        <button
          onClick={() => onOpen(event)}
          className="bg-gradient-primary shadow-neon mt-5 flex h-14 w-full items-center justify-between rounded-2xl px-6 text-primary-foreground active:scale-[0.98] transition-transform"
        >
          <span className="font-display text-base font-bold uppercase tracking-wider">Sektion</span>
          <span className="flex items-baseline gap-1">
            <span className="text-xs font-medium opacity-80">from</span>
            <span className="font-display text-xl font-black">${event.pricePerSeat}</span>
          </span>
        </button>
      </div>

      <SharersSheet
        sharers={event.sharers}
        open={sharersOpen}
        onOpenChange={setSharersOpen}
        title={`${event.title} · sharers`}
      />
      <MediaUploadSheet
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSave={handleMediaUpload}
      />

      {/* Hidden file input for item image upload */}
      <input
        ref={itemFileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleItemImageUpload}
      />

      {/* Included items sheet */}
      <Sheet open={itemsOpen} onOpenChange={setItemsOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-[28px] p-0">
          <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />
            {/* Header with back button */}
            <div className="flex items-center gap-3 px-5 pt-4 pb-2">
              <button
                onClick={() => setItemsOpen(false)}
                className="border-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">What's included</p>
                <h3 className="font-display mt-0.5 text-xl font-black">{event.title}</h3>
              </div>
            </div>
            <p className="px-5 pb-3 text-[11px] text-muted-foreground">
              Tap any item to add or change its photo.
            </p>
            <div className="overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[70dvh]">
              {(["drink", "food", "mixer", "extra"] as const).map((cat) => {
                const catItems = allItems.filter((i) => i.category === cat);
                if (catItems.length === 0) return null;
                const labels: Record<string, string> = { drink: "Drinks", food: "Food", mixer: "Mixers & Soft", extra: "Extras" };
                return (
                  <div key={cat} className="px-5 py-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{labels[cat]}</p>
                    <div className="grid grid-cols-4 gap-3">
                      {catItems.map((item) => {
                        const img = itemImages[item.id];
                        return (
                          <button
                            key={item.id + item.name}
                            onClick={() => openItemPicker(item)}
                            className="group flex flex-col items-center gap-1.5 focus:outline-none"
                            aria-label={`Edit image for ${item.name}`}
                          >
                            <div className="relative glass flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm overflow-hidden">
                              {img ? (
                                <img src={img} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-3xl">{item.emoji}</span>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                <ImagePlus className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <span className="text-center text-[10px] font-medium leading-tight text-foreground/80">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
        </SheetContent>
      </Sheet>

      {/* Item image picker sheet */}
      <Sheet open={itemPickerOpen} onOpenChange={setItemPickerOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-[28px] p-0">
          <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />
            <div className="flex items-center gap-3 px-5 pt-4 pb-3">
              <button
                onClick={() => setItemPickerOpen(false)}
                className="border-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Edit image</p>
                <h3 className="font-display mt-0.5 text-lg font-black">{editingItem?.name}</h3>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 px-5 pb-3">
              {(["venue", "upload"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setItemPickerTab(tab)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                    itemPickerTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab === "venue" ? "Venue menu" : "Upload photo"}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[55dvh]">
              {itemPickerTab === "venue" && editingItem && (
                <VenueGallery
                  category={editingItem.category}
                  currentImage={itemImages[editingItem.id]}
                  onSelect={handleVenueImageSelect}
                />
              )}
              {itemPickerTab === "upload" && (
                <div className="flex flex-col items-center gap-4 px-5 py-6">
                  <div className="border-border flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-dashed">
                    {editingItem && itemImages[editingItem.id] ? (
                      <img src={itemImages[editingItem.id]} alt="" className="h-full w-full rounded-3xl object-cover" />
                    ) : (
                      <span className="text-5xl">{editingItem?.emoji}</span>
                    )}
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Choose a photo from your library or take one now.
                  </p>
                  <button
                    onClick={() => itemFileRef.current?.click()}
                    className="bg-gradient-primary text-primary-foreground flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold"
                  >
                    <Camera className="h-4 w-4" /> Choose / Take photo
                  </button>
                </div>
              )}
            </div>
        </SheetContent>
      </Sheet>
    </article>
  );
};

/* ---------- Venue Gallery ---------- */
const VENUE_IMAGES: Record<string, { src: string; label: string }[]> = {
  drink: [
    { src: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=80", label: "Champagne" },
    { src: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=300&q=80", label: "Cocktail" },
    { src: "https://images.unsplash.com/photo-1527761939622-933bfb2e6c7f?w=300&q=80", label: "Whiskey" },
    { src: "https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?w=300&q=80", label: "Red wine" },
    { src: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&q=80", label: "Spritz" },
    { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80", label: "Bottle service" },
  ],
  food: [
    { src: "https://images.unsplash.com/photo-1601312435290-4e6ebb7ef81a?w=300&q=80", label: "Tapas" },
    { src: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&q=80", label: "Pizza bites" },
    { src: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300&q=80", label: "French toast" },
    { src: "https://images.unsplash.com/photo-1536304993881-ff86e0c9ef17?w=300&q=80", label: "Snack platter" },
    { src: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80", label: "Dessert board" },
    { src: "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=300&q=80", label: "Mezze platter" },
  ],
  mixer: [
    { src: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=300&q=80", label: "Juice mixers" },
    { src: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&q=80", label: "Still water" },
    { src: "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=300&q=80", label: "Sparkling water" },
    { src: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&q=80", label: "Cocktail mixer" },
  ],
  extra: [
    { src: "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=300&q=80", label: "Mints" },
    { src: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=300&q=80", label: "Party favours" },
  ],
};

const VenueGallery = ({
  category,
  currentImage,
  onSelect,
}: {
  category: IncludedItem["category"];
  currentImage?: string;
  onSelect: (src: string) => void;
}) => {
  const images = VENUE_IMAGES[category] ?? [];
  if (images.length === 0)
    return <p className="px-5 py-6 text-sm text-muted-foreground">No venue images available for this category.</p>;
  return (
    <div className="grid grid-cols-3 gap-2 px-5 pb-4">
      {images.map((img) => (
        <button
          key={img.src}
          onClick={() => onSelect(img.src)}
          className={cn(
            "group relative overflow-hidden rounded-2xl border-2 transition-all focus:outline-none",
            currentImage === img.src ? "border-primary shadow-neon" : "border-transparent",
          )}
          aria-label={`Select ${img.label}`}
        >
          <img src={img.src} alt={img.label} className="aspect-square w-full object-cover" loading="lazy" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
            <p className="text-[10px] font-semibold text-white leading-tight">{img.label}</p>
          </div>
          {currentImage === img.src && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
              <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-full">
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1.5,6 4.5,9 10.5,3" /></svg>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
