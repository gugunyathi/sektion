import { useState } from "react";
import { Table } from "@/data/tables";
import { Event } from "@/data/events";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  UserX,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Attendee = {
  id: string;
  name: string;
  seats: number;
  tableId?: string;
  status: "checked_in" | "no_show" | "pending";
  avatar: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  tables: Table[];
  attendees: Attendee[];
  onPlaceAttendee: (attendeeId: string, tableId: string) => void;
  onMarkNoShow: (attendeeId: string) => void;
  onReleaseSeats: (tableId: string, seats: number) => void;
};

export const VenueManagerPanel = ({
  open,
  onOpenChange,
  event,
  tables,
  attendees,
  onPlaceAttendee,
  onMarkNoShow,
  onReleaseSeats,
}: Props) => {
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  if (!event) return null;

  const selectedAttendee = attendees.find((a) => a.id === selectedAttendeeId);
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const noShows = attendees.filter((a) => a.status === "no_show");
  const pendingPlacement = attendees.filter(
    (a) => a.status === "pending" && !a.tableId
  );
  const checkedIn = attendees.filter((a) => a.status === "checked_in");

  const getTableOccupancy = (tableId: string) => {
    const occupants = attendees.filter(
      (a) => a.tableId === tableId && a.status === "checked_in"
    );
    const occupied = occupants.reduce((sum, a) => sum + a.seats, 0);
    const table = tables.find((t) => t.id === tableId);
    return { occupied, capacity: table?.capacity ?? 0 };
  };

  const handlePlaceAttendee = () => {
    if (!selectedAttendee || !selectedTable) return;

    const { occupied, capacity } = getTableOccupancy(selectedTableId!);
    if (occupied + selectedAttendee.seats > capacity) {
      toast.error("Not enough seats at this table");
      return;
    }

    onPlaceAttendee(selectedAttendeeId!, selectedTableId!);
    toast.success(`${selectedAttendee.name} placed at ${selectedTable.label}`);
    setSelectedAttendeeId(null);
    setSelectedTableId(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-card border-border h-[92dvh] overflow-hidden rounded-t-[28px] p-0"
      >
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-muted-foreground/40" />

        {/* Header */}
        <header className="relative flex items-center justify-between px-5 pt-3">
          {selectedAttendeeId && (
            <button
              onClick={() => setSelectedAttendeeId(null)}
              className="border-border flex h-9 w-9 items-center justify-center rounded-full border"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {!selectedAttendeeId && <div className="h-9 w-9" />}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Venue Manager
            </p>
            <p className="font-display text-sm font-bold">{event.title}</p>
          </div>
          <div className="h-9 w-9" />
        </header>

        {/* Body */}
        <div className="h-[calc(92dvh-120px)] overflow-y-auto">
          {!selectedAttendeeId ? (
            <div className="space-y-4 px-5 py-5 pb-32">
              {/* Overview stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold text-secondary">
                    {checkedIn.length}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1 uppercase tracking-wide">
                    Checked in
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-500">
                    {pendingPlacement.length}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1 uppercase tracking-wide">
                    Pending
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {noShows.length}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1 uppercase tracking-wide">
                    No-shows
                  </p>
                </div>
              </div>

              {/* Pending placement */}
              {pendingPlacement.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Need placement ({pendingPlacement.length})
                  </label>
                  <div className="space-y-2">
                    {pendingPlacement.map((attendee) => (
                      <button
                        key={attendee.id}
                        onClick={() => setSelectedAttendeeId(attendee.id)}
                        className="flex w-full items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-left transition-all hover:bg-yellow-500/10"
                      >
                        <img
                          src={attendee.avatar}
                          alt={attendee.name}
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{attendee.name}</p>
                          <p className="text-xs text-foreground/60">
                            {attendee.seats} seat{attendee.seats !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tables status */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Table status
                </label>
                <div className="space-y-2">
                  {tables.map((table) => {
                    const { occupied, capacity } = getTableOccupancy(table.id);
                    const available = capacity - occupied;
                    return (
                      <div
                        key={table.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{table.label}</p>
                          <p className="text-xs text-foreground/60 mt-1">
                            {occupied}/{capacity} seats
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-secondary transition-all"
                              style={{
                                width: `${(occupied / capacity) * 100}%`,
                              }}
                            />
                          </div>
                          {available > 0 && (
                            <span className="text-xs font-semibold text-secondary">
                              +{available}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* No-shows */}
              {noShows.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    No-shows ({noShows.length})
                  </label>
                  <div className="space-y-2">
                    {noShows.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                      >
                        <img
                          src={attendee.avatar}
                          alt={attendee.name}
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0 opacity-50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{attendee.name}</p>
                          <p className="text-xs text-foreground/60">
                            {attendee.seats} seat{attendee.seats !== 1 ? "s" : ""} released
                          </p>
                        </div>
                        <UserX className="h-4 w-4 text-destructive flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Placement modal */
            <div className="space-y-6 px-5 py-8">
              {selectedAttendee && (
                <>
                  {/* Attendee info */}
                  <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/50 p-4">
                    <img
                      src={selectedAttendee.avatar}
                      alt={selectedAttendee.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-display font-bold text-lg">
                        {selectedAttendee.name}
                      </p>
                      <p className="text-sm text-foreground/70 mt-1">
                        {selectedAttendee.seats} seat{selectedAttendee.seats !== 1 ? "s" : ""} needed
                      </p>
                    </div>
                  </div>

                  {/* Available tables */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Available tables
                    </label>
                    <div className="space-y-2">
                      {tables.map((table) => {
                        const { occupied, capacity } = getTableOccupancy(
                          table.id
                        );
                        const available = capacity - occupied;
                        const canFit =
                          available >= selectedAttendee.seats;
                        const selected =
                          selectedTableId === table.id;

                        return (
                          <button
                            key={table.id}
                            onClick={() => setSelectedTableId(table.id)}
                            disabled={!canFit}
                            className={cn(
                              "w-full text-left rounded-lg border p-4 transition-all",
                              selected
                                ? "border-primary bg-primary/10"
                                : canFit
                                  ? "border-border bg-muted/50 hover:border-primary/40"
                                  : "border-destructive/30 bg-destructive/5 cursor-not-allowed opacity-50",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">
                                  {table.label}
                                </p>
                                <p className="text-xs text-foreground/60 mt-1">
                                  {occupied}/{capacity} seats · +
                                  {available} available
                                </p>
                              </div>
                              {selected && (
                                <div className="bg-primary text-primary-foreground rounded-full p-1">
                                  <Plus className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="mt-3 w-full h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-secondary"
                                style={{
                                  width: `${(occupied / capacity) * 100}%`,
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pb-8">
                    <Button
                      variant="outline"
                      onClick={() => {
                        onMarkNoShow(selectedAttendeeId);
                        toast.success(
                          `${selectedAttendee.name} marked as no-show. ${selectedAttendee.seats} seat${selectedAttendee.seats !== 1 ? "s" : ""} released.`
                        );
                        setSelectedAttendeeId(null);
                      }}
                      className="flex-1 text-destructive hover:bg-destructive/10"
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Mark no-show
                    </Button>
                    {selectedTableId && (
                      <Button
                        onClick={handlePlaceAttendee}
                        className="flex-1"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Place at table
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
