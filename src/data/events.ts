import club from "@/assets/event-club.jpg";
import dining from "@/assets/event-dining.jpg";
import rave from "@/assets/event-rave.jpg";
import lounge from "@/assets/event-lounge.jpg";
import themed from "@/assets/event-themed.jpg";
import a1 from "@/assets/avatar-1.jpg";
import a2 from "@/assets/avatar-2.jpg";
import a3 from "@/assets/avatar-3.jpg";
import a4 from "@/assets/avatar-4.jpg";

export type Vibe = "Party Animal" | "Foodie" | "Chill" | "Luxe" | "Themed";

export type Gender = "female" | "male" | "non-binary";
export type Relationship = "single" | "couple" | "taken" | "open";

export type Sharer = {
  id: string;
  name: string;
  avatar: string;
  vibe: Vibe;
  verified?: boolean;
  age: number;
  gender: Gender;
  relationship: Relationship;
  bio?: string;
};

export type MediaKind = "video" | "image";
export type ModerationStatus = "approved" | "pending" | "frozen";

export type MediaItem = {
  id: string;
  kind: MediaKind;
  src: string;
  poster?: string;
  caption?: string;
  uploadedBy?: string;
  status: ModerationStatus;
  flags: number;
};

export type Event = {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  /** ISO date string YYYY-MM-DD for filtering */
  dateISO: string;
  time: string;
  category: "Club" | "Dining" | "Lounge" | "Rave" | "Themed";
  vibes: Vibe[];
  image: string;
  media?: MediaItem[];
  pricePerSeat: number;
  seatsLeft: number;
  totalSeats: number;
  hostNote: string;
  sharers: Sharer[];
  trending?: boolean;
  surge?: boolean;
};

export const ALL_VIBES: Vibe[] = ["Party Animal", "Foodie", "Chill", "Luxe", "Themed"];

export const SHARERS: Sharer[] = [
  {
    id: "u1",
    name: "Zara K.",
    avatar: a2,
    vibe: "Party Animal",
    verified: true,
    age: 24,
    gender: "female",
    relationship: "single",
    bio: "Berlin techno, mezcal, and bad decisions in good company.",
  },
  {
    id: "u2",
    name: "Diego M.",
    avatar: a3,
    vibe: "Chill",
    age: 29,
    gender: "male",
    relationship: "open",
    bio: "Slow dinners, vinyl, and rooftops at 2am.",
  },
  {
    id: "u3",
    name: "Niko R.",
    avatar: a1,
    vibe: "Foodie",
    verified: true,
    age: 33,
    gender: "non-binary",
    relationship: "single",
    bio: "Foodie by day, party legend by night. Negroni enthusiast.",
  },
  {
    id: "u4",
    name: "Mira L.",
    avatar: a4,
    vibe: "Luxe",
    age: 27,
    gender: "female",
    relationship: "couple",
    bio: "Champagne, masquerades, and ice-cold martinis.",
  },
];

// System-uploaded event videos (served from /public)
const BIRTHDAY = "/birthday.mp4";   // Neon Saturdays
const SKYLINE  = "/skyline.mp4";    // Skyline Supper
const CLUB     = "/club.mp4";       // Subterra: Techno Night
const VELVET   = "/velvet.mp4";     // The Velvet Hour
const CABARET  = "/cabaret.mp4";    // Masquerade Affair

const mkMedia = (
  eventId: string,
  primary: string,
  alt: string,
  v1: string,
): MediaItem[] => [
  // Primary system video — always approved, plays immediately
  { id: `${eventId}-m1`, kind: "video", src: v1, poster: primary, caption: "Event highlight", uploadedBy: "system", status: "approved", flags: 0 },
  // Fallback image slides
  { id: `${eventId}-m2`, kind: "image", src: primary, caption: "Table setting", uploadedBy: "host", status: "approved", flags: 0 },
  { id: `${eventId}-m3`, kind: "image", src: alt, caption: "Venue atmosphere", uploadedBy: "host", status: "approved", flags: 0 },
];

export const EVENTS: Event[] = [
  {
    id: "e1",
    title: "Neon Saturdays",
    venue: "Club Mirage",
    city: "Berlin",
    date: "Sat 26 Apr",
    dateISO: "2026-04-26",
    time: "23:00",
    category: "Club",
    vibes: ["Party Animal", "Luxe"],
    image: club,
    pricePerSeat: 85,
    seatsLeft: 3,
    totalSeats: 8,
    hostNote: "VIP table, two bottles included. Dress to impress.",
    sharers: [SHARERS[0], SHARERS[1], SHARERS[2], SHARERS[3]],
    trending: true,
    surge: true,
  },
  {
    id: "e2",
    title: "Skyline Supper",
    venue: "Aurora Rooftop",
    city: "Tokyo",
    date: "Fri 25 Apr",
    dateISO: "2026-04-25",
    time: "20:30",
    category: "Dining",
    vibes: ["Foodie", "Luxe"],
    image: dining,
    pricePerSeat: 120,
    seatsLeft: 5,
    totalSeats: 10,
    hostNote: "7-course tasting menu by chef Aiko. Wine pairing available.",
    sharers: [SHARERS[2], SHARERS[3], SHARERS[0]],
  },
  {
    id: "e3",
    title: "Subterra: Techno Night",
    venue: "Bunker 9",
    city: "London",
    date: "Sat 26 Apr",
    dateISO: "2026-04-26",
    time: "00:00",
    category: "Rave",
    vibes: ["Party Animal"],
    image: rave,
    pricePerSeat: 45,
    seatsLeft: 6,
    totalSeats: 12,
    hostNote: "Until sunrise. Resident DJs + special guest.",
    sharers: [SHARERS[1], SHARERS[0]],
    trending: true,
  },
  {
    id: "e4",
    title: "The Velvet Hour",
    venue: "Emerald Speakeasy",
    city: "New York",
    date: "Thu 24 Apr",
    dateISO: "2026-04-24",
    time: "21:00",
    category: "Lounge",
    vibes: ["Chill", "Luxe"],
    image: lounge,
    pricePerSeat: 60,
    seatsLeft: 2,
    totalSeats: 6,
    hostNote: "Bespoke cocktails, low light, vinyl only.",
    sharers: [SHARERS[3], SHARERS[2]],
  },
  {
    id: "e5",
    title: "Masquerade Affair",
    venue: "Palais Rose",
    city: "Paris",
    date: "Sat 26 Apr",
    dateISO: "2026-04-26",
    time: "22:00",
    category: "Themed",
    vibes: ["Themed", "Party Animal"],
    image: themed,
    pricePerSeat: 95,
    seatsLeft: 4,
    totalSeats: 8,
    hostNote: "Masks provided. Champagne tower at midnight.",
    sharers: [SHARERS[0], SHARERS[3], SHARERS[1]],
    trending: true,
  },
];

// Attach media to each event: 1 approved system video + 2 approved image slides
const MEDIA_ASSIGN: Record<string, [string]> = {
  e1: [BIRTHDAY],
  e2: [SKYLINE],
  e3: [CLUB],
  e4: [VELVET],
  e5: [CABARET],
};
const ALT_IMAGE: Record<string, string> = {
  e1: rave, e2: lounge, e3: club, e4: themed, e5: dining,
};
EVENTS.forEach((e) => {
  const [v1] = MEDIA_ASSIGN[e.id] ?? [V3];
  e.media = mkMedia(e.id, e.image, ALT_IMAGE[e.id] ?? e.image, v1);
});
