import { MediaItem } from "@/data/events";
import { useEffect, useRef, useState, TouchEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Flag, Plus, Trash2, ShieldAlert, Play, CheckCircle2, Clock, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

type Props = {
  media: MediaItem[];
  active: boolean; // whether this card is the visible one (controls autoplay)
  isHost?: boolean; // host gets upload/remove controls
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  onFlag?: (id: string) => void;
  /** fires whenever the visible slide changes, so the parent can react */
  onCurrentChange?: (item: { id: string; kind: MediaItem["kind"]; status: MediaItem["status"] } | null) => void;
};

export const MediaCarousel = ({ media, active, isHost, onAdd, onRemove, onFlag, onCurrentChange }: Props) => {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const touchStartX = useRef<number | null>(null);

  // Filter frozen content, then sort to prioritize videos first
  const visible = media.filter((m) => m.status !== "frozen" || isHost);
  const sorted = [...visible].sort((a, b) => {
    // Videos first
    if (a.kind === "video" && b.kind !== "video") return -1;
    if (a.kind !== "video" && b.kind === "video") return 1;
    return 0;
  });
  
  const safeIndex = Math.min(index, Math.max(0, sorted.length - 1));
  const current = sorted[safeIndex];

  // Notify parent of current slide
  useEffect(() => {
    onCurrentChange?.(current ? { id: current.id, kind: current.kind, status: current.status } : null);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autoplay current video muted; apply mute state
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, vid]) => {
      if (!vid) return;
      const isTarget = active && current && id === current.id && current.kind === "video" && current.status === "approved";
      if (isTarget) {
        vid.muted = muted;
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay blocked — stay muted and try again muted
            vid.muted = true;
            vid.play().catch(() => {});
          });
        }
      } else {
        vid.pause();
        vid.muted = true;
      }
    });
  }, [active, current, muted]);

  const go = (next: number) => {
    if (sorted.length === 0) return;
    const clamped = (next + sorted.length) % sorted.length;
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

  // Handle keyboard arrow keys for navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(safeIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(safeIndex + 1);
    }
  };

  const handleFlag = (id: string) => {
    onFlag?.(id);
    toast.success("Reported. Frozen pending review by moderators.");
  };

  const handleRemove = (id: string) => {
    onRemove?.(id);
    toast.success("Media removed.");
  };

  if (sorted.length === 0) {
    return <div className="absolute inset-0 bg-muted" />;
  }

  return (
    <div
      className="absolute inset-0"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Media carousel"
    >
      {/* Slides */}
      <div ref={trackRef} className="absolute inset-0">
        {sorted.map((m, i) => {
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
                  preload={i === safeIndex ? "auto" : "metadata"}
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
        {sorted.map((_, i) => (
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

      {/* Community report control (non-host only) */}
      {!isHost && current && current.status === "approved" && (
        <div className="absolute right-4 top-12 z-[3]">
          <button
            onClick={() => handleFlag(current.id)}
            aria-label="Report media"
            className="glass flex h-8 items-center gap-1.5 rounded-full px-2.5"
          >
            <Flag className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Report</span>
          </button>
        </div>
      )}

      {/* Volume toggle — only shown when a video is active */}
      {current?.kind === "video" && current.status === "approved" && active && (
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute left-4 top-14 z-[3] glass flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-opacity hover:opacity-90"
        >
          {muted
            ? <VolumeX className="h-4 w-4 text-white" />
            : <Volume2 className="h-4 w-4 text-white" />}
        </button>
      )}
    </div>
  );
};
