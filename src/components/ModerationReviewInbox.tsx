import { useState } from "react";
import { MediaItem } from "@/data/events";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Flag,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FrozenItem = MediaItem & {
  eventId: string;
  eventTitle: string;
  flagCount: number;
  moderationReason?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frozenItems: FrozenItem[];
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
};

export const ModerationReviewInbox = ({
  open,
  onOpenChange,
  frozenItems,
  onApprove,
  onReject,
}: Props) => {
  const [selectedItem, setSelectedItem] = useState<FrozenItem | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const handleApprove = async () => {
    if (!selectedItem) return;
    setActionInProgress(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    onApprove(selectedItem.id);
    toast.success("Media approved and unfrozen.");
    setSelectedItem(null);
    setActionInProgress(false);
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    setActionInProgress(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    onReject(selectedItem.id);
    toast.success("Media rejected and removed.");
    setSelectedItem(null);
    setActionInProgress(false);
  };

  const pendingItems = frozenItems.filter((item) => item.status === "frozen");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-card border-border h-[92dvh] overflow-hidden rounded-t-[28px] p-0"
      >
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-muted-foreground/40" />

        {/* Header */}
        <header className="relative flex items-center justify-between px-5 pt-3">
          {selectedItem ? (
            <button
              onClick={() => setSelectedItem(null)}
              className="border-border flex h-9 w-9 items-center justify-center rounded-full border"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Moderation
            </p>
            <p className="font-display text-sm font-bold">
              {selectedItem ? "Review item" : "Frozen items"}
            </p>
          </div>
          <div className="h-9 w-9" />
        </header>

        {/* Body */}
        <div className="h-[calc(92dvh-120px)] overflow-y-auto">
          {!selectedItem ? (
            <div className="space-y-3 px-5 pt-5 pb-32">
              {pendingItems.length === 0 ? (
                <div className="flex h-96 flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                  <p className="font-display text-lg font-bold">All clear!</p>
                  <p className="mt-1 text-sm text-foreground/70">
                    No frozen items to review.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                      {pendingItems.length} item{pendingItems.length !== 1 ? "s" : ""} pending review
                    </p>
                  </div>
                  {pendingItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="w-full text-left"
                    >
                      <div className="flex gap-3 rounded-lg border border-border bg-muted/50 p-4 transition-all hover:bg-muted hover:border-foreground/20">
                        {item.kind === "video" ? (
                          <video
                            src={item.src}
                            poster={item.poster}
                            className="h-16 w-16 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <img
                            src={item.src}
                            alt={item.caption ?? "Media"}
                            className="h-16 w-16 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">
                              {item.eventTitle}
                            </span>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                              {item.kind}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-foreground/60 truncate">
                            {item.caption || "No caption"}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Flag className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                            <span className="text-xs font-semibold text-destructive">
                              {item.flagCount} report{item.flagCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6 px-5 py-8">
              {/* Media preview */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Media preview
                </label>
                <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                  {selectedItem.kind === "video" ? (
                    <video
                      src={selectedItem.src}
                      poster={selectedItem.poster}
                      controls
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={selectedItem.src}
                      alt={selectedItem.caption ?? "Media"}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Item details */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Item details
                </label>
                <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                  <div>
                    <p className="text-xs text-foreground/60 uppercase tracking-wide">
                      Event
                    </p>
                    <p className="mt-1 font-semibold">{selectedItem.eventTitle}</p>
                  </div>
                  {selectedItem.caption && (
                    <div>
                      <p className="text-xs text-foreground/60 uppercase tracking-wide">
                        Caption
                      </p>
                      <p className="mt-1 text-sm">{selectedItem.caption}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-foreground/60 uppercase tracking-wide">
                      Uploaded by
                    </p>
                    <p className="mt-1 text-sm">{selectedItem.uploadedBy || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60 uppercase tracking-wide">
                      Type
                    </p>
                    <p className="mt-1 text-sm capitalize">{selectedItem.kind}</p>
                  </div>
                </div>
              </div>

              {/* Violation reasons */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Community reports
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                  <Flag className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-destructive">
                      {selectedItem.flagCount} report{selectedItem.flagCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-destructive/80 mt-1">
                      {selectedItem.moderationReason || "Content reported by community members"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pb-8">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={actionInProgress}
                  className="flex-1 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject & remove
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={actionInProgress}
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve & unfreeze
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
