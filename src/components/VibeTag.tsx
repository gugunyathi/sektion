import { Vibe } from "@/data/events";
import { cn } from "@/lib/utils";

const VIBE_STYLES: Record<Vibe, string> = {
  "Party Animal": "bg-primary/15 text-primary-glow border-primary/40",
  "Foodie": "bg-[hsl(30_100%_55%/0.15)] text-[hsl(35_100%_70%)] border-[hsl(30_100%_55%/0.4)]",
  "Chill": "bg-accent/15 text-accent border-accent/40",
  "Luxe": "bg-[hsl(45_95%_60%/0.15)] text-[hsl(45_95%_70%)] border-[hsl(45_95%_60%/0.4)]",
  "Themed": "bg-secondary/15 text-secondary border-secondary/40",
};

export const VibeTag = ({ vibe, className }: { vibe: Vibe; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md",
      VIBE_STYLES[vibe],
      className,
    )}
  >
    {vibe}
  </span>
);
