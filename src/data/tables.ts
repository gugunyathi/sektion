import { Event, Gender, Sharer } from "@/data/events";

export type TableType = "mixed" | "gender_ratio" | "lgbtq" | "couples" | "host_pays";

export type SeekingSpec = {
  /** target gender mix on the table, e.g. {female: 4, male: 4} */
  ratio?: Partial<Record<Gender, number>>;
  /** age range applicants must fall within */
  ageMin?: number;
  ageMax?: number;
  /** if set, the broadcaster covers the full bill up to this budget */
  billBudget?: number;
  /** who picks up the bill — joiners pay nothing if 'host', everyone splits if 'split' */
  payer?: "host" | "split" | "joiner";
  /** plain-text description shown on the card */
  pitch?: string;
};

export type IncludedItem = {
  id: string;
  emoji: string;
  name: string;
  category: "drink" | "food" | "mixer" | "extra";
  image?: string;
};

export type Table = {
  id: string;
  label: string;
  capacity: number;
  taken: number;
  perks: string[];
  vibe: string;
  hostedBy?: Sharer;
  tableType: TableType;
  seeking?: SeekingSpec;
  includedItems?: IncludedItem[];
};

/** Deterministically derive 3 tables from an event so the UI is stable across renders. */
export const getTablesForEvent = (event: Event): Table[] => {
  const base = Math.max(2, Math.ceil(event.totalSeats / 3));
  const sharers = event.sharers ?? [];

  // Use event id hash to vary table types per event
  const variant = event.id.charCodeAt(event.id.length - 1) % 3;

  return [
    {
      id: `${event.id}-t1`,
      label: "Table 01 · Centre Stage",
      capacity: base + 2,
      taken: Math.min(base + 1, sharers.length),
      perks: ["2 bottles included", "Bottle service", "Best view"],
      vibe: "High-energy",
      hostedBy: sharers[0],
      includedItems: [
        { id: "i1", emoji: "🥂", name: "Champagne", category: "drink" },
        { id: "i2", emoji: "🥃", name: "Whiskey", category: "drink" },
        { id: "i3", emoji: "🍹", name: "Cocktail mixer", category: "mixer" },
        { id: "i4", emoji: "🍾", name: "Bottle service", category: "drink" },
        { id: "i5", emoji: "🍱", name: "Snack platter", category: "food" },
        { id: "i6", emoji: "🫒", name: "Tapas", category: "food" },
      ],
      tableType: variant === 0 ? "gender_ratio" : "host_pays",
      seeking:
        variant === 0
          ? {
              ratio: { female: 4, male: 4 },
              ageMin: 21,
              ageMax: 32,
              payer: "split",
              pitch: "4F seeking 4M for a balanced night out.",
            }
          : {
              ratio: { male: 1 },
              ageMin: 30,
              ageMax: 45,
              billBudget: 800,
              payer: "host",
              pitch: "F20–25 seeking 1 gent (30–45) to cover the table. Budget $800.",
            },
    },
    {
      id: `${event.id}-t2`,
      label: "Table 02 · Skyline Booth",
      capacity: base,
      taken: Math.min(base - 1, Math.max(1, sharers.length - 1)),
      perks: ["Private booth", "Welcome cocktail"],
      vibe: "Curated mix",
      hostedBy: sharers[1] ?? sharers[0],
      includedItems: [
        { id: "i1", emoji: "🍸", name: "Welcome cocktail", category: "drink" },
        { id: "i2", emoji: "🧃", name: "Juice mixers", category: "mixer" },
        { id: "i3", emoji: "🍕", name: "Pizza bites", category: "food" },
        { id: "i4", emoji: "🍫", name: "Dessert board", category: "food" },
      ],
      tableType: "lgbtq",
      seeking: {
        ageMin: 21,
        ageMax: 40,
        payer: "split",
        pitch: "LGBTQ+ & allies. All genders welcome.",
      },
    },
    {
      id: `${event.id}-t3`,
      label: "Table 03 · Lounge Side",
      capacity: Math.max(2, base - 1),
      taken: 1,
      perks: ["Chill seating", "Snack platter"],
      vibe: "Conversational",
      hostedBy: sharers[2] ?? sharers[0],
      includedItems: [
        { id: "i1", emoji: "🍷", name: "House wine", category: "drink" },
        { id: "i2", emoji: "🧆", name: "Mezze platter", category: "food" },
        { id: "i3", emoji: "💧", name: "Still water", category: "mixer" },
        { id: "i4", emoji: "🍬", name: "After-dinner mints", category: "extra" },
      ],
      tableType: "couples",
      seeking: {
        ageMin: 25,
        ageMax: 45,
        payer: "split",
        pitch: "Couples only. Two pairs already in.",
      },
    },
  ];
};

export const TABLE_TYPE_META: Record<
  TableType,
  { label: string; short: string; tone: string }
> = {
  mixed: { label: "Mixed", short: "Mixed", tone: "bg-muted text-foreground/80 border-border" },
  gender_ratio: {
    label: "Gender ratio",
    short: "Ratio",
    tone: "bg-primary/15 text-primary-glow border-primary/40",
  },
  lgbtq: {
    label: "LGBTQ+ friendly",
    short: "LGBTQ+",
    tone: "bg-accent/15 text-accent border-accent/40",
  },
  couples: {
    label: "Couples only",
    short: "Couples",
    tone: "bg-[hsl(45_95%_60%/0.15)] text-[hsl(45_95%_70%)] border-[hsl(45_95%_60%/0.4)]",
  },
  host_pays: {
    label: "Host pays the bill",
    short: "Host pays",
    tone: "bg-secondary/15 text-secondary border-secondary/40",
  },
};

export const ALL_TABLE_TYPES: TableType[] = [
  "gender_ratio",
  "lgbtq",
  "couples",
  "host_pays",
];
