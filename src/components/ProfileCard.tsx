import { Sharer } from "@/data/events";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { VibeTag } from "./VibeTag";
import { BadgeCheck, Heart, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const GENDER_LABEL: Record<Sharer["gender"], string> = {
  female: "Female",
  male: "Male",
  "non-binary": "Non-binary",
};

const REL_LABEL: Record<Sharer["relationship"], string> = {
  single: "Single",
  couple: "In a couple",
  taken: "Taken",
  open: "Open",
};

export const ProfileCard = ({
  sharer,
  open,
  onOpenChange,
}: {
  sharer: Sharer | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  if (!sharer) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-card border-border h-[85dvh] overflow-y-auto rounded-t-[28px] p-0"
      >
        <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />

        {/* Hero */}
        <div className="relative px-5 pt-6">
          <div className="bg-gradient-vibe absolute inset-x-0 top-0 h-32 opacity-30 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <div className="bg-gradient-primary shadow-neon rounded-full p-1">
              <img
                src={sharer.avatar}
                alt={sharer.name}
                className="bg-background h-24 w-24 rounded-full border-4 border-background object-cover"
                loading="lazy"
                width={256}
                height={256}
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <h2 className="font-display text-2xl font-black">{sharer.name}</h2>
              {sharer.verified && <BadgeCheck className="text-accent h-5 w-5" />}
            </div>
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mt-1">
              {sharer.age} · {GENDER_LABEL[sharer.gender]} · {REL_LABEL[sharer.relationship]}
            </p>
            {sharer.bio && (
              <p className="mt-3 max-w-xs text-sm text-foreground/85 leading-relaxed">
                {sharer.bio}
              </p>
            )}
            <div className="mt-3">
              <VibeTag vibe={sharer.vibe} />
            </div>
          </div>
        </div>

        {/* Quick facts */}
        <div className="grid grid-cols-3 gap-2 px-5 pt-6">
          {[
            { v: "47", l: "Tables" },
            { v: "12", l: "Cities" },
            { v: "1.2k", l: "Sharers" },
          ].map((s) => (
            <div key={s.l} className="glass flex flex-col items-center rounded-2xl py-3">
              <span className="font-display text-lg font-black">{s.v}</span>
              <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                {s.l}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 px-5 pt-6 pb-8">
          <button className="border-border bg-muted/40 active:bg-muted flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition-colors">
            <Heart className="h-4 w-4" /> Follow
          </button>
          <button className="bg-gradient-primary shadow-neon font-display flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold uppercase tracking-wider text-primary-foreground">
            <MessageCircle className="h-4 w-4" /> Message
          </button>
        </div>

        <div className="mx-5 mb-8 flex items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4">
          <Sparkles className="text-secondary mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-relaxed text-foreground/85">
            <span className="font-semibold">{sharer.name.split(" ")[0]}</span> shows up most in{" "}
            <span className="font-semibold">{sharer.vibe}</span> tables — a likely match for your night.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/** Compact row used in the SharersSheet list. */
export const SharerRow = ({
  sharer,
  onClick,
  className,
}: {
  sharer: Sharer;
  onClick: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "border-border bg-muted/30 hover:border-primary/40 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
      className,
    )}
  >
    <img
      src={sharer.avatar}
      alt={sharer.name}
      className="h-12 w-12 rounded-full object-cover"
      loading="lazy"
      width={96}
      height={96}
    />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1">
        <p className="truncate text-sm font-semibold">{sharer.name}</p>
        {sharer.verified && <BadgeCheck className="text-accent h-3.5 w-3.5 shrink-0" />}
      </div>
      <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
        {sharer.age} · {GENDER_LABEL[sharer.gender]} · {REL_LABEL[sharer.relationship]}
      </p>
      {sharer.bio && (
        <p className="text-foreground/70 mt-0.5 line-clamp-1 text-xs">{sharer.bio}</p>
      )}
    </div>
    <VibeTag vibe={sharer.vibe} />
  </button>
);
