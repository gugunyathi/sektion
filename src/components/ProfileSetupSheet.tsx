import { useState } from "react";
import { ArrowLeft, AtSign, Check, Loader2, MapPin, Pencil } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/hooks/useLocation";

const ALL_VIBES = [
  "Foodie", "Party Animal", "Luxe", "Chill", "Socialite",
  "Night Owl", "Trendsetter", "Sports Fan", "Music Head", "Art Lover",
];

export function ProfileSetupSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user, updateProfile } = useAuth();

  const [step, setStep] = useState<"username" | "vibe">("username");
  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const loc = useLocation();
  const [selectedVibes, setSelectedVibes] = useState<string[]>(user?.vibes ?? []);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const validateUsername = (v: string) => {
    if (v.length < 3) return "At least 3 characters";
    if (!/^[a-z0-9._]+$/.test(v)) return "Only lowercase letters, numbers, . and _";
    return null;
  };

  const handleNext = () => {
    const err = validateUsername(username);
    if (err) { setUsernameError(err); return; }
    setUsernameError(null);
    setStep("vibe");
  };

  const toggleVibe = (v: string) =>
    setSelectedVibes((cur) =>
      cur.includes(v) ? cur.filter((x) => x !== v) : cur.length < 5 ? [...cur, v] : cur
    );

  const handleSave = () => {
    updateProfile({
      username: username.toLowerCase(),
      displayName: displayName || username,
      bio,
      city,
      vibes: selectedVibes,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-[28px] p-0 h-[88dvh]">
        <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          {step === "vibe" && (
            <button
              onClick={() => setStep("username")}
              className="border-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {step === "username" ? "Step 1 of 2" : "Step 2 of 2"}
            </p>
            <h3 className="font-display mt-0.5 text-xl font-black">
              {step === "username" ? "Set up your profile" : "Pick your vibes"}
            </h3>
          </div>
          {/* Step dots */}
          <div className="ml-auto flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className={`h-2 w-2 rounded-full ${step === "vibe" ? "bg-accent" : "bg-muted"}`} />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-5rem)] pb-6">
          {step === "username" ? (
            <div className="flex flex-col gap-5 px-5 pt-2">
              {/* Username */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Username *
                </label>
                <div className={`flex items-center gap-2 bg-muted/50 border rounded-2xl px-4 py-3 ${usernameError ? "border-destructive" : "border-border"}`}>
                  <AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/\s/g, ""));
                      setUsernameError(null);
                    }}
                    placeholder="your.username"
                    className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                  />
                  {username.length >= 3 && !usernameError && (
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                </div>
                {usernameError && (
                  <p className="text-[11px] text-destructive mt-1 px-1">{usernameError}</p>
                )}
              </div>

              {/* Display name */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Display name
                </label>
                <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-2xl px-4 py-3">
                  <Pencil className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How you appear to others"
                    className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Preferred city
                </label>
                <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-2xl px-4 py-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. London, Berlin, Lagos…"
                    className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => { loc.detect(); }}
                    title="Detect my city"
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {loc.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  </button>
                </div>
                {loc.city && loc.city !== city && (
                  <button
                    onClick={() => setCity(loc.city!)}
                    className="mt-1.5 text-[11px] text-accent font-semibold px-1"
                  >
                    Use detected: {loc.city}
                  </button>
                )}
                {loc.error && (
                  <p className="text-[11px] text-muted-foreground mt-1 px-1">{loc.error}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Bio <span className="normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={120}
                  rows={3}
                  placeholder="Tell the table something about you…"
                  className="w-full bg-muted/50 border border-border rounded-2xl px-4 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent"
                />
                <p className="text-[11px] text-muted-foreground text-right">{bio.length}/120</p>
              </div>

              <button
                disabled={username.length < 3}
                onClick={handleNext}
                className="bg-gradient-primary text-primary-foreground flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 px-5 pt-2">
              <p className="text-sm text-muted-foreground">
                Choose up to <strong className="text-foreground">5 vibes</strong> that describe your nightlife style.
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_VIBES.map((v) => {
                  const active = selectedVibes.includes(v);
                  const maxed = selectedVibes.length >= 5 && !active;
                  return (
                    <button
                      key={v}
                      onClick={() => toggleVibe(v)}
                      disabled={maxed}
                      className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                        active
                          ? "bg-accent text-accent-foreground border-accent scale-105"
                          : "bg-muted/40 border-border text-muted-foreground disabled:opacity-40"
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto pt-4">
                <button
                  onClick={handleSave}
                  className="bg-gradient-primary text-primary-foreground flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold"
                >
                  <Check className="h-4 w-4" />
                  Save profile
                </button>
                <button
                  onClick={handleSave}
                  className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
