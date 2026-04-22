import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sharer } from "@/data/events";
import { ProfileCard, SharerRow } from "./ProfileCard";
import { Users } from "lucide-react";

export const SharersSheet = ({
  sharers,
  open,
  onOpenChange,
  title = "At this table",
}: {
  sharers: Sharer[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: string;
}) => {
  const [selected, setSelected] = useState<Sharer | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const summary = (() => {
    const f = sharers.filter((s) => s.gender === "female").length;
    const m = sharers.filter((s) => s.gender === "male").length;
    const nb = sharers.filter((s) => s.gender === "non-binary").length;
    const single = sharers.filter((s) => s.relationship === "single").length;
    const ages = sharers.map((s) => s.age);
    const min = ages.length ? Math.min(...ages) : 0;
    const max = ages.length ? Math.max(...ages) : 0;
    return { f, m, nb, single, min, max };
  })();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="bg-card border-border h-[80dvh] overflow-y-auto rounded-t-[28px] p-0"
        >
          <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />
          <header className="px-5 pt-4">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.25em]">
              {title}
            </p>
            <h2 className="font-display mt-1 text-2xl font-black leading-tight">
              {sharers.length} sharer{sharers.length === 1 ? "" : "s"} confirmed
            </h2>

            {/* Mini summary */}
            <div className="bg-muted/40 mt-4 grid grid-cols-2 gap-3 rounded-2xl p-4 text-xs">
              <div className="flex items-center gap-2">
                <Users className="text-secondary h-3.5 w-3.5" />
                <span className="text-foreground/85">
                  <span className="font-semibold">{summary.f}</span>F ·{" "}
                  <span className="font-semibold">{summary.m}</span>M
                  {summary.nb > 0 && (
                    <>
                      {" "}
                      · <span className="font-semibold">{summary.nb}</span>NB
                    </>
                  )}
                </span>
              </div>
              <div className="text-foreground/85">
                Ages <span className="font-semibold">{summary.min}–{summary.max}</span>
              </div>
              <div className="text-foreground/85 col-span-2">
                <span className="font-semibold text-secondary">{summary.single}</span> single ·{" "}
                {sharers.length - summary.single} other
              </div>
            </div>
          </header>

          <div className="space-y-2 px-5 py-5">
            {sharers.map((s) => (
              <SharerRow
                key={s.id}
                sharer={s}
                onClick={() => {
                  setSelected(s);
                  setProfileOpen(true);
                }}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
      <ProfileCard sharer={selected} open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
};
