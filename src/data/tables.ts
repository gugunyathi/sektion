import { Event, Sharer } from "@/data/events";

export type Table = {
  id: string;
  label: string;
  capacity: number;
  taken: number;
  perks: string[];
  vibe: string;
  hostedBy?: Sharer;
};

/** Deterministically derive 3 tables from an event so the UI is stable across renders. */
export const getTablesForEvent = (event: Event): Table[] => {
  const base = Math.max(2, Math.ceil(event.totalSeats / 3));
  const sharers = event.sharers;
  return [
    {
      id: `${event.id}-t1`,
      label: "Table 01 · Centre Stage",
      capacity: base + 2,
      taken: Math.min(base + 1, sharers.length),
      perks: ["2 bottles included", "Bottle service", "Best view"],
      vibe: "High-energy",
      hostedBy: sharers[0],
    },
    {
      id: `${event.id}-t2`,
      label: "Table 02 · Skyline Booth",
      capacity: base,
      taken: Math.min(base - 1, Math.max(1, sharers.length - 1)),
      perks: ["Private booth", "Welcome cocktail"],
      vibe: "Curated mix",
      hostedBy: sharers[1] ?? sharers[0],
    },
    {
      id: `${event.id}-t3`,
      label: "Table 03 · Lounge Side",
      capacity: Math.max(2, base - 1),
      taken: 1,
      perks: ["Chill seating", "Snack platter"],
      vibe: "Conversational",
      hostedBy: sharers[2] ?? sharers[0],
    },
  ];
};
