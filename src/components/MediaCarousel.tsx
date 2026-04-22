import { MediaItem } from "@/data/events";
import { useEffect, useRef, useState, TouchEvent } from "react";
import { cn } from "@/lib/utils";
import { Flag, Plus, Trash2, ShieldAlert, Play } from "lucide-react";
import { toast } from "sonner";

type Props = {
  media: MediaItem[];
  active: boolean; // whether this card is the visible one (controls autoplay)
  isHost?: boolean; // host gets upload/remove controls
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  onFlag?: (id: string) => void;
};

export const MediaCarousel = ({ media, active, isHost, onAdd, onRemove, onFlag }: Props) => {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const touchStartX = useRef<number | null>(null);

  const visible = media.filter((m) => m.status !== "frozen" || isHost);
  const safeIndex = Math.min(index, Math.max(0, visible.length - 1));
  const current = visible[safeIndex];

  // Autoplay current video, pause others
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, vid]) => {
      if (!vid) return;
      if (active && current && id === current.id && current.kind === "video" && current.status === "approved") {
        vid.muted = true;
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [active, current]);

  const go = (next: number) => {
    if (visible.length === 0) return;
    const clamped = (next + visible.length) % visible.length;
    setIndex(clamped);
  };

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) go(safeIndex + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  const handleFlag = (id: string) => {
    onFlag?.(id);
    toast.success("Reported. Frozen pending review by moderators.");
  };

  const handleRemove = (id: string) => {
    onRemove?.(id);
    toast.success("Media removed.");
  };

  if (visible.length === 0) {
    return <div className="absolute inset-0 bg-muted" />;
  }

  return (
    <div
      className="absolute inset-0"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div ref={trackRef} className="absolute inset-0">
        {visible.map((m, i) => {
          const isCurrent = i === safeIndex;
          const frozen = m.status === "frozen";
          return (
            <div
              key={m.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-300",
                isCurrent ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
            >
              {m.kind === "video" ? (
                <video
                  ref={(el) => { videoRefs.current[m.id] = el; }}
                  src={m.src}
                  poster={m.poster}
                  className="absolute inset-0 h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={m.src}
                  alt={m.caption ?? "Event media"}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              {frozen && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-md text-center px-8">
                  <ShieldAlert className="h-10 w-10 text-destructive" />
                  <p className="font-display text-lg font-bold">Frozen pending review</p>
                  <p className="text-sm text-foreground/70 max-w-xs">
                    This media was reported and is hidden from the public until AI + human moderators complete review.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tap zones for desktop / non-touch */}
      <button
        aria-label="Previous media"
        onClick={() => go(safeIndex - 1)}
        className="absolute left-0 top-0 h-full w-1/3 z-[2]"
      />
      <button
        aria-label="Next media"
        onClick={() => go(safeIndex + 1)}
        className="absolute right-0 top-0 h-full w-1/3 z-[2]"
      />

      {/* Progress bars (Stories style) */}
      <div className="absolute inset-x-0 top-0 z-[3] flex gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {visible.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/25">
            <div
              className={cn(
                "h-full bg-foreground transition-all",
                i < safeIndex ? "w-full" : i === safeIndex ? "w-full" : "w-0",
              )}
            />
          </div>
        ))}
      </div>

      {/* Media meta + moderation row (left side, above bottom info) */}
      <div className="absolute left-4 top-12 z-[3] flex items-center gap-2">
        {current?.kind === "video" && current.status === "approved" && (
          <span className="glass flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
            <Play className="h-3 w-3 fill-current" /> Live
          </span>
        )}
        {current && (
          <span className="glass rounded-full px-2 py-1 text-[10px] font-medium text-foreground/80">
            {safeIndex + 1}/{visible.length}
          </span>
        )}
      </div>

      {/* Host & community controls */}
      <div className="absolute right-4 top-12 z-[3] flex items-center gap-2">
        {isHost && (
          <>
            <button
              onClick={onAdd}
              aria-label="Upload media"
              className="glass flex h-8 w-8 items-center justify-center rounded-full"
            >
              <Plus className="h-4 w-4" />
            </button>
            {current && (
              <button
                onClick={() => handleRemove(current.id)}
                aria-label="Remove media"
                className="glass flex h-8 w-8 items-center justify-center rounded-full"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </>
        )}
        {!isHost && current && current.status === "approved" && (
          <button
            onClick={() => handleFlag(current.id)}
            aria-label="Report media"
            className="glass flex h-8 items-center gap-1.5 rounded-full px-2.5"
          >
            <Flag className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Report</span>
          </button>
        )}
      </div>
    </div>
  );
};
