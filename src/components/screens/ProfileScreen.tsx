import { BadgeCheck, Crown, Flame, Settings, Trophy, Utensils } from "lucide-react";
import { VibeTag } from "../VibeTag";
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

export const ProfileScreen = () => (
  <div className="min-h-[100dvh] pb-28">
    {/* Hero */}
    <div className="relative">
      <div className="bg-gradient-vibe absolute inset-x-0 top-0 h-48 opacity-40 blur-3xl" />
      <header className="relative flex items-start justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Berlin · DE</div>
        <button className="glass flex h-9 w-9 items-center justify-center rounded-full" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </button>
      </header>

      <div className="relative mt-6 flex flex-col items-center px-5">
        <div className="bg-gradient-primary shadow-neon rounded-full p-1">
          <img src={a1} alt="You" className="bg-background h-24 w-24 rounded-full border-4 border-background object-cover" loading="lazy" width={256} height={256}/>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <h1 className="font-display text-2xl font-black">@niko.r</h1>
          <BadgeCheck className="text-accent h-5 w-5" />
        </div>
        <p className="text-muted-foreground mt-1 max-w-xs text-center text-sm">
          Foodie by day, party legend by night. Negroni enthusiast. Always at the head of the table.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          <VibeTag vibe="Foodie" />
          <VibeTag vibe="Party Animal" />
          <VibeTag vibe="Luxe" />
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
    </div>

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
    <section className="mt-8 px-5">
      <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">Table Moments</h2>
      <div className="grid grid-cols-3 gap-1">
        {COLLAGE.map((src, i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-lg">
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" width={300} height={300}/>
          </div>
        ))}
      </div>
    </section>
  </div>
);
