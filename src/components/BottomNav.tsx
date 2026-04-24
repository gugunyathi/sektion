import { Compass, Home, Sparkles, Upload, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "feed" | "discover" | "tableshare" | "profile";

const LEFT_TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "discover", label: "Discover", icon: Compass },
];

const RIGHT_TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "profile", label: "You", icon: User },
];

export const BottomNav = ({
  active,
  onChange,
  onUpload,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  onUpload: () => void;
}) => (
  <nav className="glass-dark fixed inset-x-0 bottom-0 z-50 mx-auto grid max-w-md grid-cols-5 items-end px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
    {/* Feed */}
    {LEFT_TABS.map(({ id, label, icon: Icon }) => {
      const isActive = active === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex flex-col items-center gap-1 py-2 transition-colors",
            isActive ? "text-primary-glow" : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={label}
        >
          <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        </button>
      );
    })}

    {/* Center: TableShare — elevated pill */}
    <button
      onClick={() => onChange("tableshare")}
      className="flex flex-col items-center -mb-1"
      aria-label="TableShare"
    >
      <span className="bg-gradient-primary shadow-neon -mt-7 flex h-14 w-14 items-center justify-center rounded-full">
        <Sparkles className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
        TableShare
      </span>
    </button>

    {/* Upload */}
    <button
      onClick={onUpload}
      className="flex flex-col items-center gap-1 py-2"
      aria-label="Upload Sektion"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-600/40">
        <Upload className="h-5 w-5 text-white" strokeWidth={2.5} />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
        Upload
      </span>
    </button>

    {/* You */}
    {RIGHT_TABS.map(({ id, label, icon: Icon }) => {
      const isActive = active === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex flex-col items-center gap-1 py-2 transition-colors",
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
