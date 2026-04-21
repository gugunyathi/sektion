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

export type Sharer = {
  id: string;
  name: string;
  avatar: string;
  vibe: Vibe;
  verified?: boolean;
};

export type Event = {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  category: "Club" | "Dining" | "Lounge" | "Rave" | "Themed";
  vibes: Vibe[];
  image: string;
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
  { id: "u1", name: "Zara K.", avatar: a2, vibe: "Party Animal", verified: true },
  { id: "u2", name: "Diego M.", avatar: a3, vibe: "Chill" },
  { id: "u3", name: "Niko R.", avatar: a1, vibe: "Foodie", verified: true },
  { id: "u4", name: "Mira L.", avatar: a4, vibe: "Luxe" },
];

export const EVENTS: Event[] = [
  {
    id: "e1",
    title: "Neon Saturdays",
    venue: "Club Mirage",
    city: "Berlin",
    date: "Sat 26 Apr",
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
