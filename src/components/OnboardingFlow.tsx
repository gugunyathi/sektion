import { useMemo, useState } from "react";
import { Compass, PartyPopper, Sparkles, Users } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type OnboardingStep = {
  title: string;
  description: string;
  icon: typeof Sparkles;
};

const STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Sektion",
    description:
      "Discover nightlife spots, curated events, and hosts that match your vibe.",
    icon: Sparkles,
  },
  {
    title: "Find Your Circle",
    description:
      "Stalk calendars, discover people, and stay in sync with where your crowd is headed.",
    icon: Users,
  },
  {
    title: "Book In Seconds",
    description:
      "Reserve tables, save your top picks, and let smart matching do the heavy lifting.",
    icon: PartyPopper,
  },
];

export function OnboardingFlow({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const current = useMemo(() => STEPS[step], [step]);
  const Icon = current.icon;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      setStep(0);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSkip = () => {
    onComplete();
    setStep(0);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleSkip()}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-[28px] p-0">
        <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />

        <div className="px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-neon">
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>

          <div className="text-center">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Getting Started
            </p>
            <h2 className="font-display text-2xl font-black leading-tight">{current.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{current.description}</p>
          </div>

          <div className="my-5 flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-accent" : "w-2.5 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="glass mb-4 rounded-2xl border border-border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Compass className="h-4 w-4 text-accent" />
              Pro tip
            </div>
            <p className="text-xs text-muted-foreground">
              Keep your city and vibes updated in your profile for better event recommendations.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="h-12 flex-1 rounded-2xl border border-border text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="bg-gradient-primary text-primary-foreground h-12 flex-1 rounded-2xl text-sm font-bold"
            >
              {isLast ? "Start Exploring" : "Next"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}