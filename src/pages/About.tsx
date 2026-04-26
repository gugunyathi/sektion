import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Sparkles, Users } from "lucide-react";
import club from "@/assets/event-club.jpg";
import dining from "@/assets/event-dining.jpg";
import lounge from "@/assets/event-lounge.jpg";
import themed from "@/assets/event-themed.jpg";

const GALLERY = [
  {
    title: "VIP sections in clubs",
    src: club,
  },
  {
    title: "Dinner table settings",
    src: dining,
  },
  {
    title: "Sports stadium VIP box suites",
    src: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Private lounge access",
    src: lounge,
  },
  {
    title: "Executive hospitality experiences",
    src: themed,
  },
];

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background px-4 pb-20 pt-4">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5">
        <div className="bg-gradient-vibe absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-35 blur-3xl" />
        <div className="bg-gradient-primary absolute -bottom-10 -right-10 h-40 w-40 rounded-full opacity-20 blur-3xl" />

        <div className="relative z-10 mb-4 flex items-center gap-3">
          <Link to="/" className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sektion</p>
            <h1 className="font-display text-2xl font-black">Welcome to Sektion</h1>
          </div>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-accent">Luxury Real Estate & Experiences</p>
          <p className="mt-2 text-sm text-foreground/90">
            Sektion redefines access to the world&apos;s most coveted spaces - from corporate booths at stadiums,
            to VIP lounges in nightclubs, to the most sought-after dining tables in elite restaurants.
            We enable short- to long-term tenancy for limited time slots, giving you the chance to step into
            luxury like never before.
          </p>
        </div>
      </div>

      <section className="mt-5 space-y-3">
        <div className="glass rounded-2xl border border-border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Users className="h-4 w-4 text-accent" />
            For Tenants
          </div>
          <p className="text-sm text-muted-foreground">
            Sektion empowers everyday people to sit at the table with society&apos;s most exclusive members -
            influencers, celebrities, athletes, politicians, technocrats, and even oligarchs. For a limited
            time and at a premium, you gain entry into circles that were once untouchable.
          </p>
        </div>

        <div className="glass rounded-2xl border border-border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Building2 className="h-4 w-4 text-blue-400" />
            For Landlords
          </div>
          <p className="text-sm text-muted-foreground">
            Sektion connects you directly to game changers, fresh ideas, and the heartbeat of culture.
            Your spaces become gateways to influence, innovation, and opportunity.
          </p>
        </div>

        <div className="glass rounded-2xl border border-border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Sparkles className="h-4 w-4 text-amber-400" />
            The New Way to Connect
          </div>
          <p className="text-sm text-muted-foreground">
            In a world overwhelmed by AI and virtual noise, Sektion offers something real: authentic interaction
            with influential people, products, and experiences that were previously closed off. It&apos;s access,
            intimacy, and impact - all for a limited time, at a premium.
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider">Experience Gallery</h2>
        <div className="grid grid-cols-2 gap-2">
          {GALLERY.map((item) => (
            <figure key={item.title} className="group relative overflow-hidden rounded-2xl border border-white/10">
              <img
                src={item.src}
                alt={item.title}
                className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pb-2 pt-5 text-[11px] font-semibold text-white">
                {item.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 p-4">
        <h2 className="font-display text-xl font-black">Book Your Sektion</h2>
        <p className="mt-1 text-sm text-foreground/90">
          Secure your place at the most exclusive venues today. Change your perspective, change your network,
          change your life.
        </p>
        <Link
          to="/"
          className="bg-gradient-primary text-primary-foreground mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-black"
        >
          Explore Sektion
        </Link>
      </section>
    </main>
  );
};

export default About;