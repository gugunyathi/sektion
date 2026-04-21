import { Compass, Home, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "feed" | "discover" | "tableshare" | "profile";

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "tableshare", label: "TableShare", icon: Sparkles },
  { id: "profile", label: "You", icon: User },
];

export const BottomNav = ({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) => (
  <nav className="glass-dark fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md items-center justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
    {TABS.map(({ id, label, icon: Icon }) => {
      const isActive = active === id;
      const isCenter = id === "tableshare";
      if (isCenter) {
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="relative -mt-6 flex flex-col items-center"
            aria-label={label}
          >
            <span className="bg-gradient-primary shadow-neon flex h-14 w-14 items-center justify-center rounded-full">
              <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
              {label}
            </span>
          </button>
        );
      }
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2 transition-colors",
            isActive ? "text-primary-glow" : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={label}
        >
          <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        </button>
      );
    })}
  </nav>
);
