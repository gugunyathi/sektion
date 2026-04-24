import { useRef, useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────
type Category = "Club" | "Dining" | "Lounge" | "Rave" | "Themed";
type Vibe = "Party Animal" | "Foodie" | "Chill" | "Luxe" | "Themed";

const CATEGORIES: Category[] = ["Club", "Dining", "Lounge", "Rave", "Themed"];
const ALL_VIBES: Vibe[] = ["Party Animal", "Foodie", "Chill", "Luxe", "Themed"];

interface MediaPreview {
  file: File;
  previewUrl: string;
  kind: "image" | "video";
}

interface FormState {
  title: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  category: Category | "";
  vibes: Vibe[];
  pricePerSeat: string;
  totalSeats: string;
  hostNote: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  venue: "",
  city: "",
  date: "",
  time: "",
  category: "",
  vibes: [],
  pricePerSeat: "",
  totalSeats: "",
  hostNote: "",
};

const STEP_LABELS = ["Details", "Vibes & Pricing", "Media", "Review"];

// ── Component ──────────────────────────────────────────
export const UploadSektionSheet = ({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (event: Record<string, unknown>) => void;
}) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STORAGE_KEY = "sektion.upload.form";

  // Load form from localStorage on mount and when sheet opens
  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setForm(JSON.parse(saved));
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [open]);

  // Save form to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // Ignore storage errors
    }
  }, [form]);

  const set = (key: keyof FormState, value: unknown) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setMediaPreviews([]);
    setStep(0);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Form cleared");
  };

  const toggleVibe = (v: Vibe) =>
    set(
      "vibes",
      form.vibes.includes(v)
        ? form.vibes.filter((x) => x !== v)
        : [...form.vibes, v],
    );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime"];
    Array.from(files).forEach((file) => {
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name}: too large (max 50 MB)`);
        return;
      }
      if (mediaPreviews.length >= 8) {
        toast.error("Maximum 8 media items per sektion");
        return;
      }
      const kind = file.type.startsWith("video/") ? "video" : "image";
      const previewUrl = URL.createObjectURL(file);
      setMediaPreviews((p) => [...p, { file, previewUrl, kind }]);
    });
  };

  const removeMedia = (idx: number) => {
    setMediaPreviews((p) => {
      URL.revokeObjectURL(p[idx].previewUrl);
      return p.filter((_, i) => i !== idx);
    });
  };

  const canNext = () => {
    if (step === 0)
      return (
        form.title.trim() &&
        form.venue.trim() &&
        form.city.trim() &&
        form.date &&
        form.category
      );
    if (step === 1)
      return form.vibes.length > 0 && form.pricePerSeat && form.totalSeats;
    if (step === 2) return mediaPreviews.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Step 1: upload each media file to Cloudinary and collect URLs
      const mediaUrls: string[] = [];
      for (const mp of mediaPreviews) {
        const fd = new FormData();
        fd.append("file", mp.file);
        fd.append("upload_preset", "sektion");
        
        const res = await fetch("https://api.cloudinary.com/v1_1/dkfoqidrv/auto/upload", {
          method: "POST",
          body: fd,
        });
        
        if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.statusText}`);
        const data = await res.json() as { secure_url?: string };
        if (!data.secure_url) throw new Error("No URL returned from Cloudinary");
        mediaUrls.push(data.secure_url);
      }

      // Step 2: create the event with media URLs
      const created = await api.post<Record<string, unknown>>("/api/events", {
        title: form.title.trim(),
        venue: form.venue.trim(),
        city: form.city.trim(),
        date: form.date,
        time: form.time,
        category: form.category,
        vibes: form.vibes,
        pricePerSeat: Number(form.pricePerSeat),
        totalSeats: Number(form.totalSeats),
        seatsLeft: Number(form.totalSeats),
        hostNote: form.hostNote.trim(),
        mediaUrls,
      });

      toast.success("Sektion uploaded! 🎉");
      onCreated(created);
      clearForm(); // Clear saved form after successful upload
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    // Clean up object URLs but keep form data in localStorage
    mediaPreviews.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setMediaPreviews([]);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="glass-dark mx-auto max-w-md rounded-t-2xl p-0"
        style={{ height: "92dvh" }}
      >
        <SheetHeader className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-gradient-vibe font-display text-lg font-black">
              Upload Sektion
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearForm}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
          {/* Step indicator */}
          <div className="mt-2 flex items-center gap-1">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors",
                    i <= step ? "bg-blue-500" : "bg-white/10",
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] font-semibold uppercase tracking-wider",
                    i === step ? "text-blue-400" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </SheetHeader>

        <div className="flex h-[calc(92dvh-120px)] flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* ── Step 0: Basic Details ── */}
            {step === 0 && (
              <div className="space-y-4">
                <Field label="Event Name *">
                  <Input
                    placeholder="e.g. Saturday Night Vibes"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    maxLength={80}
                  />
                </Field>
                <Field label="Venue *">
                  <Input
                    placeholder="e.g. Club Fabric"
                    value={form.venue}
                    onChange={(e) => set("venue", e.target.value)}
                    maxLength={80}
                  />
                </Field>
                <Field label="City *">
                  <Input
                    placeholder="e.g. London"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    maxLength={60}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date *">
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </Field>
                  <Field label="Time">
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => set("time", e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Category *">
                  <Select
                    value={form.category || undefined}
                    onValueChange={(v) => set("category", v as Category)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Host Note">
                  <Textarea
                    placeholder="Tell people what to expect..."
                    value={form.hostNote}
                    onChange={(e) => set("hostNote", e.target.value)}
                    maxLength={300}
                    rows={3}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 1: Vibes & Pricing ── */}
            {step === 1 && (
              <div className="space-y-5">
                <Field label="Vibes * (select at least one)">
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ALL_VIBES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleVibe(v)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                          form.vibes.includes(v)
                            ? "border-blue-500 bg-blue-500/20 text-blue-300"
                            : "border-white/20 text-muted-foreground hover:border-white/40",
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Price per Seat (£) *">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 25"
                    value={form.pricePerSeat}
                    onChange={(e) => set("pricePerSeat", e.target.value)}
                  />
                </Field>
                <Field label="Total Seats *">
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    placeholder="e.g. 10"
                    value={form.totalSeats}
                    onChange={(e) => set("totalSeats", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 2: Media ── */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add at least one photo or video for your sektion (max 8).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-500/40 py-8 text-blue-400 transition-colors hover:border-blue-500/70 hover:bg-blue-500/5"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm font-semibold">Add Photos / Videos</span>
                </button>

                {mediaPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaPreviews.map((mp, idx) => (
                      <div key={idx} className="relative aspect-square overflow-hidden rounded-lg bg-white/5">
                        {mp.kind === "image" ? (
                          <img
                            src={mp.previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            src={mp.previewUrl}
                            className="h-full w-full object-cover"
                            muted
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(idx)}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {mp.kind === "video" && (
                          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold uppercase text-white">
                            Video
                          </span>
                        )}
                      </div>
                    ))}
                    {mediaPreviews.length < 8 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-white/20 text-muted-foreground hover:border-white/40"
                      >
                        <ImagePlus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="glass rounded-xl p-4 space-y-2">
                  <ReviewRow label="Name" value={form.title} />
                  <ReviewRow label="Venue" value={form.venue} />
                  <ReviewRow label="City" value={form.city} />
                  <ReviewRow label="Date" value={`${form.date}${form.time ? " · " + form.time : ""}`} />
                  <ReviewRow label="Category" value={form.category} />
                  <ReviewRow label="Price" value={`£${form.pricePerSeat} / seat`} />
                  <ReviewRow label="Seats" value={String(form.totalSeats)} />
                  {form.hostNote && <ReviewRow label="Note" value={form.hostNote} />}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vibes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.vibes.map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Media ({mediaPreviews.length} item{mediaPreviews.length !== 1 ? "s" : ""})
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {mediaPreviews.map((mp, idx) => (
                      <div key={idx} className="aspect-square overflow-hidden rounded-md bg-white/5">
                        {mp.kind === "image" ? (
                          <img src={mp.previewUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <video src={mp.previewUrl} className="h-full w-full object-cover" muted />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your sektion will be visible immediately. Media is subject to moderation review.
                </p>
              </div>
            )}
          </div>

          {/* ── Footer navigation ── */}
          <div className="border-t border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={submitting}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="flex-1" />
              {step < STEP_LABELS.length - 1 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext()}
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Publish Sektion
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Small helpers ──────────────────────────────────────
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    {children}
  </div>
);

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-right text-xs font-medium text-foreground">{value}</span>
  </div>
);
